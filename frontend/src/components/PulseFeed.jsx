import React from 'react';

function timeAgo(ts) {
  const mins = Math.round((Date.now() - new Date(ts).getTime()) / 60000);
  if (mins < 1) return 'just now';
  if (mins === 1) return '1 min ago';
  if (mins < 60) return `${mins} min ago`;
  return `${Math.round(mins / 60)} h ago`;
}

const ISSUE_ICON = {
  queue: '🧍',
  crowd: '👥',
  noise: '🔊',
  accessibility: '♿',
  safety: '⚠️',
  other: '📍',
};

export default function PulseFeed({ feed }) {
  return (
    <section className="card" aria-label="Live report feed">
      <div className="card-head">
        <h2 className="card-title">Pulse Feed</h2>
        <span className="card-sub">what fans are reporting, translated &amp; structured live</span>
      </div>

      {feed.length === 0 ? (
        <p className="card-sub">No reports yet — be the first to submit one.</p>
      ) : (
        <div className="feed" role="log" aria-label="Recent crowd reports">
          {feed.map(item => (
            <div key={item.id} className="feed-item">
              <span aria-hidden="true" style={{ fontSize: 15 }}>
                {ISSUE_ICON[item.issueType] ?? '📍'}
              </span>
              <div style={{ minWidth: 0 }}>
                <div className="feed-meta">
                  <span className="feed-zone">{item.zoneName}</span>
                  <span className={`sev ${item.severity}`}>{item.severity}</span>
                  {item.language && item.language !== 'en' && (
                    <span className="lang-chip" title="Original language, auto-translated">
                      {item.language} → en
                    </span>
                  )}
                  <span className="feed-time">{timeAgo(item.timestamp)}</span>
                </div>
                <p className="feed-text">{item.text}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
