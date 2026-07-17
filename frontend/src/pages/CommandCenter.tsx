import React from 'react';
import { AegisState } from '../types/aegis';

interface Props {
  state: AegisState | null;
}

export default function CommandCenter({ state }: Props) {
  const liveOccupancy = state?.stadium.currentOccupancy ?? 78400;
  const liveRisk = state?.riskLevel ?? 42;
  const liveRiskColor = state?.riskColor ?? '#ffb300';
  const liveRiskLabel = state?.riskLabel ?? 'ELEVATED';

  // Helper to render mini scorecard indicator
  const renderMiniScorecard = (label: string, score: number, color: string) => (
    <div style={{ marginBottom: 6 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: 'var(--text-secondary)' }}>
        <span>{label}</span>
        <span style={{ color, fontFamily: 'Space Mono, monospace', fontWeight: 700 }}>{score}</span>
      </div>
      <div style={{ height: 3, background: 'rgba(255,255,255,0.05)', borderRadius: 999, overflow: 'hidden', marginTop: 2 }}>
        <div style={{ height: '100%', width: `${score}%`, background: color }} />
      </div>
    </div>
  );

  return (
    <div style={{
      background: 'var(--bg-deep)',
      minHeight: 'calc(100vh - var(--nav-height))',
      padding: '24px',
      display: 'flex',
      flexDirection: 'column',
      gap: '24px',
      overflowY: 'auto'
    }}>
      {/* Page Header */}
      <div>
        <div style={{
          fontFamily: 'Orbitron, monospace', fontSize: 20, fontWeight: 900,
          background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-cyan))',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          letterSpacing: '0.08em'
        }}>
          🌍 WORLD CUP 2026 COMMAND CENTER
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
          Global Multi-Venue Autonomous Operations Governance Network
        </div>
      </div>

      {/* Grid of Stadiums */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '20px'
      }}>
        {/* Stadium 1: AT&T Stadium (LIVE) */}
        <div className="glass-card" style={{
          padding: '20px',
          border: '1.5px solid var(--accent-green)',
          boxShadow: '0 0 25px rgba(16, 185, 129, 0.15)',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative'
        }}>
          {/* Pulse Live Badge */}
          <div style={{
            position: 'absolute', top: 16, right: 16,
            background: 'rgba(16, 185, 129, 0.15)', border: '1px solid var(--accent-green)',
            borderRadius: '999px', padding: '3px 10px', display: 'flex', alignItems: 'center', gap: 6
          }}>
            <div style={{
              width: 6, height: 6, borderRadius: '50%', background: 'var(--accent-green)',
              boxShadow: '0 0 8px var(--accent-green)', animation: 'pulse 1.5s infinite'
            }} />
            <span style={{ fontSize: 9, fontFamily: 'Space Mono, monospace', color: 'var(--accent-green)', fontWeight: 700 }}>LIVE</span>
          </div>

          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>🇺🇸 ARLINGTON, TX</div>
          <div style={{ fontFamily: 'Orbitron, monospace', fontSize: 16, fontWeight: 700, color: 'white', marginTop: 4 }}>
            AT&T STADIUM
          </div>

          {/* Occupancy bar */}
          <div style={{ marginTop: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-secondary)' }}>
              <span>OCCUPANCY RATE</span>
              <span style={{ fontFamily: 'Space Mono', color: 'var(--accent-cyan)' }}>
                {Math.round((liveOccupancy / 80000) * 100)}% ({liveOccupancy.toLocaleString()} / 80,000)
              </span>
            </div>
            <div style={{ height: 6, background: 'rgba(255,255,255,0.05)', borderRadius: 999, overflow: 'hidden', marginTop: 4 }}>
              <div style={{
                height: '100%', width: `${(liveOccupancy / 80000) * 100}%`,
                background: 'linear-gradient(90deg, var(--accent-blue), var(--accent-cyan))'
              }} />
            </div>
          </div>

          {/* Risk status */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, padding: '8px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: 8 }}>
            <span style={{ fontSize: 10, color: 'var(--text-secondary)' }}>AEGIS OS THREAT SCORE</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontFamily: 'Space Mono', color: liveRiskColor, fontWeight: 700 }}>{liveRisk}%</span>
              <span style={{ fontSize: 9, color: liveRiskColor, fontWeight: 700 }}>[{liveRiskLabel}]</span>
            </div>
          </div>

          {/* Mini scorecards */}
          <div style={{ marginTop: 16, borderTop: '1px solid var(--border)', paddingTop: 16 }}>
            {renderMiniScorecard('CROWD SAFETY', state?.scorecards.find(s => s.category === 'Crowd Safety')?.score ?? 91, 'var(--accent-cyan)')}
            {renderMiniScorecard('TRANSPORTATION', state?.scorecards.find(s => s.category === 'Transportation')?.score ?? 84, 'var(--accent-amber)')}
            {renderMiniScorecard('MEDICAL STATUS', state?.scorecards.find(s => s.category === 'Medical')?.score ?? 93, 'var(--accent-orange)')}
          </div>
        </div>

        {/* Stadium 2: SoFi Stadium (PRE-MATCH) */}
        <div className="glass-card" style={{
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative'
        }}>
          {/* Status Badge */}
          <div style={{
            position: 'absolute', top: 16, right: 16,
            background: 'rgba(0, 212, 255, 0.1)', border: '1px solid var(--accent-blue)',
            borderRadius: '999px', padding: '3px 10px'
          }}>
            <span style={{ fontSize: 9, fontFamily: 'Space Mono, monospace', color: 'var(--accent-blue)', fontWeight: 700 }}>PRE-MATCH</span>
          </div>

          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>🇺🇸 INGLEWOOD, CA</div>
          <div style={{ fontFamily: 'Orbitron, monospace', fontSize: 16, fontWeight: 700, color: 'white', marginTop: 4 }}>
            SOFI STADIUM
          </div>

          {/* Occupancy bar */}
          <div style={{ marginTop: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-secondary)' }}>
              <span>PRE-EVENT GATES</span>
              <span style={{ fontFamily: 'Space Mono', color: 'var(--text-secondary)' }}>
                82% (58,200 / 70,240)
              </span>
            </div>
            <div style={{ height: 6, background: 'rgba(255,255,255,0.05)', borderRadius: 999, overflow: 'hidden', marginTop: 4 }}>
              <div style={{ height: '100%', width: '82%', background: 'rgba(255,255,255,0.2)' }} />
            </div>
          </div>

          {/* Risk status */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, padding: '8px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: 8 }}>
            <span style={{ fontSize: 10, color: 'var(--text-secondary)' }}>AEGIS OS THREAT SCORE</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontFamily: 'Space Mono', color: 'var(--accent-green)', fontWeight: 700 }}>23%</span>
              <span style={{ fontSize: 9, color: 'var(--accent-green)', fontWeight: 700 }}>[LOW]</span>
            </div>
          </div>

          {/* Mini scorecards */}
          <div style={{ marginTop: 16, borderTop: '1px solid var(--border)', paddingTop: 16 }}>
            {renderMiniScorecard('CROWD SAFETY', 88, 'var(--accent-cyan)')}
            {renderMiniScorecard('TRANSPORTATION', 85, 'var(--accent-amber)')}
            {renderMiniScorecard('MEDICAL STATUS', 91, 'var(--accent-orange)')}
          </div>
        </div>

        {/* Stadium 3: Estadio Azteca (SCHEDULED) */}
        <div className="glass-card" style={{
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          opacity: 0.8
        }}>
          {/* Status Badge */}
          <div style={{
            position: 'absolute', top: 16, right: 16,
            background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--text-muted)',
            borderRadius: '999px', padding: '3px 10px'
          }}>
            <span style={{ fontSize: 9, fontFamily: 'Space Mono, monospace', color: 'var(--text-muted)', fontWeight: 700 }}>SCHEDULED</span>
          </div>

          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>🇲🇽 MEXICO CITY</div>
          <div style={{ fontFamily: 'Orbitron, monospace', fontSize: 16, fontWeight: 700, color: 'white', marginTop: 4 }}>
            ESTADIO AZTECA
          </div>

          {/* Occupancy bar */}
          <div style={{ marginTop: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-muted)' }}>
              <span>EVENT TIMING</span>
              <span style={{ fontFamily: 'Space Mono', color: 'var(--text-muted)' }}>
                PRE-EVENT (0 / 87,523)
              </span>
            </div>
            <div style={{ height: 6, background: 'rgba(255,255,255,0.05)', borderRadius: 999, overflow: 'hidden', marginTop: 4 }}>
              <div style={{ height: '100%', width: '0%', background: 'rgba(255,255,255,0.1)' }} />
            </div>
          </div>

          {/* Risk status */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, padding: '8px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: 8 }}>
            <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>AEGIS OS THREAT SCORE</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontFamily: 'Space Mono', color: 'var(--text-muted)', fontWeight: 700 }}>8%</span>
              <span style={{ fontSize: 9, color: 'var(--text-muted)', fontWeight: 700 }}>[SAFE]</span>
            </div>
          </div>

          {/* Mini scorecards */}
          <div style={{ marginTop: 16, borderTop: '1px solid var(--border)', paddingTop: 16 }}>
            {renderMiniScorecard('CROWD SAFETY', 98, 'var(--text-muted)')}
            {renderMiniScorecard('TRANSPORTATION', 96, 'var(--text-muted)')}
            {renderMiniScorecard('MEDICAL STATUS', 99, 'var(--text-muted)')}
          </div>
        </div>
      </div>

      {/* OS Architecture Flowchart Viz */}
      <div className="glass-card" style={{ padding: '24px', marginTop: 12 }}>
        <div style={{
          fontFamily: 'Orbitron, monospace', fontSize: 12, fontWeight: 700,
          color: 'var(--accent-blue)', borderBottom: '1px solid var(--border)',
          paddingBottom: '8px', marginBottom: '16px'
        }}>
          🛡️ AEGIS OS — SYSTEM ARCHITECTURE FLOWCHART
        </div>

        {/* CSS Flex Flowchart Nodes */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '12px',
          fontFamily: 'Space Mono, monospace',
          fontSize: '11px',
          color: 'var(--text-primary)'
        }}>
          {/* Row 1 */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <span style={{ border: '1px solid var(--accent-red)', padding: '6px 12px', background: 'rgba(255, 51, 102, 0.05)', borderRadius: 6 }}>
              📡 LIVE DATA FEEDS (CCTV, IoT, GPS, APIs)
            </span>
          </div>

          <div style={{ color: 'var(--accent-blue)' }}>↓</div>

          {/* Row 2 */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <span style={{ border: '1px solid var(--accent-blue)', padding: '6px 12px', background: 'rgba(0, 212, 255, 0.05)', borderRadius: 6 }}>
              💻 AEGIS DIGITAL TWIN ENGINE (LINEAR DATA INTERPOLATION)
            </span>
          </div>

          <div style={{ color: 'var(--accent-blue)' }}>↓</div>

          {/* Row 3 */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <span style={{ border: '1px solid var(--accent-cyan)', padding: '6px 12px', background: 'rgba(0, 255, 204, 0.05)', borderRadius: 6 }}>
              🧠 COGNITIVE RULES ENGINE & SIMULATION MATRIX
            </span>
          </div>

          <div style={{ color: 'var(--accent-blue)' }}>↓</div>

          {/* Row 4 */}
          <div style={{ display: 'flex', gap: '16px' }}>
            <span style={{ border: '1px solid var(--border)', padding: '6px 10px', background: 'rgba(255,255,255,0.02)', borderRadius: 4 }}>
              Crowd Kernel
            </span>
            <span style={{ border: '1px solid var(--border)', padding: '6px 10px', background: 'rgba(255,255,255,0.02)', borderRadius: 4 }}>
              Transport Kernel
            </span>
            <span style={{ border: '1px solid var(--border)', padding: '6px 10px', background: 'rgba(255,255,255,0.02)', borderRadius: 4 }}>
              Security Kernel
            </span>
            <span style={{ border: '1px solid var(--border)', padding: '6px 10px', background: 'rgba(255,255,255,0.02)', borderRadius: 4 }}>
              Medical Kernel
            </span>
          </div>

          <div style={{ color: 'var(--accent-blue)' }}>↓</div>

          {/* Row 5 */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <span style={{ border: '1px solid var(--accent-amber)', padding: '6px 12px', background: 'rgba(255, 179, 0, 0.05)', borderRadius: 6 }}>
              ⚔️ COGNITIVE DEBATE PROTOCOL (MULTI-AGENT REASONING)
            </span>
          </div>

          <div style={{ color: 'var(--accent-blue)' }}>↓</div>

          {/* Row 6 */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <span style={{ border: '1px solid var(--accent-purple)', padding: '6px 12px', background: 'rgba(139, 92, 246, 0.05)', borderRadius: 6 }}>
              👑 EXECUTIVE STRATEGY LAYER (DECISION RESOLVER)
            </span>
          </div>

          <div style={{ color: 'var(--accent-blue)' }}>↓</div>

          {/* Row 7 */}
          <div style={{ display: 'flex', gap: '20px' }}>
            <span style={{ border: '1px dashed var(--accent-blue)', padding: '6px 12px', background: 'rgba(255,255,255,0.01)', borderRadius: 4 }}>
              🖥️ Mission Control
            </span>
            <span style={{ border: '1px dashed var(--accent-blue)', padding: '6px 12px', background: 'rgba(255,255,255,0.01)', borderRadius: 4 }}>
              📱 Fan Assistant
            </span>
            <span style={{ border: '1px dashed var(--accent-blue)', padding: '6px 12px', background: 'rgba(255,255,255,0.01)', borderRadius: 4 }}>
              📊 Post Reports
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
