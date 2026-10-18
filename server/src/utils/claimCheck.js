/**
 * Unsupported-claim check for NyayaSetu_AI.
 * Section 8.8:
 * Extracts section/article numbers, numbers with units (days, months, years, rupees),
 * phone/helpline numbers, and URLs from generated answer and steps.
 * Normalizes Devanagari digits; any such token not present in the retrieved passages
 * is flagged as unsupported.
 */

const DEVANAGARI_DIGITS = {
  '०': '0', '१': '1', '२': '2', '३': '3', '४': '4',
  '५': '5', '६': '6', '७': '7', '८': '8', '९': '9'
};

export function normalizeDevanagariDigits(text = '') {
  if (typeof text !== 'string') return '';
  return text.replace(/[०-९]/g, d => DEVANAGARI_DIGITS[d] || d);
}

export function extractClaimTokens(text = '') {
  const norm = normalizeDevanagariDigits(text);
  const tokens = [];

  // 1. Sections and Articles (e.g., Section 173, Sec 12, धारा 173, Article 39A)
  const sectionMatches = norm.match(/(?:section|sec\.?|article|art\.?|धारा|अनुच्छेद)\s*([0-9]+[a-z]?)/gi);
  if (sectionMatches) {
    for (const sm of sectionMatches) {
      tokens.push({ type: 'section', raw: sm.trim() });
    }
  }

  // 2. Numbers with units: days, months, years, rupees (e.g. 3 days, 3 months, ₹500, 3 दिन)
  const unitMatches = norm.match(/\b([0-9]+)\s*(?:days?|months?|years?|दिन|महीने|माह|साल|वर्ष|rupees?|rs\.?|रुपये)\b/gi);
  if (unitMatches) {
    for (const um of unitMatches) {
      tokens.push({ type: 'unit-number', raw: um.trim() });
    }
  }

  // 3. Helplines / emergency phone numbers (3 to 10 digits)
  const helplineMatches = norm.match(/\b([0-9]{3,10})\b/g);
  if (helplineMatches) {
    for (const hm of helplineMatches) {
      // Exclude simple years like 2023, 2024, 2005, 1987 unless they are also verified
      tokens.push({ type: 'number', raw: hm.trim() });
    }
  }

  // 4. URLs (stripping trailing punctuation like dots, commas, parentheses)
  const urlMatches = norm.match(/https?:\/\/[^\s)\]]+/gi);
  if (urlMatches) {
    for (const um of urlMatches) {
      const cleanUrl = um.replace(/[.,;:)>\]]+$/, '').trim();
      if (cleanUrl) {
        tokens.push({ type: 'url', raw: cleanUrl });
      }
    }
  }

  return tokens;
}

/**
 * Checks whether any extracted claim tokens in the generated text are absent from the retrieved passages.
 * @param {string} generatedText 
 * @param {Array<{ content: string, sourceUrl?: string }>} retrievedPassages 
 * @returns {{ valid: boolean, unsupportedClaims: string[] }}
 */
export function verifyClaimsAgainstSources(generatedText = '', retrievedPassages = []) {
  if (!generatedText || !retrievedPassages || retrievedPassages.length === 0) {
    return { valid: true, unsupportedClaims: [] };
  }

  // Concatenate all source content and source URLs, normalize digits
  const combinedSourceText = normalizeDevanagariDigits(
    retrievedPassages.map(p => `${p.content || ''} ${p.sourceUrl || ''} ${p.title || ''}`).join(' ')
  ).toLowerCase();

  const claimTokens = extractClaimTokens(generatedText);
  const unsupportedClaims = [];

  for (const token of claimTokens) {
    const rawNormalized = token.raw.toLowerCase();

    // Check if the specific token or its primary value exists in source text
    if (token.type === 'section') {
      // Extract the section number part
      const numMatch = rawNormalized.match(/[0-9]+[a-z]?/);
      if (numMatch && !combinedSourceText.includes(numMatch[0])) {
        unsupportedClaims.push(token.raw);
      }
    } else if (token.type === 'unit-number') {
      // e.g. "3 days" -> check if number exists
      const numMatch = rawNormalized.match(/[0-9]+/);
      if (numMatch && !combinedSourceText.includes(numMatch[0])) {
        unsupportedClaims.push(token.raw);
      }
    } else if (token.type === 'number') {
      // For bare numbers, check if they exist in source text
      if (!combinedSourceText.includes(rawNormalized)) {
        unsupportedClaims.push(token.raw);
      }
    } else if (token.type === 'url') {
      if (!combinedSourceText.includes(rawNormalized)) {
        unsupportedClaims.push(token.raw);
      }
    }
  }

  // Deduplicate
  const uniqueUnsupported = [...new Set(unsupportedClaims)];

  return {
    valid: uniqueUnsupported.length === 0,
    unsupportedClaims: uniqueUnsupported
  };
}
