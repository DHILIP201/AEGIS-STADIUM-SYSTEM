import React from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface DataPoint {
  time: number;
  value: number;
  displayTime?: string;
}

interface Props {
  confidenceHistory: DataPoint[];
}

const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: { value: number }[] }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: 'rgba(5,6,13,0.95)',
        border: '1px solid var(--border-bright)',
        borderRadius: 6,
        padding: '6px 10px',
        fontFamily: 'Space Mono, monospace',
        fontSize: 11,
        color: 'var(--accent-blue)',
      }}>
        Confidence: <strong>{payload[0].value}%</strong>
      </div>
    );
  }
  return null;
};

export default function ConfidenceChart({ confidenceHistory }: Props) {
  const currentConf = confidenceHistory.length
    ? confidenceHistory[confidenceHistory.length - 1].value
    : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '8px 12px' }}>
      {/* Current confidence display */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
        <span style={{
          fontFamily: 'Orbitron, monospace',
          fontSize: 28,
          fontWeight: 900,
          color: 'var(--accent-blue)',
          textShadow: '0 0 16px rgba(0,212,255,0.5)',
          lineHeight: 1,
        }}>{currentConf}<span style={{ fontSize: 14 }}>%</span></span>
        <span style={{
          fontFamily: 'Space Mono, monospace',
          fontSize: 10,
          color: 'var(--text-muted)',
        }}>SYSTEM CONFIDENCE</span>
      </div>

      {/* Chart */}
      <div style={{ flex: 1, minHeight: 0 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={confidenceHistory} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="confGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#00d4ff" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#00d4ff" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis
              dataKey="displayTime"
              tick={{ fill: '#4a5068', fontSize: 8, fontFamily: 'Space Mono, monospace' }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fill: '#4a5068', fontSize: 8, fontFamily: 'Space Mono, monospace' }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="value"
              stroke="#00d4ff"
              strokeWidth={2}
              fill="url(#confGradient)"
              dot={false}
              activeDot={{ r: 4, fill: '#00d4ff', stroke: 'var(--bg-deep)', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
