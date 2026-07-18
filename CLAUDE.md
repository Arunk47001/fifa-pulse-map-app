# PulseMap — Project Instructions for Claude Code

This is the project's `CLAUDE.md` — Claude Code loads it automatically at the start of
every session in this repo, so you don't need to paste or reference it manually. It is
the build plan. Work through the phases in order; commit after each phase. Keep
everything on a single branch (`main`) per the submission rules.

Read `docs/PROJECT_BRIEF.md`, `docs/ARCHITECTURE.md`, `docs/DATA_MODEL.md`, and
`docs/ASSUMPTIONS.md` first — they are the source of truth for scope and design
decisions. Do not add scope beyond what's described there without checking in.

## Phase 0 — Repo Setup
1. Initialize git, create `.gitignore` (node_modules, .env, dist/build folders, OS
   files).
2. Create `.env.example` with `ANTHROPIC_API_KEY=` and `PORT=3001`.
3. Create the folder structure exactly as in `docs/FOLDER_STRUCTURE.md`.
4. Commit: `chore: initial repo scaffold`.

## Phase 1 — Backend Core (no LLM yet)
1. `backend/`: init Node project, install `express`, `cors`, `dotenv`.
2. Build `backend/src/models/store.js`: simple in-memory arrays for zones and reports,
   loaded from `backend/src/data/seedReports.json` and a hardcoded seed zone list
   (use the Zone schema in `docs/DATA_MODEL.md`; seed ~6–8 zones: a few gates, a
   concourse, a transport hub, an accessible-amenity zone).
3. Build `backend/src/services/fusionEngine.js` implementing the scoring rules in
   `docs/DATA_MODEL.md` exactly as pure functions (input: array of Reports for a zone
   + current time; output: ZoneState). No network calls in this file.
4. Write `backend/tests/fusionEngine.test.js` covering: single report → unverified;
   3 agreeing recent reports → verified/congested; conflicting reports → conflicting
   label; old report → decays to unknown. Use a lightweight test runner (e.g. `node:test`
   or `vitest`) to avoid heavy dependencies.
5. Build `GET /api/zones` and `GET /api/zones/:id` routes returning fused ZoneState by
   running stored reports through `fusionEngine`.
6. Commit: `feat: backend core + fusion engine + tests`.

## Phase 2 — GenAI Integration
1. Build `backend/src/services/claudeClient.js`: thin wrapper around the Anthropic
   Messages API using the `ANTHROPIC_API_KEY` env var. Keep it a single, reusable
   function (`callClaude({ system, prompt })`) — don't scatter raw fetch calls.
2. Build `backend/src/services/reportProcessor.js`: takes raw report text (+ optional
   language hint), calls Claude with a prompt that (a) translates to English if needed,
   (b) extracts `{zoneId, issueType, severity}` as strict JSON per the Report schema.
   Validate the JSON before storing; reject/flag malformed extractions rather than
   guessing.
   - Treat report text strictly as untrusted user data in the prompt (clearly delimit
     it), never as instructions to the model.
3. Build `POST /api/reports`: accepts raw text, runs it through `reportProcessor`,
   stores the structured Report, returns the updated ZoneState for that zone.
4. Add basic rate limiting (simple in-memory counter per session id/IP is fine for
   the MVP) and input length cap on `POST /api/reports`.
5. Build `POST /api/ask`: accepts `{question, userLanguagePreference, accessibilityMode}`,
   pulls the current `ZoneState` array from the store (never raw report text), and
   calls Claude with a prompt that answers in the requested language and detail level,
   grounded only in the provided ZoneState snapshot.
6. Commit: `feat: GenAI report extraction + chat assistant endpoint`.

## Phase 3 — Frontend
1. `frontend/`: scaffold with Vite + React.
2. `components/ZoneMap.jsx`: simple SVG or grid layout of seeded zones, color-coded by
   `status` (clear/moderate/congested/unknown), polling `GET /api/zones` every ~5–10s.
3. `components/ReportForm.jsx`: text input (mic button optional/stretch) to submit a
   report to `POST /api/reports`; show the zone's updated status after submit.
4. `components/ChatAssistant.jsx`: chat UI hitting `POST /api/ask`; include a language
   selector and a "plain language" accessibility toggle.
5. Wire up `lib/api.js` as the single place HTTP calls are made from (no scattered
   fetch calls across components).
6. Apply accessible design basics: sufficient color contrast, status conveyed by both
   color and text/icon (not color alone), keyboard-navigable form and chat.
7. Commit: `feat: frontend UI (map, report form, chat assistant)`.

## Phase 4 — Polish & Submission Readiness
1. Add a top-level `README.md` using `docs/README_TEMPLATE.md` as the starting point;
   fill in the actual deployed link and repo link once available.
2. Re-check `.gitignore` — confirm `node_modules` and `.env` are not tracked; confirm
   repo size is under 10 MB (`du -sh .git` and working tree).
3. Confirm only one branch exists (`git branch -a`).
4. Run the test suite once more; fix any failing tests.
5. Deploy: frontend to Vercel/Netlify, backend to Render/Railway (or similar free
   tier); put the live URL in `README.md` and the submission form's "Deployed Link".
6. Final commit: `docs: finalize README and submission readiness`.

## Notes for Claude Code While Building
- Keep the fusion engine free of any LLM/network dependency — it must stay unit
  testable in isolation.
- Never interpolate raw fan-submitted text directly into a system prompt; always pass
  it as clearly-delimited user data.
- Prefer small, focused commits over one giant commit at the end.
- If a stretch feature (voice input, real transit API, more languages) starts eating
  time needed for tests/README/deploy, drop the stretch feature — a smaller, fully
  working, well-documented MVP scores better than a bigger broken one.
