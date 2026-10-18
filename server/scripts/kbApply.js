#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { config } from '../src/utils/config.js';
import { validateProposalCli } from './kbValidate.js';

function bumpSemver(versionStr, bumpType) {
  const parts = versionStr.split('.').map(p => parseInt(p, 10));
  let [major, minor, patch] = parts;

  if (bumpType === 'major') {
    major += 1;
    minor = 0;
    patch = 0;
  } else if (bumpType === 'minor') {
    minor += 1;
    patch = 0;
  } else {
    patch += 1;
  }

  return `${major}.${minor}.${patch}`;
}

export async function applyProposalCli(proposalPath, options = {}) {
  const dataDir = options.dataDir || config.kbDataDir;

  // 1. Run full validation first
  const validationRes = await validateProposalCli(proposalPath, options);
  if (!validationRes.success) {
    throw new Error('Cannot apply proposal: validation checks failed.');
  }

  const { candidateKb, candidateTestCases, proposal } = validationRes;

  // 2. Determine version bump
  const defaultBump = proposal.action === 'add' ? 'minor' : 'patch';
  const chosenBump = options.bump || defaultBump;
  const newKbVersion = bumpSemver(candidateKb.knowledgeBaseVersion, chosenBump);
  const todayStr = new Date().toISOString().slice(0, 10);

  candidateKb.knowledgeBaseVersion = newKbVersion;
  candidateKb.updatedAt = todayStr;

  // 3. Atomically write legalSources.json
  const sourcesPath = path.join(dataDir, 'legalSources.json');
  const tmpSourcesPath = `${sourcesPath}.tmp-${Date.now()}`;
  fs.writeFileSync(tmpSourcesPath, JSON.stringify(candidateKb, null, 2), 'utf8');
  fs.renameSync(tmpSourcesPath, sourcesPath);

  // 4. Append to kbChangelog.json
  const changelogPath = path.join(dataDir, 'kbChangelog.json');
  let changelog = [];
  if (fs.existsSync(changelogPath)) {
    try {
      changelog = JSON.parse(fs.readFileSync(changelogPath, 'utf8'));
    } catch {
      changelog = [];
    }
  }

  const changelogItem = {
    knowledgeBaseVersion: newKbVersion,
    date: todayStr,
    action: proposal.action,
    entryIds: [proposal.entry.id],
    summary: proposal.verification.note || `Applied ${proposal.action} for ${proposal.entry.id}`,
    verifiedBy: proposal.verification.verifiedBy
  };
  changelog.push(changelogItem);

  const tmpChangelogPath = `${changelogPath}.tmp-${Date.now()}`;
  fs.writeFileSync(tmpChangelogPath, JSON.stringify(changelog, null, 2), 'utf8');
  fs.renameSync(tmpChangelogPath, changelogPath);

  // 5. Append new test cases to testCases.json if any
  const testCasesPath = path.join(dataDir, 'testCases.json');
  if (Array.isArray(proposal.testCases) && proposal.testCases.length > 0) {
    const tmpTestPath = `${testCasesPath}.tmp-${Date.now()}`;
    fs.writeFileSync(tmpTestPath, JSON.stringify(candidateTestCases, null, 2), 'utf8');
    fs.renameSync(tmpTestPath, testCasesPath);
  }

  console.log(`\n======================================================`);
  console.log(`  [SUCCESS] Knowledge Base Update Applied!`);
  console.log(`======================================================`);
  console.log(`New Version: v${newKbVersion} (Bump: ${chosenBump})`);
  console.log(`Updated Date: ${todayStr}`);
  console.log(`Entry ID: ${proposal.entry.id} (${proposal.action})`);
  console.log(`Changelog: Appended record to kbChangelog.json`);
  if (Array.isArray(proposal.testCases) && proposal.testCases.length > 0) {
    console.log(`Test Cases: Appended ${proposal.testCases.length} new regression test case(s)`);
  }
  console.log(`\nNext Steps:`);
  console.log(`1. Review the changes using: git diff`);
  console.log(`2. Commit the changes: git add data/ && git commit -m "kb: update ${proposal.entry.id} to v${newKbVersion}"`);

  return {
    success: true,
    newVersion: newKbVersion,
    candidateKb
  };
}

// Standalone CLI execution
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(import.meta.filename || '')) {
  const args = process.argv.slice(2);
  const proposalArg = args.find(a => !a.startsWith('--'));
  const bumpArgMatch = args.find(a => a.startsWith('--bump='));
  const bump = bumpArgMatch ? bumpArgMatch.split('=')[1] : null;

  if (!proposalArg) {
    console.error('Usage: npm run kb:apply -- <path-to-proposal.json> [--bump=major|minor|patch]');
    process.exit(1);
  }

  applyProposalCli(proposalArg, { bump })
    .then(res => {
      if (!res.success) process.exit(1);
    })
    .catch(err => {
      console.error(`\n[ERROR] ${err.message}`);
      process.exit(1);
    });
}
