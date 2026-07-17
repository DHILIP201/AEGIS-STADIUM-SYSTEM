AGENT_DEFINITIONS = {
    "crowd":        {"name": "Crowd Agent",        "color": "#ff3366", "role": "Density prediction, bottleneck detection, rerouting"},
    "transport":    {"name": "Transport Agent",    "color": "#ffb300", "role": "Metro/bus/parking wave prediction"},
    "security":     {"name": "Security Agent",     "color": "#00d4ff", "role": "CCTV anomaly detection, threat scoring"},
    "medical":      {"name": "Medical Agent",      "color": "#ff6b35", "role": "Heat stress, emergencies, ambulance routing"},
    "accessibility":{"name": "Accessibility Agent","color": "#7c3aed", "role": "Wheelchair routes, elevators, blind navigation"},
    "energy":       {"name": "Energy Agent",       "color": "#10b981", "role": "HVAC, lighting, solar optimization"},
    "volunteer":    {"name": "Volunteer Agent",    "color": "#06b6d4", "role": "Assignment, language matching, proximity dispatch"},
    "food":         {"name": "Food Agent",         "color": "#f59e0b", "role": "Inventory redistribution, queue prediction"},
    "language":     {"name": "Language Agent",     "color": "#8b5cf6", "role": "11-language translation, PA announcements"},
    "risk":         {"name": "Risk Agent",         "color": "#ef4444", "role": "Composite risk scoring, emergency planning"},
    "executive":    {"name": "Executive Agent",    "color": "#fbbf24", "role": "Cross-agent synthesis, final decisions"},
}

AGENT_ACCURACY = {
    "crowd": 94.2, "transport": 91.8, "security": 90.1, "medical": 96.0,
    "accessibility": 97.3, "energy": 89.5, "volunteer": 93.1, "food": 84.2,
    "language": 95.0, "risk": 92.8, "executive": 95.7,
}

AGENT_TRUST = {
    "crowd": 94, "transport": 91, "security": 90, "medical": 96,
    "accessibility": 97, "energy": 89, "volunteer": 93, "food": 84,
    "language": 95, "risk": 92, "executive": 96,
}
