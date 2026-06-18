from sqlalchemy import String, Integer, ForeignKey, CheckConstraint, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.mixins import TimestampMixin


class Property(TimestampMixin, Base):
    __tablename__ = "properties"
    __table_args__ = (
        CheckConstraint(
            "property_type IN ('RESIDENTIAL', 'COMMERCIAL')",
            name="chk_property_type",
        ),
        CheckConstraint("total_units > 0", name="chk_total_units"),
        Index("idx_properties_owner_id", "owner_id"),
        Index("idx_properties_city", "city"),
    )

    owner_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("owners.id", ondelete="CASCADE"),
        nullable=False,
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    address_line: Mapped[str] = mapped_column(String(500), nullable=False)
    city: Mapped[str] = mapped_column(String(100), nullable=False)
    state: Mapped[str] = mapped_column(String(100), nullable=False)
    pincode: Mapped[str] = mapped_column(String(10), nullable=False)
    property_type: Mapped[str] = mapped_column(String(20), nullable=False)
    total_units: Mapped[int] = mapped_column(
        Integer, nullable=False, default=1
    )

    # Relationships
    owner: Mapped["Owner"] = relationship("Owner", back_populates="properties")
    units: Mapped[list["Unit"]] = relationship(
        "Unit", back_populates="property", cascade="all, delete-orphan"
    )
