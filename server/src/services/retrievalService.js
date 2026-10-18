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

    // 1. Keyword matching
    for (const kw of entry.keywords || []) {
      const kwNorm = normalizeQuery(kw);
      if (!kwNorm) continue;

      // Word boundary match or substring for Hindi/Devanagari
      const regex = new RegExp(`(?:^|\\s)${escapeRegExp(kwNorm)}(?:$|\\s)`, 'i');
      if (regex.test(combinedQuery) || combinedQuery.includes(kwNorm)) {
        // Multi-word phrase keyword gets higher weight
        const isPhrase = kwNorm.includes(' ');
        score += isPhrase ? 4.5 : 2.5;
        matchedKeywords.add(kw);
      }
    }

    // 2. Title & Topic matching
    for (const word of entryTitleNorm.split(' ')) {
      if (word.length >= 3 && combinedQuery.includes(word)) {
        score += 1.5;
      }
    }
    if (entryTopicNorm && combinedQuery.includes(entryTopicNorm)) {
      score += 3.0;
    }

    // 3. Specific legal terms boosts
    if (entry.id === 'bnss-fir-registration' && /\b(?:fir|zero\s+fir|efir|173|थाना|शिकायत)\b/i.test(combinedQuery)) {
      score += 3.0;
    }
    if (entry.id === 'erss-112-emergency' && /\b(?:112|emergency|police|ambulance|आपातकालीन)\b/i.test(combinedQuery)) {
      score += 3.0;
    }
    if (entry.id === 'nalsa-free-legal-aid' && /\b(?:nalsa|legal\s+aid|free\s+(?:lawyer|advocate)|15100|वकील|कानूनी\s+मदद)\b/i.test(combinedQuery)) {
      score += 3.0;
    }
    if (entry.id === 'pwdva-domestic-violence-relief' && /\b(?:domestic\s+violence|protection\s+order|residence\s+order|घरेलू\s+हिंसा)\b/i.test(combinedQuery)) {
      score += 3.0;
    }
    if (entry.id === 'posh-workplace-harassment-redressal' && /\b(?:posh|workplace|internal\s+committee|local\s+committee|यौन\s+उत्पीड़न|office)\b/i.test(combinedQuery)) {
      score += 3.0;
    }
    if (entry.id === 'bns-stalking-harassment' && /\b(?:stalking|stalker|following|78|79|पीछा|छेड़छाड़)\b/i.test(combinedQuery)) {
      score += 3.0;
    }
    if (entry.id === 'whl-181-women-helpline' && /\b(?:181|helpline|महिला\s+हेल्पलाइन)\b/i.test(combinedQuery)) {
      score += 3.0;
    }
    if (entry.id === 'legal-aid-document-checklist' && /\b(?:documents?|checklist|papers?|proof|दस्तावेज|कागजात|सबूत)\b/i.test(combinedQuery)) {
      score += 3.0;
    }

    if (score > 0 && matchedKeywords.size > 0) {
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
