import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fuseZone } from '../src/services/fusionEngine.js';

const NOW = new Date('2026-07-18T15:00:00Z');
const fresh = (minsAgo) =>
  new Date(NOW.getTime() - minsAgo * 60 * 1000).toISOString();

function makeReport(overrides) {
  return {
    id: `rep_${Math.random()}`,
    zoneId: 'test-zone',
    issueType: 'queue',
    severity: 'high',
    language: 'en',
    rawText: 'test',
    sourceId: 'anon-test',
    timestamp: fresh(5),
    ...overrides,
  };
}

test('single report → unverified / unknown (below threshold)', () => {
  const reports = [makeReport({ timestamp: fresh(5) })];
  const state = fuseZone('test-zone', reports, NOW);
  assert.equal(state.status, 'unknown');
  assert.equal(state.confidenceLabel, 'unverified');
});

test('3 agreeing recent reports → verified / congested', () => {
  const reports = [
    makeReport({ timestamp: fresh(5), issueType: 'queue', severity: 'high' }),
    makeReport({ timestamp: fresh(8), issueType: 'queue', severity: 'high' }),
    makeReport({ timestamp: fresh(10), issueType: 'crowd', severity: 'high' }),
  ];
  const state = fuseZone('test-zone', reports, NOW);
  assert.equal(state.status, 'congested');
  assert.equal(state.confidenceLabel, 'verified');
  assert.ok(state.confidence >= 0.7);
});

test('conflicting reports → conflicting label', () => {
  const reports = [
    makeReport({ timestamp: fresh(5), issueType: 'queue', severity: 'high' }),
    makeReport({ timestamp: fresh(6), issueType: 'queue', severity: 'high' }),
    makeReport({ timestamp: fresh(7), issueType: 'crowd', severity: 'low' }),
    makeReport({ timestamp: fresh(8), issueType: 'crowd', severity: 'low' }),
  ];
  const state = fuseZone('test-zone', reports, NOW);
  assert.equal(state.confidenceLabel, 'conflicting');
  assert.ok(state.conflictingReports > 0);
});

test('old report (>30 min) → decays to unknown', () => {
  const reports = [
    makeReport({ timestamp: fresh(31) }),
    makeReport({ timestamp: fresh(35) }),
  ];
  const state = fuseZone('test-zone', reports, NOW);
  assert.equal(state.status, 'unknown');
  assert.equal(state.confidenceLabel, 'unverified');
});

test('mix of recent and old reports uses only recent weight', () => {
  const reports = [
    makeReport({ timestamp: fresh(2), issueType: 'queue', severity: 'high' }),
    makeReport({ timestamp: fresh(3), issueType: 'queue', severity: 'high' }),
    makeReport({ timestamp: fresh(4), issueType: 'queue', severity: 'high' }),
    makeReport({ timestamp: fresh(40), issueType: 'crowd', severity: 'low' }),
  ];
  const state = fuseZone('test-zone', reports, NOW);
  assert.equal(state.status, 'congested');
  assert.equal(state.confidenceLabel, 'verified');
});

test('no reports → unknown', () => {
  const state = fuseZone('test-zone', [], NOW);
  assert.equal(state.status, 'unknown');
  assert.equal(state.confidence, 0);
});
