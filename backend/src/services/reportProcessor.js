import { callClaude, CLAUDE_AVAILABLE } from './claudeClient.js';
import { getZones } from '../models/store.js';

const SYSTEM_PROMPT = `You are a structured data extraction assistant for a stadium crowd-intelligence system.
You will receive a fan-submitted report (possibly in any language). Your job is to:
1. Translate the report to English if needed.
2. Extract structured fields as strict JSON.

Valid zoneIds: will be provided in the user message.
Valid issueTypes: queue | crowd | noise | accessibility | safety | other
Valid severities: low | medium | high

Respond ONLY with a JSON object in this exact format (no markdown, no extra text):
{"zoneId":"<id>","issueType":"<type>","severity":"<level>","translatedText":"<english text>","language":"<detected ISO 639-1 code>"}

If you cannot determine the zone or issue type, set them to null.`;

export async function processReport(rawText, languageHint = null) {
  if (CLAUDE_AVAILABLE) {
    return processWithClaude(rawText, languageHint);
  }
  return processWithKeywords(rawText, languageHint);
}

async function processWithClaude(rawText, languageHint) {
  const zones = getZones();
  const zoneList = zones.map(z => `${z.id} (${z.name})`).join(', ');

  const prompt = `Available zone IDs: ${zoneList}

Fan report:
<report>
${rawText}
</report>

Extract the structured fields. If a language hint is provided, use it: ${languageHint ?? 'none'}.`;

  let responseText;
  try {
    responseText = await callClaude({ system: SYSTEM_PROMPT, prompt });
  } catch (err) {
    throw new Error(`Claude API error: ${err.message}`);
  }

  let parsed;
  try {
    parsed = JSON.parse(responseText.trim());
  } catch {
    throw new Error(`Malformed extraction response: ${responseText}`);
  }

  const validIssueTypes = ['queue', 'crowd', 'noise', 'accessibility', 'safety', 'other'];
  const validSeverities = ['low', 'medium', 'high'];

  if (!parsed.issueType || !validIssueTypes.includes(parsed.issueType)) parsed.issueType = 'other';
  if (!parsed.severity || !validSeverities.includes(parsed.severity)) parsed.severity = 'medium';

  const validZoneIds = getZones().map(z => z.id);
  if (!parsed.zoneId || !validZoneIds.includes(parsed.zoneId)) {
    throw new Error('Could not identify a valid zone. Please mention a specific location (e.g. "Gate B", "North Concourse").');
  }

  return {
    zoneId: parsed.zoneId,
    issueType: parsed.issueType,
    severity: parsed.severity,
    translatedText: parsed.translatedText ?? rawText,
    language: parsed.language ?? (languageHint ?? 'en'),
  };
}

const ZONE_KEYWORDS = [
  { id: 'gate-b',           terms: ['gate b', 'gate-b', 'puerta b', 'porte b', 'tor b'] },
  { id: 'gate-c',           terms: ['gate c', 'gate-c', 'puerta c', 'porte c', 'tor c', 'elevator', 'lift'] },
  { id: 'gate-d',           terms: ['gate d', 'gate-d', 'puerta d', 'porte d', 'tor d'] },
  { id: 'concourse-north',  terms: ['north concourse', 'north corridor', 'concourse north', 'concourse', 'corredor norte', 'hall nord'] },
  { id: 'section-114',      terms: ['section 114', 'sec 114', 'sección 114', '114'] },
  { id: 'transport-hub',    terms: ['transport', 'bus', 'train', 'metro', 'shuttle', 'transit', 'parking'] },
  { id: 'accessible-amenity', terms: ['accessible', 'accessibility', 'wheelchair', 'ramp', 'disabled', 'amenity', 'amenities', 'restroom', 'bathroom', 'toilet'] },
  { id: 'main-plaza',       terms: ['main plaza', 'plaza', 'main entrance', 'entrance', 'main square'] },
];

const ISSUE_KEYWORDS = {
  queue:         ['queue', 'line', 'wait', 'waiting', 'cola', 'fila', 'file d\'attente', 'schlange'],
  crowd:         ['crowd', 'crowded', 'packed', 'full', 'busy', 'congested', 'people', 'overflowing'],
  noise:         ['noise', 'noisy', 'loud', 'sound', 'volume', 'screaming'],
  accessibility: ['elevator', 'lift', 'wheelchair', 'ramp', 'disabled', 'accessible', 'mobility'],
  safety:        ['unsafe', 'dangerous', 'fight', 'emergency', 'incident', 'police', 'security'],
};

const HIGH_TERMS = ['very', 'extremely', 'insane', 'horrible', 'terrible', 'huge', 'massive', 'awful', '20 min', '30 min', 'hour', 'packed', 'broken', 'closed', 'blocked'];
const LOW_TERMS  = ['fine', 'smooth', 'clear', 'short', 'quick', 'fast', 'ok', 'good', 'empty', 'no wait', 'no line', 'moving', 'moved right through', 'no problem'];

function processWithKeywords(rawText, languageHint) {
  const lower = rawText.toLowerCase();

  const zones = getZones();

  let zoneId = null;
  for (const { id, terms } of ZONE_KEYWORDS) {
    if (terms.some(t => lower.includes(t))) { zoneId = id; break; }
  }
  if (!zoneId) {
    for (const zone of zones) {
      if (lower.includes(zone.name.toLowerCase()) || lower.includes(zone.id)) {
        zoneId = zone.id;
        break;
      }
    }
  }
  if (!zoneId) {
    throw new Error('Could not identify a valid zone. Please mention a specific location (e.g. "Gate B", "North Concourse").');
  }

  let issueType = 'other';
  for (const [type, terms] of Object.entries(ISSUE_KEYWORDS)) {
    if (terms.some(t => lower.includes(t))) { issueType = type; break; }
  }

  let severity = 'medium';
  if (HIGH_TERMS.some(t => lower.includes(t))) severity = 'high';
  else if (LOW_TERMS.some(t => lower.includes(t))) severity = 'low';

  return {
    zoneId,
    issueType,
    severity,
    translatedText: rawText,
    language: languageHint ?? 'en',
  };
}
