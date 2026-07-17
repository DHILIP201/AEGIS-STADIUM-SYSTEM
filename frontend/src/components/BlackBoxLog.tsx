import React, { useState } from 'react';
import { BlackboxEntry } from '../types/aegis';

interface Props {
  blackbox: BlackboxEntry[];
  maxItems?: number;
}

const TYPE_CONFIG: Record<BlackboxEntry['type'], { icon: string; color: string }> = {
  prediction: { icon: '🔮', color: 'var(--accent-blue)' },
  action: { icon: '⚡', color: 'var(--accent-amber)' },
  outcome: { icon: '✅', color: 'var(--accent-green)' },
};

function EntryRow({ entry }: { entry: BlackboxEntry }) {
  const [expanded, setExpanded] = useState(false);
  const tc = TYPE_CONFIG[entry.type];
  return (
    <div style={{
      display: 'flex', gap: 8, padding: '7px 10px',
      borderBottom: '1px solid rgba(255,255,255,0.04)',
      animation: 'slideInLeft 0.3s ease-out',
      alignItems: 'flex-start',
    }}>
      {/* Time badge */}
      <span style={{
        fontFamily: 'Space Mono, monospace',
        fontSize: 9,
        color: 'var(--accent-blue)',
        background: 'rgba(0,212,255,0.1)',
        border: '1px solid rgba(0,212,255,0.2)',
        borderRadius: 4,
        padding: '1px 5px',
        flexShrink: 0,
        whiteSpace: 'nowrap',
        marginTop: 1,
      }}>{entry.time}</span>
      {/* Type icon */}
      <span style={{ flexShrink: 0, fontSize: 12, marginTop: 1 }}>{tc.icon}</span>
      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 11,
          fontWeight: 600,
          color: 'var(--text-primary)',
          marginBottom: 2,
        }}>{entry.title}</div>
        <div
          onClick={() => setExpanded(e => !e)}
          style={{
            fontSize: 10,
            color: 'var(--text-secondary)',
            overflow: expanded ? 'visible' : 'hidden',
            whiteSpace: expanded ? 'normal' : 'nowrap',
            textOverflow: expanded ? 'unset' : 'ellipsis',
            cursor: entry.details.length > 60 ? 'pointer' : 'default',
            lineHeight: 1.4,
          }}
        >{entry.details}</div>
      </div>
      {/* Accuracy badge */}
      {entry.accuracy !== null && (
        <span style={{
          fontFamily: 'Space Mono, monospace',
          fontSize: 9,
          color: 'var(--accent-green)',
          background: 'rgba(16,185,129,0.1)',
          border: '1px solid rgba(16,185,129,0.2)',
          borderRadius: 4,
          padding: '1px 5px',
          flexShrink: 0,
          whiteSpace: 'nowrap',
        }}>{entry.accuracy}% acc</span>
      )}
    </div>
  );
}

export default function BlackBoxLog({ blackbox, maxItems = 8 }: Props) {
  const items = [...blackbox].reverse().slice(0, maxItems);

  if (blackbox.length === 0) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        gap: 8, padding: 20, color: 'var(--text-muted)', fontSize: 12,
      }}>
        <div style={{
          width: 8, height: 8, borderRadius: '50%',
          background: 'var(--accent-red)',
          animation: 'pulse 1.5s ease-in-out infinite',
          boxShadow: '0 0 6px var(--accent-red)',
        }} />
        Black box is recording...
      </div>
    );
  }

  return (
    <div style={{ overflowY: 'auto', flex: 1 }}>
      {items.map((entry, i) => <EntryRow key={i} entry={entry} />)}
    </div>
  );
}
