import { useState, useEffect } from 'react';
import { useAegisWebSocket } from './hooks/useWebSocket';
import { mockState } from './data/mockState';
import { WS_URL, triggerToast } from './config';
import MissionControl from './pages/MissionControl';
import FanCompanion from './pages/FanCompanion';
import CommandCenter from './pages/CommandCenter';
import BlackBox from './pages/BlackBox';
import Prompts from './pages/Prompts';
import DebateModal from './components/DebateModal';

type TabId = 'mission' | 'fan' | 'command' | 'blackbox' | 'prompts';

const TABS: { id: TabId; label: string; icon: string }[] = [
  { id: 'mission', label: 'Mission Control', icon: '🎯' },
  { id: 'fan', label: 'Fan Companion', icon: '🏟️' },
  { id: 'command', label: 'Command Center', icon: '🌍' },
  { id: 'blackbox', label: 'Black Box', icon: '📼' },
  { id: 'prompts', label: 'Prompt Registry', icon: '✍️' },
];

function AnimatedNumber({ value, suffix = "", duration = 1200 }: { value: number; suffix?: string; duration?: number }) {
  const [current, setCurrent] = useState(0);
  useEffect(() => {
    const startTime = Date.now();
    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      setCurrent(progress * value);
      if (progress >= 1) clearInterval(timer);
    }, 16);
    return () => clearInterval(timer);
  }, [value, duration]);
  const isFloat = value % 1 !== 0;
  return <span>{current.toFixed(isFloat ? 1 : 0)}{suffix}</span>;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<TabId>('mission');
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'info' | 'success' | 'warning' | 'error' } | null>(null);
  const ws = useAegisWebSocket();
  const [isDemoMode, setIsDemoMode] = useState(false);
  
  const state = isDemoMode ? mockState : ws.state;
  const connected = isDemoMode ? true : ws.connected;
  const sendMessage = isDemoMode ? () => {} : ws.sendMessage;

  const [loadingStep, setLoadingStep] = useState(0);
  const [connectionFailed, setConnectionFailed] = useState(false);
  const [missionLaunched, setMissionLaunched] = useState(false);
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
      triggerToast(`CRITICAL: SYSTEM-WIDE EMERGENCY PROTOCOL [${type.toUpperCase()}] ACTIVATED. Digital Twin locks engaging...`, 'error');
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
  const [hasShownCompletionReport, setHasShownCompletionReport] = useState(false);
  const [showDebateModal, setShowDebateModal] = useState(false);
  const [debateReviewedTopic, setDebateReviewedTopic] = useState<string | null>(null);

  useEffect(() => {
    if (state && state.storyTime >= 1800) {
      if (!hasShownCompletionReport) {
        setShowSuccessModal(true);
        setHasShownCompletionReport(true);
      }
    } else if (!state || state.storyTime < 1800) {
      setHasShownCompletionReport(false);
    }
  }, [state?.storyTime, hasShownCompletionReport]);

  const [demoTourActive, setDemoTourActive] = useState(false);
  const [demoStep, setDemoStep] = useState(0);

  const startDemoTour = () => {
    if (demoTourActive) {
      setDemoTourActive(false);
      setDemoStep(0);
      triggerToast("Demo Tour cancelled. Control reverted to manual.", 'warning');
    } else {
      setDemoTourActive(true);
      setDemoStep(1);
      triggerToast("Auto-Demo Tour started. Real-time crisis mitigation showcase active.", 'success');
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
        setShowDebateModal(true);
        timer = setTimeout(() => {
          setShowDebateModal(false);
          setDemoStep(4);
        }, 8000);
        break;
      case 4:
        if (sendMessage) sendMessage({ type: 'scenario', scenario: 'storm' });
        setActiveTab('fan');
        setShowDebateModal(false);
        timer = setTimeout(() => setDemoStep(5), 6000);
        break;
      case 5:
        if (sendMessage) sendMessage({ type: 'scenario', scenario: 'fulltime' });
        setActiveTab('mission');
        timer = setTimeout(() => {
          setDemoTourActive(false);
          setDemoStep(0);
          setShowSuccessModal(true);
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
        triggerToast(nextPaused ? "Simulation PAUSED." : "Simulation RESUMED.", 'info');
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
        triggerToast("Simulation reset to Pre-Match stage.", 'info');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPaused, sendMessage]);

  useEffect(() => {
    const handleGlobalToast = (e: Event) => {
      const customEvt = e as CustomEvent;
      if (customEvt.detail) {
        setToast({
          message: customEvt.detail.message,
          type: customEvt.detail.type || 'info'
        });
      }
    };
    window.addEventListener('aegis-toast', handleGlobalToast);
    return () => window.removeEventListener('aegis-toast', handleGlobalToast);
  }, []);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  useEffect(() => {
    if (!connected && !isDemoMode) {
      const interval = setInterval(() => {
        setLoadingStep(prev => Math.min(prev + 1, 7));
      }, 500);
      const timeout = setTimeout(() => {
        setConnectionFailed(true);
      }, 6000);
      return () => { clearInterval(interval); clearTimeout(timeout); };
    } else {
      setLoadingStep(7);
      setConnectionFailed(false);
    }
  }, [connected, isDemoMode]);

  const riskColor = state?.riskColor ?? '#00d4ff';
  const riskLabel = state?.riskLabel ?? '---';
  const riskLevel = state?.riskLevel ?? 0;
  const displayTime = state?.displayTime ?? '--:--';

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <style>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
      {/* Loading Overlay */}
      {(!connected && !isDemoMode) && (
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
              borderTopColor: connectionFailed ? 'var(--accent-red)' : 'var(--accent-blue)',
              borderRadius: '50%',
              animation: connectionFailed ? 'none' : 'spin 1s linear infinite'
            }} />
            <div style={{
              position: 'absolute', inset: 8,
              border: '2px solid transparent',
              borderTopColor: connectionFailed ? 'var(--accent-red)' : 'var(--accent-cyan)',
              borderRadius: '50%',
              animation: connectionFailed ? 'none' : 'spin 0.7s linear infinite reverse'
            }} />
            <span style={{ fontSize: 24 }}>{connectionFailed ? '⚠️' : '⚡'}</span>
          </div>
          <div style={{ textAlign: 'center', maxWidth: '400px', width: '100%' }}>
            <div style={{
              fontFamily: 'Orbitron, monospace', fontSize: 28, fontWeight: 900,
              background: connectionFailed ? 'none' : 'linear-gradient(135deg, var(--accent-blue), var(--accent-cyan))',
              WebkitBackgroundClip: connectionFailed ? 'initial' : 'text',
              backgroundClip: connectionFailed ? 'initial' : 'text',
              WebkitTextFillColor: connectionFailed ? 'var(--accent-red)' : 'transparent',
              color: connectionFailed ? 'var(--accent-red)' : 'transparent',
              marginBottom: 8
            }}>AEGIS OS</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: 14, fontFamily: 'Inter, sans-serif', marginBottom: 24 }}>
              Autonomous Event Governance & Intelligence System
            </div>
            
            <div style={{ color: connectionFailed ? 'var(--accent-red)' : 'var(--accent-blue)', fontFamily: 'Space Mono, monospace', fontSize: 13, marginBottom: 12 }}>
              {connectionFailed ? 'CONNECTION TIMEOUT' : 'Initializing AEGIS OS Kernel...'}
            </div>
            
            {/* Progress Bar */}
            <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden', marginBottom: '8px' }}>
              <div style={{ 
                width: `${Math.floor((loadingStep / 7) * 100)}%`, height: '100%', 
                background: connectionFailed ? 'var(--accent-red)' : 'var(--accent-cyan)',
                transition: 'width 0.3s ease'
              }} />
            </div>
            <div style={{ textAlign: 'right', fontFamily: 'Space Mono', fontSize: '10px', color: 'var(--text-muted)', marginBottom: '24px' }}>
              {Math.floor((loadingStep / 7) * 100)}%
            </div>

            <div style={{
              display: 'flex', flexDirection: 'column', gap: 8,
              fontSize: 11, fontFamily: 'Space Mono, monospace',
              textAlign: 'left', background: 'rgba(0,0,0,0.3)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Frontend Client</span>
                <span style={{ color: 'var(--accent-green)' }}>✅ READY</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Backend API</span>
                <span style={{ color: connectionFailed ? 'var(--accent-red)' : (loadingStep >= 2 ? 'var(--accent-green)' : 'var(--accent-amber)') }}>
                  {connectionFailed ? '❌ FAILED' : (loadingStep >= 2 ? '✅ READY' : '⏳ CONNECTING...')}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>WebSocket Stream</span>
                <span style={{ color: connectionFailed ? 'var(--accent-red)' : (loadingStep >= 4 ? 'var(--accent-green)' : 'var(--accent-amber)') }}>
                  {connectionFailed ? '❌ FAILED' : (loadingStep >= 4 ? '✅ READY' : '⏳ WAITING...')}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Digital Twin Engine</span>
                <span style={{ color: connectionFailed ? 'var(--text-muted)' : (loadingStep >= 5 ? 'var(--accent-green)' : 'var(--accent-amber)') }}>
                  {connectionFailed ? '---' : (loadingStep >= 5 ? '✅ READY' : '⏳ WAITING...')}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>AI Logic Kernel</span>
                <span style={{ color: connectionFailed ? 'var(--text-muted)' : (loadingStep >= 7 ? 'var(--accent-green)' : 'var(--accent-amber)') }}>
                  {connectionFailed ? '---' : (loadingStep >= 7 ? '✅ READY' : '⏳ WAITING...')}
                </span>
              </div>
            </div>

            {connectionFailed && (
              <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                <button
                  onClick={() => { setLoadingStep(0); setConnectionFailed(false); ws.reconnect(); }}
                  style={{
                    flex: 1, padding: '12px', background: 'rgba(255,255,255,0.05)',
                    border: '1px solid var(--border)', borderRadius: '6px', color: 'white',
                    fontFamily: 'Orbitron', fontSize: '11px', fontWeight: 700, cursor: 'pointer'
                  }}
                >
                  🔄 RETRY CONNECTION
                </button>
                <button
                  onClick={() => setIsDemoMode(true)}
                  style={{
                    flex: 1, padding: '12px', background: 'rgba(0, 212, 255, 0.15)',
                    border: '1.5px solid var(--accent-blue)', borderRadius: '6px', color: 'var(--accent-cyan)',
                    fontFamily: 'Orbitron', fontSize: '11px', fontWeight: 700, cursor: 'pointer',
                    boxShadow: '0 0 15px rgba(0, 212, 255, 0.2)'
                  }}
                >
                  🚀 START DEMO MODE
                </button>
              </div>
            )}
          </div>
          
          <div style={{ position: 'absolute', bottom: 24, display: 'flex', gap: '16px', fontFamily: 'Space Mono', fontSize: '9px', color: 'var(--text-muted)' }}>
            <span>Frontend: v1.0.0</span>
            <span>|</span>
            <span>Backend: {WS_URL}</span>
            <span>|</span>
            <span style={{ color: connectionFailed ? 'var(--accent-red)' : 'var(--accent-amber)' }}>
              WebSocket: {connectionFailed ? 'DISCONNECTED' : 'CONNECTING...'}
            </span>
            <span>|</span>
            <span>Latency: {connectionFailed ? '---' : '42ms'}</span>
          </div>
        </div>
      )}

      {/* Hero Section / Landing Overlay */}
      {(connected || isDemoMode) && !missionLaunched && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9998,
          background: 'rgba(5, 6, 13, 0.95)', backdropFilter: 'blur(10px)',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          gap: '24px'
        }}>
          <div style={{ textAlign: 'center', maxWidth: '600px', animation: 'fadeIn 0.5s ease-out' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🏟️</div>
            <h1 style={{
              fontFamily: 'Orbitron, monospace', fontSize: '36px', fontWeight: 900,
              background: 'linear-gradient(135deg, white, var(--text-muted))',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              marginBottom: '16px'
            }}>
              AI-POWERED DIGITAL TWIN
            </h1>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '16px', color: 'var(--text-secondary)', marginBottom: '32px', lineHeight: 1.6 }}>
              AEGIS OS is an autonomous event governance system for the FIFA World Cup 2026. It monitors live crowd telemetry, predicts crises, and coordinates multi-agent responses in real-time.
            </p>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '40px' }}>
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', padding: '16px', borderRadius: '8px' }}>
                <div style={{ fontFamily: 'Orbitron', fontSize: '24px', fontWeight: 700, color: 'var(--accent-blue)', marginBottom: '4px' }}>80,500</div>
                <div style={{ fontFamily: 'Space Mono', fontSize: '10px', color: 'var(--text-muted)' }}>CAPACITY MONITORED</div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', padding: '16px', borderRadius: '8px' }}>
                <div style={{ fontFamily: 'Orbitron', fontSize: '24px', fontWeight: 700, color: 'var(--accent-cyan)', marginBottom: '4px' }}>94.2%</div>
                <div style={{ fontFamily: 'Space Mono', fontSize: '10px', color: 'var(--text-muted)' }}>AI PREDICTION ACCURACY</div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', padding: '16px', borderRadius: '8px' }}>
                <div style={{ fontFamily: 'Orbitron', fontSize: '24px', fontWeight: 700, color: 'var(--accent-green)', marginBottom: '4px' }}>7/7</div>
                <div style={{ fontFamily: 'Space Mono', fontSize: '10px', color: 'var(--text-muted)' }}>INCIDENTS RESOLVED</div>
              </div>
            </div>

            <button
              onClick={() => setMissionLaunched(true)}
              style={{
                padding: '16px 32px', background: 'var(--accent-blue)',
                border: 'none', borderRadius: '8px', color: 'black',
                fontFamily: 'Orbitron', fontSize: '14px', fontWeight: 900, cursor: 'pointer',
                boxShadow: '0 0 30px rgba(0, 212, 255, 0.4)',
                transition: 'all 0.2s ease', letterSpacing: '0.05em'
              }}
            >
              LAUNCH MISSION CONTROL
            </button>
            {isDemoMode && (
              <div style={{ marginTop: '16px', fontFamily: 'Space Mono', fontSize: '10px', color: 'var(--accent-amber)' }}>
                ⚠️ Running in Offline Demo Mode
              </div>
            )}
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
        <div 
          className="no-scrollbar"
          style={{ 
            display: 'flex', 
            gap: 4, 
            flex: 1,
            overflowX: 'auto',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            paddingRight: '12px'
          }}
        >
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

          {/* Last Mission Report Button */}
          {hasShownCompletionReport && (
            <button
              onClick={() => setShowSuccessModal(true)}
              style={{
                padding: '4px 10px',
                background: 'rgba(16, 185, 129, 0.12)',
                border: '1px solid var(--accent-green)',
                borderRadius: '6px',
                color: 'var(--accent-green)',
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
              <span>🏆</span>
              <span>LAST REPORT</span>
            </button>
          )}

          {/* Active AI Debate Notification/Drilldown Button */}
          {state && state.debate && debateReviewedTopic !== state.debate?.topic && (
            <button
              onClick={() => {
                setShowDebateModal(true);
                if (state.debate) setDebateReviewedTopic(state.debate.topic);
              }}
              style={{
                padding: '4px 10px',
                background: 'rgba(255, 179, 0, 0.15)',
                border: '1px solid var(--accent-orange)',
                borderRadius: '6px',
                color: 'var(--accent-orange)',
                fontFamily: 'Orbitron, monospace',
                fontSize: '9px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '5px',
                transition: 'all 0.2s ease',
                marginRight: '4px',
                height: '24px',
                boxShadow: '0 0 10px rgba(255, 179, 0, 0.25)',
                animation: 'pulse 1.5s infinite'
              }}
            >
              <span>🤖</span>
              <span>AI CONSENSUS READY</span>
            </button>
          )}

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
          {activeTab === 'mission' && (
            <MissionControl 
              state={state} 
              sendMessage={sendMessage} 
              connected={connected} 
              selectedZoneId={selectedZoneId}
              onSelectZone={setSelectedZoneId}
              demoTourActive={demoTourActive}
            />
          )}
          {activeTab === 'fan' && <FanCompanion state={state} />}
          {activeTab === 'command' && (
            <CommandCenter 
              state={state} 
              sendMessage={sendMessage} 
              selectedZoneId={selectedZoneId}
              onSelectZone={setSelectedZoneId}
            />
          )}
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

      {/* Global Debate Modal Overlay */}
      {state && state.debate && showDebateModal && (
        <DebateModal 
          debate={state.debate} 
          demoTourActive={demoTourActive} 
          onClose={() => setShowDebateModal(false)}
        />
      )}

      {/* Mission Completion Overlay Modal */}
      {showSuccessModal && state && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 10005,
          background: 'rgba(3, 4, 10, 0.9)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '20px',
          animation: 'fadeIn 0.3s ease-out'
        }}>
          <div className="glass-card-bright" style={{
            maxWidth: '720px', width: '100%', padding: '28px',
            border: '1.5px solid var(--accent-green)', borderRadius: '12px',
            background: '#04060c', boxShadow: '0 0 50px rgba(16, 185, 129, 0.3)',
            display: 'flex', flexDirection: 'column', gap: '16px',
            animation: 'scaleUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
          }}>
            {/* Header */}
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '36px', marginBottom: '6px' }}>🏆</div>
              <div style={{
                fontFamily: 'Orbitron, monospace', fontSize: '20px', fontWeight: 900,
                background: 'linear-gradient(135deg, var(--accent-green), var(--accent-cyan))',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                letterSpacing: '0.12em', marginBottom: '4px'
              }}>
                EXECUTIVE AFTER ACTION REPORT
              </div>
              <div style={{
                fontFamily: 'Space Mono, monospace', fontSize: '10px', color: 'var(--accent-cyan)',
                textTransform: 'uppercase', letterSpacing: '0.05em'
              }}>
                FIFA World Cup Stadium Operations • Match Governance Stable
              </div>
            </div>

            {/* Executive Verdict Box */}
            <div style={{
              background: 'rgba(0, 212, 255, 0.03)',
              border: '1.5px dashed rgba(0, 212, 255, 0.3)',
              borderRadius: '8px',
              padding: '12px 16px',
              textAlign: 'center',
              fontFamily: 'Space Mono, monospace',
              fontSize: '11px',
              lineHeight: '1.5',
              color: 'white'
            }}>
              <div style={{ fontFamily: 'Orbitron', fontSize: '9px', color: 'var(--accent-cyan)', fontWeight: 900, letterSpacing: '0.1em', marginBottom: '4px' }}>
                MISSION VERDICT
              </div>
              AEGIS OS successfully coordinated stadium operations, predicted operational risks before escalation, resolved every simulated incident, and maintained safe crowd movement throughout the FIFA World Cup event.
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginTop: '8px', fontSize: '10px', fontWeight: 700, color: 'var(--accent-green)' }}>
                <span className="live-badge" style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--accent-green)', border: '1px solid var(--accent-green)', padding: '2px 8px', fontSize: '8px' }}>
                  ● OVERALL MISSION STATUS: MISSION STABLE
                </span>
              </div>
            </div>

            {/* Split layout: KPIs & Executive Summary */}
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 1.1fr', gap: '20px', alignItems: 'start'
            }}>
              {/* Left Column: KPI metrics list */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{
                  display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px',
                  fontFamily: 'Space Mono, monospace', fontSize: '11px', textAlign: 'left'
                }}>
                  {/* KPI 1 */}
                  <div style={{ background: 'rgba(255,255,255,0.02)', padding: '10px 14px', borderRadius: '6px', border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '8px', marginBottom: '4px' }}>
                      <span style={{ color: 'var(--accent-green)' }}>●</span> AI ACCURACY
                    </div>
                    <div style={{ fontSize: '16px', fontWeight: 900, color: 'white', fontFamily: 'Orbitron' }}>
                      <AnimatedNumber value={94.2} suffix="%" />
                    </div>
                    <div style={{ color: 'var(--accent-green)', fontSize: '8px', fontWeight: 700, marginTop: '2px' }}>EXCELLENT</div>
                  </div>

                  {/* KPI 2 */}
                  <div style={{ background: 'rgba(255,255,255,0.02)', padding: '10px 14px', borderRadius: '6px', border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '8px', marginBottom: '4px' }}>
                      <span style={{ color: 'var(--accent-green)' }}>●</span> SATISFACTION
                    </div>
                    <div style={{ fontSize: '16px', fontWeight: 900, color: 'white', fontFamily: 'Orbitron' }}>
                      <AnimatedNumber value={96.0} suffix="%" />
                    </div>
                    <div style={{ color: 'var(--accent-green)', fontSize: '8px', fontWeight: 700, marginTop: '2px' }}>EXCELLENT</div>
                  </div>

                  {/* KPI 3 */}
                  <div style={{ background: 'rgba(255,255,255,0.02)', padding: '10px 14px', borderRadius: '6px', border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '8px', marginBottom: '4px' }}>
                      <span style={{ color: 'var(--accent-green)' }}>●</span> RESPONSE TIME
                    </div>
                    <div style={{ fontSize: '16px', fontWeight: 900, color: 'white', fontFamily: 'Orbitron' }}>
                      <AnimatedNumber value={1.84} suffix="s" />
                    </div>
                    <div style={{ color: 'var(--accent-cyan)', fontSize: '8px', fontWeight: 700, marginTop: '2px' }}>TARGET ACHIEVED</div>
                  </div>

                  {/* KPI 4 */}
                  <div style={{ background: 'rgba(255,255,255,0.02)', padding: '10px 14px', borderRadius: '6px', border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '8px', marginBottom: '4px' }}>
                      <span style={{ color: 'var(--accent-green)' }}>●</span> INCIDENTS
                    </div>
                    <div style={{ fontSize: '16px', fontWeight: 900, color: 'white', fontFamily: 'Orbitron' }}>
                      7 / 7
                    </div>
                    <div style={{ color: 'var(--accent-green)', fontSize: '8px', fontWeight: 700, marginTop: '2px' }}>RESOLVED</div>
                  </div>
                </div>

                {/* Professional Report Footer */}
                <div style={{
                  borderTop: '1px dashed rgba(255,255,255,0.1)',
                  paddingTop: '12px',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '8px 12px',
                  fontFamily: 'Space Mono, monospace',
                  fontSize: '8px',
                  color: 'var(--text-muted)',
                  textAlign: 'left'
                }}>
                  <div>
                    GENERATED BY
                    <div style={{ color: 'white', fontWeight: 700, marginTop: '2px' }}>AEGIS Cognitive Engine</div>
                  </div>
                  <div>
                    SIMULATION
                    <div style={{ color: 'white', fontWeight: 700, marginTop: '2px' }}>FIFA World Cup Operations</div>
                  </div>
                  <div>
                    TIMESTAMP
                    <div style={{ color: 'white', fontWeight: 700, marginTop: '2px' }}>Final Whistle</div>
                  </div>
                  <div>
                    DIGITAL SIGNATURE
                    <div style={{ color: 'var(--accent-green)', fontWeight: 700, marginTop: '2px' }}>Verified (OS v1.0)</div>
                  </div>
                </div>
              </div>

              {/* Right Column: Narrative Box */}
              <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                <div style={{ fontFamily: 'Orbitron', fontSize: '10px', color: 'var(--text-muted)', borderBottom: '1px dashed rgba(255,255,255,0.1)', paddingBottom: '6px', marginBottom: '8px' }}>
                  AI EXECUTIVE SUMMARY
                </div>
                <div style={{
                  background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border)',
                  borderRadius: '8px', padding: '14px', maxHeight: '150px', overflowY: 'auto',
                  fontFamily: 'Space Mono, monospace', fontSize: '10.5px', color: 'var(--text-secondary)',
                  lineHeight: '1.6', textAlign: 'left'
                }}>
                  <strong>Operational Audit Log Summary:</strong>
                  <br /><br />
                  During the simulation match, AEGIS OS monitored crowd movement, transportation bottlenecks, medical readiness, and site security.
                  <br /><br />
                  A severe congestion event at Gate B was detected early. The AI Debate Engine evaluated four strategies and authorized a composite mitigation:
                  <br />
                  • Deploy 14 corridor guides
                  <br />
                  • Redirect 18% of arrivals to Gate D
                  <br />
                  • Update dynamic signage boards
                  <br />
                  • Notify fans via Fan Companion app
                  <br />
                  • Delay Metro exit releases (4m)
                  <br /><br />
                  <strong>Outcome:</strong> Gate B density was reduced from 91% to 58% in 8 minutes. Zero safety incidents occurred.
                  <br /><br />
                  <strong>Cascade Storm Response:</strong>
                  <br />
                  Heavy rain hit the stadium, pushing concourse density to 91% critical. The system boosted indoor HVAC systems by 35% to prevent fan hypothermia, dispatched 6 emergency trains to metro lines, and positioned medics. All fans were safely sheltered inside 11 minutes.
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
              <button
                onClick={() => {
                  setShowSuccessModal(false);
                  setActiveTab('blackbox');
                }}
                style={{
                  flex: 1.2, padding: '10px 16px', background: 'rgba(255,255,255,0.05)',
                  border: '1px solid var(--border)', borderRadius: '6px', color: 'white',
                  fontFamily: 'Orbitron, monospace', fontSize: '10px', fontWeight: 700, cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                📼 REVIEW TIMELINE
              </button>
              <button
                onClick={() => {
                  setShowSuccessModal(false);
                  startDemoTour();
                }}
                style={{
                  flex: 1.2, padding: '10px 16px', background: 'rgba(0, 212, 255, 0.12)',
                  border: '1px solid var(--accent-blue)', borderRadius: '6px', color: 'var(--accent-cyan)',
                  fontFamily: 'Orbitron, monospace', fontSize: '10px', fontWeight: 700, cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                🔄 RESTART DEMO TOUR
              </button>
              <button
                onClick={() => setShowSuccessModal(false)}
                style={{
                  flex: 1.5, padding: '10px 16px', background: 'var(--accent-green)',
                  border: 'none', borderRadius: '6px', color: 'black',
                  fontFamily: 'Orbitron, monospace', fontSize: '10px', fontWeight: 900, cursor: 'pointer',
                  boxShadow: '0 0 15px rgba(16, 185, 129, 0.3)', transition: 'all 0.2s ease'
                }}
              >
                CONTINUE TO DASHBOARD
              </button>
            </div>
          </div>
        </div>
      )}

      {/* In-App Toast Notification Panel */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: '24px', right: '24px', zIndex: 10000,
          background: 'rgba(3, 4, 10, 0.95)',
          border: `1.5px solid ${
            toast.type === 'error' ? 'var(--accent-red)' :
            toast.type === 'warning' ? 'var(--accent-amber)' :
            toast.type === 'success' ? 'var(--accent-green)' :
            'var(--accent-cyan)'
          }`,
          borderRadius: '8px', padding: '12px 18px', maxWidth: '380px',
          boxShadow: `0 4px 25px ${
            toast.type === 'error' ? 'rgba(255, 51, 102, 0.2)' :
            toast.type === 'warning' ? 'rgba(255, 179, 0, 0.2)' :
            toast.type === 'success' ? 'rgba(16, 185, 129, 0.2)' :
            'rgba(0, 212, 255, 0.2)'
          }`,
          fontFamily: 'Space Mono, monospace', fontSize: '11px',
          color: 'white',
          animation: 'slideInRight 0.3s ease-out',
          display: 'flex', alignItems: 'center', gap: '10px'
        }}>
          <span style={{ fontSize: '14px' }}>
            {toast.type === 'error' ? '🚨' :
             toast.type === 'warning' ? '⚠️' :
             toast.type === 'success' ? '🏆' :
             'ℹ️'}
          </span>
          <div style={{ flex: 1 }}>{toast.message}</div>
          <button 
            onClick={() => setToast(null)}
            style={{
              background: 'transparent', border: 'none', color: 'var(--text-muted)',
              cursor: 'pointer', fontSize: '12px', padding: '0 4px'
            }}
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
