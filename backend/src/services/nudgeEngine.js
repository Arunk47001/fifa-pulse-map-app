// Proactive nudge engine — pure logic, no network calls (same rule as fusionEngine).
// Input: array of { zone, state } (fused ZoneStates). Output: prioritized nudge list.
//
// Nudges are deterministic and explainable on purpose: judges/ops can trace every
// suggestion back to a fused zone state, and none of this costs an LLM call.

const WALK_MINUTES_PER_UNIT = 1 / 40; // zone coordinates are ~40 units per walking minute

function walkMinutes(zoneA, zoneB) {
  const dx = (zoneA.coordinates?.x ?? 0) - (zoneB.coordinates?.x ?? 0);
  const dy = (zoneA.coordinates?.y ?? 0) - (zoneB.coordinates?.y ?? 0);
  return Math.max(2, Math.round(Math.sqrt(dx * dx + dy * dy) * WALK_MINUTES_PER_UNIT));
}

function isTrusted(state) {
  return state.confidenceLabel === 'verified' || state.confidenceLabel === 'likely';
}

export function computeNudges(zoneStates, now = new Date()) {
  const nudges = [];

  const gates = zoneStates.filter(({ zone }) => zone.type === 'gate');
  const congestedGates = gates.filter(
    ({ state }) => state.status === 'congested' && isTrusted(state)
  );
  const clearGates = gates.filter(
    ({ state }) => state.status === 'clear' && isTrusted(state)
  );

  // 1. Gate re-route: a trusted congested gate + a trusted clear alternative.
  for (const busy of congestedGates) {
    const best = clearGates
      .map(alt => ({ alt, minutes: walkMinutes(busy.zone, alt.zone) }))
      .sort((a, b) => a.minutes - b.minutes)[0];
    if (best) {
      nudges.push({
        id: `reroute-${busy.zone.id}-${best.alt.zone.id}`,
        kind: 'reroute',
        priority: 1,
        zoneIds: [busy.zone.id, best.alt.zone.id],
        message: `${busy.zone.name} is congested (${busy.state.confidenceLabel}, ${busy.state.supportingReports} reports) — ${best.alt.zone.name} is clear, about ${best.minutes} min walk.`,
      });
    }
  }

  // 2. Concourse pressure: point crowds at a calmer concourse-type space.
  const concourses = zoneStates.filter(({ zone }) => zone.type === 'concourse');
  const busyConcourse = concourses.find(
    ({ state }) => state.status === 'congested' && isTrusted(state)
  );
  const calmConcourse = concourses.find(
    ({ state }) => state.status === 'clear' && isTrusted(state)
  );
  if (busyConcourse && calmConcourse) {
    nudges.push({
      id: `spread-${busyConcourse.zone.id}-${calmConcourse.zone.id}`,
      kind: 'crowd-spread',
      priority: 2,
      zoneIds: [busyConcourse.zone.id, calmConcourse.zone.id],
      message: `${busyConcourse.zone.name} is packed — ${calmConcourse.zone.name} has space (about ${walkMinutes(busyConcourse.zone, calmConcourse.zone)} min away).`,
    });
  }

  // 3. Accessibility watch: any accessible amenity trending busy gets flagged early.
  for (const { zone, state } of zoneStates) {
    if (zone.type === 'amenity' && state.status !== 'clear' && state.status !== 'unknown') {
      nudges.push({
        id: `access-${zone.id}`,
        kind: 'accessibility',
        priority: 1,
        zoneIds: [zone.id],
        message: `${zone.name} is reporting ${state.status} conditions — allow extra time or ask a steward for the nearest alternative.`,
      });
    }
  }

  // 4. Sustainability: nudge fans toward transit while the hub is flowing.
  const hub = zoneStates.find(({ zone }) => zone.type === 'transport');
  if (hub && hub.state.status === 'clear' && isTrusted(hub.state)) {
    nudges.push({
      id: `eco-${hub.zone.id}`,
      kind: 'eco',
      priority: 3,
      zoneIds: [hub.zone.id],
      message: `${hub.zone.name} is flowing freely right now — public transit will beat the parking queues after the final whistle.`,
    });
  } else if (hub && hub.state.status === 'congested' && isTrusted(hub.state)) {
    nudges.push({
      id: `hub-wait-${hub.zone.id}`,
      kind: 'crowd-spread',
      priority: 2,
      zoneIds: [hub.zone.id],
      message: `${hub.zone.name} is congested — grabbing food on the concourse for 15 minutes will likely beat standing in the crush.`,
    });
  }

  nudges.sort((a, b) => a.priority - b.priority);
  return nudges.map(n => ({ ...n, generatedAt: now.toISOString() }));
}
