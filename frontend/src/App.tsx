import { useState, useEffect } from 'react';
import { useAegisWebSocket } from './hooks/useWebSocket';
import MissionControl from './pages/MissionControl';
import FanCompanion from './pages/FanCompanion';
import CommandCenter from './pages/CommandCenter';
import BlackBox from './pages/BlackBox';
import Prompts from './pages/Prompts';

type TabId = 'mission' | 'fan' | 'command' | 'blackbox' | 'prompts';

const TABS: { id: TabId; label: string; icon: string }[] = [
  { id: 'mission', label: 'Mission Control', icon: '🎯' },
  { id: 'fan', label: 'Fan Companion', icon: '🏟️' },
  { id: 'command', label: 'Command Center', icon: '🌍' },
  { id: 'blackbox', label: 'Black Box', icon: '📼' },
  { id: 'prompts', label: 'Prompt Registry', icon: '✍️' },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<TabId>('mission');
  const { state, connected, sendMessage } = useAegisWebSocket();
  const [loadingStep, setLoadingStep] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [commandAudit, setCommandAudit] = useState<{ time: string; action: string; status: string }[]>([
    { time: '12:02', action: 'Approved Gate D opening redirection corridor', status: '✓ APPROVED' },
    { time: '12:05', action: 'Rejected Metro Line shutdown request', status: '✖ REJECTED' },
    { time: '12:08', action: 'Activated emergency storm cooling protocols', status: '✓ APPROVED' }
  ]);

  const downloadExecutiveReport = () => {
    if (!state) return;
    const reportText = `
==================================================
        AEGIS OS - EXECUTIVE MATCH REPORT
==================================================
Stadium: AT&T Stadium, Arlington TX
Match: USA vs Mexico - FIFA World Cup 2026
Uptime Status: 12h 42m | Latency: 42ms
--------------------------------------------------
KEY PERFORMANCE INDICATORS (KPIs):
- Overall Safety Score: ${state.scorecards.find(s => s.category === 'Overall')?.score ?? 91}/100
- Crowd Safety Index: ${state.scorecards.find(s => s.category === 'Crowd Safety')?.score ?? 94}%
- Medical Readiness: ${state.scorecards.find(s => s.category === 'Medical')?.score ?? 96}%
- Transportation Index: ${state.scorecards.find(s => s.category === 'Transportation')?.score ?? 88}%
- Total Attendance: ${state.metrics.occupancy.toLocaleString()}
--------------------------------------------------
INCIDENT LOG & TELEMETRY SUMMARY:
${state.blackbox.map(b => `- [${b.time}] [${b.type.toUpperCase()}] ${b.title}: ${b.details}`).join('\n')}
==================================================
`;
    const blob = new Blob([reportText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'AEGIS_WorldCup2026_MatchReport.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadJSONAuditLog = () => {
    if (!state) return;
    const logData = state.blackbox.map(b => ({
      time: b.time,
      event: b.title,
      type: b.type,
      details: b.details,
      accuracy: b.accuracy || "N/A"
    }));
    const jsonString = JSON.stringify(logData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'AEGIS_MatchEvents_AuditLog.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleTriggerEmergency = (type: string) => {
    if (sendMessage) {
      sendMessage({ type: 'scenario', scenario: 'emergency' });
      setCommandAudit(prev => [
        { time: 'NOW', action: `🚨 EMERGENCY PROTOCOL TRIGGERED: ${type.toUpperCase()}`, status: '✓ APPROVED' },
        ...prev
      ]);
      alert(`⚠️ CRITICAL: SYSTEM-WIDE EMERGENCY PROTOCOL [${type.toUpperCase()}] ACTIVATED. Digital Twin locks engaging...`);
    }
  };

  const speakAIBrief = () => {
    if (!state) return;
    window.speechSynthesis.cancel();

    let briefText = "";
    if (state.storyTime < 180) {
      briefText = `Welcome to A.T. and T. Stadium Matchday operations. USA versus Mexico is commencing. All eight gates are operating normally. Total occupancy is currently ${state.metrics.occupancy.toLocaleString()} fans. Risk level is low. All systems nominal.`;
    } else if (state.storyTime >= 180 && state.storyTime < 960) {
      const gateB = Math.round((state.stadium.zones.find(z => z.id === 'south_gate_b')?.density ?? 0) * 100);
      briefText = `Operational Alert. South Gate B density has reached ${gateB} percent. Ingress bottleneck is active. AI agents recommend opening Gate D immediately and deploying volunteers to the corridor.`;
    } else if (state.storyTime >= 960 && state.storyTime < 1800) {
      briefText = `Weather Warning. A rain storm is impacting stadium operations. Main concourse shelter is active. Heating ventilation systems have been boosted by thirty five percent. Metro delays are currently at ${state.metrics.transportDelayMin} minutes.`;
    } else {
      briefText = `Mission monitoring complete. USA wins two to one. Egress operations are active. All seven stadium incidents resolved successfully with ninety three percent crowd satisfaction. Thank you.`;
    }

    const utterance = new SpeechSynthesisUtterance(briefText);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);
  };

  const [showSuccessModal, setShowSuccessModal] = useState(false);

  useEffect(() => {
    if (state && state.storyTime >= 1800) {
      setShowSuccessModal(true);
    } else {
      setShowSuccessModal(false);
    }
  }, [state?.storyTime]);

  const [demoTourActive, setDemoTourActive] = useState(false);
  const [demoStep, setDemoStep] = useState(0);

  const startDemoTour = () => {
    if (demoTourActive) {
      setDemoTourActive(false);
      setDemoStep(0);
      alert("DEMO TOUR CANCELLED. Reverting control back to manual.");
    } else {
      setDemoTourActive(true);
      setDemoStep(1);
      alert("🚀 AUTO-DEMO TOUR STARTED! AEGIS OS will now showcase a complete, synchronized crisis mitigation walkthrough. Hands-off mode active.");
    }
  };

  useEffect(() => {
    if (!demoTourActive || demoStep === 0) return;

    let timer: any;

    switch (demoStep) {
      case 1:
        if (sendMessage) sendMessage({ type: 'scenario', scenario: 'start' });
        setActiveTab('mission');
        timer = setTimeout(() => setDemoStep(2), 6000);
        break;
      case 2:
        if (sendMessage) sendMessage({ type: 'scenario', scenario: 'surge' });
        setActiveTab('mission');
        timer = setTimeout(() => setDemoStep(3), 6000);
        break;
      case 3:
        if (sendMessage) sendMessage({ type: 'scenario', scenario: 'congestion' });
        setActiveTab('command');
        timer = setTimeout(() => setDemoStep(4), 6000);
        break;
      case 4:
        if (sendMessage) sendMessage({ type: 'scenario', scenario: 'storm' });
        setActiveTab('fan');
        timer = setTimeout(() => setDemoStep(5), 6000);
        break;
      case 5:
        if (sendMessage) sendMessage({ type: 'scenario', scenario: 'fulltime' });
        setActiveTab('mission');
        timer = setTimeout(() => {
          setDemoTourActive(false);
          setDemoStep(0);
          alert("🏆 DEMO TOUR COMPLETED! AEGIS OS successfully monitored, predicted, and mitigated all World Cup incidents.");
        }, 6000);
        break;
      default:
        setDemoTourActive(false);
        break;
    }

    return () => clearTimeout(timer);
  }, [demoTourActive, demoStep, sendMessage]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') {
        return;
      }
      const key = e.key.toLowerCase();
      if (key === ' ') {
        e.preventDefault();
        const nextPaused = !isPaused;
        setIsPaused(nextPaused);
        if (sendMessage) {
          sendMessage({ type: 'speed', speed: nextPaused ? 0.0 : 5.0 });
        }
        alert(nextPaused ? "Simulation PAUSED." : "Simulation RESUMED.");
      } else if (key === '1') {
        handleTriggerEmergency('surge');
        if (sendMessage) sendMessage({ type: 'scenario', scenario: 'surge' });
      } else if (key === '2') {
        handleTriggerEmergency('congestion');
        if (sendMessage) sendMessage({ type: 'scenario', scenario: 'congestion' });
      } else if (key === '3') {
        handleTriggerEmergency('weather');
        if (sendMessage) sendMessage({ type: 'scenario', scenario: 'weather' });
      } else if (key === '4') {
        handleTriggerEmergency('storm');
        if (sendMessage) sendMessage({ type: 'scenario', scenario: 'storm' });
      } else if (key === '5') {
        handleTriggerEmergency('fulltime');
        if (sendMessage) sendMessage({ type: 'scenario', scenario: 'fulltime' });
      } else if (key === 'r') {
        if (sendMessage) sendMessage({ type: 'scenario', scenario: 'sunny' });
        alert("Simulation reset to Pre-Match stage.");
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPaused, sendMessage]);

  useEffect(() => {
    if (!connected) {
      const interval = setInterval(() => {
        setLoadingStep(prev => Math.min(prev + 1, 7));
      }, 250);
      return () => clearInterval(interval);
    } else {
      setLoadingStep(0);
    }
  }, [connected]);

  const riskColor = state?.riskColor ?? '#00d4ff';
  const riskLabel = state?.riskLabel ?? '---';
  const riskLevel = state?.riskLevel ?? 0;
  const displayTime = state?.displayTime ?? '--:--';

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Loading Overlay */}
      {!connected && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'var(--bg-deep)',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          gap: '24px'
        }}>
          {/* Spinning ring */}
          <div style={{
            width: 80, height: 80, position: 'relative',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <div style={{
              position: 'absolute', inset: 0,
              border: '3px solid transparent',
              borderTopColor: 'var(--accent-blue)',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }} />
            <div style={{
              position: 'absolute', inset: 8,
              border: '2px solid transparent',
              borderTopColor: 'var(--accent-cyan)',
              borderRadius: '50%',
              animation: 'spin 0.7s linear infinite reverse'
            }} />
            <span style={{ fontSize: 24 }}>⚡</span>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              fontFamily: 'Orbitron, monospace',
              fontSize: 28,
              fontWeight: 900,
              background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-cyan))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              marginBottom: 8
            }}>AEGIS OS</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: 14, fontFamily: 'Inter, sans-serif', marginBottom: 16 }}>
              Autonomous Event Governance & Intelligence System
            </div>
            <div style={{ color: 'var(--accent-blue)', fontFamily: 'Space Mono, monospace', fontSize: 13, marginBottom: 8 }}>
              Initializing AEGIS OS Kernel...
            </div>
            <div style={{
              display: 'flex', flexDirection: 'column', gap: 4,
              fontSize: 10, fontFamily: 'Space Mono, monospace',
              textAlign: 'left', margin: '12px auto 0 auto', width: 'fit-content'
            }}>
              {loadingStep >= 1 && <div style={{ color: 'var(--accent-green)' }}>✓ Digital Twin Loaded</div>}
              {loadingStep >= 2 && <div style={{ color: 'var(--accent-green)' }}>✓ Crowd Kernel Operational</div>}
              {loadingStep >= 3 && <div style={{ color: 'var(--accent-green)' }}>✓ Transport Kernel Operational</div>}
              {loadingStep >= 4 && <div style={{ color: 'var(--accent-green)' }}>✓ Medical Kernel Operational</div>}
              {loadingStep >= 5 && <div style={{ color: 'var(--accent-green)' }}>✓ Security Kernel Operational</div>}
              {loadingStep >= 6 && <div style={{ color: 'var(--accent-green)' }}>✓ Strategy Engine Resolved</div>}
              {loadingStep >= 7 && <div style={{ color: 'var(--accent-cyan)' }}>✓ Gemini Connected (Ready)</div>}
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        height: 'var(--nav-height)',
        background: 'rgba(5,6,13,0.95)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--border-bright)',
        boxShadow: '0 1px 30px rgba(0,212,255,0.08)',
        display: 'flex', alignItems: 'center',
        padding: '0 20px',
        gap: 0,
        overflow: 'hidden',
      }}>
        {/* Scanline effect */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden', opacity: 0.03
        }}>
          {Array.from({ length: 30 }).map((_, i) => (
            <div key={i} style={{
              position: 'absolute', left: 0, right: 0,
              height: 1, background: 'var(--accent-blue)',
              top: `${i * 4}%`
            }} />
          ))}
        </div>

        {/* Logo */}
        <div style={{ display: 'flex', flexDirection: 'column', marginRight: 32, flexShrink: 0 }}>
          <div style={{
            fontFamily: 'Orbitron, monospace',
            fontSize: 18,
            fontWeight: 900,
            background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-cyan))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            letterSpacing: '0.12em',
            lineHeight: 1,
          }}>AEGIS OS</div>
          <div style={{
            color: 'var(--text-muted)',
            fontSize: 9,
            fontFamily: 'Space Mono, monospace',
            letterSpacing: '0.08em',
            marginTop: 2
          }}>AUTONOMOUS EVENT GOVERNANCE</div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, flex: 1 }}>
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '6px 16px',
                background: 'transparent',
                border: 'none',
                borderBottom: activeTab === tab.id ? '2px solid var(--accent-blue)' : '2px solid transparent',
                color: activeTab === tab.id ? 'var(--accent-blue)' : 'var(--text-muted)',
                fontFamily: 'Orbitron, monospace',
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '0.1em',
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 6,
                transition: 'all 0.2s ease',
                textTransform: 'uppercase',
                whiteSpace: 'nowrap',
                height: 'var(--nav-height)',
                borderRadius: 0,
              }}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Right side: status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
          {/* AI Voice Briefing Button */}
          <button
            onClick={speakAIBrief}
            style={{
              padding: '4px 10px',
              background: 'rgba(124, 58, 237, 0.15)',
              border: '1px solid var(--accent-purple)',
              borderRadius: '6px',
              color: 'var(--accent-purple)',
              fontFamily: 'Orbitron, monospace',
              fontSize: '9px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '5px',
              transition: 'all 0.2s ease',
              marginRight: '4px',
              height: '24px'
            }}
          >
            <span>🔊</span>
            <span>AI BRIEF</span>
          </button>

          {/* Auto-Demo Tour Button */}
          <button
            onClick={startDemoTour}
            style={{
              padding: '4px 10px',
              background: demoTourActive ? 'rgba(0, 255, 204, 0.15)' : 'rgba(255, 255, 255, 0.02)',
              border: `1px solid ${demoTourActive ? 'var(--accent-cyan)' : 'var(--border)'}`,
              borderRadius: '6px',
              color: demoTourActive ? 'var(--accent-cyan)' : 'var(--text-secondary)',
              fontFamily: 'Orbitron, monospace',
              fontSize: '9px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '5px',
              transition: 'all 0.2s ease',
              marginRight: '4px',
              height: '24px'
            }}
          >
            <span>🚀</span>
            <span>{demoTourActive ? `TOUR STEP ${demoStep}/5` : 'START TOUR'}</span>
          </button>

          {/* Toggle Operator Sidebar */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{
              padding: '4px 10px',
              background: sidebarOpen ? 'rgba(0, 212, 255, 0.15)' : 'rgba(255, 255, 255, 0.02)',
              border: `1px solid ${sidebarOpen ? 'var(--accent-blue)' : 'var(--border)'}`,
              borderRadius: '6px',
              color: sidebarOpen ? 'var(--accent-blue)' : 'var(--text-secondary)',
              fontFamily: 'Orbitron, monospace',
              fontSize: '9px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '5px',
              transition: 'all 0.2s ease',
              marginRight: '4px',
              height: '24px'
            }}
          >
            <span>🔔</span>
            <span>OPERATOR HUB {sidebarOpen ? '◀' : '▶'}</span>
          </button>

          {/* Connection indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{
              width: 8, height: 8,
              borderRadius: '50%',
              background: connected ? 'var(--accent-green)' : 'var(--accent-red)',
              boxShadow: connected ? '0 0 8px var(--accent-green)' : '0 0 8px var(--accent-red)',
              animation: connected ? 'pulse 2s ease-in-out infinite' : 'none',
            }} />
            <span style={{
              fontSize: 10,
              fontFamily: 'Space Mono, monospace',
              color: connected ? 'var(--accent-green)' : 'var(--accent-red)',
            }}>{connected ? 'LIVE' : 'OFFLINE'}</span>
          </div>

          {/* Match Score & Clock */}
          {state && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)',
              borderRadius: '6px', padding: '4px 10px',
              fontFamily: 'Orbitron, monospace', fontSize: '11px', fontWeight: 700,
              color: 'white', letterSpacing: '0.05em'
            }}>
              <span style={{ color: 'var(--accent-amber)' }}>🏆 FIFA 2026</span>
              <span style={{ color: 'var(--text-muted)' }}>|</span>
              <span>USA 🇺🇸 <span style={{ color: 'var(--accent-cyan)' }}>{state.storyTime >= 1800 ? '2' : (state.storyTime >= 1140 ? '2' : (state.storyTime >= 1000 ? '1' : '0'))}</span> - <span style={{ color: 'var(--accent-cyan)' }}>{state.storyTime >= 1140 ? '1' : '0'}</span> 🇲🇽 MEX</span>
              <span style={{ color: 'var(--text-muted)' }}>|</span>
              <span style={{ color: 'var(--accent-green)', minWidth: '70px', textAlign: 'center' }}>
                {state.storyTime < 450 ? 'PRE-MATCH' : 
                 state.storyTime < 1000 ? `${Math.floor((state.storyTime - 450) / 11) + 1}'` : 
                 state.storyTime < 1140 ? 'HALFTIME' : 
                 state.storyTime < 1700 ? `${Math.floor((state.storyTime - 1140) / 10) + 46}'` : 
                 state.storyTime < 1800 ? '90+3\'' : 'FULLTIME'}
              </span>
            </div>
          )}

          {/* Display time */}
          <div style={{
            fontFamily: 'Space Mono, monospace',
            fontSize: 16,
            fontWeight: 700,
            color: 'var(--accent-blue)',
            letterSpacing: '0.1em',
          }}>{displayTime}</div>

          {/* Risk badge */}
          {state && (
            <div style={{
              padding: '3px 10px',
              borderRadius: 999,
              border: `1px solid ${riskColor}44`,
              background: `${riskColor}15`,
              fontFamily: 'Orbitron, monospace',
              fontSize: 10,
              fontWeight: 700,
              color: riskColor,
              letterSpacing: '0.1em',
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 12 }}>{riskLevel}%</span>
              {riskLabel}
            </div>
          )}
        </div>
      </nav>

      {/* Page Content & Sidebar Wrapper */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>
        {/* Main Content Pane */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {activeTab === 'mission' && <MissionControl state={state} sendMessage={sendMessage} connected={connected} />}
          {activeTab === 'fan' && <FanCompanion state={state} />}
          {activeTab === 'command' && <CommandCenter state={state} sendMessage={sendMessage} />}
          {activeTab === 'blackbox' && <BlackBox state={state} />}
          {activeTab === 'prompts' && <Prompts />}
        </div>

        {/* Slide-out Sidebar Drawer */}
        {sidebarOpen && state && (
          <div style={{
            width: '320px',
            background: 'rgba(5, 6, 13, 0.98)',
            borderLeft: '1px solid var(--border-bright)',
            boxShadow: '-5px 0 30px rgba(0,212,255,0.1)',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            padding: '16px',
            overflowY: 'auto',
            fontFamily: 'Space Mono, monospace',
            fontSize: '10px',
            color: 'var(--text-primary)',
            zIndex: 100
          }}>
            {/* Operator Header */}
            <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
              <div style={{ fontFamily: 'Orbitron', fontWeight: 700, color: 'var(--accent-blue)', fontSize: '11px' }}>
                👤 ACTIVE OPERATOR MODE
              </div>
              <div style={{ color: 'white', fontWeight: 700, marginTop: '4px' }}>John Smith</div>
              <div style={{ fontSize: '9px', color: 'var(--text-secondary)' }}>INCIDENT COMMANDER • MORNING SHIFT</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '8px' }}>
                <span>PERMS: <span style={{ color: 'var(--accent-green)' }}>ADMIN L3</span></span>
                <span>TERM: <span style={{ color: 'var(--accent-cyan)' }}>SECURE</span></span>
              </div>
            </div>

            {/* Emergency Protocols */}
            <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
              <div style={{ fontFamily: 'Orbitron', fontWeight: 700, color: 'var(--accent-red)', fontSize: '10px', marginBottom: '8px' }}>
                🚨 EMERGENCY PROTOCOLS
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                <button onClick={() => handleTriggerEmergency('evacuation')} style={{ background: 'rgba(255,51,102,0.15)', border: '1px solid var(--accent-red)', color: 'var(--accent-red)', padding: '5px', borderRadius: '4px', fontSize: '8px', cursor: 'pointer', fontWeight: 700 }}>
                  EVACUATION
                </button>
                <button onClick={() => handleTriggerEmergency('lockdown')} style={{ background: 'rgba(255,51,102,0.15)', border: '1px solid var(--accent-red)', color: 'var(--accent-red)', padding: '5px', borderRadius: '4px', fontSize: '8px', cursor: 'pointer', fontWeight: 700 }}>
                  LOCKDOWN
                </button>
                <button onClick={() => handleTriggerEmergency('shelter')} style={{ background: 'rgba(255,179,0,0.15)', border: '1px solid var(--accent-amber)', color: 'var(--accent-amber)', padding: '5px', borderRadius: '4px', fontSize: '8px', cursor: 'pointer', fontWeight: 700 }}>
                  SHELTER
                </button>
                <button onClick={() => handleTriggerEmergency('medical')} style={{ background: 'rgba(255,107,53,0.15)', border: '1px solid var(--accent-orange)', color: 'var(--accent-orange)', padding: '5px', borderRadius: '4px', fontSize: '8px', cursor: 'pointer', fontWeight: 700 }}>
                  MEDICAL AID
                </button>
              </div>
            </div>

            {/* Notification Center */}
            <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '12px', flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontFamily: 'Orbitron', fontWeight: 700, color: 'var(--accent-cyan)', fontSize: '10px', marginBottom: '8px' }}>
                🔔 NOTIFICATION CENTER
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', overflowY: 'auto', maxHeight: '180px' }}>
                {state.storyTime >= 1140 && (
                  <div style={{ background: 'rgba(255,51,102,0.1)', border: '1px solid var(--accent-red)', borderRadius: '6px', padding: '6px' }}>
                    <div style={{ color: 'var(--accent-red)', fontWeight: 700, fontSize: '8px' }}>🔴 CRITICAL ALERT [T+19m]</div>
                    <div style={{ fontSize: '9px', marginTop: '2px' }}>Rain storm hits stadium. Concourse density exceeded 91%. HVAC boosted.</div>
                  </div>
                )}
                {state.storyTime >= 960 && (
                  <div style={{ background: 'rgba(255,107,53,0.1)', border: '1px solid var(--accent-orange)', borderRadius: '6px', padding: '6px' }}>
                    <div style={{ color: 'var(--accent-orange)', fontWeight: 700, fontSize: '8px' }}>🟠 WARNING [T+16m]</div>
                    <div style={{ fontSize: '9px', marginTop: '2px' }}>Storm front detected. Heavy rainfall expected in 12 minutes. Shelters ready.</div>
                  </div>
                )}
                {state.storyTime >= 360 && (
                  <div style={{ background: 'rgba(255,51,102,0.1)', border: '1px solid var(--accent-red)', borderRadius: '6px', padding: '6px' }}>
                    <div style={{ color: 'var(--accent-red)', fontWeight: 700, fontSize: '8px' }}>🔴 CRITICAL ALERT [T+6m]</div>
                    <div style={{ fontSize: '9px', marginTop: '2px' }}>Gate B density at 91%. Ingress bottleneck detected. AI debate active.</div>
                  </div>
                )}
                {state.storyTime >= 180 && (
                  <div style={{ background: 'rgba(255,179,0,0.1)', border: '1px solid var(--accent-amber)', borderRadius: '6px', padding: '6px' }}>
                    <div style={{ color: 'var(--accent-amber)', fontWeight: 700, fontSize: '8px' }}>🟡 WARNING [T+3m]</div>
                    <div style={{ fontSize: '9px', marginTop: '2px' }}>Crowd surge ingress at Gate B (72% density). Recommending redirection.</div>
                  </div>
                )}
                <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: '6px', padding: '6px' }}>
                  <div style={{ color: 'var(--accent-green)', fontWeight: 700, fontSize: '8px' }}>🟢 SYSTEM INFO [T+0]</div>
                  <div style={{ fontSize: '9px', marginTop: '2px' }}>Match day begins. All 8 gates nominal. Crowd arrival monitoring active.</div>
                </div>
              </div>
            </div>

            {/* Command History log */}
            <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
              <div style={{ fontFamily: 'Orbitron', fontWeight: 700, color: 'var(--accent-purple)', fontSize: '10px', marginBottom: '8px' }}>
                📜 OPERATOR AUDIT LOG
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '100px', overflowY: 'auto', fontSize: '8px' }}>
                {commandAudit.map((log, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '2px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>[{log.time}] {log.action.substring(0, 32)}...</span>
                    <span style={{ color: log.status.includes('APPROVED') ? 'var(--accent-green)' : 'var(--accent-red)', fontWeight: 700 }}>
                      {log.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* PDF & JSON Report Section */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <button
                onClick={downloadExecutiveReport}
                style={{
                  width: '100%',
                  background: 'rgba(0, 212, 255, 0.15)',
                  border: '1.5px solid var(--accent-blue)',
                  color: 'var(--accent-cyan)',
                  padding: '8px',
                  borderRadius: '6px',
                  fontFamily: 'Orbitron, monospace',
                  fontSize: '9px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px',
                  boxShadow: '0 0 10px rgba(0, 212, 255, 0.1)',
                  transition: 'all 0.2s ease'
                }}
              >
                📥 DOWNLOAD MATCH REPORT (.TXT)
              </button>
              <button
                onClick={downloadJSONAuditLog}
                style={{
                  width: '100%',
                  background: 'rgba(255, 179, 0, 0.15)',
                  border: '1.5px solid var(--accent-amber)',
                  color: 'var(--accent-amber)',
                  padding: '8px',
                  borderRadius: '6px',
                  fontFamily: 'Orbitron, monospace',
                  fontSize: '9px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px',
                  boxShadow: '0 0 10px rgba(255, 179, 0, 0.1)',
                  transition: 'all 0.2s ease'
                }}
              >
                📊 EXPORT AUDIT LOG (.JSON)
              </button>
            </div>

          </div>
        )}
      </div>

      {/* Mission Completion Overlay Modal */}
      {showSuccessModal && state && state.storyTime >= 1800 && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 2000,
          background: 'rgba(3, 4, 10, 0.85)', backdropFilter: 'blur(10px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div className="glass-card" style={{
            width: '420px', padding: '24px', border: '1.5px solid var(--accent-green)',
            boxShadow: '0 0 35px rgba(16, 185, 129, 0.25)', borderRadius: '12px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>🏆</div>
            <div style={{
              fontFamily: 'Orbitron, monospace', fontSize: '18px', fontWeight: 900,
              background: 'linear-gradient(135deg, var(--accent-green), var(--accent-cyan))',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
              letterSpacing: '0.08em', marginBottom: '6px'
            }}>
              MISSION MONITORING COMPLETE
            </div>
            <div style={{ fontSize: '10px', color: 'var(--text-secondary)', fontFamily: 'Space Mono', marginBottom: '20px' }}>
              AEGIS OS EVENT GOVERNANCE REPORT CARD
            </div>

            <div style={{
              display: 'flex', flexDirection: 'column', gap: '8px',
              fontFamily: 'Space Mono, monospace', fontSize: '11px', textAlign: 'left',
              background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '8px',
              border: '1px solid var(--border)', marginBottom: '20px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>MATCH:</span>
                <span style={{ color: 'white', fontWeight: 700 }}>USA 🇺🇸 vs MEX 🇲🇽</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>FINAL ATTENDANCE:</span>
                <span style={{ color: 'white', fontWeight: 700 }}>80,500 / 80,500</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>INCIDENTS RESOLVED:</span>
                <span style={{ color: 'var(--accent-green)', fontWeight: 700 }}>7 / 7 (100%)</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>MEDIAN RESPONSE TIME:</span>
                <span style={{ color: 'white', fontWeight: 700 }}>1m 48s</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>AI DECISION ACCURACY:</span>
                <span style={{ color: 'var(--accent-cyan)', fontWeight: 700 }}>94.2%</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>CROWD SATISFACTION:</span>
                <span style={{ color: 'var(--accent-green)', fontWeight: 700 }}>93%</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>MISSION STATUS:</span>
                <span style={{ color: 'var(--accent-green)', fontWeight: 700 }}>★ SUCCESS</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setShowSuccessModal(false)}
                style={{
                  flex: 1, padding: '10px', background: 'rgba(255,255,255,0.05)',
                  border: '1px solid var(--border)', borderRadius: '6px', color: 'white',
                  fontFamily: 'Orbitron', fontSize: '10px', fontWeight: 700, cursor: 'pointer'
                }}
              >
                REVIEW DASHBOARD
              </button>
              <button
                onClick={() => {
                  if (sendMessage) {
                    sendMessage({ type: 'scenario', scenario: 'start' });
                  }
                  setShowSuccessModal(false);
                }}
                style={{
                  flex: 1, padding: '10px', background: 'rgba(16, 185, 129, 0.15)',
                  border: '1.5px solid var(--accent-green)', borderRadius: '6px', color: 'var(--accent-green)',
                  fontFamily: 'Orbitron', fontSize: '10px', fontWeight: 700, cursor: 'pointer',
                  boxShadow: '0 0 10px rgba(16, 185, 129, 0.1)'
                }}
              >
                RESET SIMULATION
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
