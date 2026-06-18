from datetime import date

from sqlalchemy import (
    String,
    Numeric,
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


class Payment(TimestampMixin, Base):
    __tablename__ = "payments"
    __table_args__ = (
        CheckConstraint("amount_due > 0", name="chk_amount_due"),
        CheckConstraint("amount_paid >= 0", name="chk_amount_paid"),
        CheckConstraint(
            "status IN ('PENDING','PAID','PARTIAL','OVERDUE')",
            name="chk_payment_status",
        ),
        CheckConstraint(
            "payment_method IN ('CASH','UPI','BANK_TRANSFER','CHEQUE') OR payment_method IS NULL",
            name="chk_payment_method",
        ),
        Index("idx_payments_lease_id", "lease_id"),
        Index("idx_payments_status", "status"),
        Index("idx_payments_due_date", "due_date"),
    )

    lease_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("leases.id", ondelete="CASCADE"),
        nullable=False,
    )
    amount_due: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    amount_paid: Mapped[float] = mapped_column(
        Numeric(10, 2), nullable=False, default=0
    )
    due_date: Mapped[date] = mapped_column(Date, nullable=False)
    paid_date: Mapped[date | None] = mapped_column(Date)
    payment_method: Mapped[str | None] = mapped_column(String(20))
    reference_number: Mapped[str | None] = mapped_column(String(100))
    status: Mapped[str] = mapped_column(
        String(20), nullable=False, default="PENDING"
    )
    notes: Mapped[str | None] = mapped_column(Text)

    # Relationships
    lease: Mapped["Lease"] = relationship("Lease", back_populates="payments")
