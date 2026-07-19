import React, { useState, useEffect, useRef } from 'react';
import { DebateState, DebateArgument } from '../types/aegis';

interface Props {
  debate: DebateState | null;
  demoTourActive?: boolean;
  onClose?: () => void;
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
        border: `2px solid ${isDone ? 'var(--accent-green)' : isActive ? 'var(--accent-amber)' : 'var(--border)'}`,
        background: isDone ? 'var(--accent-green)' : isActive ? 'rgba(255,179,0,0.15)' : 'transparent',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 11,
        color: isDone ? 'var(--bg-deep)' : isActive ? 'var(--accent-amber)' : 'var(--text-muted)',
        fontWeight: 700,
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
  return (
    <div style={{
      borderLeft: `4px solid ${arg.color}`,
      background: 'rgba(255, 255, 255, 0.02)',
      borderRadius: '0 8px 8px 0',
      padding: '12px 16px',
      opacity: visible ? 1 : 0,
      transition: 'opacity 0.3s ease',
      boxShadow: `0 0 15px ${arg.color}10`,
      marginBottom: '10px'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <div style={{
          width: 8, height: 8, borderRadius: '50%',
          background: arg.color,
          boxShadow: `0 0 8px ${arg.color}`,
          flexShrink: 0,
        }} />
        <span style={{
          fontFamily: 'Orbitron, monospace',
          fontSize: 11,
          fontWeight: 700,
          color: 'white',
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
        fontSize: 12,
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
          padding: '6px 10px', background: 'rgba(0,0,0,0.2)',
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

export default function DebateModal({ debate, demoTourActive, onClose }: Props) {
  const [cachedDebate, setCachedDebate] = useState<DebateState | null>(null);
  const [visibleArgs, setVisibleArgs] = useState(0);
  const [closedByUser, setClosedByUser] = useState(false);
  const [collectProgress, setCollectProgress] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (debate) {
      if (!cachedDebate || cachedDebate.topic !== debate.topic) {
        setClosedByUser(false);
      }
      setCachedDebate(debate);
    }
  }, [debate]);

  useEffect(() => {
    if (demoTourActive) {
      if (!debate) {
        setClosedByUser(true);
      }
    }
  }, [debate, demoTourActive]);

  useEffect(() => {
    const activeDebate = debate || cachedDebate;
    if (!activeDebate) { setVisibleArgs(0); setClosedByUser(false); setCollectProgress(0); return; }

    if (!debate && cachedDebate) {
      setVisibleArgs(cachedDebate.arguments.length);
      setCollectProgress(100);
      return;
    }

    setVisibleArgs(0);
    setClosedByUser(false);
    setCollectProgress(0);

    if (activeDebate.phase === 'collecting') {
      const interval = setInterval(() => {
        setCollectProgress(prev => {
          if (prev >= 100) { clearInterval(interval); return 100; }
          return prev + 12;
        });
      }, 300);
      return () => clearInterval(interval);
    } else {
      setCollectProgress(100);
      const interval = setInterval(() => {
        setVisibleArgs(prev => {
          if (prev >= activeDebate.arguments.length) { clearInterval(interval); return prev; }
          return prev + 1;
        });
      }, 400);
      return () => clearInterval(interval);
    }
  }, [debate?.topic, debate?.phase, debate === null]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [visibleArgs, debate?.phase]);

  const displayDebate = debate ? debate : (cachedDebate ? { ...cachedDebate, phase: 'decided' as const } : null);

  if (!displayDebate || closedByUser) return null;

  const isGateB = displayDebate.topic.includes('Gate B') || displayDebate.topic.includes('congestion');
  const isStorm = displayDebate.topic.includes('Storm') || displayDebate.topic.includes('Weather');

  const evidenceChecklist = isGateB ? [
    { label: "CCTV Cam 01 (Gate B) - Density: 91% (Critical Bottleneck)", done: collectProgress >= 20 },
    { label: "Metro Ingress Telemetry - Rate: +1,200 fans/min (Arrival wave)", done: collectProgress >= 40 },
    { label: "Gate B Turnstile Log - Active validations: 18/24", done: collectProgress >= 60 },
    { label: "RFID Ticket Scanners - 4,200 fans in boundary vicinity", done: collectProgress >= 80 },
    { label: "Environmental Feed - Temperature: 39°C (Elevated heat stress)", done: collectProgress >= 90 },
    { label: "Dispatch Database - 14 Volunteers available within 200m", done: collectProgress >= 100 },
  ] : [
    { label: "Concourse Main Sensors - Occupancy density: 91%", done: collectProgress >= 20 },
    { label: "Weather Station API - Heavy rain hits stadium. Temp: 29°C", done: collectProgress >= 40 },
    { label: "Medical Center Incident log - 3 active slip-fall alerts", done: collectProgress >= 60 },
    { label: "Transit Release Metrics - Metro release demand surge: +340%", done: collectProgress >= 80 },
    { label: "Smart Energy Grid - HVAC load: 3.1 MW (Battery reserve active)", done: collectProgress >= 90 },
    { label: "PA Translation Matrix - 11 localized language streams ready", done: collectProgress >= 100 },
  ];

  const debateLogs = isGateB ? [
    { id: 1, agentName: "Crowd Agent", color: "var(--accent-red)", text: "Gate B density exceeded 90%. Stampede probability: 23%. Request immediate Gate closure." },
    { id: 2, agentName: "Transport Agent", color: "var(--accent-amber)", text: "Oppose full Gate B closure. 4,200 fans incoming from Metro exits. Closure creates severe outdoor crush." },
    { id: 3, agentName: "Security Agent", color: "var(--accent-blue)", text: "Compromise proposal: Activate single-file check-in at Gate B to limit ingress rate, divert overflow to Gate D." },
    { id: 4, agentName: "Volunteer Agent", color: "var(--accent-green)", text: "Guidance check: 14 corridor volunteers available. Divert corridor path B-to-D is viable within 3 minutes." }
  ] : [
    { id: 1, agentName: "Medical Agent", color: "var(--accent-red)", text: "Wet surfaces. 3 active slip-falls registered. Pre-positioning 8 medics at covered exits immediately." },
    { id: 2, agentName: "Transport Agent", color: "var(--accent-amber)", text: "Metro release queue spiking. Dispatches increased to 90-second frequency. 6 extra trains running." },
    { id: 3, agentName: "Energy Agent", color: "var(--accent-blue)", text: "Energy grid peak load 3.1MW. Boost concourse HVAC by 35% to counter wet hypothermia. Battery active." },
    { id: 4, agentName: "Volunteer Agent", color: "var(--accent-green)", text: "Deploying 23 reserve volunteers to concourses to manage high density crowd distribution." }
  ];

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(3,4,10,0.92)',
      backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20,
      animation: 'fadeIn 0.3s ease-out',
    }}>
      <div className="glass-card-bright" style={{
        maxWidth: 860,
        width: '100%',
        maxHeight: '92vh',
        overflow: 'hidden',
        padding: 0,
        boxShadow: '0 0 60px rgba(0,212,255,0.25)',
        border: '1.5px solid var(--border-bright)',
        position: 'relative',
        background: '#04060c',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px 16px',
          borderBottom: '1px solid var(--border)',
          background: 'rgba(0,212,255,0.02)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <span style={{ fontSize: 24, animation: 'pulse 1s infinite' }}>🤖</span>
            <div>
              <div style={{
                fontFamily: 'Orbitron, monospace',
                fontSize: 16,
                fontWeight: 900,
                background: 'linear-gradient(135deg, var(--accent-cyan), var(--accent-blue))',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                letterSpacing: '0.1em',
              }}>AEGIS OS — AI EXPLAINABILITY & REASONING CONSOLE</div>
              <div style={{
                color: 'var(--text-secondary)',
                fontSize: 11,
                marginTop: 2,
                fontFamily: 'Space Mono, monospace'
              }}>TOPIC FOCUS: {displayDebate.topic.toUpperCase()}</div>
            </div>
          </div>
          
          {/* Phase Steps progress */}
          <div style={{ display: 'flex', gap: 20, alignItems: 'center', marginTop: 16 }}>
            {PHASES.map((phase, i) => (
              <React.Fragment key={phase}>
                <PhaseStep phase={phase} current={displayDebate.phase} />
                {i < PHASES.length - 1 && (
                  <div style={{
                    flex: 1,
                    height: 2,
                    background: PHASES.indexOf(displayDebate.phase) > i
                      ? 'var(--accent-green)'
                      : 'var(--border)',
                    transition: 'background 0.4s ease',
                  }} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Console View Area */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }} ref={scrollRef}>
          
          {/* PHASE 1: COLLECTING EVIDENCE */}
          {displayDebate.phase === 'collecting' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, animation: 'fadeIn 0.3s ease-out' }}>
              <div style={{ fontFamily: 'Orbitron', fontSize: '12px', color: 'var(--accent-cyan)', borderBottom: '1px solid var(--border)', paddingBottom: '6px' }}>
                📡 PHASE 1: COLLECTING OPERATIONAL EVIDENCE
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {evidenceChecklist.map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12, fontFamily: 'Space Mono', color: item.done ? 'white' : 'var(--text-muted)' }}>
                    <span style={{ color: item.done ? 'var(--accent-green)' : 'var(--accent-amber)', fontWeight: 'bold' }}>
                      {item.done ? '✓ READY' : '⏳ SYNCING...'}
                    </span>
                    <span>{item.label}</span>
                  </div>
                ))}
              </div>

              {/* Progress bar */}
              <div style={{ marginTop: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'Space Mono', fontSize: '10px', color: 'var(--text-muted)', marginBottom: 4 }}>
                  <span>EVIDENCE SYNC INDEX</span>
                  <span>{Math.min(collectProgress, 100)}%</span>
                </div>
                <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ width: `${Math.min(collectProgress, 100)}%`, height: '100%', background: 'var(--accent-cyan)', transition: 'width 0.3s ease' }} />
                </div>
              </div>

              {/* Simulated terminal activity logs */}
              <div style={{
                background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border)', borderRadius: 6,
                padding: 12, fontFamily: 'Space Mono', fontSize: 10, color: 'var(--accent-cyan)',
                display: 'flex', flexDirection: 'column', gap: 4
              }}>
                <div>[12:02:00] Initializing Strategic Reasoner Kernel...</div>
                {collectProgress >= 40 && <div>[12:02:01] Binding cameras & sensor loops...</div>}
                {collectProgress >= 80 && <div>[12:02:02] Analyzing ticketing databases & GPS profiles...</div>}
                {collectProgress >= 90 && <div>[12:02:03] Strategic analysis loaded. Formulating agent arguments...</div>}
              </div>
            </div>
          )}

          {/* PHASE 2: DEBATING */}
          {displayDebate.phase === 'debating' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 20, animation: 'fadeIn 0.3s ease-out' }}>
              <div>
                <div style={{ fontFamily: 'Orbitron', fontSize: '12px', color: 'var(--accent-amber)', borderBottom: '1px solid var(--border)', paddingBottom: '6px', marginBottom: 12 }}>
                  🤖 ACTIVE AGENT PROPOSALS
                </div>
                {displayDebate.arguments.map((arg, i) => (
                  <ArgumentCard key={arg.agentId} arg={arg} index={i} visible={i < visibleArgs} />
                ))}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                <div style={{ fontFamily: 'Orbitron', fontSize: '12px', color: 'var(--accent-amber)', borderBottom: '1px solid var(--border)', paddingBottom: '6px', marginBottom: 12 }}>
                  💬 TRANSCRIPT DEBATE FEED
                </div>
                <div style={{
                  flex: 1, background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border)',
                  borderRadius: 6, padding: '12px', display: 'flex', flexDirection: 'column', gap: 12,
                  fontFamily: 'Space Mono', fontSize: '10px', overflowY: 'auto'
                }}>
                  {debateLogs.map((log, i) => {
                    const isVisible = i < visibleArgs;
                    return (
                      <div key={log.id} style={{ opacity: isVisible ? 1 : 0, transition: 'opacity 0.3s ease', borderBottom: '1px dashed rgba(255,255,255,0.05)', paddingBottom: 6 }}>
                        <span style={{ color: log.color, fontWeight: 700 }}>{log.agentName}:</span>
                        <div style={{ color: 'white', marginTop: 3, lineHeight: 1.4 }}>{log.text}</div>
                      </div>
                    );
                  })}
                  {visibleArgs < debateLogs.length && (
                    <div style={{ color: 'var(--accent-amber)', animation: 'pulse 1s infinite' }}>
                      ⏳ Agent is formulating counterproposal...
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* PHASE 3: DECIDING */}
          {displayDebate.phase === 'deciding' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, animation: 'fadeIn 0.3s ease-out' }}>
              <div style={{ fontFamily: 'Orbitron', fontSize: '12px', color: 'var(--accent-amber)', borderBottom: '1px solid var(--border)', paddingBottom: '6px' }}>
                ⚖️ PHASE 3: EVALUATING PROPOSALS & UTILITY MATRIX
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {isGateB ? (
                  <>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontFamily: 'Space Mono', color: 'white', marginBottom: 4 }}>
                        <span>Crowd proposal: Full Gate B closure</span>
                        <span style={{ color: 'var(--accent-red)' }}>Utility: 54% (REJECTED - causes crush outside)</span>
                      </div>
                      <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{ width: '54%', height: '100%', background: 'var(--accent-red)' }} />
                      </div>
                    </div>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontFamily: 'Space Mono', color: 'white', marginBottom: 4 }}>
                        <span>Transport proposal: Maintain open flow</span>
                        <span style={{ color: 'var(--accent-amber)' }}>Utility: 62% (REJECTED - doesn't solve gate bottleneck)</span>
                      </div>
                      <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{ width: '62%', height: '100%', background: 'var(--accent-amber)' }} />
                      </div>
                    </div>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontFamily: 'Space Mono', color: 'white', marginBottom: 4 }}>
                        <span>Combined operations redirection (Escorted single-file + diversion to Gate D)</span>
                        <span style={{ color: 'var(--accent-green)', fontWeight: 700 }}>Utility: 96% (WINNER - Consensus Authorized)</span>
                      </div>
                      <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{ width: '96%', height: '100%', background: 'var(--accent-green)' }} />
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontFamily: 'Space Mono', color: 'white', marginBottom: 4 }}>
                        <span>Local ambulance dispatch only</span>
                        <span style={{ color: 'var(--accent-red)' }}>Utility: 74% (Partially integrated)</span>
                      </div>
                      <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{ width: '74%', height: '100%', background: 'var(--accent-red)' }} />
                      </div>
                    </div>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontFamily: 'Space Mono', color: 'white', marginBottom: 4 }}>
                        <span>Multi-system Storm response (HVAC + Medical pre-position + Extra trains)</span>
                        <span style={{ color: 'var(--accent-green)', fontWeight: 700 }}>Utility: 94% (WINNER - Consensus Authorized)</span>
                      </div>
                      <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{ width: '94%', height: '100%', background: 'var(--accent-green)' }} />
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '16px 0' }}>
                <div style={{
                  width: 32, height: 32,
                  border: '2px solid transparent',
                  borderTopColor: 'var(--accent-amber)',
                  borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite',
                }} />
                <div style={{ fontFamily: 'Orbitron', fontSize: 11, color: 'var(--accent-amber)', letterSpacing: '0.05em' }}>
                  Evaluating consensus matrix...
                </div>
              </div>
            </div>
          )}

          {/* PHASE 4: DECIDED */}
          {displayDebate.phase === 'decided' && displayDebate.finalDecision && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, animation: 'fadeIn 0.3s ease-out' }}>
              <div style={{ fontFamily: 'Orbitron', fontSize: '12px', color: 'var(--accent-green)', borderBottom: '1px solid var(--border)', paddingBottom: '6px' }}>
                👑 PHASE 4: DECISION DEPLOYING & ACTIONS AUTHORIZED
              </div>

              <div style={{
                background: 'rgba(25, 255, 129, 0.03)',
                border: '1.5px solid rgba(16, 185, 129, 0.3)',
                borderRadius: 8,
                padding: '16px 20px',
                display: 'flex',
                flexDirection: 'column',
                gap: 12
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontFamily: 'Orbitron', fontSize: '13px', fontWeight: 900, color: 'var(--accent-green)' }}>
                      EXECUTIVE DECISION DEPLOYED SUCCESSFULLY
                    </div>
                    <div style={{ fontSize: '10px', color: 'var(--text-secondary)', fontFamily: 'Space Mono', marginTop: 2 }}>
                      Simulation story state synchronized.
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontFamily: 'Orbitron', fontSize: '24px', fontWeight: 900, color: 'var(--accent-green)', textShadow: '0 0 10px rgba(16,185,129,0.3)' }}>
                      {displayDebate.finalDecision.confidence}%
                    </div>
                    <span style={{ fontSize: '8px', color: 'var(--text-muted)', fontFamily: 'Space Mono' }}>AI CONFIDENCE</span>
                  </div>
                </div>

                <div style={{ borderTop: '1px dashed rgba(16, 185, 129, 0.2)', paddingTop: '10px' }}>
                  <div style={{ fontFamily: 'Orbitron', fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '0.08em', marginBottom: 8 }}>
                    AUTHORIZED EXECUTION PATH
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {displayDebate.finalDecision.actions.map((action, i) => (
                      <div key={i} style={{ display: 'flex', gap: 8, fontSize: '11px', color: 'white', fontFamily: 'Space Mono' }}>
                        <span style={{ color: 'var(--accent-green)' }}>[{i + 1}]</span>
                        <span>{action}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ borderTop: '1px dashed rgba(16, 185, 129, 0.2)', paddingTop: '10px', fontSize: 11, fontFamily: 'Space Mono' }}>
                  <div>
                    <span style={{ color: 'var(--accent-cyan)', fontWeight: 700 }}>EXPECTED OUTCOME: </span>
                    <span style={{ color: 'white' }}>{displayDebate.finalDecision.expectedOutcome}</span>
                  </div>
                  <div style={{ marginTop: 4 }}>
                    <span style={{ color: 'var(--text-muted)' }}>RATIONALE: </span>
                    <span style={{ color: 'var(--text-secondary)' }}>{displayDebate.finalDecision.reasoning}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Close Button Footer */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid var(--border)',
          background: 'rgba(0,212,255,0.01)',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 12
        }}>
          {displayDebate.phase === 'decided' ? (
            <button
              onClick={() => {
                setClosedByUser(true);
                if (onClose) onClose();
              }}
              style={{
                background: 'var(--accent-blue)', color: 'black',
                border: 'none', borderRadius: '4px', padding: '8px 24px',
                fontFamily: 'Orbitron', fontSize: '11px', fontWeight: 900,
                cursor: 'pointer', boxShadow: '0 0 15px rgba(0, 212, 255, 0.3)',
                letterSpacing: '0.05em'
              }}
            >
              DISMISS & RESUME MONITORING
            </button>
          ) : (
            <div style={{ fontFamily: 'Space Mono', fontSize: '10px', color: 'var(--accent-amber)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="live-badge" style={{ background: 'rgba(255,179,0,0.1)', color: 'var(--accent-amber)', border: '1px solid var(--accent-amber)' }}>
                ● STRATEGY ENGINE DEBATE RESOLUTION IN PROGRESS
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
