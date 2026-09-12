from app.db import ping_database


def test_health_connected(client, monkeypatch):
    monkeypatch.setattr("app.routers.health.ping_database", lambda: True)
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {
        "status": "ok",
        "service": "praja-suraksha-api",
        "api_version": "v1",
        "database": "connected",
    }


def test_health_degraded(client, monkeypatch):
    monkeypatch.setattr("app.routers.health.ping_database", lambda: False)
    response = client.get("/health")
    body = response.json()
    assert response.status_code == 200
    assert body["status"] == "degraded"
    assert body["database"] == "disconnected"


def test_ping_database_callable():
    assert callable(ping_database)
