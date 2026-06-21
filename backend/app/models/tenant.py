from sqlalchemy import String, Text, ForeignKey, CheckConstraint, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.mixins import TimestampMixin


class Tenant(TimestampMixin, Base):
    __tablename__ = "tenants"
    __table_args__ = (
        CheckConstraint(
            "id_type IN ('AADHAAR','PAN','PASSPORT','DRIVING_LICENSE') OR id_type IS NULL",
            name="chk_tenant_id_type",
        ),
        Index("idx_tenants_owner_id", "owner_id"),
        Index("idx_tenants_phone", "phone"),
        Index("idx_tenants_email", "email"),
    )

    owner_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("owners.id", ondelete="CASCADE"),
        nullable=False,
    )
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str] = mapped_column(String(255), nullable=False, unique=True)
    password_hash: Mapped[str] = mapped_column(String(60), nullable=False)
    phone: Mapped[str] = mapped_column(String(20), nullable=False)
    emergency_contact_name: Mapped[str | None] = mapped_column(String(255))
    emergency_contact_phone: Mapped[str | None] = mapped_column(String(20))
    id_type: Mapped[str | None] = mapped_column(String(30))
    id_number: Mapped[str | None] = mapped_column(String(50))
    id_document_url: Mapped[str | None] = mapped_column(String(500))
    notes: Mapped[str | None] = mapped_column(Text)

    # Relationships
    owner: Mapped["Owner"] = relationship("Owner", back_populates="tenants")
    leases: Mapped[list["Lease"]] = relationship(
        "Lease", back_populates="tenant"
    )
