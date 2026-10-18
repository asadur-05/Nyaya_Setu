import { config } from '../utils/config.js';
import { logger } from '../utils/logger.js';
import { defaultKbService } from './knowledgeBaseService.js';
import { isEmergencyMessage, getEmergencyResponse } from './safetyService.js';
import { retrieveEntries } from './retrievalService.js';
import { callGemini, generateDeterministicStubResponse } from './geminiService.js';
import { verifyClaimsAgainstSources } from '../utils/claimCheck.js';

const SAFETY_DISCLAIMERS = {
  en: "General legal information only; not a substitute for a qualified lawyer or official government authority.",
  hi: "केवल सामान्य कानूनी जानकारी; यह किसी योग्य अधिवक्ता या आधिकारिक सरकारी प्राधिकारी का विकल्प नहीं है।"
};

function checkStaleness(usedEntries = [], modelAmbiguity = false, language = 'en') {
  const now = new Date();
  let isStale = false;
  let reason = '';

  for (const entry of usedEntries) {
    const verifiedDate = new Date(entry.lastVerified + 'T00:00:00Z');
    const ageDays = Math.floor((now - verifiedDate) / (1000 * 60 * 60 * 24));
    const maxDays = entry.volatile ? (config.staleAfterDays / 2) : config.staleAfterDays;

    if (ageDays > maxDays) {
      isStale = true;
      reason = language === 'hi'
        ? `स्रोत "${entry.title}" का सत्यापन ${ageDays} दिन पहले हुआ था (${entry.volatile ? 'परिवर्तनशील कानूनी क्षेत्र' : 'नियमित समीक्षा अवधि पार'})।`
        : `Source "${entry.title}" was last verified ${ageDays} days ago (${entry.volatile ? 'transitional legal area' : 'exceeded review window'}).`;
      break;
    }
  }

  if (modelAmbiguity) {
    isStale = true;
    reason = language === 'hi'
      ? "सत्यापित स्रोतों के बीच संभावित अस्पष्टता या कानूनी बदलाव की संभावना पाई गई।"
      : "Potential ambiguity or transition detected across verified legal provisions.";
  }

  if (!isStale) return null;

  return language === 'hi'
    ? `चेतावनी: यह कानूनी जानकारी पुरानी अथवा संक्रमणकालीन हो सकती है (${reason})। कृपया आधिकारिक सरकारी पोर्टल अथवा निकटतम विधिक सेवा प्राधिकरण (DLSA) से वर्तमान स्थिति की पुष्टि अवश्य करें।`
    : `Notice: This legal information may be outdated or undergoing legal transition (${reason}). Please verify the current status on the official government portal or via your District Legal Services Authority.`;
}

function buildServerReferral(kbService, language = 'en') {
  const legalAidEntry = kbService.getLegalAidReferralEntry();
  if (!legalAidEntry) return null;

  return {
    name: legalAidEntry.title,
    url: legalAidEntry.sourceUrl,
    reason: language === 'hi'
      ? "विधिक प्रतिनिधित्व, वकील की निःशुल्क सेवा अथवा अदालत में कार्यवाही के लिए राष्ट्रीय या जिला विधिक सेवा प्राधिकरण (NALSA/DLSA) से संपर्क करें।"
      : "For professional legal representation, court proceedings, or assigning an advocate at state expense, consult the Legal Services Authority."
  };
}

function buildSourcesList(validatedIds, activeEntries) {
  const result = [];
  for (const id of validatedIds) {
    const entry = activeEntries.find(e => e.id === id);
    if (entry) {
      // Excerpt strictly taken from stored content
      const excerpt = entry.content.length > 220 
        ? entry.content.slice(0, 217) + '...'
        : entry.content;

      result.push({
        id: entry.id,
        title: entry.title,
        url: entry.sourceUrl,
        excerpt,
        sourceName: entry.sourceName,
        lastVerified: entry.lastVerified,
        version: entry.version
      });
    }
  }
  return result;
}

/**
 * Executes the complete RAG pipeline for an incoming user query.
 */
export async function processChat({
  message,
  language = 'en',
  history = [],
  kbService = defaultKbService,
  forceStubMode = false
}) {
  const startTime = Date.now();
  const kbInfo = kbService.getVersionInfo();
  const kbVersion = kbInfo.knowledgeBaseVersion;

  // 1. Check for immediate emergency/danger
  if (isEmergencyMessage(message)) {
    logger.info({
      route: '/api/chat',
      status: 200,
      latencyMs: Date.now() - startTime,
      mode: 'emergency',
      emergency: true,
      knowledgeBaseVersion: kbVersion
    });
    return getEmergencyResponse(language, kbVersion);
  }

  // 2. Retrieve candidates
  const activeEntries = kbService.getActiveEntries();
  const retrieval = retrieveEntries(message, history, activeEntries);
  const { candidates, provisionalEvidenceLevel, outOfScope } = retrieval;

  const referral = buildServerReferral(kbService, language);

  // 3. Handle No Evidence or Out of Scope
  if (outOfScope || provisionalEvidenceLevel === 'none' || candidates.length === 0) {
    const isVague = message.trim().split(/\s+/).length <= 2;
    const mode = isVague ? 'clarification' : 'no-evidence';

    let answerText;
    if (outOfScope) {
      answerText = language === 'hi'
        ? "यह प्रश्न भारत के अधिकार क्षेत्र से बाहर अथवा वर्तमान सत्यापित ज्ञानकोष के दायरे से बाहर है। NyayaSetu_AI केवल भारत के सत्यापित कानूनों पर आधारित जानकारी प्रदान करता है।"
        : "This question concerns a jurisdiction outside India or a topic outside our verified knowledge base. NyayaSetu_AI provides guidance exclusively for Indian legal procedures.";
    } else if (isVague) {
      answerText = language === 'hi'
        ? "आपका प्रश्न बहुत संक्षिप्त है। कृपया अपनी स्थिति के बारे में थोड़ा और विस्तार से बताएं (जैसे: क्या मामला घरेलू विवाद, कार्यस्थल, या पुलिस शिकायत से संबंधित है?)।"
        : "Your query is very brief. Could you provide a bit more context about your situation (for example: does this relate to domestic disputes, workplace harassment, or filing a police complaint?)?";
    } else {
      answerText = language === 'hi'
        ? "वर्तमान ज्ञानकोष में इस विशिष्ट विषय से संबंधित सत्यापित आधिकारिक कानूनी दस्तावेज उपलब्ध नहीं हैं। गलत जानकारी देने से बचने के लिए हम इस पर अनुमानित उत्तर नहीं दे सकते।"
        : "Current verified sources in our knowledge base do not contain reliable information for this query. To prevent misinformation, we cannot offer unverified guidance.";
    }

    logger.info({
      route: '/api/chat',
      status: 200,
      latencyMs: Date.now() - startTime,
      mode,
      emergency: false,
      knowledgeBaseVersion: kbVersion
    });

    return {
      ok: true,
      answer: answerText,
      steps: [],
      language,
      sources: [],
      evidenceLevel: "none",
      needsClarification: isVague,
      followUpQuestions: isVague ? [
        language === 'hi' ? "क्या आपको पुलिस में शिकायत दर्ज कराने से जुड़ी जानकारी चाहिए?" : "Do you need guidance on registering a police complaint?",
        language === 'hi' ? "क्या आपको मुफ्त कानूनी सहायता (NALSA) के बारे में जानना है?" : "Would you like information on free legal aid via NALSA?"
      ] : [],
      limitations: language === 'hi'
        ? "सत्यापित स्रोतों के अभाव में कोई कानूनी प्रक्रिया उद्धृत नहीं की गई।"
        : "No legal procedures are cited due to absence of verified sources on this specific query.",
      outdatedWarning: null,
      referral,
      emergency: false,
      mode,
      knowledgeBaseVersion: kbVersion,
      safetyNotice: SAFETY_DISCLAIMERS[language]
    };
  }

  // 4. Determine if we must use Demo/Fallback or Live Gemini
  const useDemoFallback = config.demoMode && !forceStubMode;

  let modelResult = null;
  let usedMode = 'gemini';

  if (!useDemoFallback) {
    try {
      modelResult = await callGemini({
        userMessage: message,
        language,
        history,
        retrievedPassages: candidates,
        stubMode: forceStubMode
      });
    } catch (err) {
      logger.warn(`Gemini generation failed: ${err.message}. Falling back to deterministic source summary.`);
      usedMode = 'fallback';
    }
  } else {
    usedMode = 'fallback';
  }

  // If Gemini failed or demo mode is active, construct safe fallback
  if (!modelResult || usedMode === 'fallback') {
    const topEntry = candidates[0];
    const topIds = candidates.map(c => c.id);
    const validatedSources = buildSourcesList(topIds, activeEntries);
    const outdatedWarning = checkStaleness(candidates, false, language);

    const fallbackAnswer = language === 'hi'
      ? `सत्यापित आधिकारिक कानूनी स्रोत के अनुसार (${topEntry.title}):\n\n${topEntry.content}\n\n(नोट: लाइव एआई सारांश इस समय अनुपलब्ध या डेमो मोड में है; ऊपर दी गई जानकारी सीधे सत्यापित सरकारी स्रोत से है।)`
      : `According to verified official legal sources (${topEntry.title}):\n\n${topEntry.content}\n\n(Note: Live AI summary is currently in demo or fallback mode; the passage above is taken directly from the verified official source.)`;

    const fallbackSteps = candidates.slice(0, 2).map((c, i) => ({
      text: language === 'hi' ? `सत्यापित प्रावधान: ${c.title}` : `Verified provision: ${c.title}`,
      sourceIds: [c.id]
    }));

    logger.info({
      route: '/api/chat',
      status: 200,
      latencyMs: Date.now() - startTime,
      mode: 'fallback',
      emergency: false,
      knowledgeBaseVersion: kbVersion
    });

    return {
      ok: true,
      answer: fallbackAnswer,
      steps: fallbackSteps,
      language,
      sources: validatedSources,
      evidenceLevel: provisionalEvidenceLevel,
      needsClarification: false,
      followUpQuestions: [
        language === 'hi' ? "क्या आपको इस प्रक्रिया के लिए जरूरी दस्तावेजों की सूची चाहिए?" : "Would you like a checklist of documents needed for this procedure?"
      ],
      limitations: language === 'hi'
        ? "डेमो/फ़ॉलबैक मोड: सामग्री सीधे सत्यापित स्रोतों से उद्धृत है।"
        : "Demo/fallback mode: content is directly quoted from verified legal sources without AI synthesis.",
      outdatedWarning,
      referral,
      emergency: false,
      mode: 'fallback',
      knowledgeBaseVersion: kbVersion,
      safetyNotice: SAFETY_DISCLAIMERS[language]
    };
  }

  // 5. Validate model output
  // Filter model's usedSourceIds to only those present in retrieved candidates
  const validRetrievedIds = new Set(candidates.map(c => c.id));
  const filteredSourceIds = (modelResult.usedSourceIds || []).filter(id => validRetrievedIds.has(id));

  // If no valid source ID remains or model returned none
  if (filteredSourceIds.length === 0 || modelResult.evidenceLevel === 'none') {
    logger.info({
      route: '/api/chat',
      status: 200,
      latencyMs: Date.now() - startTime,
      mode: 'no-evidence',
      emergency: false,
      knowledgeBaseVersion: kbVersion
    });

    return {
      ok: true,
      answer: modelResult.summary || (language === 'hi'
        ? "उपलब्ध सत्यापित स्रोतों में इस प्रश्न का पर्याप्त आधार नहीं मिला।"
        : "The verified sources do not contain sufficient evidence to answer this query."),
      steps: [],
      language,
      sources: [],
      evidenceLevel: "none",
      needsClarification: Boolean(modelResult.needsClarification),
      followUpQuestions: modelResult.followUpQuestions || [],
      limitations: modelResult.limitations || "No verified evidence available.",
      outdatedWarning: null,
      referral,
      emergency: false,
      mode: 'no-evidence',
      knowledgeBaseVersion: kbVersion,
      safetyNotice: SAFETY_DISCLAIMERS[language]
    };
  }

  // 6. Run unsupported claim check
  const fullGeneratedText = `${modelResult.summary} ${modelResult.steps?.map(s => s.text).join(' ')}`;
  const claimCheck = verifyClaimsAgainstSources(fullGeneratedText, candidates);

  let finalAnswer = modelResult.summary;
  let finalSteps = (modelResult.steps || []).map(step => ({
    text: step.text,
    sourceIds: (step.sourceIds || []).filter(id => validRetrievedIds.has(id))
  }));

  if (!claimCheck.valid) {
    logger.warn(`Unsupported claims detected: ${claimCheck.unsupportedClaims.join(', ')}. Applying safety fallback.`);
    // If unsupported claims (numbers/sections/urls not in sources) were made, replace with safe grounded response
    const topEntry = candidates[0];
    finalAnswer = language === 'hi'
      ? `सत्यापित स्रोतों के अनुसार: ${topEntry.content}`
      : `According to verified legal passages: ${topEntry.content}`;
    finalSteps = [
      {
        text: language === 'hi' ? `आधिकारिक प्रावधान: ${topEntry.title}` : `Verified provision: ${topEntry.title}`,
        sourceIds: [topEntry.id]
      }
    ];
  }

  const validatedSources = buildSourcesList(filteredSourceIds, activeEntries);
  const usedEntries = candidates.filter(c => filteredSourceIds.includes(c.id));
  const outdatedWarning = checkStaleness(usedEntries, modelResult.ambiguityOrConflict, language);

  logger.info({
    route: '/api/chat',
    status: 200,
    latencyMs: Date.now() - startTime,
    mode: 'gemini',
    emergency: false,
    knowledgeBaseVersion: kbVersion
  });

  return {
    ok: true,
    answer: finalAnswer,
    steps: finalSteps,
    language,
    sources: validatedSources,
    evidenceLevel: modelResult.evidenceLevel || provisionalEvidenceLevel,
    needsClarification: Boolean(modelResult.needsClarification),
    followUpQuestions: modelResult.followUpQuestions || [],
    limitations: modelResult.limitations || null,
    outdatedWarning,
    referral,
    emergency: false,
    mode: 'gemini',
    knowledgeBaseVersion: kbVersion,
    safetyNotice: SAFETY_DISCLAIMERS[language]
  };
}
