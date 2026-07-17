import React from 'react';
import { EventGraphNode } from '../types/aegis';

interface Props {
  eventGraph: EventGraphNode[];
}

const TYPE_COLORS: Record<EventGraphNode['type'], string> = {
  cause: '#ff3366',
  effect: '#00d4ff',
  risk: '#ff6b35',
  action: '#00ffcc',
  outcome: '#10b981',
};

const ARROWHEAD_ID = 'aegis-arrow';

export default function EventGraph({ eventGraph }: Props) {
  if (!eventGraph.length) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100%', padding: '10px',
      }}>
        <span style={{
          color: 'var(--text-muted)',
          fontSize: 11,
          fontStyle: 'italic',
          textAlign: 'center',
        }}>Causal event chain will appear when events are detected</span>
      </div>
    );
  }

  const nodeW = 90;
  const nodeH = 32;
  const gapX = 44;
  const svgH = 100;
  const totalW = eventGraph.length * nodeW + (eventGraph.length - 1) * gapX + 20;

  return (
    <div style={{ width: '100%', height: '100%', overflow: 'hidden', padding: '4px 6px' }}>
      <svg
        width="100%"
        height={svgH}
        viewBox={`0 0 ${Math.max(totalW, 400)} ${svgH}`}
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <marker
            id={ARROWHEAD_ID}
            markerWidth="6"
            markerHeight="6"
            refX="5"
            refY="3"
            orient="auto"
          >
            <path d="M0,0 L0,6 L6,3 z" fill="rgba(0,212,255,0.6)" />
          </marker>
        </defs>

        {eventGraph.map((node, i) => {
          const x = 10 + i * (nodeW + gapX);
          const y = svgH / 2 - nodeH / 2;
          const color = TYPE_COLORS[node.type];

          return (
            <g key={node.id} style={{
              animation: `fadeIn 0.4s ease-out ${i * 0.1}s both`,
            }}>
              {/* Arrow to next node */}
              {i < eventGraph.length - 1 && (
                <line
                  x1={x + nodeW}
                  y1={svgH / 2}
                  x2={x + nodeW + gapX}
                  y2={svgH / 2}
                  stroke="rgba(0,212,255,0.4)"
                  strokeWidth="1.5"
                  markerEnd={`url(#${ARROWHEAD_ID})`}
                  strokeDasharray="4 2"
                  style={{
                    animation: `fadeIn 0.4s ease-out ${i * 0.1 + 0.05}s both`,
                  }}
                />
              )}
              {/* Node rect */}
              <rect
                x={x}
                y={y}
                width={nodeW}
                height={nodeH}
                rx={6}
                fill={`${color}12`}
                stroke={color}
                strokeWidth={1.5}
              />
              {/* Type indicator dot */}
              <circle cx={x + 10} cy={svgH / 2} r={3} fill={color} />
              {/* Label */}
              <text
                x={x + nodeW / 2}
                y={svgH / 2 + 1}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="rgba(224,228,239,0.9)"
                fontSize={9}
                fontFamily="Space Mono, monospace"
              >
                {node.label.length > 12 ? node.label.slice(0, 12) + '…' : node.label}
              </text>
              {/* Type badge below */}
              <text
                x={x + nodeW / 2}
                y={y + nodeH + 12}
                textAnchor="middle"
                dominantBaseline="middle"
                fill={color}
                fontSize={7}
                fontFamily="Orbitron, monospace"
                opacity={0.8}
              >
                {node.type.toUpperCase()}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
