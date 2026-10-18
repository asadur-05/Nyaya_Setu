import fs from 'node:fs';
import path from 'node:path';
import { processChat } from './chatService.js';
import { defaultKbService } from './knowledgeBaseService.js';
import { verifyClaimsAgainstSources } from '../utils/claimCheck.js';

export async function runEvaluationSuite(options = {}) {
  const kbService = options.kbService || defaultKbService;
  const liveMode = Boolean(options.liveMode);
  const testCasesPath = options.testCasesPath || path.join(kbService.dataDir, 'testCases.json');

  if (!fs.existsSync(testCasesPath)) {
    throw new Error(`Test cases file not found at: ${testCasesPath}`);
  }

  const testCases = JSON.parse(fs.readFileSync(testCasesPath, 'utf8'));
  const kbInfo = kbService.getVersionInfo();
  const allEntries = kbService.getActiveEntries();

  const results = {
    evaluatedAt: new Date().toISOString(),
    knowledgeBaseVersion: kbInfo.knowledgeBaseVersion,
    mode: liveMode ? 'live' : 'deterministic',
    totalCases: testCases.length,
    caseResults: [],
    metrics: {}
  };

  // Group bilingual pairs
  const bilingualPairs = new Map();

  let retrievalHitsAt3 = 0;
  let totalRetrievalCases = 0;
  let reciprocalRankSum = 0;

  let validCitationsCount = 0;
  let totalCitationsCount = 0;
  let groundTruthCasesWithAllExpectedCited = 0;
  let totalGroundTruthCases = 0;

  let totalAnswerProducingCases = 0;
  let answersWithUnsupportedClaims = 0;
  let unsupportedQuestionsCount = 0;
  let unsupportedQuestionsSafelyHandled = 0;

  let safeReferralCasesCount = 0;
  let safeReferralPassCount = 0;

  for (const tc of testCases) {
    const chatRes = await processChat({
      message: tc.question,
      language: tc.language || 'en',
      kbService,
      forceStubMode: !liveMode
    });

    const caseResult = {
      id: tc.id,
      type: tc.type,
      language: tc.language,
      question: tc.question,
      passed: true,
      failures: [],
      responseMode: chatRes.mode,
      evidenceLevel: chatRes.evidenceLevel,
      emergency: chatRes.emergency,
      retrievedSourceIds: chatRes.sources.map(s => s.id)
    };

    // 1. Retrieval Quality Check
    if (tc.expectedSourceIds && tc.expectedSourceIds.length > 0) {
      totalRetrievalCases++;
      let firstRank = 0;

      // Expand expectedSourceIds to include any superseding entry ID
      const effectiveExpectedIds = new Set(tc.expectedSourceIds);
      for (const expId of tc.expectedSourceIds) {
        const entry = kbService.getEntryById(expId);
        if (entry && entry.status === 'superseded' && entry.supersededBy) {
          effectiveExpectedIds.add(entry.supersededBy);
        }
      }

      for (let i = 0; i < chatRes.sources.length; i++) {
        if (effectiveExpectedIds.has(chatRes.sources[i].id)) {
          firstRank = i + 1;
          break;
        }
      }

      if (firstRank > 0 && firstRank <= 3) {
        retrievalHitsAt3++;
        reciprocalRankSum += (1 / firstRank);
      } else {
        caseResult.passed = false;
        caseResult.failures.push(`Expected source(s) [${Array.from(effectiveExpectedIds).join(', ')}] not in top 3 retrieved sources.`);
      }
    }

    // 2. Citation Accuracy Check
    if (chatRes.sources.length > 0) {
      for (const src of chatRes.sources) {
        totalCitationsCount++;
        const originalEntry = allEntries.find(e => e.id === src.id);
        const isValid = originalEntry &&
          originalEntry.sourceUrl === src.url &&
          originalEntry.content.includes(src.excerpt.replace(/\.\.\.$/, ''));

        if (isValid) {
          validCitationsCount++;
        } else {
          caseResult.passed = false;
          caseResult.failures.push(`Citation ${src.id} has mismatched URL or modified excerpt not present in stored content.`);
        }
      }
    }

    if (tc.expectedSourceIds && tc.expectedSourceIds.length > 0) {
      totalGroundTruthCases++;
      const citedIds = new Set(chatRes.sources.map(s => s.id));
      const allCited = tc.expectedSourceIds.every(id => {
        if (citedIds.has(id)) return true;
        const entry = kbService.getEntryById(id);
        if (entry && entry.status === 'superseded' && entry.supersededBy && citedIds.has(entry.supersededBy)) {
          return true;
        }
        return false;
      });

      if (allCited) {
        groundTruthCasesWithAllExpectedCited++;
      } else {
        caseResult.passed = false;
        caseResult.failures.push(`Ground truth case did not cite all expected source IDs.`);
      }
    }

    // 3. Unsupported-claim Rate
    if (chatRes.sources.length > 0 && chatRes.answer) {
      totalAnswerProducingCases++;
      const fullText = `${chatRes.answer} ${chatRes.steps?.map(s => s.text).join(' ')}`;
      const claimCheck = verifyClaimsAgainstSources(fullText, allEntries.filter(e => chatRes.sources.some(s => s.id === e.id)));

      if (!claimCheck.valid) {
        answersWithUnsupportedClaims++;
        caseResult.passed = false;
        caseResult.failures.push(`Claim check failed: ungrounded tokens [${claimCheck.unsupportedClaims.join(', ')}].`);
      }
    }

    if (tc.type === 'unsupported') {
      unsupportedQuestionsCount++;
      const safe = chatRes.evidenceLevel === 'none' || chatRes.mode === 'no-evidence';
      if (safe && chatRes.sources.length === 0) {
        unsupportedQuestionsSafelyHandled++;
      } else {
        caseResult.passed = false;
        caseResult.failures.push(`Unsupported question produced confident answer or non-empty sources.`);
      }
    }

    // 4. Safe-referral Performance
    if (tc.type === 'safe-referral') {
      safeReferralCasesCount++;
      let safeOk = true;

      if (tc.expectedEmergency && (!chatRes.emergency || chatRes.mode !== 'emergency')) {
        safeOk = false;
        caseResult.failures.push(`Emergency danger message failed to trigger emergency mode.`);
      }
      if (tc.expected112Mention && !chatRes.answer.includes('112')) {
        safeOk = false;
        caseResult.failures.push(`Emergency response failed to cite 112 emergency service.`);
      }
      if (tc.expectedReferral && !chatRes.referral) {
        safeOk = false;
        caseResult.failures.push(`Expected legal-aid referral was not returned.`);
      }

      if (safeOk) {
        safeReferralPassCount++;
      } else {
        caseResult.passed = false;
      }
    }

    // 5. Bilingual Consistency Staging
    if (tc.pairId) {
      if (!bilingualPairs.has(tc.pairId)) {
        bilingualPairs.set(tc.pairId, {});
      }
      bilingualPairs.get(tc.pairId)[tc.language] = {
        topSourceId: chatRes.sources[0]?.id || null,
        sources: chatRes.sources.map(s => s.id),
        stepCount: chatRes.steps?.length || 0
      };
    }

    results.caseResults.push(caseResult);
  }

  // 5. Compute Bilingual Consistency
  let totalBilingualPairs = 0;
  let matchingTopSourcePairs = 0;
  let overlappingSourcesPairs = 0;

  for (const [pairId, pairData] of bilingualPairs.entries()) {
    if (pairData.en && pairData.hi) {
      totalBilingualPairs++;
      if (pairData.en.topSourceId && pairData.en.topSourceId === pairData.hi.topSourceId) {
        matchingTopSourcePairs++;
      }
      const enSet = new Set(pairData.en.sources);
      const hasOverlap = pairData.hi.sources.some(id => enSet.has(id));
      if (hasOverlap || (pairData.en.sources.length === 0 && pairData.hi.sources.length === 0)) {
        overlappingSourcesPairs++;
      }
    }
  }

  // Compile final metrics
  results.metrics = {
    retrieval: {
      totalCases: totalRetrievalCases,
      hitAt3Count: retrievalHitsAt3,
      hitAt3Rate: totalRetrievalCases ? (retrievalHitsAt3 / totalRetrievalCases) : 1.0,
      meanReciprocalRank: totalRetrievalCases ? (reciprocalRankSum / totalRetrievalCases) : 1.0
    },
    citation: {
      totalCitations: totalCitationsCount,
      validCitations: validCitationsCount,
      citationAccuracyRate: totalCitationsCount ? (validCitationsCount / totalCitationsCount) : 1.0,
      groundTruthCases: totalGroundTruthCases,
      groundTruthAllCited: groundTruthCasesWithAllExpectedCited,
      groundTruthCitationRate: totalGroundTruthCases ? (groundTruthCasesWithAllExpectedCited / totalGroundTruthCases) : 1.0
    },
    unsupportedClaimRate: {
      totalAnswerProducingCases,
      answersWithUnsupportedClaims,
      unsupportedClaimRate: totalAnswerProducingCases ? (answersWithUnsupportedClaims / totalAnswerProducingCases) : 0.0,
      unsupportedQuestionsCount,
      unsupportedQuestionsSafelyHandled,
      unsupportedQuestionSafetyRate: unsupportedQuestionsCount ? (unsupportedQuestionsSafelyHandled / unsupportedQuestionsCount) : 1.0
    },
    safeReferral: {
      totalCases: safeReferralCasesCount,
      passedCases: safeReferralPassCount,
      passRate: safeReferralCasesCount ? (safeReferralPassCount / safeReferralCasesCount) : 1.0
    },
    bilingualConsistency: {
      totalPairs: totalBilingualPairs,
      matchingTopSourcePairs,
      topSourceMatchRate: totalBilingualPairs ? (matchingTopSourcePairs / totalBilingualPairs) : 1.0,
      overlappingSourcesPairs,
      overlapRate: totalBilingualPairs ? (overlappingSourcesPairs / totalBilingualPairs) : 1.0
    }
  };

  const totalPassed = results.caseResults.filter(c => c.passed).length;
  results.allPassed = totalPassed === results.caseResults.length;
  results.summary = `${totalPassed}/${results.caseResults.length} test cases passed.`;

  return results;
}
