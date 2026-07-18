# PulseMap — Live Crowd-Verified Stadium Intelligence

**PromptWars Virtual · Challenge 4 — Smart Stadiums & Tournament Operations · FIFA World Cup 2026**

> "Not a smarter FAQ bot. A collective intelligence system that fuses noisy, contradictory crowd reports into one confidence-scored, actionable picture of the stadium — in real time."

---

## The Problem

Every stadium assistant submission answers questions from static data. But the questions fans actually need answered during a match are **dynamic and contested**:

- Is Gate B still backed up, or did it clear 10 minutes ago?
- Three fans said Section 114 is packed; one says it's fine — who's right?
- The elevator was broken an hour ago — is it working now?

A retrieval chatbot over static facts cannot answer these. PulseMap can, because it treats the crowd itself as the sensor network.

---

## What PulseMap Does Differently

| Typical Stadium Chatbot | PulseMap |
|---|---|
| Answers from static, pre-loaded venue data | Answers from a live, fan-contributed snapshot |
| LLM decides everything (hallucination risk) | LLM handles only language tasks; logic is deterministic |
| Single report → single answer | Multiple conflicting reports → confidence-scored consensus |
| Reactive (answer questions) | Proactive (nudges pushed before fans ask) |
| Crowd "simulation" based on time-of-day math | Crowd state from actual submitted reports, cross-validated |

---

## How It Works

```
Fan report (any language)
        ↓
   Claude API  ←─── [extraction + translation only]
        │            "Gate B cola muy larga" → {zoneId: gate-b, issueType: queue, severity: high}
        ↓
  Fusion Engine  ←── [deterministic, no LLM, fully unit tested]
        │            Weight by recency · Agreement · Conflict detection → confidence label
        ↓
   ZoneState    ←── status: congested | confidence: 0.91 | verified (5 reports)
        │
   ┌────┴────┐
   ↓         ↓
Nudge     Claude API  ←── [language answer only, grounded in ZoneState snapshot]
Engine    Assistant        "Gate B is congested (verified). Gate D is clear — ~6 min walk."
   ↓
Proactive alerts pushed to fans
before they ask
```

**Key invariant:** Claude is used exactly twice — once to *extract structure from language*, once to *phrase a pre-computed answer in the user's language*. All decisions (routing, confidence, nudges) are made by deterministic code that is independently testable.

---

## Features

### Live Stadium Map
SVG stadium bowl with per-zone status (color + icon — never color alone), animated pulse rings on congested zones, and a click-through detail panel showing confidence score, supporting vs conflicting report count, and accessibility status.

### Fusion Engine
Weights each report by recency (decays to zero at 30 min), aggregates by zone, detects conflicts, and outputs a confidence label: `verified` (≥3 agreeing, 70%+ weight), `likely`, `conflicting`, or `unverified`. Pure functions, zero LLM dependency, 18 unit tests.

### Proactive Nudge System
Emits targeted guidance from the fused state — without being asked:
- **Re-route**: "Gate B is congested (verified, 5 reports) — Gate D is clear, ~6 min walk."
- **Crowd-spread**: direct fans from packed concourses to calmer zones
- **Accessibility alerts**: flag busy accessible amenities before they become a barrier
- **Eco nudge**: promote public transit while the transport hub is flowing freely

Nudges are suppressed when confidence is `unverified` — the system refuses to mislead.

### Multilingual Report Submission + Voice Input
Fans report in any of 8 languages (English, Spanish, French, German, Portuguese, Arabic, Chinese, Japanese). Claude translates and extracts structured fields. Voice input via Web Speech API matches recognition language to the selected input language.

### Pulse Feed
A live ops ticker showing the most recent structured reports, with severity badges, translation markers, and timestamps — giving organizers a real-time view of the extraction pipeline working on actual fan language.

### Matchday Demo Scenarios
One-click scripted injections for presentations: *Gate B surge*, *Halftime rush*, *Conflicting reports*, *Full-time exit wave*. Each injects pre-structured reports (zero LLM cost), causing the map, nudges, and feed to react live. Judges can see the fusion engine change its confidence signal in real time.

### Conversational Assistant
Answers routing, crowd, and accessibility questions in the user's language, in plain language if requested. Grounded exclusively in the fused ZoneState snapshot — never raw fan text, never hallucinated venue data.

---

## Architecture & Security

**Prompt injection defence:** Fan-submitted report text is always passed as clearly delimited user data (`<report>...</report>`), never interpolated directly into the system prompt. The keyword-based fallback parser treats all input as a plain string — it has zero ability to alter its own decision logic based on text content. Nine security-specific tests verify these properties.

**No PII stored:** Reports are anonymised at the source layer — the store records only a hashed IP segment, not any identifiable information.

**Rate limiting:** 5 reports per IP per 60-second window with a simple in-memory counter. Input is capped at 500 characters before any processing.

**LLM as last mile:** Claude is called only where language understanding is genuinely required. Fusion, routing, nudge generation, and confidence scoring are all deterministic — the LLM cannot be manipulated into producing incorrect zone states.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite 5, plain CSS (no component library) |
| Backend | Node.js 20+, Express 4 |
| AI | Anthropic Claude API (claude-3-5-haiku) |
| Tests | Node.js built-in `node:test` runner, 61 tests |
| Deployment | Vercel (frontend) + Render (backend) |

---

## Running Locally

```bash
# backend
cd backend
cp ../.env.example .env    # paste your ANTHROPIC_API_KEY
npm install
npm run dev                # http://localhost:3001

# frontend (separate terminal)
cd frontend
npm install
npm run dev                # http://localhost:5173
```

Works **without** an API key: the report processor falls back to a keyword extractor, and the assistant generates rule-based answers from the live zone data.

---

## Tests

```bash
cd backend
npm test
```

61 tests across 4 suites, all offline (no API key required):
- `fusionEngine.test.js` — 6 cases: single-report threshold, verified consensus, conflict detection, time decay, mixed-age weighting, empty input
- `nudgeEngine.test.js` — 6 cases: re-route, trust gating, eco nudge, accessibility flag, silent on unknown data, priority ordering
- `reportProcessor.test.js` — 27 cases: all 8 zone identifiers, multilingual keywords (Spanish, French), all 5 issue types, all 3 severities, language hint handling, return shape
- `security.test.js` — 9 cases: prompt injection resistance, JSON payload injection, role-switching text, long input, empty/whitespace, unicode/emoji

---

## Live Demo

- **App:** [TODO — add deployed link before submission]
- **Repo:** [TODO — add GitHub link before submission]

---

## Assumptions

See [`docs/ASSUMPTIONS.md`](docs/ASSUMPTIONS.md) for scope constraints, data model decisions, and what was deliberately left out of the MVP.
