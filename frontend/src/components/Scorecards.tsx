import React from 'react';
import { Scorecard } from '../types/aegis';

interface Props {
  scorecards: Scorecard[];
}

function TrendArrow({ trend }: { trend: 'up' | 'down' | 'stable' }) {
  if (trend === 'up') return <span style={{ color: 'var(--accent-green)', fontSize: 18 }}>&#8593;</span>;
  if (trend === 'down') return <span style={{ color: 'var(--accent-red)', fontSize: 18 }}>&#8595;</span>;
  return <span style={{ color: 'var(--text-muted)', fontSize: 18 }}>&#8594;</span>;
}

export default function Scorecards({ scorecards }: Props) {
  if (!scorecards.length) return null;

  return (
    <div style={{ display: 'flex', gap: 6, height: '100%' }}>
      {scorecards.map((sc, i) => (
        <div
          key={i}
          className="glass-card"
          style={{
            flex: 1,
            padding: '8px 10px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 4,
          }}
        >
          <div style={{
            fontFamily: 'Orbitron, monospace',
            fontSize: 8,
            fontWeight: 700,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'var(--text-muted)',
            textAlign: 'center',
            lineHeight: 1.2,
          }}>{sc.category}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{
              fontFamily: 'Orbitron, monospace',
              fontSize: 28,
              fontWeight: 900,
              color: sc.color,
              textShadow: `0 0 12px ${sc.color}66`,
              lineHeight: 1,
            }}>{sc.score}</span>
            <TrendArrow trend={sc.trend} />
          </div>
          {/* Gauge bar */}
          <div style={{
            width: '100%',
            height: 4,
            background: 'var(--bg-secondary)',
            borderRadius: 999,
            overflow: 'hidden',
          }}>
            <div style={{
              height: '100%',
              width: `${sc.score}%`,
              background: sc.color,
              borderRadius: 999,
              transition: 'width 0.8s ease',
              boxShadow: `0 0 6px ${sc.color}88`,
            }} />
          </div>
        </div>
      ))}
    </div>
  );
}
