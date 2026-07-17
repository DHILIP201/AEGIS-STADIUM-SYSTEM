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

      {/* Page Content */}
      <div style={{ flex: 1 }}>
        {activeTab === 'mission' && <MissionControl state={state} sendMessage={sendMessage} connected={connected} />}
        {activeTab === 'fan' && <FanCompanion state={state} />}
        {activeTab === 'command' && <CommandCenter state={state} sendMessage={sendMessage} />}
        {activeTab === 'blackbox' && <BlackBox state={state} />}
        {activeTab === 'prompts' && <Prompts />}
      </div>
    </div>
  );
}
