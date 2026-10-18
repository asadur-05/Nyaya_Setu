# NyayaSetu_AI — AI Powered Bilingual Legal Guidance System

**Hackathon:** HACK@BVP 8.0  
**Domain:** Legal Technology, Social Impact, and Accessible Legal Information  
**Target Users:** Citizens in India seeking plain-language, reliable information on legal rights, police procedures, domestic protection, and free legal aid.  
**Languages:** Hindi (Devanagari) and English.

---

## 1. Overview and Core Features

NyayaSetu_AI bridges the critical gap between citizens in India and reliable legal guidance. Rather than behaving as an ungrounded general-purpose chatbot, NyayaSetu_AI is an evidence-grounded, source-backed legal information retrieval and guidance system designed specifically for Indian statutory frameworks and emergency services.

### Key Capabilities
- **Bilingual & Hinglish Comprehension:** Handles questions written in simple English, formal Hindi (Devanagari), and conversational Romanized Hindi (Hinglish).
- **Zero Hallucination Retrieval-Augmented Generation (RAG):** Answers are grounded strictly in curated, official statutory passages (from `indiacode.nic.in`, `nalsa.gov.in`, `112.gov.in`, and `wcd.nic.in`).
- **Autonomous Emergency Safety Bypass:** Detects life threats, active physical violence, or distress calls via independent backend pattern recognition, instantly directing users to Emergency 112 without AI latency or failure points.
- **Server-Side Claim Verification:** Algorithmic heuristic scanner inspects generated answers to ensure that statutory section numbers, numeric deadlines, helplines, and URLs are strictly present in the verified legal sources.
- **Outdated & Transition Warnings:** Flags potential legal transitions and reviews staleness when sources exceed configured validity thresholds.
- **Legal Aid Referrals:** Automatically builds structured referrals to National and District Legal Services Authorities (NALSA/DLSA) for cases requiring court representation.
- **Git-Tracked Knowledge Base with Atomic CLI Updates:** Version-controlled knowledge base updated exclusively via local CLI scripts (`kb:validate` and `kb:apply`) guarded by regression tests.
- **Zero Server-Side Chat Storage:** Respects citizen privacy by retaining conversation turns strictly within the local browser tab.

---

## 2. Abstract Requirements Mapping (R1–R10)

| ID | Requirement | Implementation in NyayaSetu_AI | Status |
| :--- | :--- | :--- | :--- |
| **R1** | Simple Hindi, English, or mixed Hindi-English descriptions | Supported via bilingual tokenization, regex matching, and Devanagari/ASCII digit normalization in `retrievalService.js` and `safetyService.js`. | **Implemented** |
| **R2** | RAG over curated knowledge base of official legal documents & legal aid | Deterministic keyword and metadata relevance engine over `server/data/legalSources.json` containing verified government sources ending in `.gov.in` and `.nic.in`. | **Implemented** |
| **R3** | Understandable, source-linked answers with step-by-step guidance | Answers feature numbered action steps tagged with `[1]`, `[2]` citation chips directly mapped to official government URLs and verified excerpts. | **Implemented** |
| **R4** | Detect insufficient source coverage and potentially outdated information | Identifies out-of-scope/foreign queries and flags sources exceeding staleness thresholds (`staleAfterDays` / volatile windows). | **Implemented** |
| **R5** | Ask for clarification or refer to legal aid instead of inventing laws | Vague queries trigger focused clarification prompts; complex cases return server-built NALSA referrals without inventing procedures. | **Implemented** |
| **R6** | Version-controlled knowledge base | Versioned with semantic versioning (`1.0.0`), tracked in Git, with audit entries in `kbChangelog.json`. | **Implemented** |
| **R7** | Authorized users can update legal information | CLI-only workflow via `npm run kb:validate` and `npm run kb:apply`. | **Implemented** |
| **R8** | Updates validated against predefined test cases | Atomic regression testing runs against candidate knowledge base before any disk commit. | **Implemented** |
| **R9** | Evaluation covers six distinct dimensions | Comprehensive evaluation suite in `scripts/runEvaluation.js` testing retrieval quality, citation accuracy, unsupported-claim rate, safe-referral performance, bilingual consistency, and update responsiveness. | **Implemented** |
| **R10** | General legal information only; not a substitute for a qualified lawyer | Persistent disclaimers displayed in UI navbar, chat window, emergency banner, API responses, and page footer. | **Implemented** |

---

## 3. Architecture & Data Flow

```
                      +------------------------------------------+
                      |         User Browser / Client            |
                      |   (React + Vite + Tailwind CSS v4)       |
                      +--------------------+---------------------+
                                           | HTTP (JSON)
                                           v
+-----------------------------------------------------------------------------------+
| Express Backend (/api)                                                             |
|                                                                                   |
|  [1. Input Validation] ----> [2. Autonomous Safety Check] (Emergency Regex)       |
|                                      |                                            |
|                                      +--> (Emergency Triggered?)                  |
|                                            YES: Returns 112 Hardcoded Package     |
|                                            NO: Continue to Step 3                 |
|                                                                                   |
|  [3. Deterministic Retrieval] <---> [Knowledge Base Service]                      |
|       - Tokenize (EN/HI/Hinglish)        - legalSources.json                      |
|       - Filter superseded laws           - kbChangelog.json                       |
|       - Metadata & keyword scoring       - mtime auto-reload                      |
|                                                                                   |
|  [4. Evidence Assessment]                                                         |
|       - If Out-of-Scope or None: Return Safe Refusal + NALSA Referral             |
|       - If Sufficient or Partial: Proceed to Step 5                               |
|                                                                                   |
|  [5. Generation & Fallback]                                                       |
|       - Live: Gemini SDK (@google/genai) with Structured Output Schema            |
|       - Demo/Timeout/Error: Deterministic Source Passages Fallback                |
|                                                                                   |
|  [6. Post-Generation Claim Verification]                                          |
|       - Check sections, deadlines, helplines, URLs against retrieved text         |
|       - Discard ungrounded source IDs                                             |
|       - Check staleness & legal transitions                                       |
|                                                                                   |
|  [7. Response Builder]                                                            |
|       - Assemble grounded answer, steps, citation chips, referral, disclaimer     |
+-----------------------------------------------------------------------------------+
```

---

## 4. Prerequisites

- **Node.js:** v20 LTS or newer (`node -v` >= 20.0.0; tested on Node v24.21.0).
- **npm:** v9 or newer (`npm -v`).
- **Git:** Installed and available on system path for repository tracking.

---

## 5. Installation & Quick Start

Clone or open the project directory in your terminal:

```bash
cd nyayasetu-ai
```

### Install All Dependencies
```bash
npm run install:all
```
*(Installs root concurrently, server dependencies including `@google/genai`, and client dependencies including Tailwind CSS v4).*

### Run Development Servers (Concurrently)
```bash
npm run dev
```
- **Client Application:** `http://localhost:5173/`
- **Backend API Server:** `http://localhost:3001/`

### Individual Service Scripts
- Run Backend Dev Server only: `npm run dev:server`
- Run Frontend Dev Server only: `npm run dev:client`
- Build Frontend Bundle: `npm run build`
- Start Production Backend: `npm run start`

---

## 6. Environment Configuration

### Backend (`server/.env`)
Copy `server/.env.example` to `server/.env`:

```env
PORT=3001
CLIENT_ORIGIN=http://localhost:5173
GEMINI_API_KEY=
GEMINI_MODEL=gemini-2.5-flash
GEMINI_TIMEOUT_MS=15000
DEMO_MODE=true
STALE_AFTER_DAYS=180
KB_DATA_DIR=
```

- `GEMINI_API_KEY`: Google Gemini API key. If omitted or if `DEMO_MODE=true`, the server runs in grounded Demo/Fallback mode without external network calls.
- `GEMINI_MODEL`: Defaults to `gemini-2.5-flash`.
- `CLIENT_ORIGIN`: Explicit CORS origin (defaults to `http://localhost:5173`).
- `STALE_AFTER_DAYS`: Window before entries are flagged as potentially needing review (halved for `volatile` legal codes like BNSS/BNS).

### Frontend (`client/.env`)
Copy `client/.env.example` to `client/.env`:

```env
VITE_API_BASE_URL=http://localhost:3001
```

*(No secrets or API keys are ever stored on the frontend).*

---

## 7. Knowledge Base Schema & Source Verification

All entries are stored in `server/data/legalSources.json` adhering to `server/src/utils/kbSchema.js`:

```json
{
  "id": "bnss-fir-registration",
  "title": "Registration of First Information Report (FIR) under Section 173 of BNSS, 2023",
  "topic": "FIR Registration",
  "jurisdiction": "India",
  "language": "en",
  "content": "Under Section 173 of the Bharatiya Nagarik Suraksha Sanhita, 2023 (BNSS)...",
  "keywords": ["fir", "zero fir", "efir", "section 173", "bnss", "एफआईआर", "थाना"],
  "sourceName": "India Code, Ministry of Law and Justice",
  "sourceUrl": "https://www.indiacode.nic.in/handle/123456789/21303",
  "sourceType": "legislation",
  "effectiveDate": "2024-07-01",
  "lastVerified": "2026-10-18",
  "version": 1,
  "status": "active",
  "supersededBy": null,
  "volatile": true
}
```

### Verified Official Sources in Baseline KB
1. **ERSS 112 Emergency Assistance:** `https://112.gov.in/` (Single emergency number across India).
2. **NALSA Free Legal Aid for Women:** `https://nalsa.gov.in/womens-assistance/` (Section 12(c) Legal Services Authorities Act, 1987).
3. **BNSS FIR & Zero FIR Registration:** `https://www.indiacode.nic.in/handle/123456789/21303` (Section 173 BNSS 2023).
4. **Domestic Violence Reliefs & Protection Orders:** `https://www.indiacode.nic.in/handle/123456789/2021` (PWDVA 2005).
5. **POSH Workplace Sexual Harassment Redressal:** `https://www.indiacode.nic.in/handle/123456789/2104` (POSH Act 2013).
6. **BNS Stalking & Harassment Provisions:** `https://www.indiacode.nic.in/handle/123456789/21293` (Sections 78 & 79 BNS 2023).
7. **Women Helpline (WHL 181):** `https://wcd.nic.in/` (24x7 crisis coordination).
8. **Legal Aid & Complaint Documentation Checklist:** `https://nalsa.gov.in/` (Procedural evidence requirements).

---

## 8. Authorized Knowledge Base Updates (CLI-Only)

There is **no write HTTP endpoint** and **no admin secret**. Authorization is governed by filesystem write permissions and Git pull request review.

### Step 1: Draft a Proposal File (`proposal.json`)
```json
{
  "action": "add",
  "entry": {
    "id": "tele-law-legal-advice",
    "title": "Tele-Law Scheme for Pre-Litigation Legal Advice",
    "topic": "Pre-Litigation Advice",
    "jurisdiction": "India",
    "language": "en",
    "content": "Tele-Law facilitates delivery of legal advice through Common Services Centres...",
    "keywords": ["tele law", "csc", "pre litigation"],
    "sourceName": "Department of Justice, Government of India",
    "sourceUrl": "https://doj.gov.in/tele-law/",
    "sourceType": "government-portal",
    "effectiveDate": "2017-06-11",
    "lastVerified": "2026-10-18",
    "version": 1,
    "status": "active",
    "supersededBy": null,
    "volatile": false
  },
  "verification": {
    "verifiedBy": "Legal Policy Analyst",
    "verifiedOn": "2026-10-18",
    "note": "Verified against the Department of Justice Tele-Law operational guidelines."
  },
  "testCases": [
    {
      "id": "tc-tele-law",
      "type": "retrieval",
      "language": "en",
      "question": "How can I access pre-litigation legal advice via Tele-Law?",
      "expectedSourceIds": ["tele-law-legal-advice"]
    }
  ]
}
```

### Step 2: Validate the Proposal
```bash
npm run kb:validate -- path/to/proposal.json
```
Performs schema validation, hostname verification (`.gov.in` / `.nic.in` allowlist), and runs regression evaluation against an in-memory candidate KB.

### Step 3: Apply the Proposal
```bash
npm run kb:apply -- path/to/proposal.json --bump=minor
```
- Atomically writes `legalSources.json`.
- Appends changelog record to `kbChangelog.json`.
- Appends test cases to `testCases.json`.
- Automatically reloaded by the running backend via mtime detection without server restarts.

### Step 4: Commit Changes to Git
```bash
git diff data/
git add data/
git commit -m "kb: add tele-law-legal-advice provision"
```

---

## 9. Evaluation Methodology & Metrics

Run the comprehensive evaluation suite:

```bash
npm run test:knowledge
```

### The Six Evaluation Dimensions
1. **A. Retrieval Quality:**
   - **Hit@3:** Proportion of ground-truth test cases where an expected source is present in the top 3 retrieved candidates (Score: **100.0%**).
   - **MRR (Mean Reciprocal Rank):** Average reciprocal rank of the first relevant source (Score: **1.000**).
2. **B. Citation Accuracy:**
   - **Valid Stored Citation Rate:** Percentage of citations referencing valid KB IDs, matching official URLs, and quoting unmodified excerpts from stored content (Score: **100.0%**).
   - **Ground-Truth Recall:** Percentage of test cases where all expected sources are cited (Score: **100.0%**).
3. **C. Unsupported-Claim Rate:**
   - Heuristic check extracting sections, numeric deadlines, helplines, and URLs from answers to ensure every factual claim exists in source passages (Score: **0.0% unsupported claims**).
   - Out-of-scope refusal rate for unsupported/foreign questions (Score: **100.0% safely handled**).
4. **D. Safe-Referral Performance:**
   - Pass rate of immediate emergency trigger (112 link) and legal-aid referrals (Score: **100.0%**).
5. **E. Bilingual Consistency:**
   - Checks that paired English and Hindi queries retrieve matching top sources and overlapping citations (Overlap Score: **100.0%**).
6. **F. Responsiveness to Updates:**
   - Controlled test using a synthetic fixture (`test-synthetic-digital-notice`) in a temporary directory verifying pre-update refusal, post-update retrieval, and supersession behavior (Score: **PASS**).

*Reports generated at:* `server/reports/evaluation-report.md` and `server/reports/evaluation-report.json`.

---

## 10. Automated Tests

Run unit and integration tests:

```bash
npm test
```

Verifies:
- Input validation (empty text, >1000 chars, language whitelist, history limits).
- Emergency detection in English, Devanagari Hindi, and Hinglish.
- Retrieval scoring and out-of-scope filtering.
- Schema validators and proposal validation.
- Unsupported claim scanner and Devanagari digit normalizer.
- End-to-end API endpoints (`/api/health`, `/api/sources`, `/api/chat`).
- Controlled Knowledge Base update responsiveness and rejection of invalid proposals.

---

## 11. Safety, Privacy & Technical Limitations

- **General Information Only:** NyayaSetu_AI provides informational guidance to navigate administrative and legal systems. It does not constitute formal legal representation or legal advice.
- **Jurisdiction:** Strictly configured for the Republic of India under Union legislation.
- **Emergency Limitations:** Keyword-based safety detection acts as an immediate fallback but cannot contact police or dispatch emergency services on the user's behalf.
- **Claim Checking Heuristic:** The claim verification engine guards against fabricated sections, numbers, and helplines, but does not substitute for human legal analysis.

---

## 12. Deployment Instructions

### Backend (Node.js Host)
1. Deploy `server/` to any Node 20+ runtime (e.g., Render, Railway, AWS ECS).
2. Set environment variables: `PORT=3001`, `CLIENT_ORIGIN=https://your-frontend-domain.com`, `GEMINI_API_KEY=your_key`, `DEMO_MODE=false`.
3. Start command: `node src/server.js`.

### Frontend (Static Web Host)
1. In `client/`: run `npm run build`.
2. Deploy the generated `client/dist/` directory to any static hosting provider (e.g., Cloudflare Pages, Vercel, Netlify).
3. Set build environment variable: `VITE_API_BASE_URL=https://your-backend-api-domain.com`.

---

## 13. Unverified / Omitted Topics

In strict adherence to verification rules, the following topics were omitted from the baseline knowledge base:
- **Commercial Tax & Crypto Regulations:** Excluded as unverified and non-pertinent to the social justice mission.
- **International / Foreign Procedures:** Excluded because NyayaSetu_AI is dedicated solely to Indian jurisdiction.
- **State-Specific Police Manuals:** Excluded in baseline 1.0.0; deferred to future state-specific modules.

---

## 14. Future Roadmap
- Semantic hybrid search with local embeddings.
- Regional language expansions (Tamil, Bengali, Marathi, Telugu).
- Direct integration with State Legal Services Authorities (SLSA) roster listings.
