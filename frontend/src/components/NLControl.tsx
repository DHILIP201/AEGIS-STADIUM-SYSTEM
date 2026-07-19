import React, { useState, useRef, useEffect } from 'react';

interface Props {
  onSend: (query: string) => void;
  nlResponse: string | null;
  onScenario: (scenario: string) => void;
  onSpeed: (speed: number) => void;
  onReset: () => void;
  onOpenReport?: () => void;
}

export default function NLControl({ onSend, nlResponse, onScenario, onSpeed, onReset, onOpenReport }: Props) {
  const [query, setQuery] = useState('');
  const [activeSpeed, setActiveSpeed] = useState(1);
  const [terminalHistory, setTerminalHistory] = useState<string[]>([
    "AEGIS-OS v2.0 Kernel CLI Initialized.",
    "Session Active. Type help or try Voice commands.",
    ""
  ]);
  const [voiceActive, setVoiceActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [terminalHistory, nlResponse]);

  const handleSend = (textToSend = query) => {
    const command = textToSend.trim();
    if (!command) return;

    // Add command to history
    setTerminalHistory(prev => [...prev, `aegis@control:~$ ${command}`]);
    
    // Custom terminal logic
    const lower = command.toLowerCase();
    if (lower === 'help') {
      setTerminalHistory(prev => [
        ...prev,
        "Available CLI Targets:",
        "  • predict congestion  - analyze ingress safety",
        "  • simulate rain       - activate Storm Mode",
        "  • generate report     - synthesize post-match analysis",
        "  • deploy volunteers   - pre-position response corridor",
        "  • clear               - reset terminal logs"
      ]);
    } else if (lower === 'clear') {
      setTerminalHistory([]);
    } else if (lower.includes('rain') || lower.includes('storm')) {
      onScenario('storm');
      setTerminalHistory(prev => [...prev, "[OK] Storm scenario context injected into digital twin."]);
    } else if (lower.includes('congestion') || lower.includes('gate b')) {
      onScenario('congestion');
      setTerminalHistory(prev => [...prev, "[OK] High-volume ingress scenario active at Gate B."]);
    } else if (lower.includes('report')) {
      onScenario('report');
      if (onOpenReport) onOpenReport();
      setTerminalHistory(prev => [...prev, "[OK] Compiling cognitive post-match report.", "[OK] Opening Executive After Action Report overlay."]);
    } else if (lower.includes('volunteers')) {
      setTerminalHistory(prev => [...prev, "[OK] Volunteers routed: 14 agents pre-positioned in corridor B-D."]);
    } else {
      onSend(command);
    }
    setQuery('');
  };

  const handleSpeed = (s: number) => {
    setActiveSpeed(s);
    onSpeed(s);
    setTerminalHistory(prev => [...prev, `aegis@control:~$ set_speed --rate=${s}x`, `[OK] Time clock multiplier set to ${s}x.`]);
  };

  // Mock Voice command activation
  const triggerVoiceCommand = () => {
    if (voiceActive) return;
    setVoiceActive(true);
    setTerminalHistory(prev => [...prev, "🎤 Voice activation listening...", "  [Waveform calibrating]"]);

    // Speak a mock command after 1.5 seconds
    setTimeout(() => {
      const voiceQueries = [
        "Predict crowd in Gate B",
        "Open evacuation mode",
        "Generate executive report",
        "Simulate incoming storm"
      ];
      const randomQuery = voiceQueries[Math.floor(Math.random() * voiceQueries.length)];
      setTerminalHistory(prev => [...prev, `🎤 [Voice Injected]: "${randomQuery}"`]);
      handleSend(randomQuery);
      setVoiceActive(false);
    }, 1800);
  };

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', gap: 6,
      padding: '8px 10px',
      height: '100%',
      fontFamily: 'Space Mono, monospace',
      fontSize: 10
    }}>
      {/* CLI Monitor Panel */}
      <div style={{
        flex: 1,
        background: 'rgba(3,4,10,0.85)',
        border: '1px solid var(--border)',
        borderRadius: 6,
        padding: 8,
        overflowY: 'auto',
        color: '#10b981',
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        height: '120px'
      }}>
        {terminalHistory.map((line, i) => (
          <div key={i} style={{
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            color: line.startsWith('aegis@control') ? 'var(--accent-cyan)' : line.startsWith('🎤') ? 'var(--accent-orange)' : '#10b981'
          }}>
            {line}
          </div>
        ))}
        {nlResponse && (
          <div style={{ color: 'var(--text-secondary)', borderTop: '1px dashed var(--border)', paddingTop: 4, marginTop: 4 }}>
            {nlResponse}
          </div>
        )}
        <div ref={logEndRef} />
      </div>

      {/* Input controls */}
      <div style={{ display: 'flex', gap: 4 }}>
        <div style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          background: 'rgba(0,0,0,0.5)',
          border: '1px solid var(--border-bright)',
          borderRadius: 6,
          padding: '0 8px'
        }}>
          <span style={{ color: 'var(--accent-cyan)', marginRight: 4 }}>&gt;</span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder="Type 'help' or click 🎤..."
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              color: 'var(--text-primary)',
              fontFamily: 'Space Mono, monospace',
              fontSize: 10,
              outline: 'none',
              padding: '6px 0',
            }}
          />
          {/* Micro Voice activation button */}
          <button
            onClick={triggerVoiceCommand}
            title="Trigger Voice command"
            style={{
              background: 'none',
              border: 'none',
              color: voiceActive ? 'var(--accent-red)' : 'var(--text-muted)',
              cursor: 'pointer',
              fontSize: 11,
              padding: '2px 4px',
              animation: voiceActive ? 'pulse 0.8s infinite alternate' : 'none'
            }}
          >
            {voiceActive ? '🔴' : '🎤'}
          </button>
        </div>
        <button
          onClick={() => handleSend()}
          style={{
            width: 32,
            background: 'var(--accent-blue)',
            border: 'none',
            borderRadius: 6,
            color: 'var(--bg-deep)',
            fontSize: 12,
            fontWeight: 'bold',
            cursor: 'pointer'
          }}
        >→</button>
      </div>

      {/* Speed & Autocomplete Helpers */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 4 }}>
        <div style={{ display: 'flex', gap: 3 }}>
          {['congestion', 'storm', 'report'].map(sc => (
            <button
              key={sc}
              onClick={() => handleSend(`Simulate ${sc}`)}
              style={{
                padding: '2px 6px',
                background: 'rgba(0,212,255,0.04)',
                border: '1px solid var(--border)',
                borderRadius: 4,
                color: 'var(--accent-cyan)',
                fontSize: 8,
                cursor: 'pointer'
              }}
            >
              [{sc.toUpperCase()}]
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ fontSize: 8, color: 'var(--text-muted)' }}>TIME CLOCK:</span>
          {[1, 5, 20].map(s => (
            <button
              key={s}
              onClick={() => handleSpeed(s)}
              style={{
                padding: '2px 6px',
                background: activeSpeed === s ? 'var(--accent-blue)' : 'transparent',
                border: `1px solid ${activeSpeed === s ? 'var(--accent-blue)' : 'var(--border)'}`,
                borderRadius: 4,
                color: activeSpeed === s ? 'var(--bg-deep)' : 'var(--text-muted)',
                fontSize: 8,
                cursor: 'pointer'
              }}
            >
              {s}x
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
