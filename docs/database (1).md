# Database — Property Rental Management System

## Stack

| Tool | Version | Purpose |
|---|---|---|
| PostgreSQL | 15 | Primary database (hosted on Supabase) |
| Supabase | — | Managed Postgres + Storage (replaces AWS RDS + S3) |
| SQLAlchemy | 2.0 | ORM (Python) |
| Alembic | 1.13 | Schema migrations |

> **Why Supabase over AWS RDS?**
> Supabase's free tier gives 500 MB Postgres + 1 GB file storage + a built-in storage API — no separate S3 bucket, no IAM users, no VPC setup. One dashboard instead of five AWS services.

---

## Supabase Connection Strings

Supabase gives you **two** connection strings per project — use the right one for the right job.

| Use case | Connection type | Port | When to use |
|---|---|---|---|
| FastAPI app (runtime) | **Pooler (Transaction mode)** | 6543 | All API requests — limits connections |
| Alembic migrations | **Direct** | 5432 | `alembic upgrade head` only |

Find both in: **Supabase Dashboard → Settings → Database → Connection string**

```env
# Runtime (FastAPI) — use this in DATABASE_URL
DATABASE_URL=postgresql://postgres.[project-ref]:[password]@aws-0-ap-south-1.pooler.supabase.com:6543/postgres

# Migrations only — use this when running alembic locally or in CI
DATABASE_DIRECT_URL=postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres
```

> **Important:** The pooler URL contains `postgres.[project-ref]` as the username (note the dot). Do not confuse it with the direct URL username which is just `postgres`.

### SQLAlchemy pool settings for Supabase pooler

Since Supabase's pooler manages connections itself, keep SQLAlchemy's pool small:

```python
engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,
    pool_size=3,        # keep low — pooler handles the real pooling
    max_overflow=5,
    connect_args={"options": "-c timezone=Asia/Kolkata"},
)
```

---

## Entity Relationship Diagram

```
owners
  │
  ├─────────────── properties (owner_id → owners.id)
  │                      │
  │                      └──── units (property_id → properties.id)
  │                                 │
  │                                 └──── leases (unit_id → units.id)
  │                                             │
  │                                             └──── payments (lease_id → leases.id)
  │
  └─────────────── tenants (owner_id → owners.id)
                        │
                        └──── leases (tenant_id → tenants.id)
```

**Cardinality:**
- 1 owner → many properties
- 1 property → many units
- 1 unit → many leases (over time, but only 1 ACTIVE at a time)
- 1 tenant → many leases (across different units and time periods)
- 1 lease → many payments

---

## Full Schema

### 1. `owners`

```sql
CREATE TABLE owners (
    id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    email         VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(60)  NOT NULL,           -- bcrypt output, always 60 chars
    full_name     VARCHAR(255) NOT NULL,
    phone         VARCHAR(20),
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_owners_email ON owners(email);
```

**Notes:**
- `email` is the login identifier — unique constraint at DB level as a safety net even if the app layer enforces it too
- `password_hash` is the bcrypt hash; raw passwords never stored
- We use our own auth (FastAPI + bcrypt + JWT). Supabase Auth (GoTrue) is not used — skip enabling it in the Supabase dashboard

---

### 2. `properties`

```sql
CREATE TABLE properties (
    id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id      UUID         NOT NULL REFERENCES owners(id) ON DELETE CASCADE,
    name          VARCHAR(255) NOT NULL,
    address_line  VARCHAR(500) NOT NULL,
    city          VARCHAR(100) NOT NULL,
    state         VARCHAR(100) NOT NULL,
    pincode       VARCHAR(10)  NOT NULL,
    property_type VARCHAR(20)  NOT NULL CHECK (property_type IN ('RESIDENTIAL', 'COMMERCIAL')),
    total_units   INTEGER      NOT NULL DEFAULT 1 CHECK (total_units > 0),
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_properties_owner_id ON properties(owner_id);
CREATE INDEX idx_properties_city     ON properties(city);
```

**Notes:**
- `ON DELETE CASCADE` on `owner_id`: deleting an owner removes all their properties (and cascades down to units → leases → payments)
- `total_units` is a declared count used for display; actual unit rows live in `units` table

---

### 3. `units`

```sql
CREATE TABLE units (
    id             UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id    UUID           NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    unit_number    VARCHAR(50)    NOT NULL,
    floor          INTEGER,
    area_sqft      NUMERIC(8, 2),
    unit_type      VARCHAR(20)    NOT NULL CHECK (unit_type IN ('1BHK','2BHK','3BHK','STUDIO','SHOP','OFFICE')),
    monthly_rent   NUMERIC(10, 2) NOT NULL CHECK (monthly_rent > 0),
    deposit_amount NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (deposit_amount >= 0),
    status         VARCHAR(20)    NOT NULL DEFAULT 'VACANT' CHECK (status IN ('VACANT','OCCUPIED','MAINTENANCE')),
    amenities      TEXT[],                    -- e.g. ARRAY['PARKING', 'WIFI', 'GYM']
    created_at     TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMPTZ    NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_unit_number_per_property UNIQUE (property_id, unit_number)
);

CREATE INDEX idx_units_property_id ON units(property_id);
CREATE INDEX idx_units_status      ON units(status);
```

---

### 4. `tenants`

```sql
CREATE TABLE tenants (
    id                      UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id                UUID         NOT NULL REFERENCES owners(id) ON DELETE CASCADE,
    full_name               VARCHAR(255) NOT NULL,
    email                   VARCHAR(255),
    phone                   VARCHAR(20)  NOT NULL,
    emergency_contact_name  VARCHAR(255),
    emergency_contact_phone VARCHAR(20),
    id_type                 VARCHAR(30)  CHECK (id_type IN ('AADHAAR','PAN','PASSPORT','DRIVING_LICENSE')),
    id_number               VARCHAR(50),
    id_document_url         VARCHAR(500),          -- Supabase Storage object key (not full URL)
    notes                   TEXT,
    created_at              TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tenants_owner_id ON tenants(owner_id);
CREATE INDEX idx_tenants_phone    ON tenants(phone);
```

**Notes:**
- `id_document_url` stores the Supabase Storage object key (e.g. `tenants/uuid/aadhaar.pdf`) — the signed URL is generated at query time via `storage_service.signed_url(key)`, never stored in DB

---

### 5. `leases`

```sql
CREATE TABLE leases (
    id            UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
    unit_id       UUID           NOT NULL REFERENCES units(id)   ON DELETE RESTRICT,
    tenant_id     UUID           NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    start_date    DATE           NOT NULL,
    end_date      DATE           NOT NULL,
    monthly_rent  NUMERIC(10, 2) NOT NULL,
    deposit_paid  NUMERIC(10, 2) NOT NULL DEFAULT 0,
    rent_due_day  INTEGER        NOT NULL DEFAULT 1,
    status        VARCHAR(20)    NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','EXPIRED','TERMINATED')),
    agreement_url VARCHAR(500),                    -- Supabase Storage object key for signed PDF
    notes         TEXT,
    created_at    TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ    NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_lease_dates    CHECK (end_date > start_date),
    CONSTRAINT chk_rent_due_day   CHECK (rent_due_day BETWEEN 1 AND 28),
    CONSTRAINT chk_monthly_rent   CHECK (monthly_rent > 0),
    CONSTRAINT chk_deposit        CHECK (deposit_paid >= 0)
);

CREATE INDEX idx_leases_unit_id   ON leases(unit_id);
CREATE INDEX idx_leases_tenant_id ON leases(tenant_id);
CREATE INDEX idx_leases_status    ON leases(status);
CREATE INDEX idx_leases_end_date  ON leases(end_date);   -- used for expiry queries

-- Business rule enforced at DB level: only one ACTIVE lease per unit at a time
CREATE UNIQUE INDEX idx_one_active_lease_per_unit
    ON leases(unit_id)
    WHERE status = 'ACTIVE';
```

**Key design decisions:**
- `monthly_rent` is **snapshotted** at the time of lease signing — if the unit's rent changes later, historical leases remain accurate
- `ON DELETE RESTRICT` on `unit_id` and `tenant_id` — prevents deleting a unit or tenant that has any lease history
- The partial unique index `WHERE status = 'ACTIVE'` enforces the one-active-lease-per-unit rule at the database level — a race condition cannot create two active leases

---

### 6. `payments`

```sql
CREATE TABLE payments (
    id               UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
    lease_id         UUID           NOT NULL REFERENCES leases(id) ON DELETE CASCADE,
    amount_due       NUMERIC(10, 2) NOT NULL CHECK (amount_due > 0),
    amount_paid      NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (amount_paid >= 0),
    due_date         DATE           NOT NULL,
    paid_date        DATE,
    payment_method   VARCHAR(20)    CHECK (payment_method IN ('CASH','UPI','BANK_TRANSFER','CHEQUE')),
    reference_number VARCHAR(100),
    status           VARCHAR(20)    NOT NULL DEFAULT 'PENDING'
                     CHECK (status IN ('PENDING','PAID','PARTIAL','OVERDUE')),
    notes            TEXT,
    created_at       TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payments_lease_id ON payments(lease_id);
CREATE INDEX idx_payments_status   ON payments(status);
CREATE INDEX idx_payments_due_date ON payments(due_date);   -- critical for scheduler query
```

**Notes:**
- `amount_due` vs `amount_paid` supports partial payments natively without extra tables
- `due_date` index is used by the daily scheduler: `WHERE due_date < TODAY AND status = 'PENDING'`
- Status transitions: `PENDING → PAID` (full) | `PENDING → PARTIAL` (partial) | `PENDING → OVERDUE` (scheduler)

---

## Triggers

### 1. Auto-update `updated_at` on all tables

```sql
CREATE OR REPLACE FUNCTION fn_update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_owners_updated_at     BEFORE UPDATE ON owners     FOR EACH ROW EXECUTE FUNCTION fn_update_updated_at();
CREATE TRIGGER trg_properties_updated_at BEFORE UPDATE ON properties  FOR EACH ROW EXECUTE FUNCTION fn_update_updated_at();
CREATE TRIGGER trg_units_updated_at      BEFORE UPDATE ON units       FOR EACH ROW EXECUTE FUNCTION fn_update_updated_at();
CREATE TRIGGER trg_tenants_updated_at    BEFORE UPDATE ON tenants     FOR EACH ROW EXECUTE FUNCTION fn_update_updated_at();
CREATE TRIGGER trg_leases_updated_at     BEFORE UPDATE ON leases      FOR EACH ROW EXECUTE FUNCTION fn_update_updated_at();
CREATE TRIGGER trg_payments_updated_at   BEFORE UPDATE ON payments    FOR EACH ROW EXECUTE FUNCTION fn_update_updated_at();
```

---

### 2. Sync unit status when lease status changes

```sql
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
$$ LANGUAGE plpgsql;

-- Fires on both INSERT (new lease) and UPDATE (status change)
CREATE TRIGGER trg_sync_unit_status
AFTER INSERT OR UPDATE OF status ON leases
FOR EACH ROW EXECUTE FUNCTION fn_sync_unit_status();
```

---

## SQLAlchemy ORM Models

```python
# models/lease.py
import uuid
from datetime import date
from sqlalchemy import String, Numeric, Integer, Date, CheckConstraint, ForeignKey, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base
from app.models.mixins import TimestampMixin   # adds created_at, updated_at

class Lease(TimestampMixin, Base):
    __tablename__ = "leases"
    __table_args__ = (
        CheckConstraint("end_date > start_date",         name="chk_lease_dates"),
        CheckConstraint("rent_due_day BETWEEN 1 AND 28", name="chk_rent_due_day"),
        CheckConstraint("monthly_rent > 0",              name="chk_monthly_rent"),
        CheckConstraint("deposit_paid >= 0",             name="chk_deposit"),
        Index("idx_leases_unit_id",   "unit_id"),
        Index("idx_leases_tenant_id", "tenant_id"),
        Index("idx_leases_status",    "status"),
        Index("idx_leases_end_date",  "end_date"),
    )

    id:           Mapped[str]   = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid.uuid4()))
    unit_id:      Mapped[str]   = mapped_column(UUID(as_uuid=False), ForeignKey("units.id",   ondelete="RESTRICT"), nullable=False)
    tenant_id:    Mapped[str]   = mapped_column(UUID(as_uuid=False), ForeignKey("tenants.id", ondelete="RESTRICT"), nullable=False)
    start_date:   Mapped[date]  = mapped_column(Date, nullable=False)
    end_date:     Mapped[date]  = mapped_column(Date, nullable=False)
    monthly_rent: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    deposit_paid: Mapped[float] = mapped_column(Numeric(10, 2), default=0)
    rent_due_day: Mapped[int]   = mapped_column(Integer, default=1)
    status:       Mapped[str]   = mapped_column(String(20), default="ACTIVE", nullable=False)
    agreement_url: Mapped[str | None] = mapped_column(String(500))
    notes:        Mapped[str | None] = mapped_column()

    # Relationships
    unit:     Mapped["Unit"]          = relationship("Unit",    back_populates="leases")
    tenant:   Mapped["Tenant"]        = relationship("Tenant",  back_populates="leases")
    payments: Mapped[list["Payment"]] = relationship("Payment", back_populates="lease", cascade="all, delete-orphan")
```

---

## Alembic Migration

```python
# alembic/env.py — set the direct URL for migrations
import os
from alembic import context
from app.core.database import Base
from app.models import *   # noqa: import all models so Base.metadata is populated

config = context.config

# Use the direct connection URL for migrations (not the pooler)
database_url = os.environ.get("DATABASE_DIRECT_URL") or os.environ.get("DATABASE_URL")
config.set_main_option("sqlalchemy.url", database_url)

target_metadata = Base.metadata
```

```python
# alembic/versions/001_initial_schema.py
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = '001'
down_revision = None
branch_labels = None
depends_on = None

def upgrade():
    # owners
    op.create_table('owners',
        sa.Column('id',            postgresql.UUID(as_uuid=False), server_default=sa.text('gen_random_uuid()'), primary_key=True),
        sa.Column('email',         sa.String(255), nullable=False, unique=True),
        sa.Column('password_hash', sa.String(60),  nullable=False),
        sa.Column('full_name',     sa.String(255), nullable=False),
        sa.Column('phone',         sa.String(20)),
        sa.Column('created_at',    sa.TIMESTAMP(timezone=True), server_default=sa.text('NOW()')),
        sa.Column('updated_at',    sa.TIMESTAMP(timezone=True), server_default=sa.text('NOW()')),
    )
    op.create_index('idx_owners_email', 'owners', ['email'])

    # ... (properties, units, tenants, leases, payments follow the same pattern)

    # Partial unique index — must use raw SQL (SQLAlchemy doesn't support WHERE clause in create_index)
    op.execute("""
        CREATE UNIQUE INDEX idx_one_active_lease_per_unit
        ON leases(unit_id)
        WHERE status = 'ACTIVE'
    """)

    # Triggers
    op.execute("""
        CREATE OR REPLACE FUNCTION fn_update_updated_at()
        RETURNS TRIGGER AS $$
        BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
        $$ LANGUAGE plpgsql
    """)
    for table in ['owners', 'properties', 'units', 'tenants', 'leases', 'payments']:
        op.execute(f"""
            CREATE TRIGGER trg_{table}_updated_at
            BEFORE UPDATE ON {table}
            FOR EACH ROW EXECUTE FUNCTION fn_update_updated_at()
        """)

    op.execute("""
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
    """)
    op.execute("""
        CREATE TRIGGER trg_sync_unit_status
        AFTER INSERT OR UPDATE OF status ON leases
        FOR EACH ROW EXECUTE FUNCTION fn_sync_unit_status()
    """)

def downgrade():
    op.execute("DROP TRIGGER IF EXISTS trg_sync_unit_status ON leases")
    op.execute("DROP FUNCTION IF EXISTS fn_sync_unit_status")
    op.execute("DROP INDEX IF EXISTS idx_one_active_lease_per_unit")
    for table in reversed(['owners', 'properties', 'units', 'tenants', 'leases', 'payments']):
        op.execute(f"DROP TRIGGER IF EXISTS trg_{table}_updated_at ON {table}")
    op.execute("DROP FUNCTION IF EXISTS fn_update_updated_at")
    op.drop_table('payments')
    op.drop_table('leases')
    op.drop_table('tenants')
    op.drop_table('units')
    op.drop_table('properties')
    op.drop_table('owners')
```

---

## Key Queries

### Dashboard: occupancy and revenue per property
```sql
SELECT
    p.id,
    p.name,
    COUNT(u.id)                                            AS total_units,
    COUNT(u.id) FILTER (WHERE u.status = 'OCCUPIED')      AS occupied_units,
    COUNT(u.id) FILTER (WHERE u.status = 'VACANT')        AS vacant_units,
    COALESCE(SUM(u.monthly_rent) FILTER (WHERE u.status = 'OCCUPIED'), 0) AS monthly_revenue
FROM properties p
LEFT JOIN units u ON u.property_id = p.id
WHERE p.owner_id = :owner_id
GROUP BY p.id, p.name;
```

### Leases expiring in next 30 days
```sql
SELECT
    l.id            AS lease_id,
    l.end_date,
    (l.end_date - CURRENT_DATE) AS days_remaining,
    t.full_name     AS tenant_name,
    u.unit_number || ' — ' || p.name AS unit_label
FROM leases l
JOIN tenants    t ON t.id = l.tenant_id
JOIN units      u ON u.id = l.unit_id
JOIN properties p ON p.id = u.property_id
WHERE p.owner_id = :owner_id
  AND l.status = 'ACTIVE'
  AND l.end_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days'
ORDER BY l.end_date ASC;
```

### Payments summary for a lease
```sql
SELECT
    COALESCE(SUM(amount_due), 0)                                          AS total_due,
    COALESCE(SUM(amount_paid), 0)                                         AS total_paid,
    COALESCE(SUM(amount_due) FILTER (WHERE status = 'OVERDUE'), 0)        AS overdue_amount
FROM payments
WHERE lease_id = :lease_id;
```

### Current month financials (all leases for an owner)
```sql
SELECT
    COALESCE(SUM(p.amount_due), 0)                                            AS expected,
    COALESCE(SUM(p.amount_paid), 0)                                           AS collected,
    COALESCE(SUM(p.amount_due) FILTER (WHERE p.status = 'OVERDUE'), 0)        AS overdue_amount,
    COUNT(*) FILTER (WHERE p.status = 'OVERDUE')                              AS overdue_count
FROM payments p
JOIN leases     l  ON l.id  = p.lease_id
JOIN units      u  ON u.id  = l.unit_id
JOIN properties pr ON pr.id = u.property_id
WHERE pr.owner_id = :owner_id
  AND DATE_TRUNC('month', p.due_date) = DATE_TRUNC('month', CURRENT_DATE);
```

---

## Alembic Commands

```bash
# Run migrations against Supabase (use DATABASE_DIRECT_URL, not pooler)
export DATABASE_DIRECT_URL="postgresql://postgres:<password>@db.<ref>.supabase.co:5432/postgres"
alembic upgrade head

# Create new migration after changing a model
alembic revision --autogenerate -m "add_column_x_to_table_y"

# Rollback one migration
alembic downgrade -1

# View current state
alembic current

# View history
alembic history --verbose
```

---

## Supabase Storage Bucket Setup

Create one private bucket for all tenant documents and lease agreements:

1. Supabase Dashboard → Storage → New bucket
2. Name: `rental-docs`
3. **Public bucket: OFF** (files accessed only via signed URLs generated by the backend)
4. File size limit: `5MB`
5. Allowed MIME types: `application/pdf, image/jpeg, image/png`

Object key conventions (same as before, just stored in Supabase instead of S3):

| File type | Key pattern |
|---|---|
| Tenant ID document | `tenants/{tenant_id}/id-doc.pdf` |
| Lease agreement | `leases/{lease_id}/agreement.pdf` |

---

## Design Decisions Summary

| Decision | Choice | Reasoning |
|---|---|---|
| Primary keys | UUID | Prevents ID enumeration; safe for future distributed setup |
| `monthly_rent` in leases | Snapshot | Historical accuracy when unit rent changes |
| `amenities` in units | `TEXT[]` array | Simple tags, read-heavy; join table is overkill |
| One ACTIVE lease per unit | Partial unique index | Enforced at DB level — survives concurrent requests |
| `ON DELETE RESTRICT` on leases FK | Yes | Prevents accidental data loss of historical lease records |
| `ON DELETE CASCADE` on owner FK | Yes | Allows full account deletion without orphaned data |
| Timestamps | `TIMESTAMPTZ` | Timezone-aware; essential for correct IST date math |
| `updated_at` management | DB trigger | Never relies on application layer remembering to set it |
| DB hosting | Supabase | Managed Postgres + Storage in one place, generous free tier |
| Auth | Custom FastAPI JWT | Supabase Auth (GoTrue) not used — we own our own auth stack |
| Migrations | Alembic + direct URL | Pooler doesn't support DDL reliably; direct connection only for migrations |
