# System Architecture Specification — AEGIS OS

## 1. Flowchart of Operational Layers

```
      [Live Stadium Feeds]
  (CCTV, IoT, GPS, Metro API, Weather API)
                │
                ▼
     [Digital Twin Engine]
  (Linear Density Interpolation)
                │
                ▼
     [Simulation Matrix]
  (What-If Simulation Engine)
                │
                ▼
    [11 Specialized Agents]
 (Crowd, Transport, Security, etc.)
                │
                ▼
     [Agent Debate Engine]
 (Dynamic Multi-Agent Reasoning)
                │
                ▼
     [Strategy Resolver]
 (Single Coherent Action Plan)
                │
                ▼
      [Mission Control UI]
 (WebSocket Realtime Data Stream)
```

---

## 2. API Specifications

### 2.1 WebSocket Endpoint: `ws://localhost:8000/ws`
Streams full system state updates every 500ms. Accepts input commands:
- `{"type": "nl", "query": "..."}`: Invokes natural language parser.
- `{"type": "scenario", "scenario": "..."}`: Triggers simulation scenario jumps.
- `{"type": "speed", "speed": 5}`: Modifies story simulation speed.
- `{"type": "reset"}`: Restores simulation state to match start.

### 2.2 REST Endpoints
- `GET /api/state`: Fetches the current snapshot of the Digital Twin.
- `POST /api/scenario`: Triggers preset story modes (e.g. `congestion`, `storm`).
- `GET /api/report`: Compiles and returns the post-match executive summary.
