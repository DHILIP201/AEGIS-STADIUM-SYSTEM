import React, { useState } from 'react';
import { Recommendation, SuccessMetrics } from '../types/aegis';

interface Props {
  recommendations: Recommendation[];
  successMetrics: SuccessMetrics | null;
}

const STATUS_CONFIG: Record<Recommendation['status'], { label: string; color: string }> = {
  pending: { label: 'PENDING', color: 'var(--text-muted)' },
  approved: { label: 'APPROVED', color: 'var(--accent-blue)' },
  executing: { label: 'EXECUTING', color: 'var(--accent-amber)' },
  done: { label: 'DONE', color: 'var(--accent-green)' },
};

function RecommendationCard({ rec }: { rec: Recommendation }) {
  const [expanded, setExpanded] = useState(false);
  const confColor = rec.confidence >= 90 ? 'var(--accent-green)' : rec.confidence >= 75 ? 'var(--accent-amber)' : 'var(--accent-red)';
  const sc = STATUS_CONFIG[rec.status];

  return (
    <div style={{
      borderLeft: `3px solid ${confColor}`,
      background: 'rgba(255,255,255,0.02)',
      borderRadius: '0 8px 8px 0',
      marginBottom: 8,
      overflow: 'hidden',
      transition: 'all 0.3s ease',
    }}>
      {/* Header */}
      <div style={{ padding: '10px 12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
          <span style={{
            padding: '1px 7px',
            borderRadius: 999,
            background: `${confColor}20`,
            border: `1px solid ${confColor}44`,
            fontFamily: 'Orbitron, monospace',
            fontSize: 9,
            color: confColor,
            fontWeight: 700,
          }}>{rec.confidence}%</span>
          <span style={{
            padding: '1px 7px',
            borderRadius: 999,
            background: 'rgba(255,255,255,0.05)',
            fontFamily: 'Orbitron, monospace',
            fontSize: 9,
            color: sc.color,
            fontWeight: 700,
            marginLeft: 'auto',
          }}>{sc.label}</span>
        </div>
        <div style={{
          fontSize: 12,
          fontWeight: 600,
          color: 'var(--text-primary)',
          marginBottom: 4,
          lineHeight: 1.3,
        }}>{rec.title}</div>
        <div style={{
          fontSize: 11,
          color: 'var(--text-secondary)',
          lineHeight: 1.4,
        }}>{rec.description}</div>
        <button
          onClick={() => setExpanded(e => !e)}
          style={{
            marginTop: 6,
            background: 'none',
            border: 'none',
            color: 'var(--accent-blue)',
            fontSize: 10,
            fontFamily: 'Inter, sans-serif',
            cursor: 'pointer',
            padding: 0,
            display: 'flex', alignItems: 'center', gap: 4,
          }}
        >{expanded ? 'Hide Analysis ▴' : 'Show Analysis ▾'}</button>
      </div>

      {/* Expanded section */}
      <div style={{
        maxHeight: expanded ? 500 : 0,
        overflow: 'hidden',
        transition: 'max-height 0.4s ease',
      }}>
        <div style={{
          padding: '0 12px 12px',
          borderTop: '1px solid var(--border)',
          paddingTop: 10,
        }}>
          {rec.evidence.length > 0 && (
            <div style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 10, color: 'var(--accent-blue)', fontWeight: 700, marginBottom: 4 }}>🔍 EVIDENCE</div>
              {rec.evidence.map((e, i) => (
                <div key={i} style={{ fontSize: 10, color: 'var(--text-secondary)', marginBottom: 2, paddingLeft: 8 }}>• {e}</div>
              ))}
            </div>
          )}
          {rec.reasoning && (
            <div style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 10, color: 'var(--accent-cyan)', fontWeight: 700, marginBottom: 4 }}>🧠 REASONING</div>
              <div style={{ fontSize: 10, color: 'var(--text-secondary)', lineHeight: 1.4 }}>{rec.reasoning}</div>
            </div>
          )}
          {rec.tradeoffs.length > 0 && (
            <div style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 10, color: 'var(--accent-amber)', fontWeight: 700, marginBottom: 4 }}>⚠ TRADE-OFFS</div>
              {rec.tradeoffs.map((t, i) => (
                <div key={i} style={{ fontSize: 10, color: 'var(--accent-amber)', marginBottom: 2, paddingLeft: 8 }}>• {t}</div>
              ))}
            </div>
          )}
          {rec.prediction && (
            <div style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 10, color: 'var(--accent-purple)', fontWeight: 700, marginBottom: 4 }}>🔮 PREDICTION</div>
              <div style={{ fontSize: 10, color: 'var(--text-secondary)', lineHeight: 1.4 }}>{rec.prediction}</div>
            </div>
          )}
          {rec.expectedOutcome && (
            <div style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 10, color: 'var(--accent-green)', fontWeight: 700, marginBottom: 4 }}>✓ EXPECTED OUTCOME</div>
              <div style={{ fontSize: 10, color: 'var(--text-secondary)', lineHeight: 1.4 }}>{rec.expectedOutcome}</div>
            </div>
          )}
          {rec.alternativesRejected && rec.alternativesRejected.length > 0 && (
            <div style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 10, color: 'var(--accent-orange)', fontWeight: 700, marginBottom: 4 }}>❌ ALTERNATIVES REJECTED</div>
              {rec.alternativesRejected.map((alt, i) => (
                <div key={i} style={{ fontSize: 10, color: 'var(--text-secondary)', marginBottom: 2, paddingLeft: 8 }}>• {alt}</div>
              ))}
            </div>
          )}
          {rec.whyNot && rec.whyNot.length > 0 && (
            <div style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 10, color: 'var(--accent-red)', fontWeight: 700, marginBottom: 4 }}>❓ WHY NOT ALTERNATIVE?</div>
              {rec.whyNot.map((wn, i) => (
                <div key={i} style={{ fontSize: 10, color: 'var(--text-secondary)', marginBottom: 2, paddingLeft: 8 }}>• {wn}</div>
              ))}
            </div>
          )}
          {rec.sources.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {rec.sources.map((s, i) => (
                <span key={i} style={{
                  padding: '1px 6px',
                  background: 'rgba(0,212,255,0.08)',
                  border: '1px solid var(--border)',
                  borderRadius: 4,
                  fontSize: 9,
                  color: 'var(--text-muted)',
                  fontFamily: 'Space Mono, monospace',
                }}>{s}</span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function RecommendationsPanel({ recommendations, successMetrics }: Props) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto', padding: '6px 8px' }}>
      {/* AI Latency and Model info */}
      <div style={{
        background: 'rgba(0, 212, 255, 0.04)',
        border: '1px solid rgba(0, 212, 255, 0.15)',
        borderRadius: 8,
        padding: '6px 10px',
        marginBottom: 8,
        fontSize: '9px',
        fontFamily: 'Space Mono, monospace',
        display: 'flex',
        justifyContent: 'space-between',
        color: 'var(--text-primary)',
        flexShrink: 0,
      }}>
        <span>🤖 MODEL: Gemini 2.5 Flash</span>
        <span style={{ color: 'var(--accent-cyan)' }}>⏱️ LATENCY: 1.84s</span>
      </div>
      {/* Success metrics */}
      {successMetrics && (
        <div style={{
          background: 'rgba(16,185,129,0.08)',
          border: '1px solid rgba(16,185,129,0.3)',
          borderRadius: 10,
          padding: '12px',
          marginBottom: 10,
          animation: 'slideInUp 0.5s ease-out',
        }}>
          <div style={{
            fontFamily: 'Orbitron, monospace',
            fontSize: 10,
            color: 'var(--accent-green)',
            marginBottom: 8,
            display: 'flex', alignItems: 'center', gap: 6,
          }}>✅ SUCCESS METRICS</div>
          <div style={{
            fontSize: 13,
            fontWeight: 700,
            color: 'var(--text-primary)',
            marginBottom: 8,
          }}>{successMetrics.before} → {successMetrics.after}</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            {[
              { label: 'Time', value: `${successMetrics.time_min} min`, color: 'var(--accent-blue)' },
              { label: 'Accuracy', value: `${successMetrics.prediction_accuracy}%`, color: 'var(--accent-cyan)' },
              { label: 'Fan Satisfaction', value: `+${successMetrics.fan_satisfaction_delta}%`, color: 'var(--accent-green)' },
              { label: 'Medical Risk', value: `${successMetrics.medical_risk_delta}%`, color: 'var(--accent-red)' },
            ].map(stat => (
              <div key={stat.label} style={{
                background: 'rgba(255,255,255,0.03)',
                borderRadius: 6,
                padding: '6px 8px',
              }}>
                <div style={{ fontSize: 9, color: 'var(--text-muted)', marginBottom: 2 }}>{stat.label}</div>
                <div style={{
                  fontFamily: 'Space Mono, monospace',
                  fontSize: 13,
                  fontWeight: 700,
                  color: stat.color,
                }}>{stat.value}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {recommendations.length === 0 ? (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flex: 1, color: 'var(--text-muted)', fontSize: 12,
          fontStyle: 'italic',
        }}>
          Awaiting AI recommendations...
        </div>
      ) : (
        recommendations.map(rec => <RecommendationCard key={rec.id} rec={rec} />)
      )}
    </div>
  );
}
