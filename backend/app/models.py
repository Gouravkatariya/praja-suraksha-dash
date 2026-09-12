from datetime import date
from decimal import Decimal

from sqlalchemy import BigInteger, Boolean, Date, Integer, Numeric, String, Text
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    pass


class Work(Base):
    __tablename__ = "works"

    work_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    mp_name: Mapped[str | None] = mapped_column(String(150))
    unique_work_number: Mapped[str | None] = mapped_column(String(100))
    work_description: Mapped[str | None] = mapped_column(Text)
    category: Mapped[str | None] = mapped_column(String(50))
    state: Mapped[str | None] = mapped_column(String(100))
    constituency: Mapped[str | None] = mapped_column(String(150))
    ida: Mapped[str | None] = mapped_column(String(200))
    city: Mapped[str | None] = mapped_column(String(150))
    ward: Mapped[str | None] = mapped_column(Text)
    block: Mapped[str | None] = mapped_column(String(150))
    village: Mapped[str | None] = mapped_column(String(150))
    recommended_date: Mapped[date | None] = mapped_column(Date)
    allocation_amount: Mapped[Decimal | None] = mapped_column(Numeric)
    ida_approval: Mapped[str | None] = mapped_column(String(50))
    status: Mapped[str | None] = mapped_column(String(30))
    house: Mapped[str | None] = mapped_column(String(20))
    sanction_date: Mapped[date | None] = mapped_column(Date)
    expected_completion_date: Mapped[date | None] = mapped_column(Date)
    actual_completion_date: Mapped[date | None] = mapped_column(Date)
    actual_expenditure: Mapped[Decimal | None] = mapped_column(Numeric)
    is_synthetic_anomaly: Mapped[bool | None] = mapped_column(Boolean, default=False)
    anomaly_type: Mapped[str | None] = mapped_column(String(50))
    data_quality_score: Mapped[Decimal | None] = mapped_column(Numeric)


class RiskFlag(Base):
    __tablename__ = "risk_flags"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    work_id: Mapped[int] = mapped_column(BigInteger, nullable=False)
    risk_type: Mapped[str] = mapped_column(String(50), nullable=False)
    risk_flag: Mapped[str | None] = mapped_column(String(50))
    days_pending: Mapped[int | None] = mapped_column(Integer)
    recommended_date: Mapped[date | None] = mapped_column(Date)
    status: Mapped[str | None] = mapped_column(String(100))
    ida_approval: Mapped[str | None] = mapped_column(String(100))
    detected_on: Mapped[date] = mapped_column(Date, nullable=False)
