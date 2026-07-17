import React, { useState, useEffect } from 'react';
import { DebateState, DebateArgument } from '../types/aegis';

interface Props {
  debate: DebateState | null;
}

const PHASES = ['collecting', 'debating', 'deciding', 'decided'];

function PhaseStep({ phase, current }: { phase: string; current: string }) {
  const idx = PHASES.indexOf(phase);
  const curIdx = PHASES.indexOf(current);
  const isActive = idx === curIdx;
  const isDone = idx < curIdx;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      <div style={{
        width: 28, height: 28, borderRadius: '50%',
        border: `2px solid ${isDone ? 'var(--accent-green)' : isActive ? 'var(--accent-amber)' : 'var(--text-muted)'}`,
        background: isDone ? 'var(--accent-green)' : isActive ? 'rgba(255,179,0,0.15)' : 'transparent',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 11,
        color: isDone ? 'var(--bg-deep)' : isActive ? 'var(--accent-amber)' : 'var(--text-muted)',
        fontWeight: 700,
        animation: isActive ? 'pulse 2s ease-in-out infinite' : 'none',
        transition: 'all 0.4s ease',
      }}>{isDone ? '✓' : idx + 1}</div>
      <span style={{
        fontFamily: 'Orbitron, monospace',
        fontSize: 8,
        letterSpacing: '0.05em',
        textTransform: 'uppercase',
        color: isActive ? 'var(--accent-amber)' : isDone ? 'var(--accent-green)' : 'var(--text-muted)',
      }}>{phase}</span>
    </div>
  );
}

function ArgumentCard({ arg, index, visible }: { arg: DebateArgument; index: number; visible: boolean }) {
  const isEven = index % 2 === 0;
  return (
    <div style={{
      borderLeft: `4px solid ${arg.color}`,
      background: `${arg.color}08`,
      borderRadius: '0 10px 10px 0',
      padding: '12px 16px',
      opacity: visible ? 1 : 0,
      animation: visible ? `${isEven ? 'slideInLeft' : 'slideInRight'} 0.4s ease-out forwards` : 'none',
      animationDelay: `${index * 0.15}s`,
      transition: 'opacity 0.3s ease',
      boxShadow: `0 0 20px ${arg.color}10`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <div style={{
          width: 8, height: 8, borderRadius: '50%',
          background: arg.color,
          boxShadow: `0 0 8px ${arg.color}`,
          animation: 'pulse 2s ease-in-out infinite',
          flexShrink: 0,
        }} />
        <span style={{
          fontFamily: 'Orbitron, monospace',
          fontSize: 11,
          fontWeight: 700,
          color: 'var(--text-primary)',
        }}>{arg.agentName}</span>
        <span style={{
          padding: '2px 8px',
          borderRadius: 999,
          background: `${arg.color}20`,
          border: `1px solid ${arg.color}44`,
          fontFamily: 'Orbitron, monospace',
          fontSize: 9,
          color: arg.color,
          fontWeight: 700,
          marginLeft: 'auto',
        }}>{arg.confidence}% CONF</span>
      </div>
      <div style={{
        fontSize: 13,
        fontWeight: 600,
        color: 'var(--text-primary)',
        marginBottom: 6,
        lineHeight: 1.4,
      }}>{arg.position}</div>
      <div style={{
        fontSize: 11,
        color: 'var(--text-secondary)',
        lineHeight: 1.5,
        fontStyle: 'italic',
        marginBottom: 8,
      }}>{arg.reasoning}</div>
      {(arg.evidence || arg.risk || arg.expectedBenefit) && (
        <div style={{
          display: 'flex', flexDirection: 'column', gap: 4,
          padding: '6px 10px', background: 'rgba(255,255,255,0.02)',
          borderRadius: 6, fontSize: 10, fontFamily: 'Space Mono, monospace'
        }}>
          {arg.evidence && (
            <div>
              <span style={{ color: 'var(--accent-blue)', fontWeight: 700 }}>EVIDENCE:</span> {arg.evidence}
            </div>
          )}
          {arg.risk && (
            <div>
              <span style={{ color: 'var(--accent-red)', fontWeight: 700 }}>RISK VECTOR:</span> {arg.risk}
            </div>
          )}
          {arg.expectedBenefit && (
            <div>
              <span style={{ color: 'var(--accent-green)', fontWeight: 700 }}>BENEFIT:</span> {arg.expectedBenefit}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function DebateModal({ debate }: Props) {
  const [visibleArgs, setVisibleArgs] = useState(0);
  const [closedByUser, setClosedByUser] = useState(false);

  useEffect(() => {
    if (!debate) { setVisibleArgs(0); setClosedByUser(false); return; }
    setVisibleArgs(0);
    setClosedByUser(false);
    const interval = setInterval(() => {
      setVisibleArgs(prev => {
        if (prev >= debate.arguments.length) { clearInterval(interval); return prev; }
        return prev + 1;
      });
    }, 400);
    return () => clearInterval(interval);
  }, [debate?.topic]);

  if (!debate || closedByUser) return null;

  const isDecided = debate.phase === 'decided';
  const isDeciding = debate.phase === 'deciding';

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(3,4,10,0.92)',
      backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20,
      animation: 'fadeIn 0.4s ease-out',
    }}>
      <div className="glass-card-bright" style={{
        maxWidth: 800,
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
        padding: 0,
        boxShadow: '0 0 60px rgba(0,212,255,0.2), 0 0 120px rgba(0,212,255,0.05)',
        border: '1px solid var(--border-bright)',
        position: 'relative',
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px 16px',
          borderBottom: '1px solid var(--border)',
          background: 'rgba(0,212,255,0.02)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <span style={{ fontSize: 28 }}>⚔</span>
            <div>
              <div style={{
                fontFamily: 'Orbitron, monospace',
                fontSize: 18,
                fontWeight: 900,
                background: 'linear-gradient(135deg, var(--accent-amber), #ffcc00)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                letterSpacing: '0.1em',
              }}>AGENT DEBATE</div>
              <div style={{
                color: 'var(--text-secondary)',
                fontSize: 12,
                marginTop: 2,
                fontStyle: 'italic',
              }}>{debate.topic}</div>
            </div>
          </div>
          {/* Phase steps */}
          <div style={{ display: 'flex', gap: 20, alignItems: 'center', marginTop: 12 }}>
            {PHASES.map((phase, i) => (
              <React.Fragment key={phase}>
                <PhaseStep phase={phase} current={debate.phase} />
                {i < PHASES.length - 1 && (
                  <div style={{
                    flex: 1,
                    height: 2,
                    background: PHASES.indexOf(debate.phase) > i
                      ? 'var(--accent-green)'
                      : 'var(--border)',
                    transition: 'background 0.4s ease',
                  }} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Arguments */}
        <div style={{ padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {debate.arguments.map((arg, i) => (
            <ArgumentCard key={arg.agentId} arg={arg} index={i} visible={i < visibleArgs} />
          ))}

          {/* Deciding spinner */}
          {isDeciding && (
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              gap: 12, padding: '24px 0',
            }}>
              <div style={{
                width: 48, height: 48,
                border: '3px solid transparent',
                borderTopColor: 'var(--accent-amber)',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
              }} />
              <div style={{
                fontFamily: 'Orbitron, monospace',
                fontSize: 12,
                color: 'var(--accent-amber)',
                animation: 'pulse 1.5s ease-in-out infinite',
                letterSpacing: '0.1em',
              }}>Executive Agent synthesizing final decision...</div>
            </div>
          )}

          {/* Final Decision */}
          {isDecided && debate.finalDecision && (
            <div style={{
              background: 'rgba(255,179,0,0.05)',
              border: '1px solid rgba(255,179,0,0.3)',
              borderRadius: 12,
              padding: '20px',
              animation: 'slideInUp 0.6s ease-out',
              boxShadow: '0 0 30px rgba(255,179,0,0.15)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <span style={{ fontSize: 24 }}>👑</span>
                <div>
                  <div style={{
                    fontFamily: 'Orbitron, monospace',
                    fontSize: 13,
                    fontWeight: 900,
                    color: 'var(--accent-amber)',
                    letterSpacing: '0.08em',
                  }}>EXECUTIVE AGENT — FINAL DECISION</div>
                </div>
                <div style={{
                  marginLeft: 'auto',
                  fontFamily: 'Orbitron, monospace',
                  fontSize: 32,
                  fontWeight: 900,
                  color: 'var(--accent-green)',
                  textShadow: '0 0 20px var(--accent-green)',
                }}>{debate.finalDecision.confidence}%</div>
              </div>
              <div style={{ marginBottom: 12 }}>
                <div style={{
                  fontFamily: 'Orbitron, monospace',
                  fontSize: 10,
                  color: 'var(--text-muted)',
                  letterSpacing: '0.1em',
                  marginBottom: 8,
                }}>ACTIONS</div>
                {debate.finalDecision.actions.map((action, i) => (
                  <div key={i} style={{
                    display: 'flex', gap: 8, alignItems: 'flex-start',
                    marginBottom: 4, fontSize: 12, color: 'var(--text-primary)',
                  }}>
                    <span style={{ color: 'var(--accent-green)', fontWeight: 700, flexShrink: 0 }}>✓ {i + 1}.</span>
                    <span>{action}</span>
                  </div>
                ))}
              </div>
              <div style={{
                fontSize: 12,
                color: 'var(--text-secondary)',
                fontStyle: 'italic',
                marginBottom: 8,
                lineHeight: 1.5,
              }}><strong style={{ color: 'var(--accent-cyan)' }}>Expected:</strong> {debate.finalDecision.expectedOutcome}</div>
              <div style={{
                fontSize: 11,
                color: 'var(--text-secondary)',
                lineHeight: 1.5,
              }}>{debate.finalDecision.reasoning}</div>
            </div>
          )}
        </div>

        {/* Close button - only when decided */}
        {isDecided && (
          <div style={{
            position: 'absolute', top: 12, right: 12,
          }}>
            <button
              onClick={() => setClosedByUser(true)}
              style={{
                width: 32, height: 32,
                borderRadius: '50%',
                border: '1px solid var(--border)',
                background: 'var(--bg-secondary)',
                color: 'var(--text-muted)',
                fontSize: 16,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >✕</button>
          </div>
        )}
      </div>
    </div>
  );
}
