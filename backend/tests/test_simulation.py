import pytest
from simulation.story import STORY_EVENTS

def test_simulation_events():
    """Verify simulation events are properly configured"""
    assert len(STORY_EVENTS) > 0, "Simulation must have events"
    
    first_event = STORY_EVENTS[0]
    assert "id" in first_event
    assert "time" in first_event
    assert "type" in first_event
    
    # Ensure sequential timing
    for i in range(1, len(STORY_EVENTS)):
        assert STORY_EVENTS[i]["time"] >= STORY_EVENTS[i-1]["time"], "Events must be chronologically ordered"
