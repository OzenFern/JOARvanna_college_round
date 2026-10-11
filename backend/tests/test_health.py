from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["service"] == "agentbreak-backend"

def test_api_v1_health():
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["storage"]["blocklist_exists"] is True

def test_frontend_origin_is_allowed_for_api_requests():
    response = client.options(
        "/api/v1/health",
        headers={
            "Origin": "https://joarvanna-college-round.vercel.app",
            "Access-Control-Request-Method": "GET",
        },
    )
    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == (
        "https://joarvanna-college-round.vercel.app"
    )
