import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_health_check():
    """Verify backend API is accessible"""
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["status"] == "running"
