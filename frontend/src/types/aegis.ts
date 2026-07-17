export interface Zone {
  id: string;
  name: string;
  capacity: number;
  current: number;
  density: number;
  risk: 'safe' | 'moderate' | 'high' | 'critical';
  x: number;
  y: number;
}

export interface Agent {
  id: string;
  name: string;
  color: string;
  status: 'idle' | 'monitoring' | 'analyzing' | 'predicting' | 'warning' | 'critical';
  thinking: string;
  confidence: number;
  accuracy: number;
  trust: number;
}

export interface TimelineEvent {
  id: string;
  storyTime: number;
  displayTime: string;
  title: string;
  description: string;
  type: 'info' | 'warning' | 'alert' | 'action' | 'outcome' | 'critical';
  status: 'past' | 'current' | 'future';
}

export interface DebateArgument {
  agentId: string;
  agentName: string;
  color: string;
  position: string;
  confidence: number;
  reasoning: string;
  evidence?: string;
  risk?: string;
  expectedBenefit?: string;
}

export interface DebateState {
  topic: string;
  arguments: DebateArgument[];
  finalDecision: {
    actions: string[];
    confidence: number;
    reasoning: string;
    expectedOutcome: string;
  } | null;
  phase: 'collecting' | 'debating' | 'deciding' | 'decided';
}

export interface Recommendation {
  id: string;
  title: string;
  description: string;
  confidence: number;
  status: 'pending' | 'approved' | 'executing' | 'done';
  agentId: string;
  evidence: string[];
  reasoning: string;
  tradeoffs: string[];
  prediction: string;
  expectedOutcome: string;
  sources: string[];
  alternativesRejected?: string[];
  whyNot?: string[];
}

export interface Scorecard {
  category: string;
  score: number;
  trend: 'up' | 'down' | 'stable';
  color: string;
}

export interface BlackboxEntry {
  time: string;
  type: 'prediction' | 'action' | 'outcome';
  title: string;
  details: string;
  accuracy: number | null;
}

export interface SuccessMetrics {
  before: string;
  after: string;
  time_min: number;
  prediction_accuracy: number;
  fan_satisfaction_delta: number;
  medical_risk_delta: number;
}

export interface EventGraphNode {
  id: string;
  label: string;
  type: 'cause' | 'effect' | 'risk' | 'action' | 'outcome';
}

export interface StadiumInfo {
  name: string;
  totalCapacity: number;
  currentOccupancy: number;
  zones: Zone[];
}

export interface Metrics {
  occupancy: number;
  temperature: number;
  energyMW: number;
  volunteersDeployed: number;
  medicalAlerts: number;
  transportDelayMin: number;
}

export interface AegisState {
  storyTime: number;
  displayTime: string;
  matchPhase: string;
  riskLevel: number;
  riskLabel: string;
  riskColor: string;
  stadium: StadiumInfo;
  agents: Agent[];
  timeline: TimelineEvent[];
  debate: DebateState | null;
  recommendations: Recommendation[];
  scorecards: Scorecard[];
  blackbox: BlackboxEntry[];
  confidenceHistory: { time: number; value: number; displayTime?: string }[];
  metrics: Metrics;
  successMetrics: SuccessMetrics | null;
  eventGraph: EventGraphNode[];
  currentEventId: string;
  nlResponse: string | null;
  reportText: string | null;
  storyProgress: number;
}
