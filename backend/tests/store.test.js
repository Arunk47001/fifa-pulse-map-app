import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { getZones, getZoneById, getReports, getReportsByZone, addReport, resetToSeed } from '../src/models/store.js';

function makeReport(overrides = {}) {
  return {
    id: `rep_test_${Math.random().toString(36).slice(2)}`,
    zoneId: 'gate-b',
    issueType: 'queue',
    severity: 'high',
    rawText: 'Test report',
    language: 'en',
    timestamp: new Date().toISOString(),
    sourceId: 'anon-test',
    ...overrides,
  };
}

// Reset to seed data before each test so tests are isolated.
// (Node's built-in test runner doesn't have beforeEach — emulate with helper fn.)

test('getZones returns a non-empty array', () => {
  resetToSeed();
  const zones = getZones();
  assert.ok(Array.isArray(zones));
  assert.ok(zones.length > 0);
});

test('getZones includes expected zone ids', () => {
  resetToSeed();
  const ids = getZones().map(z => z.id);
  const required = ['gate-b', 'gate-c', 'gate-d', 'transport-hub', 'accessible-amenity'];
  for (const id of required) {
    assert.ok(ids.includes(id), `expected zone id "${id}"`);
  }
});

test('getZones zones have required fields', () => {
  resetToSeed();
  for (const zone of getZones()) {
    assert.ok(zone.id, 'zone.id missing');
    assert.ok(zone.name, 'zone.name missing');
    assert.ok(zone.type, 'zone.type missing');
    assert.ok('accessible' in zone, 'zone.accessible missing');
  }
});

test('getZoneById returns the correct zone', () => {
  resetToSeed();
  const zone = getZoneById('gate-b');
  assert.ok(zone);
  assert.equal(zone.id, 'gate-b');
  assert.equal(zone.name, 'Gate B');
});

test('getZoneById returns null for unknown id', () => {
  resetToSeed();
  assert.equal(getZoneById('nonexistent-zone'), null);
});

test('getZoneById returns null for empty string', () => {
  resetToSeed();
  assert.equal(getZoneById(''), null);
});

test('getReports returns array', () => {
  resetToSeed();
  assert.ok(Array.isArray(getReports()));
});

test('getReports contains seed data after reset', () => {
  resetToSeed();
  assert.ok(getReports().length > 0);
});

test('addReport appends to the store', () => {
  resetToSeed();
  const before = getReports().length;
  const report = makeReport({ id: 'rep_unique_add_test' });
  addReport(report);
  assert.equal(getReports().length, before + 1);
});

test('addReport makes the report retrievable by zone', () => {
  resetToSeed();
  const report = makeReport({ id: 'rep_zone_test', zoneId: 'gate-d' });
  addReport(report);
  const zoneReports = getReportsByZone('gate-d');
  assert.ok(zoneReports.some(r => r.id === 'rep_zone_test'));
});

test('getReportsByZone returns only reports for that zone', () => {
  resetToSeed();
  const zone = 'gate-b';
  const reports = getReportsByZone(zone);
  assert.ok(reports.every(r => r.zoneId === zone));
});

test('getReportsByZone returns empty array for zone with no reports', () => {
  resetToSeed();
  // Fresh zone id that has no seed data
  assert.deepEqual(getReportsByZone('nonexistent-zone'), []);
});

test('resetToSeed removes reports added after seed', () => {
  resetToSeed();
  const before = getReports().length;
  addReport(makeReport({ id: 'rep_to_be_removed' }));
  assert.equal(getReports().length, before + 1);
  resetToSeed();
  assert.equal(getReports().length, before);
});

test('reports have fresh timestamps after resetToSeed (within last 30 min)', () => {
  resetToSeed();
  const nowMs = Date.now();
  const thirtyMinMs = 30 * 60 * 1000;
  for (const r of getReports()) {
    const age = nowMs - new Date(r.timestamp).getTime();
    assert.ok(age >= 0, `report timestamp ${r.timestamp} is in the future`);
    assert.ok(age <= thirtyMinMs, `report timestamp ${r.timestamp} is older than 30 minutes`);
  }
});
