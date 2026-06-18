# Database Documentation — Property Rental Management System

> **Audience:** College jury members and team members with no development background.
> **Goal:** Explain every table, column, relationship, constraint, index, trigger, and concept clearly enough to answer any database question in a jury presentation.

---

## Table of Contents

1. [What is a Database?](#1-what-is-a-database)
2. [What is PostgreSQL? What is Supabase?](#2-what-is-postgresql-what-is-supabase)
3. [What is a Relational Database?](#3-what-is-a-relational-database)
4. [Our Complete Schema — All 6 Tables](#4-our-complete-schema)
5. [Entity Relationship Diagram](#5-entity-relationship-diagram)
6. [Relationships Explained](#6-relationships-explained)
7. [Constraints Explained](#7-constraints-explained)
8. [Indexes — Making Queries Fast](#8-indexes)
9. [Triggers — Automatic Database Actions](#9-triggers)
10. [The Partial Unique Index](#10-the-partial-unique-index)
11. [What is Alembic? How Migrations Work](#11-what-is-alembic--migrations)
12. [What is a Connection Pool?](#12-what-is-a-connection-pool)
13. [Real Use Case: Owner Records a Payment](#13-real-use-case-owner-records-a-payment)
14. [SQL Concepts Used in Our Code](#14-sql-concepts)

---

## 1. What is a Database?

A **database** is an organized collection of structured data that can be stored, retrieved, updated, and deleted efficiently. It's the long-term memory of an application.

**Analogy:** Imagine a filing cabinet in a property management office. Each drawer holds a category of records (Owner Details, Tenant Contracts, Payment Receipts). Each folder inside a drawer is one record. The filing rules (alphabetical order, a log for every modification) are enforced by the cabinet itself.

Without a database, every time the server restarts, all data would be lost — like a whiteboard that gets erased at night. The database lives independently of the application server, holding the data permanently and safely.

**In our system:** The database stores all information about owners, their properties and units, tenants, lease agreements, and payment records. The backend server reads from and writes to this database in response to user actions.

---

## 2. What is PostgreSQL? What is Supabase?

### PostgreSQL

**PostgreSQL** (often called "Postgres") is a free, open-source, relational database management system. It has been developed for over 35 years and is considered one of the most reliable and feature-rich databases in existence. Companies like Instagram, Uber, and Apple use PostgreSQL at massive scale.

Key features of PostgreSQL relevant to our project:
- **Transactions** — a group of operations that either all succeed or all fail together.
- **Constraints** — database-level rules that reject invalid data.
- **Triggers** — automatic functions that run when data changes.
- **Arrays** — native array data type (we use this for unit amenities).
- **UUID generation** — built-in `gen_random_uuid()` function.
- **JSONB** — binary JSON storage (not used here, but available).

### Supabase

**Supabase** is a cloud platform that provides a hosted PostgreSQL database along with extra services:
- A hosted PostgreSQL instance (the actual database).
- File storage (we use this to store tenant ID documents and lease agreement PDFs).
- A web dashboard to browse tables, run SQL queries, and monitor the database.
- Authentication utilities (we don't use these — we built our own).

**Think of Supabase as Amazon Web Services but specifically for PostgreSQL** — instead of managing a database server yourself, you rent one that is already set up, secured, backed up, and monitored.

Our backend connects to Supabase over an encrypted connection. The database physically runs on Supabase's servers in the cloud.

---

## 3. What is a Relational Database?

A **relational database** organizes data into **tables** (like spreadsheets). Tables have **columns** (like column headings) and **rows** (individual records).

What makes it "relational" is that tables can **relate** to each other through shared IDs. Instead of repeating an owner's email in every property record, you store the owner's ID in the property record and "join" the two tables when you need both pieces of information together.

**Analogy:** Think of two spreadsheets:

**Spreadsheet A: Owners**
| id | email | full_name |
|---|---|---|
| 001 | raj@example.com | Raj Kumar |
| 002 | priya@example.com | Priya Sharma |

**Spreadsheet B: Properties**
| id | owner_id | name | city |
|---|---|---|---|
| P001 | 001 | Sunrise Apartments | Pune |
| P002 | 001 | Green Villa | Mumbai |
| P003 | 002 | Blue Tower | Delhi |

`owner_id` in Properties refers to `id` in Owners. This connection is a **foreign key relationship**. You can ask: "Give me all properties where `owner_id` matches Raj's `id` (001)" and get both Sunrise Apartments and Green Villa.

This is far better than duplicating Raj's name and email in every property row — if Raj's email changes, you update it in one place (the owners table), and all properties instantly reflect the change.

---

## 4. Our Complete Schema

Our database has **6 tables**. All tables are defined in the migration files at:
- `backend/app/alembic/versions/001_initial_schema.py`
- `backend/app/alembic/versions/002_add_missing_columns_indexes_triggers.py`

And mirrored as Python ORM models in `backend/app/models/`.

---

### Table 1: `owners`

**Purpose:** Stores the login accounts of property owners using the system.

| Column | Type | Nullable | Default | Description |
|---|---|---|---|---|
| `id` | UUID | NOT NULL | `gen_random_uuid()` | Primary key. Unique identifier. |
| `email` | VARCHAR(255) | NOT NULL | — | Login email. Must be unique across all owners. |
| `password_hash` | VARCHAR(60) | NOT NULL | — | bcrypt hash of the password. Never stored as plain text. |
| `full_name` | VARCHAR(255) | NOT NULL | — | Display name shown in the UI. |
| `phone` | VARCHAR(20) | NULL | — | Optional contact number. |
| `created_at` | TIMESTAMPTZ | NOT NULL | `NOW()` | When the account was created. |
| `updated_at` | TIMESTAMPTZ | NOT NULL | `NOW()` | Last modification time (auto-updated by trigger). |

**Constraints:** `email` has a UNIQUE constraint — two owners cannot share an email.
**Index:** `idx_owners_email` on `email` — fast lookup during login.

**Python model:** `backend/app/models/owner.py`

---

### Table 2: `properties`

**Purpose:** Stores each building or property that an owner manages.

| Column | Type | Nullable | Default | Description |
|---|---|---|---|---|
| `id` | UUID | NOT NULL | `gen_random_uuid()` | Primary key. |
| `owner_id` | UUID | NOT NULL | — | Foreign key → `owners.id`. Which owner this belongs to. |
| `name` | VARCHAR(255) | NOT NULL | — | Property name (e.g., "Sunrise Apartments"). |
| `address_line` | VARCHAR(500) | NOT NULL | — | Street address. |
| `city` | VARCHAR(100) | NOT NULL | — | City (e.g., "Pune"). Used for filtering. |
| `state` | VARCHAR(100) | NOT NULL | — | State (e.g., "Maharashtra"). |
| `pincode` | VARCHAR(10) | NOT NULL | — | PIN code. |
| `property_type` | VARCHAR(20) | NOT NULL | — | `'RESIDENTIAL'` or `'COMMERCIAL'`. |
| `total_units` | INTEGER | NOT NULL | 1 | Declared number of units (e.g., 12 flats in the building). |
| `created_at` | TIMESTAMPTZ | NOT NULL | `NOW()` | Creation time. |
| `updated_at` | TIMESTAMPTZ | NOT NULL | `NOW()` | Auto-updated by trigger. |

**Constraints:**
- `chk_property_type`: `property_type IN ('RESIDENTIAL', 'COMMERCIAL')`
- `chk_total_units`: `total_units > 0`
- Foreign key `owner_id → owners.id ON DELETE CASCADE` (delete owner → all properties deleted)

**Indexes:** `idx_properties_owner_id`, `idx_properties_city`

**Note:** `total_units` is what the owner *declared* when creating the property. The actual count of unit records in the `units` table may differ and is computed dynamically.

**Python model:** `backend/app/models/property.py`

---

### Table 3: `units`

**Purpose:** Stores individual rentable units (flats, shops, offices) within a property.

| Column | Type | Nullable | Default | Description |
|---|---|---|---|---|
| `id` | UUID | NOT NULL | `gen_random_uuid()` | Primary key. |
| `property_id` | UUID | NOT NULL | — | Foreign key → `properties.id`. |
| `unit_number` | VARCHAR(50) | NOT NULL | — | Unit identifier (e.g., "101", "A2", "GF-Shop-3"). |
| `floor` | INTEGER | NULL | — | Floor number. Optional. |
| `area_sqft` | NUMERIC(8,2) | NULL | — | Area in square feet. Optional. |
| `unit_type` | VARCHAR(20) | NOT NULL | — | `'1BHK'`, `'2BHK'`, `'3BHK'`, `'STUDIO'`, `'SHOP'`, or `'OFFICE'`. |
| `monthly_rent` | NUMERIC(10,2) | NOT NULL | — | Monthly rent amount in rupees. |
| `deposit_amount` | NUMERIC(10,2) | NOT NULL | 0 | Security deposit amount. |
| `status` | VARCHAR(20) | NOT NULL | `'VACANT'` | `'VACANT'`, `'OCCUPIED'`, or `'MAINTENANCE'`. |
| `amenities` | TEXT[] | NULL | — | Array of amenities. E.g., `['WiFi', 'AC', 'Parking']`. |
| `created_at` | TIMESTAMPTZ | NOT NULL | `NOW()` | Creation time. |
| `updated_at` | TIMESTAMPTZ | NOT NULL | `NOW()` | Auto-updated by trigger. |

**Constraints:**
- `chk_unit_type`: validates unit_type value
- `chk_unit_monthly_rent`: `monthly_rent > 0`
- `chk_unit_deposit`: `deposit_amount >= 0`
- `chk_unit_status`: validates status value
- `uq_unit_number_per_property`: UNIQUE on `(property_id, unit_number)` — unit numbers must be unique per property (flat "101" can exist in two different buildings, but not twice in the same one)

**Indexes:** `idx_units_property_id`, `idx_units_status`

**Python model:** `backend/app/models/unit.py`

---

### Table 4: `tenants`

**Purpose:** Stores information about people who rent units.

| Column | Type | Nullable | Default | Description |
|---|---|---|---|---|
| `id` | UUID | NOT NULL | `gen_random_uuid()` | Primary key. |
| `owner_id` | UUID | NOT NULL | — | Foreign key → `owners.id`. Tenants are private to each owner. |
| `full_name` | VARCHAR(255) | NOT NULL | — | Tenant's full name. |
| `email` | VARCHAR(255) | NULL | — | Tenant's email. Optional. Used for overdue alerts. |
| `phone` | VARCHAR(20) | NOT NULL | — | Tenant's phone number. Required. |
| `emergency_contact_name` | VARCHAR(255) | NULL | — | Emergency contact's name. |
| `emergency_contact_phone` | VARCHAR(20) | NULL | — | Emergency contact's phone. |
| `id_type` | VARCHAR(30) | NULL | — | Type of ID: `'AADHAAR'`, `'PAN'`, `'PASSPORT'`, or `'DRIVING_LICENSE'`. |
| `id_number` | VARCHAR(50) | NULL | — | The actual ID number (e.g., Aadhaar number). |
| `id_document_url` | VARCHAR(500) | NULL | — | Storage path to uploaded ID document scan. |
| `notes` | TEXT | NULL | — | Free-text notes about the tenant. |
| `created_at` | TIMESTAMPTZ | NOT NULL | `NOW()` | Creation time. |
| `updated_at` | TIMESTAMPTZ | NOT NULL | `NOW()` | Auto-updated by trigger. |

**Constraints:**
- `chk_tenant_id_type`: `id_type IN ('AADHAAR','PAN','PASSPORT','DRIVING_LICENSE') OR id_type IS NULL`

**Indexes:** `idx_tenants_owner_id`, `idx_tenants_phone`

**Python model:** `backend/app/models/tenant.py`

---

### Table 5: `leases`

**Purpose:** Records the rental agreement between a tenant and a unit for a specific time period. This is the most important table — it connects tenants to units.

| Column | Type | Nullable | Default | Description |
|---|---|---|---|---|
| `id` | UUID | NOT NULL | `gen_random_uuid()` | Primary key. |
| `unit_id` | UUID | NOT NULL | — | Foreign key → `units.id`. Which unit is being rented. |
| `tenant_id` | UUID | NOT NULL | — | Foreign key → `tenants.id`. Who is renting. |
| `start_date` | DATE | NOT NULL | — | Lease start date. |
| `end_date` | DATE | NOT NULL | — | Lease end date. |
| `monthly_rent` | NUMERIC(10,2) | NOT NULL | — | Monthly rent agreed in the lease (may differ from unit's listed rent). |
| `deposit_paid` | NUMERIC(10,2) | NOT NULL | 0 | Security deposit actually paid. |
| `rent_due_day` | INTEGER | NOT NULL | 1 | Day of the month rent is due (1–28). E.g., 5 means rent is due every 5th of the month. |
| `status` | VARCHAR(20) | NOT NULL | `'ACTIVE'` | `'ACTIVE'`, `'EXPIRED'`, or `'TERMINATED'`. |
| `agreement_url` | VARCHAR(500) | NULL | — | Storage path to the signed lease agreement PDF. |
| `notes` | TEXT | NULL | — | Notes. Termination reasons are appended here. |
| `created_at` | TIMESTAMPTZ | NOT NULL | `NOW()` | Creation time. |
| `updated_at` | TIMESTAMPTZ | NOT NULL | `NOW()` | Auto-updated by trigger. |

**Constraints:**
- `chk_lease_dates`: `end_date > start_date` — the lease cannot end before it starts.
- `chk_rent_due_day`: `rent_due_day BETWEEN 1 AND 28` — avoids issues with months that have fewer than 30 days (no February 30th).
- `chk_monthly_rent`: `monthly_rent > 0`
- `chk_deposit`: `deposit_paid >= 0`
- Foreign keys: `unit_id → units.id ON DELETE RESTRICT`, `tenant_id → tenants.id ON DELETE RESTRICT`

**Note on `ON DELETE RESTRICT`:** You cannot delete a unit or tenant that has a lease. You must terminate/delete the lease first. This prevents orphaned lease records pointing at deleted data.

**Indexes:** `idx_leases_unit_id`, `idx_leases_tenant_id`, `idx_leases_status`, `idx_leases_end_date`
**Special Index:** `idx_one_active_lease_per_unit` (see Section 10)

**Python model:** `backend/app/models/lease.py`

---

### Table 6: `payments`

**Purpose:** Records each monthly rent payment (or attempted payment) associated with a lease.

| Column | Type | Nullable | Default | Description |
|---|---|---|---|---|
| `id` | UUID | NOT NULL | `gen_random_uuid()` | Primary key. |
| `lease_id` | UUID | NOT NULL | — | Foreign key → `leases.id`. Which lease this payment is for. |
| `amount_due` | NUMERIC(10,2) | NOT NULL | — | How much was supposed to be paid. |
| `amount_paid` | NUMERIC(10,2) | NOT NULL | 0 | How much was actually paid. |
| `due_date` | DATE | NOT NULL | — | When this payment was due. |
| `paid_date` | DATE | NULL | — | When the payment was actually made. NULL if unpaid. |
| `payment_method` | VARCHAR(20) | NULL | — | `'CASH'`, `'UPI'`, `'BANK_TRANSFER'`, or `'CHEQUE'`. |
| `reference_number` | VARCHAR(100) | NULL | — | UPI transaction ID, cheque number, etc. |
| `status` | VARCHAR(20) | NOT NULL | `'PENDING'` | `'PENDING'`, `'PAID'`, `'PARTIAL'`, or `'OVERDUE'`. |
| `notes` | TEXT | NULL | — | Notes about this payment. |
| `created_at` | TIMESTAMPTZ | NOT NULL | `NOW()` | Creation time. |
| `updated_at` | TIMESTAMPTZ | NOT NULL | `NOW()` | Auto-updated by trigger. |

**Constraints:**
- `chk_amount_due`: `amount_due > 0` — you cannot record a payment for zero amount.
- `chk_amount_paid`: `amount_paid >= 0` — cannot be negative.
- `chk_payment_status`: validates status value.
- `chk_payment_method`: validates payment_method or allows NULL.
- Foreign key: `lease_id → leases.id ON DELETE CASCADE` — delete a lease → all its payments are deleted.

**Indexes:** `idx_payments_lease_id`, `idx_payments_status`, `idx_payments_due_date`

**Python model:** `backend/app/models/payment.py`

---

## 5. Entity Relationship Diagram

An **Entity Relationship Diagram (ERD)** is a visual map of the database tables and how they connect. Here is our ERD in text/ASCII art:

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    PROPERTY RENTAL MANAGEMENT SYSTEM — ERD                      │
└─────────────────────────────────────────────────────────────────────────────────┘

┌──────────────┐         ┌───────────────────┐         ┌──────────────────────┐
│   OWNERS     │         │    PROPERTIES     │         │       UNITS          │
│──────────────│         │───────────────────│         │──────────────────────│
│ id (PK)      │ 1     ∞ │ id (PK)           │ 1     ∞ │ id (PK)              │
│ email        │────────▶│ owner_id (FK)     │────────▶│ property_id (FK)     │
│ password_hash│         │ name              │         │ unit_number          │
│ full_name    │         │ address_line      │         │ floor                │
│ phone        │         │ city              │         │ area_sqft            │
│ created_at   │         │ state             │         │ unit_type            │
│ updated_at   │         │ pincode           │         │ monthly_rent         │
└──────────────┘         │ property_type     │         │ deposit_amount       │
        │                │ total_units       │         │ status               │
        │                │ created_at        │         │ amenities[]          │
        │                │ updated_at        │         │ created_at           │
        │ 1           ∞  └───────────────────┘         │ updated_at           │
        │                                              └──────────────────────┘
        │                                                         │
        ▼                                                         │ 1
┌──────────────┐                                                  │
│   TENANTS    │                                                  │
│──────────────│                                                  ▼
│ id (PK)      │         ┌──────────────────────────────────────────────────┐
│ owner_id (FK)│◀────────│                    LEASES                        │
│ full_name    │    ∞    │──────────────────────────────────────────────────│
│ email        │         │ id (PK)                                          │
│ phone        │ 1     ∞ │ unit_id (FK) ────────────────────────────────────┘
│ emergency_*  │────────▶│ tenant_id (FK) ───────────────────────────────────
│ id_type      │         │ start_date                                       ▲
│ id_number    │         │ end_date                                  (above) │
│ id_document_url        │ monthly_rent                                      │
│ notes        │         │ deposit_paid                                      │
│ created_at   │         │ rent_due_day                                      │
│ updated_at   │         │ status                                            │
└──────────────┘         │ agreement_url                                     │
                         │ notes                            ┌────────────────┐
                         │ created_at                       │    PAYMENTS    │
                         │ updated_at                       │────────────────│
                         └──────────────────────────────────│ id (PK)        │
                                         1                ∞ │ lease_id (FK)  │
                                         └──────────────────│ amount_due     │
                                                            │ amount_paid    │
                                                            │ due_date       │
                                                            │ paid_date      │
                                                            │ payment_method │
                                                            │ reference_number│
                                                            │ status         │
                                                            │ notes          │
                                                            │ created_at     │
                                                            │ updated_at     │
                                                            └────────────────┘

Notation:
  1 = "one" side of relationship
  ∞ = "many" side of relationship
  FK = Foreign Key
  PK = Primary Key
  ────▶ = Foreign key points TO this table
```

### Reading the Diagram

- One **Owner** can have many **Properties** (1→∞)
- One **Property** can have many **Units** (1→∞)
- One **Owner** can have many **Tenants** (1→∞, tenants are owner-scoped)
- One **Unit** can have many **Leases** (over time, but only one ACTIVE at a time)
- One **Tenant** can have many **Leases** (they could have rented multiple units)
- One **Lease** can have many **Payments** (one per month, typically)

---

## 6. Relationships Explained

### What is a Foreign Key?

A **foreign key** is a column in one table that stores the primary key of a row in another table. It creates a hard link between two records, enforced by the database.

**Example:** In the `properties` table, `owner_id` is a foreign key pointing to `owners.id`. The database guarantees:
1. You cannot insert a property with an `owner_id` that doesn't exist in the `owners` table.
2. Depending on the `ON DELETE` rule, the database will prevent or cascade changes when the referenced owner is deleted.

### Relationship 1: Owner → Properties → Units (Cascade Delete)

```sql
-- From 001_initial_schema.py, the foreign keys:
properties.owner_id  REFERENCES owners.id   ON DELETE CASCADE
units.property_id    REFERENCES properties.id ON DELETE CASCADE
```

`ON DELETE CASCADE` means: if a parent row is deleted, all child rows are automatically deleted too.

**Chain reaction:** Delete an owner → all their properties are deleted → all units in those properties are deleted.

This makes sense for our domain: a property management company has separate accounts. If one account is deleted, all its data should go with it. We don't want orphaned properties floating without an owner.

**Implementation in Python (owner.py):**
```python
# backend/app/models/owner.py, lines 16-21
properties: Mapped[list["Property"]] = relationship(
    "Property", back_populates="owner", cascade="all, delete-orphan"
)
tenants: Mapped[list["Tenant"]] = relationship(
    "Tenant", back_populates="owner", cascade="all, delete-orphan"
)
```

### Relationship 2: Tenant → Leases → Payments (RESTRICT vs. CASCADE)

```sql
-- From 001_initial_schema.py:
leases.unit_id     REFERENCES units.id   ON DELETE RESTRICT
leases.tenant_id   REFERENCES tenants.id ON DELETE RESTRICT
payments.lease_id  REFERENCES leases.id  ON DELETE CASCADE
```

- **`ON DELETE RESTRICT`** on leases: You **cannot** delete a unit or tenant that has any lease (active or historical). The database rejects the DELETE. This protects audit history — you should keep records of past leases.
- **`ON DELETE CASCADE`** on payments: Deleting a lease deletes all its payment records. This is used when a lease is deleted (which should be rare, usually leases are terminated not deleted).

### Relationship 3: Why Leases Connect Units and Tenants

The `leases` table is what's called a **junction table** (or bridge table). It represents a relationship between two entities (unit and tenant) that also carries its own data (start date, end date, rent amount, status).

Without the `leases` table, you'd have to put `current_tenant_id` in the units table. But what about historical tenants? What if the same unit has had 5 tenants over 3 years? You'd lose that history. The `leases` table captures every rental relationship, past and present, making it a complete audit trail.

---

## 7. Constraints Explained

A **constraint** is a rule the database itself enforces. Even if the application code has a bug and tries to insert invalid data, the database will reject it with an error. This is a second layer of defense.

### CHECK Constraints

A CHECK constraint specifies a condition that every row in a table must satisfy.

**Example: Payment amounts**
```sql
-- From 001_initial_schema.py
CONSTRAINT chk_amount_due  CHECK (amount_due > 0)
CONSTRAINT chk_amount_paid CHECK (amount_paid >= 0)
```
- `amount_due > 0` — a payment must be for a positive amount.
- `amount_paid >= 0` — cannot have negative payments.

**Example: Lease date ordering**
```sql
CONSTRAINT chk_lease_dates CHECK (end_date > start_date)
```
This prevents a lease that ends before it begins. A human might accidentally swap the dates in a form. This constraint catches it at the database level.

**Example: Rent due day**
```sql
CONSTRAINT chk_rent_due_day CHECK (rent_due_day BETWEEN 1 AND 28)
```
Rent can be due on day 1 through 28. Why stop at 28? Because February only has 28 days (in a non-leap year). If rent was due on day 31, it would be impossible to create a February payment. 28 is the safe maximum across all months.

**Example: Enum-like constraints**
```sql
CONSTRAINT chk_unit_type CHECK (unit_type IN ('1BHK','2BHK','3BHK','STUDIO','SHOP','OFFICE'))
CONSTRAINT chk_payment_status CHECK (status IN ('PENDING','PAID','PARTIAL','OVERDUE'))
```
PostgreSQL has a native ENUM type, but we use VARCHAR with CHECK constraints. The advantage: CHECK constraints are easier to add values to later (just drop and recreate the constraint) compared to altering an ENUM type which can cause table locks.

### UNIQUE Constraints

A UNIQUE constraint ensures no two rows have the same value in a specific column (or combination of columns).

**Example: Owner email**
```sql
-- Defined in 001_initial_schema.py
email VARCHAR(255) NOT NULL UNIQUE
```
Two owners cannot share an email address. This prevents duplicate account creation.

**Example: Unit number uniqueness per property**
```sql
CONSTRAINT uq_unit_number_per_property UNIQUE (property_id, unit_number)
```
This is a **composite unique constraint** — the combination of `property_id` and `unit_number` must be unique. Unit "101" can exist in Property A and also in Property B — that's fine. But Unit "101" cannot appear twice in the same property.

### NOT NULL Constraints

`NOT NULL` means a column cannot have an empty value (NULL).

- `owners.email NOT NULL` — you cannot create an owner without an email.
- `leases.start_date NOT NULL` — a lease must have a start date.
- `payments.amount_due NOT NULL` — every payment must have an expected amount.

Optional fields use `NULL` (nullable): `tenants.email` is nullable because not all tenants have email addresses.

---

## 8. Indexes

### What is an Index?

An **index** is a separate data structure that makes certain queries faster. Think of the index at the back of a textbook — instead of reading every page to find "depreciation", you look in the index and jump directly to page 247.

Without an index, a query like `SELECT * FROM properties WHERE owner_id = 'abc'` must scan **every row** in the properties table to find matching ones. With an index on `owner_id`, the database jumps directly to the matching rows.

**Trade-off:** Indexes make reads faster but make writes slightly slower (the index must be updated whenever data changes). They also take up disk space. We add them only on columns that are frequently searched.

### Our Indexes and Why We Have Them

| Index Name | Table | Column(s) | Why it exists |
|---|---|---|---|
| `idx_owners_email` | owners | email | Login query: `WHERE email = ?` — runs on every login |
| `idx_properties_owner_id` | properties | owner_id | Every property list query filters by owner |
| `idx_properties_city` | properties | city | City filter on property list |
| `idx_units_property_id` | units | property_id | Loading all units for a property |
| `idx_units_status` | units | status | Filtering by VACANT/OCCUPIED/MAINTENANCE |
| `idx_tenants_owner_id` | tenants | owner_id | Every tenant list query filters by owner |
| `idx_tenants_phone` | tenants | phone | Searching tenants by phone number |
| `idx_leases_unit_id` | leases | unit_id | Finding leases for a specific unit |
| `idx_leases_tenant_id` | leases | tenant_id | Finding leases for a specific tenant |
| `idx_leases_status` | leases | status | Filtering active/expired/terminated leases |
| `idx_leases_end_date` | leases | end_date | Finding leases expiring soon (dashboard alerts) |
| `idx_payments_lease_id` | payments | lease_id | Loading all payments for a lease |
| `idx_payments_status` | payments | status | Filtering overdue payments |
| `idx_payments_due_date` | payments | due_date | The scheduler's overdue check: `WHERE due_date < today` |

All these indexes are created in `001_initial_schema.py` and verified/added in `002_add_missing_columns_indexes_triggers.py`.

---

## 9. Triggers

A **trigger** is a database function that automatically runs when a specific event happens on a table (INSERT, UPDATE, or DELETE). You set it up once, and the database runs it forever without any application code involvement.

**Analogy:** A trigger is like an automatic door sensor — as soon as you walk toward the door (the event), the door opens (the action). Nobody has to manually press a button.

### Trigger 1: `trg_*_updated_at` — Automatic Timestamp Update

**Problem:** Every table has an `updated_at` column. We need it to always reflect the time of the last change. If a developer forgets to set it in the application code, the timestamp becomes stale and meaningless.

**Solution:** A trigger that runs automatically on every UPDATE.

```sql
-- From 001_initial_schema.py, line ~251
CREATE OR REPLACE FUNCTION fn_update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();   -- Set updated_at to the current time
    RETURN NEW;               -- Apply the row with the updated timestamp
END;
$$ LANGUAGE plpgsql
```

This trigger function is applied to all 6 tables:
```python
# 001_initial_schema.py, lines ~268-278
for table in ["owners", "properties", "units", "tenants", "leases", "payments"]:
    op.execute(f"""
        CREATE TRIGGER trg_{table}_updated_at
        BEFORE UPDATE ON {table}
        FOR EACH ROW EXECUTE FUNCTION fn_update_updated_at()
    """)
```

`BEFORE UPDATE` means: before the row is actually changed in the database, run this function and modify the row to set `updated_at`. The result is that `updated_at` is always accurate, always up-to-date, always set by the database itself — bulletproof.

### Trigger 2: `trg_sync_unit_status` — Unit Status Synchronization

**Problem:** A unit's `status` column should reflect its current lease status:
- When an ACTIVE lease exists → unit should be `'OCCUPIED'`
- When a lease is TERMINATED or EXPIRED → unit should return to `'VACANT'`

We could handle this in application code (and we do, as a first layer). But what if a developer forgets? What if someone runs a SQL command directly on the database? The unit status would be wrong.

**Solution:** A trigger that automatically syncs the unit status whenever a lease's status changes.

```sql
-- From 001_initial_schema.py, lines ~282-295
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
```

**Explanation line by line:**
- `NEW` — refers to the row as it will be after the change.
- `IF NEW.status = 'ACTIVE'` — the lease is being activated.
  - `UPDATE units SET status = 'OCCUPIED' WHERE id = NEW.unit_id` — find the unit and mark it occupied.
- `ELSIF NEW.status IN ('EXPIRED', 'TERMINATED')` — the lease is ending.
  - `UPDATE units SET status = 'VACANT'` — free up the unit.
- `RETURN NEW` — allow the original lease UPDATE to proceed.

```sql
-- The trigger binding:
CREATE TRIGGER trg_sync_unit_status
AFTER INSERT OR UPDATE OF status ON leases
FOR EACH ROW EXECUTE FUNCTION fn_sync_unit_status()
```

`AFTER INSERT OR UPDATE OF status` — fires after a new lease is inserted (with `status = 'ACTIVE'`) OR when a lease's `status` column is changed. `FOR EACH ROW` means it runs once per affected row.

**Result:** The unit status is **always** accurate. Even direct database commands maintain consistency.

---

## 10. The Partial Unique Index

```sql
-- From 001_initial_schema.py, lines ~217-221
CREATE UNIQUE INDEX idx_one_active_lease_per_unit
ON leases(unit_id)
WHERE status = 'ACTIVE'
```

### Why Is This Clever?

**The problem it solves:** A unit should never have two active leases at the same time. If flat 101 is occupied by Tenant A, it cannot simultaneously be occupied by Tenant B.

**Naive solution:** Put a UNIQUE constraint on `unit_id` in the leases table. But this breaks immediately — a unit could be rented to Tenant A in 2022, then Tenant B in 2023. Both rows have the same `unit_id`. A regular UNIQUE constraint would reject the second lease.

**Clever solution:** A **partial unique index** — only enforce uniqueness for rows matching `WHERE status = 'ACTIVE'`. The index only indexes ACTIVE leases.

**What this means:**
- Unit 101, ACTIVE lease for Tenant A → Unit 101, ACTIVE lease for Tenant B → **REJECTED** (duplicate)
- Unit 101, EXPIRED lease for Tenant A (2022) → Unit 101, ACTIVE lease for Tenant B (2023) → **ALLOWED** (one is expired, not indexed)

Historical (EXPIRED/TERMINATED) leases are completely invisible to this index. Multiple historical leases per unit are fine. Only one ACTIVE lease per unit is allowed.

This is a real PostgreSQL feature called a **partial index** — an index that only covers a subset of rows based on a WHERE condition.

**Application-level enforcement too:** `lease_service.py` line ~72 also checks `unit.status != "VACANT"` before creating a lease. But the partial unique index is the database-level guarantee that makes it impossible to violate even with direct SQL.

---

## 11. What is Alembic? How Migrations Work

### The Problem Migrations Solve

Imagine you've been running the app for a month. The `tenants` table exists in production with real data. You now need to add a new column: `id_document_url`. You can't just add it to the Python model and hope the database magically updates — you need to run an `ALTER TABLE` SQL command on the real database.

But if you ran that command manually on the production database, and a teammate ran it manually on their test database, and you forgot to document it, eventually databases will drift — some have the column, some don't. This is a maintenance nightmare.

**Alembic** solves this by tracking every database change as a numbered Python file (a "migration") in version control. Each migration has an `upgrade()` function (apply the change) and a `downgrade()` function (reverse it).

**Analogy:** Git version-controls your code. Alembic version-controls your database schema. Just like you can `git checkout` to a previous code version, you can `alembic downgrade` to a previous database version.

### How Alembic Works

```
backend/app/alembic/
├── env.py          ← Configuration: how to connect, which models to read
├── versions/
│   ├── 001_initial_schema.py   ← Migration 1
│   └── 002_add_missing_columns_indexes_triggers.py  ← Migration 2
```

Alembic maintains a special table in the database called `alembic_version` with one row: the current revision ID. When you run `alembic upgrade head`, it:
1. Reads `alembic_version` to see where you are (e.g., revision `001`).
2. Finds all migration files newer than your current revision.
3. Runs their `upgrade()` functions in order.
4. Updates `alembic_version` to the latest revision.

### Migration 001 — Initial Schema (`001_initial_schema.py`)

**What it does:** Creates all 6 tables from scratch, adds all indexes, CHECK constraints, and the two triggers (`fn_update_updated_at` and `fn_sync_unit_status`).

Key sections:
```python
# 001_initial_schema.py, lines 24-29 — Creates the owners table
op.create_table(
    "owners",
    sa.Column("id", postgresql.UUID(as_uuid=False), server_default=sa.text("gen_random_uuid()"), primary_key=True),
    sa.Column("email", sa.String(255), nullable=False, unique=True),
    ...
)
op.create_index("idx_owners_email", "owners", ["email"])
```

```python
# 001_initial_schema.py, lines ~215-222 — The partial unique index
op.execute("""
    CREATE UNIQUE INDEX idx_one_active_lease_per_unit
    ON leases(unit_id)
    WHERE status = 'ACTIVE'
""")
```

The `downgrade()` function drops all triggers, indexes, and tables in reverse dependency order (payments first, then leases, then units/tenants, then properties, then owners — because of the foreign keys).

### Migration 002 — Patches and Hardening (`002_add_missing_columns_indexes_triggers.py`)

**Context:** The project was initially developed with tables that might have been created differently (Supabase's dashboard, direct SQL, or an earlier migration). Migration 002 is a **safety net migration** that:
1. Adds columns if they're missing.
2. Sets NOT NULL constraints if they're missing.
3. Adds indexes if they're missing.
4. Recreates triggers if they're missing.

This makes the migration **idempotent** — running it multiple times is safe because it checks before acting:

```python
# 002_add_missing_columns_indexes_triggers.py, lines 18-23
def add_column_if_missing(table: str, column: str, col_def: str) -> None:
    result = conn.execute(sa.text(
        "SELECT 1 FROM information_schema.columns "
        "WHERE table_schema='public' AND table_name=:t AND column_name=:c"
    ), {"t": table, "c": column}).fetchone()
    if not result:
        conn.execute(sa.text(f'ALTER TABLE "{table}" ADD COLUMN {col_def}'))
```

This queries `information_schema.columns` (a metadata table that PostgreSQL maintains about all tables and columns) to check if the column already exists. If not, it adds it.

### The Alembic env.py

**File:** `backend/app/alembic/env.py`

```python
# env.py, line 17
from app.models import *   # Import all models so Alembic can see the full schema

target_metadata = Base.metadata   # The SQLAlchemy Base that all models inherit from
```

By importing all models, Alembic can compare the current database schema against what the Python models define and detect differences (though we write explicit migrations instead of relying on auto-generation).

The `_get_url()` function in env.py uses `DATABASE_DIRECT_URL` (not the pooled URL) because Alembic runs migrations in a single-threaded context and doesn't need connection pooling.

---

## 12. What is a Connection Pool?

### The Problem

Every time the backend needs to query the database, it must:
1. Establish a TCP network connection to Supabase's server.
2. Authenticate (present credentials).
3. Negotiate SSL encryption.
4. Create a PostgreSQL session.

Steps 1-4 take 50-200 milliseconds. If a web request takes 100ms total, spending 150ms just opening the connection is unacceptable — and wasteful if the connection is immediately closed.

### The Solution: Connection Pool

A connection pool is a cache of database connections that are opened once and reused many times.

```python
# database.py, lines 18-24
engine = create_engine(
    _get_db_url(settings.DATABASE_URL),
    pool_pre_ping=True,    # Test the connection before using it (detects stale connections)
    pool_size=3,           # Always keep 3 connections alive and ready
    max_overflow=5,        # During traffic spikes, allow up to 5 extra connections
    ...
)
```

With `pool_size=3`, when the app starts, it opens 3 connections to Supabase immediately. Every incoming API request borrows one of these connections, uses it, and returns it to the pool. The next request borrows it again. No opening/closing overhead.

`max_overflow=5` means during traffic spikes, up to 5 additional connections can be opened temporarily, giving us a maximum of 8 simultaneous connections.

### Why Supabase's Session Pooler?

Supabase offers two types of connection URLs:
1. **Direct connection** — connects directly to PostgreSQL. Best for migrations (Alembic uses this via `DATABASE_DIRECT_URL`).
2. **Session pooler** (port 5432) — connects through PgBouncer, Supabase's built-in connection pooler.

On Supabase's free tier, PostgreSQL only allows a limited number of direct connections. Our backend's 3-connection pool fits comfortably within this limit. We point `DATABASE_URL` to the session pooler URL (which contains `pooler.supabase.com` in the hostname) and `DATABASE_DIRECT_URL` to the direct URL for migrations.

The pooler means Supabase manages the actual PostgreSQL connections, and our backend connects to the pooler. This adds a layer of connection management that handles many more concurrent users without exceeding database limits.

---

## 13. Real Use Case: Owner Records a Payment

Let's trace every database interaction when an owner records that a tenant paid ₹15,000 rent.

**Scenario:** Tenant Priya paid ₹15,000 on 5th July for her lease of flat 101.

**Step 1: Frontend sends request**
```
POST /api/v1/payments/
Body: {
  "lease_id": "lease-uuid-here",
  "amount_due": 15000,
  "amount_paid": 15000,
  "due_date": "2024-07-01",
  "paid_date": "2024-07-05",
  "payment_method": "UPI",
  "reference_number": "UPI123456789"
}
```

**Step 2: Authentication — owner identity verified**
```sql
-- dependencies/auth.py decodes the JWT and runs:
SELECT * FROM owners WHERE id = 'owner-uuid-here' LIMIT 1;
-- Returns: the owner object (1 row read from owners table)
```

**Step 3: Ownership verification — is this lease the owner's?**
```sql
-- payment_service.py, _get_payment ownership check equivalent
SELECT payments.*, leases.*, units.*, properties.*
FROM payments
JOIN leases ON leases.id = payments.lease_id
JOIN units ON units.id = leases.unit_id
JOIN properties ON properties.id = units.property_id
WHERE leases.id = 'lease-uuid-here'
  AND properties.owner_id = 'owner-uuid-here';
-- Verifies the chain: payment → lease → unit → property → owner
-- If this returns no row, the owner doesn't own this lease → 404 returned
```

**Step 4: Status computation**
```python
# payment_service.py, _compute_status():
# amount_paid (15000) >= amount_due (15000) → status = "PAID"
```

**Step 5: INSERT the payment**
```sql
INSERT INTO payments (
    id, lease_id, amount_due, amount_paid, due_date, paid_date,
    payment_method, reference_number, status, created_at, updated_at
) VALUES (
    gen_random_uuid(), 'lease-uuid-here', 15000, 15000,
    '2024-07-01', '2024-07-05', 'UPI', 'UPI123456789', 'PAID', NOW(), NOW()
);
-- Database generates UUID for id, sets created_at and updated_at to NOW()
```

**Step 6: Index maintenance (automatic)**
The database automatically updates:
- `idx_payments_lease_id` — adds the new payment's `lease_id`
- `idx_payments_status` — adds the new `'PAID'` entry
- `idx_payments_due_date` — adds the `'2024-07-01'` entry

**Step 7: Trigger fires (automatic)**
After the INSERT, `fn_update_updated_at` does NOT fire on INSERT (only on UPDATE). `fn_sync_unit_status` also does NOT fire (it's on the leases table, not payments).

**Step 8: Response built and returned**
```sql
-- db.refresh(payment) runs:
SELECT * FROM payments WHERE id = 'new-payment-uuid';
-- Returns the freshly created row with the database-generated id and timestamps
```

**Step 9: Frontend receives the response**
```json
{
  "data": {
    "id": "new-payment-uuid",
    "lease_id": "lease-uuid-here",
    "amount_due": 15000,
    "amount_paid": 15000,
    "due_date": "2024-07-01",
    "paid_date": "2024-07-05",
    "payment_method": "UPI",
    "status": "PAID",
    ...
  },
  "message": "Payment recorded"
}
```

**Step 10: TanStack Query cache invalidation**
The frontend's `useCreatePayment` hook calls:
```typescript
qc.invalidateQueries({ queryKey: PAYMENT_KEYS.all });
qc.invalidateQueries({ queryKey: LEASE_KEYS.all });    // payments_summary on leases updates
qc.invalidateQueries({ queryKey: DASHBOARD_KEYS.all }); // financials update
```

This triggers fresh refetches of the payment list, the lease detail (which shows a payments summary), and the dashboard (which shows collected revenue). Everything the user sees updates immediately.

**Tables touched in total:**
1. `owners` — READ (authentication)
2. `leases` → `units` → `properties` → `owners` — READ (ownership verification via JOIN)
3. `payments` — WRITE (INSERT)

---

## 14. SQL Concepts

Our service files use several SQL concepts extensively. Here they are explained with actual examples from the code.

### 14.1 JOIN — Combining Tables

A **JOIN** combines rows from two or more tables based on a related column.

**Types we use:**
- `JOIN` (or `INNER JOIN`) — only returns rows where both tables have a matching record.

**Example — Listing properties with their owner verified:**
```python
# property_service.py, list_properties()
query = db.query(Property).filter(Property.owner_id == owner.id)
```
In SQL:
```sql
SELECT * FROM properties WHERE owner_id = 'owner-uuid';
```

**Example — Listing payments with full ownership chain:**
```python
# payment_service.py, list_payments() — lines 25-30
query = (
    db.query(Payment)
    .join(Lease, Lease.id == Payment.lease_id)
    .join(Unit, Unit.id == Lease.unit_id)
    .join(Property, Property.id == Unit.property_id)
    .filter(Property.owner_id == owner.id)
)
```
In SQL:
```sql
SELECT payments.*
FROM payments
JOIN leases ON leases.id = payments.lease_id
JOIN units ON units.id = leases.unit_id
JOIN properties ON properties.id = units.property_id
WHERE properties.owner_id = 'owner-uuid';
```

This 4-table JOIN ensures an owner can only see payments for their own properties. You cannot guess another owner's payment IDs and access them — the JOIN chain enforces ownership all the way down.

### 14.2 WHERE — Filtering Rows

**WHERE** filters which rows are included in the result.

**Example — Scheduler's overdue payment check:**
```python
# scheduler.py, lines 24-27
db.query(Payment)
.filter(
    Payment.status == "PENDING",
    Payment.due_date < date.today(),
)
```
In SQL:
```sql
SELECT * FROM payments
WHERE status = 'PENDING'
  AND due_date < CURRENT_DATE;
```

Only PENDING payments whose due date has passed are returned — exactly the payments that need to be marked OVERDUE.

### 14.3 Aggregate Functions — SUM, COUNT

**Aggregate functions** compute a single result from multiple rows.

**COUNT — How many rows match:**
```python
# dashboard_service.py, lines 28-31
total_properties = (
    db.query(func.count(Property.id))
    .filter(Property.owner_id == owner.id)
    .scalar()
)
```
In SQL:
```sql
SELECT COUNT(id) FROM properties WHERE owner_id = 'owner-uuid';
-- Returns: 3 (if the owner has 3 properties)
```

**SUM — Total of all values:**
```python
# lease_service.py, _lease_to_response() — lines ~203-207
total_paid = (
    db.query(func.coalesce(func.sum(Payment.amount_paid), 0))
    .filter(Payment.lease_id == lease.id)
    .scalar()
)
```
In SQL:
```sql
SELECT COALESCE(SUM(amount_paid), 0)
FROM payments
WHERE lease_id = 'lease-uuid';
-- Returns: 45000 (if tenant paid 3 months × ₹15,000)
```

`COALESCE(SUM(...), 0)` handles the case where there are no payments yet — `SUM` would return NULL, but `COALESCE` replaces NULL with 0.

**Conditional aggregate — SUM with a filter:**
```python
# dashboard_service.py, lines 72-76
func.coalesce(
    func.sum(Payment.amount_due).filter(Payment.status == "OVERDUE"),
    0,
).label("overdue_amount")
```
In SQL:
```sql
SELECT COALESCE(SUM(amount_due) FILTER (WHERE status = 'OVERDUE'), 0) AS overdue_amount
FROM payments ...
```

`FILTER (WHERE ...)` is a PostgreSQL feature that lets you apply a condition to just one aggregate in a query with multiple aggregates. This query computes total_expected, total_collected, overdue_amount, AND overdue_count all in a single database round-trip.

### 14.4 extract() — Date Components

```python
# payment_service.py, lines 51-56
from sqlalchemy import extract
query = query.filter(
    extract("year", Payment.due_date) == int(year),
    extract("month", Payment.due_date) == int(mon),
)
```
In SQL:
```sql
WHERE EXTRACT(YEAR FROM due_date) = 2024
  AND EXTRACT(MONTH FROM due_date) = 7
```

`EXTRACT` pulls a specific component (year, month, day, hour) from a date or timestamp. This is how we filter payments to show only those from a specific month (e.g., "July 2024").

### 14.5 ORDER BY and LIMIT/OFFSET — Pagination

```python
# property_service.py, lines 31-35
properties = (
    query
    .order_by(Property.created_at.desc())  # Newest first
    .offset((page - 1) * limit)            # Skip records before this page
    .limit(limit)                           # Take only `limit` records
    .all()
)
```
In SQL (for page 2, limit 10):
```sql
SELECT * FROM properties
WHERE owner_id = 'owner-uuid'
ORDER BY created_at DESC
LIMIT 10 OFFSET 10;   -- Skip the first 10, take the next 10
```

This is **keyset pagination**. `OFFSET 10` skips 10 rows, `LIMIT 10` takes the next 10. For page N with limit L: `OFFSET = (N-1) * L`.

### 14.6 ilike — Case-Insensitive Search

```python
# property_service.py, line 24
query = query.filter(Property.city.ilike(f"%{city}%"))
```
In SQL:
```sql
WHERE city ILIKE '%pune%'
```

`ILIKE` is PostgreSQL's case-insensitive version of `LIKE`. `%pune%` matches "Pune", "PUNE", "pune", "North Pune". The `%` is a wildcard matching any characters before and after.

### 14.7 Transactions

All our database operations happen inside a transaction, managed by SQLAlchemy automatically:

```python
db.add(lease)       # Stage the new lease
unit.status = "OCCUPIED"  # Also modify the unit
db.commit()         # Write BOTH changes atomically
```

If `db.commit()` fails (e.g., database error), BOTH the lease insert and the unit status change are rolled back. The database is never left in a half-changed state. This is called **ACID atomicity** — one of the fundamental guarantees of relational databases.

---

## Summary

Our database is a carefully designed system of 6 related tables with:
- **15+ indexes** for query performance
- **14+ CHECK constraints** for data validity
- **5 UNIQUE constraints** for data integrity
- **2 trigger functions** covering all 6 tables for automatic behavior
- **1 partial unique index** for the clever "one active lease per unit" rule
- **2 migration files** version-controlling every change to the schema

Every design decision — from `ON DELETE CASCADE` vs. `RESTRICT`, to `rent_due_day BETWEEN 1 AND 28`, to the partial index — reflects real-world requirements of property management translated into database rules.

---

*This document covers the complete database architecture of the RentEase Property Rental Management System. All SQL in this document is taken directly from the actual migration files and service code. Migration files are at `backend/app/alembic/versions/`. Model files are at `backend/app/models/`.*
