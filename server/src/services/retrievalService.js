/**
 * Retrieval Service for NyayaSetu_AI.
 * Section 8.3 & 8.4:
 * Deterministic keyword relevance + metadata filtering over structured JSON knowledge base.
 * NO vector DB, NO embeddings.
 * Tokenises English, Devanagari Hindi, and Romanized Hindi.
 * Incorporates recent history for follow-ups.
 * Flags out-of-scope / foreign jurisdictions.
 * Evaluates provisional evidence level (sufficient, partial, none).
 */

const NON_INDIA_JURISDICTIONS = [
  /\bcalifornia\b/i,
  /\b(?:united\s+states|usa|u\.s\.a\.|u\.s\.)\b/i,
  /\b(?:united\s+kingdom|uk|u\.k\.|england|london)\b/i,
  /\bsingapore\b/i,
  /\beuropean\s+patent\s+office\b/i,
  /\bcanada\b/i,
  /\baustralia\b/i,
  /\bdubai\b/i,
  /\bgermany\b/i
];

/**
 * Normalises text for bilingual token matching.
 */
export function normalizeQuery(text = '') {
  let cleaned = text
    .toLowerCase()
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"'।]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Common Hindi inflections/synonyms
  cleaned = cleaned
    .replace(/\bथाने\b/g, 'थाना')
    .replace(/\bवकीलों\b/g, 'वकील')
    .replace(/\bशिकायतें\b/g, 'शिकायत')
    .replace(/\bमुक़दमे\b/g, 'मुकदमा');

  return cleaned;
}

/**
 * Checks whether query targets a foreign jurisdiction outside India.
 */
export function isForeignJurisdiction(text = '') {
  if (/\bindia\b/i.test(text) || /\bभारत\b/i.test(text)) {
    // If explicitly comparing or mentioning India, do not instantly discard, but if clearly foreign law:
    return NON_INDIA_JURISDICTIONS.some(rx => rx.test(text));
  }
  return NON_INDIA_JURISDICTIONS.some(rx => rx.test(text));
}

const STOP_WORDS = new Set([
  'and', 'the', 'for', 'under', 'from', 'with', 'over', 'into', 'that', 'this',
  'what', 'where', 'when', 'which', 'who', 'how', 'why', 'are', 'was', 'were',
  'can', 'could', 'should', 'would', 'will', 'any', 'all', 'some', 'one', 'two',
  'its', 'their', 'our', 'your', 'about', 'also', 'per', 'act', 'code', 'order',
  'orders', 'section', 'sections', 'take', 'make', 'give', 'next', 'help', 'india',
  'court', 'case', 'dispute'
]);

function matchesKeyword(text, kw) {
  if (!kw) return false;
  // If keyword contains non-ASCII (e.g. Hindi Devanagari)
  if (/[^\x00-\x7F]/.test(kw)) {
    return text.includes(kw);
  }
  const rx = new RegExp(`\\b${escapeRegExp(kw)}\\b`, 'i');
  return rx.test(text);
}

/**
 * Retrieves top matching entries from the active knowledge base.
 * @param {string} userMessage 
 * @param {Array<{ role: string, content: string }>} history 
 * @param {Array<object>} activeEntries 
 * @returns {{ candidates: Array<object>, provisionalEvidenceLevel: 'sufficient'|'partial'|'none', outOfScope: boolean }}
 */
export function retrieveEntries(userMessage = '', history = [], activeEntries = []) {
  const normCurrent = normalizeQuery(userMessage);

  if (isForeignJurisdiction(userMessage)) {
    return {
      candidates: [],
      provisionalEvidenceLevel: 'none',
      outOfScope: true,
      reason: 'Question pertains to a non-India jurisdiction.'
    };
  }

  // Include context from the last user turn if current message is short / follow-up
  let combinedQuery = normCurrent;
  if (normCurrent.length < 35 && Array.isArray(history) && history.length > 0) {
    const lastUserTurn = [...history].reverse().find(t => t.role === 'user');
    if (lastUserTurn && lastUserTurn.content) {
      combinedQuery = `${normalizeQuery(lastUserTurn.content)} ${normCurrent}`;
    }
  }

  const scored = [];

  for (const entry of activeEntries) {
    if (entry.status === 'superseded') continue;

    let score = 0;
    const matchedKeywords = new Set();
    const entryTitleNorm = normalizeQuery(entry.title);
    const entryTopicNorm = normalizeQuery(entry.topic);
    const entryContentNorm = normalizeQuery(entry.content);

    // 1. Keyword matching with proper boundary check
    for (const kw of entry.keywords || []) {
      const kwNorm = normalizeQuery(kw);
      if (!kwNorm || STOP_WORDS.has(kwNorm)) continue;

      if (matchesKeyword(combinedQuery, kwNorm)) {
        const isPhrase = kwNorm.includes(' ');
        score += isPhrase ? 4.5 : 2.5;
        matchedKeywords.add(kw);
      }
    }

    // 2. Title & Topic matching (strictly excluding stop words)
    for (const word of entryTitleNorm.split(' ')) {
      if (word.length >= 4 && !STOP_WORDS.has(word) && matchesKeyword(combinedQuery, word)) {
        score += 1.5;
      }
    }
    if (entryTopicNorm && matchesKeyword(combinedQuery, entryTopicNorm)) {
      score += 3.0;
    }

    // 3. Specific legal terms boosts & domain detection
    if (entry.id === 'bnss-fir-registration' && /\b(?:fir|zero\s+fir|efir|173|थाना|शिकायत|complain|complaint|police\s+station)\b/i.test(combinedQuery)) {
      score += 3.5;
      matchedKeywords.add('fir-registration');
    }
    if (entry.id === 'erss-112-emergency' && /\b(?:112|emergency|police|ambulance|आपातकालीन|immediate\s+danger)\b/i.test(combinedQuery)) {
      score += 3.5;
      matchedKeywords.add('emergency-112');
    }
    if (entry.id === 'nalsa-free-legal-aid' && /\b(?:nalsa|dlsa|slsa|15100|legal\s+aid|free\s+lawyer|free\s+advocate|वकील|कानूनी\s+मदद)\b/i.test(combinedQuery)) {
      score += 3.5;
      matchedKeywords.add('free-legal-aid');
    }
    if (entry.id === 'pwdva-domestic-violence-relief' && /\b(?:domestic\s+violence|marital\s+abuse|husband\s+beats|husband\s+beating|husband\s+violence|protection\s+order|residence\s+order|घरेलू\s+हिंसा|मारपीट|ससुराल\s+प्रताड़ना)\b/i.test(combinedQuery)) {
      score += 4.0;
      matchedKeywords.add('domestic-violence');
    }
    if (entry.id === 'posh-workplace-harassment-redressal' && /\b(?:posh|internal\s+committee|local\s+committee|workplace\s+harassment|boss\s+harass|office\s+harass|यौन\s+उत्पीड़न)\b/i.test(combinedQuery)) {
      score += 3.5;
      matchedKeywords.add('workplace-harassment');
    }
    if (entry.id === 'bns-stalking-harassment' && /\b(?:stalking|stalker|stalk|following|unwanted\s+messages?|sexual\s+messages?|inappropriate\s+comments?|cyber\s+stalking|online\s+harassment|report\s+this\s+harassment|78\s+bns|79\s+bns|पीछा|छेड़छाड़)\b/i.test(combinedQuery)) {
      score += 5.5;
      matchedKeywords.add('stalking-harassment');
    }
    if (entry.id === 'whl-181-women-helpline' && /\b(?:181|women\s+helpline|महिला\s+हेल्पलाइन|one\s+stop\s+centre|sakhi\s+centre)\b/i.test(combinedQuery)) {
      score += 3.5;
      matchedKeywords.add('women-helpline');
    }
    if (entry.id === 'legal-aid-document-checklist' && /\b(?:document\s+checklist|documents\s+needed|papers\s+needed|proof\s+needed|दस्तावेज|कागजात|सबूत)\b/i.test(combinedQuery)) {
      score += 3.5;
      matchedKeywords.add('document-checklist');
    }

    if (score >= 2.5 && matchedKeywords.size > 0) {
      scored.push({
        entry,
        score,
        matchedKeywords: Array.from(matchedKeywords)
      });
    }
  }

  // Sort by score descending
  scored.sort((a, b) => b.score - a.score);

  // Top 3 candidates
  const topCandidates = scored.slice(0, 3).map(s => ({
    ...s.entry,
    retrievalScore: s.score,
    matchedKeywords: s.matchedKeywords
  }));

  // Evidence level assessment
  let provisionalEvidenceLevel = 'none';
  if (topCandidates.length > 0) {
    const topScore = topCandidates[0].retrievalScore;
    const topMatchedKwCount = topCandidates[0].matchedKeywords.length;

    if (topScore >= 5.0 && topMatchedKwCount >= 1) {
      provisionalEvidenceLevel = 'sufficient';
    } else if (topScore >= 2.5) {
      provisionalEvidenceLevel = 'partial';
    }
  }

  return {
    candidates: topCandidates,
    provisionalEvidenceLevel,
    outOfScope: false
  };
}

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
