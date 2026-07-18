const DECAY_MINUTES = 30;

const SEVERITY_STATUS = {
  'queue+high': 'congested',
  'queue+medium': 'moderate',
  'queue+low': 'moderate',
  'crowd+high': 'congested',
  'crowd+medium': 'moderate',
  'crowd+low': 'clear',
  'noise+high': 'moderate',
  'noise+medium': 'moderate',
  'noise+low': 'clear',
  'accessibility+high': 'moderate',
  'accessibility+medium': 'moderate',
  'accessibility+low': 'clear',
  'safety+high': 'congested',
  'safety+medium': 'moderate',
  'safety+low': 'moderate',
  'other+high': 'moderate',
  'other+medium': 'moderate',
  'other+low': 'clear',
};

function reportWeight(report, nowMs) {
  const ageMinutes = (nowMs - new Date(report.timestamp).getTime()) / 60000;
  return Math.max(0, 1 - ageMinutes / DECAY_MINUTES);
}

function statusFromReport(report) {
  const key = `${report.issueType}+${report.severity}`;
  return SEVERITY_STATUS[key] ?? 'moderate';
}

const STATUS_RANK = { clear: 0, moderate: 1, congested: 2, unknown: -1 };

export function fuseZone(zoneId, reports, now = new Date()) {
  const nowMs = now.getTime();

  const weighted = reports
    .map(r => ({ report: r, weight: reportWeight(r, nowMs) }))
    .filter(({ weight }) => weight > 0);

  const totalWeight = weighted.reduce((sum, { weight }) => sum + weight, 0);

  if (totalWeight < 0.5 || weighted.length < 2) {
    return {
      zoneId,
      status: 'unknown',
      confidence: 0,
      confidenceLabel: 'unverified',
      supportingReports: weighted.length,
      conflictingReports: 0,
      lastUpdated: now.toISOString(),
      notes: 'Not enough recent reports to determine status.',
    };
  }

  const statusWeights = { clear: 0, moderate: 0, congested: 0 };
  for (const { report, weight } of weighted) {
    const s = statusFromReport(report);
    statusWeights[s] = (statusWeights[s] ?? 0) + weight;
  }

  const dominantStatus = Object.entries(statusWeights).reduce((a, b) =>
    b[1] > a[1] ? b : a
  )[0];

  const dominantWeight = statusWeights[dominantStatus];
  const confidence = dominantWeight / totalWeight;

  const nonDominantWeight = totalWeight - dominantWeight;
  const conflictingCount = weighted.filter(
    ({ report }) => statusFromReport(report) !== dominantStatus
  ).length;
  const supportingCount = weighted.length - conflictingCount;

  let confidenceLabel;
  if (conflictingCount > 0 && confidence < 0.7) {
    confidenceLabel = 'conflicting';
  } else if (weighted.length >= 3 && confidence >= 0.7) {
    confidenceLabel = 'verified';
  } else if (confidence >= 0.5) {
    confidenceLabel = 'likely';
  } else {
    confidenceLabel = 'unverified';
  }

  const notes = buildNotes(dominantStatus, supportingCount, conflictingCount, confidence);

  return {
    zoneId,
    status: dominantStatus,
    confidence: Math.round(confidence * 100) / 100,
    confidenceLabel,
    supportingReports: supportingCount,
    conflictingReports: conflictingCount,
    lastUpdated: now.toISOString(),
    notes,
  };
}

function buildNotes(status, supporting, conflicting, confidence) {
  if (conflicting > 0) {
    return `Mixed reports: ${supporting} agree on ${status}, ${conflicting} disagree. Treat with caution.`;
  }
  if (confidence >= 0.7 && supporting >= 3) {
    return `${supporting} recent reports consistently indicate ${status} conditions.`;
  }
  return `${supporting} report(s) suggest ${status} conditions.`;
}
