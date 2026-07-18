const BASE = import.meta.env.VITE_API_URL ?? '/api';

export async function fetchZones() {
  const res = await fetch(`${BASE}/zones`);
  if (!res.ok) throw new Error('Failed to fetch zones');
  return res.json();
}

export async function fetchZone(id) {
  const res = await fetch(`${BASE}/zones/${id}`);
  if (!res.ok) throw new Error('Failed to fetch zone');
  return res.json();
}

export async function submitReport({ text, languageHint }) {
  const res = await fetch(`${BASE}/reports`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, languageHint }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? 'Failed to submit report');
  return data;
}

export async function fetchNudges() {
  const res = await fetch(`${BASE}/pulse/nudges`);
  if (!res.ok) throw new Error('Failed to fetch nudges');
  return res.json();
}

export async function fetchFeed() {
  const res = await fetch(`${BASE}/pulse/feed`);
  if (!res.ok) throw new Error('Failed to fetch feed');
  return res.json();
}

export async function fetchScenarios() {
  const res = await fetch(`${BASE}/pulse/scenarios`);
  if (!res.ok) throw new Error('Failed to fetch scenarios');
  return res.json();
}

export async function triggerScenario(id) {
  const res = await fetch(`${BASE}/pulse/scenario`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? 'Failed to run scenario');
  return data;
}

export async function askAssistant({ question, userLanguagePreference, accessibilityMode }) {
  const res = await fetch(`${BASE}/ask`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question, userLanguagePreference, accessibilityMode }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? 'Assistant unavailable');
  return data;
}
