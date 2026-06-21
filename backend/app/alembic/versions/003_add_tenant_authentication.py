"""Add tenant authentication columns

Revision ID: 003
Revises: 002
Create Date: 2024-01-15 00:00:00.000000

"""
from typing import Sequence, Union
from datetime import datetime

from alembic import op
import sqlalchemy as sa
import bcrypt

# revision identifiers, used by Alembic.
revision: str = "003"
down_revision: Union[str, None] = "002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()
    
    # ── Step 1: Handle existing tenants with NULL or empty emails ─────────────
    # Generate placeholder emails for tenants without an email
    result = conn.execute(sa.text(
        "SELECT id FROM tenants WHERE email IS NULL OR email = ''"
    ))
    tenants_without_email = result.fetchall()
    
    for row in tenants_without_email:
        tenant_id = row[0]
        placeholder_email = f"tenant-{tenant_id}@temp.example.com"
        conn.execute(
            sa.text("UPDATE tenants SET email = :email WHERE id = :id"),
            {"email": placeholder_email, "id": tenant_id}
        )
    
    # ── Step 2: Handle duplicate emails ───────────────────────────────────────
    # Find all duplicate emails and make them unique by appending tenant ID
    result = conn.execute(sa.text("""
        SELECT email, array_agg(id) as tenant_ids
        FROM tenants
        GROUP BY email
        HAVING COUNT(*) > 1
    """))
    duplicate_emails = result.fetchall()
    
    for row in duplicate_emails:
        email = row[0]
        tenant_ids = row[1]
        # Keep the first tenant with the original email, modify the rest
        for i, tenant_id in enumerate(tenant_ids[1:], start=1):
            # Extract email parts
            if '@' in email:
                local_part, domain = email.rsplit('@', 1)
                new_email = f"{local_part}-{tenant_id}@{domain}"
            else:
                new_email = f"{email}-{tenant_id}"
            
            conn.execute(
                sa.text("UPDATE tenants SET email = :new_email WHERE id = :id"),
                {"new_email": new_email, "id": tenant_id}
            )
    
    # ── Step 3: Add password_hash column (nullable temporarily) ───────────────
    conn.execute(sa.text(
        'ALTER TABLE tenants ADD COLUMN password_hash VARCHAR(60)'
    ))
    
    # ── Step 4: Set default password hashes for all existing tenants ──────────
    # Use current year in the password pattern: TenantReset{YYYY}
    current_year = datetime.now().year
    default_password = f"TenantReset{current_year}"
    default_hash = bcrypt.hashpw(
        default_password.encode('utf-8'), 
        bcrypt.gensalt(rounds=12)
    ).decode('utf-8')
    
    conn.execute(sa.text(
        'UPDATE tenants SET password_hash = :hash WHERE password_hash IS NULL'
    ), {"hash": default_hash})
    
    # ── Step 5: Make password_hash NOT NULL ────────────────────────────────────
    conn.execute(sa.text(
        'ALTER TABLE tenants ALTER COLUMN password_hash SET NOT NULL'
    ))
    
    # ── Step 6: Modify email column to NOT NULL ───────────────────────────────
    conn.execute(sa.text(
        'ALTER TABLE tenants ALTER COLUMN email SET NOT NULL'
    ))
    
    # ── Step 7: Add UNIQUE constraint on email ────────────────────────────────
    conn.execute(sa.text(
        'ALTER TABLE tenants ADD CONSTRAINT uq_tenants_email UNIQUE (email)'
    ))
    
    # ── Step 8: Add index on email for fast login lookups ─────────────────────
    conn.execute(sa.text(
        'CREATE INDEX idx_tenants_email ON tenants(email)'
    ))


def downgrade() -> None:
    conn = op.get_bind()
    
    # Drop index
    conn.execute(sa.text('DROP INDEX IF EXISTS idx_tenants_email'))
    
    # Drop unique constraint
    conn.execute(sa.text(
        'ALTER TABLE tenants DROP CONSTRAINT IF EXISTS uq_tenants_email'
    ))
    
    # Make email nullable again
    conn.execute(sa.text(
        'ALTER TABLE tenants ALTER COLUMN email DROP NOT NULL'
    ))
    
    # Drop password_hash column
    conn.execute(sa.text(
        'ALTER TABLE tenants DROP COLUMN IF EXISTS password_hash'
    ))
