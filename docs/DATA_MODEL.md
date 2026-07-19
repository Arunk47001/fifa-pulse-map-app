# Data Model

## Report (raw input, post-extraction)

```json
{
  "id": "rep_001",
  "zoneId": "gate-b",
  "issueType": "queue" ,        // enum: queue | crowd | noise | accessibility | safety | other
  "severity": "medium",          // enum: low | medium | high
  "rawText": "queue at gate b is like 20 min",
  "language": "en",
  "timestamp": "2026-07-18T14:32:00Z",
  "sourceId": "anon-session-hash"  // rotating session id, not a real identity
}
```

## Zone

```json
{
  "id": "gate-b",
  "name": "Gate B",
  "type": "gate",                // gate | concourse | section | amenity | transport
  "coordinates": { "x": 120, "y": 340 },
  "accessible": true
}
```

## ZoneState (fusion engine output)

```json
{
  "zoneId": "gate-b",
  "status": "congested",          // clear | moderate | congested | unknown
  "confidence": 0.78,             // 0–1
  "confidenceLabel": "verified",  // verified | likely | unverified | conflicting
  "supportingReports": 4,
  "conflictingReports": 1,
  "lastUpdated": "2026-07-18T14:33:10Z",
  "notes": "Majority of recent reports indicate long queue; one older report says clear."
}
```

## Fusion Scoring Rules (deterministic, unit-testable — no LLM involved)

1. **Time decay**: each report's weight decays with age. Suggested simple model:
   `weight = max(0, 1 - (minutesSinceReport / 30))` (report has ~zero weight after 30 min).
2. **Agreement boost**: if ≥3 reports in the same zone within the decay window agree
   on status direction (e.g. all say "congested"), confidence increases.
3. **Conflict handling**: if reports disagree, status = the higher-weighted side, but
   `confidenceLabel` is capped at `"conflicting"` until agreement is reached.
4. **Severity mapping**: `issueType + severity` maps to a zone status via a lookup
   table (e.g. `queue+high → congested`, `accessibility+high → status stays but flagged
   separately as an accessibility alert, shown with priority in the UI`).
5. **Minimum threshold**: fewer than 2 total weighted reports → `status: "unknown"`,
   `confidenceLabel: "unverified"` (don't let a single anonymous report drive a strong
   claim).

This logic should live in its own module (e.g. `backend/src/services/fusionEngine.js`)
with pure functions and no network/LLM calls, so it can be fully unit tested.

## Chat Assistant Input (what gets sent to Gemini for `/api/ask`)

```json
{
  "question": "fastest way to gate D avoiding crowds",
  "userLanguagePreference": "es",
  "accessibilityMode": "plain-language",   // standard | plain-language
  "zoneStatesSnapshot": [ /* array of current ZoneState objects, not raw report text */ ]
}
```

Note: only the fused `ZoneState` snapshot is passed to the assistant prompt — never raw,
unverified report text — so a fan's phrasing can't manipulate the assistant's answer
about a different zone.
