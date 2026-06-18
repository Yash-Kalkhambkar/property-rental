"""Initial schema — all 6 tables, indexes, constraints, triggers

Revision ID: 001
Revises: None
Create Date: 2024-01-01 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ── owners ──
    op.create_table(
        "owners",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=False),
            server_default=sa.text("gen_random_uuid()"),
            primary_key=True,
        ),
        sa.Column("email", sa.String(255), nullable=False, unique=True),
        sa.Column("password_hash", sa.String(60), nullable=False),
        sa.Column("full_name", sa.String(255), nullable=False),
        sa.Column("phone", sa.String(20)),
        sa.Column(
            "created_at",
            sa.TIMESTAMP(timezone=True),
            server_default=sa.text("NOW()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.TIMESTAMP(timezone=True),
            server_default=sa.text("NOW()"),
            nullable=False,
        ),
    )
    op.create_index("idx_owners_email", "owners", ["email"])

    # ── properties ──
    op.create_table(
        "properties",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=False),
            server_default=sa.text("gen_random_uuid()"),
            primary_key=True,
        ),
        sa.Column(
            "owner_id",
            postgresql.UUID(as_uuid=False),
            sa.ForeignKey("owners.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("address_line", sa.String(500), nullable=False),
        sa.Column("city", sa.String(100), nullable=False),
        sa.Column("state", sa.String(100), nullable=False),
        sa.Column("pincode", sa.String(10), nullable=False),
        sa.Column("property_type", sa.String(20), nullable=False),
        sa.Column(
            "total_units", sa.Integer(), nullable=False, server_default="1"
        ),
        sa.Column(
            "created_at",
            sa.TIMESTAMP(timezone=True),
            server_default=sa.text("NOW()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.TIMESTAMP(timezone=True),
            server_default=sa.text("NOW()"),
            nullable=False,
        ),
        sa.CheckConstraint(
            "property_type IN ('RESIDENTIAL', 'COMMERCIAL')",
            name="chk_property_type",
        ),
        sa.CheckConstraint("total_units > 0", name="chk_total_units"),
    )
    op.create_index("idx_properties_owner_id", "properties", ["owner_id"])
    op.create_index("idx_properties_city", "properties", ["city"])

    # ── units ──
    op.create_table(
        "units",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=False),
            server_default=sa.text("gen_random_uuid()"),
            primary_key=True,
        ),
        sa.Column(
            "property_id",
            postgresql.UUID(as_uuid=False),
            sa.ForeignKey("properties.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("unit_number", sa.String(50), nullable=False),
        sa.Column("floor", sa.Integer()),
        sa.Column("area_sqft", sa.Numeric(8, 2)),
        sa.Column("unit_type", sa.String(20), nullable=False),
        sa.Column("monthly_rent", sa.Numeric(10, 2), nullable=False),
        sa.Column(
            "deposit_amount",
            sa.Numeric(10, 2),
            nullable=False,
            server_default="0",
        ),
        sa.Column(
            "status",
            sa.String(20),
            nullable=False,
            server_default="VACANT",
        ),
        sa.Column("amenities", postgresql.ARRAY(sa.Text())),
        sa.Column(
            "created_at",
            sa.TIMESTAMP(timezone=True),
            server_default=sa.text("NOW()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.TIMESTAMP(timezone=True),
            server_default=sa.text("NOW()"),
            nullable=False,
        ),
        sa.CheckConstraint(
            "unit_type IN ('1BHK','2BHK','3BHK','STUDIO','SHOP','OFFICE')",
            name="chk_unit_type",
        ),
        sa.CheckConstraint("monthly_rent > 0", name="chk_unit_monthly_rent"),
        sa.CheckConstraint("deposit_amount >= 0", name="chk_unit_deposit"),
        sa.CheckConstraint(
            "status IN ('VACANT','OCCUPIED','MAINTENANCE')",
            name="chk_unit_status",
        ),
        sa.UniqueConstraint(
            "property_id", "unit_number", name="uq_unit_number_per_property"
        ),
    )
    op.create_index("idx_units_property_id", "units", ["property_id"])
    op.create_index("idx_units_status", "units", ["status"])

    # ── tenants ──
    op.create_table(
        "tenants",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=False),
            server_default=sa.text("gen_random_uuid()"),
            primary_key=True,
        ),
        sa.Column(
            "owner_id",
            postgresql.UUID(as_uuid=False),
            sa.ForeignKey("owners.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("full_name", sa.String(255), nullable=False),
        sa.Column("email", sa.String(255)),
        sa.Column("phone", sa.String(20), nullable=False),
        sa.Column("emergency_contact_name", sa.String(255)),
        sa.Column("emergency_contact_phone", sa.String(20)),
        sa.Column("id_type", sa.String(30)),
        sa.Column("id_number", sa.String(50)),
        sa.Column("id_document_url", sa.String(500)),
        sa.Column("notes", sa.Text()),
        sa.Column(
            "created_at",
            sa.TIMESTAMP(timezone=True),
            server_default=sa.text("NOW()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.TIMESTAMP(timezone=True),
            server_default=sa.text("NOW()"),
            nullable=False,
        ),
        sa.CheckConstraint(
            "id_type IN ('AADHAAR','PAN','PASSPORT','DRIVING_LICENSE') OR id_type IS NULL",
            name="chk_tenant_id_type",
        ),
    )
    op.create_index("idx_tenants_owner_id", "tenants", ["owner_id"])
    op.create_index("idx_tenants_phone", "tenants", ["phone"])

    # ── leases ──
    op.create_table(
        "leases",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=False),
            server_default=sa.text("gen_random_uuid()"),
            primary_key=True,
        ),
        sa.Column(
            "unit_id",
            postgresql.UUID(as_uuid=False),
            sa.ForeignKey("units.id", ondelete="RESTRICT"),
            nullable=False,
        ),
        sa.Column(
            "tenant_id",
            postgresql.UUID(as_uuid=False),
            sa.ForeignKey("tenants.id", ondelete="RESTRICT"),
            nullable=False,
        ),
        sa.Column("start_date", sa.Date(), nullable=False),
        sa.Column("end_date", sa.Date(), nullable=False),
        sa.Column("monthly_rent", sa.Numeric(10, 2), nullable=False),
        sa.Column(
            "deposit_paid",
            sa.Numeric(10, 2),
            nullable=False,
            server_default="0",
        ),
        sa.Column(
            "rent_due_day", sa.Integer(), nullable=False, server_default="1"
        ),
        sa.Column(
            "status",
            sa.String(20),
            nullable=False,
            server_default="ACTIVE",
        ),
        sa.Column("agreement_url", sa.String(500)),
        sa.Column("notes", sa.Text()),
        sa.Column(
            "created_at",
            sa.TIMESTAMP(timezone=True),
            server_default=sa.text("NOW()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.TIMESTAMP(timezone=True),
            server_default=sa.text("NOW()"),
            nullable=False,
        ),
        sa.CheckConstraint(
            "end_date > start_date", name="chk_lease_dates"
        ),
        sa.CheckConstraint(
            "rent_due_day BETWEEN 1 AND 28", name="chk_rent_due_day"
        ),
        sa.CheckConstraint("monthly_rent > 0", name="chk_monthly_rent"),
        sa.CheckConstraint("deposit_paid >= 0", name="chk_deposit"),
    )
    op.create_index("idx_leases_unit_id", "leases", ["unit_id"])
    op.create_index("idx_leases_tenant_id", "leases", ["tenant_id"])
    op.create_index("idx_leases_status", "leases", ["status"])
    op.create_index("idx_leases_end_date", "leases", ["end_date"])

    # Partial unique index — only one ACTIVE lease per unit
    op.execute(
        """
        CREATE UNIQUE INDEX idx_one_active_lease_per_unit
        ON leases(unit_id)
        WHERE status = 'ACTIVE'
    """
    )

    # ── payments ──
    op.create_table(
        "payments",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=False),
            server_default=sa.text("gen_random_uuid()"),
            primary_key=True,
        ),
        sa.Column(
            "lease_id",
            postgresql.UUID(as_uuid=False),
            sa.ForeignKey("leases.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("amount_due", sa.Numeric(10, 2), nullable=False),
        sa.Column(
            "amount_paid",
            sa.Numeric(10, 2),
            nullable=False,
            server_default="0",
        ),
        sa.Column("due_date", sa.Date(), nullable=False),
        sa.Column("paid_date", sa.Date()),
        sa.Column("payment_method", sa.String(20)),
        sa.Column("reference_number", sa.String(100)),
        sa.Column(
            "status",
            sa.String(20),
            nullable=False,
            server_default="PENDING",
        ),
        sa.Column("notes", sa.Text()),
        sa.Column(
            "created_at",
            sa.TIMESTAMP(timezone=True),
            server_default=sa.text("NOW()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.TIMESTAMP(timezone=True),
            server_default=sa.text("NOW()"),
            nullable=False,
        ),
        sa.CheckConstraint("amount_due > 0", name="chk_amount_due"),
        sa.CheckConstraint("amount_paid >= 0", name="chk_amount_paid"),
        sa.CheckConstraint(
            "status IN ('PENDING','PAID','PARTIAL','OVERDUE')",
            name="chk_payment_status",
        ),
        sa.CheckConstraint(
            "payment_method IN ('CASH','UPI','BANK_TRANSFER','CHEQUE') OR payment_method IS NULL",
            name="chk_payment_method",
        ),
    )
    op.create_index("idx_payments_lease_id", "payments", ["lease_id"])
    op.create_index("idx_payments_status", "payments", ["status"])
    op.create_index("idx_payments_due_date", "payments", ["due_date"])

    # ── Triggers ──

    # Auto-update updated_at on all tables
    op.execute(
        """
        CREATE OR REPLACE FUNCTION fn_update_updated_at()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = NOW();
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql
    """
    )

    for table in [
        "owners",
        "properties",
        "units",
        "tenants",
        "leases",
        "payments",
    ]:
        op.execute(
            f"""
            CREATE TRIGGER trg_{table}_updated_at
            BEFORE UPDATE ON {table}
            FOR EACH ROW EXECUTE FUNCTION fn_update_updated_at()
        """
        )

    # Sync unit status when lease status changes
    op.execute(
        """
        CREATE OR REPLACE FUNCTION fn_sync_unit_status()
        RETURNS TRIGGER AS $$
        BEGIN
            IF NEW.status = 'ACTIVE' THEN
                UPDATE units SET status = 'OCCUPIED' WHERE id = NEW.unit_id;
            ELSIF NEW.status IN ('EXPIRED', 'TERMINATED') THEN
                UPDATE units SET status = 'VACANT' WHERE id = NEW.unit_id;
            END IF;
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql
    """
    )
    op.execute(
        """
        CREATE TRIGGER trg_sync_unit_status
        AFTER INSERT OR UPDATE OF status ON leases
        FOR EACH ROW EXECUTE FUNCTION fn_sync_unit_status()
    """
    )


def downgrade() -> None:
    # Drop triggers first
    op.execute("DROP TRIGGER IF EXISTS trg_sync_unit_status ON leases")
    op.execute("DROP FUNCTION IF EXISTS fn_sync_unit_status")
    op.execute("DROP INDEX IF EXISTS idx_one_active_lease_per_unit")

    for table in reversed(
        ["owners", "properties", "units", "tenants", "leases", "payments"]
    ):
        op.execute(
            f"DROP TRIGGER IF EXISTS trg_{table}_updated_at ON {table}"
        )
    op.execute("DROP FUNCTION IF EXISTS fn_update_updated_at")

    # Drop tables in reverse dependency order
    op.drop_table("payments")
    op.drop_table("leases")
    op.drop_table("tenants")
    op.drop_table("units")
    op.drop_table("properties")
    op.drop_table("owners")
