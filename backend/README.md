# Praja Suraksha FastAPI backend (SIH26102)

P0 API for the frozen PostgreSQL schema (`works`, `risk_flags`). This folder is the only backend surface; it does not change the React app.

## What you need before start

1. PostgreSQL with database `mplads_risk_db` already loaded (schema freeze: ~56,138 `works`, ~21,146 `risk_flags`).
2. Python 3.11+ recommended.
3. Copy env and set the real DB password:

```powershell
cd praja-suraksha-dash\backend
copy .env.example .env
```

Edit `.env` — `DATABASE_PASSWORD` (or set `DATABASE_URL`). Do not commit `.env`.

## Install and run

```powershell
cd praja-suraksha-dash\backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

Frontend default ping: `GET http://127.0.0.1:8000/health`  
OpenAPI docs: http://127.0.0.1:8000/docs

## P0 endpoints

| Method | Path | Notes |
|---|---|---|
| GET | `/health` | `status` ok/degraded + `database` connected/disconnected |
| GET | `/api/v1/works` | filters + pagination |
| GET | `/api/v1/works/{work_id}` | 404 if missing; no ground-truth anomaly fields |
| GET | `/api/v1/risk-flags` | filters include `risk_level`, `signal_origin` |
| GET | `/api/v1/risk-flags/{work_id}` | flags for a **work**, not `risk_flags.id` |

Works list query: `page`, `page_size` (max 200), `state`, `category`, `status`, `ida_approval`, `constituency`, `house`, `q`, `has_risk_flag`.

Risk-flag query: `page`, `page_size`, `work_id`, `risk_type`, `risk_flag`, `risk_level` (`LOW`/`MEDIUM`/`HIGH`/`UNKNOWN`), `signal_origin` (`REAL_MPLADS_RULE`/`SYNTHETIC_VALIDATION`).

## Tests (no live Postgres required)

```powershell
pip install -r requirements-dev.txt
pytest
```

## Out of P0 (not implemented, by contract)

Dashboard rollups, fused 0–100 risk score, duplicates, map lat/lng, verification POST, `raw_mplads` as an API resource.
