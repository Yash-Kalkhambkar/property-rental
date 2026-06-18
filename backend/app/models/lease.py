from datetime import date

from sqlalchemy import (
    String,
    Numeric,
    Integer,
    Date,
    Text,
    CheckConstraint,
    ForeignKey,
    Index,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.mixins import TimestampMixin


class Lease(TimestampMixin, Base):
    __tablename__ = "leases"
    __table_args__ = (
        CheckConstraint(
            "end_date > start_date", name="chk_lease_dates"
        ),
        CheckConstraint(
            "rent_due_day BETWEEN 1 AND 28", name="chk_rent_due_day"
        ),
        CheckConstraint("monthly_rent > 0", name="chk_monthly_rent"),
        CheckConstraint("deposit_paid >= 0", name="chk_deposit"),
        Index("idx_leases_unit_id", "unit_id"),
        Index("idx_leases_tenant_id", "tenant_id"),
        Index("idx_leases_status", "status"),
        Index("idx_leases_end_date", "end_date"),
    )

    unit_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("units.id", ondelete="RESTRICT"),
        nullable=False,
    )
    tenant_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("tenants.id", ondelete="RESTRICT"),
        nullable=False,
    )
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    end_date: Mapped[date] = mapped_column(Date, nullable=False)
    monthly_rent: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    deposit_paid: Mapped[float] = mapped_column(
        Numeric(10, 2), default=0
    )
    rent_due_day: Mapped[int] = mapped_column(Integer, default=1)
    status: Mapped[str] = mapped_column(
        String(20), default="ACTIVE", nullable=False
    )
    agreement_url: Mapped[str | None] = mapped_column(String(500))
    notes: Mapped[str | None] = mapped_column(Text)

    # Relationships
    unit: Mapped["Unit"] = relationship("Unit", back_populates="leases")
    tenant: Mapped["Tenant"] = relationship("Tenant", back_populates="leases")
    payments: Mapped[list["Payment"]] = relationship(
        "Payment", back_populates="lease", cascade="all, delete-orphan"
    )
