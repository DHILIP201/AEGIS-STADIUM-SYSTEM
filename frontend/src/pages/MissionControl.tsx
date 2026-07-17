import React from 'react';
import { AegisState } from '../types/aegis';
import RiskMeter from '../components/RiskMeter';
import MetricsBar from '../components/MetricsBar';
import AgentPanel from '../components/AgentPanel';
import StadiumHeatmap from '../components/StadiumHeatmap';
import RecommendationsPanel from '../components/RecommendationsPanel';
import Scorecards from '../components/Scorecards';
import ConfidenceChart from '../components/ConfidenceChart';
import EventGraph from '../components/EventGraph';
import NLControl from '../components/NLControl';
import Timeline from '../components/Timeline';
import DebateModal from '../components/DebateModal';

interface Props {
  state: AegisState | null;
  sendMessage: (msg: object) => void;
  connected: boolean;
}

export default function MissionControl({ state, sendMessage, connected }: Props) {
  if (!state) {
    return (
      <div style={{
        padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px',
        background: 'var(--bg-deep)', minHeight: 'calc(100vh - var(--nav-height))',
        justifyContent: 'center', alignItems: 'center', color: 'var(--text-secondary)'
      }}>
        <div style={{ fontSize: 16, fontFamily: 'Space Mono, monospace' }}>Loading Mission Control State...</div>
      </div>
    );
  }

  const [varOpen, setVarOpen] = React.useState(false);
  const [lastEventId, setLastEventId] = React.useState('');
  const [toast, setToast] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (state.currentEventId && state.currentEventId !== lastEventId) {
      setLastEventId(state.currentEventId);
      const evt = state.timeline.find(e => e.id === state.currentEventId);
      if (evt) {
        setToast(`🚨 EVENT UPDATE: ${evt.title} — ${evt.description}`);
        const t = setTimeout(() => setToast(null), 4500);
        return () => clearTimeout(t);
      }
    }
  }, [state.currentEventId, state.timeline, lastEventId]);

  const handleScenario = (scenario: string) => {
    sendMessage({ type: 'scenario', scenario });
  };

  const handleSpeed = (speed: number) => {
    sendMessage({ type: 'speed', speed });
  };

  const handleReset = () => {
    sendMessage({ type: 'reset' });
  };

  const handleSendNL = (query: string) => {
    sendMessage({ type: 'nl', query });
  };

  const handleWowSimulation = () => {
    // Reset simulation, then set speed to 20x so the 1800s match plays in 90 seconds
    sendMessage({ type: 'reset' });
    setTimeout(() => {
      sendMessage({ type: 'speed', speed: 20 });
    }, 200);
  };

  // Helper for reasoning pipeline statuses
  const getPipelineStep = (stepTime: number, label: string) => {
    const isCompleted = state.storyTime >= stepTime;
    return (
      <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
        <span style={{
          color: isCompleted ? 'var(--accent-green)' : 'var(--text-muted)',
          fontWeight: 'bold'
        }}>{isCompleted ? '✓' : '⧖'}</span>
        <span style={{
          color: isCompleted ? 'var(--text-primary)' : 'var(--text-muted)'
        }}>{label}</span>
      </div>
    );
  };

  return (
    <div style={{
      background: 'var(--bg-deep)',
      minHeight: 'calc(100vh - var(--nav-height))',
      padding: '12px 16px',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      overflowX: 'hidden'
    }}>
      {/* Debate Modal Overlay */}
      {state.debate && state.debate.phase !== null && (
        <DebateModal debate={state.debate} />
      )}

      {/* Toast Notification Banner */}
      {toast && (
        <div style={{
          position: 'fixed', top: '76px', right: '16px', zIndex: 1100,
          background: 'rgba(3,4,10,0.95)', border: '1px solid var(--accent-orange)',
          borderRadius: '8px', padding: '12px 16px', maxWidth: '380px',
          boxShadow: '0 4px 25px rgba(255,107,53,0.3)',
          fontFamily: 'Space Mono, monospace', fontSize: '10px',
          color: 'var(--text-primary)',
          animation: 'slideInRight 0.3s ease-out'
        }}>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span style={{ fontSize: '14px' }}>⚡</span>
            <div>{toast}</div>
          </div>
        </div>
      )}

      {/* Row 1: Risk Meter */}
      <div style={{ height: '70px', flexShrink: 0 }}>
        <RiskMeter
          riskLevel={state.riskLevel}
          riskLabel={state.riskLabel}
          riskColor={state.riskColor}
        />
      </div>

      {/* Row 2: Metrics Bar */}
      <div style={{ height: '80px', flexShrink: 0 }}>
        <MetricsBar metrics={state.metrics} storyTime={state.storyTime} />
      </div>

      {/* Row 3: Main 3-Column Section */}
      <div style={{
        display: 'flex',
        gap: '12px',
        height: '440px',
        flexShrink: 0
      }}>
        {/* Left: Agent Panel */}
        <div className="glass-card" style={{
          width: '22%',
          display: 'flex',
          flexDirection: 'column',
          padding: '12px',
          overflow: 'hidden'
        }}>
          {/* Reasoning Pipeline Widget */}
          <div style={{
            background: 'rgba(0, 212, 255, 0.03)',
            border: '1px dashed var(--border)',
            borderRadius: '8px',
            padding: '8px 12px',
            marginBottom: '8px',
            fontSize: '9px',
            fontFamily: 'Space Mono, monospace'
          }}>
            <div style={{
              fontFamily: 'Orbitron, monospace',
              fontSize: '9px',
              fontWeight: 700,
              color: 'var(--accent-cyan)',
              marginBottom: '6px',
              letterSpacing: '0.08em'
            }}>🧠 REASONING PIPELINE</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              {getPipelineStep(0, 'Weather Streams Updated')}
              {getPipelineStep(180, 'Transport Arrivals Checked')}
              {getPipelineStep(180, 'Crowd Ingress Modeled')}
              {getPipelineStep(360, 'Subsystem Risk Evaluated')}
              {getPipelineStep(360, 'Strategy Engine Resolved')}
            </div>
          </div>

          {/* AI Services Deployment Transparency Widget */}
          <div style={{
            background: 'rgba(0, 212, 255, 0.01)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            padding: '8px 12px',
            marginBottom: '8px',
            fontSize: '9px',
            fontFamily: 'Space Mono, monospace'
          }}>
            <div style={{
              fontFamily: 'Orbitron, monospace',
              fontSize: '9px',
              fontWeight: 700,
              color: 'var(--accent-blue)',
              marginBottom: '6px',
              letterSpacing: '0.08em',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
              <span>⚙️ AI SERVICES DEPLOYMENT</span>
              <span style={{ fontSize: '8px', color: 'var(--text-muted)' }}>TRANSPARENCY</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
              <div>
                <span style={{ color: 'var(--accent-cyan)' }}>🧠 GENAI (GEMINI)</span>
                <div style={{ color: 'var(--text-secondary)', fontSize: '8px', marginTop: 2, lineHeight: 1.3 }}>
                  • Strategy Gen<br />
                  • Debate Engine<br />
                  • Report Synthesis<br />
                  • Natural Language
                </div>
              </div>
              <div>
                <span style={{ color: 'var(--accent-amber)' }}>⚙️ STABILIZERS</span>
                <div style={{ color: 'var(--text-secondary)', fontSize: '8px', marginTop: 2, lineHeight: 1.3 }}>
                  • Twin Heatmap<br />
                  • Crowd Dynamics<br />
                  • Weather Models<br />
                  • Risk Calculators
                </div>
              </div>
            </div>
          </div>

          <div style={{
            fontFamily: 'Orbitron, monospace',
            fontSize: '11px',
            fontWeight: 700,
            color: 'var(--accent-blue)',
            borderBottom: '1px solid var(--border)',
            paddingBottom: '8px',
            marginBottom: '8px',
            letterSpacing: '0.1em'
          }}>🤖 STADIUM KERNEL AGENTS</div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            <AgentPanel agents={state.agents} />
          </div>
        </div>

        {/* Center: Stadium Digital Twin Heatmap */}
        <div className="glass-card" style={{
          width: '52%',
          display: 'flex',
          flexDirection: 'column',
          padding: '12px',
          overflow: 'hidden',
          position: 'relative'
        }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            borderBottom: '1px solid var(--border)', paddingBottom: '8px', marginBottom: '8px'
          }}>
            <div style={{
              fontFamily: 'Orbitron, monospace', fontSize: '11px', fontWeight: 700,
              color: 'var(--accent-cyan)', letterSpacing: '0.1em'
            }}>🔮 DIGITAL TWIN TWIN-ENGINE</div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span className="live-badge">STADIUM: {state.stadium.name}</span>
              <span style={{
                fontFamily: 'Space Mono, monospace', fontSize: '9px',
                color: 'var(--text-secondary)'
              }}>OCCUPANCY: {state.stadium.currentOccupancy.toLocaleString()} / {state.stadium.totalCapacity.toLocaleString()}</span>
            </div>
          </div>
          <div style={{ flex: 1, position: 'relative' }}>
            <StadiumHeatmap zones={state.stadium.zones} stadiumName={state.stadium.name} />
          </div>
        </div>

        {/* Right: Recommendations Feed */}
        <div className="glass-card" style={{
          width: '26%',
          display: 'flex',
          flexDirection: 'column',
          padding: '12px',
          overflow: 'hidden'
        }}>
          {/* Executive Summary Panel */}
          <div style={{
            padding: '10px 12px',
            background: 'rgba(255, 179, 0, 0.02)',
            border: '1px solid rgba(255, 179, 0, 0.15)',
            borderRadius: '8px',
            marginBottom: '10px',
            fontSize: '11px'
          }}>
            <div style={{
              fontFamily: 'Orbitron, monospace',
              fontSize: '10px',
              fontWeight: 700,
              color: 'var(--accent-amber)',
              borderBottom: '1px solid rgba(255,179,0,0.15)',
              paddingBottom: '4px',
              marginBottom: '6px',
              letterSpacing: '0.08em'
            }}>🛡️ COGNITIVE EXECUTIVE SUMMARY</div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 12px', fontFamily: 'Space Mono, monospace' }}>
              <div>
                <span style={{ color: 'var(--text-muted)', fontSize: '9px' }}>SITUATION: </span>
                <span style={{ color: state.riskColor, fontWeight: 700 }}>{state.riskLabel}</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', fontSize: '9px' }}>CRITICAL AREA: </span>
                <span style={{ color: 'white' }}>{state.storyTime >= 960 ? 'Concourse' : state.storyTime >= 180 ? 'Gate B' : 'None'}</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', fontSize: '9px' }}>EXPECTED PEAK: </span>
                <span style={{ color: 'white' }}>{state.storyTime >= 960 ? '12:25 (Storm)' : state.storyTime >= 180 ? '12:07 (Ingress)' : '12:35 (Halftime)'}</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', fontSize: '9px' }}>BEST ACTION: </span>
                <span style={{ color: 'var(--accent-blue)', fontSize: '9px', fontWeight: 700 }}>{state.storyTime >= 960 ? 'HVAC+Metro+Shelter' : state.storyTime >= 180 ? 'Divert to Gate D' : 'Monitor Flow'}</span>
              </div>
            </div>
            
            <div style={{ marginTop: '8px', borderTop: '1px dashed rgba(255,179,0,0.15)', paddingTop: '6px' }}>
              <div style={{ fontSize: '9px', fontFamily: 'Orbitron', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '3px' }}>
                EXPECTED IMPACT METRICS:
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '4px', textAlign: 'center', fontFamily: 'Space Mono' }}>
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '3px', borderRadius: '4px' }}>
                  <div style={{ fontSize: '8px', color: 'var(--text-muted)' }}>CROWD</div>
                  <div style={{ color: 'var(--accent-green)', fontWeight: 700 }}>{state.storyTime >= 960 ? '-31%' : state.storyTime >= 180 ? '-41%' : 'Stable'}</div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '3px', borderRadius: '4px' }}>
                  <div style={{ fontSize: '8px', color: 'var(--text-muted)' }}>MEDICAL</div>
                  <div style={{ color: 'var(--accent-green)', fontWeight: 700 }}>{state.storyTime >= 960 ? '0 severe' : state.storyTime >= 180 ? '-28%' : 'Low'}</div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '3px', borderRadius: '4px' }}>
                  <div style={{ fontSize: '8px', color: 'var(--text-muted)' }}>TRANSPORT</div>
                  <div style={{ color: 'var(--accent-amber)', fontWeight: 700 }}>{state.storyTime >= 960 ? '+8m' : state.storyTime >= 180 ? '+4m delay' : 'Normal'}</div>
                </div>
              </div>
            </div>
          </div>

          <div style={{
            fontFamily: 'Orbitron, monospace',
            fontSize: '11px',
            fontWeight: 700,
            color: 'var(--accent-amber)',
            borderBottom: '1px solid var(--border)',
            paddingBottom: '8px',
            marginBottom: '8px',
            letterSpacing: '0.1em'
          }}>💡 STRATEGY RECOMMENDATIONS</div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            <RecommendationsPanel
              recommendations={state.recommendations}
              successMetrics={state.successMetrics}
            />
          </div>
        </div>
      </div>

      {/* Row 4: Scorecards and Match Stats/System Health */}
      <div style={{ display: 'flex', gap: '12px', height: '95px', flexShrink: 0 }}>
        {/* Left: Scorecards */}
        <div style={{ width: '60%' }}>
          <Scorecards scorecards={state.scorecards} />
        </div>
        {/* Right: Match Stats & System Health */}
        <div className="glass-card" style={{
          width: '40%',
          padding: '8px 12px',
          display: 'flex',
          gap: '16px',
          borderLeft: '3px solid var(--accent-cyan)'
        }}>
          {/* Match Stats */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div style={{
              fontFamily: 'Orbitron, monospace', fontSize: '9px', fontWeight: 700,
              color: 'var(--text-secondary)', borderBottom: '1px solid var(--border)',
              paddingBottom: '3px', marginBottom: '4px', letterSpacing: '0.05em'
            }}>📊 OPERATIONAL METRICS</div>
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr', gap: '1px',
              fontFamily: 'Space Mono, monospace', fontSize: '8px', color: 'var(--text-primary)'
            }}>
              <div>FANS: <span style={{ color: 'white', fontWeight: 700 }}>{state.stadium.currentOccupancy.toLocaleString()}</span></div>
              <div>ACCURACY: <span style={{ color: 'var(--accent-green)', fontWeight: 700 }}>{(94.2 - (state.storyTime % 4) * 0.15).toFixed(1)}% (95% CI)</span></div>
              <div>AI DECISIONS: <span style={{ color: 'white', fontWeight: 700 }}>{Math.floor(41 + state.storyTime / 12)}</span></div>
              <div>AVG RESPONSE: <span style={{ color: 'white', fontWeight: 700 }}>{(1.72 + (state.storyTime % 6) * 0.04).toFixed(2)}s</span></div>
            </div>
          </div>

          {/* System Health */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderLeft: '1px solid var(--border)', paddingLeft: '12px' }}>
            <div style={{
              fontFamily: 'Orbitron, monospace', fontSize: '9px', fontWeight: 700,
              color: 'var(--text-secondary)', borderBottom: '1px solid var(--border)',
              paddingBottom: '3px', marginBottom: '4px', letterSpacing: '0.05em'
            }}>⚙️ SYSTEM DIAGNOSTICS</div>
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1px 8px',
              fontFamily: 'Space Mono, monospace', fontSize: '8px', color: 'var(--text-primary)'
            }}>
              <div>GEMINI: <span style={{ color: 'var(--accent-green)' }}>● ONLINE</span></div>
              <div>WEBSOCKET: <span style={{ color: 'var(--accent-green)' }}>● ACTIVE</span></div>
              <div>DB POOL: <span style={{ color: 'var(--accent-green)' }}>● HEALTHY</span></div>
              <div>LATENCY: <span style={{ color: 'white' }}>{(40 + (state.storyTime % 5) * 4)}ms</span></div>
              <div>CPU LOAD: <span style={{ color: 'white' }}>18%</span></div>
              <div>MEM LOAD: <span style={{ color: 'white' }}>34%</span></div>
            </div>
          </div>
        </div>
      </div>

      {/* Row 5: 3-Column Charts & Control Panel */}
      <div style={{
        display: 'flex',
        gap: '12px',
        height: '240px',
        flexShrink: 0
      }}>
        {/* Bottom Left: Confidence Chart */}
        <div className="glass-card" style={{ width: '34%', padding: '12px', overflow: 'hidden' }}>
          <ConfidenceChart confidenceHistory={state.confidenceHistory} />
        </div>

        {/* Bottom Center: SVG Event Graph */}
        <div className="glass-card" style={{
          width: '34%', padding: '12px', overflow: 'hidden',
          display: 'flex', flexDirection: 'column'
        }}>
          <div style={{
            fontFamily: 'Orbitron, monospace', fontSize: '10px', fontWeight: 700,
            color: 'var(--text-secondary)', borderBottom: '1px solid var(--border)',
            paddingBottom: '6px', marginBottom: '8px', letterSpacing: '0.08em'
          }}>⚡ CAUSAL EVENT RELATIONSHIP GRAPH</div>
          <div style={{ flex: 1 }}>
            <EventGraph eventGraph={state.eventGraph} />
          </div>
        </div>

        {/* Bottom Right: Natural Language Input */}
        <div className="glass-card" style={{ width: '32%', padding: '12px', overflow: 'hidden' }}>
          <NLControl
            onSend={handleSendNL}
            nlResponse={state.nlResponse}
            onScenario={handleScenario}
            onSpeed={handleSpeed}
            onReset={handleReset}
          />
        </div>
      </div>

      {/* Row 6: Timeline */}
      <div className="glass-card" style={{
        height: '130px', flexShrink: 0, padding: '12px', display: 'flex', flexDirection: 'column',
        overflow: 'hidden'
      }}>
        <div style={{
          fontFamily: 'Orbitron, monospace', fontSize: '10px', fontWeight: 700,
          color: 'var(--text-secondary)', borderBottom: '1px solid var(--border)',
          paddingBottom: '6px', marginBottom: '4px', letterSpacing: '0.08em'
        }}>🎬 SCENARIO-BASED DIGITAL TWIN SIMULATION TIMELINE</div>
        <div style={{ flex: 1 }}>
          <Timeline timeline={state.timeline} storyProgress={state.storyProgress} />
        </div>
      </div>

      {/* Row 7: Mini Controls Bar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0 8px',
        height: '32px',
        fontSize: '9px',
        fontFamily: 'Space Mono, monospace',
        color: 'var(--text-muted)',
        borderTop: '1px solid var(--border)',
        paddingTop: '4px'
      }}>
        <div>Demo Mode: Scenario-Based Digital Twin Simulation | GenAI: Gemini 2.5 Flash | Operational State: Healthy</div>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={handleWowSimulation}
              style={{
                background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-cyan))',
                border: 'none',
                color: 'black',
                padding: '4px 12px',
                borderRadius: '4px',
                fontSize: '9px',
                fontWeight: 900,
                cursor: 'pointer',
                fontFamily: 'Orbitron',
                letterSpacing: '0.05em',
                boxShadow: '0 0 10px rgba(0,212,255,0.3)'
              }}
            >
              🚀 RUN MATCH DAY SIMULATION (90s JUDGE OVERVIEW)
            </button>
            <button
              onClick={() => handleScenario('congestion')}
              style={{
                background: 'rgba(0,212,255,0.06)', border: '1px solid rgba(0,212,255,0.15)',
                color: 'var(--accent-blue)', padding: '4px 8px', borderRadius: '4px',
                fontSize: '8px', cursor: 'pointer', fontFamily: 'Space Mono'
              }}
            >
              [GATE B PEAK]
            </button>
            <button
              onClick={() => handleScenario('storm')}
              style={{
                background: 'rgba(0,212,255,0.06)', border: '1px solid rgba(0,212,255,0.15)',
                color: 'var(--accent-blue)', padding: '4px 8px', borderRadius: '4px',
                fontSize: '8px', cursor: 'pointer', fontFamily: 'Space Mono'
              }}
            >
              [STORM MODE]
            </button>
            <button
              onClick={() => setVarOpen(true)}
              style={{
                background: 'rgba(0,255,204,0.1)', border: '1px solid rgba(0,255,204,0.3)',
                color: 'var(--accent-cyan)', padding: '4px 8px', borderRadius: '4px',
                fontSize: '8px', cursor: 'pointer', fontFamily: 'Space Mono', fontWeight: 700
              }}
            >
              [🔍 VAR REPLAY]
            </button>
            <button
              onClick={() => handleScenario('report')}
              style={{
                background: 'rgba(0,212,255,0.06)', border: '1px solid rgba(0,212,255,0.15)',
                color: 'var(--accent-blue)', padding: '4px 8px', borderRadius: '4px',
                fontSize: '8px', cursor: 'pointer', fontFamily: 'Space Mono'
              }}
            >
              [FINAL REPORT]
            </button>
            <button
              onClick={handleReset}
              style={{
                background: 'rgba(255,51,102,0.06)', border: '1px solid rgba(255,51,102,0.15)',
                color: 'var(--accent-red)', padding: '4px 8px', borderRadius: '4px',
                fontSize: '8px', cursor: 'pointer', fontFamily: 'Space Mono'
              }}
            >
              [RESET]
            </button>
          </div>
          <div>SPEED: {state.storyProgress * 100 > 99 ? '0' : state.storyProgress > 0 ? '20' : '0'}x</div>
        </div>
      </div>

      {/* VAR Replay Modal Overlay */}
      {varOpen && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1100,
          background: 'rgba(3,4,10,0.95)',
          backdropFilter: 'blur(10px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          animation: 'fadeIn 0.3s ease',
          padding: 20
        }}>
          <div className="glass-card-bright" style={{
            width: '100%', maxWidth: '600px', padding: '24px',
            border: '1px solid rgba(0, 212, 255, 0.4)',
            boxShadow: '0 0 50px rgba(0, 212, 255, 0.25)',
            display: 'flex', flexDirection: 'column', gap: 16
          }}>
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              borderBottom: '1px solid var(--border)', paddingBottom: '12px'
            }}>
              <div style={{
                fontFamily: 'Orbitron, monospace', fontSize: 14, fontWeight: 900,
                color: 'var(--accent-blue)', letterSpacing: '0.1em'
              }}>🔍 AEGIS VAR — INCIDENT SIMULATION REPLAY REVIEW</div>
              <button
                onClick={() => setVarOpen(false)}
                style={{
                  background: 'none', border: 'none', color: 'var(--accent-red)',
                  fontSize: 16, cursor: 'pointer', fontWeight: 'bold'
                }}
              >✕</button>
            </div>

            <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 11, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div><b>VENUE:</b> AT&T Stadium, Arlington TX | <b>INCIDENT ID:</b> INC-027 (Gate B Congestion)</div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, position: 'relative', paddingLeft: 16 }}>
                <div style={{ position: 'absolute', left: 4, top: 8, bottom: 8, width: 1, background: 'var(--border-bright)', borderStyle: 'dashed' }} />
                
                <div>
                  <span style={{ color: 'var(--accent-orange)' }}>● PHASE 1: PREDICTION [12:03]</span>
                  <div style={{ color: 'var(--text-secondary)', paddingLeft: 12, marginTop: 2, lineHeight: 1.4 }}>
                    Crowd Kernel detects ingress rate of +4.2%/min. Predicts Gate B overload in 7 minutes (94.3% accuracy threshold crossed, 142 simulated data vectors).
                  </div>
                </div>

                <div>
                  <span style={{ color: 'var(--accent-amber)' }}>● PHASE 2: COGNITIVE DEBATE [12:07]</span>
                  <div style={{ color: 'var(--text-secondary)', paddingLeft: 12, marginTop: 2, lineHeight: 1.4 }}>
                    Conflict resolved: Crowd Agent requests immediate Gate B closure. Transport Agent opposes due to incoming 4,200 fan Metro wave. Strategy Engine runs debate resolution.
                  </div>
                </div>

                <div>
                  <span style={{ color: 'var(--accent-cyan)' }}>● PHASE 3: EXECUTIVE DISPATCH [12:09]</span>
                  <div style={{ color: 'var(--text-secondary)', paddingLeft: 12, marginTop: 2, lineHeight: 1.4 }}>
                    4-tier mitigation executed: Gate D fully opened, 14 corridor volunteers routed, digital redirect signage activated, Metro Line 1 delay injected.
                  </div>
                </div>

                <div>
                  <span style={{ color: 'var(--accent-green)' }}>● PHASE 4: AUDITED OUTCOME [12:18]</span>
                  <div style={{ color: 'var(--text-secondary)', paddingLeft: 12, marginTop: 2, lineHeight: 1.4 }}>
                    Safe state restored in 8 minutes. Gate B density successfully reduced from 91% to 58%. Zero security or injury reports registered.
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
              <button
                onClick={() => setVarOpen(false)}
                style={{
                  background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-cyan))',
                  border: 'none', color: 'black',
                  padding: '6px 16px', borderRadius: 4, fontFamily: 'Orbitron',
                  fontWeight: 900, fontSize: 9, cursor: 'pointer', letterSpacing: '0.05em'
                }}
              >CLOSE INCIDENT REVIEW</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
