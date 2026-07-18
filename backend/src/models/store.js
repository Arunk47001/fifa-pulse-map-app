import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const SEED_ZONES = [
  { id: 'gate-b', name: 'Gate B', type: 'gate', coordinates: { x: 120, y: 80 }, accessible: true },
  { id: 'gate-c', name: 'Gate C', type: 'gate', coordinates: { x: 240, y: 80 }, accessible: true },
  { id: 'gate-d', name: 'Gate D', type: 'gate', coordinates: { x: 360, y: 80 }, accessible: true },
  { id: 'concourse-north', name: 'North Concourse', type: 'concourse', coordinates: { x: 240, y: 180 }, accessible: true },
  { id: 'section-114', name: 'Section 114', type: 'section', coordinates: { x: 180, y: 280 }, accessible: false },
  { id: 'transport-hub', name: 'Transport Hub', type: 'transport', coordinates: { x: 300, y: 360 }, accessible: true },
  { id: 'accessible-amenity', name: 'Accessible Amenities (Level 1)', type: 'amenity', coordinates: { x: 120, y: 200 }, accessible: true },
  { id: 'main-plaza', name: 'Main Plaza', type: 'concourse', coordinates: { x: 240, y: 300 }, accessible: true },
];

const seedPath = join(__dirname, '../data/seedReports.json');
const seedReports = JSON.parse(readFileSync(seedPath, 'utf-8'));

// Shift seed timestamps so they appear as if they just happened (within last 25 min)
function freshenTimestamps(rawReports) {
  const times = rawReports.map(r => new Date(r.timestamp).getTime());
  const oldestMs = Math.min(...times);
  const newestMs = Math.max(...times);
  const span = newestMs - oldestMs || 1;
  const nowMs = Date.now();
  return rawReports.map(r => {
    const ratio = (new Date(r.timestamp).getTime() - oldestMs) / span;
    const newTs = new Date(nowMs - (1 - ratio) * 25 * 60 * 1000);
    return { ...r, timestamp: newTs.toISOString() };
  });
}

let zones = [...SEED_ZONES];
let reports = freshenTimestamps(seedReports);

export function getZones() {
  return zones;
}

export function getZoneById(id) {
  return zones.find(z => z.id === id) ?? null;
}

export function getReports() {
  return reports;
}

export function getReportsByZone(zoneId) {
  return reports.filter(r => r.zoneId === zoneId);
}

export function addReport(report) {
  reports.push(report);
}

export function resetToSeed() {
  reports = freshenTimestamps(seedReports);
}
