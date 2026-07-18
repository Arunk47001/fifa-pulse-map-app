// Tests for the keyword-based report processor (offline fallback, no LLM required).
// The Claude path is tested separately; these verify the rules layer that always runs
// when the API key is absent — which is also what judges see on a cold demo machine.

import { test } from 'node:test';
import assert from 'node:assert/strict';

// We call the module-private `processWithKeywords` by testing `processReport`
// with CLAUDE_AVAILABLE=false.  Because reportProcessor imports claudeClient at
// module load time we mock it by importing our own fixture.
// Instead, we re-implement the function-under-test inline by importing the raw
// keyword matching through the public processReport export and stubbing the env.

// The simplest safe approach for offline testing: import processReport and ensure
// ANTHROPIC_API_KEY is absent so the keyword fallback runs.
process.env.ANTHROPIC_API_KEY = '';

import { processReport } from '../src/services/reportProcessor.js';

// ─── Zone identification ─────────────────────────────────────────────────────

test('identifies gate-b from "Gate B queue is insane"', async () => {
  const r = await processReport('Gate B queue is insane');
  assert.equal(r.zoneId, 'gate-b');
});

test('identifies gate-c from "elevator not working"', async () => {
  const r = await processReport('elevator not working');
  assert.equal(r.zoneId, 'gate-c');
});

test('identifies gate-d from "Gate D is smooth"', async () => {
  const r = await processReport('Gate D is smooth');
  assert.equal(r.zoneId, 'gate-d');
});

test('identifies transport-hub from "train platform packed"', async () => {
  const r = await processReport('train platform packed');
  assert.equal(r.zoneId, 'transport-hub');
});

test('identifies accessible-amenity from "wheelchair ramp blocked"', async () => {
  const r = await processReport('wheelchair ramp blocked');
  assert.equal(r.zoneId, 'accessible-amenity');
});

test('identifies section-114 from "section 114 is loud"', async () => {
  const r = await processReport('section 114 is loud');
  assert.equal(r.zoneId, 'section-114');
});

test('identifies concourse-north from "north concourse crowded"', async () => {
  const r = await processReport('north concourse crowded');
  assert.equal(r.zoneId, 'concourse-north');
});

test('identifies main-plaza from "main plaza empty"', async () => {
  const r = await processReport('main plaza empty');
  assert.equal(r.zoneId, 'main-plaza');
});

test('identifies gate-b from Spanish "puerta b"', async () => {
  const r = await processReport('La cola en puerta b es muy larga');
  assert.equal(r.zoneId, 'gate-b');
});

test('identifies gate-c from French "porte c"', async () => {
  const r = await processReport('Porte C, ascenseur en panne');
  assert.equal(r.zoneId, 'gate-c');
});

test('throws on unrecognised location', async () => {
  await assert.rejects(
    () => processReport('everything is fine'),
    /valid zone/i
  );
});

// ─── Issue type detection ────────────────────────────────────────────────────

test('detects queue issue type', async () => {
  const r = await processReport('Gate B queue is insane');
  assert.equal(r.issueType, 'queue');
});

test('detects crowd issue type', async () => {
  const r = await processReport('north concourse very crowded and packed');
  assert.equal(r.issueType, 'crowd');
});

test('detects noise issue type', async () => {
  const r = await processReport('section 114 is really loud and noisy');
  assert.equal(r.issueType, 'noise');
});

test('detects accessibility issue type', async () => {
  const r = await processReport('wheelchair ramp blocked');
  assert.equal(r.issueType, 'accessibility');
});

test('detects safety issue type', async () => {
  const r = await processReport('Gate D fight breaking out');
  assert.equal(r.issueType, 'safety');
});

test('falls back to "other" for unrecognised issue', async () => {
  const r = await processReport('Gate B something weird going on');
  assert.equal(r.issueType, 'other');
});

// ─── Severity detection ──────────────────────────────────────────────────────

test('detects high severity from "insane"', async () => {
  const r = await processReport('Gate B queue is insane');
  assert.equal(r.severity, 'high');
});

test('detects high severity from time estimate "30 min"', async () => {
  const r = await processReport('Gate B at least 30 min wait');
  assert.equal(r.severity, 'high');
});

test('detects low severity from "smooth"', async () => {
  const r = await processReport('Gate D totally smooth');
  assert.equal(r.severity, 'low');
});

test('detects low severity from "no wait"', async () => {
  const r = await processReport('Gate D no wait at all');
  assert.equal(r.severity, 'low');
});

test('defaults to medium severity when ambiguous', async () => {
  const r = await processReport('Gate B is a bit busy');
  assert.equal(r.severity, 'medium');
});

// ─── Language hint pass-through ──────────────────────────────────────────────

test('stores provided language hint when Claude is absent', async () => {
  const r = await processReport('La cola en puerta b es muy larga', 'es');
  assert.equal(r.language, 'es');
});

test('defaults language to "en" when no hint given', async () => {
  const r = await processReport('Gate B queue is long');
  assert.equal(r.language, 'en');
});

// ─── Return shape ────────────────────────────────────────────────────────────

test('returned object has all required fields', async () => {
  const r = await processReport('Gate B queue is insane');
  assert.ok('zoneId' in r);
  assert.ok('issueType' in r);
  assert.ok('severity' in r);
  assert.ok('translatedText' in r);
  assert.ok('language' in r);
});

test('translatedText equals rawText in offline mode', async () => {
  const text = 'Gate B queue is long';
  const r = await processReport(text);
  assert.equal(r.translatedText, text);
});
