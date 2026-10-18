import { config } from './config.js';

const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const SEMVER_REGEX = /^\d+\.\d+\.\d+$/;

function isValidDateString(str) {
  if (!DATE_REGEX.test(str)) return false;
  const d = new Date(str + 'T00:00:00Z');
  return !isNaN(d.getTime()) && d.toISOString().slice(0, 10) === str;
}

function isNotFutureDate(str) {
  if (!isValidDateString(str)) return false;
  const today = new Date().toISOString().slice(0, 10);
  return str <= today;
}

function isValidGovUrl(urlStr) {
  try {
    const parsed = new URL(urlStr);
    if (parsed.protocol !== 'https:') return false;
    const hostname = parsed.hostname.toLowerCase();
    return config.allowedHostSuffixes.some(suffix => hostname.endsWith(suffix));
  } catch {
    return false;
  }
}

/**
 * Validates a single knowledge base entry against the official schema.
 */
export function validateKbEntry(entry, options = { allowTestIds: false }) {
  const errors = [];
  if (!entry || typeof entry !== 'object') {
    return { valid: false, errors: ['Entry must be an object'] };
  }

  // id
  if (typeof entry.id !== 'string' || !SLUG_REGEX.test(entry.id)) {
    errors.push(`Invalid id: "${entry.id}". Must be a lowercase slug (e.g. "pwdva-domestic-violence-relief").`);
  } else if (!options.allowTestIds && entry.id.startsWith('test-')) {
    errors.push(`Entry id "${entry.id}" cannot start with "test-" in real data.`);
  }

  // title
  if (typeof entry.title !== 'string' || entry.title.trim().length < 3) {
    errors.push(`Invalid title: "${entry.title}". Must be a non-empty string (min 3 chars).`);
  }

  // topic
  if (typeof entry.topic !== 'string' || entry.topic.trim().length < 3) {
    errors.push(`Invalid topic: "${entry.topic}". Must be a non-empty string.`);
  }

  // jurisdiction
  if (entry.jurisdiction !== 'India') {
    errors.push(`Invalid jurisdiction: "${entry.jurisdiction}". Must be "India".`);
  }

  // language
  if (entry.language !== 'en') {
    errors.push(`Invalid language: "${entry.language}". Must be "en".`);
  }

  // content
  if (typeof entry.content !== 'string' || entry.content.trim().length < 20) {
    errors.push(`Invalid content. Must be a verified passage of at least 20 characters.`);
  }

  // keywords
  if (!Array.isArray(entry.keywords) || entry.keywords.length === 0 || !entry.keywords.every(k => typeof k === 'string' && k.trim().length > 0)) {
    errors.push(`Invalid keywords. Must be a non-empty array of strings.`);
  }

  // sourceName
  if (typeof entry.sourceName !== 'string' || entry.sourceName.trim().length < 3) {
    errors.push(`Invalid sourceName: "${entry.sourceName}". Must be a non-empty string.`);
  }

  // sourceUrl
  if (typeof entry.sourceUrl !== 'string' || !isValidGovUrl(entry.sourceUrl)) {
    errors.push(`Invalid sourceUrl: "${entry.sourceUrl}". Must be https and hostname must end in .gov.in or .nic.in.`);
  }

  // sourceType
  if (!config.allowedSourceTypes.includes(entry.sourceType)) {
    errors.push(`Invalid sourceType: "${entry.sourceType}". Must be one of: ${config.allowedSourceTypes.join(', ')}.`);
  }

  // effectiveDate
  if (entry.effectiveDate !== null && (typeof entry.effectiveDate !== 'string' || !isValidDateString(entry.effectiveDate))) {
    errors.push(`Invalid effectiveDate: "${entry.effectiveDate}". Must be YYYY-MM-DD or null.`);
  }

  // lastVerified
  if (typeof entry.lastVerified !== 'string' || !isNotFutureDate(entry.lastVerified)) {
    errors.push(`Invalid lastVerified: "${entry.lastVerified}". Must be a valid YYYY-MM-DD date not in the future.`);
  }

  // version
  if (!Number.isInteger(entry.version) || entry.version < 1) {
    errors.push(`Invalid version: ${entry.version}. Must be an integer >= 1.`);
  }

  // status
  if (entry.status !== 'active' && entry.status !== 'superseded') {
    errors.push(`Invalid status: "${entry.status}". Must be "active" or "superseded".`);
  }

  // supersededBy
  if (entry.status === 'superseded') {
    if (typeof entry.supersededBy !== 'string' || !SLUG_REGEX.test(entry.supersededBy)) {
      errors.push(`When status is "superseded", supersededBy must be a valid entry id.`);
    }
  } else {
    if (entry.supersededBy !== null) {
      errors.push(`When status is "active", supersededBy must be null.`);
    }
  }

  // volatile
  if (typeof entry.volatile !== 'boolean') {
    errors.push(`Invalid volatile: must be a boolean.`);
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Validates the complete legalSources.json structure.
 */
export function validateKnowledgeBase(kb, options = { allowTestIds: false }) {
  const errors = [];
  if (!kb || typeof kb !== 'object') {
    return { valid: false, errors: ['Knowledge base must be an object'] };
  }

  if (typeof kb.knowledgeBaseVersion !== 'string' || !SEMVER_REGEX.test(kb.knowledgeBaseVersion)) {
    errors.push(`Invalid knowledgeBaseVersion: "${kb.knowledgeBaseVersion}". Must be semantic version (e.g. 1.0.0).`);
  }

  if (typeof kb.updatedAt !== 'string' || !isValidDateString(kb.updatedAt)) {
    errors.push(`Invalid updatedAt: "${kb.updatedAt}". Must be YYYY-MM-DD.`);
  }

  if (!Array.isArray(kb.entries)) {
    errors.push(`Knowledge base entries must be an array.`);
    return { valid: false, errors };
  }

  const seenIds = new Set();
  kb.entries.forEach((entry, idx) => {
    const entryRes = validateKbEntry(entry, options);
    if (!entryRes.valid) {
      errors.push(`Entry #${idx} (${entry?.id || 'unknown'}): ${entryRes.errors.join('; ')}`);
    }
    if (entry && entry.id) {
      if (seenIds.has(entry.id)) {
        errors.push(`Duplicate entry id found: "${entry.id}".`);
      }
      seenIds.add(entry.id);
    }
  });

  // Verify supersededBy references point to known ids
  kb.entries.forEach((entry) => {
    if (entry.status === 'superseded' && entry.supersededBy) {
      if (!seenIds.has(entry.supersededBy)) {
        errors.push(`Entry "${entry.id}" is supersededBy "${entry.supersededBy}" which does not exist in the knowledge base.`);
      }
    }
  });

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Validates an update/add proposal object.
 */
export function validateProposal(proposal, options = { allowTestIds: false }) {
  const errors = [];
  if (!proposal || typeof proposal !== 'object') {
    return { valid: false, errors: ['Proposal must be an object'] };
  }

  if (proposal.action !== 'add' && proposal.action !== 'update') {
    errors.push(`Proposal action must be "add" or "update". Received: "${proposal.action}".`);
  }

  if (!proposal.entry) {
    errors.push(`Proposal missing "entry" property.`);
  } else {
    const entryRes = validateKbEntry(proposal.entry, options);
    if (!entryRes.valid) {
      errors.push(...entryRes.errors);
    }
  }

  if (!proposal.verification || typeof proposal.verification !== 'object') {
    errors.push(`Proposal missing "verification" object.`);
  } else {
    const { verifiedBy, verifiedOn, note } = proposal.verification;
    if (typeof verifiedBy !== 'string' || verifiedBy.trim().length < 2) {
      errors.push(`verification.verifiedBy must be a non-empty string.`);
    }
    if (typeof verifiedOn !== 'string' || !isNotFutureDate(verifiedOn)) {
      errors.push(`verification.verifiedOn must be a valid date YYYY-MM-DD not in the future.`);
    }
    if (typeof note !== 'string' || note.trim().length < 10) {
      errors.push(`verification.note must describe the verified official page/text (min 10 chars).`);
    }
  }

  if (proposal.action === 'add') {
    if (!Array.isArray(proposal.testCases) || proposal.testCases.length === 0) {
      errors.push(`When action is "add", proposal must include at least one test case in "testCases".`);
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
