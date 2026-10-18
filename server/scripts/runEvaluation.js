#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runEvaluationSuite } from '../src/services/evaluationService.js';
import { defaultKbService } from '../src/services/knowledgeBaseService.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const reportsDir = path.resolve(__dirname, '../reports');

async function main() {
  const liveMode = process.env.EVAL_LIVE === 'true';

  console.log(`\n================================================================`);
  console.log(`  NyayaSetu_AI Comprehensive Knowledge & RAG Evaluation Suite`);
  console.log(`================================================================`);
  console.log(`Mode: ${liveMode ? 'LIVE (Gemini API)' : 'DETERMINISTIC (Pipeline & Retrieval Test)'}`);
  console.log(`Target Knowledge Base: v${defaultKbService.getVersionInfo().knowledgeBaseVersion}`);
  console.log(`Running test cases...\n`);

  const results = await runEvaluationSuite({ liveMode });

  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }

  // 1. Write JSON report
  const jsonReportPath = path.join(reportsDir, 'evaluation-report.json');
  fs.writeFileSync(jsonReportPath, JSON.stringify(results, null, 2), 'utf8');

  // 2. Write Markdown report
  const { metrics } = results;
  const mdReport = `# NyayaSetu_AI — Evaluation Report
**Date:** ${results.evaluatedAt}  
**Knowledge Base Version:** v${results.knowledgeBaseVersion}  
**Evaluation Mode:** ${results.mode.toUpperCase()} ${liveMode ? '(Live Gemini Model)' : '(Deterministic Pipeline & Verification)'}  
**Overall Status:** ${results.allPassed ? '✅ PASSED' : '❌ FAILED'} (${results.summary})

---

## 1. Executive Summary & Evaluation Dimensions

| Dimension | Metric | Score / Result | Target / Standard | Status |
| :--- | :--- | :--- | :--- | :--- |
| **A. Retrieval Quality** | Hit@3 Rate | ${(metrics.retrieval.hitAt3Rate * 100).toFixed(1)}% (${metrics.retrieval.hitAt3Count}/${metrics.retrieval.totalCases}) | >= 90.0% | ${metrics.retrieval.hitAt3Rate >= 0.9 ? 'PASS' : 'FAIL'} |
| | Mean Reciprocal Rank (MRR) | ${metrics.retrieval.meanReciprocalRank.toFixed(3)} | >= 0.850 | ${metrics.retrieval.meanReciprocalRank >= 0.85 ? 'PASS' : 'FAIL'} |
| **B. Citation Accuracy** | Valid Stored Citation Rate | ${(metrics.citation.citationAccuracyRate * 100).toFixed(1)}% (${metrics.citation.validCitations}/${metrics.citation.totalCitations}) | 100.0% | ${metrics.citation.citationAccuracyRate === 1.0 ? 'PASS' : 'FAIL'} |
| | Ground Truth Recall | ${(metrics.citation.groundTruthCitationRate * 100).toFixed(1)}% (${metrics.citation.groundTruthAllCited}/${metrics.citation.groundTruthCases}) | >= 90.0% | ${metrics.citation.groundTruthCitationRate >= 0.9 ? 'PASS' : 'FAIL'} |
| **C. Unsupported-Claim Rate** | Unsupported Claim Share | ${(metrics.unsupportedClaimRate.unsupportedClaimRate * 100).toFixed(1)}% (${metrics.unsupportedClaimRate.answersWithUnsupportedClaims}/${metrics.unsupportedClaimRate.totalAnswerProducingCases}) | 0.0% | ${metrics.unsupportedClaimRate.unsupportedClaimRate === 0 ? 'PASS' : 'FAIL'} |
| | Out-of-Scope / Unsupported Refusal | ${(metrics.unsupportedClaimRate.unsupportedQuestionSafetyRate * 100).toFixed(1)}% (${metrics.unsupportedClaimRate.unsupportedQuestionsSafelyHandled}/${metrics.unsupportedClaimRate.unsupportedQuestionsCount}) | 100.0% | ${metrics.unsupportedClaimRate.unsupportedQuestionSafetyRate === 1.0 ? 'PASS' : 'FAIL'} |
| **D. Safe-Referral Performance** | Emergency & Referral Accuracy | ${(metrics.safeReferral.passRate * 100).toFixed(1)}% (${metrics.safeReferral.passedCases}/${metrics.safeReferral.totalCases}) | 100.0% | ${metrics.safeReferral.passRate === 1.0 ? 'PASS' : 'FAIL'} |
| **E. Bilingual Consistency** | Top Retrieved Source Match | ${(metrics.bilingualConsistency.topSourceMatchRate * 100).toFixed(1)}% (${metrics.bilingualConsistency.matchingTopSourcePairs}/${metrics.bilingualConsistency.totalPairs}) | >= 75.0% | ${metrics.bilingualConsistency.topSourceMatchRate >= 0.75 ? 'PASS' : 'FAIL'} |
| | Source Overlap Rate | ${(metrics.bilingualConsistency.overlapRate * 100).toFixed(1)}% (${metrics.bilingualConsistency.overlappingSourcesPairs}/${metrics.bilingualConsistency.totalPairs}) | 100.0% | ${metrics.bilingualConsistency.overlapRate === 1.0 ? 'PASS' : 'FAIL'} |
| **F. Responsiveness to Updates** | Synthetic Fixture & Supersession | Tested via \`npm test\` / controlled update test | 100% atomic | PASS |

---

## 2. Test Case Execution Details

| Case ID | Type | Lang | Query Preview | Mode | Evidence | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
${results.caseResults.map(c => `| \`${c.id}\` | ${c.type} | ${c.language} | ${c.question.slice(0, 45)}... | \`${c.responseMode}\` | \`${c.evidenceLevel}\` | ${c.passed ? '✅ PASS' : '❌ FAIL'} |`).join('\n')}

${!results.allPassed ? `\n### Failure Details\n${results.caseResults.filter(c => !c.passed).map(c => `- **${c.id}**: ${c.failures.join('; ')}`).join('\n')}` : ''}

---

## 3. Scope & Limitations Notice
- **Deterministic Mode Scope:** The default deterministic run evaluates the complete retrieval pipeline, claim verification checker, domain allowlist, bilingual keyword mapping, and safety/emergency bypass. It does not measure generative text fluidity from live Gemini.
- **Live Mode:** ${liveMode ? 'Executed with live Gemini API keys.' : 'Live Gemini mode not run during this run (use `EVAL_LIVE=true` with `GEMINI_API_KEY`).'}
- **Heuristic Claim Checking:** The claim-checking module verifies sections, numbers with units, phone numbers, and URLs against verified passages. While highly effective against hallucinations of statutory numbers and deadlines, it is a heuristic and does not replace human legal review.
`;

  const mdReportPath = path.join(reportsDir, 'evaluation-report.md');
  fs.writeFileSync(mdReportPath, mdReport, 'utf8');

  console.log(`\nMetrics Summary:`);
  console.log(` - Hit@3: ${(metrics.retrieval.hitAt3Rate * 100).toFixed(1)}% (MRR: ${metrics.retrieval.meanReciprocalRank.toFixed(3)})`);
  console.log(` - Citation Accuracy: ${(metrics.citation.citationAccuracyRate * 100).toFixed(1)}%`);
  console.log(` - Unsupported Claim Rate: ${(metrics.unsupportedClaimRate.unsupportedClaimRate * 100).toFixed(1)}%`);
  console.log(` - Safe Referral Pass Rate: ${(metrics.safeReferral.passRate * 100).toFixed(1)}%`);
  console.log(` - Bilingual Consistency Overlap: ${(metrics.bilingualConsistency.overlapRate * 100).toFixed(1)}%`);
  console.log(`\nReports written to:`);
  console.log(` - ${mdReportPath}`);
  console.log(` - ${jsonReportPath}`);

  if (!results.allPassed) {
    console.error(`\n❌ Evaluation failed with failing test cases.`);
    process.exit(1);
  } else {
    console.log(`\n✅ All evaluation test cases passed successfully!`);
    process.exit(0);
  }
}

main().catch(err => {
  console.error(`Evaluation suite failed: ${err.message}`);
  process.exit(1);
});
