from sqlalchemy import (
    String,
    Integer,
    Numeric,
    ForeignKey,
    CheckConstraint,
    UniqueConstraint,
    Index,
    ARRAY,
    Text,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.mixins import TimestampMixin


class Unit(TimestampMixin, Base):
    __tablename__ = "units"
    __table_args__ = (
        CheckConstraint(
            "unit_type IN ('1BHK','2BHK','3BHK','STUDIO','SHOP','OFFICE')",
            name="chk_unit_type",
        ),
        CheckConstraint("monthly_rent > 0", name="chk_unit_monthly_rent"),
        CheckConstraint("deposit_amount >= 0", name="chk_unit_deposit"),
        CheckConstraint(
            "status IN ('VACANT','OCCUPIED','MAINTENANCE')",
            name="chk_unit_status",
        ),
        UniqueConstraint(
            "property_id", "unit_number", name="uq_unit_number_per_property"
        ),
        Index("idx_units_property_id", "property_id"),
        Index("idx_units_status", "status"),
    )

    property_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("properties.id", ondelete="CASCADE"),
        nullable=False,
    )
    unit_number: Mapped[str] = mapped_column(String(50), nullable=False)
    floor: Mapped[int | None] = mapped_column(Integer)
    area_sqft: Mapped[float | None] = mapped_column(Numeric(8, 2))
    unit_type: Mapped[str] = mapped_column(String(20), nullable=False)
    monthly_rent: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    deposit_amount: Mapped[float] = mapped_column(
        Numeric(10, 2), nullable=False, default=0
    )
    status: Mapped[str] = mapped_column(
        String(20), nullable=False, default="VACANT"
    )
    amenities: Mapped[list[str] | None] = mapped_column(ARRAY(Text))

    # Relationships
    property: Mapped["Property"] = relationship(
        "Property", back_populates="units"
    )
    leases: Mapped[list["Lease"]] = relationship(
        "Lease", back_populates="unit"
    )
