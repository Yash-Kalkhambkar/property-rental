from sqlalchemy import String, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.mixins import TimestampMixin


class Owner(TimestampMixin, Base):
    __tablename__ = "owners"
    __table_args__ = (Index("idx_owners_email", "email"),)

    email: Mapped[str] = mapped_column(
        String(255), unique=True, nullable=False
    )
    password_hash: Mapped[str] = mapped_column(String(60), nullable=False)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    phone: Mapped[str | None] = mapped_column(String(20))

    # Relationships
    properties: Mapped[list["Property"]] = relationship(
        "Property", back_populates="owner", cascade="all, delete-orphan"
    )
    tenants: Mapped[list["Tenant"]] = relationship(
        "Tenant", back_populates="owner", cascade="all, delete-orphan"
    )
