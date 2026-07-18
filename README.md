# PulseMap — Live Crowd-Verified Stadium Intelligence

Built for **PromptWars Virtual — [Challenge 4] Smart Stadiums & Tournament Operations**
(FIFA World Cup 2026).

## Chosen Vertical
Fans — real-time navigation, accessibility, multilingual assistance, and crowd
awareness during matchday.

## The Problem
Fans need to know what's *actually* happening right now (queues, crowding, blocked
accessible routes) — but any single report from a stadium can be wrong, outdated, or
biased. Simple FAQ chatbots can't handle that uncertainty.

## Our Approach
PulseMap uses GenAI as a **fact extractor and sensemaking layer**, not just a lookup
bot:
1. Fans submit short reports (any language) about conditions at a gate/zone.
2. Claude extracts structured facts from each report (zone, issue type, severity).
3. A deterministic **fusion engine** combines multiple reports per zone — weighting
   by recency and agreement, flagging contradictions — into a confidence-scored live
   status per zone.
4. Fans can ask a conversational assistant for the fastest/most accessible route,
   answered in their language and, optionally, in plain language for accessibility.

See `docs/ARCHITECTURE.md` for the full system design and `docs/DATA_MODEL.md` for
the fusion scoring logic.

## Why This Is Different
Most stadium assistants are retrieval chatbots over static data. PulseMap's core
contribution is the fusion layer: resolving conflicting, noisy human reports into a
trustworthy live signal — which is what "real-time decision support" in the brief
actually requires.

## Tech Stack
- Frontend: React + Vite
- Backend: Node.js + Express
- GenAI: Anthropic Claude API (extraction, translation, conversational answers)
- Data: in-memory store + seed data (no external DB required for this MVP)

## Running Locally
```bash
# backend
cd backend
cp ../.env.example .env   # add your ANTHROPIC_API_KEY
npm install
npm run dev

# frontend (separate terminal)
cd frontend
npm install
npm run dev
```

## Live Demo
- Deployed link: TODO — add before submission
- Repo: TODO — add before submission

## Assumptions
See `docs/ASSUMPTIONS.md`.

## Testing
Fusion engine logic is unit tested independently of any LLM call — see
`backend/tests/fusionEngine.test.js`.

## Team / Credits
TODO
