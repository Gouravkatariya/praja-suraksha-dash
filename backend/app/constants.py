REAL_RISK_TYPES = frozenset({"COST_OUTLIER", "IDA_PENDING", "STUCK_IN_LIMBO"})
SYNTHETIC_RISK_TYPES = frozenset({"COST_OVERRUN", "DELAY"})

SIGNAL_ORIGIN_REAL = "REAL_MPLADS_RULE"
SIGNAL_ORIGIN_SYNTHETIC = "SYNTHETIC_VALIDATION"

DQ_BASIS_FIELDS = ["city", "ward", "block", "village", "unique_work_number"]

DISCLAIMER = (
    "These are risk-intelligence flags that indicate where to look and why. "
    "They do not declare fraud. Final verification remains with authorised officials."
)

FIELD_ORIGINS = {
    "mp_name": "REAL_MPLADS",
    "unique_work_number": "REAL_MPLADS",
    "work_description": "REAL_MPLADS",
    "category": "REAL_MPLADS",
    "state": "REAL_MPLADS",
    "constituency": "REAL_MPLADS",
    "ida": "REAL_MPLADS",
    "city": "REAL_MPLADS",
    "ward": "REAL_MPLADS",
    "block": "REAL_MPLADS",
    "village": "REAL_MPLADS",
    "recommended_date": "REAL_MPLADS",
    "allocation_amount": "REAL_MPLADS",
    "ida_approval": "REAL_MPLADS",
    "status": "REAL_MPLADS",
    "house": "REAL_MPLADS",
    "sanction_date": "SYNTHETIC_EXECUTION",
    "expected_completion_date": "SYNTHETIC_EXECUTION",
    "actual_completion_date": "SYNTHETIC_EXECUTION",
    "actual_expenditure": "SYNTHETIC_EXECUTION",
    "data_quality_score": "LIVE_DB_COMPLETENESS",
}

RISK_LEVEL_RANK = {"HIGH": 3, "MEDIUM": 2, "LOW": 1, "UNKNOWN": 0}

RULES: dict[str, dict] = {
    "COST_OUTLIER": {
        "name": "COST_OUTLIER",
        "peer_group": ["work_description", "state", "city", "village"],
        "method": "upper_fence_q3_plus_1.5_iqr",
        "metric": "allocation_amount",
        "notes": "Per-row Q1/Q3 are not stored; numeric fence omitted.",
    },
    "IDA_PENDING": {
        "name": "IDA_PENDING",
        "reference_date": "2024-04-01",
        "threshold_days": 180,
        "comparator": "greater_than",
        "input_fields": ["ida_approval", "recommended_date"],
    },
    "STUCK_IN_LIMBO": {
        "name": "STUCK_IN_LIMBO",
        "reference_date": "2024-04-01",
        "threshold_days": 194,
        "comparator": "greater_than",
        "input_fields": ["status", "recommended_date"],
    },
    "COST_OVERRUN": {
        "name": "COST_OVERRUN",
        "notes": "Uses synthetically augmented actual_expenditure. Not a real government execution record.",
    },
    "DELAY": {
        "name": "DELAY",
        "notes": "Uses synthetically augmented completion dates. Completed-late scope only. Not a real government execution record.",
    },
}
