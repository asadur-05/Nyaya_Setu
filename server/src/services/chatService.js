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
 * Builds real, topic-specific actionable step-by-step guidance
 * from the top retrieved KB candidates — used in demo/fallback mode
 * instead of the useless "Verified provision: title" placeholders.
 */
function buildActionableSteps(candidates, language = 'en') {
  const steps = [];
  const topEntry = candidates[0];
  if (!topEntry) return steps;

  const en = (text, sourceIds) => ({ text, sourceIds });
  const hi = (text, sourceIds) => ({ text, sourceIds });
  const step = (enText, hiText, sourceIds) => ({
    text: language === 'hi' ? hiText : enText,
    sourceIds
  });

  // Topic-specific step sets keyed by KB entry ID
  const STEP_PLANS = {

    'bnss-fir-registration': [
      step(
        'Step 1 — Stay Safe First: If you are in immediate danger, call 112 (police/ambulance) right now before filing any complaint.',
        'चरण 1 — पहले सुरक्षित रहें: अगर आप तुरंत खतरे में हैं, तो शिकायत दर्ज करने से पहले अभी 112 (पुलिस/एंबुलेंस) पर कॉल करें।',
        ['erss-112-emergency', 'bnss-fir-registration']
      ),
      step(
        'Step 2 — Visit any Police Station: Under Section 173 of BNSS 2023, you can file a "Zero FIR" at ANY police station regardless of where the incident occurred. The police CANNOT refuse to register your complaint.',
        'चरण 2 — किसी भी पुलिस थाने जाएं: BNSS 2023 की धारा 173 के तहत, आप घटना स्थान की परवाह किए बिना किसी भी पुलिस थाने में "जीरो FIR" दर्ज कर सकते हैं। पुलिस आपकी शिकायत दर्ज करने से मना नहीं कर सकती।',
        ['bnss-fir-registration']
      ),
      step(
        'Step 3 — Dictate or Write Your Complaint: Tell the officer exactly what happened — include dates, times, location, name of accused if known, and witnesses. The officer must write it down and read it back to you before you sign.',
        'चरण 3 — शिकायत बोलें या लिखें: अधिकारी को बताएं कि क्या हुआ — तारीख, समय, स्थान, आरोपी का नाम (यदि पता हो) और गवाहों की जानकारी दें। अधिकारी को इसे लिखना और हस्ताक्षर से पहले आपको पढ़कर सुनाना होगा।',
        ['bnss-fir-registration']
      ),
      step(
        'Step 4 — Collect Your Free FIR Copy: Under Section 173 BNSS, you are entitled to receive a free copy of the FIR immediately. Keep it safely — it is your proof that the complaint was registered.',
        'चरण 4 — मुफ्त FIR कॉपी लें: धारा 173 BNSS के तहत, आपको तुरंत मुफ्त में FIR की प्रति पाने का अधिकार है। इसे सुरक्षित रखें — यह आपका प्रमाण है कि शिकायत दर्ज हुई।',
        ['bnss-fir-registration']
      ),
      step(
        'Step 5 — If Police Refuse: If any police station refuses to register your FIR, go directly to the SP/DSP office of the district, or send your complaint by post to the Superintendent of Police. You can also file an e-FIR on your state police website.',
        'चरण 5 — अगर पुलिस मना करे: अगर कोई थाना FIR दर्ज करने से मना करता है, तो सीधे जिले के SP/DSP कार्यालय जाएं, या पुलिस अधीक्षक को डाक से शिकायत भेजें। आप अपने राज्य के पुलिस वेबसाइट पर ई-FIR भी दर्ज कर सकते हैं।',
        ['bnss-fir-registration']
      ),
      step(
        'Step 6 — WHERE TO COMPLAIN: (a) Nearest Police Station — Zero FIR. (b) SP/DSP Office of your district. (c) State Police Website — e-FIR portal. (d) Call 112 for emergency assistance. (e) Call 15100 for free legal aid (NALSA) if needed.',
        'चरण 6 — कहाँ शिकायत करें: (a) नजदीकी पुलिस थाना — जीरो FIR। (b) अपने जिले का SP/DSP कार्यालय। (c) राज्य पुलिस वेबसाइट — ई-FIR पोर्टल। (d) आपातकालीन सहायता के लिए 112 पर कॉल करें। (e) मुफ्त कानूनी सहायता के लिए 15100 (NALSA) पर कॉल करें।',
        ['bnss-fir-registration', 'nalsa-free-legal-aid', 'erss-112-emergency']
      ),
    ],

    'pwdva-domestic-violence-relief': [
      step(
        'Step 1 — Ensure Immediate Safety: Call 112 (emergency police) or 181 (Women Helpline) immediately if you are in danger or have been physically harmed.',
        'चरण 1 — तुरंत सुरक्षा सुनिश्चित करें: अगर आप खतरे में हैं या शारीरिक नुकसान हुआ है तो तुरंत 112 (पुलिस) या 181 (महिला हेल्पलाइन) पर कॉल करें।',
        ['erss-112-emergency', 'whl-181-women-helpline']
      ),
      step(
        'Step 2 — Get Medical Help if Harmed: Visit the nearest government hospital or One Stop Centre (OSC) for medical examination and treatment. Obtain a Medical Certificate — this is critical evidence for your complaint.',
        'चरण 2 — यदि चोट लगी हो तो चिकित्सीय सहायता लें: निकटतम सरकारी अस्पताल या वन स्टॉप सेंटर (OSC) जाएं। मेडिकल सर्टिफिकेट अवश्य लें — यह आपकी शिकायत के लिए महत्वपूर्ण सबूत है।',
        ['pwdva-domestic-violence-relief']
      ),
      step(
        'Step 3 — Contact a Protection Officer: Every district has a government-appointed Protection Officer (PO) who will help you file an application to the Magistrate under Section 12 of PWDVA — completely FREE of cost.',
        'चरण 3 — संरक्षण अधिकारी से संपर्क करें: हर जिले में एक सरकारी संरक्षण अधिकारी (PO) होता है जो PWDVA की धारा 12 के तहत मजिस्ट्रेट के सामने आवेदन दाखिल करने में मदद करेगा — पूरी तरह मुफ्त।',
        ['pwdva-domestic-violence-relief']
      ),
      step(
        'Step 4 — Apply for a Protection Order (Section 18): You can get a court order prohibiting the abuser from committing further violence, contacting you, or entering your home. File the application through the Protection Officer or directly at the Judicial Magistrate\'s court.',
        'चरण 4 — संरक्षण आदेश के लिए आवेदन करें (धारा 18): आप एक न्यायालय आदेश प्राप्त कर सकते हैं जो अपराधी को और हिंसा करने, आपसे संपर्क करने या आपके घर में प्रवेश करने से रोकता है। संरक्षण अधिकारी के माध्यम से या सीधे न्यायिक मजिस्ट्रेट की अदालत में आवेदन करें।',
        ['pwdva-domestic-violence-relief']
      ),
      step(
        'Step 5 — Also File an FIR at Police Station: Under BNSS Section 173, file a police complaint (FIR) simultaneously. Domestic violence is a cognizable offence and police must act.',
        'चरण 5 — पुलिस थाने में FIR भी दर्ज करें: BNSS धारा 173 के तहत, एक साथ पुलिस शिकायत (FIR) दर्ज करें। घरेलू हिंसा एक संज्ञेय अपराध है और पुलिस को कार्रवाई करनी ही होगी।',
        ['bnss-fir-registration', 'pwdva-domestic-violence-relief']
      ),
      step(
        'Step 6 — WHERE TO COMPLAIN: (a) Nearest Police Station — FIR for criminal complaint. (b) Protection Officer at your District Collectorate / Women & Child Welfare Office. (c) Judicial Magistrate Court — for Protection, Residence, or Monetary Orders. (d) Nearest One Stop Centre (OSC). (e) Call 181 — Women Helpline (free, 24x7). (f) Call 15100 — NALSA free legal aid.',
        'चरण 6 — कहाँ शिकायत करें: (a) नजदीकी पुलिस थाना — FIR के लिए। (b) जिला कलेक्ट्रेट / महिला एवं बाल कल्याण कार्यालय में संरक्षण अधिकारी। (c) न्यायिक मजिस्ट्रेट कोर्ट — संरक्षण, आवास या मुआवजा आदेश के लिए। (d) निकटतम वन स्टॉप सेंटर (OSC)। (e) 181 पर कॉल करें — महिला हेल्पलाइन (मुफ्त, 24x7)। (f) 15100 — NALSA मुफ्त कानूनी सहायता।',
        ['pwdva-domestic-violence-relief', 'whl-181-women-helpline', 'nalsa-free-legal-aid', 'bnss-fir-registration']
      ),
    ],

    'posh-workplace-harassment-redressal': [
      step(
        'Step 1 — Document the Incidents: Write down every incident with exact dates, times, location, what was said or done, and any witnesses. Save screenshots of messages, emails, or any digital evidence.',
        'चरण 1 — घटनाओं का दस्तावेज़ीकरण करें: हर घटना की सटीक तारीख, समय, स्थान, क्या कहा या किया गया और गवाहों की जानकारी लिखें। संदेशों, ईमेल या किसी भी डिजिटल सबूत के स्क्रीनशॉट सेव करें।',
        ['posh-workplace-harassment-redressal', 'legal-aid-document-checklist']
      ),
      step(
        'Step 2 — File with Internal Committee (IC) — workplaces with 10+ employees: Submit a written complaint to your company\'s Internal Committee (IC) within 3 months of the incident. Under POSH Act Section 9, the complaint must be in writing. The IC is legally required to respond.',
        'चरण 2 — आंतरिक समिति (IC) में शिकायत दर्ज करें — 10+ कर्मचारी वाले कार्यस्थल: घटना के 3 महीने के भीतर कंपनी की आंतरिक समिति (IC) को लिखित शिकायत दें। POSH अधिनियम की धारा 9 के अनुसार शिकायत लिखित में होनी चाहिए। IC को कानूनी रूप से जवाब देना होगा।',
        ['posh-workplace-harassment-redressal']
      ),
      step(
        'Step 3 — No IC or Complaint is against Employer? Use Local Committee (LC): If your workplace has fewer than 10 employees, or the complaint is against the employer directly, approach the Local Committee (LC) at your District Office (constituted under POSH Act Section 6).',
        'चरण 3 — IC नहीं है या शिकायत नियोक्ता के खिलाफ है? स्थानीय समिति (LC) का उपयोग करें: अगर आपके कार्यस्थल में 10 से कम कर्मचारी हैं, या शिकायत सीधे नियोक्ता के खिलाफ है, तो जिला कार्यालय की स्थानीय समिति (LC) से संपर्क करें (POSH अधिनियम धारा 6 के तहत)।',
        ['posh-workplace-harassment-redressal']
      ),
      step(
        'Step 4 — Simultaneously File an FIR: Sexual harassment at the workplace is also a criminal offence under BNS. Visit the nearest police station and file an FIR (Zero FIR is allowed at any station).',
        'चरण 4 — एक साथ FIR भी दर्ज करें: कार्यस्थल पर यौन उत्पीड़न BNS के तहत एक आपराधिक अपराध भी है। नजदीकी पुलिस थाने जाएं और FIR दर्ज करें (किसी भी थाने में जीरो FIR की अनुमति है)।',
        ['bnss-fir-registration', 'posh-workplace-harassment-redressal']
      ),
      step(
        'Step 5 — Request Interim Relief if Needed: You can request the IC/LC to recommend interim measures such as transfer of the respondent, or a leave of absence for you, while the inquiry is pending.',
        'चरण 5 — जरूरत पड़ने पर अंतरिम राहत मांगें: जांच लंबित रहने के दौरान, आप IC/LC से अंतरिम उपाय की सिफारिश करने का अनुरोध कर सकते हैं जैसे प्रतिवादी का स्थानांतरण, या आपके लिए छुट्टी।',
        ['posh-workplace-harassment-redressal']
      ),
      step(
        'Step 6 — WHERE TO COMPLAIN: (a) Internal Committee (IC) of your company (HR department). (b) Local Committee (LC) at your District Collector / District Women & Child Development Office. (c) Nearest Police Station — FIR under BNS. (d) Call 181 — Women Helpline 24x7 (free). (e) Call 15100 — NALSA for free legal support.',
        'चरण 6 — कहाँ शिकायत करें: (a) आपकी कंपनी की आंतरिक समिति (IC) / HR विभाग। (b) जिला कलेक्टर / जिला महिला एवं बाल विकास कार्यालय में स्थानीय समिति (LC)। (c) नजदीकी पुलिस थाना — BNS के तहत FIR। (d) 181 पर कॉल करें — महिला हेल्पलाइन 24x7 (मुफ्त)। (e) 15100 — NALSA मुफ्त कानूनी सहायता।',
        ['posh-workplace-harassment-redressal', 'bnss-fir-registration', 'whl-181-women-helpline', 'nalsa-free-legal-aid']
      ),
    ],

    'bns-stalking-harassment': [
      step(
        'Step 1 — Save All Evidence: Screenshot every message, email, social media interaction, call log, or photo sent by the stalker. Note down dates, times, and locations where you were followed or approached.',
        'चरण 1 — सभी सबूत सेव करें: स्टॉकर के हर मैसेज, ईमेल, सोशल मीडिया इंटरैक्शन, कॉल लॉग या भेजी गई फोटो का स्क्रीनशॉट लें। उन तारीखों, समय और स्थानों को नोट करें जहां आपका पीछा किया गया।',
        ['bns-stalking-harassment', 'legal-aid-document-checklist']
      ),
      step(
        'Step 2 — File an FIR at the Nearest Police Station: Stalking is a cognizable offence under Section 78 of BNS 2023. Go to any police station and file a Zero FIR — they cannot refuse. Mention "Section 78 BNS" in your complaint.',
        'चरण 2 — नजदीकी पुलिस थाने में FIR दर्ज करें: BNS 2023 की धारा 78 के तहत पीछा करना एक संज्ञेय अपराध है। किसी भी पुलिस थाने में जाएं और जीरो FIR दर्ज करें — वे मना नहीं कर सकते। अपनी शिकायत में "BNS धारा 78" का उल्लेख करें।',
        ['bns-stalking-harassment', 'bnss-fir-registration']
      ),
      step(
        'Step 3 — For Online/Cyber Stalking: Report to the National Cyber Crime Reporting Portal at cybercrime.gov.in or call the helpline 1930. Also file a complaint with your local police station mentioning "cyber stalking under Section 78 BNS".',
        'चरण 3 — ऑनलाइन/साइबर स्टॉकिंग के लिए: राष्ट्रीय साइबर अपराध रिपोर्टिंग पोर्टल cybercrime.gov.in पर रिपोर्ट करें या हेल्पलाइन 1930 पर कॉल करें। "BNS धारा 78 के तहत साइबर स्टॉकिंग" का उल्लेख करते हुए स्थानीय थाने में भी शिकायत दर्ज करें।',
        ['bns-stalking-harassment', 'bnss-fir-registration']
      ),
      step(
        'Step 4 — Apply for a Restraining Order: Through the PWDVA route (if domestic) or through the Criminal Court after FIR, ask your lawyer or Protection Officer to request a restraining/protection order against the accused.',
        'चरण 4 — निरोधक आदेश के लिए आवेदन करें: PWDVA मार्ग (घरेलू होने पर) या FIR के बाद आपराधिक न्यायालय के माध्यम से, अपने वकील या संरक्षण अधिकारी से आरोपी के खिलाफ निरोधक/सुरक्षा आदेश का अनुरोध करने के लिए कहें।',
        ['bns-stalking-harassment', 'pwdva-domestic-violence-relief']
      ),
      step(
        'Step 5 — WHERE TO COMPLAIN: (a) Nearest Police Station — FIR under Section 78/79 BNS. (b) Cyber Crime Portal: cybercrime.gov.in or helpline 1930 (for online stalking). (c) Call 181 — Women Helpline 24x7. (d) Call 112 — If in immediate danger. (e) DLSA / Call 15100 — For free legal aid to pursue court orders.',
        'चरण 5 — कहाँ शिकायत करें: (a) नजदीकी पुलिस थाना — BNS धारा 78/79 के तहत FIR। (b) साइबर क्राइम पोर्टल: cybercrime.gov.in या 1930 (ऑनलाइन स्टॉकिंग के लिए)। (c) 181 पर कॉल करें — महिला हेल्पलाइन 24x7। (d) 112 — तत्काल खतरे की स्थिति में। (e) DLSA / 15100 — न्यायालय आदेश के लिए मुफ्त कानूनी सहायता।',
        ['bns-stalking-harassment', 'bnss-fir-registration', 'whl-181-women-helpline', 'erss-112-emergency', 'nalsa-free-legal-aid']
      ),
    ],

    'nalsa-free-legal-aid': [
      step(
        'Step 1 — Confirm You Are Eligible: Under Section 12(c) of the Legal Services Authorities Act 1987, ALL women are entitled to free legal aid in India regardless of their income. No income certificate is needed for women.',
        'चरण 1 — पात्रता की पुष्टि करें: कानूनी सेवा प्राधिकरण अधिनियम 1987 की धारा 12(c) के तहत, भारत में सभी महिलाएं अपनी आय की परवाह किए बिना मुफ्त कानूनी सहायता की हकदार हैं। महिलाओं के लिए आय प्रमाण पत्र की आवश्यकता नहीं है।',
        ['nalsa-free-legal-aid']
      ),
      step(
        'Step 2 — Call the NALSA Toll-Free Helpline: Dial 15100 (toll-free, available during working hours). Explain your situation — they will guide you to the nearest authority and connect you with a free lawyer.',
        'चरण 2 — NALSA टोल-फ्री हेल्पलाइन पर कॉल करें: 15100 डायल करें (टोल-फ्री, कामकाजी घंटों के दौरान उपलब्ध)। अपनी स्थिति समझाएं — वे आपको निकटतम प्राधिकरण तक मार्गदर्शन करेंगे और एक मुफ्त वकील से जोड़ेंगे।',
        ['nalsa-free-legal-aid']
      ),
      step(
        'Step 3 — Visit the Nearest DLSA Office: Go to the District Legal Services Authority (DLSA) at your District Court complex. Submit a simple written application requesting free legal services. Bring your Aadhaar card or any ID proof.',
        'चरण 3 — निकटतम DLSA कार्यालय जाएं: अपने जिला न्यायालय परिसर में जिला विधिक सेवा प्राधिकरण (DLSA) जाएं। मुफ्त कानूनी सेवाओं का अनुरोध करते हुए एक सरल लिखित आवेदन जमा करें। अपना आधार कार्ड या कोई भी पहचान प्रमाण लाएं।',
        ['nalsa-free-legal-aid', 'legal-aid-document-checklist']
      ),
      step(
        'Step 4 — What You Get: NALSA/DLSA will provide — (a) A government-appointed advocate at state expense. (b) Help drafting your legal complaint, petition, or reply. (c) Exemption from court fees. (d) Representation in civil, criminal, and family courts.',
        'चरण 4 — आपको क्या मिलेगा: NALSA/DLSA आपको प्रदान करेगा — (a) राज्य खर्च पर सरकारी वकील। (b) कानूनी शिकायत, याचिका या उत्तर तैयार करने में मदद। (c) न्यायालय शुल्क से छूट। (d) सिविल, आपराधिक और पारिवारिक अदालतों में प्रतिनिधित्व।',
        ['nalsa-free-legal-aid']
      ),
      step(
        'Step 5 — WHERE TO GO FOR LEGAL AID: (a) Call 15100 — NALSA Helpline (toll-free). (b) DLSA Office at your District Court. (c) TLSC (Taluk Legal Services Committee) for sub-district areas. (d) Visit nalsa.gov.in to find your nearest DLSA.',
        'चरण 5 — मुफ्त कानूनी सहायता के लिए कहाँ जाएं: (a) 15100 — NALSA हेल्पलाइन (टोल-फ्री)। (b) जिला न्यायालय में DLSA कार्यालय। (c) उप-जिला क्षेत्रों के लिए TLSC (तालुक विधिक सेवा समिति)। (d) निकटतम DLSA खोजने के लिए nalsa.gov.in पर जाएं।',
        ['nalsa-free-legal-aid']
      ),
    ],

    'whl-181-women-helpline': [
      step(
        'Step 1 — Call 181 Immediately (Free, 24x7): The Women Helpline 181 is a 24-hour toll-free service run by the Ministry of Women and Child Development. Call from any phone — it is free.',
        'चरण 1 — अभी 181 पर कॉल करें (मुफ्त, 24x7): महिला हेल्पलाइन 181 महिला एवं बाल विकास मंत्रालय द्वारा संचालित 24 घंटे टोल-फ्री सेवा है। किसी भी फोन से कॉल करें — यह मुफ्त है।',
        ['whl-181-women-helpline']
      ),
      step(
        'Step 2 — What Helpline 181 Will Do: They will immediately coordinate with police (ERSS-112), hospitals, ambulances, One Stop Centres (OSCs), and DLSA on your behalf to get you the right help.',
        'चरण 2 — हेल्पलाइन 181 क्या करेगी: वे आपकी ओर से पुलिस (ERSS-112), अस्पताल, एम्बुलेंस, वन स्टॉप सेंटर (OSC) और DLSA के साथ तत्काल समन्वय करेंगे ताकि आपको सही मदद मिल सके।',
        ['whl-181-women-helpline', 'erss-112-emergency']
      ),
      step(
        'Step 3 — Visit a One Stop Centre (OSC) / Sakhi Centre: OSCs provide under one roof — medical aid, police assistance, legal aid, psycho-social counselling, and temporary shelter. Ask 181 for the nearest one.',
        'चरण 3 — वन स्टॉप सेंटर (OSC) / सखी केंद्र जाएं: OSC एक ही छत के नीचे देते हैं — चिकित्सा सहायता, पुलिस सहायता, कानूनी सहायता, मनोवैज्ञानिक परामर्श और अस्थायी आश्रय। निकटतम के लिए 181 पर पूछें।',
        ['whl-181-women-helpline']
      ),
      step(
        'Step 4 — WHERE TO GET HELP: (a) Call 181 — Women Helpline (24x7, free). (b) Call 112 — Police emergency. (c) Nearest One Stop Centre (OSC) / Sakhi Centre. (d) Call 15100 — NALSA free legal aid. (e) Nearest police station for FIR.',
        'चरण 4 — कहाँ से मदद लें: (a) 181 — महिला हेल्पलाइन (24x7, मुफ्त)। (b) 112 — पुलिस आपातकाल। (c) निकटतम वन स्टॉप सेंटर (OSC) / सखी केंद्र। (d) 15100 — NALSA मुफ्त कानूनी सहायता। (e) FIR के लिए नजदीकी पुलिस थाना।',
        ['whl-181-women-helpline', 'erss-112-emergency', 'nalsa-free-legal-aid', 'bnss-fir-registration']
      ),
    ],

    'erss-112-emergency': [
      step(
        'Step 1 — Call 112 RIGHT NOW: 112 is the single pan-India emergency number for police, fire, and ambulance. You can call even without mobile balance. State your location clearly.',
        'चरण 1 — अभी 112 पर कॉल करें: 112 पुलिस, अग्निशमन और एम्बुलेंस के लिए एकल पैन-इंडिया आपातकालीन नंबर है। आप मोबाइल बैलेंस के बिना भी कॉल कर सकते हैं। अपना स्थान स्पष्ट रूप से बताएं।',
        ['erss-112-emergency']
      ),
      step(
        'Step 2 — Use 112 India App: Download the "112 India" app (available on Android and iOS) which allows you to send a silent SOS alert with your GPS location to the nearest Emergency Response Centre.',
        'चरण 2 — 112 India ऐप का उपयोग करें: "112 India" ऐप डाउनलोड करें (Android और iOS पर उपलब्ध) जो आपको निकटतम आपातकालीन प्रतिक्रिया केंद्र को अपने GPS स्थान के साथ एक साइलेंट SOS अलर्ट भेजने की अनुमति देता है।',
        ['erss-112-emergency']
      ),
      step(
        'Step 3 — Also Call 181 for Women-Specific Support: After immediate danger is addressed, call 181 (Women Helpline) for counseling, legal aid referrals, and shelter coordination.',
        'चरण 3 — महिला-विशिष्ट सहायता के लिए 181 पर भी कॉल करें: तत्काल खतरा टलने के बाद, परामर्श, कानूनी सहायता और आश्रय समन्वय के लिए 181 (महिला हेल्पलाइन) पर कॉल करें।',
        ['erss-112-emergency', 'whl-181-women-helpline']
      ),
      step(
        'Step 4 — WHERE TO CONTACT: (a) 112 — Emergency (Police/Ambulance/Fire). (b) 181 — Women Helpline (free, 24x7). (c) 100 — Police. (d) 108 — Ambulance. (e) 101 — Fire.',
        'चरण 4 — कहाँ संपर्क करें: (a) 112 — आपातकाल (पुलिस/एम्बुलेंस/अग्निशमन)। (b) 181 — महिला हेल्पलाइन (मुफ्त, 24x7)। (c) 100 — पुलिस। (d) 108 — एम्बुलेंस। (e) 101 — अग्निशमन।',
        ['erss-112-emergency', 'whl-181-women-helpline']
      ),
    ],

    'legal-aid-document-checklist': [
      step(
        'Step 1 — Gather Your Identity Proof: Collect at least one of — Aadhaar Card, Voter ID, Ration Card, or Passport. This proves who you are to legal authorities and police.',
        'चरण 1 — अपनी पहचान का प्रमाण इकट्ठा करें: इनमें से कम से कम एक इकट्ठा करें — आधार कार्ड, मतदाता पहचान पत्र, राशन कार्ड, या पासपोर्ट। यह कानूनी अधिकारियों और पुलिस को साबित करता है कि आप कौन हैं।',
        ['legal-aid-document-checklist']
      ),
      step(
        'Step 2 — Write a Clear Incident Summary: On paper, write down — what happened, when (dates and times), where, who was involved (name/description of accused), and any witnesses. Be as specific as possible.',
        'चरण 2 — एक स्पष्ट घटना सारांश लिखें: कागज पर लिखें — क्या हुआ, कब (तारीख और समय), कहाँ, कौन शामिल था (आरोपी का नाम/विवरण), और कोई गवाह। जितना संभव हो उतना विशिष्ट रहें।',
        ['legal-aid-document-checklist']
      ),
      step(
        'Step 3 — Collect Supporting Evidence: Gather — (a) Medical reports or injury certificates if you were physically harmed. (b) Screenshots of threatening messages, emails, or call logs. (c) Photographs of injuries or damaged property. (d) Copies of previous complaints if any were filed.',
        'चरण 3 — सहायक साक्ष्य इकट्ठा करें: इकट्ठा करें — (a) यदि शारीरिक नुकसान हुआ हो तो मेडिकल रिपोर्ट या चोट प्रमाण पत्र। (b) धमकी भरे संदेशों, ईमेल या कॉल लॉग के स्क्रीनशॉट। (c) चोटों या क्षतिग्रस्त संपत्ति की फोटो। (d) पहले दर्ज की गई शिकायतों की प्रतियाँ।',
        ['legal-aid-document-checklist']
      ),
      step(
        'Step 4 — Note: Women Do NOT Need Income Proof for Legal Aid: Under Section 12 of the Legal Services Authorities Act, women are entitled to free legal aid regardless of income. You do NOT need to show financial status.',
        'चरण 4 — नोट: महिलाओं को कानूनी सहायता के लिए आय प्रमाण की आवश्यकता नहीं: कानूनी सेवा प्राधिकरण अधिनियम की धारा 12 के तहत, महिलाएं आय की परवाह किए बिना मुफ्त कानूनी सहायता की हकदार हैं। आपको वित्तीय स्थिति दिखाने की जरूरत नहीं है।',
        ['legal-aid-document-checklist', 'nalsa-free-legal-aid']
      ),
      step(
        'Step 5 — WHERE TO SUBMIT DOCUMENTS: (a) Nearest Police Station — for FIR. (b) DLSA Office at District Court — for free legal aid. (c) Protection Officer at District Collectorate — for PWDVA cases. (d) IC/LC — for workplace harassment (POSH). (e) Call 15100 — NALSA guidance.',
        'चरण 5 — दस्तावेज़ कहाँ जमा करें: (a) नजदीकी पुलिस थाना — FIR के लिए। (b) जिला न्यायालय में DLSA कार्यालय — मुफ्त कानूनी सहायता के लिए। (c) जिला कलेक्ट्रेट में संरक्षण अधिकारी — PWDVA मामलों के लिए। (d) IC/LC — कार्यस्थल उत्पीड़न (POSH) के लिए। (e) 15100 — NALSA मार्गदर्शन।',
        ['legal-aid-document-checklist', 'nalsa-free-legal-aid', 'bnss-fir-registration', 'pwdva-domestic-violence-relief']
      ),
    ],
  };

  // Find the best matching plan from top candidates
  for (const candidate of candidates) {
    if (STEP_PLANS[candidate.id]) {
      return STEP_PLANS[candidate.id];
    }
  }

  // Generic fallback if no specific plan matched
  return candidates.slice(0, 3).map((c) => ({
    text: language === 'hi'
      ? `सत्यापित कानूनी प्रावधान: ${c.title} — आधिकारिक स्रोत देखें: ${c.sourceUrl}`
      : `Verified legal provision: ${c.title} — See official source: ${c.sourceUrl}`,
    sourceIds: [c.id]
  }));
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
      ? `सत्यापित कानूनी प्रावधान: **${topEntry.title}** (${topEntry.sourceName}) के तहत आपके लिए आवश्यक कदम और शिकायत दर्ज करने की प्रक्रिया नीचे दी गई है:`
      : `Based on verified official sources (**${topEntry.title}**, ${topEntry.sourceName}), here is your step-by-step procedure and where to file a complaint:`;

    // Build real, actionable step-by-step guidance based on the top matched KB entry
    const fallbackSteps = buildActionableSteps(candidates, language);

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
