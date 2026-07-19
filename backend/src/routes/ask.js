import { Router } from 'express';
import { getZones, getReportsByZone } from '../models/store.js';
import { fuseZone } from '../services/fusionEngine.js';
import { callGemini, GEMINI_AVAILABLE } from '../services/geminiClient.js';

const router = Router();

const SYSTEM_PROMPT = `You are PulseMap Assistant, a helpful, multilingual stadium navigation and crowd intelligence assistant at a FIFA World Cup 2026 venue.

You have access to a real-time snapshot of crowd conditions across all stadium zones. Use this data to answer the fan's question accurately and helpfully.

Rules:
- Answer in the language specified by userLanguagePreference (use ISO 639-1 code). If "en", answer in English.
- If accessibilityMode is "plain-language", use simple, short sentences. Avoid jargon.
- Base your answer ONLY on the provided zone state snapshot — do not guess or invent conditions.
- If a zone's status is "unknown", say you don't have enough information about it.
- For accessibility needs, prioritize zones marked as accessible.
- Keep answers concise and action-oriented (1-4 sentences unless more detail is genuinely needed).
- If asked about a route, suggest the least congested path based on the zone data.`;

router.post('/', async (req, res) => {
  const { question, userLanguagePreference = 'en', accessibilityMode = 'standard' } = req.body;

  if (!question || typeof question !== 'string' || question.trim().length === 0) {
    return res.status(400).json({ error: 'Missing required field: question' });
  }
  if (question.length > 500) {
    return res.status(400).json({ error: 'Question too long (max 500 characters)' });
  }

  const zones = getZones();
  const now = new Date();
  const zoneStatesSnapshot = zones.map(zone => ({
    ...fuseZone(zone.id, getReportsByZone(zone.id), now),
    zoneName: zone.name,
    zoneType: zone.type,
    accessible: zone.accessible,
  }));

  let answer;

  if (GEMINI_AVAILABLE) {
    const prompt = `User question: ${question}

User language preference: ${userLanguagePreference}
Accessibility mode: ${accessibilityMode}

Current zone states snapshot:
${JSON.stringify(zoneStatesSnapshot, null, 2)}`;

    try {
      answer = await callGemini({ system: SYSTEM_PROMPT, prompt });
    } catch {
      answer = buildFallbackAnswer(question, zoneStatesSnapshot, accessibilityMode);
    }
  } else {
    answer = buildFallbackAnswer(question, zoneStatesSnapshot, accessibilityMode);
  }

  res.json({ answer, zoneStatesSnapshot, mode: GEMINI_AVAILABLE ? 'ai' : 'fallback' });
});

const STATUS_EMOJI = { clear: '✅', moderate: '🟡', congested: '🔴', unknown: '⚪' };

function buildFallbackAnswer(question, states, accessibilityMode) {
  const q = question.toLowerCase();

  const ranked = [...states]
    .filter(s => s.status !== 'unknown')
    .sort((a, b) => {
      const order = { clear: 0, moderate: 1, congested: 2 };
      return (order[a.status] ?? 3) - (order[b.status] ?? 3);
    });

  const least = ranked[0];
  const most  = ranked[ranked.length - 1];

  const accessibleStates = states.filter(s => s.accessible && s.status !== 'unknown')
    .sort((a, b) => ({ clear: 0, moderate: 1, congested: 2 }[a.status] - ({ clear: 0, moderate: 1, congested: 2 }[b.status])));

  const isAccessibilityQ = /wheelchair|accessible|elevator|lift|ramp|mobility|disabled/.test(q);
  const isRouteQ = /fastest|quickest|best route|avoid|crowds?|shortest|least/.test(q);
  const isCongestionQ = /congested?|busy|crowded|packed|queue|wait/.test(q);
  const isStatusQ = /status|how is|what's.*like|conditions?/.test(q);

  const summary = states.map(s =>
    `${STATUS_EMOJI[s.status]} ${s.zoneName}: ${s.status} (${s.confidenceLabel}, ${s.supportingReports} reports)`
  ).join('\n');

  if (isAccessibilityQ && accessibleStates.length > 0) {
    const best = accessibleStates[0];
    if (accessibilityMode === 'plain-language') {
      return `Best accessible area right now: ${best.zoneName}. It is ${best.status}.\n\nAll zone status:\n${summary}`;
    }
    return `The best accessible route currently passes through **${best.zoneName}** (${best.status}, ${best.confidenceLabel}). ${best.notes}\n\nAll zone status:\n${summary}`;
  }

  if (isRouteQ && least) {
    if (accessibilityMode === 'plain-language') {
      return `Use ${least.zoneName}. It is the least busy right now (${least.status}).\n\nAll zone status:\n${summary}`;
    }
    return `The least congested area right now is **${least.zoneName}** (${least.status}, ${least.confidenceLabel}). ${least.notes}\n\nAll zone status:\n${summary}`;
  }

  if (isCongestionQ && most) {
    if (accessibilityMode === 'plain-language') {
      return `Busiest area: ${most.zoneName} (${most.status}). Avoid it if you can.\n\nAll zone status:\n${summary}`;
    }
    return `The most congested area is **${most.zoneName}** (${most.status}, ${most.confidenceLabel}). ${most.notes}\n\nAll zone status:\n${summary}`;
  }

  if (accessibilityMode === 'plain-language') {
    return `Here is the current crowd status for all areas:\n\n${summary}`;
  }
  return `Here's the current crowd status across all stadium zones:\n\n${summary}\n\nAsk me about specific gates, routes, or accessibility for more targeted help.`;
}

export default router;
