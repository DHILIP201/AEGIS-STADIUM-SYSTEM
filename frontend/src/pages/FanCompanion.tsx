import React, { useState } from 'react';
import { AegisState } from '../types/aegis';

interface Message {
  sender: 'user' | 'ai';
  text: string;
}

interface Props {
  state: AegisState | null;
}

export default function FanCompanion({ state }: Props) {
  const [lang, setLang] = useState('EN');
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<Message[]>([
    { sender: 'ai', text: 'Hello! I am your AEGIS Fan Assistant. How can I help you navigate the stadium today?' }
  ]);

  if (!state) {
    return (
      <div style={{
        padding: '24px', display: 'flex', justifyContent: 'center', alignItems: 'center',
        background: 'var(--bg-deep)', minHeight: 'calc(100vh - var(--nav-height))', color: 'var(--text-secondary)'
      }}>
        <div style={{ fontSize: 16, fontFamily: 'Space Mono, monospace' }}>Loading Fan Companion...</div>
      </div>
    );
  }

  // Dynamic gate navigation guidance
  const gateBDensity = state.stadium.zones.find(z => z.id === 'south_gate_b')?.density ?? 0;
  const isGateBCongested = gateBDensity > 0.7;

  // Food, restroom, merch queue simulations based on occupancy/metrics
  const foodQueueMin = Math.round(state.metrics.occupancy / 10000 + 4);
  const restroomQueueMin = Math.round(state.metrics.occupancy / 12000 + 2);
  const merchQueueMin = Math.round(state.metrics.occupancy / 15000 + 3);

  // Weather check (storyTime > 900 is weather event in story)
  const isStormActive = state.storyTime > 900 && state.riskLevel > 50;

  const handleSendChat = (text: string) => {
    if (!text.trim()) return;
    const newMsgs: Message[] = [...chatMessages, { sender: 'user', text }];
    setChatMessages(newMsgs);
    setChatInput('');

    // Simulated responses
    setTimeout(() => {
      let aiText = "I'm checking that with AEGIS Mission Control...";
      const lower = text.toLowerCase();
      if (lower.includes('food') || lower.includes('eat') || lower.includes('hungry')) {
        aiText = `Nearest food is Zone C (Burger Station). Current wait time is approximately ${foodQueueMin} minutes. Avoid Zone B as it is currently congested.`;
      } else if (lower.includes('restroom') || lower.includes('toilet') || lower.includes('bathroom')) {
        aiText = `The closest restroom is 50 meters to your left. Wait time is approximately ${restroomQueueMin} minutes.`;
      } else if (lower.includes('seat') || lower.includes('route') || lower.includes('where')) {
        aiText = "To reach Seat 142 in Section C, take the escalator up to level 2, turn right, and follow the signs for Section C. Enter through portal 14.";
      } else if (lower.includes('metro') || lower.includes('train') || lower.includes('exit')) {
        if (state.metrics.transportDelayMin > 0) {
          aiText = `Metro Line 1 currently has a ${state.metrics.transportDelayMin}-minute delay due to storm conditions. We recommend staying sheltered in the main concourse or visiting Gate D.`;
        } else {
          aiText = "Metro Line 1 is operating normally. Trains depart every 3 minutes from the East Exit.";
        }
      } else if (lower.includes('storm') || lower.includes('rain') || lower.includes('weather')) {
        if (isStormActive) {
          aiText = "Heavy rain is falling outside. AEGIS has boosted concourse HVAC heating and activated covered shelter zones. Please stay indoors.";
        } else {
          aiText = "Weather is currently clear, but our predictive engine is monitoring incoming clouds. Enjoy the match!";
        }
      }

      setChatMessages(prev => [...prev, { sender: 'ai', text: aiText }]);
    }, 800);
  };

  const handleEmergency = () => {
    setChatMessages(prev => [
      ...prev,
      { sender: 'ai', text: '🚨 EMERGENCY ALERT ASSIGNED: Medical services have been notified of your location (Section C, Row 12, Seat 142). Help will arrive in approximately 2 minutes.' }
    ]);
  };

  return (
    <div style={{
      background: 'var(--bg-deep)',
      minHeight: 'calc(100vh - var(--nav-height))',
      padding: '20px 16px',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'flex-start',
      overflowY: 'auto'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '480px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}>
        {/* Mobile Header Card */}
        <div className="glass-card" style={{
          padding: '16px',
          borderLeft: '4px solid var(--accent-blue)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <div style={{ fontFamily: 'Orbitron, monospace', fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
              AEGIS PERSONAL ASSISTANT
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
              Seat 142, Row 12, Section C (Gate B Entrance)
            </div>
          </div>
          <span style={{ fontSize: 24 }}>📱</span>
        </div>

        {/* Dynamic Navigation Guidance */}
        <div className="glass-card" style={{
          padding: '16px',
          borderLeft: `4px solid ${isGateBCongested ? 'var(--accent-red)' : 'var(--accent-green)'}`,
          background: isGateBCongested ? 'rgba(255, 51, 102, 0.05)' : 'rgba(16, 185, 129, 0.05)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 18 }}>{isGateBCongested ? '⚠️' : '✅'}</span>
            <div>
              <div style={{
                fontFamily: 'Orbitron, monospace', fontSize: 12, fontWeight: 700,
                color: isGateBCongested ? 'var(--accent-red)' : 'var(--accent-green)'
              }}>
                {isGateBCongested ? 'NAVIGATION ADVISORY' : 'GATE ACCESS STATUS'}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-primary)', marginTop: 4 }}>
                {isGateBCongested ? (
                  <span>
                    Gate B has reached unsafe congestion (91% capacity). <b>AEGIS redirects fans to Gate D</b>. (3 min walk, wait time under 1 min).
                  </span>
                ) : (
                  <span>Your primary entrance (Gate B) is operating normally. Queue wait time: &lt; 2 minutes.</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Live Wait Times Info Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
          <div className="glass-card" style={{ padding: '12px', textAlign: 'center' }}>
            <div style={{ fontSize: 18 }}>🍔</div>
            <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 4 }}>FOOD QUEUES</div>
            <div style={{
              fontSize: 16, fontFamily: 'Space Mono, monospace', fontWeight: 700,
              color: foodQueueMin > 12 ? 'var(--accent-orange)' : 'var(--accent-cyan)', marginTop: 2
            }}>
              {foodQueueMin} min
            </div>
          </div>
          <div className="glass-card" style={{ padding: '12px', textAlign: 'center' }}>
            <div style={{ fontSize: 18 }}>🚻</div>
            <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 4 }}>RESTROOMS</div>
            <div style={{
              fontSize: 16, fontFamily: 'Space Mono, monospace', fontWeight: 700,
              color: restroomQueueMin > 10 ? 'var(--accent-orange)' : 'var(--accent-cyan)', marginTop: 2
            }}>
              {restroomQueueMin} min
            </div>
          </div>
          <div className="glass-card" style={{ padding: '12px', textAlign: 'center' }}>
            <div style={{ fontSize: 18 }}>🛍️</div>
            <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 4 }}>MERCH STORES</div>
            <div style={{
              fontSize: 16, fontFamily: 'Space Mono, monospace', fontWeight: 700,
              color: merchQueueMin > 15 ? 'var(--accent-orange)' : 'var(--accent-cyan)', marginTop: 2
            }}>
              {merchQueueMin} min
            </div>
          </div>
        </div>

        {/* Weather & Transport status */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          {/* Weather */}
          <div className="glass-card" style={{ padding: '12px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 22 }}>{isStormActive ? '⛈️' : '☀️'}</span>
            <div>
              <div style={{ fontSize: 9, color: 'var(--text-secondary)' }}>WEATHER OUTSIDE</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: isStormActive ? 'var(--accent-red)' : 'var(--text-primary)' }}>
                {isStormActive ? `${state.metrics.temperature}°C Rain Storm` : `${state.metrics.temperature}°C Sunny`}
              </div>
            </div>
          </div>

          {/* Metro */}
          <div className="glass-card" style={{ padding: '12px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 22 }}>🚇</span>
            <div>
              <div style={{ fontSize: 9, color: 'var(--text-secondary)' }}>METRO LINE 1</div>
              <div style={{
                fontSize: 12, fontWeight: 700,
                color: state.metrics.transportDelayMin > 0 ? 'var(--accent-amber)' : 'var(--accent-green)'
              }}>
                {state.metrics.transportDelayMin > 0 ? `${state.metrics.transportDelayMin}m Delay` : 'Normal Flow'}
              </div>
            </div>
          </div>
        </div>

        {/* SOS Emergency button */}
        <button
          onClick={handleEmergency}
          style={{
            background: 'linear-gradient(135deg, #ef4444, #b91c1c)',
            border: 'none',
            borderRadius: '12px',
            padding: '16px',
            color: 'white',
            fontFamily: 'Orbitron, monospace',
            fontSize: 14,
            fontWeight: 900,
            cursor: 'pointer',
            boxShadow: '0 4px 20px rgba(239, 68, 68, 0.4)',
            letterSpacing: '0.15em',
            transition: 'transform 0.1s ease'
          }}
          onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.98)'}
          onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          🆘 REQUEST ASSISTANCE (SOS)
        </button>

        {/* Language selector */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
          {['EN', 'ES', 'FR', 'AR', 'PT', 'ZH', 'KO'].map(l => (
            <button
              key={l}
              onClick={() => setLang(l)}
              style={{
                background: lang === l ? 'var(--accent-blue)' : 'var(--bg-card)',
                border: `1px solid ${lang === l ? 'var(--accent-blue)' : 'var(--border)'}`,
                color: lang === l ? 'black' : 'var(--text-primary)',
                padding: '4px 10px',
                borderRadius: '999px',
                fontSize: '10px',
                fontFamily: 'Space Mono, monospace',
                cursor: 'pointer',
                fontWeight: 700
              }}
            >
              {l}
            </button>
          ))}
        </div>

        {/* Chat Assistant */}
        <div className="glass-card" style={{
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          height: '320px',
          overflow: 'hidden'
        }}>
          <div style={{
            fontFamily: 'Orbitron, monospace', fontSize: 11, fontWeight: 700,
            color: 'var(--accent-blue)', borderBottom: '1px solid var(--border)',
            paddingBottom: '8px', marginBottom: '8px'
          }}>
            🗣️ CHAT CONVERSATION
          </div>

          {/* Chat message thread */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            paddingRight: '4px',
            marginBottom: '8px'
          }}>
            {chatMessages.map((msg, i) => (
              <div
                key={i}
                style={{
                  alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                  background: msg.sender === 'user' ? 'rgba(0, 212, 255, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                  border: msg.sender === 'user' ? '1px solid rgba(0, 212, 255, 0.3)' : '1px solid var(--border)',
                  color: 'var(--text-primary)',
                  padding: '8px 12px',
                  borderRadius: '12px',
                  borderTopRightRadius: msg.sender === 'user' ? '0' : '12px',
                  borderTopLeftRadius: msg.sender === 'ai' ? '0' : '12px',
                  fontSize: 12,
                  maxWidth: '85%',
                  lineHeight: '1.4'
                }}
              >
                {msg.text}
              </div>
            ))}
          </div>

          {/* Preset buttons */}
          <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '8px' }}>
            <button
              onClick={() => handleSendChat("Where is the nearest food?")}
              style={{
                background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border)',
                color: 'var(--text-secondary)', padding: '4px 10px', borderRadius: '8px',
                fontSize: '10px', whiteSpace: 'nowrap', cursor: 'pointer'
              }}
            >
              🍔 Food Queue?
            </button>
            <button
              onClick={() => handleSendChat("Best route to my seat?")}
              style={{
                background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border)',
                color: 'var(--text-secondary)', padding: '4px 10px', borderRadius: '8px',
                fontSize: '10px', whiteSpace: 'nowrap', cursor: 'pointer'
              }}
            >
              🏟️ Seat Route?
            </button>
            <button
              onClick={() => handleSendChat("Metro delay status?")}
              style={{
                background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border)',
                color: 'var(--text-secondary)', padding: '4px 10px', borderRadius: '8px',
                fontSize: '10px', whiteSpace: 'nowrap', cursor: 'pointer'
              }}
            >
              🚇 Metro Status?
            </button>
          </div>

          {/* Input field */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendChat(chatInput)}
              placeholder="Ask AI Companion..."
              style={{
                flex: 1,
                background: 'rgba(0,0,0,0.3)',
                border: '1px solid var(--border)',
                color: 'var(--text-primary)',
                borderRadius: '8px',
                padding: '8px 12px',
                fontSize: 12,
                outline: 'none'
              }}
            />
            <button
              onClick={() => handleSendChat(chatInput)}
              style={{
                background: 'var(--accent-blue)',
                border: 'none',
                color: 'black',
                borderRadius: '8px',
                padding: '0 16px',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              SEND
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
