// Scripted matchday scenarios for live demos. Each scenario injects pre-structured
// reports directly into the store (no LLM calls, no API cost) so the map, nudges,
// and feed visibly react in front of an audience. `minutesAgo` spreads the reports
// over recent time so fusion weighting behaves realistically.

export const SCENARIOS = {
  'gate-b-surge': {
    name: 'Gate B surge',
    description: 'A queue builds fast at Gate B while Gate D stays clear — triggers a re-route nudge.',
    reports: [
      { zoneId: 'gate-b', issueType: 'queue', severity: 'high', minutesAgo: 6, rawText: 'Gate B queue wrapped around the corner, easily 25 minutes' },
      { zoneId: 'gate-b', issueType: 'queue', severity: 'high', minutesAgo: 4, rawText: 'B gate not moving at all, people getting frustrated' },
      { zoneId: 'gate-b', issueType: 'queue', severity: 'high', minutesAgo: 2, rawText: 'Avoid Gate B, huge line' },
      { zoneId: 'gate-d', issueType: 'crowd', severity: 'low', minutesAgo: 5, rawText: 'Gate D totally smooth, walked straight in' },
      { zoneId: 'gate-d', issueType: 'crowd', severity: 'low', minutesAgo: 3, rawText: 'No line at D right now' },
      { zoneId: 'gate-d', issueType: 'queue', severity: 'low', minutesAgo: 1, rawText: 'D gate is the move, 2 minute wait' },
    ],
  },
  'halftime-rush': {
    name: 'Halftime rush',
    description: 'Concourse and plaza flood at the break; the north concourse hits capacity.',
    reports: [
      { zoneId: 'concourse-north', issueType: 'crowd', severity: 'high', minutesAgo: 5, rawText: 'North concourse is wall to wall people' },
      { zoneId: 'concourse-north', issueType: 'crowd', severity: 'high', minutesAgo: 3, rawText: 'Cannot move up here, food lines merging into walkway' },
      { zoneId: 'concourse-north', issueType: 'crowd', severity: 'high', minutesAgo: 1, rawText: 'Concourse north completely jammed' },
      { zoneId: 'main-plaza', issueType: 'crowd', severity: 'low', minutesAgo: 4, rawText: 'Main plaza actually pretty open right now' },
      { zoneId: 'main-plaza', issueType: 'crowd', severity: 'low', minutesAgo: 2, rawText: 'Plenty of space and food trucks on the plaza' },
      { zoneId: 'accessible-amenity', issueType: 'accessibility', severity: 'medium', minutesAgo: 3, rawText: 'Accessible restroom queue growing on level 1' },
      { zoneId: 'accessible-amenity', issueType: 'accessibility', severity: 'medium', minutesAgo: 1, rawText: 'Level 1 accessible facilities getting busy' },
    ],
  },
  'conflicting-reports': {
    name: 'Conflicting reports',
    description: 'Fans disagree about Section 114 — shows the fusion engine flagging low-trust data instead of guessing.',
    reports: [
      { zoneId: 'section-114', issueType: 'crowd', severity: 'high', minutesAgo: 6, rawText: 'Section 114 aisle is dangerously packed' },
      { zoneId: 'section-114', issueType: 'crowd', severity: 'low', minutesAgo: 4, rawText: '114 looks fine to me, plenty of room' },
      { zoneId: 'section-114', issueType: 'crowd', severity: 'high', minutesAgo: 2, rawText: 'Stewards holding people back at 114' },
    ],
  },
  'full-time-exit': {
    name: 'Full-time exit wave',
    description: 'The final whistle sends everyone to the transport hub at once.',
    reports: [
      { zoneId: 'transport-hub', issueType: 'crowd', severity: 'high', minutesAgo: 5, rawText: 'Massive crush heading to the trains' },
      { zoneId: 'transport-hub', issueType: 'queue', severity: 'high', minutesAgo: 3, rawText: 'Platform queue backed up to the stairs' },
      { zoneId: 'transport-hub', issueType: 'crowd', severity: 'high', minutesAgo: 1, rawText: 'Transport hub is shoulder to shoulder' },
      { zoneId: 'main-plaza', issueType: 'crowd', severity: 'medium', minutesAgo: 2, rawText: 'Plaza filling up as people leave' },
    ],
  },
};
