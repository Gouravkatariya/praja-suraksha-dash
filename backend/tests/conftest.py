from __future__ import annotations

from datetime import date

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import StaticPool, create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.db import get_db
from app.main import app
from app.models import Base, RiskFlag, Work

engine = create_engine(
    "sqlite+pysqlite://",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSession = sessionmaker(bind=engine, autocommit=False, autoflush=False, class_=Session)


def seed(db: Session) -> None:
    db.add_all(
        [
            Work(
                work_id=1,
                unique_work_number="WS/MP455/2023-2024/54540",
                work_description="Construction of New Building",
                status="Unsanctioned",
                ida_approval="Approved by IDA",
                house="Lok Sabha",
                recommended_date=date(2023, 11, 29),
                allocation_amount=990000,
                data_quality_score=60,
                city="Lucknow",
                ward=None,
                block=None,
                village=None,
                is_synthetic_anomaly=False,
                anomaly_type=None,
            ),
            Work(
                work_id=2835,
                unique_work_number=None,
                work_description=None,
                status="Unsanctioned",
                ida_approval="Action Pending",
                recommended_date=date(2023, 9, 15),
                data_quality_score=40,
                is_synthetic_anomaly=True,
                anomaly_type="STUCK",
            ),
            Work(
                work_id=100,
                unique_work_number="WS/MP100/2023-2024/1",
                work_description="Road work",
                status="Completed",
                ida_approval="Approved by IDA",
                allocation_amount=500000,
                actual_expenditure=900000,
                data_quality_score=80,
                sanction_date=date(2022, 1, 1),
                expected_completion_date=date(2023, 1, 1),
                actual_completion_date=date(2023, 6, 1),
            ),
        ]
    )
    db.add_all(
        [
            RiskFlag(
                id=1,
                work_id=2835,
                risk_type="STUCK_IN_LIMBO",
                risk_flag="HIGH_RISK",
                days_pending=199,
                recommended_date=date(2023, 9, 15),
                status="Unsanctioned",
                ida_approval="Action Pending",
                detected_on=date(2024, 4, 1),
            ),
            RiskFlag(
                id=21000,
                work_id=100,
                risk_type="COST_OVERRUN",
                risk_flag="HIGH",
                days_pending=None,
                recommended_date=None,
                status=None,
                ida_approval=None,
                detected_on=date(2024, 4, 1),
            ),
        ]
    )
    db.commit()


@pytest.fixture
def client():
    Base.metadata.drop_all(engine)
    Base.metadata.create_all(engine)
    db = TestingSession()
    seed(db)
    db.close()

    def override_db():
        session = TestingSession()
        try:
            yield session
        finally:
            session.close()

    app.dependency_overrides[get_db] = override_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()
