import React from 'react';

interface Props {
  riskLevel: number;
  riskLabel: string;
  riskColor: string;
}

export default function RiskMeter({ riskLevel, riskLabel, riskColor }: Props) {
  const getGradientColor = () => {
    return `linear-gradient(90deg, #00d4ff 0%, ${riskColor} 100%)`;
  };

  return (
    <div className="glass-card" style={{
      padding: '10px 20px',
      display: 'flex',
      alignItems: 'center',
      gap: 16,
      height: '100%',
    }}>
      {/* Label */}
      <div style={{ flexShrink: 0 }}>
        <div style={{
          fontFamily: 'Orbitron, monospace',
          fontSize: 9,
          fontWeight: 700,
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
          color: 'var(--text-muted)',
          marginBottom: 2,
        }}>SYSTEM RISK LEVEL</div>
        <div style={{
          fontFamily: 'Space Mono, monospace',
          fontSize: 10,
          color: 'var(--text-muted)',
        }}>{riskLabel}</div>
      </div>

      {/* Bar section */}
      <div style={{ flex: 1, position: 'relative' }}>
        {/* Tick marks above */}
        <div style={{ position: 'relative', height: 16, marginBottom: 4 }}>
          {[{ pos: 25, label: 'LOW' }, { pos: 50, label: 'MOD' }, { pos: 70, label: 'HIGH' }, { pos: 85, label: 'CRIT' }].map(tick => (
            <div key={tick.pos} style={{
              position: 'absolute',
              left: `${tick.pos}%`,
              transform: 'translateX(-50%)',
              display: 'flex', flexDirection: 'column', alignItems: 'center',
            }}>
              <div style={{
                fontFamily: 'Space Mono, monospace',
                fontSize: 8,
                color: riskLevel >= tick.pos ? riskColor : 'var(--text-muted)',
                letterSpacing: '0.05em',
              }}>{tick.label}</div>
              <div style={{
                width: 1, height: 4,
                background: riskLevel >= tick.pos ? riskColor : 'var(--text-muted)',
                opacity: 0.5
              }} />
            </div>
          ))}
        </div>
        {/* Bar track */}
        <div style={{
          height: 8,
          background: 'var(--bg-secondary)',
          borderRadius: 999,
          overflow: 'hidden',
          position: 'relative',
        }}>
          <div style={{
            height: '100%',
            width: `${riskLevel}%`,
            background: getGradientColor(),
            borderRadius: 999,
            transition: 'width 0.8s ease, background 0.8s ease',
            boxShadow: `0 0 12px ${riskColor}66`,
          }} />
        </div>
      </div>

      {/* Right: percentage + label */}
      <div style={{ flexShrink: 0, textAlign: 'right' }}>
        <div style={{
          fontFamily: 'Orbitron, monospace',
          fontSize: 28,
          fontWeight: 900,
          color: riskColor,
          textShadow: `0 0 20px ${riskColor}88`,
          lineHeight: 1,
        }}>{riskLevel}<span style={{ fontSize: 14 }}>%</span></div>
        <div style={{
          padding: '2px 8px',
          background: `${riskColor}20`,
          border: `1px solid ${riskColor}44`,
          borderRadius: 999,
          fontFamily: 'Orbitron, monospace',
          fontSize: 9,
          color: riskColor,
          fontWeight: 700,
          letterSpacing: '0.1em',
          marginTop: 3,
          display: 'inline-block',
        }}>{riskLabel}</div>
      </div>
    </div>
  );
}
