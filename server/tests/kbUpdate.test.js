import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { KnowledgeBaseService } from '../src/services/knowledgeBaseService.js';
import { processChat } from '../src/services/chatService.js';
import { validateProposalCli } from '../scripts/kbValidate.js';
import { applyProposalCli } from '../scripts/kbApply.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const realDataDir = path.resolve(__dirname, '../data');
const fixturesDir = path.resolve(__dirname, 'fixtures');

test('Knowledge Base Update & Responsiveness Workflow (Dimension F)', async (t) => {
  // 1. Create a safe temporary test directory and copy real data to it
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'nyayasetu-kb-test-'));
  fs.cpSync(realDataDir, tempDir, { recursive: true });

  const realSourcesBefore = fs.readFileSync(path.join(realDataDir, 'legalSources.json'), 'utf8');

  t.after(() => {
    // Clean up temporary directory
    fs.rmSync(tempDir, { recursive: true, force: true });
    // Assert real data was NEVER modified
    const realSourcesAfter = fs.readFileSync(path.join(realDataDir, 'legalSources.json'), 'utf8');
    assert.equal(realSourcesBefore, realSourcesAfter, 'Real legalSources.json was modified during testing!');
  });

  const kbService = new KnowledgeBaseService({ dataDir: tempDir, allowTestIds: true });
  const initialVersion = kbService.getVersionInfo().knowledgeBaseVersion;

  // 2. Prior to update: Query about the synthetic rule fails to retrieve it
  const preQuery = "What is the synthetic digital notice rule 99 for synthetic court summons?";
  const preRes = await processChat({
    message: preQuery,
    language: 'en',
    kbService,
    forceStubMode: true
  });

  assert.equal(
    preRes.sources.some(s => s.id === 'test-synthetic-digital-notice'),
    false,
    'Synthetic rule should not exist before update.'
  );

  // 3. Apply valid proposal (synthetic-proposal-add.json)
  const addProposalPath = path.join(fixturesDir, 'synthetic-proposal-add.json');
  const applyRes = await applyProposalCli(addProposalPath, { dataDir: tempDir, allowTestIds: true });

  assert.equal(applyRes.success, true);
  assert.notEqual(applyRes.newVersion, initialVersion);

  // 4. Assert: mtime reload without restart picks up the new rule immediately
  const postRes = await processChat({
    message: preQuery,
    language: 'en',
    kbService,
    forceStubMode: true
  });

  assert.equal(
    postRes.sources.some(s => s.id === 'test-synthetic-digital-notice'),
    true,
    'Synthetic rule must be retrievable after kb:apply without restart.'
  );
  assert.equal(postRes.sources[0].id, 'test-synthetic-digital-notice');

  // Verify changelog was written
  const changelog = kbService.getChangelog(5);
  assert.ok(changelog.some(c => c.entryIds.includes('test-synthetic-digital-notice')));

  // 5. Apply superseding proposal (synthetic-proposal-supersede.json)
  const supersedeProposalPath = path.join(fixturesDir, 'synthetic-proposal-supersede.json');
  const supersedeRes = await applyProposalCli(supersedeProposalPath, { dataDir: tempDir, allowTestIds: true });
  assert.equal(supersedeRes.success, true);

  // Active entries must NOT include the superseded rule
  const activeEntries = kbService.getActiveEntries();
  const oldEntryInActive = activeEntries.some(e => e.id === 'test-synthetic-digital-notice');
  assert.equal(oldEntryInActive, false, 'Superseded entry must not be present in active entries.');

  const supersedingQuery = "What is the new synthetic digital notice rule 99b for synthetic court summons?";
  const postSupersedeRes = await processChat({
    message: supersedingQuery,
    language: 'en',
    kbService,
    forceStubMode: true
  });

  assert.equal(postSupersedeRes.sources[0].id, 'test-synthetic-digital-notice-v2');

  // 6. Test rejection of invalid proposals
  // Bad Domain rejection
  const badDomainPath = path.join(fixturesDir, 'synthetic-proposal-invalid-domain.json');
  const badDomainRes = await validateProposalCli(badDomainPath, { dataDir: tempDir, allowTestIds: true });
  assert.equal(badDomainRes.success, false);

  // Missing fields rejection
  const missingFieldsPath = path.join(fixturesDir, 'synthetic-proposal-missing-fields.json');
  const missingRes = await validateProposalCli(missingFieldsPath, { dataDir: tempDir, allowTestIds: true });
  assert.equal(missingRes.success, false);

  // test- id rejection against REAL data directory (allowTestIds: false)
  const realDirValidation = await validateProposalCli(addProposalPath, { dataDir: realDataDir, allowTestIds: false });
  assert.equal(realDirValidation.success, false, 'test- ids must be rejected against real data directory');
});
