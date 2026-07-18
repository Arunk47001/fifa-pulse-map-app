import React from 'react';

export default function MatchCard() {
  return (
    <div
      style={{
        position: 'relative',
        borderRadius: 16,
        overflow: 'hidden',
        height: 210,
        border: '1px solid rgba(255,255,255,0.10)',
        userSelect: 'none',
      }}
      aria-label="Tonight's featured match"
    >
      {/* photo */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'url(/match-feature.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center 20%',
        }}
      />

      {/* gradient overlay — dark at top + bottom, transparent in middle so the players show */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `
            linear-gradient(to bottom,
              rgba(6,9,19,0.78) 0%,
              rgba(6,9,19,0.20) 35%,
              rgba(6,9,19,0.20) 55%,
              rgba(6,9,19,0.90) 100%
            )
          `,
        }}
      />

      {/* content */}
      <div
        style={{
          position: 'relative',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '14px 18px',
        }}
      >
        {/* top row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              color: 'var(--brand-a)',
              background: 'rgba(52,211,153,0.12)',
              border: '1px solid rgba(52,211,153,0.3)',
              borderRadius: 999,
              padding: '3px 10px',
            }}
          >
            Group Stage D
          </span>
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'var(--congested)',
              display: 'flex',
              alignItems: 'center',
              gap: 5,
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: 'var(--congested)',
                display: 'inline-block',
                animation: 'blink 1.6s ease-in-out infinite',
              }}
            />
            Tonight · 21:00 ET
          </span>
        </div>

        {/* bottom: teams */}
        <div>
          <div
            style={{
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'var(--text-muted)',
              marginBottom: 6,
            }}
          >
            FIFA World Cup 2026
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 8,
            }}
          >
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: 22 }}>🇵🇹</div>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#fff', letterSpacing: '-0.01em', marginTop: 2 }}>Portugal</div>
            </div>

            <div
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 22,
                fontWeight: 800,
                color: 'rgba(255,255,255,0.25)',
                letterSpacing: '0.04em',
              }}
            >
              VS
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 22 }}>🇦🇷</div>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#fff', letterSpacing: '-0.01em', marginTop: 2 }}>Argentina</div>
            </div>
          </div>

          <div
            style={{
              marginTop: 8,
              fontSize: 11,
              color: 'var(--text-faint)',
              display: 'flex',
              gap: 12,
            }}
          >
            <span>🏟 MetLife Stadium</span>
            <span>Gates open 18:00</span>
            <span>82,500 capacity</span>
          </div>
        </div>
      </div>
    </div>
  );
}
