import React, { useState } from 'react';
import { AegisState } from '../types/aegis';
import { triggerToast } from '../config';

interface Props {
  state: AegisState | null;
  sendMessage?: (msg: any) => void;
  selectedZoneId: string | null;
  onSelectZone: (zoneId: string | null) => void;
}

export default function CommandCenter({ state, sendMessage, selectedZoneId, onSelectZone }: Props) {
  const [decisions, setDecisions] = useState([
    { id: 1, action: "Open Gate D to full capacity", confidence: 94, status: "pending" },
    { id: 2, deploy: "Deploy 18 reserve volunteers to Gate B corridor", confidence: 92, status: "pending" },
    { id: 3, action: "Delay Metro Line 1 arrivals by 3 minutes", confidence: 89, status: "pending" },
    { id: 4, action: "Pre-position 4 medics at outdoor shelters", confidence: 84, status: "pending" },
    { id: 5, action: "Activate emergency wet-weather protocol", confidence: 93, status: "pending" }
  ]);

  const [activeExplain, setActiveExplain] = useState<number | null>(null);

  const handleDecisionClick = (id: number, status: "approved" | "rejected") => {
    setDecisions(prev => prev.map(d => d.id === id ? { ...d, status } : d));
    triggerToast(`Decision #${id} has been ${status.toUpperCase()} by the Match Operator.`, status === 'approved' ? 'success' : 'error');
  };

  const handleScenarioTrigger = (scenario: string) => {
    if (sendMessage) {
      sendMessage({ type: 'scenario', scenario });
      triggerToast(`MOC Command Registered: scenario [${scenario.toUpperCase()}] synchronized.`, 'info');
    }
  };

  const getExplanation = (id: number) => {
    switch (id) {
      case 1:
        return "CRITICAL CROWD REDIRECT:\nGate B occupancy is at 91% (critical). Crowd Agent predicts crush risk if unchecked. Gate D has 59% spare capacity. Redirect corridor approved.";
      case 2:
        return "RESOURCE CORRIDOR GUIDANCE:\n18 volunteers required to physically guide incoming flow from Metro exits to Gate D and update signage boards. Estimated redirect efficiency: 340 fans/minute.";
      case 3:
        return "TRANSIT CHOKEPOINT MANAGEMENT:\nDelaying Metro exits by 3 minutes prevents 2,400 fans from piling up outside the restricted Gate B bottleneck while volunteers redirect the flow.";
      case 4:
        return "HEAT & SLIP PREVENTION:\nIndoor temperatures are at 39°C. 3 thermal stressors detected. Pre-positioning medics reduces response time from 4.2 minutes to 1.8 minutes.";
      case 5:
        return "WET-WEATHER SHELTERING:\nStorm front is 12 minutes out (probability 84%). Covered concourses must be opened now to shelter 22,000 incoming fans.";
      default:
        return "";
    }
  };

  if (!state) {
    return (
      <div style={{
        padding: '24px', display: 'flex', justifyContent: 'center', alignItems: 'center',
        background: 'var(--bg-deep)', minHeight: 'calc(100vh - var(--nav-height))', color: 'var(--text-secondary)'
      }}>
        <div style={{ fontSize: 16, fontFamily: 'Space Mono, monospace' }}>Loading Match Operations Center...</div>
      </div>
    );
  }

  // Dynamic match clock
  const matchClockStr = state.storyTime < 450 ? 'PRE-MATCH' : 
                 state.storyTime < 1000 ? `${Math.floor((state.storyTime - 450) / 11) + 1}' (1H)` : 
                 state.storyTime < 1140 ? 'HALFTIME' : 
                 state.storyTime < 1700 ? `${Math.floor((state.storyTime - 1140) / 10) + 46}' (2H)` : 
                 state.storyTime < 1800 ? '90+3\' (OT)' : 'FULLTIME';

  const gateBDensity = state.stadium.zones.find(z => z.id === 'south_gate_b')?.density ?? 0;
  const isGateBCongested = gateBDensity > 0.75;
  const isStormActive = state.storyTime >= 1140;

  const isCam1Focused = selectedZoneId !== null && ['north_gate_a', 'south_gate_b', 'east_gate_c'].includes(selectedZoneId);
  const activeZone1 = isCam1Focused ? state.stadium.zones.find(z => z.id === selectedZoneId) : null;
  const c1Name = activeZone1 ? activeZone1.name.toUpperCase() : 'GATE B';
  const c1Density = activeZone1 ? Math.round(activeZone1.density * 100) : Math.round(gateBDensity * 100);
  const c1Objects = activeZone1 ? activeZone1.current : (isGateBCongested ? 432 : 124);
  const c1Status = activeZone1 ? (activeZone1.risk === 'safe' ? '● NOMINAL' : `⚠️ ${activeZone1.risk.toUpperCase()}`) : (isGateBCongested ? '⚠️ CONGESTED' : '● NOMINAL');

  const isCam2Focused = selectedZoneId === 'west_gate_d';
  const activeZone2 = isCam2Focused ? state.stadium.zones.find(z => z.id === 'west_gate_d') : null;
  const c2Density = activeZone2 ? Math.round(activeZone2.density * 100) : Math.round((state.stadium.zones.find(z => z.id === 'west_gate_d')?.density ?? 0) * 100);

  const isCam3Focused = selectedZoneId === 'concourse_main';
  const activeZone3 = isCam3Focused ? state.stadium.zones.find(z => z.id === 'concourse_main') : null;

  const isCam4Focused = selectedZoneId !== null && ['field_level', 'lower_bowl', 'upper_bowl'].includes(selectedZoneId);
  const activeZone4 = isCam4Focused ? state.stadium.zones.find(z => z.id === selectedZoneId) : null;
  const c4Name = activeZone4 ? activeZone4.name.toUpperCase() : 'SECTION 112 AID';

  const foodQueueMin = Math.round(state.metrics.occupancy / 10000 + 4);
  const restroomQueueMin = Math.round(state.metrics.occupancy / 12000 + 2);

  return (
    <div style={{
      background: 'var(--bg-deep)',
      minHeight: 'calc(100vh - var(--nav-height))',
      padding: '24px',
      display: 'flex',
      flexDirection: 'column',
      gap: '20px',
      overflowY: 'auto'
    }}>
      {/* MOC Header Banner */}
      <div style={{
        background: 'rgba(5, 6, 13, 0.6)', border: '1.5px solid var(--accent-blue)',
        borderRadius: '12px', padding: '16px 20px', display: 'flex',
        justifyContent: 'space-between', alignItems: 'center',
        boxShadow: '0 0 25px rgba(0, 212, 255, 0.05)'
      }}>
        <div>
          <div style={{
            fontFamily: 'Orbitron, monospace', fontSize: '18px', fontWeight: 900,
            background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-cyan))',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            letterSpacing: '0.08em'
          }}>
            🏆 FIFA MATCH OPERATIONS CENTER (MOC)
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px', fontFamily: 'Space Mono, monospace' }}>
            AEGIS OPERATING SYSTEM • VENUE COMMAND CONTROL PANEL • AT&T STADIUM
          </div>
        </div>

        <div style={{
          display: 'flex', gap: '20px', fontFamily: 'Space Mono, monospace', fontSize: '10px',
          color: 'var(--text-primary)'
        }}>
          <div>STATUS: <span style={{ color: 'var(--accent-green)', fontWeight: 700 }}>● SECURE</span></div>
          <div>MODE: <span style={{ color: 'var(--accent-cyan)', fontWeight: 700 }}>INTEGRATED COCKPIT</span></div>
          <div>TICK RATE: <span style={{ color: 'white' }}>10Hz</span></div>
        </div>
      </div>

      {/* Row 1: Interactive Simulation Control Center */}
      <div className="glass-card" style={{ padding: '16px', borderLeft: '4px solid var(--accent-amber)' }}>
        <div style={{
          fontFamily: 'Orbitron, monospace', fontSize: '12px', fontWeight: 700,
          color: 'var(--accent-amber)', borderBottom: '1px solid var(--border)',
          paddingBottom: '6px', marginBottom: '12px', letterSpacing: '0.05em'
        }}>
          🎮 AEGIS OS — SIMULATION CONTROL CENTER (JUMP TIMELINE EVENTS)
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button onClick={() => handleScenarioTrigger('sunny')} style={{ background: 'rgba(255,179,0,0.1)', border: '1px solid var(--accent-amber)', color: 'var(--accent-amber)', padding: '6px 12px', borderRadius: '4px', fontSize: '10px', fontFamily: 'Space Mono', cursor: 'pointer', fontWeight: 700 }}>
            ☀ SUNNY (KICKOFF)
          </button>
          <button onClick={() => handleScenarioTrigger('surge')} style={{ background: 'rgba(0,212,255,0.1)', border: '1px solid var(--accent-blue)', color: 'var(--accent-blue)', padding: '6px 12px', borderRadius: '4px', fontSize: '10px', fontFamily: 'Space Mono', cursor: 'pointer', fontWeight: 700 }}>
            🚨 CROWD SURGE
          </button>
          <button onClick={() => handleScenarioTrigger('congestion')} style={{ background: 'rgba(255,51,102,0.1)', border: '1px solid var(--accent-red)', color: 'var(--accent-red)', padding: '6px 12px', borderRadius: '4px', fontSize: '10px', fontFamily: 'Space Mono', cursor: 'pointer', fontWeight: 700 }}>
            🚪 GATE B CRITICAL
          </button>
          <button onClick={() => handleScenarioTrigger('executive')} style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid var(--accent-purple)', color: 'var(--accent-purple)', padding: '6px 12px', borderRadius: '4px', fontSize: '10px', fontFamily: 'Space Mono', cursor: 'pointer', fontWeight: 700 }}>
            👑 ACTIONS DEPLOYING
          </button>
          <button onClick={() => handleScenarioTrigger('resolved')} style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid var(--accent-green)', color: 'var(--accent-green)', padding: '6px 12px', borderRadius: '4px', fontSize: '10px', fontFamily: 'Space Mono', cursor: 'pointer', fontWeight: 700 }}>
            ✓ SURGE RESOLVED
          </button>
          <button onClick={() => handleScenarioTrigger('weather')} style={{ background: 'rgba(255,107,53,0.1)', border: '1px solid var(--accent-orange)', color: 'var(--accent-orange)', padding: '6px 12px', borderRadius: '4px', fontSize: '10px', fontFamily: 'Space Mono', cursor: 'pointer', fontWeight: 700 }}>
            🌩 STORM INCOMING
          </button>
          <button onClick={() => handleScenarioTrigger('storm')} style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid var(--accent-red)', color: 'var(--accent-red)', padding: '6px 12px', borderRadius: '4px', fontSize: '10px', fontFamily: 'Space Mono', cursor: 'pointer', fontWeight: 700 }}>
            ⛈ STORM HITS (CRITICAL)
          </button>
          <button onClick={() => handleScenarioTrigger('stabilizing')} style={{ background: 'rgba(0,255,204,0.1)', border: '1px solid var(--accent-cyan)', color: 'var(--accent-cyan)', padding: '6px 12px', borderRadius: '4px', fontSize: '10px', fontFamily: 'Space Mono', cursor: 'pointer', fontWeight: 700 }}>
            🧹 STORM CLEARING
          </button>
          <button onClick={() => handleScenarioTrigger('fulltime')} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--text-muted)', color: 'white', padding: '6px 12px', borderRadius: '4px', fontSize: '10px', fontFamily: 'Space Mono', cursor: 'pointer', fontWeight: 700 }}>
            🏁 FULL TIME (MATCH END)
          </button>
        </div>
      </div>

      {/* Row 2: AI CCTV Camera Feed System */}
      <div className="glass-card" style={{ padding: '16px', borderLeft: '4px solid var(--accent-cyan)' }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          borderBottom: '1px solid var(--border)', paddingBottom: '6px', marginBottom: '12px'
        }}>
          <div style={{
            fontFamily: 'Orbitron, monospace', fontSize: '12px', fontWeight: 700,
            color: 'var(--accent-cyan)', letterSpacing: '0.05em'
          }}>
            📹 AEGIS OS — LIVE AI CCTV CAMERA FEED SYSTEM
          </div>
          {selectedZoneId && (
            <div style={{ fontFamily: 'Space Mono', fontSize: '10px', color: 'var(--accent-cyan)', animation: 'pulse 2s infinite' }}>
              🎯 FOCUS ACTIVE: {state.stadium.zones.find(z => z.id === selectedZoneId)?.name.toUpperCase()}
            </div>
          )}
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '12px'
        }}>
          {/* Cam 1 */}
          <div style={{
            background: 'rgba(0,0,0,0.4)',
            border: isCam1Focused ? '1.5px solid var(--accent-cyan)' : `1.5px solid ${isGateBCongested ? 'var(--accent-red)' : 'var(--border)'}`,
            boxShadow: isCam1Focused ? '0 0 10px rgba(0, 212, 255, 0.25)' : 'none',
            borderRadius: '6px', padding: '10px', fontFamily: 'Space Mono, monospace', fontSize: '9px', position: 'relative'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '4px', marginBottom: '6px' }}>
              <span style={{ color: isCam1Focused ? 'var(--accent-cyan)' : 'white', fontWeight: 700 }}>
                CAM 01 - {c1Name} {isCam1Focused && '🎯'}
              </span>
              <span style={{ color: isCam1Focused ? 'var(--accent-cyan)' : (isGateBCongested ? 'var(--accent-red)' : 'var(--accent-green)'), fontWeight: 700 }}>
                {c1Status}
              </span>
            </div>
            <div>DENSITY: <span style={{ color: 'white' }}>{c1Density}%</span></div>
            <div>OBJECTS DETECTED: <span style={{ color: 'white' }}>{c1Objects} fans</span></div>
            <div>ABNORMAL ACTION: <span style={{ color: 'white' }}>{activeZone1?.risk === 'critical' ? 'CRUSH RISK' : 'None'}</span></div>
            <div style={{ marginTop: '4px', color: 'var(--accent-cyan)' }}>
              REC: {isCam1Focused ? (activeZone1?.risk === 'critical' ? 'REDIRECT OVERFLOW' : 'MAINTAIN FLOW') : (isGateBCongested ? 'REDIRECT GATE D' : 'MAINTAIN FLOW')}
            </div>
          </div>
          {/* Cam 2 */}
          <div style={{
            background: 'rgba(0,0,0,0.4)',
            border: isCam2Focused ? '1.5px solid var(--accent-cyan)' : '1.5px solid var(--border)',
            boxShadow: isCam2Focused ? '0 0 10px rgba(0, 212, 255, 0.25)' : 'none',
            borderRadius: '6px', padding: '10px', fontFamily: 'Space Mono, monospace', fontSize: '9px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '4px', marginBottom: '6px' }}>
              <span style={{ color: isCam2Focused ? 'var(--accent-cyan)' : 'white', fontWeight: 700 }}>
                CAM 02 - GATE D CORRIDOR {isCam2Focused && '🎯'}
              </span>
              <span style={{ color: isCam2Focused ? 'var(--accent-cyan)' : 'var(--accent-green)', fontWeight: 700 }}>
                {isCam2Focused ? '● FOCUSED' : '● RUNNING'}
              </span>
            </div>
            <div>DENSITY: <span style={{ color: 'white' }}>{c2Density}%</span></div>
            <div>VOLUNTEERS ACTIVE: <span style={{ color: 'white' }}>14 guides</span></div>
            <div>REDIRECT RATE: <span style={{ color: 'white' }}>340/min</span></div>
            <div style={{ marginTop: '4px', color: 'var(--accent-green)' }}>FLOW RATE: NOMINAL</div>
          </div>
          {/* Cam 3 */}
          <div style={{
            background: 'rgba(0,0,0,0.4)',
            border: isCam3Focused ? '1.5px solid var(--accent-cyan)' : `1.5px solid ${isStormActive ? 'var(--accent-orange)' : 'var(--border)'}`,
            boxShadow: isCam3Focused ? '0 0 10px rgba(0, 212, 255, 0.25)' : 'none',
            borderRadius: '6px', padding: '10px', fontFamily: 'Space Mono, monospace', fontSize: '9px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '4px', marginBottom: '6px' }}>
              <span style={{ color: isCam3Focused ? 'var(--accent-cyan)' : 'white', fontWeight: 700 }}>
                CAM 03 - MAIN CONCOURSE {isCam3Focused && '🎯'}
              </span>
              <span style={{ color: isCam3Focused ? 'var(--accent-cyan)' : (isStormActive ? 'var(--accent-orange)' : 'var(--accent-green)'), fontWeight: 700 }}>
                {isCam3Focused ? '● FOCUSED' : (isStormActive ? '🌧️ SHELTER ACTIVE' : '● NOMINAL')}
              </span>
            </div>
            <div>SHELTER RATIO: <span style={{ color: 'white' }}>{Math.round((state.stadium.zones.find(z => z.id === 'concourse_main')?.density ?? 0) * 100)}%</span></div>
            <div>HVAC BOOST: <span style={{ color: 'white' }}>{isStormActive ? '+35%' : '0%'}</span></div>
            <div>SLIP THREAT: <span style={{ color: 'white' }}>{isStormActive ? 'MODERATE' : 'LOW'}</span></div>
            <div style={{ marginTop: '4px', color: 'var(--accent-cyan)' }}>REC: {isStormActive ? 'HVAC ACTIVE' : 'MONITOR TEMP'}</div>
          </div>
          {/* Cam 4 */}
          <div style={{
            background: 'rgba(0,0,0,0.4)',
            border: isCam4Focused ? '1.5px solid var(--accent-cyan)' : '1.5px solid var(--border)',
            boxShadow: isCam4Focused ? '0 0 10px rgba(0, 212, 255, 0.25)' : 'none',
            borderRadius: '6px', padding: '10px', fontFamily: 'Space Mono, monospace', fontSize: '9px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '4px', marginBottom: '6px' }}>
              <span style={{ color: isCam4Focused ? 'var(--accent-cyan)' : 'white', fontWeight: 700 }}>
                CAM 04 - {c4Name} {isCam4Focused && '🎯'}
              </span>
              <span style={{ color: isCam4Focused ? 'var(--accent-cyan)' : 'var(--accent-green)', fontWeight: 700 }}>
                {isCam4Focused ? '● FOCUSED' : '● READY'}
              </span>
            </div>
            <div>MEDICS ACTIVE: <span style={{ color: 'white' }}>{state.metrics.medicalAlerts > 0 ? '8 staff' : '5 staff'}</span></div>
            <div>HEAT ALERTS: <span style={{ color: 'white' }}>{state.metrics.medicalAlerts}</span></div>
            <div>RESPONSE LATENCY: <span style={{ color: 'white' }}>1.8 min</span></div>
            <div style={{ marginTop: '4px', color: 'var(--accent-green)' }}>AED DEVICE: ONLINE</div>
          </div>
        </div>
      </div>

      {/* Grid Layout of the 15 Levels */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
        gap: '20px',
        alignItems: 'start'
      }}>
        
        {/* LEVEL 1: Match Operations Hub */}
        <div className="glass-card" style={{ padding: '16px', borderLeft: '3px solid var(--accent-blue)' }}>
          <div style={{ fontFamily: 'Orbitron, monospace', fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '10px' }}>
            📋 LEVEL 1: MATCH OPERATIONS HUB
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '10px', fontFamily: 'Space Mono, monospace' }}>
            <div>COMPETITION: <span style={{ color: 'white' }}>Round of 16</span></div>
            <div>MATCH: <span style={{ color: 'white' }}>USA 🇺🇸 vs MEX 🇲🇽</span></div>
            <div>CLOCK: <span style={{ color: 'var(--accent-green)', fontWeight: 700 }}>{matchClockStr}</span></div>
            <div>ATTENDANCE: <span style={{ color: 'white' }}>{state.stadium.currentOccupancy.toLocaleString()}</span></div>
            <div>REFEREE: <span style={{ color: 'white' }}>Anthony Taylor (ENG)</span></div>
            <div>OFFICIALS: <span style={{ color: 'white' }}>4 active</span></div>
            <div>VIP GUESTS: <span style={{ color: 'var(--accent-cyan)' }}>412</span></div>
            <div>MEDIA REPS: <span style={{ color: 'white' }}>615</span></div>
          </div>
        </div>

        {/* LEVEL 2: Ticket Operations Dashboard */}
        <div className="glass-card" style={{ padding: '16px', borderLeft: '3px solid var(--accent-cyan)' }}>
          <div style={{ fontFamily: 'Orbitron, monospace', fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '10px' }}>
            🎟️ LEVEL 2: TICKET OPERATIONS
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '10px', fontFamily: 'Space Mono, monospace' }}>
            <div>CAPACITY: <span style={{ color: 'white' }}>80,000</span></div>
            <div>SOLD: <span style={{ color: 'white' }}>79,842 (99.8%)</span></div>
            <div>REMAINING: <span style={{ color: 'var(--accent-amber)' }}>158 seats</span></div>
            <div>HOSPITALITY: <span style={{ color: 'white' }}>96% capacity</span></div>
            <div>ACCESSIBLE: <span style={{ color: 'white' }}>92% active</span></div>
            <div>AWAY SECTOR: <span style={{ color: 'white' }}>14,620 (MEX)</span></div>
            <div>HOME SECTOR: <span style={{ color: 'white' }}>65,222 (USA)</span></div>
            <div>STUDENT: <span style={{ color: 'var(--accent-green)' }}>Sold Out</span></div>
          </div>
        </div>

        {/* LEVEL 15: Match Live Analytics */}
        <div className="glass-card" style={{ padding: '16px', borderLeft: '3px solid var(--accent-orange)' }}>
          <div style={{ fontFamily: 'Orbitron, monospace', fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '10px' }}>
            📊 LEVEL 15: MATCH ANALYTICS
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '10px', fontFamily: 'Space Mono, monospace' }}>
            <div>POSSESSION: <span style={{ color: 'white' }}>USA 56% - 44% MEX</span></div>
            <div>SHOTS (ON GOAL): <span style={{ color: 'white' }}>14 (7)</span></div>
            <div>FOULS: <span style={{ color: 'white' }}>13</span></div>
            <div>CORNERS: <span style={{ color: 'white' }}>9</span></div>
            <div>YELLOW CARDS: <span style={{ color: 'var(--accent-amber)' }}>2</span></div>
            <div>RED CARDS: <span style={{ color: 'var(--accent-green)' }}>0</span></div>
            <div>VAR CHECKS: <span style={{ color: 'var(--accent-cyan)' }}>1 resolved</span></div>
            <div>FOUL RATIO: <span style={{ color: 'white' }}>1.08/half</span></div>
          </div>
        </div>

        {/* LEVEL 4: Stadium Services */}
        <div className="glass-card" style={{ padding: '16px', borderLeft: '3px solid var(--accent-blue)' }}>
          <div style={{ fontFamily: 'Orbitron, monospace', fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '10px' }}>
            🍔 LEVEL 4: STADIUM SERVICES
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '10px', fontFamily: 'Space Mono, monospace' }}>
            <div>PARKING A (VIP): <span style={{ color: 'var(--accent-red)', fontWeight: 700 }}>FULL</span></div>
            <div>PARKING B: <span style={{ color: 'var(--accent-amber)' }}>78%</span></div>
            <div>PARKING C (EV): <span style={{ color: 'white' }}>42% (19/24 charging)</span></div>
            <div>PARKING D: <span style={{ color: 'var(--accent-green)' }}>Available</span></div>
            <div>FOOD WAIT (BURGER): <span style={{ color: 'white' }}>{foodQueueMin} min</span></div>
            <div>RESTROOM NORTH: <span style={{ color: 'var(--accent-red)' }}>Busy ({restroomQueueMin}m)</span></div>
            <div>RESTROOM SOUTH: <span style={{ color: 'var(--accent-green)' }}>Free</span></div>
            <div>RESTROOM EAST: <span style={{ color: 'var(--accent-green)' }}>Free</span></div>
          </div>
        </div>

        {/* LEVEL 5: Medical Operations */}
        <div className="glass-card" style={{ padding: '16px', borderLeft: '3px solid var(--accent-red)' }}>
          <div style={{ fontFamily: 'Orbitron, monospace', fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '10px' }}>
            🏥 LEVEL 5: MEDICAL OPERATIONS
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '10px', fontFamily: 'Space Mono, monospace' }}>
            <div>CENTER A (FIELD): <span style={{ color: 'var(--accent-green)' }}>READY</span></div>
            <div>CENTER B: <span style={{ color: 'var(--accent-green)' }}>READY</span></div>
            <div>PATIENTS ACTIVE: <span style={{ color: 'white' }}>{state.metrics.medicalAlerts}</span></div>
            <div>DOCTORS DEPLOYED: <span style={{ color: 'white' }}>5 staff</span></div>
            <div>AMBULANCES POOLED: <span style={{ color: 'white' }}>2 standby</span></div>
            <div>AED DEVICES ONLINE: <span style={{ color: 'var(--accent-green)' }}>12 OK</span></div>
            <div>FIRST AID KITS: <span style={{ color: 'white' }}>96% stock</span></div>
            <div>RESPONSE MEDIAN: <span style={{ color: 'var(--accent-cyan)' }}>1.8 mins</span></div>
          </div>
        </div>

        {/* LEVEL 6: Security Center */}
        <div className="glass-card" style={{ padding: '16px', borderLeft: '3px solid var(--accent-cyan)' }}>
          <div style={{ fontFamily: 'Orbitron, monospace', fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '10px' }}>
            🛡️ LEVEL 6: SECURITY CENTER
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '10px', fontFamily: 'Space Mono, monospace' }}>
            <div>POLICE FORCE: <span style={{ color: 'white' }}>148 active</span></div>
            <div>STEWARDS: <span style={{ color: 'white' }}>620 active</span></div>
            <div>K9 EXPLOSIVE: <span style={{ color: 'white' }}>8 patrols</span></div>
            <div>CCTV CAMERA BUS: <span style={{ color: 'var(--accent-green)' }}>428 Online (100%)</span></div>
            <div>DRONES IN AIR: <span style={{ color: 'var(--accent-cyan)' }}>6 airborne</span></div>
            <div>BODY CAMS DOCKED: <span style={{ color: 'white' }}>96% operational</span></div>
            <div>EMERGENCY TEAMS: <span style={{ color: 'white' }}>14 on site</span></div>
            <div>RADIO CHANNELS: <span style={{ color: 'var(--accent-green)' }}>8 secure</span></div>
          </div>
        </div>

        {/* LEVEL 7: Transportation Feed */}
        <div className="glass-card" style={{ padding: '16px', borderLeft: '3px solid var(--accent-amber)' }}>
          <div style={{ fontFamily: 'Orbitron, monospace', fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '10px' }}>
            🚇 LEVEL 7: TRANSIT CONTROLLER
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '10px', fontFamily: 'Space Mono, monospace' }}>
            <div>METRO ARRIVAL: <span style={{ color: 'white' }}>2 minutes</span></div>
            <div>METRO LOAD RATE: <span style={{ color: 'var(--accent-amber)' }}>74%</span></div>
            <div>BUS FLEET: <span style={{ color: 'white' }}>28 active runs</span></div>
            <div>RIDE SHARE DRIVERS: <span style={{ color: 'white' }}>14 nearby</span></div>
            <div>TAXI STANCE WAIT: <span style={{ color: 'var(--accent-green)' }}>5 minutes</span></div>
            <div>METRO DELAY LOGS: <span style={{ color: state.metrics.transportDelayMin > 0 ? 'var(--accent-red)' : 'white' }}>{state.metrics.transportDelayMin} min</span></div>
            <div>TRANSIT OUTFLOW: <span style={{ color: 'white' }}>2,140 passengers</span></div>
            <div>GTFS STATS: <span style={{ color: 'var(--accent-green)' }}>Active (Simulated)</span></div>
          </div>
        </div>

        {/* LEVEL 8: AI Predictions */}
        <div className="glass-card" style={{ padding: '16px', borderLeft: '3px solid var(--accent-purple)' }}>
          <div style={{ fontFamily: 'Orbitron, monospace', fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '10px' }}>
            🔮 LEVEL 8: AI PREDICTIONS CENTER
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '10px', fontFamily: 'Space Mono, monospace' }}>
            <div>CROWD SURGE RISK: <span style={{ color: state.riskLevel > 50 ? 'var(--accent-red)' : 'var(--accent-green)' }}>{state.riskLevel > 50 ? '91%' : '34%'}</span></div>
            <div>HEAVY RAIN CHANCE: <span style={{ color: state.storyTime >= 960 ? 'var(--accent-red)' : 'white' }}>{state.storyTime >= 960 ? '84%' : '12%'}</span></div>
            <div>MEDICAL HEAT THREAT: <span style={{ color: 'white' }}>22%</span></div>
            <div>POWER OUTAGE PROB: <span style={{ color: 'white' }}>4%</span></div>
            <div>TRAFFIC ACCELERATE: <span style={{ color: 'white' }}>73%</span></div>
            <div>FAN SATISFACTION: <span style={{ color: 'var(--accent-green)', fontWeight: 700 }}>94/100</span></div>
            <div>FOOD SHORTAGE RISK: <span style={{ color: 'white' }}>7%</span></div>
            <div>PREDICTION ACCURACY: <span style={{ color: 'var(--accent-cyan)' }}>94.2%</span></div>
          </div>
        </div>

        {/* LEVEL 10 & 14: Resource Tracking & Sustainability */}
        <div className="glass-card" style={{ padding: '16px', borderLeft: '3px solid var(--accent-blue)' }}>
          <div style={{ fontFamily: 'Orbitron, monospace', fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '10px' }}>
            ♻️ LEVEL 10 & 14: RESOURCES & CARBON
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '10px', fontFamily: 'Space Mono, monospace' }}>
            <div>STAFF SECURITY: <span style={{ color: 'white' }}>182 deployed</span></div>
            <div>STAFF MEDICAL: <span style={{ color: 'white' }}>42 active</span></div>
            <div>STAFF FIRE MARSHAL: <span style={{ color: 'white' }}>18 on field</span></div>
            <div>CLEANING STAFF: <span style={{ color: 'white' }}>84 deployed</span></div>
            <div>BATTERY BACKUP: <span style={{ color: 'var(--accent-green)' }}>94% online</span></div>
            <div>ENERGY CONSUMPTION: <span style={{ color: 'white' }}>2.8 MW</span></div>
            <div>SOLAR GENERATION: <span style={{ color: 'var(--accent-green)' }}>28% contributing</span></div>
            <div>CARBON EMISSION CO2: <span style={{ color: 'white' }}>12.3 t</span></div>
          </div>
        </div>

        {/* LEVEL 13: VIP Dashboard */}
        <div className="glass-card" style={{ padding: '16px', borderLeft: '3px solid var(--accent-cyan)' }}>
          <div style={{ fontFamily: 'Orbitron, monospace', fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '10px' }}>
            👑 LEVEL 13: VIP ESCORT & STATS
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '10px', fontFamily: 'Space Mono, monospace' }}>
            <div>VIP ARRIVED: <span style={{ color: 'white' }}>382 guests</span></div>
            <div>VIP EXPECTED: <span style={{ color: 'white' }}>420 guests</span></div>
            <div>HOSPITALITY SUITE: <span style={{ color: 'var(--accent-green)' }}>96% nominal</span></div>
            <div>SECURITY ESCORT: <span style={{ color: 'var(--accent-green)' }}>Available</span></div>
            <div>RESERVED PARKING: <span style={{ color: 'white' }}>200 spaces</span></div>
            <div>PRESS BRIEFING: <span style={{ color: 'white' }}>18:30 (Resolved)</span></div>
            <div>VIP DIETARY ACCORD: <span style={{ color: 'white' }}>98% filled</span></div>
            <div>HOST REPRESENTATION: <span style={{ color: 'white' }}>8 members</span></div>
          </div>
        </div>

        {/* LEVEL 3 & 11: Upcoming Matches & Incidents */}
        <div className="glass-card" style={{ padding: '16px', borderLeft: '3px solid var(--accent-amber)', gridColumn: 'span 1' }}>
          <div style={{ fontFamily: 'Orbitron, monospace', fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '10px' }}>
            📅 LEVEL 3: NEXT MATCHES
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '9px', fontFamily: 'Space Mono, monospace' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '3px' }}>
              <span>JULY 21 — ARG vs ESP</span>
              <span style={{ color: 'var(--accent-cyan)' }}>Sold: 94% | Risk: LOW</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '3px' }}>
              <span>JULY 24 — ENG vs FRA</span>
              <span style={{ color: 'var(--accent-red)' }}>Sold: 100% | Risk: HIGH</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>JULY 28 — WORLD CUP FINAL</span>
              <span style={{ color: 'var(--accent-amber)' }}>Sold: 100% | VIP: 680</span>
            </div>
          </div>
        </div>

        {/* LEVEL 11: Incident Center */}
        <div className="glass-card" style={{ padding: '16px', borderLeft: '3px solid var(--accent-red)', gridColumn: 'span 1' }}>
          <div style={{ fontFamily: 'Orbitron, monospace', fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '10px' }}>
            🚨 LEVEL 11: OPERATIONS INCIDENT FEED
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '9px', fontFamily: 'Space Mono, monospace' }}>
            {state.blackbox.slice(0, 3).map((item, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '3px' }}>
                <span>[{item.time}] {item.title}</span>
                <span style={{ color: item.type === 'action' ? 'var(--accent-cyan)' : 'var(--accent-green)' }}>
                  {item.type.toUpperCase()}
                </span>
              </div>
            ))}
            {state.blackbox.length === 0 && (
              <div style={{ color: 'var(--text-muted)' }}>No incidents logged yet. Simulation nominal.</div>
            )}
          </div>
        </div>

      </div>

      {/* LEVEL 9: Executive Command Center AI Decision Queue */}
      <div className="glass-card" style={{ padding: '20px', borderLeft: '4px solid var(--accent-purple)' }}>
        <div style={{
          fontFamily: 'Orbitron, monospace', fontSize: '13px', fontWeight: 700,
          color: 'var(--accent-purple)', borderBottom: '1px solid var(--border)',
          paddingBottom: '8px', marginBottom: '12px'
        }}>
          👑 LEVEL 9: EXECUTIVE COMMAND CENTER — AI DECISION QUEUE
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {decisions.map((item) => (
            <div key={item.id} style={{
              background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border)',
              borderRadius: '8px', padding: '10px 14px', display: 'flex',
              justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px'
            }}>
              <div style={{ flex: 1, minWidth: '250px' }}>
                <div style={{ fontSize: '10px', color: 'var(--text-secondary)', fontFamily: 'Space Mono' }}>
                  DECISION #{item.id} • CONFIDENCE: <span style={{ color: 'var(--accent-green)', fontWeight: 700 }}>{item.confidence}%</span>
                </div>
                <div style={{ fontSize: '12px', fontWeight: 600, color: 'white', marginTop: '3px' }}>
                  {item.action || item.deploy}
                </div>
                {activeExplain === item.id && (
                  <div style={{
                    marginTop: '8px', padding: '8px 12px', background: 'rgba(124, 58, 237, 0.05)',
                    border: '1px dashed var(--accent-purple)', borderRadius: '6px',
                    fontSize: '10px', color: 'var(--text-primary)', fontFamily: 'Space Mono',
                    lineHeight: '1.4', whiteSpace: 'pre-line'
                  }}>
                    {getExplanation(item.id)}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => setActiveExplain(activeExplain === item.id ? null : item.id)}
                  style={{
                    background: 'transparent', border: '1px solid var(--accent-purple)',
                    color: 'var(--accent-purple)', padding: '5px 12px', borderRadius: '4px',
                    fontSize: '10px', fontFamily: 'Space Mono', cursor: 'pointer'
                  }}
                >
                  {activeExplain === item.id ? 'CLOSE X' : 'EXPLAIN ❓'}
                </button>
                <button
                  disabled={item.status !== 'pending'}
                  onClick={() => handleDecisionClick(item.id, 'approved')}
                  style={{
                    background: item.status === 'approved' ? 'var(--accent-green)' : (item.status === 'rejected' ? 'rgba(255,255,255,0.05)' : 'rgba(16, 185, 129, 0.15)'),
                    border: `1px solid ${item.status === 'approved' ? 'var(--accent-green)' : 'rgba(16, 185, 129, 0.3)'}`,
                    color: item.status === 'approved' ? 'black' : 'var(--accent-green)',
                    padding: '5px 12px', borderRadius: '4px',
                    fontSize: '10px', fontFamily: 'Space Mono', cursor: 'pointer',
                    fontWeight: 700
                  }}
                >
                  {item.status === 'approved' ? '✓ APPROVED' : 'APPROVE'}
                </button>
                <button
                  disabled={item.status !== 'pending'}
                  onClick={() => handleDecisionClick(item.id, 'rejected')}
                  style={{
                    background: item.status === 'rejected' ? 'var(--accent-red)' : (item.status === 'approved' ? 'rgba(255,255,255,0.05)' : 'rgba(239, 68, 68, 0.15)'),
                    border: `1px solid ${item.status === 'rejected' ? 'var(--accent-red)' : 'rgba(239, 68, 68, 0.3)'}`,
                    color: item.status === 'rejected' ? 'black' : 'var(--accent-red)',
                    padding: '5px 12px', borderRadius: '4px',
                    fontSize: '10px', fontFamily: 'Space Mono', cursor: 'pointer',
                    fontWeight: 700
                  }}
                >
                  {item.status === 'rejected' ? '❌ REJECTED' : 'REJECT'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Sustainability and OS Flowchart link */}
      <div className="glass-card" style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'Space Mono' }}>
          🔒 AEGIS OS Match Operations Dashboard is simulated using synthetic digital twin telemetry sensors.
        </span>
        <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'Space Mono' }}>
          Build Version: v2.4.2-RC
        </span>
      </div>

    </div>
  );
}
