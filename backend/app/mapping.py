from datetime import date
from decimal import Decimal
from typing import Any

from app.constants import (
    DQ_BASIS_FIELDS,
    REAL_RISK_TYPES,
    RISK_LEVEL_RANK,
    RULES,
    SIGNAL_ORIGIN_REAL,
    SIGNAL_ORIGIN_SYNTHETIC,
    SYNTHETIC_RISK_TYPES,
)
from app.models import RiskFlag, Work


def to_number(value: Decimal | float | int | None) -> float | None:
    if value is None:
        return None
    return float(value)


def to_iso_date(value: date | None) -> str | None:
    if value is None:
        return None
    return value.isoformat()


def normalize_risk_level(risk_flag: str | None) -> str:
    if risk_flag == "LOW_RISK":
        return "LOW"
    if risk_flag == "MEDIUM_RISK":
        return "MEDIUM"
    if risk_flag in {"HIGH_RISK", "HIGH"}:
        return "HIGH"
    return "UNKNOWN"


def signal_origin(risk_type: str) -> str:
    if risk_type in REAL_RISK_TYPES:
        return SIGNAL_ORIGIN_REAL
    if risk_type in SYNTHETIC_RISK_TYPES:
        return SIGNAL_ORIGIN_SYNTHETIC
    return "UNKNOWN"


def data_quality_object(score: Decimal | float | int | None) -> dict[str, Any]:
    return {
        "score": to_number(score),
        "scale": "0_to_100",
        "interpretation": "completeness_traceability",
        "is_risk_score": False,
        "basis_fields": list(DQ_BASIS_FIELDS),
    }


def highest_risk_level(flags: list[RiskFlag]) -> str | None:
    if not flags:
        return None
    levels = [normalize_risk_level(flag.risk_flag) for flag in flags]
    return max(levels, key=lambda level: RISK_LEVEL_RANK.get(level, -1))


def priority_object(flags: list[RiskFlag]) -> dict[str, Any]:
    real_types = {flag.risk_type for flag in flags if flag.risk_type in REAL_RISK_TYPES}
    synthetic_types = {flag.risk_type for flag in flags if flag.risk_type in SYNTHETIC_RISK_TYPES}
    return {
        "flag_count": len(flags),
        "highest_risk_level": highest_risk_level(flags),
        "real_detector_count": len(real_types),
        "synthetic_detector_count": len(synthetic_types),
    }


def risk_type_lists(flags: list[RiskFlag]) -> tuple[list[str], list[str]]:
    real = sorted({flag.risk_type for flag in flags if flag.risk_type in REAL_RISK_TYPES})
    synthetic = sorted({flag.risk_type for flag in flags if flag.risk_type in SYNTHETIC_RISK_TYPES})
    return real, synthetic


def _evidence_for(flag: RiskFlag) -> list[dict[str, Any]]:
    origin = signal_origin(flag.risk_type)
    if flag.risk_type == "IDA_PENDING":
        return [
            {
                "signal": "IDA_PENDING",
                "value": flag.days_pending,
                "threshold": 180,
                "reference_date": "2024-04-01",
                "explanation": (
                    f"IDA approval Action Pending and pending {flag.days_pending} days vs 180-day threshold. "
                    "Candidate for human verification — not a fraud finding."
                    if flag.days_pending is not None
                    else "IDA approval Action Pending beyond the 180-day threshold. Candidate for human verification — not a fraud finding."
                ),
                "source_fields": ["ida_approval", "recommended_date", "days_pending"],
            }
        ]
    if flag.risk_type == "STUCK_IN_LIMBO":
        return [
            {
                "signal": "STUCK_IN_LIMBO",
                "value": flag.days_pending,
                "threshold": 194,
                "reference_date": "2024-04-01",
                "explanation": (
                    f"Unsanctioned and pending {flag.days_pending} days vs 194-day threshold. "
                    "Candidate for human verification — not a fraud finding."
                    if flag.days_pending is not None
                    else "Unsanctioned beyond the 194-day threshold. Candidate for human verification — not a fraud finding."
                ),
                "source_fields": ["status", "recommended_date", "days_pending"],
            }
        ]
    if flag.risk_type == "COST_OUTLIER":
        return [
            {
                "signal": "COST_OUTLIER",
                "explanation": (
                    "Allocation amount flagged as a cost outlier vs peer group "
                    "(work_description+state+city+village). Per-row IQR fence values are not stored. "
                    "Candidate for human verification — not a fraud finding."
                ),
                "source_fields": ["allocation_amount", "risk_type", "risk_flag"],
            }
        ]
    if flag.risk_type == "COST_OVERRUN":
        return [
            {
                "signal": "COST_OVERRUN",
                "explanation": (
                    "Flag produced in a controlled synthetic execution layer for detector validation. "
                    "Not a real expenditure finding."
                ),
                "source_fields": ["actual_expenditure", "allocation_amount"],
            }
        ]
    if flag.risk_type == "DELAY":
        return [
            {
                "signal": "DELAY",
                "explanation": (
                    "Flag produced in a controlled synthetic execution layer for detector validation. "
                    "Not a real completion-delay finding."
                ),
                "source_fields": ["actual_completion_date", "expected_completion_date"],
            }
        ]
    return [
        {
            "signal": flag.risk_type,
            "explanation": f"{origin} flag stored in risk_flags. Candidate for human verification — not a fraud finding.",
            "source_fields": ["risk_type", "risk_flag"],
        }
    ]


def serialize_risk_flag(flag: RiskFlag) -> dict[str, Any]:
    rule = dict(RULES.get(flag.risk_type, {"name": flag.risk_type}))
    return {
        "id": int(flag.id),
        "work_id": int(flag.work_id),
        "risk_type": flag.risk_type,
        "risk_flag": flag.risk_flag,
        "risk_level": normalize_risk_level(flag.risk_flag),
        "signal_origin": signal_origin(flag.risk_type),
        "days_pending": flag.days_pending,
        "recommended_date": to_iso_date(flag.recommended_date),
        "status": flag.status,
        "ida_approval": flag.ida_approval,
        "detected_on": to_iso_date(flag.detected_on),
        "requires_human_verification": True,
        "rule": rule,
        "evidence": _evidence_for(flag),
    }


def serialize_work_list_item(work: Work, flags: list[RiskFlag]) -> dict[str, Any]:
    real_types, synthetic_types = risk_type_lists(flags)
    return {
        "work_id": int(work.work_id),
        "unique_work_number": work.unique_work_number,
        "work_description": work.work_description,
        "mp_name": work.mp_name,
        "category": work.category,
        "state": work.state,
        "constituency": work.constituency,
        "ida": work.ida,
        "city": work.city,
        "status": work.status,
        "ida_approval": work.ida_approval,
        "house": work.house,
        "recommended_date": to_iso_date(work.recommended_date),
        "allocation_amount": to_number(work.allocation_amount),
        "data_quality": data_quality_object(work.data_quality_score),
        "priority": priority_object(flags),
        "real_risk_types": real_types,
        "synthetic_risk_types": synthetic_types,
    }


def serialize_work_detail(work: Work, flags: list[RiskFlag], field_origins: dict[str, str]) -> dict[str, Any]:
    item = serialize_work_list_item(work, flags)
    item.update(
        {
            "ward": work.ward,
            "block": work.block,
            "village": work.village,
            "sanction_date": to_iso_date(work.sanction_date),
            "expected_completion_date": to_iso_date(work.expected_completion_date),
            "actual_completion_date": to_iso_date(work.actual_completion_date),
            "actual_expenditure": to_number(work.actual_expenditure),
            "field_origins": field_origins,
            "risk_flags": [serialize_risk_flag(flag) for flag in flags],
        }
    )
    return item


def serialize_compact_work(work: Work, flags: list[RiskFlag]) -> dict[str, Any]:
    return {
        "work_id": int(work.work_id),
        "unique_work_number": work.unique_work_number,
        "work_description": work.work_description,
        "status": work.status,
        "ida_approval": work.ida_approval,
        "recommended_date": to_iso_date(work.recommended_date),
        "data_quality": data_quality_object(work.data_quality_score),
        "priority": priority_object(flags),
    }


def pagination_object(page: int, page_size: int, total: int) -> dict[str, int]:
    total_pages = (total + page_size - 1) // page_size if page_size else 0
    return {
        "page": page,
        "page_size": page_size,
        "total": total,
        "total_pages": total_pages,
    }


def escape_like(value: str) -> str:
    return value.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")
