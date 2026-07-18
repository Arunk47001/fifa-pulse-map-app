import React from 'react';

const STATUS_COLOR = {
  clear: 'var(--clear)',
  moderate: 'var(--moderate)',
  congested: 'var(--congested)',
  unknown: 'var(--unknown)',
};

const STATUS_ICON = { clear: '✓', moderate: '~', congested: '!', unknown: '?' };

// Architectural anchor points on the stadium drawing (viewBox 0 0 640 560).
const ZONE_LAYOUT = {
  'gate-b':             { x: 116, y: 118, label: 'Gate B' },
  'gate-c':             { x: 320, y: 52,  label: 'Gate C' },
  'gate-d':             { x: 524, y: 118, label: 'Gate D' },
  'concourse-north':    { x: 320, y: 138, label: 'North Concourse' },
  'accessible-amenity': { x: 512, y: 268, label: 'Accessible L1' },
  'section-114':        { x: 178, y: 300, label: 'Section 114' },
  'main-plaza':         { x: 320, y: 442, label: 'Main Plaza' },
  'transport-hub':      { x: 320, y: 514, label: 'Transport Hub' },
};

export default function ZoneMap({ zoneData, selectedZoneId, onZoneSelect, lastUpdated, error }) {
  return (
    <section className="card" aria-label="Stadium zone map">
      <div className="card-head">
        <h2 className="card-title">Live Stadium View</h2>
        {lastUpdated && (
          <span className="card-sub" aria-live="polite">
            Updated {lastUpdated.toLocaleTimeString()}
          </span>
        )}
      </div>

      {error && <p role="alert" style={{ color: 'var(--congested)', fontSize: 13 }}>{error}</p>}

      <div className="legend" aria-label="Status legend">
        {Object.entries(STATUS_COLOR).map(([status, color]) => (
          <span key={status} className="legend-item">
            <span className="legend-dot" style={{ background: color }} aria-hidden="true" />
            <span style={{ textTransform: 'capitalize' }}>
              {STATUS_ICON[status]} {status}
            </span>
          </span>
        ))}
      </div>

      <svg
        viewBox="0 0 640 560"
        className="stadium-svg"
        role="img"
        aria-label="Stadium map showing live crowd status per zone"
      >
        <defs>
          <linearGradient id="pitch" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#14532d" />
            <stop offset="100%" stopColor="#166534" />
          </linearGradient>
          <radialGradient id="bowl" cx="50%" cy="45%" r="65%">
            <stop offset="0%" stopColor="#1a2440" />
            <stop offset="100%" stopColor="#0b1224" />
          </radialGradient>
        </defs>

        {/* outer bowl + stands */}
        <ellipse cx="320" cy="235" rx="228" ry="168" fill="url(#bowl)" stroke="rgba(148,163,184,0.28)" strokeWidth="2" />
        <ellipse cx="320" cy="235" rx="196" ry="140" fill="none" stroke="rgba(148,163,184,0.14)" strokeWidth="14" strokeDasharray="3 5" />
        <ellipse cx="320" cy="235" rx="166" ry="113" fill="#0e1730" stroke="rgba(148,163,184,0.2)" strokeWidth="1.5" />

        {/* pitch with markings */}
        <rect x="243" y="187" width="154" height="96" rx="6" fill="url(#pitch)" stroke="#4ade80" strokeWidth="1.5" strokeOpacity="0.7" />
        <line x1="320" y1="187" x2="320" y2="283" stroke="#4ade80" strokeWidth="1" strokeOpacity="0.6" />
        <circle cx="320" cy="235" r="14" fill="none" stroke="#4ade80" strokeWidth="1" strokeOpacity="0.6" />
        <rect x="243" y="213" width="18" height="44" fill="none" stroke="#4ade80" strokeWidth="1" strokeOpacity="0.6" />
        <rect x="379" y="213" width="18" height="44" fill="none" stroke="#4ade80" strokeWidth="1" strokeOpacity="0.6" />

        {/* plaza apron + rail line to transport hub */}
        <path d="M 210 430 Q 320 468 430 430" fill="none" stroke="rgba(148,163,184,0.22)" strokeWidth="2" strokeDasharray="5 5" />
        <line x1="140" y1="514" x2="500" y2="514" stroke="rgba(56,189,248,0.4)" strokeWidth="3" strokeDasharray="10 6" />
        <text x="510" y="518" fontSize="10" fill="var(--text-faint)">rail</text>

        {zoneData.map(({ zone, state }) => {
          const layout = ZONE_LAYOUT[zone.id];
          if (!layout) return null;
          const color = STATUS_COLOR[state.status] ?? STATUS_COLOR.unknown;
          const selected = zone.id === selectedZoneId;
          return (
            <g
              key={zone.id}
              className="zone-node"
              transform={`translate(${layout.x}, ${layout.y})`}
              role="button"
              tabIndex={0}
              aria-label={`${zone.name}: ${state.status}, ${state.confidenceLabel}, ${state.supportingReports} supporting reports`}
              onClick={() => onZoneSelect?.({ zone, state })}
              onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && onZoneSelect?.({ zone, state })}
            >
              {state.status === 'congested' && (
                <circle className="pulse-ring" r="17" fill="none" stroke={color} strokeWidth="2" />
              )}
              {selected && <circle r="21" fill="none" stroke="#eef2fb" strokeWidth="1.5" strokeDasharray="3 3" />}
              <circle r="16" fill={color} fillOpacity="0.16" stroke={color} strokeWidth="2" />
              <text y="4.5" textAnchor="middle" fontSize="13" fontWeight="700" fill={color}>
                {STATUS_ICON[state.status] ?? '?'}
              </text>
              <text y="31" textAnchor="middle" fontSize="11" fontWeight="600" fill="var(--text)">
                {layout.label} {zone.accessible ? '♿' : ''}
              </text>
              <text y="43" textAnchor="middle" fontSize="8.5" fill="var(--text-muted)">
                {state.status} · {state.confidenceLabel}
              </text>
            </g>
          );
        })}
      </svg>
    </section>
  );
}
