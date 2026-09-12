# PHASE 0.5 — Database Schema Verification & API Contract Freeze

**Product:** Praja Suraksha / Devotion — SIH26102  
**Layer:** PostgreSQL → FastAPI → existing React frontend  
**Status:** CONTRACT FROZEN — awaiting approval before backend implementation  
**Source of truth for schema:** `MPLADS_Backend_Schema_Freeze_Document (1).pdf` (`information_schema` inspection)  
**Supporting:** DQ verification PDF, full process/verification PDF, Devotion initial blueprint, existing frontend documentation

---

## 1. Verified Database Schema Summary

Inspection queries were read-only. No FK row appeared in the supplied constraint output.

### 1.1 `works` (analytical population)

| Column | PostgreSQL type | Nullable | Default / notes |
|---|---|---|---|
| `work_id` | `integer` | NO | `nextval('works_work_id_seq')` — **PRIMARY KEY** |
| `mp_name` | `varchar(150)` | YES | Real MPLADS |
| `unique_work_number` | `varchar(100)` | YES | Parsed from raw `WORK` when `WS/%` |
| `work_description` | `text` | YES | Real MPLADS |
| `category` | `varchar(50)` | YES | Real MPLADS |
| `state` | `varchar(100)` | YES | Real MPLADS |
| `constituency` | `varchar(150)` | YES | Real MPLADS |
| `ida` | `varchar(200)` | YES | Implementing District Authority, **not** a contractor/agency name |
| `city` | `varchar(150)` | YES | Geography; many NULLs |
| `ward` | `text` | YES | Freeze doc type is **text** (planned DDL had `varchar(100)`; freeze wins) |
| `block` | `varchar(150)` | YES | |
| `village` | `varchar(150)` | YES | |
| `recommended_date` | `date` | YES | Real MPLADS |
| `allocation_amount` | `numeric` | YES | Real MPLADS |
| `ida_approval` | `varchar(50)` | YES | e.g. `Action Pending`, `Approved by IDA` |
| `status` | `varchar(30)` | YES | e.g. `Unsanctioned`, `Sanctioned`, `Completed`, `Ongoing` |
| `house` | `varchar(20)` | YES | `Lok Sabha` / Rajya Sabha |
| `sanction_date` | `date` | YES | **SYNTHETIC execution layer** |
| `expected_completion_date` | `date` | YES | **SYNTHETIC** (`sanction_date + 365` where populated) |
| `actual_completion_date` | `date` | YES | **SYNTHETIC** |
| `actual_expenditure` | `numeric` | YES | **SYNTHETIC** |
| `is_synthetic_anomaly` | `boolean` | YES | default `false` — **validation ground truth, not a detector input** |
| `anomaly_type` | `varchar(50)` | YES | Ground truth label only |
| `data_quality_score` | `numeric` | YES | **CONFIRMED populated** completeness score |

**`data_quality_score` — CONFIRMED**

- Exists on `works`.
- Sample values: 40.00, 60.00.
- Formula (already computed in DB; do not recalculate in API): 20 points each for non-NULL `city`, `ward`, `block`, `village`, `unique_work_number` → range **0–100 in steps of 20**.
- Verified: `UPDATE 56138`; avg **46.60**.
- **Not** a risk / fraud / anomaly score. Never mix into a risk score.

**Not in `works` (do not expose as live DB fields)**

- `district` — **NOT IN SCHEMA** (nearest real field: `constituency`)
- `implementing_agency` — **NOT IN SCHEMA**
- `physical_progress` — **NOT IN SCHEMA**
- `latitude` / `longitude` — **NOT IN CONFIRMED SCHEMA**
- `image_uploaded` — planned in blueprint; **NOT IN CONFIRMED SCHEMA**
- `overall_risk`, `confidence`, fused 0–100 score — tables `risk_assessments` / `risk_signals` are **planned, not built**

### 1.2 `risk_flags`

| Column | PostgreSQL type | Nullable | Default / notes |
|---|---|---|---|
| `id` | `bigint` | NO | `nextval('risk_flags_id_seq')` — **PRIMARY KEY** |
| `work_id` | `bigint` | NO | Association to `works.work_id` (see type mismatch below) |
| `risk_type` | `varchar(50)` | NO | Detector name |
| `risk_flag` | `varchar(50)` | YES | Stored severity string |
| `days_pending` | `integer` | YES | Evidence for pending-age rules |
| `recommended_date` | `date` | YES | Copied evidence |
| `status` | `varchar(100)` | YES | Copied evidence |
| `ida_approval` | `varchar(100)` | YES | Copied evidence |
| `detected_on` | `date` | NO | Sample values are `2024-04-01` |

**Stored `risk_type` / `risk_flag` counts (full process report)**

| `risk_type` | `risk_flag` | Rows | Origin |
|---|---|---|---|
| `COST_OUTLIER` | `LOW_RISK` | 369 | REAL MPLADS RULE |
| `COST_OUTLIER` | `MEDIUM_RISK` | 29 | REAL MPLADS RULE |
| `IDA_PENDING` | `MEDIUM_RISK` | 8,647 | REAL MPLADS RULE |
| `STUCK_IN_LIMBO` | `HIGH_RISK` | 11,530 | REAL MPLADS RULE |
| `COST_OVERRUN` | `HIGH` | 455 | SYNTHETIC VALIDATION |
| `DELAY` | `HIGH` | 116 | SYNTHETIC VALIDATION |

Total displayed rows: **21,146**.  
Severity strings are **inconsistent** (`HIGH_RISK` vs `HIGH`). API must pass through `risk_flag` unchanged and add a normalized `risk_level`.

**Not stored on `risk_flags`:** IQR Q1/Q3/fence, peer group size, 0–100 score, confidence, six-signal weights, evidence JSON, `CRITICAL`.

### 1.3 `raw_mplads` (staging only — not a P0 API resource)

All columns `text`, nullable: `mp_name`, `work`, `category`, `state`, `constituency`, `ida`, `city`, `ward`, `block`, `village`, `recommended_date`, `allocation_amount`, `ida_approval`, `status`, `house`.  
No primary key in the freeze document. Dates/amounts are text; typed copies live on `works`.

### 1.4 Confirmed field groups

| Group | Confirmed columns |
|---|---|
| Primary keys | `works.work_id` (integer); `risk_flags.id` (bigint) |
| Risk-related | `risk_flags.*`; works `is_synthetic_anomaly`, `anomaly_type` (internal); **not** `data_quality_score` |
| Geography | `state`, `constituency`, `city`, `ward`, `block`, `village` |
| Status | `works.ida_approval`, `works.status`, `works.house`; copies on `risk_flags` |
| Financial | **Real:** `allocation_amount`. **Synthetic:** `actual_expenditure` |
| Traceability / DQ | `city`, `ward`, `block`, `village`, `unique_work_number`, `data_quality_score` |
| Identity | `work_id`, `mp_name`, `unique_work_number`, `work_description`, `category`, `ida` |

---

## 2. Canonical Field Mapping

**Rule:** Frontend codes against **API JSON names**. Backend maps API names ↔ **exact DB columns**. Do not invent DB columns to match mock UI.

| Frontend concept (mock / docs) | Database column | Table | Frozen API field | Notes |
|---|---|---|---|---|
| Work ID (`MP-10000` string) | `work_id` | `works` | `work_id` | **integer**, not `MP-*` |
| Work number | `unique_work_number` | `works` | `unique_work_number` | nullable |
| Work name / description | `work_description` | `works` | `work_description` | |
| IDA status | `ida_approval` | `works` | `ida_approval` | Do **not** name the API field `ida_status` |
| Sanction status | `status` | `works` | `status` | Do **not** name it `sanction_status` |
| Allocation amount | `allocation_amount` | `works` | `allocation_amount` | real |
| Recommended date | `recommended_date` | `works` | `recommended_date` | `YYYY-MM-DD` |
| Data quality % (generated mock) | `data_quality_score` | `works` | `data_quality_score` | separate object; never fused |
| District | — | — | **not in P0** | use `constituency` |
| Constituency | `constituency` | `works` | `constituency` | |
| Implementing agency | — | — | **not in P0** | `ida` is IDA, not contractor |
| IDA / district authority | `ida` | `works` | `ida` | |
| State | `state` | `works` | `state` | |
| City / ward / block / village | same names | `works` | same | |
| Category / work type | `category` | `works` | `category` | |
| MP name | `mp_name` | `works` | `mp_name` | |
| House | `house` | `works` | `house` | |
| Actual expenditure / financial progress | `actual_expenditure` | `works` | `actual_expenditure` | **synthetic**; label origin |
| Physical progress | — | — | **not in P0** | |
| Sanction date | `sanction_date` | `works` | `sanction_date` | synthetic |
| Expected / actual completion | `expected_completion_date`, `actual_completion_date` | `works` | same | synthetic |
| Coordinates | — | — | **not in P0** | |
| Photo verification | — | — | **not in P0** | |
| Risk type | `risk_type` | `risk_flags` | `risk_type` | |
| Risk tier / severity | `risk_flag` | `risk_flags` | `risk_flag` + `risk_level` | |
| Pending days | `days_pending` | `risk_flags` | `days_pending` | |
| Detection date | `detected_on` | `risk_flags` | `detected_on` | |
| Overall 0–100 risk score | — | — | **not in P0** | no `risk_assessments` table |
| Six-signal radar | — | — | **not in P0 live** | SIMULATION only |
| Confidence % | — | — | **not in P0** | |
| Duplicate pair / similarity | — | — | **not in P0** | exact-row dedup already applied in staging |
| Ground-truth anomaly | `is_synthetic_anomaly`, `anomaly_type` | `works` | **omitted from P0 public JSON** | must not feed detectors or UI as “why flagged” |

**Normalized `risk_level` (API-only, derived from stored `risk_flag`)**

| Stored `risk_flag` | API `risk_level` |
|---|---|
| `LOW_RISK` | `LOW` |
| `MEDIUM_RISK` | `MEDIUM` |
| `HIGH_RISK` | `HIGH` |
| `HIGH` | `HIGH` |
| anything else | `UNKNOWN` |

No `CRITICAL` exists in the database.

---

## 3. Database Relationships

```
raw_mplads  (staging, 60,359 text rows)
     │  ETL / DISTINCT
     ▼
works.work_id  INTEGER PK     56,138 rows
     │
     │  association (logical)
     │  risk_flags.work_id BIGINT  — FK CONSTRAINT NOT SHOWN
     ▼
risk_flags.id  BIGINT PK      21,146 rows
```

- One work → many flags (`work_id` + `risk_type` is the logical uniqueness; synthetic types were checked for duplicate pairs).
- IDA_PENDING ∩ STUCK_IN_LIMBO = **6,030** works (independent real rules).
- COST_OVERRUN ∩ DELAY = **0** in final synthetic set.
- Type mismatch: `works.work_id` integer vs `risk_flags.work_id` bigint. Join still used in verification; backend should join on equality and return `work_id` as JSON number.

**P0 must not query** planned tables: `risk_assessments`, `risk_signals`, `verification_actions`.

---

## 4. Final P0 API Contracts

Base URL (frontend already defaults): `http://127.0.0.1:8000`  
Version prefix for resources: `/api/v1`  
Health (matches existing UI ping): `GET /health`

**Global rules**

- JSON keys: **snake_case**, frozen.
- Dates: `YYYY-MM-DD` or `null`.
- Numerics: JSON numbers or `null` (not strings).
- `requires_human_verification`: always `true` on every flag.
- Never return `"fraud_detected"` or equivalent.
- `data_quality` and risk are **sibling objects**, never one blended score.
- Pagination required on list endpoints (`page` default 1, `page_size` default 50, max 200).
- Adding optional fields later is allowed; renaming P0 fields is a breaking change (`/api/v2`).

### 4.1 `GET /health`

**Response 200**

| Field | Type | Meaning |
|---|---|---|
| `status` | `"ok"` \| `"degraded"` | process up |
| `service` | string | `"praja-suraksha-api"` |
| `api_version` | string | `"v1"` |
| `database` | `"connected"` \| `"disconnected"` | |

### 4.2 `GET /api/v1/works`

**Query:** `page`, `page_size`, `state`, `category`, `status`, `ida_approval`, `constituency`, `house`, `q` (ILIKE on `unique_work_number` or `work_description`), `has_risk_flag` (`true`/`false`).

Unsupported (no column): `district`, `implementing_agency`, `risk_tier` as frontend Critical/High mock, `min_risk_score`.

**Response 200:** `{ data: WorkListItem[], pagination }`

**`WorkListItem`**

| Field | Source |
|---|---|
| `work_id` | `works.work_id` |
| `unique_work_number` | `works.unique_work_number` |
| `work_description` | `works.work_description` |
| `mp_name` | `works.mp_name` |
| `category` | `works.category` |
| `state` | `works.state` |
| `constituency` | `works.constituency` |
| `ida` | `works.ida` |
| `city` | `works.city` |
| `status` | `works.status` |
| `ida_approval` | `works.ida_approval` |
| `house` | `works.house` |
| `recommended_date` | `works.recommended_date` |
| `allocation_amount` | `works.allocation_amount` |
| `data_quality` | see §4.6 |
| `priority` | derived from `risk_flags` only — see §4.7 |
| `real_risk_types` | distinct `risk_type` in `{COST_OUTLIER, IDA_PENDING, STUCK_IN_LIMBO}` |
| `synthetic_risk_types` | distinct `risk_type` in `{COST_OVERRUN, DELAY}` |

List items **omit** synthetic execution dates/amounts (keep payload small). Full execution fields only on detail.

### 4.3 `GET /api/v1/works/{work_id}`

**404** if no row.

**`WorkDetail`** = all list fields plus:

| Field | Origin |
|---|---|
| `ward`, `block`, `village` | REAL geography |
| `sanction_date` | SYNTHETIC_EXECUTION |
| `expected_completion_date` | SYNTHETIC_EXECUTION |
| `actual_completion_date` | SYNTHETIC_EXECUTION |
| `actual_expenditure` | SYNTHETIC_EXECUTION |
| `field_origins` | constant map (documented, not a DB column) |
| `risk_flags` | array of `RiskFlag` for this work |

`is_synthetic_anomaly` / `anomaly_type` **not** in this public body.

### 4.4 `GET /api/v1/risk-flags`

**Query:** `page`, `page_size`, `work_id`, `risk_type`, `risk_flag`, `risk_level`, `signal_origin` (`REAL_MPLADS_RULE` \| `SYNTHETIC_VALIDATION`).

**Response:** `{ data: RiskFlag[], pagination }`

### 4.5 `GET /api/v1/risk-flags/{work_id}`

This is **flags for a work**, not `risk_flags.id`.  
**404** if `works.work_id` missing (even if zero flags).

**Response**

| Field | Meaning |
|---|---|
| `work_id` | integer |
| `work` | compact work identity + `data_quality` + `priority` |
| `risk_flags` | all flags for that work |
| `requires_human_verification` | `true` |
| `disclaimer` | fixed advisory string |

### 4.6 `data_quality` object (never inside risk score)

```json
{
  "score": 40.00,
  "scale": "0_to_100",
  "interpretation": "completeness_traceability",
  "is_risk_score": false,
  "basis_fields": ["city", "ward", "block", "village", "unique_work_number"]
}
```

`score` is **read from** `works.data_quality_score` only.

### 4.7 `priority` object (not a fused 0–100 score)

Derived only from stored flags:

```json
{
  "flag_count": 2,
  "highest_risk_level": "HIGH",
  "real_detector_count": 2,
  "synthetic_detector_count": 0
}
```

No `overall_risk`. Frontend gauge stays **SIMULATION** until a later approved fusion phase.

### 4.8 `RiskFlag` object

| Field | Source |
|---|---|
| `id` | `risk_flags.id` |
| `work_id` | `risk_flags.work_id` |
| `risk_type` | `risk_flags.risk_type` |
| `risk_flag` | stored severity, exact |
| `risk_level` | normalized |
| `signal_origin` | derived: three real types vs `COST_OVERRUN`/`DELAY` |
| `days_pending` | column (often null for cost rules) |
| `recommended_date` | column |
| `status` | column |
| `ida_approval` | column |
| `detected_on` | column |
| `requires_human_verification` | always `true` |
| `rule` | documented constants only (below) |
| `evidence` | **only stored columns + documented rule constants** — no invented IQR numbers |

**`rule` constants (documentation, not extra DB columns)**

| `risk_type` | `signal_origin` | `rule` |
|---|---|---|
| `COST_OUTLIER` | `REAL_MPLADS_RULE` | peer group `work_description+state+city+village`; upper fence Q3+1.5×IQR on `allocation_amount`. Per-row Q1/Q3 **not stored** — omit numeric fence unless a later approved compute-at-read phase. |
| `IDA_PENDING` | `REAL_MPLADS_RULE` | `ida_approval = Action Pending` AND pending days **> 180** vs `2024-04-01` |
| `STUCK_IN_LIMBO` | `REAL_MPLADS_RULE` | `status = Unsanctioned` AND pending days **> 194** vs `2024-04-01` |
| `COST_OVERRUN` | `SYNTHETIC_VALIDATION` | synthetic `actual_expenditure` vs `allocation_amount`; not real execution data |
| `DELAY` | `SYNTHETIC_VALIDATION` | synthetic completion vs expected; Completed-late scope only |

Example `rule` for IDA_PENDING:

```json
{
  "name": "IDA_PENDING",
  "reference_date": "2024-04-01",
  "threshold_days": 180,
  "comparator": "greater_than",
  "input_fields": ["ida_approval", "recommended_date"]
}
```

### 4.9 Errors

```json
{ "error": "not_found", "message": "Work not found", "work_id": 999999 }
```

422 for invalid query types. Do not leak SQL.

---

## 5. JSON Examples

### 5.1 `GET /health`

```json
{
  "status": "ok",
  "service": "praja-suraksha-api",
  "api_version": "v1",
  "database": "connected"
}
```

### 5.2 `GET /api/v1/works?page=1&page_size=2`

```json
{
  "data": [
    {
      "work_id": 1,
      "unique_work_number": "WS/MP455/2023-2024/54540",
      "work_description": "Construction of New Building",
      "mp_name": null,
      "category": null,
      "state": null,
      "constituency": null,
      "ida": null,
      "city": null,
      "status": "Unsanctioned",
      "ida_approval": "Approved by IDA",
      "house": "Lok Sabha",
      "recommended_date": "2023-11-29",
      "allocation_amount": 990000.00,
      "data_quality": {
        "score": 60.00,
        "scale": "0_to_100",
        "interpretation": "completeness_traceability",
        "is_risk_score": false,
        "basis_fields": ["city", "ward", "block", "village", "unique_work_number"]
      },
      "priority": {
        "flag_count": 0,
        "highest_risk_level": null,
        "real_detector_count": 0,
        "synthetic_detector_count": 0
      },
      "real_risk_types": [],
      "synthetic_risk_types": []
    },
    {
      "work_id": 2835,
      "unique_work_number": null,
      "work_description": null,
      "mp_name": null,
      "category": null,
      "state": null,
      "constituency": null,
      "ida": null,
      "city": null,
      "status": "Unsanctioned",
      "ida_approval": "Action Pending",
      "house": null,
      "recommended_date": "2023-09-15",
      "allocation_amount": null,
      "data_quality": {
        "score": 40.00,
        "scale": "0_to_100",
        "interpretation": "completeness_traceability",
        "is_risk_score": false,
        "basis_fields": ["city", "ward", "block", "village", "unique_work_number"]
      },
      "priority": {
        "flag_count": 1,
        "highest_risk_level": "HIGH",
        "real_detector_count": 1,
        "synthetic_detector_count": 0
      },
      "real_risk_types": ["STUCK_IN_LIMBO"],
      "synthetic_risk_types": []
    }
  ],
  "pagination": {
    "page": 1,
    "page_size": 2,
    "total": 56138,
    "total_pages": 28069
  }
}
```

Nulls in the second item are because the freeze sample for `risk_flags` did not include joined `works` columns. Live API must fill from `works`.

### 5.3 `GET /api/v1/risk-flags/{work_id}` for `2835`

```json
{
  "work_id": 2835,
  "work": {
    "work_id": 2835,
    "unique_work_number": null,
    "work_description": null,
    "status": "Unsanctioned",
    "ida_approval": "Action Pending",
    "recommended_date": "2023-09-15",
    "data_quality": {
      "score": 40.00,
      "scale": "0_to_100",
      "interpretation": "completeness_traceability",
      "is_risk_score": false,
      "basis_fields": ["city", "ward", "block", "village", "unique_work_number"]
    },
    "priority": {
      "flag_count": 1,
      "highest_risk_level": "HIGH",
      "real_detector_count": 1,
      "synthetic_detector_count": 0
    }
  },
  "risk_flags": [
    {
      "id": 1,
      "work_id": 2835,
      "risk_type": "STUCK_IN_LIMBO",
      "risk_flag": "HIGH_RISK",
      "risk_level": "HIGH",
      "signal_origin": "REAL_MPLADS_RULE",
      "days_pending": 199,
      "recommended_date": "2023-09-15",
      "status": "Unsanctioned",
      "ida_approval": "Action Pending",
      "detected_on": "2024-04-01",
      "requires_human_verification": true,
      "rule": {
        "name": "STUCK_IN_LIMBO",
        "reference_date": "2024-04-01",
        "threshold_days": 194,
        "comparator": "greater_than",
        "input_fields": ["status", "recommended_date"]
      },
      "evidence": [
        {
          "signal": "STUCK_IN_LIMBO",
          "value": 199,
          "threshold": 194,
          "reference_date": "2024-04-01",
          "explanation": "Unsanctioned and pending 199 days vs 194-day threshold. Candidate for human verification — not a fraud finding.",
          "source_fields": ["status", "recommended_date", "days_pending"]
        }
      ]
    }
  ],
  "requires_human_verification": true,
  "disclaimer": "These are risk-intelligence flags that indicate where to look and why. They do not declare fraud. Final verification remains with authorised officials."
}
```

### 5.4 Synthetic flag (must be labelled)

```json
{
  "id": 21000,
  "work_id": 100,
  "risk_type": "COST_OVERRUN",
  "risk_flag": "HIGH",
  "risk_level": "HIGH",
  "signal_origin": "SYNTHETIC_VALIDATION",
  "days_pending": null,
  "recommended_date": null,
  "status": null,
  "ida_approval": null,
  "detected_on": "2024-04-01",
  "requires_human_verification": true,
  "rule": {
    "name": "COST_OVERRUN",
    "notes": "Uses synthetically augmented actual_expenditure. Not a real government execution record."
  },
  "evidence": [
    {
      "signal": "COST_OVERRUN",
      "explanation": "Flag produced in a controlled synthetic execution layer for detector validation. Not a real expenditure finding.",
      "source_fields": ["actual_expenditure", "allocation_amount"]
    }
  ]
}
```

---

## 6. Frontend Compatibility Matrix

Existing UI: `praja-suraksha-dash` (React 19 + TanStack), mock `src/lib/mplads/data.ts`, 10,000 seeded works.

| Screen | Route | Live P0? | Direct maps | Breaks / remaining mock |
|---|---|---|---|---|
| Health panel | AppShell | **Yes** | `GET /health` | none |
| Dashboard KPIs | `/` | **Partial** | work count 56,138; flag counts by `risk_type` | Critical=120, 72% precision, 10k mix, mismatch feed (no `physical_progress`) |
| Flagged register | `/projects` | **Yes, with adapter** | search description/`unique_work_number`/`ida`/`state`; sort by `highest_risk_level` / `flag_count` | `MP-*` IDs; Critical tier; district search |
| Risk profile | `/projects/$id` | **Partial** | identity, statuses, allocation, DQ score, real/synthetic flags + evidence | 0–100 gauge, radar, six weights, peer IQR numbers unless computed later, confidence |
| Investigation brief | `/brief/$id` | **Partial** | particulars + stored flags → “what to verify” checklist | peer median cost, photo, physical % |
| Risk map | `/map` | **No (P0)** | `state` rollup only if added later | no lat/lng; generated coords; `district` missing |
| Duplicates | `/duplicates` | **No** | — | generated pairs; no similarity table |
| Agency analytics | `/agencies` | **No / later P1** | optional rollup by `ida` (authority, not contractor) | mock agency types, delay frequency, behaviour score |
| Persona switcher | shell | unchanged | — | not data-dependent |

**Recommended migration order**

1. Keep mock provider; add `LIVE` / `DEMO MOCK` banner (already in UI).  
2. Point health check at real `GET /health`.  
3. Adapter: mock `Work` → frozen `WorkListItem` (integer `work_id`, `ida_approval`, `status`, `data_quality.score`).  
4. Live **Flagged Works** from `GET /api/v1/risk-flags` + work joins.  
5. Live **Profile** database-signals panel; hide or label six-signal radar as SIMULATION.  
6. Dashboard counts from live aggregations (can be computed client-side from paginated totals **or** a later P1 `/rollups` — **not in this P0 freeze**).  
7. Brief from live work + flags.  
8. Leave map / duplicates / agency mock until P1+ with honest labels.

---

## 7. Live vs Simulation Classification

| Item | Class | P0 API |
|---|---|---|
| `works` government fields (MP, description, category, geo, recommended date, allocation, IDA approval, status, house, IDA name) | **LIVE REAL MPLADS** | Yes |
| `data_quality_score` | **LIVE DB completeness** — not risk | Yes, separate object |
| `COST_OUTLIER`, `IDA_PENDING`, `STUCK_IN_LIMBO` | **LIVE REAL RULES** | Yes, `signal_origin=REAL_MPLADS_RULE` |
| `COST_OVERRUN`, `DELAY` | **DB-PERSISTED SYNTHETIC VALIDATION** | Yes, must label `SYNTHETIC_VALIDATION` |
| `sanction_date`, completion dates, `actual_expenditure` | **SYNTHETIC EXECUTION FIELDS** | Detail only + `field_origins` |
| `is_synthetic_anomaly`, `anomaly_type` | Internal ground truth | **Not in public P0 JSON** |
| Frontend six-signal model & weights | **SIMULATED UI** | Not in P0 |
| Duplicate/ghost/photo/geo clusters | **SIMULATED UI** | Not in P0 |
| Agency behaviour score | **SIMULATED UI** | Not in P0 |
| Top-100 precision 72% | **DEMO METRIC — not validated** | Do not return |
| Fused overall risk 0–100 | **NOT IN DATABASE** | Not in P0 |
| `CRITICAL` tier | **FRONTEND-ONLY** | Not in DB |

---

## 8. Remaining Blockers

1. **This Cursor workspace still has no app source** — contract is documentation-only until repos are placed here.  
2. **No PostgreSQL FK** documented `risk_flags.work_id` → `works.work_id`; backend must join defensively.  
3. **`work_id` type mismatch** (integer vs bigint).  
4. **`risk_flag` vocabulary split** (`HIGH_RISK` vs `HIGH`).  
5. **COST_OUTLIER evidence incomplete in table** (no stored Q1/Q3); P0 evidence is type + stored columns only.  
6. **No fused score table** — do not invent one to match the gauge.  
7. **Frontend ID and population mismatch** (10k `MP-*` vs 56,138 integers).  
8. **Map/duplicates/agency/physical progress** cannot be live on current schema.  
9. **`ida` ≠ implementing agency** — do not relabel it as contractor analytics.  
10. **Devotion blueprint endpoints** (`/api/works`, `/api/health`, Next.js, `risk_assessments`) **yield to this freeze**: `GET /health` + `/api/v1/works` + `/api/v1/risk-flags` as specified for P0.  
11. **P0 does not include** dashboard summary, verification POST, duplicates, rollups, or pipeline run.  
12. **Connection secrets** for `mplads_risk_db` are not part of this contract (env only).

---

**Stop.** No FastAPI implementation until this contract is approved.
