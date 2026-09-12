from collections import defaultdict
from dataclasses import dataclass

from sqlalchemy import exists, func, or_, select
from sqlalchemy.orm import Session

from app.mapping import escape_like
from app.models import RiskFlag, Work


@dataclass
class WorkListFilters:
    state: str | None = None
    category: str | None = None
    status: str | None = None
    ida_approval: str | None = None
    constituency: str | None = None
    house: str | None = None
    q: str | None = None
    has_risk_flag: bool | None = None


def get_work(db: Session, work_id: int) -> Work | None:
    return db.get(Work, work_id)


def flags_for_work_ids(db: Session, work_ids: list[int]) -> dict[int, list[RiskFlag]]:
    grouped: dict[int, list[RiskFlag]] = defaultdict(list)
    if not work_ids:
        return grouped
    rows = db.scalars(select(RiskFlag).where(RiskFlag.work_id.in_(work_ids)).order_by(RiskFlag.id)).all()
    for row in rows:
        grouped[int(row.work_id)].append(row)
    return grouped


def list_works(
    db: Session,
    filters: WorkListFilters,
    page: int,
    page_size: int,
) -> tuple[list[Work], dict[int, list[RiskFlag]], int]:
    stmt = select(Work)
    conditions = []
    if filters.state is not None:
        conditions.append(Work.state == filters.state)
    if filters.category is not None:
        conditions.append(Work.category == filters.category)
    if filters.status is not None:
        conditions.append(Work.status == filters.status)
    if filters.ida_approval is not None:
        conditions.append(Work.ida_approval == filters.ida_approval)
    if filters.constituency is not None:
        conditions.append(Work.constituency == filters.constituency)
    if filters.house is not None:
        conditions.append(Work.house == filters.house)
    if filters.q:
        pattern = f"%{escape_like(filters.q)}%"
        conditions.append(
            or_(
                Work.unique_work_number.ilike(pattern, escape="\\"),
                Work.work_description.ilike(pattern, escape="\\"),
            )
        )
    if filters.has_risk_flag is True:
        conditions.append(exists().where(RiskFlag.work_id == Work.work_id))
    elif filters.has_risk_flag is False:
        conditions.append(~exists().where(RiskFlag.work_id == Work.work_id))

    if conditions:
        stmt = stmt.where(*conditions)

    count_stmt = select(func.count()).select_from(stmt.subquery())
    total = int(db.scalar(count_stmt) or 0)

    rows = db.scalars(
        stmt.order_by(Work.work_id).offset((page - 1) * page_size).limit(page_size)
    ).all()
    flags = flags_for_work_ids(db, [int(row.work_id) for row in rows])
    return list(rows), flags, total
