from typing import Annotated, Literal

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.constants import DISCLAIMER
from app.db import get_db
from app.errors import not_found
from app.mapping import pagination_object, serialize_compact_work, serialize_risk_flag
from app.services.risk_flags import RiskFlagListFilters, flags_for_work, list_risk_flags
from app.services.works import get_work

router = APIRouter(prefix="/api/v1", tags=["risk-flags"])

Page = Annotated[int, Query(ge=1)]
PageSize = Annotated[int, Query(ge=1, le=200)]
SignalOrigin = Literal["REAL_MPLADS_RULE", "SYNTHETIC_VALIDATION"]
RiskLevel = Literal["LOW", "MEDIUM", "HIGH", "UNKNOWN"]


@router.get("/risk-flags")
def get_risk_flags(
    db: Session = Depends(get_db),
    page: Page = 1,
    page_size: PageSize = 50,
    work_id: int | None = None,
    risk_type: str | None = None,
    risk_flag: str | None = None,
    risk_level: RiskLevel | None = None,
    signal_origin: SignalOrigin | None = None,
) -> dict:
    rows, total = list_risk_flags(
        db,
        RiskFlagListFilters(
            work_id=work_id,
            risk_type=risk_type,
            risk_flag=risk_flag,
            risk_level=risk_level,
            signal_origin=signal_origin,
        ),
        page,
        page_size,
    )
    return {
        "data": [serialize_risk_flag(row) for row in rows],
        "pagination": pagination_object(page, page_size, total),
    }


@router.get("/risk-flags/{work_id}")
def get_risk_flags_for_work(work_id: int, db: Session = Depends(get_db)) -> dict:
    work = get_work(db, work_id)
    if work is None:
        raise not_found("Work not found", work_id)
    flags = flags_for_work(db, work_id)
    return {
        "work_id": work_id,
        "work": serialize_compact_work(work, flags),
        "risk_flags": [serialize_risk_flag(flag) for flag in flags],
        "requires_human_verification": True,
        "disclaimer": DISCLAIMER,
    }
