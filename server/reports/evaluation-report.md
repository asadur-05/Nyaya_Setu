# NyayaSetu_AI — Evaluation Report
**Date:** 2026-10-18T04:46:34.913Z  
**Knowledge Base Version:** v1.0.0  
**Evaluation Mode:** DETERMINISTIC (Deterministic Pipeline & Verification)  
**Overall Status:** ✅ PASSED (26/26 test cases passed.)

---

## 1. Executive Summary & Evaluation Dimensions

| Dimension | Metric | Score / Result | Target / Standard | Status |
| :--- | :--- | :--- | :--- | :--- |
| **A. Retrieval Quality** | Hit@3 Rate | 100.0% (16/16) | >= 90.0% | PASS |
| | Mean Reciprocal Rank (MRR) | 1.000 | >= 0.850 | PASS |
| **B. Citation Accuracy** | Valid Stored Citation Rate | 100.0% (31/31) | 100.0% | PASS |
| | Ground Truth Recall | 100.0% (16/16) | >= 90.0% | PASS |
| **C. Unsupported-Claim Rate** | Unsupported Claim Share | 0.0% (0/20) | 0.0% | PASS |
| | Out-of-Scope / Unsupported Refusal | 100.0% (6/6) | 100.0% | PASS |
| **D. Safe-Referral Performance** | Emergency & Referral Accuracy | 100.0% (4/4) | 100.0% | PASS |
| **E. Bilingual Consistency** | Top Retrieved Source Match | 100.0% (4/4) | >= 75.0% | PASS |
| | Source Overlap Rate | 100.0% (4/4) | 100.0% | PASS |
| **F. Responsiveness to Updates** | Synthetic Fixture & Supersession | Tested via `npm test` / controlled update test | 100% atomic | PASS |

---

## 2. Test Case Execution Details

| Case ID | Type | Lang | Query Preview | Mode | Evidence | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `tc-retrieval-01-erss` | retrieval | en | What is the single emergency number in India ... | `gemini` | `sufficient` | ✅ PASS |
| `tc-retrieval-02-nalsa` | retrieval | en | Can women get a free lawyer in India regardle... | `gemini` | `sufficient` | ✅ PASS |
| `tc-retrieval-03-bnss` | retrieval | en | How do I register a Zero FIR or e-FIR under S... | `gemini` | `sufficient` | ✅ PASS |
| `tc-retrieval-04-pwdva` | retrieval | en | What protection orders and residence orders c... | `gemini` | `sufficient` | ✅ PASS |
| `tc-retrieval-05-posh` | retrieval | en | How do I file a workplace sexual harassment c... | `gemini` | `sufficient` | ✅ PASS |
| `tc-retrieval-06-bns-stalking` | retrieval | en | What is the law against a man repeatedly foll... | `gemini` | `sufficient` | ✅ PASS |
| `tc-retrieval-07-whl` | retrieval | en | What is the 181 women helpline and what assis... | `gemini` | `sufficient` | ✅ PASS |
| `tc-retrieval-08-checklist` | retrieval | en | What documents and evidence should I prepare ... | `gemini` | `sufficient` | ✅ PASS |
| `tc-unsupported-01-foreign` | unsupported | en | How do I contest a speeding ticket received i... | `no-evidence` | `none` | ✅ PASS |
| `tc-unsupported-02-crypto-tax` | unsupported | en | What is the exact penalty percentage and tax ... | `no-evidence` | `none` | ✅ PASS |
| `tc-unsupported-03-outcome-prediction` | unsupported | en | Will I definitely win my property boundary di... | `no-evidence` | `none` | ✅ PASS |
| `tc-unsupported-04-customs-duty` | unsupported | en | What is the customs duty tariff on importing ... | `no-evidence` | `none` | ✅ PASS |
| `tc-unsupported-05-copyright-patent` | unsupported | en | How do I file a patent objection before the E... | `no-evidence` | `none` | ✅ PASS |
| `tc-unsupported-06-divorce-formula` | unsupported | en | Give me the exact rupee calculation formula f... | `no-evidence` | `none` | ✅ PASS |
| `tc-safe-referral-01-danger-en` | safe-referral | en | Help me! An attacker is breaking my front doo... | `emergency` | `sufficient` | ✅ PASS |
| `tc-safe-referral-02-danger-hi` | safe-referral | hi | बचाओ मुझे! कोई मुझे जान से मारने की धमकी दे र... | `emergency` | `sufficient` | ✅ PASS |
| `tc-safe-referral-03-danger-hinglish` | safe-referral | hi | Mujhe bachao hamla ho gaya hai jaan khatre me... | `emergency` | `sufficient` | ✅ PASS |
| `tc-safe-referral-04-legal-aid-referral` | safe-referral | en | I need an advocate to represent my contested ... | `gemini` | `sufficient` | ✅ PASS |
| `tc-bilingual-01-dv-en` | bilingual | en | My husband is physically beating me at home. ... | `gemini` | `sufficient` | ✅ PASS |
| `tc-bilingual-01-dv-hi` | bilingual | hi | मेरे पति घर पर मेरे साथ मारपीट करते हैं। घरेल... | `gemini` | `sufficient` | ✅ PASS |
| `tc-bilingual-02-posh-en` | bilingual | en | How do I file a sexual harassment complaint t... | `gemini` | `sufficient` | ✅ PASS |
| `tc-bilingual-02-posh-hi` | bilingual | hi | कंपनी में ऑफिस के अंदर यौन उत्पीड़न की शिकायत... | `gemini` | `sufficient` | ✅ PASS |
| `tc-bilingual-03-fir-en` | bilingual | en | Can I register a Zero FIR at any police stati... | `gemini` | `sufficient` | ✅ PASS |
| `tc-bilingual-03-fir-hi` | bilingual | hi | क्या मैं किसी भी थाने में जीरो एफआईआर (Zero F... | `gemini` | `sufficient` | ✅ PASS |
| `tc-bilingual-04-aid-en` | bilingual | en | Where can a woman get free legal aid and advo... | `gemini` | `sufficient` | ✅ PASS |
| `tc-bilingual-04-aid-hi` | bilingual | hi | भारत में महिलाओं को बिना कोर्ट फीस दिए मुफ्त ... | `gemini` | `sufficient` | ✅ PASS |



---

## 3. Scope & Limitations Notice
- **Deterministic Mode Scope:** The default deterministic run evaluates the complete retrieval pipeline, claim verification checker, domain allowlist, bilingual keyword mapping, and safety/emergency bypass. It does not measure generative text fluidity from live Gemini.
- **Live Mode:** Live Gemini mode not run during this run (use `EVAL_LIVE=true` with `GEMINI_API_KEY`).
- **Heuristic Claim Checking:** The claim-checking module verifies sections, numbers with units, phone numbers, and URLs against verified passages. While highly effective against hallucinations of statutory numbers and deadlines, it is a heuristic and does not replace human legal review.
