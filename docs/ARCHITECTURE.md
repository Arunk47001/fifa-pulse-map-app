# Architecture

## Tech Stack (kept intentionally light for a hackathon timeline)

| Layer          | Choice                                   | Why |
|----------------|-------------------------------------------|-----|
| Frontend       | React + Vite (plain, no heavy framework)  | Fast to build, easy to deploy as static site |
| Backend        | Node.js + Express                         | Simple REST API, easy to reason about, easy to test |
| GenAI          | Google Gemini API                         | Report extraction, translation, natural-language Q&A |
| Data store     | In-memory store + JSON seed file (v1)     | Zero infra setup; swappable for SQLite/Postgres later |
| Deployment     | Frontend: Firebase Hosting. Backend: Render (free tier) | Both give a public "Deployed Link" quickly, no billing account needed |

No database server is required for the MVP — this keeps the repo small (well under the
10 MB limit) and removes a whole class of setup/security problems for a short build.

## System Flow

```
 Fan (voice/text report)
        │
        ▼
 [Frontend: Report Submission UI]
        │  POST /api/reports
        ▼
 [Backend: Report Ingestion Service]
        │  calls Gemini: transcribe/translate + extract structured fields
        ▼
 [Structured Report: {zone, issueType, severity, timestamp, rawText, lang}]
        │
        ▼
 [Fusion Engine] ── deterministic scoring logic (NOT an LLM call)
        │  combines multiple reports per zone → confidence-scored ZoneState
        ▼
 [Zone State Store] (in-memory, keyed by zone id)
        │
        ├──► [Frontend: Live Map / Status View] (poll or simple websocket)
        │
        └──► [Chat Assistant Endpoint] POST /api/ask
                   │  calls Gemini with: user question + current ZoneState snapshot
                   ▼
             Natural-language, multilingual answer + route suggestion
```

## Why the Fusion Engine Is Separate From the LLM Call
This is the core "unique" design decision — worth calling out explicitly in the README
and demo:

- The **LLM extracts facts** from unstructured input (any language, messy phrasing).
- The **fusion engine reasons over facts** using deterministic, explainable rules:
  - Recency weighting (older reports decay in confidence).
  - Agreement weighting (multiple independent reports on the same zone raise
    confidence; a lone outlier report is flagged as "unverified").
  - Contradiction handling (conflicting reports on the same zone within a short
    window → confidence capped at "uncertain" until more reports arrive).
- The **LLM again converts the fused state into a natural-language answer** for the
  fan, in their language, at their requested accessibility level (plain-language mode).

Keeping the fusion logic out of the LLM is a deliberate quality/security/testability
choice: it's cheaper, faster, deterministic, unit-testable, and not vulnerable to
prompt injection through report text (a malicious report can't talk the LLM into
falsely marking a gate as "safe" — the scoring math doesn't take instructions from
report content).

## API Surface (v1)

- `POST /api/reports` — submit a fan report (text; audio optional stretch goal)
- `GET /api/zones` — current fused state of all zones
- `GET /api/zones/:id` — current fused state of one zone
- `POST /api/ask` — ask the assistant a question, returns natural-language answer
- `GET /api/health` — health check

## Security Notes (relevant to the "Security" grading criterion)
- No account/login required → no PII collection by default.
- Reports are rate-limited per client (basic IP/session throttle) to reduce spam/abuse.
- All report text is treated as untrusted input: it is only ever used as *data* passed
  to the LLM for extraction, never concatenated into system-level instructions.
- Input length capped; basic profanity/abuse filter before storage.
- Environment secrets (API keys) via `.env`, never committed — see `.env.example`.
