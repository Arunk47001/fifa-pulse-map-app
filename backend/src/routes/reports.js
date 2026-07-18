import { Router } from 'express';
import { randomUUID } from 'crypto';
import { addReport, getReportsByZone, getZoneById } from '../models/store.js';
import { processReport } from '../services/reportProcessor.js';
import { fuseZone } from '../services/fusionEngine.js';

const router = Router();

const MAX_TEXT_LENGTH = 500;
const RATE_WINDOW_MS = 60 * 1000;
const RATE_LIMIT = 5;

const rateCounts = new Map();

function getRateKey(req) {
  return req.ip ?? req.socket?.remoteAddress ?? 'unknown';
}

function checkRateLimit(req) {
  const key = getRateKey(req);
  const now = Date.now();
  const entry = rateCounts.get(key) ?? { count: 0, windowStart: now };

  if (now - entry.windowStart > RATE_WINDOW_MS) {
    entry.count = 0;
    entry.windowStart = now;
  }

  entry.count += 1;
  rateCounts.set(key, entry);
  return entry.count <= RATE_LIMIT;
}

router.post('/', async (req, res) => {
  if (!checkRateLimit(req)) {
    return res.status(429).json({ error: 'Too many reports. Please wait a minute.' });
  }

  const { text, languageHint } = req.body;

  if (!text || typeof text !== 'string') {
    return res.status(400).json({ error: 'Missing required field: text' });
  }
  if (text.trim().length === 0) {
    return res.status(400).json({ error: 'Report text cannot be empty' });
  }
  if (text.length > MAX_TEXT_LENGTH) {
    return res.status(400).json({ error: `Report text too long (max ${MAX_TEXT_LENGTH} characters)` });
  }

  let extracted;
  try {
    extracted = await processReport(text, languageHint ?? null);
  } catch (err) {
    return res.status(422).json({ error: err.message });
  }

  const report = {
    id: `rep_${randomUUID()}`,
    zoneId: extracted.zoneId,
    issueType: extracted.issueType,
    severity: extracted.severity,
    rawText: extracted.translatedText,
    language: extracted.language,
    timestamp: new Date().toISOString(),
    sourceId: `anon-${getRateKey(req).split('.').join('-')}`,
  };

  addReport(report);

  const zone = getZoneById(extracted.zoneId);
  const state = fuseZone(extracted.zoneId, getReportsByZone(extracted.zoneId), new Date());

  res.status(201).json({ report, zone, state });
});

export default router;
