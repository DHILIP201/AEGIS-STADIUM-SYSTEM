import time
import math
import os
import urllib.request
import json
from typing import Optional
from simulation.story import STORY_EVENTS
from agents.definitions import AGENT_DEFINITIONS, AGENT_ACCURACY, AGENT_TRUST


try:
    from google import genai
except ImportError:
    genai = None


def call_gemini(prompt: str) -> Optional[str]:
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        return None

    # Use official Google GenAI SDK if installed
    if genai is not None:
        try:
            client = genai.Client(api_key=api_key)
            response = client.models.generate_content(
                model='gemini-2.5-flash',
                contents=prompt
            )
            return response.text
        except Exception as e:
            print(f"Gemini SDK call failed: {e}")
            return None

    # Fallback to standard library REST request if package is not present
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"
    data = {
        "contents": [{"parts": [{"text": prompt}]}]
    }
    req = urllib.request.Request(
        url,
        data=json.dumps(data).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST"
    )
    try:
        with urllib.request.urlopen(req, timeout=8.0) as response:
            res = json.loads(response.read().decode("utf-8"))
            return res["candidates"][0]["content"]["parts"][0]["text"]
    except Exception as e:
        print(f"Gemini API fallback call failed: {e}")
        return None


class SimulationEngine:
    def __init__(self):
        self.story_time: float = 0.0
        self.speed: float = 5.0  # story seconds per real second
        self._events = STORY_EVENTS
        self._blackbox: list = []
        self._confidence_history: list = [{"time": 0, "value": 72, "displayTime": "12:00"}]
        self._nl_response: Optional[str] = None
        self._last_crossed_event_time: float = -1.0
        self._event_entry_real_time: float = time.time()
        self._current_event_id: str = ""
        self._max_story_time: float = 1860.0

    def advance(self, delta_real_seconds: float):
        self.story_time += delta_real_seconds * self.speed
        if self.story_time >= self._max_story_time:
            self.reset()
            return
        # Check for newly crossed events
        current_event = self._get_current_event()
        if current_event["id"] != self._current_event_id:
            self._current_event_id = current_event["id"]
            self._event_entry_real_time = time.time()
            # Log to blackbox
            entry = current_event.get("blackbox_entry")
            if entry:
                display_time = self._story_time_to_display(self.story_time)
                self._blackbox.insert(0, {
                    "time": display_time,
                    "type": entry["type"],
                    "title": entry["title"],
                    "details": entry["details"],
                    "accuracy": entry.get("accuracy"),
                })
                if len(self._blackbox) > 50:
                    self._blackbox = self._blackbox[:50]
            # Add confidence point
            cp = current_event.get("confidence_point")
            if cp:
                self._confidence_history.append({
                    "time": int(self.story_time),
                    "value": cp,
                    "displayTime": self._story_time_to_display(self.story_time)
                })

    def reset(self):
        self.story_time = 0.0
        self._blackbox = []
        self._confidence_history = [{"time": 0, "value": 72, "displayTime": "12:00"}]
        self._nl_response = None
        self._last_crossed_event_time = -1.0
        self._event_entry_real_time = time.time()
        self._current_event_id = ""

    def set_speed(self, speed: float):
        self.speed = max(0.5, min(20.0, speed))

    def jump_to(self, story_seconds: float):
        self.story_time = float(story_seconds)
        self._event_entry_real_time = time.time()

    def _get_current_event(self) -> dict:
        current = self._events[0]
        for event in self._events:
            if event["time"] <= self.story_time:
                current = event
            else:
                break
        return current

    def _get_next_event(self) -> Optional[dict]:
        for event in self._events:
            if event["time"] > self.story_time:
                return event
        return None

    def _story_time_to_display(self, t: float) -> str:
        total_minutes = int(t / 60)
        hour = 12 + total_minutes // 60
        minute = total_minutes % 60
        return f"{hour:02d}:{minute:02d}"

    def _get_risk_label(self, level: int) -> str:
        if level <= 25:
            return "LOW"
        elif level <= 50:
            return "MODERATE"
        elif level <= 70:
            return "ELEVATED"
        elif level <= 85:
            return "HIGH"
        else:
            return "CRITICAL"

    def _get_risk_color(self, level: int) -> str:
        if level <= 25:
            return "#00d4ff"
        elif level <= 50:
            return "#10b981"
        elif level <= 70:
            return "#ffb300"
        elif level <= 85:
            return "#ff6b35"
        else:
            return "#ff3366"

    def _get_match_phase(self, t: float) -> str:
        if t < 600:
            return "Early Game"
        elif t < 1200:
            return "Mid Game"
        elif t < 1500:
            return "Second Half"
        elif t < 1740:
            return "Extra Time"
        else:
            return "Full Time"

    def _lerp(self, a: float, b: float, t: float) -> float:
        return a + (b - a) * max(0.0, min(1.0, t))

    def _get_interpolated_density(self, zone_id: str) -> float:
        cur = self._get_current_event()
        nxt = self._get_next_event()
        cur_density = cur["zone_densities"].get(zone_id, 0.5)
        if nxt is None:
            return cur_density
        nxt_density = nxt["zone_densities"].get(zone_id, cur_density)
        time_span = nxt["time"] - cur["time"]
        if time_span <= 0:
            return cur_density
        t = (self.story_time - cur["time"]) / time_span
        return self._lerp(cur_density, nxt_density, t)

    def _get_interpolated_risk(self) -> int:
        cur = self._get_current_event()
        nxt = self._get_next_event()
        if nxt is None:
            return cur["risk_level"]
        time_span = nxt["time"] - cur["time"]
        if time_span <= 0:
            return cur["risk_level"]
        t = (self.story_time - cur["time"]) / time_span
        return int(self._lerp(cur["risk_level"], nxt["risk_level"], t))

    def _get_interpolated_metric(self, key: str) -> float:
        cur = self._get_current_event()
        nxt = self._get_next_event()
        cur_val = cur["metrics"].get(key, 0)
        if nxt is None:
            return cur_val
        nxt_val = nxt["metrics"].get(key, cur_val)
        time_span = nxt["time"] - cur["time"]
        if time_span <= 0:
            return cur_val
        t = (self.story_time - cur["time"]) / time_span
        return self._lerp(float(cur_val), float(nxt_val), t)

    def _get_debate_state(self, current_event: dict) -> Optional[dict]:
        if not current_event.get("trigger_debate") or not current_event.get("debate"):
            return None
        elapsed = time.time() - self._event_entry_real_time
        debate_def = current_event["debate"]
        all_args = debate_def["arguments"]
        final = debate_def["finalDecision"]
        if elapsed < 3:
            phase = "collecting"
            visible_args = []
            show_final = None
        elif elapsed < 9:
            phase = "debating"
            visible_args = all_args[:1]
            show_final = None
        elif elapsed < 15:
            phase = "debating"
            visible_args = all_args[:2]
            show_final = None
        elif elapsed < 21:
            phase = "debating"
            visible_args = all_args[:3]
            show_final = None
        elif elapsed < 27:
            phase = "debating"
            visible_args = all_args
            show_final = None
        elif elapsed < 33:
            phase = "deciding"
            visible_args = all_args
            show_final = None
        else:
            phase = "decided"
            visible_args = all_args
            show_final = final
        return {
            "topic": debate_def["topic"],
            "phase": phase,
            "arguments": visible_args,
            "finalDecision": show_final,
        }

    def _get_scorecard_trend(self, key: str, current_event: dict) -> str:
        cur_score = current_event["scorecards"].get(key, 80)
        cur_idx = self._events.index(current_event)
        if cur_idx == 0:
            return "stable"
        prev_score = self._events[cur_idx - 1]["scorecards"].get(key, 80)
        if cur_score > prev_score + 3:
            return "up"
        elif cur_score < prev_score - 3:
            return "down"
        return "stable"

    def _get_scorecard_color(self, score: int) -> str:
        if score >= 90:
            return "#10b981"
        elif score >= 75:
            return "#ffb300"
        else:
            return "#ff3366"

    def get_state(self) -> dict:
        current_event = self._get_current_event()
        next_event = self._get_next_event()

        # Zone layout
        zone_layout = {
            "north_gate_a":   {"name": "North Gate A",  "capacity": 10000, "x": 0.5,  "y": 0.05},
            "south_gate_b":   {"name": "South Gate B",  "capacity": 10000, "x": 0.5,  "y": 0.95},
            "east_gate_c":    {"name": "East Gate C",   "capacity": 10000, "x": 0.95, "y": 0.5},
            "west_gate_d":    {"name": "West Gate D",   "capacity": 10000, "x": 0.05, "y": 0.5},
            "field_level":    {"name": "Field Level",   "capacity": 15000, "x": 0.5,  "y": 0.48},
            "lower_bowl":     {"name": "Lower Bowl",    "capacity": 15000, "x": 0.5,  "y": 0.35},
            "upper_bowl":     {"name": "Upper Bowl",    "capacity": 15000, "x": 0.5,  "y": 0.22},
            "concourse_main": {"name": "Main Concourse","capacity": 5000,  "x": 0.5,  "y": 0.65},
        }

        zones = []
        total_current = 0
        for zone_id, layout in zone_layout.items():
            density = round(self._get_interpolated_density(zone_id), 3)
            current = int(density * layout["capacity"])
            total_current += current
            risk = current_event["zone_risks"].get(zone_id, "safe")
            zones.append({
                "id": zone_id,
                "name": layout["name"],
                "capacity": layout["capacity"],
                "current": current,
                "density": density,
                "risk": risk,
                "x": layout["x"],
                "y": layout["y"],
            })

        # Interpolate risk
        risk_level = self._get_interpolated_risk()

        # Build agents
        agent_states_raw = current_event["agent_states"]
        agents = []
        for agent_id, definition in AGENT_DEFINITIONS.items():
            raw = agent_states_raw.get(
                agent_id,
                {"status": "monitoring", "thinking": "Monitoring all systems.", "confidence": 80}
            )
            # Calculate organic, dynamic confidence variance based on simulated state fluctuation
            dynamic_conf = raw["confidence"]
            if raw["status"] != "idle":
                # Fluctuates +/- 2% over time based on wave functions
                variation = int(math.sin(self.story_time * 0.05 + len(agent_id)) * 2.5)
                dynamic_conf = max(55, min(99, raw["confidence"] + variation))

            agents.append({
                "id": agent_id,
                "name": definition["name"],
                "color": definition["color"],
                "status": raw["status"],
                "thinking": raw["thinking"],
                "confidence": dynamic_conf,
                "accuracy": AGENT_ACCURACY[agent_id],
                "trust": AGENT_TRUST[agent_id],
            })

        # Build timeline
        timeline = []
        for event in self._events:
            if event["time"] < self.story_time - 1:
                status = "past"
            elif event["id"] == current_event["id"]:
                status = "current"
            else:
                status = "future"
            timeline.append({
                "id": event["id"],
                "storyTime": event["time"],
                "displayTime": self._story_time_to_display(event["time"]),
                "title": event["title"],
                "description": event["description"],
                "type": event["type"],
                "status": status,
            })

        # Scorecards
        scorecard_keys = [
            ("crowd_safety",       "Crowd Safety"),
            ("transportation",     "Transportation"),
            ("medical_readiness",  "Medical"),
            ("accessibility",      "Accessibility"),
            ("energy_efficiency",  "Energy"),
            ("overall",            "Overall"),
        ]
        scorecards = []
        for key, label in scorecard_keys:
            score = current_event["scorecards"].get(key, 80)
            scorecards.append({
                "category": label,
                "score": score,
                "trend": self._get_scorecard_trend(key, current_event),
                "color": self._get_scorecard_color(score),
            })

        # Metrics (interpolated)
        metrics = {
            "occupancy":          int(self._get_interpolated_metric("occupancy")),
            "temperature":        int(self._get_interpolated_metric("temperature")),
            "energyMW":           round(self._get_interpolated_metric("energy_mw"), 1),
            "volunteersDeployed": int(self._get_interpolated_metric("volunteers_deployed")),
            "medicalAlerts":      int(self._get_interpolated_metric("medical_alerts")),
            "transportDelayMin":  int(self._get_interpolated_metric("transport_delay_min")),
        }

        # Event causal graph
        if self.story_time >= 960:
            event_graph = [
                {"id": "rain",               "label": "Heavy Rain",              "type": "cause"},
                {"id": "crowd_inside",       "label": "Fans Seek Shelter",       "type": "effect"},
                {"id": "transport_surge",    "label": "Transport Surge",         "type": "effect"},
                {"id": "medical_risk",       "label": "Medical Risk ↑",          "type": "risk"},
                {"id": "energy_spike",       "label": "Energy Spike",            "type": "effect"},
                {"id": "volunteer_dispatch", "label": "Volunteers Dispatched",   "type": "action"},
                {"id": "resolved",           "label": "Situation Resolved",      "type": "outcome"},
            ]
        else:
            event_graph = [
                {"id": "crowd_surge",       "label": "Fan Arrival Surge",       "type": "cause"},
                {"id": "gate_b_density",    "label": "Gate B Density ↑",        "type": "effect"},
                {"id": "security_risk",     "label": "Security Risk ↑",         "type": "risk"},
                {"id": "heat_risk",         "label": "Heat Stress Risk",         "type": "risk"},
                {"id": "volunteer_redirect","label": "Volunteers Redirect",      "type": "action"},
                {"id": "gate_d_open",       "label": "Gate D Opens",             "type": "action"},
                {"id": "density_drop",      "label": "Density Drops 33%",       "type": "outcome"},
            ]

        # Report text (only at end)
        report_text = None
        if self.story_time >= 1800:
            report_text = self.generate_report()

        nl_response = self._nl_response
        self._nl_response = None  # consume

        return {
            "storyTime":       int(self.story_time),
            "displayTime":     self._story_time_to_display(self.story_time),
            "matchPhase":      self._get_match_phase(self.story_time),
            "riskLevel":       risk_level,
            "riskLabel":       self._get_risk_label(risk_level),
            "riskColor":       self._get_risk_color(risk_level),
            "stadium": {
                "name":             "AT&T Stadium, Arlington TX",
                "totalCapacity":    80000,
                "currentOccupancy": total_current,
                "zones":            zones,
            },
            "agents":            agents,
            "timeline":          timeline,
            "debate":            self._get_debate_state(current_event),
            "recommendations":   current_event.get("recommendations", []),
            "scorecards":        scorecards,
            "blackbox":          self._blackbox[:20],
            "confidenceHistory": self._confidence_history,
            "metrics":           metrics,
            "successMetrics":    current_event.get("success_metrics"),
            "eventGraph":        event_graph,
            "currentEventId":    current_event["id"],
            "nlResponse":        nl_response,
            "reportText":        report_text,
            "storyProgress":     round(self.story_time / self._max_story_time, 3),
        }

    def handle_nl(self, query: str) -> str:
        api_key = os.environ.get("GEMINI_API_KEY")
        fallback_msg = "" if api_key else "⚠️ [Gemini offline. Using local Digital Twin fallback reasoning]\n\n"

        # Attempt actual Gemini API call if key is set
        gemini_res = call_gemini(
            f"You are the AEGIS OS Stadium Operating System Brain. "
            f"The operator asks: '{query}'. "
            f"Formulate a concise, professional, monospace-style tactical action report (max 100 words)."
        )
        if gemini_res:
            return f"🤖 [Gemini 2.5 Flash]:\n\n{gemini_res}"

        q = query.lower()
        if any(w in q for w in ["rain", "storm", "weather"]):
            raw_res = (
                "🌩 Storm Impact Simulation:\n\n"
                "Rain arrival in 12 minutes would trigger:\n"
                "• Concourse density: +45% as fans seek shelter\n"
                "• Transport demand: +340% exit requests\n"
                "• Medical risk: +28% (slip-falls, hypothermia)\n"
                "• Energy demand: +35% (HVAC boost needed)\n"
                "• Indoor food demand: +65%\n\n"
                "AEGIS would automatically:\n"
                "✓ Open emergency shelter zones (capacity: 22,000)\n"
                "✓ Activate 6 additional Metro trains\n"
                "✓ Deploy 23 volunteers to concourse management\n"
                "✓ Boost HVAC by 35%\n"
                "✓ Broadcast storm guidance in 11 languages\n\n"
                "Estimated outcome: All fans sheltered within 11 minutes. Zero serious incidents."
            )
        elif "energy" in q and any(w in q for w in ["20", "reduc", "cut", "lower"]):
            raw_res = (
                "⚡ Energy Reduction Plan — 20% Target:\n\n"
                "Current: 2.4 MW\n"
                "Target: 1.92 MW (savings: 0.48 MW)\n\n"
                "Actions:\n"
                "✓ Dim non-critical lighting 30% → saves 0.18 MW\n"
                "✓ Reduce HVAC in 4 inactive areas → saves 0.14 MW\n"
                "✓ Power down 8 secondary display screens → saves 0.06 MW\n"
                "✓ Activate solar peak mode → saves 0.10 MW\n\n"
                "Total: 0.48 MW (20.0% reduction)\n"
                "Fan impact: None detected"
            )
        elif "gate c" in q and any(w in q for w in ["volunteer", "move", "send", "deploy"]):
            raw_res = (
                "👥 Volunteer Assignment: Gate C\n\n"
                "Identifying nearest available volunteers...\n\n"
                "Found: 6 volunteers within 180m of Gate C\n"
                "• Maria Santos — 120m — Spanish/English ✓\n"
                "• Ahmed Al-Rashid — 145m — Arabic/French ✓\n"
                "• Sarah Chen — 162m — Mandarin/English ✓\n"
                "• Carlos Rivera — 171m — Spanish/Portuguese ✓\n"
                "• Fatima Hassan — 178m — Arabic/English ✓\n"
                "• James Park — 180m — Korean/English ✓\n\n"
                "Assignments sent. ETA: 1.8 min average.\n"
                "Languages covered: EN, ES, AR, FR, PT, ZH, KO"
            )
        elif any(w in q for w in ["why", "close gate", "gate b"]) and any(w in q for w in ["close", "shut", "why not", "why didn"]):
            raw_res = (
                "❓ Why Not Close Gate B?\n\n"
                "Closing Gate B would trigger:\n"
                "• Gate D density: +27% (from 41% to 68%)\n"
                "• Metro exit congestion: +19% (4,200 fans arriving)\n"
                "• Medical access time: +4 minutes (longer corridors)\n"
                "• Accessibility impact: 3 wheelchair users affected\n\n"
                "Alternative selected:\n"
                "✓ Open Gate D (59% spare capacity)\n"
                "✓ Partial single-file at Gate B (reduces inflow 60%)\n"
                "✓ 14 volunteers redirect crowd\n\n"
                "This achieves 94.3% of safety benefit with zero fan impact.\n"
                "Confidence: 94.3% (based on 142 simulated data vectors)"
            )
        elif any(w in q for w in ["report", "summary", "executive"]):
            raw_res = self.generate_report()
        else:
            raw_res = (
                f"🤖 AEGIS Analysis: \"{query}\"\n\n"
                "Processing across 11 agents...\n\n"
                "Risk Agent: No immediate risk increase detected.\n"
                "Executive Agent: Query noted. Monitoring relevant subsystems.\n\n"
                "Try:\n"
                "• \"What if rain starts in 12 minutes?\"\n"
                "• \"Can we reduce energy by 20%?\"\n"
                "• \"Move volunteers to Gate C\"\n"
                "• \"Why didn't you close Gate B?\"\n"
                "• \"Generate executive report\""
            )
        return fallback_msg + raw_res

    def apply_scenario(self, scenario: str):
        s = scenario.lower()
        if s in ["sunny", "start", "reset", "begin"]:
            self.reset()
        elif s in ["surge"]:
            self.jump_to(180)
        elif s in ["congestion", "gate", "gate_b", "debate"]:
            self.jump_to(360)
        elif s in ["executive", "executing", "action"]:
            self.jump_to(540)
        elif s in ["resolved", "outcome"]:
            self.jump_to(720)
        elif s in ["weather", "incoming", "forecast"]:
            self.jump_to(960)
        elif s in ["storm", "rain", "hits", "lightning", "power", "fire", "emergency"]:
            self.jump_to(1140)
        elif s in ["stabilizing", "clearing"]:
            self.jump_to(1440)
        elif s in ["report", "end", "finish", "fulltime"]:
            self.jump_to(1800)

    def generate_report(self) -> str:
        return (
            "═══════════════════════════════════════════════════\n"
            "    AEGIS OS — EXECUTIVE MATCH REPORT\n"
            "    AT&T Stadium, Arlington TX\n"
            "    USA vs. Mexico | FIFA World Cup 2026\n"
            "    Generated: 22:47 UTC | Duration: 97 minutes\n"
            "═══════════════════════════════════════════════════\n\n"
            "EXECUTIVE SUMMARY\n"
            "─────────────────\n"
            "AEGIS OS successfully managed 80,500 spectators across\n"
            "a 97-minute event. 2 major incidents predicted and\n"
            "prevented. 3 minor medical incidents managed with zero\n"
            "hospitalizations. Overall safety score: 94/100.\n\n"
            "INCIDENT LOG\n"
            "────────────\n"
            "01. Gate B Congestion [12:07] — PREVENTED\n"
            "    Prediction: 94% confidence, 7 min advance warning\n"
            "    Action: Gate D + 14 volunteers + signage + Metro\n"
            "    Outcome: 91% → 58% in 8 min (predicted: 9 min)\n"
            "    Accuracy: 94.3% | Fan impact: Zero\n\n"
            "02. Storm Response [12:25] — MANAGED\n"
            "    Prediction: 88% confidence, 12 min advance warning\n"
            "    Action: 7 simultaneous multi-system interventions\n"
            "    Outcome: 80,500 fans sheltered within 11 min\n"
            "    Incidents: 3 minor (all treated) | Hospitalizations: 0\n"
            "    Accuracy: 94%\n\n"
            "PREDICTION ACCURACY\n"
            "───────────────────\n"
            "Total Predictions:  14\n"
            "Correct (>80% acc): 13  (92.8%)\n"
            "Avg Confidence:     92.4%\n"
            "Avg Accuracy:       94.2%\n\n"
            "AGENT PERFORMANCE\n"
            "─────────────────\n"
            "Crowd Agent:     94.2% accuracy — congestion prevented\n"
            "Transport Agent: 91.8% accuracy — 4,200 fan bottleneck saved\n"
            "Security Agent:  90.1% accuracy — zero security incidents\n"
            "Medical Agent:   96.0% accuracy — zero hospitalizations\n"
            "Accessibility:   97.3% accuracy — zero complaints\n"
            "Energy Agent:    89.5% accuracy — 340 kWh saved\n"
            "Volunteer Agent: 93.1% accuracy — 37 assignments\n"
            "Food Agent:      84.2% accuracy — 8.2% waste (below 10% target)\n"
            "Language Agent:  95.0% accuracy — 11 languages served\n"
            "Risk Agent:      92.8% accuracy — zero false critical alerts\n"
            "Executive Agent: 95.7% accuracy — 12 executive decisions\n\n"
            "KEY METRICS\n"
            "───────────\n"
            "Peak Occupancy:     80,500\n"
            "Medical Incidents:  3 (all minor, zero hospital transfers)\n"
            "Security Incidents: 0\n"
            "Max Transport Wait: 11 minutes\n"
            "Energy Saved:       340 kWh vs baseline\n"
            "Food Waste:         8.2% (target <10%) ✓\n"
            "Fan Satisfaction:   92/100\n\n"
            "LESSONS LEARNED\n"
            "───────────────\n"
            "1. Gate C IoT sensor: 90-second data lag detected.\n"
            "   → Replace sensor array before next match.\n\n"
            "2. Food Zone B restocking: 15 min late during storm.\n"
            "   → Pre-position emergency stock on-site.\n\n"
            "3. Metro Line 2 response: 4 min (target 2 min).\n"
            "   → Establish direct AEGIS-Metro API link.\n\n"
            "NEXT MATCH PREPARATION\n"
            "───────────────────────\n"
            "• Pre-position 4 medics at outdoor zones\n"
            "• Gate C sensor replacement scheduled\n"
            "• AI memory updated with storm + gate surge patterns\n\n"
            "AEGIS OS v2.0 — Autonomous Event Governance & Intelligence System\n"
            "\"Problems prevented before spectators ever notice them.\"\n"
            "═══════════════════════════════════════════════════"
        )
