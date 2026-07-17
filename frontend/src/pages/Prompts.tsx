import React, { useState } from 'react';

interface PromptDefinition {
  id: string;
  name: string;
  role: string;
  temperature: number;
  tokens: number;
  prompt: string;
  guardrails: string[];
}

const PROMPTS: PromptDefinition[] = [
  {
    id: 'crowd',
    name: 'Crowd Agent Prompt',
    role: 'Pedestrian Flow & Gate Congestion Analyst',
    temperature: 0.2,
    tokens: 1500,
    guardrails: [
      'Never block stadium emergency evacuation exits.',
      'Divert at most 35% of flow to alternate gates to avoid secondary overload.',
      'Filter output through strict JSON schema.'
    ],
    prompt: `<system_prompt>
You are the Crowd Agent for AEGIS OS, running AT&T Stadium operations.
Your objective is to optimize fan ingress safety, predict gate bottlenecks, and manage pedestrian distribution.

<context>
- Stadium Capacity: 80,000
- Safe Ingress Rate: < 1.2 fans/second per gate turnstile
- High Ingress Alert: > 1.5 fans/second
- Critical Density: > 0.85 occupancy index
</context>

<reasoning_steps>
1. Calculate incoming density velocity per minute.
2. Project time-to-congestion (TTC) for target zone.
3. Compare safety indexes and evaluate rerouting pathways.
4. Output structured recommendation with confidence.
</reasoning_steps>

<output_format>
{
  "recommendation": "Divert ingress flow",
  "target_gate": "Gate D",
  "confidence": 94.3,
  "reasoning_chain": "...",
  "impact": { "density_reduction": 41 }
}
</output_format>
</system_prompt>`
  },
  {
    id: 'transport',
    name: 'Transport Agent Prompt',
    role: 'Metro Wave & Parking Logistics Coordinator',
    temperature: 0.1,
    tokens: 1200,
    guardrails: [
      'Maintain train headways above 90-second safety thresholds.',
      'Coordinate with regional transit authority API before delay dispatches.'
    ],
    prompt: `<system_prompt>
You are the Transport Agent for AEGIS OS.
Your objective is to coordinate Metro arrivals, parking waves, and shuttle transfers.

<context>
- Metro Line 1 Platform Capacity: 4,500 fans
- Train capacity: 800 passengers
- Peak exit arrival wave: 1,200 fans/min
</context>

<reasoning_steps>
1. Parse live transit schedules and GTFS delay updates.
2. Project station platform crush hazard likelihood.
3. Synthesize transport holding patterns (Metro exit delays, shuttle routing).
</reasoning_steps>

<output_format>
{
  "metro_delay_min": 4,
  "metro_trains_dispatched": 6,
  "reasoning": "Line 1 platform wave exceeds 4,500 capacity. Temporary platform exit delay required."
}
</output_format>
</system_prompt>`
  },
  {
    id: 'debate',
    name: 'Debate Engine Prompt',
    role: 'Multi-Agent Conflict Resolution Solver',
    temperature: 0.4,
    tokens: 2000,
    guardrails: [
      'Do not allow any agent to veto life safety actions.',
      'Resolve conflicting priorities in under 12 seconds.'
    ],
    prompt: `<system_prompt>
You are the AEGIS OS Agent Debate Engine.
Your objective is to run a structured cognitive debate when two subsystem kernels register conflicting requirements.

<debate_protocol>
- Round 1: Assertions. Each agent states their local target and priority.
- Round 2: Rebuttals. Agents evaluate trade-offs of opposing agent dispatches.
- Round 3: Synthesis. The Strategy Engine resolves the arguments into a single plan.
</debate_protocol>

<agents_in_debate>
- Crowd Agent: Prioritizes localized fan spacing and bottleneck prevention.
- Transport Agent: Prioritizes global transit flow and outdoor crowd queuing limits.
- Security Agent: Prioritizes perimeter defense and gate flow velocity.
</agents_in_debate>
</system_prompt>`
  },
  {
    id: 'executive',
    name: 'Executive Agent Prompt',
    role: 'Strategy Synthesis & Action Resolver',
    temperature: 0.3,
    tokens: 2500,
    guardrails: [
      'Require human operator validation for all dispatches.',
      'Calculate expected KPI impacts before issuing order.'
    ],
    prompt: `<system_prompt>
You are the Executive Agent for AEGIS OS.
Your role is to compile and synthesize conflicting inputs into a unified operational strategy.

<input_sources>
1. Agent Debate transcripts
2. Composite Risk Assessment Scorecards
3. Digital Twin sensor state
</input_sources>

<guardrails>
- If Risk Score > 70: Trigger immediate fallback emergency protocol.
- Do not deploy volunteers to unsafe thermal zones (> 40°C heat index).
</guardrails>

<output_format>
{
  "actions": ["Dispatch medics", "Open emergency shelter"],
  "reasoning_synthesis": "...",
  "expected_impact": {
    "crowd_reduction": -31,
    "medical_rescue_speed": "28% faster"
  }
}
</output_format>
</system_prompt>`
  }
];

export default function Prompts() {
  const [selectedPrompt, setSelectedPrompt] = useState<string>('crowd');
  const activePrompt = PROMPTS.find(p => p.id === selectedPrompt) || PROMPTS[0];

  return (
    <div style={{
      background: 'var(--bg-deep)',
      minHeight: 'calc(100vh - var(--nav-height))',
      padding: '24px',
      display: 'flex',
      gap: '20px',
      overflow: 'hidden'
    }}>
      {/* Sidebar Selector */}
      <div className="glass-card" style={{
        width: '280px',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        flexShrink: 0
      }}>
        <div style={{
          fontFamily: 'Orbitron, monospace', fontSize: 12, fontWeight: 900,
          color: 'var(--accent-blue)', borderBottom: '1px solid var(--border)',
          paddingBottom: '8px', marginBottom: '8px', letterSpacing: '0.08em'
        }}>
          ✍️ PROMPT REGISTRY
        </div>
        {PROMPTS.map(p => (
          <button
            key={p.id}
            onClick={() => setSelectedPrompt(p.id)}
            style={{
              background: selectedPrompt === p.id ? 'rgba(0, 212, 255, 0.1)' : 'transparent',
              border: `1px solid ${selectedPrompt === p.id ? 'var(--accent-blue)' : 'var(--border)'}`,
              color: selectedPrompt === p.id ? 'var(--accent-blue)' : 'var(--text-secondary)',
              borderRadius: '6px',
              padding: '10px 12px',
              textAlign: 'left',
              fontFamily: 'Space Mono, monospace',
              fontSize: '11px',
              cursor: 'pointer',
              fontWeight: selectedPrompt === p.id ? 700 : 400,
              transition: 'all 0.2s ease'
            }}
          >
            {p.name}
          </button>
        ))}
      </div>

      {/* Code Display Area */}
      <div className="glass-card" style={{
        flex: 1,
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        {/* Header Metadata */}
        <div style={{
          borderBottom: '1px solid var(--border)',
          paddingBottom: '12px',
          marginBottom: '16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start'
        }}>
          <div>
            <div style={{ fontFamily: 'Orbitron, monospace', fontSize: 16, fontWeight: 700, color: 'white' }}>
              {activePrompt.name}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>
              <b>ROLE:</b> {activePrompt.role}
            </div>
          </div>
          <div style={{
            display: 'flex', gap: '8px', fontSize: '10px',
            fontFamily: 'Space Mono, monospace', color: 'var(--text-muted)'
          }}>
            <span style={{ border: '1px solid var(--border)', padding: '2px 8px', borderRadius: 4 }}>
              TEMP: {activePrompt.temperature}
            </span>
            <span style={{ border: '1px solid var(--border)', padding: '2px 8px', borderRadius: 4 }}>
              MAX TOKENS: {activePrompt.tokens}
            </span>
          </div>
        </div>

        {/* Guardrails Widget */}
        <div style={{
          background: 'rgba(239, 68, 68, 0.03)',
          border: '1px solid rgba(239, 68, 68, 0.15)',
          borderRadius: '8px',
          padding: '12px',
          marginBottom: '16px',
          fontSize: '11px',
          color: 'var(--text-secondary)'
        }}>
          <div style={{
            fontFamily: 'Orbitron, monospace', fontSize: '9px', fontWeight: 900,
            color: 'var(--accent-red)', marginBottom: '6px', letterSpacing: '0.08em'
          }}>
            🛡️ Strict AI Guardrails
          </div>
          {activePrompt.guardrails.map((g, i) => (
            <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 2 }}>
              <span style={{ color: 'var(--accent-red)' }}>•</span>
              <span>{g}</span>
            </div>
          ))}
        </div>

        {/* Code Block */}
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
          <pre style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            padding: '16px',
            fontFamily: 'Space Mono, monospace',
            fontSize: '11px',
            color: 'var(--text-primary)',
            lineHeight: '1.5',
            height: '100%',
            overflowY: 'auto',
            whiteSpace: 'pre-wrap',
            margin: 0
          }}>
            {activePrompt.prompt}
          </pre>
        </div>
      </div>
    </div>
  );
}
