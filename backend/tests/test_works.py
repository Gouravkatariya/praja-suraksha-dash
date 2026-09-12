def test_list_works_pagination(client):
    response = client.get("/api/v1/works", params={"page": 1, "page_size": 2})
    assert response.status_code == 200
    body = response.json()
    assert body["pagination"] == {"page": 1, "page_size": 2, "total": 3, "total_pages": 2}
    assert len(body["data"]) == 2
    first = body["data"][0]
    assert first["work_id"] == 1
    assert first["unique_work_number"] == "WS/MP455/2023-2024/54540"
    assert first["allocation_amount"] == 990000.0
    assert first["data_quality"]["score"] == 60.0
    assert first["data_quality"]["is_risk_score"] is False
    assert "sanction_date" not in first
    assert first["priority"]["flag_count"] == 0
    assert first["real_risk_types"] == []


def test_list_works_has_risk_flag(client):
    flagged = client.get("/api/v1/works", params={"has_risk_flag": True})
    assert {item["work_id"] for item in flagged.json()["data"]} == {100, 2835}

    clean = client.get("/api/v1/works", params={"has_risk_flag": False})
    assert {item["work_id"] for item in clean.json()["data"]} == {1}


def test_list_works_search(client):
    response = client.get("/api/v1/works", params={"q": "New Building"})
    assert response.status_code == 200
    assert response.json()["pagination"]["total"] == 1
    assert response.json()["data"][0]["work_id"] == 1


def test_work_detail_omits_ground_truth(client):
    response = client.get("api/v1/works/2835")
    assert response.status_code == 200
    body = response.json()
    assert "is_synthetic_anomaly" not in body
    assert "anomaly_type" not in body
    assert body["priority"]["highest_risk_level"] == "HIGH"
    assert body["real_risk_types"] == ["STUCK_IN_LIMBO"]
    assert body["field_origins"]["sanction_date"] == "SYNTHETIC_EXECUTION"
    assert len(body["risk_flags"]) == 1


def test_work_not_found(client):
    response = client.get("/api/v1/works/999999")
    assert response.status_code == 404
    assert response.json() == {
        "error": "not_found",
        "message": "Work not found",
        "work_id": 999999,
    }


def test_invalid_page_size(client):
    response = client.get("/api/v1/works", params={"page_size": 201})
    assert response.status_code == 422
    assert response.json()["error"] == "validation_error"


def test_risk_flags_list_and_origin_filter(client):
    all_flags = client.get("/api/v1/risk-flags")
    assert all_flags.json()["pagination"]["total"] == 2

    synthetic = client.get("/api/v1/risk-flags", params={"signal_origin": "SYNTHETIC_VALIDATION"})
    data = synthetic.json()["data"]
    assert len(data) == 1
    assert data[0]["risk_type"] == "COST_OVERRUN"
    assert data[0]["risk_level"] == "HIGH"
    assert data[0]["signal_origin"] == "SYNTHETIC_VALIDATION"
    assert data[0]["requires_human_verification"] is True
    assert "fraud" not in data[0]["evidence"][0]["explanation"].lower() or "not a real" in data[0]["evidence"][0]["explanation"].lower()


def test_risk_flags_for_work(client):
    response = client.get("/api/v1/risk-flags/2835")
    assert response.status_code == 200
    body = response.json()
    assert body["work_id"] == 2835
    assert body["requires_human_verification"] is True
    assert "do not declare fraud" in body["disclaimer"]
    flag = body["risk_flags"][0]
    assert flag["risk_type"] == "STUCK_IN_LIMBO"
    assert flag["risk_flag"] == "HIGH_RISK"
    assert flag["risk_level"] == "HIGH"
    assert flag["signal_origin"] == "REAL_MPLADS_RULE"
    assert flag["rule"]["threshold_days"] == 194
    assert flag["evidence"][0]["value"] == 199
    assert body["work"]["priority"]["flag_count"] == 1


def test_risk_flags_missing_work(client):
    response = client.get("/api/v1/risk-flags/999999")
    assert response.status_code == 404
    assert response.json()["error"] == "not_found"


def test_risk_level_filter(client):
    response = client.get("/api/v1/risk-flags", params={"risk_level": "HIGH"})
    assert response.json()["pagination"]["total"] == 2
