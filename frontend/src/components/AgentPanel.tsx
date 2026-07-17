import React, { useState, useEffect } from 'react';
import { Agent } from '../types/aegis';

interface Props {
  agents: Agent[];
}

const STATUS_CONFIG: Record<Agent['status'], { label: string; bg: string; color: string; pulse: boolean }> = {
  idle: { label: 'IDLE', bg: 'rgba(74,80,104,0.3)', color: 'var(--text-muted)', pulse: false },
  monitoring: { label: 'MONITORING', bg: 'rgba(74,80,104,0.3)', color: 'var(--text-muted)', pulse: false },
  analyzing: { label: 'ANALYZING', bg: 'rgba(255,179,0,0.15)', color: 'var(--accent-amber)', pulse: true },
  predicting: { label: 'PREDICTING', bg: 'rgba(0,212,255,0.15)', color: 'var(--accent-blue)', pulse: true },
  warning: { label: 'WARNING', bg: 'rgba(255,107,53,0.15)', color: 'var(--accent-orange)', pulse: true },
  critical: { label: 'CRITICAL', bg: 'rgba(255,51,102,0.2)', color: 'var(--accent-red)', pulse: true },
};

// Sub-component for individual Agent item with its own pulse loop
function AgentRow({ agent }: { agent: Agent }) {
  const sc = STATUS_CONFIG[agent.status];
  const shouldPulse = sc.pulse;
  const [ticks, setTicks] = useState(0);

  // Tick generator for changing sub-metrics to make it look alive
  useEffect(() => {
    const interval = setInterval(() => {
      setTicks(t => t + 1);
    }, 1500 + Math.random() * 2000);
    return () => clearInterval(interval);
  }, []);

  // Compute a mock inference latency & token count
  const mockLatency = 12 + (ticks % 17) * 3;
  const mockTensors = 32 + (ticks % 9);

  return (
    <div
      style={{
        borderLeft: `3px solid ${agent.color}`,
        background: shouldPulse ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.01)',
        borderRadius: '0 6px 6px 0',
        padding: '5px 8px',
        borderBottom: '1px solid rgba(255,255,255,0.02)',
        boxShadow: shouldPulse ? `0 0 10px ${agent.color}05` : 'none',
        transition: 'all 0.4s ease',
        transform: shouldPulse ? 'scale(1.01)' : 'scale(1.0)',
      }}
    >
      {/* Row 1: dot + name + status badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
        <div style={{
          width: 6, height: 6, borderRadius: '50%',
          background: agent.color,
          flexShrink: 0,
          animation: shouldPulse ? 'pulse 1.2s ease-in-out infinite' : 'none',
          boxShadow: shouldPulse ? `0 0 6px ${agent.color}` : 'none',
        }} />
        <span style={{
          fontFamily: 'Orbitron, monospace',
          fontSize: 9,
          fontWeight: 700,
          color: 'var(--text-primary)',
          flex: 1,
          letterSpacing: '0.05em',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>{agent.name}</span>
        
        {/* Dynamic sub-metric logs */}
        {agent.status !== 'idle' && (
          <span style={{
            fontSize: '7px',
            fontFamily: 'Space Mono, monospace',
            color: 'var(--text-muted)',
            marginRight: 4
          }}>
            [L: {mockLatency}ms | Q: {agent.status === 'critical' ? 3 : (agent.status === 'warning' ? 2 : 1)}]
          </span>
        )}

        <span style={{
          padding: '1px 4px',
          background: sc.bg,
          borderRadius: 999,
          fontSize: 7,
          fontFamily: 'Orbitron, monospace',
          color: sc.color,
          fontWeight: 700,
          letterSpacing: '0.05em',
          flexShrink: 0,
          animation: agent.status === 'critical' ? 'pulse 0.8s ease-in-out infinite' : 'none',
        }}>{sc.label}</span>
      </div>

      {/* Row 2: thinking text */}
      <div style={{
        fontSize: 9,
        color: 'var(--text-secondary)',
        overflow: 'hidden',
        display: '-webkit-box',
        WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical',
        lineHeight: 1.3,
        marginBottom: 3,
        animation: 'fadeIn 0.3s ease',
        fontStyle: 'italic',
        fontFamily: 'Space Mono, monospace'
      }}>
        {agent.status !== 'idle' && <span style={{ color: agent.color, marginRight: 2 }}>▶</span>}
        {agent.thinking}
      </div>

      {/* Row 3: confidence bar + number */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <div style={{
          flex: 1,
          height: 2,
          background: 'var(--bg-secondary)',
          borderRadius: 999,
          overflow: 'hidden',
        }}>
          <div style={{
            height: '100%',
            width: `${agent.confidence}%`,
            background: `linear-gradient(90deg, ${agent.color}aa, ${agent.color})`,
            borderRadius: 999,
            transition: 'width 0.6s cubic-bezier(0.1, 0.8, 0.2, 1.0)',
          }} />
        </div>
        <span style={{
          fontFamily: 'Space Mono, monospace',
          fontSize: 9,
          color: agent.color,
          fontWeight: 700,
          flexShrink: 0,
        }}>{agent.confidence}%</span>
      </div>
    </div>
  );
}

export default function AgentPanel({ agents }: Props) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: 5,
      overflowY: 'auto',
      flex: 1,
      padding: '4px 6px',
    }}>
      {agents.map(agent => (
        <AgentRow key={agent.id} agent={agent} />
      ))}
    </div>
  );
}
