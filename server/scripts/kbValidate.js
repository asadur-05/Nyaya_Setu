#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { config } from '../src/utils/config.js';
import { validateProposal } from '../src/utils/kbSchema.js';
import { KnowledgeBaseService } from '../src/services/knowledgeBaseService.js';
import { runEvaluationSuite } from '../src/services/evaluationService.js';

export async function validateProposalCli(proposalPath, options = {}) {
  const dataDir = options.dataDir || config.kbDataDir;
  const isRealDataDir = path.resolve(dataDir) === path.resolve(config.kbDataDir);
  const allowTestIds = options.allowTestIds || !isRealDataDir;

  if (!proposalPath || !fs.existsSync(proposalPath)) {
    throw new Error(`Proposal file not found: ${proposalPath}`);
  }

  const rawProposal = fs.readFileSync(proposalPath, 'utf8');
  let proposal;
  try {
    proposal = JSON.parse(rawProposal);
  } catch (err) {
    throw new Error(`Proposal file is not valid JSON: ${err.message}`);
  }

  console.log(`\n======================================================`);
  console.log(`  NyayaSetu_AI Knowledge Base Validation (kb:validate)`);
  console.log(`======================================================`);
  console.log(`Proposal: ${proposalPath}`);
  console.log(`Target KB Directory: ${dataDir}`);
  console.log(`Action: ${proposal.action}`);
  console.log(`Entry ID: ${proposal.entry?.id}`);

  // 1. Validate proposal schema & metadata
  const schemaRes = validateProposal(proposal, { allowTestIds });
  if (!schemaRes.valid) {
    console.error(`\n[FAIL] Proposal schema validation failed:`);
    schemaRes.errors.forEach(err => console.error(` - ${err}`));
    return { success: false, errors: schemaRes.errors };
  }

  // 2. Load existing KB
  const kbService = new KnowledgeBaseService({ dataDir, allowTestIds });
  const currentKb = kbService.getKnowledgeBase();
  const existingEntry = currentKb.entries.find(e => e.id === proposal.entry.id);

  if (proposal.action === 'add' && existingEntry) {
    const msg = `Action is "add" but entry with id "${proposal.entry.id}" already exists.`;
    console.error(`\n[FAIL] ${msg}`);
    return { success: false, errors: [msg] };
  }

  if (proposal.action === 'update' && !existingEntry) {
    const msg = `Action is "update" but entry with id "${proposal.entry.id}" does not exist in knowledge base.`;
    console.error(`\n[FAIL] ${msg}`);
    return { success: false, errors: [msg] };
  }

  // 3. Construct candidate in-memory KB
  const candidateEntries = currentKb.entries.map(e => ({ ...e }));
  if (proposal.action === 'add') {
    candidateEntries.push({ ...proposal.entry });
  } else {
    const idx = candidateEntries.findIndex(e => e.id === proposal.entry.id);
    candidateEntries[idx] = {
      ...proposal.entry,
      version: existingEntry.version + 1
    };
  }

  // Handle superseding if requested in proposal
  if (proposal.supersedesId) {
    const supersededIdx = candidateEntries.findIndex(e => e.id === proposal.supersedesId);
    if (supersededIdx !== -1) {
      candidateEntries[supersededIdx].status = 'superseded';
      candidateEntries[supersededIdx].supersededBy = proposal.entry.id;
    }
  }

  const candidateKb = {
    ...currentKb,
    entries: candidateEntries
  };

  const candidateKbService = new KnowledgeBaseService({
    injectedKb: candidateKb,
    allowTestIds
  });

  // 4. Construct candidate test cases
  const testCasesPath = path.join(dataDir, 'testCases.json');
  let candidateTestCases = [];
  if (fs.existsSync(testCasesPath)) {
    candidateTestCases = JSON.parse(fs.readFileSync(testCasesPath, 'utf8'));
  }
  if (Array.isArray(proposal.testCases)) {
    candidateTestCases = candidateTestCases.concat(proposal.testCases);
  }

  // Write temporary test cases file for evaluation
  const tmpTestCasesPath = path.join(dataDir, `.candidate-tests-${Date.now()}.json`);
  fs.writeFileSync(tmpTestCasesPath, JSON.stringify(candidateTestCases, null, 2), 'utf8');

  let evalResults;
  try {
    evalResults = await runEvaluationSuite({
      kbService: candidateKbService,
      testCasesPath: tmpTestCasesPath,
      liveMode: false
    });
  } finally {
    if (fs.existsSync(tmpTestCasesPath)) {
      fs.unlinkSync(tmpTestCasesPath);
    }
  }

  if (!evalResults.allPassed) {
    console.error(`\n[FAIL] Regression evaluation failed against candidate knowledge base:`);
    const failedCases = evalResults.caseResults.filter(c => !c.passed);
    failedCases.forEach(fc => {
      console.error(` - Case "${fc.id}": ${fc.failures.join('; ')}`);
    });
    return {
      success: false,
      errors: failedCases.map(fc => `${fc.id}: ${fc.failures.join('; ')}`),
      evalResults
    };
  }

  console.log(`\n[PASS] Proposal successfully validated!`);
  console.log(` - Entry Schema: Valid`);
  console.log(` - Source Metadata & Gov Domain: Valid (${proposal.entry.sourceUrl})`);
  console.log(` - Verified On: ${proposal.verification.verifiedOn} by ${proposal.verification.verifiedBy}`);
  console.log(` - Regression Evaluation: ${evalResults.summary}`);
  console.log(`\nYou may now apply this update with: npm run kb:apply -- ${proposalPath}`);

  return {
    success: true,
    candidateKb,
    candidateTestCases,
    proposal
  };
}

// Standalone CLI execution
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(import.meta.filename || '')) {
  const proposalArg = process.argv.slice(2).find(arg => !arg.startsWith('--'));
  if (!proposalArg) {
    console.error('Usage: npm run kb:validate -- <path-to-proposal.json>');
    process.exit(1);
  }

  validateProposalCli(proposalArg)
    .then(res => {
      if (!res.success) process.exit(1);
    })
    .catch(err => {
      console.error(`\n[ERROR] ${err.message}`);
      process.exit(1);
    });
}
