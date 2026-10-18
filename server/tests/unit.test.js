import test from 'node:test';
import assert from 'node:assert/strict';
import { validateKbEntry, validateKnowledgeBase, validateProposal } from '../src/utils/kbSchema.js';
import { isEmergencyMessage, getEmergencyResponse } from '../src/services/safetyService.js';
import { retrieveEntries, isForeignJurisdiction } from '../src/services/retrievalService.js';
import { normalizeDevanagariDigits, extractClaimTokens, verifyClaimsAgainstSources } from '../src/utils/claimCheck.js';

test('Schema Validator: accepts valid entry and rejects invalid entries', () => {
  const validEntry = {
    id: "test-valid-entry",
    title: "Valid Entry Title",
    topic: "Test Topic",
    jurisdiction: "India",
    language: "en",
    content: "This is a verified test passage of sufficient length to pass validation.",
    keywords: ["test", "valid"],
    sourceName: "Official Government Portal",
    sourceUrl: "https://doj.gov.in/test-entry",
    sourceType: "legislation",
    effectiveDate: "2026-01-01",
    lastVerified: "2026-10-18",
    version: 1,
    status: "active",
    supersededBy: null,
    volatile: false
  };

  const validRes = validateKbEntry(validEntry, { allowTestIds: true });
  assert.equal(validRes.valid, true, `Expected valid, got: ${validRes.errors.join('; ')}`);

  // Rejection: test- id without allowTestIds
  const testIdRes = validateKbEntry(validEntry, { allowTestIds: false });
  assert.equal(testIdRes.valid, false);
  assert.match(testIdRes.errors[0], /cannot start with "test-"/);

  // Rejection: invalid non-gov URL
  const badUrlEntry = { ...validEntry, sourceUrl: "https://commercial-blog.com/test" };
  const badUrlRes = validateKbEntry(badUrlEntry, { allowTestIds: true });
  assert.equal(badUrlRes.valid, false);
  assert.match(badUrlRes.errors[0], /sourceUrl/);

  // Rejection: future lastVerified date
  const futureEntry = { ...validEntry, lastVerified: "2099-01-01" };
  const futureRes = validateKbEntry(futureEntry, { allowTestIds: true });
  assert.equal(futureRes.valid, false);
  assert.match(futureRes.errors[0], /lastVerified/);
});

test('Safety Service: accurately detects immediate danger in EN, HI, and Hinglish', () => {
  // English immediate danger
  assert.equal(isEmergencyMessage("Help me! An attacker is breaking my door right now!"), true);
  assert.equal(isEmergencyMessage("I am locked in a room and someone is threatening me with a weapon"), true);

  // Devanagari Hindi
  assert.equal(isEmergencyMessage("बचाओ मुझे! कोई मुझे जान से मारने की धमकी दे रहा है"), true);
  assert.equal(isEmergencyMessage("कमरे में बंद कर दिया है और मार रहा है"), true);

  // Romanized Hindi (Hinglish)
  assert.equal(isEmergencyMessage("Bachao mujhe jaan khatre me hai please help!"), true);
  assert.equal(isEmergencyMessage("Hamla ho gaya hai police bulao"), true);

  // Benign queries should NOT trigger emergency
  assert.equal(isEmergencyMessage("What documents are required for filing an FIR?"), false);
  assert.equal(isEmergencyMessage("महिलाएं मुफ्त वकील कैसे ले सकती हैं?"), false);
  assert.equal(isEmergencyMessage("Can I get maintenance under domestic violence act?"), false);

  // Emergency response package structure
  const enRes = getEmergencyResponse('en', '1.0.0');
  assert.equal(enRes.emergency, true);
  assert.equal(enRes.mode, 'emergency');
  assert.match(enRes.answer, /112/);
  assert.match(enRes.answer, /https:\/\/112\.gov\.in/);

  const hiRes = getEmergencyResponse('hi', '1.0.0');
  assert.equal(hiRes.emergency, true);
  assert.match(hiRes.answer, /112/);
  assert.match(hiRes.answer, /https:\/\/112\.gov\.in/);
});

test('Retrieval Service: correctly scores and filters entries, flags foreign jurisdiction', () => {
  const dummyEntries = [
    {
      id: "fir-entry",
      title: "FIR Registration under BNSS",
      topic: "Police Complaint",
      jurisdiction: "India",
      language: "en",
      content: "Section 173 details FIR registration and Zero FIR.",
      keywords: ["fir", "zero fir", "police", "थाना", "एफआईआर"],
      sourceName: "India Code",
      sourceUrl: "https://www.indiacode.nic.in/handle/123456789/21303",
      sourceType: "legislation",
      effectiveDate: "2024-07-01",
      lastVerified: "2026-10-18",
      version: 1,
      status: "active",
      supersededBy: null,
      volatile: true
    }
  ];

  // Match English
  const resEn = retrieveEntries("How do I register a Zero FIR at a police station?", [], dummyEntries);
  assert.equal(resEn.candidates.length, 1);
  assert.equal(resEn.candidates[0].id, "fir-entry");
  assert.equal(resEn.provisionalEvidenceLevel, "sufficient");

  // Match Hindi
  const resHi = retrieveEntries("थाने में एफआईआर कैसे दर्ज करवाएं?", [], dummyEntries);
  assert.equal(resHi.candidates.length, 1);
  assert.equal(resHi.candidates[0].id, "fir-entry");

  // Foreign jurisdiction
  assert.equal(isForeignJurisdiction("How to challenge a traffic ticket in California?"), true);
  const foreignRes = retrieveEntries("How to challenge a traffic ticket in California?", [], dummyEntries);
  assert.equal(foreignRes.outOfScope, true);
  assert.equal(foreignRes.provisionalEvidenceLevel, "none");
});

test('Claim Checker: normalizes Devanagari digits and detects unsupported claims', () => {
  // Digit normalization
  assert.equal(normalizeDevanagariDigits("धारा १२३ और ४५६"), "धारा 123 और 456");
  assert.equal(normalizeDevanagariDigits("३ दिन"), "3 दिन");

  // Token extraction
  const tokens = extractClaimTokens("Under Section 173 of BNSS, an e-FIR must be signed within 3 days or 72 hours.");
  const tokenRaws = tokens.map(t => t.raw.toLowerCase());
  assert.ok(tokenRaws.some(r => r.includes('section 173')));
  assert.ok(tokenRaws.some(r => r.includes('3 days')));

  // Grounded verification
  const sourcePassages = [
    {
      content: "Under Section 173 of BNSS, 2023, an e-FIR must be signed within three days by the person giving it.",
      sourceUrl: "https://www.indiacode.nic.in/handle/123456789/21303"
    }
  ];

  // Supported text
  const validCheck = verifyClaimsAgainstSources("According to Section 173, information is recorded.", sourcePassages);
  assert.equal(validCheck.valid, true);

  // Unsupported claim (e.g. fabricated Section 999 and ₹50000 fine)
  const invalidCheck = verifyClaimsAgainstSources("Under Section 999 the penalty is 50000 rupees.", sourcePassages);
  assert.equal(invalidCheck.valid, false);
  assert.ok(invalidCheck.unsupportedClaims.length > 0);
});
