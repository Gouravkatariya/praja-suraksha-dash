from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.constants import FIELD_ORIGINS
from app.db import get_db
from app.errors import not_found
from app.mapping import pagination_object, serialize_work_detail, serialize_work_list_item
from app.services.works import WorkListFilters, flags_for_work_ids, get_work, list_works

router = APIRouter(prefix="/api/v1", tags=["works"])

Page = Annotated[int, Query(ge=1)]
PageSize = Annotated[int, Query(ge=1, le=200)]


@router.get("/works")
def get_works(
    db: Session = Depends(get_db),
    page: Page = 1,
    page_size: PageSize = 50,
    state: str | None = None,
    category: str | None = None,
    status: str | None = None,
    ida_approval: str | None = None,
    constituency: str | None = None,
    house: str | None = None,
    q: str | None = None,
    has_risk_flag: bool | None = None,
) -> dict:
    rows, flags_by_work, total = list_works(
        db,
        WorkListFilters(
            state=state,
            category=category,
            status=status,
            ida_approval=ida_approval,
            constituency=constituency,
            house=house,
            q=q,
            has_risk_flag=has_risk_flag,
        ),
        page,
        page_size,
    )
    data = [
        serialize_work_list_item(row, flags_by_work.get(int(row.work_id), []))
        for row in rows
    ]
    return {"data": data, "pagination": pagination_object(page, page_size, total)}


@router.get("/works/{work_id}")
def get_work_detail(work_id: int, db: Session = Depends(get_db)) -> dict:
    work = get_work(db, work_id)
    if work is None:
        raise not_found("Work not found", work_id)
    flags = flags_for_work_ids(db, [work_id]).get(work_id, [])
    return serialize_work_detail(work, flags, FIELD_ORIGINS)
