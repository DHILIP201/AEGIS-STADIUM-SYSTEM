import React, { useRef, useEffect } from 'react';
import { TimelineEvent } from '../types/aegis';

interface Props {
  timeline: TimelineEvent[];
  storyProgress: number;
}

const TYPE_COLORS: Record<TimelineEvent['type'], string> = {
  info: 'var(--accent-blue)',
  warning: 'var(--accent-amber)',
  alert: 'var(--accent-orange)',
  action: 'var(--accent-cyan)',
  outcome: 'var(--accent-green)',
  critical: 'var(--accent-red)',
};

export default function Timeline({ timeline, storyProgress }: Props) {
  const currentRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (currentRef.current) {
      currentRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      });
    }
  }, [timeline]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Scrollable events */}
      <div
        ref={containerRef}
        style={{
          display: 'flex',
          overflowX: 'auto',
          padding: '8px 16px',
          gap: 0,
          position: 'relative',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          flex: 1,
          alignItems: 'flex-start',
        }}
      >
        {/* Connecting line */}
        <div style={{
          position: 'absolute',
          top: 42,
          left: 0,
          right: 0,
          height: 2,
          background: 'linear-gradient(90deg, transparent, var(--border), transparent)',
          pointerEvents: 'none',
        }} />

        {timeline.map((event, idx) => {
          const isCurrent = event.status === 'current';
          const isPast = event.status === 'past';
          const isFuture = event.status === 'future';
          const color = TYPE_COLORS[event.type];

          return (
            <div
              key={event.id}
              ref={isCurrent ? currentRef : null}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                minWidth: 130,
                opacity: isPast ? 0.55 : isFuture ? 0.3 : 1,
                transition: 'opacity 0.3s ease',
              }}
            >
              {/* Time */}
              <div style={{
                fontFamily: 'Space Mono, monospace',
                fontSize: 10,
                color: isCurrent ? color : 'var(--text-muted)',
                marginBottom: 4,
                fontWeight: isCurrent ? 700 : 400,
              }}>{event.displayTime}</div>

              {/* Dot */}
              <div style={{
                width: isCurrent ? 22 : 14,
                height: isCurrent ? 22 : 14,
                borderRadius: '50%',
                border: isFuture ? `2px dashed ${color}66` : `2px solid ${color}`,
                background: isCurrent ? color : isPast ? `${color}33` : 'transparent',
                boxShadow: isCurrent ? `0 0 12px ${color}, 0 0 24px ${color}44` : 'none',
                animation: isCurrent ? 'pulse 2s ease-in-out infinite' : 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.4s ease',
                zIndex: 1,
              }}>
                {isCurrent && <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'white' }} />}
              </div>

              {/* Title */}
              <div style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: 10,
                color: isCurrent ? 'var(--text-primary)' : 'var(--text-secondary)',
                textAlign: 'center',
                marginTop: 4,
                maxWidth: 120,
                overflow: 'hidden',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                lineHeight: 1.3,
                fontWeight: isCurrent ? 600 : 400,
              }}>{event.title}</div>

              {/* Type badge */}
              <div style={{
                marginTop: 3,
                padding: '1px 6px',
                background: `${color}15`,
                border: `1px solid ${color}33`,
                borderRadius: 999,
                fontSize: 8,
                fontFamily: 'Orbitron, monospace',
                color: color,
                fontWeight: 700,
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
              }}>{event.type}</div>
            </div>
          );
        })}
      </div>

      {/* Progress bar at bottom */}
      <div style={{
        height: 3,
        background: 'var(--bg-secondary)',
        margin: '0 16px 4px',
        borderRadius: 999,
        overflow: 'hidden',
      }}>
        <div style={{
          height: '100%',
          width: `${storyProgress * 100}%`,
          background: 'linear-gradient(90deg, var(--accent-blue), var(--accent-cyan))',
          borderRadius: 999,
          transition: 'width 0.5s ease',
          boxShadow: '0 0 6px var(--accent-blue)',
        }} />
      </div>
    </div>
  );
}
