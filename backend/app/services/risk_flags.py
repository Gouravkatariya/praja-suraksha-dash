from dataclasses import dataclass

from sqlalchemy import case, func, select
from sqlalchemy.orm import Session

from app.constants import REAL_RISK_TYPES, SYNTHETIC_RISK_TYPES
from app.models import RiskFlag

_RISK_LEVEL_EXPR = case(
    (RiskFlag.risk_flag == "LOW_RISK", "LOW"),
    (RiskFlag.risk_flag == "MEDIUM_RISK", "MEDIUM"),
    (RiskFlag.risk_flag.in_(("HIGH_RISK", "HIGH")), "HIGH"),
    else_="UNKNOWN",
)

_SIGNAL_ORIGIN_EXPR = case(
    (RiskFlag.risk_type.in_(tuple(REAL_RISK_TYPES)), "REAL_MPLADS_RULE"),
    (RiskFlag.risk_type.in_(tuple(SYNTHETIC_RISK_TYPES)), "SYNTHETIC_VALIDATION"),
    else_="UNKNOWN",
)


@dataclass
class RiskFlagListFilters:
    work_id: int | None = None
    risk_type: str | None = None
    risk_flag: str | None = None
    risk_level: str | None = None
    signal_origin: str | None = None


def list_risk_flags(
    db: Session,
    filters: RiskFlagListFilters,
    page: int,
    page_size: int,
) -> tuple[list[RiskFlag], int]:
    stmt = select(RiskFlag)
    conditions = []
    if filters.work_id is not None:
        conditions.append(RiskFlag.work_id == filters.work_id)
    if filters.risk_type is not None:
        conditions.append(RiskFlag.risk_type == filters.risk_type)
    if filters.risk_flag is not None:
        conditions.append(RiskFlag.risk_flag == filters.risk_flag)
    if filters.risk_level is not None:
        conditions.append(_RISK_LEVEL_EXPR == filters.risk_level)
    if filters.signal_origin is not None:
        conditions.append(_SIGNAL_ORIGIN_EXPR == filters.signal_origin)
    if conditions:
        stmt = stmt.where(*conditions)

    total = int(db.scalar(select(func.count()).select_from(stmt.subquery())) or 0)
    rows = db.scalars(
        stmt.order_by(RiskFlag.id).offset((page - 1) * page_size).limit(page_size)
    ).all()
    return list(rows), total


def flags_for_work(db: Session, work_id: int) -> list[RiskFlag]:
    return list(
        db.scalars(select(RiskFlag).where(RiskFlag.work_id == work_id).order_by(RiskFlag.id)).all()
    )
