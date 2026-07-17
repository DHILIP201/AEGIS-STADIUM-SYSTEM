import React, { useState } from 'react';
import { AegisState } from '../types/aegis';

interface Props {
  state: AegisState;
}

export default function PerimeterMap({ state }: Props) {
  const [selectedMarker, setSelectedMarker] = useState<string | null>(null);

  const gateBDensity = state.stadium.zones.find(z => z.id === 'south_gate_b')?.density ?? 0;
  const isSurgeActive = gateBDensity > 0.75;
  const isStormActive = state.storyTime >= 1140;

  const getMarkerDetails = (id: string) => {
    switch (id) {
      case 'stadium':
        return {
          title: "AT&T STADIUM (VENUE CENTRAL)",
          stats: [
            { label: "Occupancy", value: `${state.stadium.currentOccupancy.toLocaleString()} / 80,000` },
            { label: "Internal Risk", value: `${state.riskLevel}% [${state.riskLabel}]` },
            { label: "Active Concessions", value: "42 operating" }
          ],
          ai: "All gates monitored. Concourses prepared for wet-weather ingress flow."
        };
      case 'parking_a':
        return {
          title: "PARKING LOT P1 (NORTH FIELD)",
          stats: [
            { label: "Occupancy Rate", value: isSurgeActive ? "92% (FULL)" : "64%" },
            { label: "Average Exit", value: isSurgeActive ? "14 mins" : "5 mins" },
            { label: "EV Charging", value: "12/12 active" }
          ],
          ai: isSurgeActive ? "⚠️ DIVERGING: Redirect incoming arrivals to Lot P2." : "Nominal. Parking flow normal."
        };
      case 'parking_b':
        return {
          title: "PARKING LOT P2 (SOUTH REBATE)",
          stats: [
            { label: "Occupancy Rate", value: isSurgeActive ? "41%" : "30%" },
            { label: "Average Exit", value: "2 mins" },
            { label: "EV Charging", value: "19/24 charging" }
          ],
          ai: isSurgeActive ? "✓ RECOMMEND BYPASS: Empty stalls available for Gate D ingress." : "Nominal. Recommended route."
        };
      case 'metro':
        return {
          title: "METRO STATION INGRESS GATEWAYS",
          stats: [
            { label: "Current Platform Load", value: isSurgeActive ? "6,240 passengers" : "1,200 passengers" },
            { label: "Next Train Arrival", value: "2 minutes" },
            { label: "Transit Status", value: state.metrics.transportDelayMin > 0 ? `DELAY ${state.metrics.transportDelayMin}m` : "NOMINAL" }
          ],
          ai: isSurgeActive ? "⚠️ Platform saturated. Suggest delaying Metro Gate exits." : "Operating normal schedules."
        };
      case 'taxi':
        return {
          title: "TAXI & RIDE-SHARE CORRIDOR",
          stats: [
            { label: "Queue Latency", value: isSurgeActive ? "14 mins wait" : "4 mins wait" },
            { label: "Active Fleet", value: "28 active runs" },
            { label: "Surge Pricing", value: "1.4x active" }
          ],
          ai: "Heavy ingress demand near east corridors. Divert dropoffs to Gate D."
        };
      case 'drone_1':
        return {
          title: "UAV DRONE SQUAD 1 - GATE B PATROL",
          stats: [
            { label: "Battery Level", value: "87% online" },
            { label: "Altitude", value: "82 meters" },
            { label: "Thermal Scan Accuracy", value: "98.8% accuracy" }
          ],
          ai: "Streaming live feed to CCTV CAM 01. Detecting potential crowd surge."
        };
      default:
        return null;
    }
  };

  const details = selectedMarker ? getMarkerDetails(selectedMarker) : null;

  return (
    <div style={{
      width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
      position: 'relative', overflow: 'hidden', background: '#05070e'
    }}>
      {/* SVG Map Canvas */}
      <div style={{ flex: 1, position: 'relative' }}>
        <svg viewBox="0 0 500 320" style={{ width: '100%', height: '100%', background: '#070913' }}>
          
          {/* Grid lines background */}
          <defs>
            <pattern id="perimeter-grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(0, 212, 255, 0.03)" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#perimeter-grid)" />

          {/* Drones Patrol Loop lines */}
          <path d="M 50,50 L 250,160 L 420,60" fill="none" stroke="rgba(0,212,255,0.15)" strokeWidth="1" strokeDasharray="4,4" />
          <path d="M 50,260 L 250,160 L 450,260" fill="none" stroke="rgba(124,58,237,0.15)" strokeWidth="1" strokeDasharray="4,4" />

          {/* Road Network Lines */}
          {/* Main Road A12 */}
          <line x1="10" y1="90" x2="490" y2="90" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
          <line x1="10" y1="90" x2="490" y2="90" stroke={isSurgeActive ? 'var(--accent-red)' : 'var(--accent-green)'} strokeWidth="1.5" />
          {/* Secondary road */}
          <line x1="250" y1="90" x2="250" y2="310" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
          <line x1="250" y1="90" x2="250" y2="310" stroke="var(--accent-green)" strokeWidth="1.5" />

          {/* Stadium Shape (Center) */}
          <rect
            x="190" y="120" width="120" height="80" rx="40"
            fill="rgba(5, 6, 13, 0.85)" stroke="var(--accent-blue)" strokeWidth="2"
            onClick={() => setSelectedMarker('stadium')}
            style={{ cursor: 'pointer', transition: 'all 0.3s ease' }}
          />
          <text x="250" y="165" fill="white" fontSize="10" fontFamily="Orbitron" textAnchor="middle" fontWeight="bold">🏟️ AT&T STADIUM</text>

          {/* Crowd Flow arrows from Metro to Gate B/D */}
          {isSurgeActive && (
            <g opacity="0.8">
              <path d="M 410,160 Q 360,180 300,185" fill="none" stroke="var(--accent-red)" strokeWidth="2" strokeDasharray="5,3" markerEnd="url(#arrow)" />
              <path d="M 410,160 Q 360,240 260,210" fill="none" stroke="var(--accent-green)" strokeWidth="2" strokeDasharray="5,3" markerEnd="url(#arrow)" />
            </g>
          )}

          {/* Markers */}
          {/* Parking Lot P1 (Top Left) */}
          <circle
            cx="70" cy="60" r="12"
            fill="rgba(5, 6, 13, 0.9)" stroke={isSurgeActive ? 'var(--accent-red)' : 'var(--accent-green)'} strokeWidth="2"
            onClick={() => setSelectedMarker('parking_a')}
            style={{ cursor: 'pointer' }}
          />
          <text x="70" y="63" fill="white" fontSize="8" fontFamily="Space Mono" textAnchor="middle" fontWeight="bold">P1</text>

          {/* Parking Lot P2 (Bottom Left) */}
          <circle
            cx="70" cy="250" r="12"
            fill="rgba(5, 6, 13, 0.9)" stroke="var(--accent-green)" strokeWidth="2"
            onClick={() => setSelectedMarker('parking_b')}
            style={{ cursor: 'pointer' }}
          />
          <text x="70" y="253" fill="white" fontSize="8" fontFamily="Space Mono" textAnchor="middle" fontWeight="bold">P2</text>

          {/* Metro Station (Right) */}
          <rect
            x="400" y="130" width="60" height="40" rx="6"
            fill="rgba(5, 6, 13, 0.9)" stroke={isSurgeActive ? 'var(--accent-amber)' : 'var(--accent-green)'} strokeWidth="2"
            onClick={() => setSelectedMarker('metro')}
            style={{ cursor: 'pointer' }}
          />
          <text x="430" y="153" fill="white" fontSize="8" fontFamily="Space Mono" textAnchor="middle" fontWeight="bold">🚇 METRO</text>

          {/* Taxi Queue (Bottom Right) */}
          <circle
            cx="430" cy="250" r="12"
            fill="rgba(5, 6, 13, 0.9)" stroke={isSurgeActive ? 'var(--accent-red)' : 'var(--accent-green)'} strokeWidth="2"
            onClick={() => setSelectedMarker('taxi')}
            style={{ cursor: 'pointer' }}
          />
          <text x="430" y="253" fill="white" fontSize="8" fontFamily="Space Mono" textAnchor="middle" fontWeight="bold">🚖</text>

          {/* Drone (Flying above) */}
          <circle
            cx="140" cy="100" r="6"
            fill="rgba(0,212,255,0.2)" stroke="var(--accent-cyan)" strokeWidth="1"
            onClick={() => setSelectedMarker('drone_1')}
            style={{ cursor: 'pointer' }}
          />
          <text x="140" y="96" fill="var(--accent-cyan)" fontSize="7" fontFamily="Space Mono" textAnchor="middle">🛸 UAV 1</text>

          {/* Rain Front Overlay Cloud (Moving East) */}
          {isStormActive && (
            <g opacity="0.15" transform="translate(180, 20)">
              <path d="M 50,30 Q 70,10 90,30 Q 110,10 130,30 Q 150,20 140,50 Q 150,80 120,70 Q 90,90 70,70 Q 40,70 50,30 Z" fill="var(--accent-blue)" />
              <text x="95" y="55" fill="white" fontSize="7" fontFamily="Space Mono" fontWeight="bold">🌧️ RAIN FRONT</text>
            </g>
          )}

          {/* Emergency Ambulance Dot (Animate moving to Sect 112) */}
          {isSurgeActive && (
            <circle cx="280" cy="185" r="4" fill="var(--accent-red)">
              <animate attributeName="opacity" values="0.2;1;0.2" dur="1s" repeatCount="indefinite" />
            </circle>
          )}

        </svg>

        {/* Legend */}
        <div style={{
          position: 'absolute', top: '10px', left: '10px',
          background: 'rgba(5, 6, 13, 0.85)', padding: '6px 10px', borderRadius: '4px',
          border: '1px solid var(--border)', fontSize: '8px', color: 'var(--text-secondary)',
          display: 'flex', flexDirection: 'column', gap: '3px'
        }}>
          <div>🟢 Normal Route</div>
          <div>🟡 Advisory Wait</div>
          <div>🔴 High Congestion</div>
        </div>
      </div>

      {/* Selected Marker Details Overlay */}
      {details && (
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          background: 'rgba(5, 6, 13, 0.95)', borderTop: '1.5px solid var(--accent-blue)',
          padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '6px',
          boxShadow: '0 -5px 20px rgba(0, 212, 255, 0.1)',
          animation: 'slideInUp 0.2s ease-out', zIndex: 10
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontFamily: 'Orbitron', fontWeight: 700, color: 'var(--accent-cyan)', fontSize: '10px' }}>
              {details.title}
            </span>
            <button
              onClick={() => setSelectedMarker(null)}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '11px', cursor: 'pointer' }}
            >
              [ CLOSE X ]
            </button>
          </div>

          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            {details.stats.map((s, idx) => (
              <div key={idx} style={{ fontFamily: 'Space Mono', fontSize: '9px' }}>
                <span style={{ color: 'var(--text-muted)' }}>{s.label}: </span>
                <span style={{ color: 'white', fontWeight: 700 }}>{s.value}</span>
              </div>
            ))}
          </div>

          <div style={{ borderTop: '1px dashed rgba(255,255,255,0.05)', paddingTop: '4px', fontSize: '9px', fontFamily: 'Space Mono', color: 'var(--accent-amber)' }}>
            🤖 AI DECISION ENGINE: {details.ai}
          </div>
        </div>
      )}

    </div>
  );
}
