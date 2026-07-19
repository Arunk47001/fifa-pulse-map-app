# PulseMap — Live Crowd-Verified Stadium Intelligence

## Challenge
[Challenge 4] Smart Stadiums & Tournament Operations — PromptWars Virtual, FIFA World Cup 2026.

## Chosen Vertical / Persona
**Fans** — navigation, accessibility, multilingual assistance, and real-time decision support.

## The Idea in One Line
GenAI's job here isn't to answer FAQs from a static map. Its job is to **fuse noisy,
real-time reports from fans into one trusted live picture of the stadium** — resolve
contradictions, score confidence, and turn that into navigation and safety guidance.

## Why This Is Different
Most fan-assistant submissions will be retrieval chatbots over static stadium data
("Where is Gate C?"). PulseMap instead treats GenAI as a **sensemaking engine under
uncertainty**:

- Fans submit short reports (voice or text, any language): "queue at Gate B is 20 min",
  "elevator broken near Gate C", "loud/crowded near section 114".
- Gemini transcribes/translates each report and extracts structured facts (location,
  issue type, severity, timestamp, source reliability signal).
- A **fusion engine** cross-checks conflicting reports using plausibility signals
  (recency, report frequency, distance between reported locations, time since kickoff)
  and produces a confidence-scored live state per zone — instead of blindly trusting
  any single report.
- That fused state powers:
  1. A conversational assistant fans query directly ("fastest way to Gate D avoiding
     crowds and noise?").
  2. A live ops briefing feed, reusable by volunteers/organizers (secondary beneficiary,
     not the primary build target for this submission).
- Proactive nudges: "Gate B queue rising — Gate D is ~15 min faster", plus a
  sustainability nudge (public transit vs. car) based on live congestion.

## How This Maps to the Judging Criteria
- **Problem Statement Alignment**: hits navigation, crowd management, accessibility,
  multilingual assistance, and real-time decision support directly from the brief.
- **Code Quality**: clean separation between ingestion, fusion/reasoning, and
  presentation layers (see ARCHITECTURE.md).
- **Security**: no PII stored from anonymous reports; rate-limiting and basic abuse
  filtering on submissions (see ASSUMPTIONS.md).
- **Efficiency**: fusion logic is deterministic/rule-based where possible; Gemini is
  used only where language understanding is actually required (extraction, translation,
  natural-language answers) — not for every step.
- **Testing**: fusion engine is pure logic and unit-testable independent of the LLM
  calls (mockable).
- **Accessibility**: voice-first input, plain-language response mode, high-contrast
  simple UI.

## MVP Scope (hackathon-realistic)
- Simulated fan reports (seed data + a live "submit a report" demo input) — no real
  IoT/stadium sensors required.
- Text input as the primary demo path; voice input via browser Web Speech API as a
  stretch goal if time allows.
- One demo stadium map (simple SVG/zone list), not a full GIS integration.

## Out of Scope (v1)
- Real transit/rideshare API integration (use mocked/estimated data, clearly labeled).
- Real crowd sensors/cameras.
- Multi-stadium/tournament-wide rollout.
