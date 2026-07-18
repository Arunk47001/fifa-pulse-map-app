import { Router } from 'express';
import { randomUUID } from 'crypto';
import { getZones, getZoneById, getReports, getReportsByZone, addReport, resetToSeed } from '../models/store.js';
import { fuseZone } from '../services/fusionEngine.js';
import { computeNudges } from '../services/nudgeEngine.js';
import { SCENARIOS } from '../data/scenarios.js';

const router = Router();

const FEED_LIMIT = 15;

function fuseAll(now = new Date()) {
  return getZones().map(zone => ({
    zone,
    state: fuseZone(zone.id, getReportsByZone(zone.id), now),
  }));
}

// Live ops feed: most recent structured reports (structured fields + translated text,
// never raw multi-language input beyond what reportProcessor already sanitized).
router.get('/feed', (req, res) => {
  const feed = [...getReports()]
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, FEED_LIMIT)
    .map(r => ({
      id: r.id,
      zoneId: r.zoneId,
      zoneName: getZoneById(r.zoneId)?.name ?? r.zoneId,
      issueType: r.issueType,
      severity: r.severity,
      language: r.language,
      text: r.rawText,
      timestamp: r.timestamp,
    }));
  res.json(feed);
});

router.get('/nudges', (req, res) => {
  res.json(computeNudges(fuseAll()));
});

router.get('/scenarios', (req, res) => {
  res.json(
    Object.entries(SCENARIOS).map(([id, s]) => ({ id, name: s.name, description: s.description }))
  );
});

// Demo-only: inject a scripted wave of pre-structured reports (no LLM involved) so
// the map/nudges/feed react live during a presentation. 'reset' restores seed data.
router.post('/scenario', (req, res) => {
  const { id } = req.body ?? {};

  if (id === 'reset') {
    resetToSeed();
    return res.json({ scenario: 'reset', zones: fuseAll() });
  }

  const scenario = SCENARIOS[id];
  if (!scenario) {
    return res.status(404).json({ error: `Unknown scenario: ${id}` });
  }

  const nowMs = Date.now();
  for (const r of scenario.reports) {
    addReport({
      id: `rep_${randomUUID()}`,
      zoneId: r.zoneId,
      issueType: r.issueType,
      severity: r.severity,
      rawText: r.rawText,
      language: 'en',
      timestamp: new Date(nowMs - r.minutesAgo * 60 * 1000).toISOString(),
      sourceId: 'demo-scenario',
    });
  }

  res.json({ scenario: id, zones: fuseAll(), nudges: computeNudges(fuseAll()) });
});

export default router;
