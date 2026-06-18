"""Add missing columns, indexes, constraints and triggers to existing tables

Revision ID: 002
Revises: 001
Create Date: 2026-06-17 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "002"
down_revision: Union[str, None] = "001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()

    # ── Helper: add column only if it doesn't exist ──────────────────────────
    def add_column_if_missing(table: str, column: str, col_def: str) -> None:
        result = conn.execute(sa.text(
            "SELECT 1 FROM information_schema.columns "
            "WHERE table_schema='public' AND table_name=:t AND column_name=:c"
        ), {"t": table, "c": column}).fetchone()
        if not result:
            conn.execute(sa.text(f'ALTER TABLE "{table}" ADD COLUMN {col_def}'))

    def add_index_if_missing(index_name: str, ddl: str) -> None:
        result = conn.execute(sa.text(
            "SELECT 1 FROM pg_indexes WHERE schemaname='public' AND indexname=:n"
        ), {"n": index_name}).fetchone()
        if not result:
            conn.execute(sa.text(ddl))

    def add_constraint_if_missing(constraint_name: str, table: str, ddl: str) -> None:
        result = conn.execute(sa.text(
            "SELECT 1 FROM information_schema.table_constraints "
            "WHERE table_schema='public' AND constraint_name=:n"
        ), {"n": constraint_name}).fetchone()
        if not result:
            conn.execute(sa.text(f'ALTER TABLE "{table}" ADD CONSTRAINT "{constraint_name}" {ddl}'))

    def add_trigger_if_missing(trigger_name: str, table: str, ddl: str) -> None:
        result = conn.execute(sa.text(
            "SELECT 1 FROM information_schema.triggers "
            "WHERE trigger_schema='public' AND trigger_name=:n AND event_object_table=:t"
        ), {"n": trigger_name, "t": table}).fetchone()
        if not result:
            conn.execute(sa.text(ddl))

    # ── owners: add created_at, updated_at ───────────────────────────────────
    add_column_if_missing("owners", "created_at",
        "created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()")
    add_column_if_missing("owners", "updated_at",
        "updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()")

    # ── properties: add created_at, updated_at; fix nullability ──────────────
    add_column_if_missing("properties", "created_at",
        "created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()")
    add_column_if_missing("properties", "updated_at",
        "updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()")

    conn.execute(sa.text(
        'ALTER TABLE "properties" ALTER COLUMN property_type SET NOT NULL'
    ))
    conn.execute(sa.text(
        'ALTER TABLE "properties" ALTER COLUMN total_units SET NOT NULL, '
        'ALTER COLUMN total_units SET DEFAULT 1'
    ))

    # ── units: add amenities, created_at, updated_at; fix nullability ────────
    add_column_if_missing("units", "amenities",
        "amenities TEXT[]")
    add_column_if_missing("units", "created_at",
        "created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()")
    add_column_if_missing("units", "updated_at",
        "updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()")

    conn.execute(sa.text(
        'ALTER TABLE "units" ALTER COLUMN unit_number SET NOT NULL'
    ))
    conn.execute(sa.text(
        'ALTER TABLE "units" ALTER COLUMN unit_type SET NOT NULL'
    ))
    conn.execute(sa.text(
        'ALTER TABLE "units" ALTER COLUMN monthly_rent SET NOT NULL'
    ))
    conn.execute(sa.text(
        'ALTER TABLE "units" ALTER COLUMN deposit_amount SET NOT NULL, '
        'ALTER COLUMN deposit_amount SET DEFAULT 0'
    ))
    conn.execute(sa.text(
        "ALTER TABLE \"units\" ALTER COLUMN status SET NOT NULL, "
        "ALTER COLUMN status SET DEFAULT 'VACANT'"
    ))

    # ── tenants: add id_document_url, created_at, updated_at ─────────────────
    add_column_if_missing("tenants", "id_document_url",
        "id_document_url VARCHAR(500)")
    add_column_if_missing("tenants", "created_at",
        "created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()")
    add_column_if_missing("tenants", "updated_at",
        "updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()")

    # ── leases: add agreement_url, notes, created_at, updated_at; fix nulls ──
    add_column_if_missing("leases", "agreement_url",
        "agreement_url VARCHAR(500)")
    add_column_if_missing("leases", "notes",
        "notes TEXT")
    add_column_if_missing("leases", "created_at",
        "created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()")
    add_column_if_missing("leases", "updated_at",
        "updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()")

    conn.execute(sa.text(
        'ALTER TABLE "leases" ALTER COLUMN start_date SET NOT NULL'
    ))
    conn.execute(sa.text(
        'ALTER TABLE "leases" ALTER COLUMN end_date SET NOT NULL'
    ))
    conn.execute(sa.text(
        'ALTER TABLE "leases" ALTER COLUMN monthly_rent SET NOT NULL'
    ))
    conn.execute(sa.text(
        'ALTER TABLE "leases" ALTER COLUMN deposit_paid SET NOT NULL, '
        'ALTER COLUMN deposit_paid SET DEFAULT 0'
    ))
    conn.execute(sa.text(
        'ALTER TABLE "leases" ALTER COLUMN rent_due_day SET NOT NULL, '
        'ALTER COLUMN rent_due_day SET DEFAULT 1'
    ))
    conn.execute(sa.text(
        "ALTER TABLE \"leases\" ALTER COLUMN status SET NOT NULL, "
        "ALTER COLUMN status SET DEFAULT 'ACTIVE'"
    ))

    # ── payments: add notes, created_at, updated_at; fix nulls ───────────────
    add_column_if_missing("payments", "notes",
        "notes TEXT")
    add_column_if_missing("payments", "created_at",
        "created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()")
    add_column_if_missing("payments", "updated_at",
        "updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()")

    conn.execute(sa.text(
        'ALTER TABLE "payments" ALTER COLUMN amount_due SET NOT NULL'
    ))
    conn.execute(sa.text(
        'ALTER TABLE "payments" ALTER COLUMN amount_paid SET NOT NULL, '
        'ALTER COLUMN amount_paid SET DEFAULT 0'
    ))
    conn.execute(sa.text(
        'ALTER TABLE "payments" ALTER COLUMN due_date SET NOT NULL'
    ))
    conn.execute(sa.text(
        "ALTER TABLE \"payments\" ALTER COLUMN status SET NOT NULL, "
        "ALTER COLUMN status SET DEFAULT 'PENDING'"
    ))

    # ── CHECK constraints ─────────────────────────────────────────────────────
    add_constraint_if_missing("chk_property_type", "properties",
        "CHECK (property_type IN ('RESIDENTIAL', 'COMMERCIAL'))")
    add_constraint_if_missing("chk_total_units", "properties",
        "CHECK (total_units > 0)")
    add_constraint_if_missing("chk_unit_type", "units",
        "CHECK (unit_type IN ('1BHK','2BHK','3BHK','STUDIO','SHOP','OFFICE'))")
    add_constraint_if_missing("chk_unit_monthly_rent", "units",
        "CHECK (monthly_rent > 0)")
    add_constraint_if_missing("chk_unit_deposit", "units",
        "CHECK (deposit_amount >= 0)")
    add_constraint_if_missing("chk_unit_status", "units",
        "CHECK (status IN ('VACANT','OCCUPIED','MAINTENANCE'))")
    add_constraint_if_missing("chk_tenant_id_type", "tenants",
        "CHECK (id_type IN ('AADHAAR','PAN','PASSPORT','DRIVING_LICENSE') OR id_type IS NULL)")
    add_constraint_if_missing("chk_lease_dates", "leases",
        "CHECK (end_date > start_date)")
    add_constraint_if_missing("chk_rent_due_day", "leases",
        "CHECK (rent_due_day BETWEEN 1 AND 28)")
    add_constraint_if_missing("chk_monthly_rent", "leases",
        "CHECK (monthly_rent > 0)")
    add_constraint_if_missing("chk_deposit", "leases",
        "CHECK (deposit_paid >= 0)")
    add_constraint_if_missing("chk_amount_due", "payments",
        "CHECK (amount_due > 0)")
    add_constraint_if_missing("chk_amount_paid", "payments",
        "CHECK (amount_paid >= 0)")
    add_constraint_if_missing("chk_payment_status", "payments",
        "CHECK (status IN ('PENDING','PAID','PARTIAL','OVERDUE'))")
    add_constraint_if_missing("chk_payment_method", "payments",
        "CHECK (payment_method IN ('CASH','UPI','BANK_TRANSFER','CHEQUE') OR payment_method IS NULL)")

    # ── Unique constraints ────────────────────────────────────────────────────
    add_constraint_if_missing("uq_unit_number_per_property", "units",
        "UNIQUE (property_id, unit_number)")

    # ── Performance indexes ───────────────────────────────────────────────────
    add_index_if_missing("idx_owners_email",
        'CREATE INDEX idx_owners_email ON owners(email)')
    add_index_if_missing("idx_properties_owner_id",
        'CREATE INDEX idx_properties_owner_id ON properties(owner_id)')
    add_index_if_missing("idx_properties_city",
        'CREATE INDEX idx_properties_city ON properties(city)')
    add_index_if_missing("idx_units_property_id",
        'CREATE INDEX idx_units_property_id ON units(property_id)')
    add_index_if_missing("idx_units_status",
        'CREATE INDEX idx_units_status ON units(status)')
    add_index_if_missing("idx_tenants_owner_id",
        'CREATE INDEX idx_tenants_owner_id ON tenants(owner_id)')
    add_index_if_missing("idx_tenants_phone",
        'CREATE INDEX idx_tenants_phone ON tenants(phone)')
    add_index_if_missing("idx_leases_unit_id",
        'CREATE INDEX idx_leases_unit_id ON leases(unit_id)')
    add_index_if_missing("idx_leases_tenant_id",
        'CREATE INDEX idx_leases_tenant_id ON leases(tenant_id)')
    add_index_if_missing("idx_leases_status",
        'CREATE INDEX idx_leases_status ON leases(status)')
    add_index_if_missing("idx_leases_end_date",
        'CREATE INDEX idx_leases_end_date ON leases(end_date)')
    add_index_if_missing("idx_payments_lease_id",
        'CREATE INDEX idx_payments_lease_id ON payments(lease_id)')
    add_index_if_missing("idx_payments_status",
        'CREATE INDEX idx_payments_status ON payments(status)')
    add_index_if_missing("idx_payments_due_date",
        'CREATE INDEX idx_payments_due_date ON payments(due_date)')
    add_index_if_missing("idx_one_active_lease_per_unit",
        "CREATE UNIQUE INDEX idx_one_active_lease_per_unit ON leases(unit_id) WHERE status = 'ACTIVE'")

    # ── updated_at trigger function ───────────────────────────────────────────
    conn.execute(sa.text("""
        CREATE OR REPLACE FUNCTION fn_update_updated_at()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = NOW();
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql
    """))

    for table in ["owners", "properties", "units", "tenants", "leases", "payments"]:
        add_trigger_if_missing(
            f"trg_{table}_updated_at", table,
            f"""
            CREATE TRIGGER trg_{table}_updated_at
            BEFORE UPDATE ON {table}
            FOR EACH ROW EXECUTE FUNCTION fn_update_updated_at()
            """
        )

    # ── Sync unit status trigger ──────────────────────────────────────────────
    conn.execute(sa.text("""
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
    """))

    add_trigger_if_missing(
        "trg_sync_unit_status", "leases",
        """
        CREATE TRIGGER trg_sync_unit_status
        AFTER INSERT OR UPDATE OF status ON leases
        FOR EACH ROW EXECUTE FUNCTION fn_sync_unit_status()
        """
    )


def downgrade() -> None:
    conn = op.get_bind()

    # Drop triggers
    for table in ["owners", "properties", "units", "tenants", "leases", "payments"]:
        conn.execute(sa.text(
            f"DROP TRIGGER IF EXISTS trg_{table}_updated_at ON {table}"
        ))
    conn.execute(sa.text(
        "DROP TRIGGER IF EXISTS trg_sync_unit_status ON leases"
    ))
    conn.execute(sa.text("DROP FUNCTION IF EXISTS fn_update_updated_at"))
    conn.execute(sa.text("DROP FUNCTION IF EXISTS fn_sync_unit_status"))

    # Note: column removals are intentionally omitted from downgrade
    # to avoid accidental data loss on rollback
