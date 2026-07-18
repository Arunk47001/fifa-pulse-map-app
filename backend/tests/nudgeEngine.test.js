import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeNudges } from '../src/services/nudgeEngine.js';

const NOW = new Date('2026-07-18T15:00:00Z');

function zoneState({ id, name, type, x, y, status, confidenceLabel, supportingReports = 3 }) {
  return {
    zone: { id, name, type, coordinates: { x, y }, accessible: true },
    state: {
      zoneId: id,
      status,
      confidence: 0.9,
      confidenceLabel,
      supportingReports,
      conflictingReports: 0,
      lastUpdated: NOW.toISOString(),
      notes: '',
    },
  };
}

test('congested gate + clear gate → reroute nudge with walk estimate', () => {
  const states = [
    zoneState({ id: 'gate-b', name: 'Gate B', type: 'gate', x: 120, y: 80, status: 'congested', confidenceLabel: 'verified' }),
    zoneState({ id: 'gate-d', name: 'Gate D', type: 'gate', x: 360, y: 80, status: 'clear', confidenceLabel: 'likely' }),
  ];
  const nudges = computeNudges(states, NOW);
  const reroute = nudges.find(n => n.kind === 'reroute');
  assert.ok(reroute, 'expected a reroute nudge');
  assert.deepEqual(reroute.zoneIds, ['gate-b', 'gate-d']);
  assert.match(reroute.message, /Gate D/);
  assert.match(reroute.message, /\d+ min walk/);
});

test('unverified congestion does not trigger a reroute', () => {
  const states = [
    zoneState({ id: 'gate-b', name: 'Gate B', type: 'gate', x: 120, y: 80, status: 'congested', confidenceLabel: 'unverified' }),
    zoneState({ id: 'gate-d', name: 'Gate D', type: 'gate', x: 360, y: 80, status: 'clear', confidenceLabel: 'verified' }),
  ];
  assert.equal(computeNudges(states, NOW).filter(n => n.kind === 'reroute').length, 0);
});

test('clear transport hub → eco nudge; congested hub → wait nudge', () => {
  const clearHub = [zoneState({ id: 'hub', name: 'Transport Hub', type: 'transport', x: 300, y: 360, status: 'clear', confidenceLabel: 'verified' })];
  assert.ok(computeNudges(clearHub, NOW).some(n => n.kind === 'eco'));

  const busyHub = [zoneState({ id: 'hub', name: 'Transport Hub', type: 'transport', x: 300, y: 360, status: 'congested', confidenceLabel: 'verified' })];
  const nudges = computeNudges(busyHub, NOW);
  assert.ok(nudges.some(n => n.id.startsWith('hub-wait')));
  assert.equal(nudges.some(n => n.kind === 'eco'), false);
});

test('busy accessible amenity → accessibility nudge', () => {
  const states = [zoneState({ id: 'amen', name: 'Accessible Amenities', type: 'amenity', x: 120, y: 200, status: 'moderate', confidenceLabel: 'likely' })];
  const nudges = computeNudges(states, NOW);
  assert.ok(nudges.some(n => n.kind === 'accessibility'));
});

test('all zones unknown → no nudges', () => {
  const states = [
    zoneState({ id: 'gate-b', name: 'Gate B', type: 'gate', x: 120, y: 80, status: 'unknown', confidenceLabel: 'unverified' }),
    zoneState({ id: 'hub', name: 'Transport Hub', type: 'transport', x: 300, y: 360, status: 'unknown', confidenceLabel: 'unverified' }),
  ];
  assert.deepEqual(computeNudges(states, NOW), []);
});

test('nudges are sorted by priority (reroute before eco)', () => {
  const states = [
    zoneState({ id: 'gate-b', name: 'Gate B', type: 'gate', x: 120, y: 80, status: 'congested', confidenceLabel: 'verified' }),
    zoneState({ id: 'gate-d', name: 'Gate D', type: 'gate', x: 360, y: 80, status: 'clear', confidenceLabel: 'verified' }),
    zoneState({ id: 'hub', name: 'Transport Hub', type: 'transport', x: 300, y: 360, status: 'clear', confidenceLabel: 'verified' }),
  ];
  const nudges = computeNudges(states, NOW);
  assert.ok(nudges.length >= 2);
  assert.equal(nudges[0].kind, 'reroute');
  assert.equal(nudges[nudges.length - 1].kind, 'eco');
});
