import React from 'react';
import { Metrics } from '../types/aegis';

interface Props {
  metrics: Metrics;
}

interface Tile {
  icon: string;
  label: string;
  value: string;
  color: string;
  borderColor: string;
}

export default function MetricsBar({ metrics }: Props) {
  const tiles: Tile[] = [
    {
      icon: '👥',
      label: 'Crowd',
      value: metrics.occupancy.toLocaleString(),
      color: 'var(--accent-blue)',
      borderColor: 'var(--accent-blue)',
    },
    {
      icon: '🌡',
      label: 'Temp',
      value: `${metrics.temperature}°C`,
      color: metrics.temperature > 35 ? 'var(--accent-orange)' : 'var(--accent-cyan)',
      borderColor: metrics.temperature > 35 ? 'var(--accent-orange)' : 'var(--accent-cyan)',
    },
    {
      icon: '⚡',
      label: 'Energy',
      value: `${metrics.energyMW} MW`,
      color: 'var(--accent-purple)',
      borderColor: 'var(--accent-purple)',
    },
    {
      icon: '🙋',
      label: 'Volunteers',
      value: `${metrics.volunteersDeployed} active`,
      color: 'var(--accent-green)',
      borderColor: 'var(--accent-green)',
    },
    {
      icon: '🏥',
      label: 'Medical',
      value: `${metrics.medicalAlerts} alerts`,
      color: metrics.medicalAlerts > 0 ? 'var(--accent-red)' : 'var(--accent-green)',
      borderColor: metrics.medicalAlerts > 0 ? 'var(--accent-red)' : 'var(--accent-green)',
    },
    {
      icon: '🚇',
      label: 'Transport',
      value: `${metrics.transportDelayMin} min delay`,
      color: metrics.transportDelayMin > 0 ? 'var(--accent-amber)' : 'var(--accent-green)',
      borderColor: metrics.transportDelayMin > 0 ? 'var(--accent-amber)' : 'var(--accent-green)',
    },
  ];

  return (
    <div style={{
      display: 'flex',
      gap: 6,
      height: '100%',
    }}>
      {tiles.map((tile, i) => (
        <div
          key={i}
          className="glass-card"
          style={{
            flex: 1,
            padding: '8px 12px',
            borderLeft: `3px solid ${tile.borderColor}`,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            transition: 'all 0.3s ease',
          }}
        >
          <div style={{
            display: 'flex', alignItems: 'center', gap: 4,
            fontFamily: 'Inter, sans-serif',
            fontSize: 10,
            color: 'var(--text-muted)',
            marginBottom: 2,
          }}>
            <span>{tile.icon}</span>
            <span>{tile.label}</span>
          </div>
          <div style={{
            fontFamily: 'Space Mono, monospace',
            fontSize: 14,
            fontWeight: 700,
            color: tile.color,
            whiteSpace: 'nowrap',
          }}>{tile.value}</div>
        </div>
      ))}
    </div>
  );
}
