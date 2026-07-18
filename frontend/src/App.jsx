import React, { useCallback, useEffect, useRef, useState } from 'react';
import ZoneMap from './components/ZoneMap.jsx';
import ReportForm from './components/ReportForm.jsx';
import ChatAssistant from './components/ChatAssistant.jsx';
import PulseFeed from './components/PulseFeed.jsx';
import { fetchZones, fetchNudges, fetchFeed, fetchScenarios, triggerScenario } from './lib/api.js';

const POLL_MS = 6000;

const NUDGE_META = {
  reroute: { icon: '⚡', label: 'Re-route' },
  'crowd-spread': { icon: '🌊', label: 'Crowd flow' },
  accessibility: { icon: '♿', label: 'Accessibility' },
  eco: { icon: '🌱', label: 'Go green' },
};

const STATUS_COLOR = {
  clear: 'var(--clear)',
  moderate: 'var(--moderate)',
  congested: 'var(--congested)',
  unknown: 'var(--unknown)',
};

export default function App() {
  const [zoneData, setZoneData] = useState([]);
  const [nudges, setNudges] = useState([]);
  const [feed, setFeed] = useState([]);
  const [selected, setSelected] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    try {
      const [zones, nudgeList, feedList] = await Promise.all([
        fetchZones(),
        fetchNudges(),
        fetchFeed(),
      ]);
      setZoneData(zones);
      setNudges(nudgeList);
      setFeed(feedList);
      setLastUpdated(new Date());
      setError(null);
      // keep the detail panel in sync with fresh data
      setSelected(prev => {
        if (!prev) return prev;
        return zones.find(z => z.zone.id === prev.zone.id) ?? prev;
      });
    } catch {
      setError('Could not reach the PulseMap backend.');
    }
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, POLL_MS);
    return () => clearInterval(interval);
  }, [refresh]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header className="app-header">
        <div className="app-header-inner">
          <div className="brand">
            <div className="brand-mark" aria-hidden="true">
              <span className="brand-mark-dot" />
            </div>
            <div>
              <div className="brand-name">PulseMap</div>
              <div className="brand-tag">Crowd-verified stadium intelligence · FIFA World Cup 2026</div>
            </div>
          </div>
          <div className="header-actions">
            <DemoMenu onScenarioRun={refresh} />
            <span className="live-badge">LIVE</span>
          </div>
        </div>
      </header>

      <div className="app-hero" aria-label="Stadium overview">
        <div>
          <span className="hero-eyebrow">FIFA World Cup 2026 · East Rutherford, NJ</span>
          <h1 className="hero-title">MetLife Stadium</h1>
          <p className="hero-sub">Live crowd intelligence — fan-reported, AI-fused, confidence-scored</p>
        </div>
        <div className="hero-stats" role="status" aria-label="Live summary">
          <div className="hero-stat">
            <div className="hero-stat-value">
              {zoneData.filter(z => z.state.status === 'congested').length}
            </div>
            <div className="hero-stat-label">congested zones</div>
          </div>
          <div className="hero-stat">
            <div className="hero-stat-value">{nudges.length}</div>
            <div className="hero-stat-label">active alerts</div>
          </div>
          <div className="hero-stat">
            <div className="hero-stat-value">{feed.length}</div>
            <div className="hero-stat-label">live reports</div>
          </div>
        </div>
      </div>

      <main className="app-main">
        {nudges.length > 0 && (
          <div className="nudge-strip" role="region" aria-label="Live guidance">
            {nudges.slice(0, 3).map(n => {
              const meta = NUDGE_META[n.kind] ?? { icon: '📣', label: 'Update' };
              return (
                <div key={n.id} className={`nudge ${n.kind}`}>
                  <span className="nudge-icon" aria-hidden="true">{meta.icon}</span>
                  <div style={{ flex: 1 }}>
                    <span className="nudge-kind">{meta.label}</span>
                    {n.message}
                  </div>
                  <span
                    style={{
                      flexShrink: 0,
                      fontSize: 10,
                      color: 'var(--text-faint)',
                      paddingLeft: 10,
                      whiteSpace: 'nowrap',
                    }}
                    title={`Triggered by zones: ${n.zoneIds?.join(', ')}`}
                  >
                    fusion engine ↗
                  </span>
                </div>
              );
            })}
          </div>
        )}

        <div className="app-grid">
          <div className="col">
            <ZoneMap
              zoneData={zoneData}
              selectedZoneId={selected?.zone.id}
              onZoneSelect={setSelected}
              lastUpdated={lastUpdated}
              error={error}
            />
            {selected && <ZoneDetail selected={selected} onClose={() => setSelected(null)} />}
            <PulseFeed feed={feed} />
          </div>

          <div className="col">
            <ReportForm onReportSubmitted={refresh} />
            <ChatAssistant />
          </div>
        </div>
      </main>

      <footer className="app-footer">
        PulseMap · Crowd conditions are crowd-sourced estimates, confidence-scored by the fusion
        engine. Always follow official stadium signage and steward instructions.
      </footer>
    </div>
  );
}

function ZoneDetail({ selected, onClose }) {
  const { zone, state } = selected;
  const color = STATUS_COLOR[state.status] ?? STATUS_COLOR.unknown;
  return (
    <section className="card detail" role="region" aria-label="Selected zone details">
      <div className="detail-head">
        <span className="detail-title">{zone.name}</span>
        <button className="icon-btn" onClick={onClose} aria-label="Close zone detail">✕</button>
      </div>
      <dl>
        <dt>Status</dt>
        <dd>
          <span className="badge" style={{ background: `color-mix(in srgb, ${color} 18%, transparent)`, color }}>
            {state.status}
          </span>
        </dd>
        <dt>Confidence</dt>
        <dd>{state.confidenceLabel} ({Math.round(state.confidence * 100)}%)</dd>
        <dt>Reports</dt>
        <dd>{state.supportingReports} supporting · {state.conflictingReports} conflicting</dd>
        <dt>Notes</dt>
        <dd>{state.notes}</dd>
        <dt>Accessible</dt>
        <dd>{zone.accessible ? 'Yes ♿' : 'No'}</dd>
      </dl>
    </section>
  );
}

function DemoMenu({ onScenarioRun }) {
  const [open, setOpen] = useState(false);
  const [scenarios, setScenarios] = useState([]);
  const [running, setRunning] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    fetchScenarios().then(setScenarios).catch(() => setScenarios([]));
  }, []);

  useEffect(() => {
    if (!open) return;
    const close = e => {
      if (!menuRef.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  async function run(id) {
    setRunning(true);
    try {
      await triggerScenario(id);
      await onScenarioRun?.();
    } finally {
      setRunning(false);
      setOpen(false);
    }
  }

  if (scenarios.length === 0) return null;

  return (
    <div className="demo-menu" ref={menuRef}>
      <button
        className="demo-toggle"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        aria-haspopup="menu"
        disabled={running}
      >
        {running ? 'Running…' : '▶ Matchday scenarios'}
      </button>
      {open && (
        <div className="demo-dropdown" role="menu" aria-label="Demo scenarios">
          {scenarios.map(s => (
            <button key={s.id} className="demo-item" role="menuitem" onClick={() => run(s.id)}>
              <strong>{s.name}</strong>
              <span>{s.description}</span>
            </button>
          ))}
          <button className="demo-item reset" role="menuitem" onClick={() => run('reset')}>
            <strong>↺ Reset demo</strong>
            <span>Restore the stadium to its opening state.</span>
          </button>
        </div>
      )}
    </div>
  );
}
