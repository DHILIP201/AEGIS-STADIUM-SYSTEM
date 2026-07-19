import { AegisState } from '../types/aegis';

export const mockState: AegisState = {
  storyTime: 0,
  displayTime: '12:00 PM',
  matchPhase: 'PRE-MATCH',
  riskLevel: 15,
  riskLabel: 'LOW RISK',
  riskColor: '#10b981',
  stadium: {
    name: 'AT&T Stadium',
    totalCapacity: 80500,
    currentOccupancy: 74832,
    zones: [
      { id: 'north_gate_a', name: 'North Gate A', capacity: 20000, current: 4000, density: 0.20, risk: 'safe', x: 50, y: 10 },
      { id: 'south_gate_b', name: 'South Gate B', capacity: 20000, current: 8000, density: 0.40, risk: 'safe', x: 50, y: 90 },
      { id: 'east_gate_c', name: 'East Gate C', capacity: 15000, current: 3000, density: 0.20, risk: 'safe', x: 90, y: 50 },
      { id: 'west_gate_d', name: 'West Gate D', capacity: 15000, current: 3750, density: 0.25, risk: 'safe', x: 10, y: 50 },
      { id: 'field_level', name: 'Field Level VIP', capacity: 5000, current: 1500, density: 0.30, risk: 'safe', x: 50, y: 50 },
      { id: 'lower_bowl', name: 'Lower Bowl', capacity: 35000, current: 14000, density: 0.40, risk: 'safe', x: 40, y: 40 },
      { id: 'upper_bowl', name: 'Upper Bowl', capacity: 40500, current: 10125, density: 0.25, risk: 'safe', x: 60, y: 60 },
      { id: 'concourse_main', name: 'Main Concourse', capacity: 25000, current: 8750, density: 0.35, risk: 'safe', x: 30, y: 70 },
    ]
  },
  agents: [
    { id: 'crowd', name: 'Crowd Agent', color: '#ff3366', status: 'monitoring', thinking: 'All gates operating normally. Arrival flow steady.', confidence: 92, accuracy: 94.2, trust: 94 },
    { id: 'transport', name: 'Transport Agent', color: '#ffb300', status: 'monitoring', thinking: 'Metro intervals on time.', confidence: 88, accuracy: 91.8, trust: 91 },
    { id: 'security', name: 'Security Agent', color: '#00d4ff', status: 'monitoring', thinking: 'No anomalies detected on CCTV.', confidence: 95, accuracy: 90.1, trust: 90 },
    { id: 'medical', name: 'Medical Agent', color: '#ff6b35', status: 'monitoring', thinking: 'First aid stations manned.', confidence: 98, accuracy: 96.0, trust: 96 },
    { id: 'executive', name: 'Executive Agent', color: '#fbbf24', status: 'idle', thinking: 'Awaiting critical thresholds.', confidence: 96, accuracy: 95.7, trust: 96 }
  ],
  timeline: [
    { id: 'event_match_start', storyTime: 0, displayTime: '12:00 PM', title: 'Match Day Begins', description: 'Gates opened for USA vs Mexico.', type: 'info', status: 'current' },
    { id: 'event_crowd_surge', storyTime: 180, displayTime: '12:03 PM', title: 'Crowd Surge Predicted', description: 'Gate B density trending up.', type: 'warning', status: 'future' }
  ],
  debate: null,
  recommendations: [
    { id: 'rec_001', title: 'Pre-position 4 volunteers at Gate B', description: 'Historical data shows Gate B peak at T+7 minutes', confidence: 78, status: 'pending', agentId: 'crowd', evidence: ['Historical pattern from 3/4 prior matches'], reasoning: 'Preventive positioning reduces response time.', tradeoffs: ['Slightly reduces coverage at Gate C'], prediction: 'Reduces potential congestion by 22%', expectedOutcome: 'Smooth fan flow', sources: ['Historical Data', 'IoT Sensors'] }
  ],
  scorecards: [
    { category: 'Crowd Safety', score: 96, trend: 'stable', color: '#10b981' },
    { category: 'Transportation', score: 88, trend: 'stable', color: '#10b981' },
    { category: 'Medical', score: 94, trend: 'stable', color: '#10b981' },
    { category: 'Overall', score: 91, trend: 'stable', color: '#10b981' }
  ],
  blackbox: [],
  confidenceHistory: [{ time: 0, value: 72, displayTime: '12:00 PM' }],
  metrics: { occupancy: 74832, temperature: 39, energyMW: 2.1, volunteersDeployed: 217, medicalAlerts: 0, transportDelayMin: 0 },
  successMetrics: null,
  eventGraph: [],
  currentEventId: 'event_match_start',
  nlResponse: null,
  reportText: null,
  storyProgress: 0
};
