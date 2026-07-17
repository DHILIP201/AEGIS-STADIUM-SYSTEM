# AEGIS OS: Autonomous Event Governance System
## FIFA World Cup 2026 Operations & Digital Twin Command Cockpit

AEGIS OS (Autonomous Event Governance System) is a high-fidelity, real-time stadium operations cockpit and digital twin simulator designed to manage a FIFA World Cup 2026 match (USA vs Mexico, 80,500 attendance) at AT&T Stadium.

The platform uses a **Multi-Agent AI reasoning loop** coordinated by an Executive Synthesis Agent to monitor crowd ingress congestion, security alerts, medical queues, weather front drops, and transportation scheduling.

---

## 🏗️ System Architecture

```text
               ┌─────────────────────────────────────┐
               │         Vite + React Client         │
               └──────────────────┬──────────────────┘
                                  │ (WebSocket Protocol)
                                  ▼
               ┌─────────────────────────────────────┐
               │       FastAPI Backend Server        │
               └──────────────────┬──────────────────┘
                                  │
                                  ▼
               ┌─────────────────────────────────────┐
               │    Simulation Orchestration Engine  │
               └──────────────────┬──────────────────┘
                                  │
                                  ▼
               ┌─────────────────────────────────────┐
               │       Digital Twin State Kernel     │
               └─────┬──────┬──────┬──────┬─────┬────┘
                     │      │      │      │     │
       ┌─────────────┼──────┼──────┼──────┼─────┼─────────────┐
       ▼             ▼      ▼      ▼      ▼     ▼             ▼
  Crowd Agent  Transport Security Medical Risk Volunteer Accessibility
       │             │      │      │      │     │             │
       └─────────────┼──────┼──────┼──────┼─────┼─────────────┘
                     │ (Arguments collected & synthesis)
                     ▼
       ┌─────────────────────────────────────┐
       │   Executive Synthesis AI Decision   │
       └──────────────────┬──────────────────┘
                                  │
                                  ▼
       ┌─────────────────────────────────────┐
       │   Operator Hub Audit Log Approved   │
       └─────────────────────────────────────┘
```

---

## 🧠 Multi-Agent Orchestration & Explainable AI

Instead of simple alert rules, AEGIS OS models the stadium operations with specialized AI agents who debate and synthesize actions:

1. **Crowd Agent**: Monitors zone-by-zone ingress rates, predicting Gate B bottlenecks.
2. **Transportation Agent**: Models Metro Line 1 wave arrivals and coordinates train delay gates.
3. **Security Agent**: Monitors AI CCTV camera count scans for crowding and exit pathing threats.
4. **Medical Agent**: Correlates high temperature (39°C) with crowd density to predict heat stress.
5. **Volunteer Agent**: Handles proximity dispatch guides for available stadium hosts.
6. **Executive Synthesis Agent**: Gathers positions from all agents to formulate a composite Action Decision vector, explaining the trade-offs and safety metrics in the decision queue.

---

## ⚡ Main Dashboards & Key Features

* **🚀 Mission Control**: Real-time stadium seating/concourse density heatmaps with a view toggle to switch to the **Stadium Perimeter Map** (monitoring surrounding roads, parking lot fill levels, and drone tracks).
* **🏢 Command Center (MOC)**: Central cockpit featuring 4 live AI CCTV camera feeds scanning fan crowd counts, active incident telemetry grids, and the AI Decision Queue.
* **📱 Smart Fan Companion**: Mock mobile app interface providing contextual FAQs, live gate density checks, and safety advice presets to fans.
* **🔊 AI Voice Briefing**: Tap the global `AI BRIEF` button to hear a browser speech synthesis summary of the current operational state.
* **🎮 Simulation Control Console**: Let presenters jump timelines or trigger scenarios (`Crowd Surge`, `Gate B Bottleneck`, `Storm Hits`, `Full Time`).
* **📥 Export Operations Logs**: Download match telemetry reports in `.txt` format or structured incident event logs in `.json` formatting.
* **🏆 Mission Success Summary**: A final overlay modal that summarizes tournament safety scorecards and incident resolution rates.

---

## ⌨️ Global Keyboard Shortcuts for Presenters

Navigate the live demonstration hands-free using these shortcuts:
* `Space` → Pause / Resume Simulation speed
* `1` → Trigger **Crowd Surge** Ingress state (T=180)
* `2` → Trigger **Gate B Bottleneck** critical state (T=360)
* `3` → Trigger **Storm Incoming** weather warning (T=960)
* `4` → Trigger **Storm Hits** multi-system response (T=1140)
* `5` → Trigger **Full Time** match complete overlay card (T=1800)
* `R` → **Reset** simulation state back to Pre-Match stage

---

## 🛠️ Installation & Setup

### Backend (FastAPI)
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Start the FastAPI server:
   ```bash
   uvicorn main:app --reload --port 8000
   ```

### Frontend (React + Vite)
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite dev server:
   ```bash
   npm run dev
   ```

---

## 🌐 Live Deployments
* **Vercel Frontend Client**: [Live Web Application Link](https://aegis-stadium-system.vercel.app/)
* **Render Backend API**: `https://aegis-backend-a2mv.onrender.com`
