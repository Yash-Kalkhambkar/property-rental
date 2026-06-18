# Backend Documentation — Property Rental Management System

> **Audience:** College jury members and team members with no development background.
> **Goal:** Explain every decision, every file, and every concept clearly enough that you can answer any question about it.

---

## Table of Contents

1. [What is a Backend?](#1-what-is-a-backend)
2. [What is FastAPI? Why We Chose It](#2-what-is-fastapi-why-we-chose-it)
3. [Project Folder Structure](#3-project-folder-structure)
4. [What is an API and a REST API?](#4-what-is-an-api-and-a-rest-api)
5. [How a Request Flows Through the App](#5-how-a-request-flows-through-the-app)
6. [Authentication System (JWT, Cookies, Security)](#6-authentication-system)
7. [Database Connection — database.py](#7-database-connection)
8. [Router Files — The Entry Points](#8-router-files)
9. [Service Files — The Business Logic](#9-service-files)
10. [Model Files — The Database Tables](#10-model-files)
11. [Schemas — Pydantic Validation](#11-schemas--pydantic-validation)
12. [The Scheduler — Automated Daily Tasks](#12-the-scheduler)
13. [Environment Variables](#13-environment-variables)
14. [Deployment on Render](#14-deployment-on-render)

---

## 1. What is a Backend?

Imagine a restaurant. The **frontend** is the dining room — the menu you read, the waiter you talk to, the table you sit at. The **backend** is the kitchen — where the actual food is prepared, where the recipes live, where ingredients are stored, and where all the rules about food safety are enforced.

In software terms:

- The **frontend** is the website or mobile app the user sees and clicks on.
- The **backend** is the server running in the cloud that receives requests, applies business rules, reads or writes to the database, and sends data back.

The user never directly touches the backend. They interact with the frontend, which silently communicates with the backend on their behalf.

**Our backend** is a Python application running on a server hosted by a cloud company called **Render**. When a property owner clicks "Add Property" on the website, the frontend sends a message to our backend saying "create a new property with these details." The backend checks who the user is, validates the data, saves it to the database, and sends back a confirmation.

---

## 2. What is FastAPI? Why We Chose It

**FastAPI** is a Python framework (a toolkit) for building web APIs. Think of it like a pre-built chassis for a car — you don't build the engine from scratch; you bolt your custom parts onto a ready-made frame.

### Why FastAPI specifically?

| Feature | What it means in plain English |
|---|---|
| **Fast performance** | FastAPI is one of the fastest Python frameworks, comparable to Go and Node.js, because it uses async programming internally. |
| **Automatic documentation** | During development, FastAPI auto-generates an interactive API explorer at `/docs` so you can test every endpoint in a browser. |
| **Built-in validation** | If a user sends wrong data (e.g., a negative rent amount), FastAPI rejects it automatically using Pydantic — you don't write manual if/else checks everywhere. |
| **Type hints** | Python type hints (e.g., `name: str`) make the code self-documenting and catch bugs early. |
| **Dependency injection** | FastAPI has a system where shared logic (like "who is the logged-in user?") is written once and reused everywhere automatically. |

Our app entry point is `backend/app/main.py`. The `create_app()` function (line 20) builds the FastAPI application object and wires everything together.

---

## 3. Project Folder Structure

```
backend/
├── app/
│   ├── main.py              ← Application entry point. Creates and configures the app.
│   ├── core/
│   │   ├── config.py        ← Reads environment variables (secrets, URLs, settings).
│   │   ├── database.py      ← Sets up the database connection pool.
│   │   └── security.py      ← Password hashing and JWT token creation/verification.
│   ├── dependencies/
│   │   └── auth.py          ← "Who is calling this endpoint?" — reusable auth check.
│   ├── models/
│   │   ├── mixins.py        ← Shared columns (id, created_at, updated_at) used by all tables.
│   │   ├── owner.py         ← The Owner database table definition.
│   │   ├── property.py      ← The Property table.
│   │   ├── unit.py          ← The Unit table.
│   │   ├── tenant.py        ← The Tenant table.
│   │   ├── lease.py         ← The Lease table.
│   │   └── payment.py       ← The Payment table.
│   ├── schemas/
│   │   ├── auth.py          ← What data login/register requests must contain.
│   │   ├── property.py      ← What data property create/update requests must contain.
│   │   ├── unit.py          ← Unit request/response shapes.
│   │   ├── tenant.py        ← Tenant request/response shapes.
│   │   ├── lease.py         ← Lease request/response shapes.
│   │   ├── payment.py       ← Payment request/response shapes.
│   │   └── dashboard.py     ← Dashboard response shape.
│   ├── routers/
│   │   ├── auth.py          ← URL endpoints for login, register, logout, refresh.
│   │   ├── properties.py    ← URL endpoints for properties and units.
│   │   ├── units.py         ← URL endpoints for individual unit operations.
│   │   ├── tenants.py       ← URL endpoints for tenants.
│   │   ├── leases.py        ← URL endpoints for leases.
│   │   ├── payments.py      ← URL endpoints for payments.
│   │   ├── dashboard.py     ← URL endpoint for the dashboard summary.
│   │   └── internal.py      ← Internal endpoint for the daily cron job.
│   ├── services/
│   │   ├── auth_service.py      ← Business logic for login, register, refresh, logout.
│   │   ├── property_service.py  ← Business logic for property CRUD.
│   │   ├── unit_service.py      ← Business logic for unit CRUD.
│   │   ├── tenant_service.py    ← Business logic for tenant CRUD.
│   │   ├── lease_service.py     ← Business logic for lease CRUD + termination.
│   │   ├── payment_service.py   ← Business logic for payment CRUD.
│   │   ├── dashboard_service.py ← Business logic for computing dashboard statistics.
│   │   ├── email_service.py     ← Sends email alerts via Resend API.
│   │   └── storage_service.py   ← Uploads/downloads files via Supabase Storage.
│   ├── tasks/
│   │   └── scheduler.py     ← Automated daily job: marks overdue payments, sends emails.
│   └── alembic/
│       ├── env.py           ← Alembic config: how to connect when running migrations.
│       └── versions/
│           ├── 001_initial_schema.py  ← Migration 1: creates all 6 tables.
│           └── 002_add_missing_columns_indexes_triggers.py ← Migration 2: patches and hardens the schema.
├── requirements.txt         ← List of all Python libraries the app depends on.
├── alembic.ini              ← Alembic configuration file.
└── Procfile                 ← Tells Render how to start the app.
```

### The Three-Layer Architecture

The folder structure reflects a deliberate design pattern called **three-layer architecture**:

1. **Routers** — receive HTTP requests, validate inputs, and hand off to services.
2. **Services** — apply business rules and talk to the database.
3. **Models** — represent database tables as Python classes.

This separation means changing business logic (e.g., "what happens when a lease is terminated?") only touches `services/`, not the URL definitions or the database schema.

---

## 4. What is an API and a REST API?

### API (Application Programming Interface)

An API is a contract. It says: "If you send me a message in this exact format, I will respond with data in this exact format." Think of it like a formal order form at a restaurant — you fill in specific fields (dish name, quantity, special requests) and the kitchen knows exactly what to do.

### REST API

**REST** (Representational State Transfer) is a style of API design. It uses standard HTTP methods (the same methods your browser uses to load web pages) to mean specific things:

| HTTP Method | Meaning | Example in our app |
|---|---|---|
| `GET` | Read / fetch data | "Give me my list of properties" |
| `POST` | Create new data | "Create a new tenant" |
| `PATCH` | Update existing data (partial) | "Change this unit's rent amount" |
| `DELETE` | Delete data | "Remove this property" |

### Our Actual Endpoints

All our URLs start with `/api/v1/`. The `v1` means "version 1" — if we change the API in the future, we'd release `v2` without breaking existing clients.

**Auth endpoints** (`/api/v1/auth/`):
```
POST   /api/v1/auth/register    → Create a new owner account
POST   /api/v1/auth/login       → Log in, receive an access token
POST   /api/v1/auth/refresh     → Get a new access token using the refresh cookie
POST   /api/v1/auth/logout      → Log out, clear the cookie
GET    /api/v1/auth/me          → Get the logged-in owner's profile
```

**Property endpoints** (`/api/v1/properties/`):
```
GET    /api/v1/properties/                     → List all properties (paginated)
POST   /api/v1/properties/                     → Create a property
GET    /api/v1/properties/{id}                 → Get one property with its units
PATCH  /api/v1/properties/{id}                 → Update a property
DELETE /api/v1/properties/{id}                 → Delete a property
GET    /api/v1/properties/{id}/units           → List units in a property
POST   /api/v1/properties/{id}/units           → Add a unit to a property
```

**Unit endpoints** (`/api/v1/units/`):
```
GET    /api/v1/units/{unit_id}      → Get a single unit
PATCH  /api/v1/units/{unit_id}      → Update a unit
DELETE /api/v1/units/{unit_id}      → Delete a unit
```

**Tenant endpoints** (`/api/v1/tenants/`):
```
GET    /api/v1/tenants/                        → List tenants (with search)
POST   /api/v1/tenants/                        → Add a tenant
GET    /api/v1/tenants/{id}                    → Get one tenant
PATCH  /api/v1/tenants/{id}                    → Update a tenant
DELETE /api/v1/tenants/{id}                    → Delete a tenant
POST   /api/v1/tenants/{id}/documents          → Upload an ID document
```

**Lease endpoints** (`/api/v1/leases/`):
```
GET    /api/v1/leases/                         → List leases (with filters)
POST   /api/v1/leases/                         → Create a lease
GET    /api/v1/leases/{id}                     → Get one lease
PATCH  /api/v1/leases/{id}                     → Update a lease
PATCH  /api/v1/leases/{id}/terminate           → Terminate an active lease
POST   /api/v1/leases/{id}/documents           → Upload a lease agreement PDF
GET    /api/v1/leases/{id}/documents           → Get a signed URL for the agreement
```

**Payment endpoints** (`/api/v1/payments/`):
```
GET    /api/v1/payments/           → List payments (filter by status, month, lease)
POST   /api/v1/payments/           → Record a payment
GET    /api/v1/payments/{id}       → Get one payment
PATCH  /api/v1/payments/{id}       → Update a payment
DELETE /api/v1/payments/{id}       → Delete a payment record
```

**Dashboard** (`/api/v1/dashboard/`):
```
GET    /api/v1/dashboard/          → Get summary stats, financials, and alerts
```

---

## 5. How a Request Flows Through the App

Let's trace exactly what happens when a property owner clicks **"Add Property"** in the browser. This illustrates the complete request lifecycle.

```
Browser
  │
  │  POST /api/v1/properties/
  │  Body: { "name": "Sunrise Apartments", "city": "Pune", ... }
  │  Header: Authorization: Bearer eyJhbGc...  (access token)
  │
  ▼
main.py  ← FastAPI receives the request
  │  Line 45: app.include_router(properties.router, prefix="/api/v1/properties")
  │  The router matching /api/v1/properties/ is found.
  │
  ▼
routers/properties.py  ← Line 24: @router.post("/")
  │  FastAPI calls the create_property() function.
  │  Two "dependencies" are automatically resolved:
  │    1. get_db()     → opens a database session (connection)
  │    2. get_current_owner() → reads the Authorization header, verifies the JWT token
  │       and fetches the Owner from the database.
  │  If the token is invalid → 401 Unauthorized is returned immediately.
  │  Otherwise, execution continues.
  │
  ▼
services/property_service.py  ← Line 44: def create_property(...)
  │  The actual business logic lives here.
  │    1. Creates a new Property object with the provided data.
  │    2. Attaches the owner_id (so this property belongs to the logged-in owner).
  │    3. db.add(prop) — stages the new row.
  │    4. db.commit()  — writes it to the PostgreSQL database permanently.
  │    5. db.refresh(prop) — reloads from the database (gets the auto-generated id).
  │    6. Calls _property_to_response() to add computed fields:
  │       - occupied_units (COUNT of units with status='OCCUPIED')
  │       - monthly_revenue (SUM of monthly_rent for occupied units)
  │
  ▼
routers/properties.py  ← Line 31: return {"data": prop, "message": "Property created"}
  │  FastAPI serializes this Python dict to JSON automatically.
  │
  ▼
Browser receives:
{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Sunrise Apartments",
    "city": "Pune",
    ...
  },
  "message": "Property created"
}
```

This pattern — **Router → Service → Database → Router → Response** — is followed by every single endpoint in the system. The consistency makes the code predictable and easy to maintain.

---

## 6. Authentication System

Authentication answers the question: **"Who are you, and can I trust you?"**

### 6.1 What is a JWT (JSON Web Token)?

A **JWT** is a small, self-contained string that proves your identity. Think of it like a signed concert ticket:

- The concert (our server) issues the ticket when you buy it (log in).
- The ticket has your name, seat number, and validity date printed on it.
- The ticket has a special holographic stamp (a **digital signature**) that can only be created by the ticket issuer.
- At the door (any protected endpoint), the bouncer reads the ticket, checks the signature, and confirms it's genuine — **without needing to call the ticket office**.

A JWT looks like this:
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1NTBlODQwMCIsImV4cCI6MTcwMDAwMDAwMCwidHlwZSI6ImFjY2VzcyJ9.abc123...
```

It's three parts separated by dots, each Base64-encoded:
1. **Header** — algorithm used (`HS256`)
2. **Payload** — the claims: `sub` (owner ID), `exp` (expiry time), `type` (access or refresh)
3. **Signature** — proof that the server created this token

### 6.2 Access Token vs. Refresh Token

We use **two tokens** for security:

| Token | Lifespan | Purpose | Where stored |
|---|---|---|---|
| **Access token** | 15 minutes | Sent with every API request to prove identity | JavaScript memory (Zustand store) |
| **Refresh token** | 7 days | Used only to get a new access token when the old one expires | httpOnly cookie (invisible to JavaScript) |

**Why two tokens?**

If the access token is stolen (e.g., via XSS attack where malicious JavaScript reads memory), it expires in 15 minutes — minimal damage. The refresh token is in an `httpOnly` cookie which JavaScript cannot read at all, so even if the page is compromised, the attacker cannot steal the long-lived token.

### 6.3 How Login Works Step by Step

```
Step 1: User fills in email + password, clicks "Sign in"
         ↓
Step 2: Frontend calls POST /api/v1/auth/login

Step 3: routers/auth.py (line 16) receives the request
        def login(payload: LoginRequest, response: Response, db: Session)
        → calls auth_service.login(db, payload, response)
         ↓
Step 4: services/auth_service.py (line 43) — def login(...)
        a. Query the database: "Find an owner with this email"
           owner = db.query(Owner).filter(Owner.email == payload.email).first()
        b. If owner not found → raise 401 "Invalid email or password"
        c. verify_password(payload.password, owner.password_hash)
           → bcrypt checks the plain password against the stored hash
        d. If wrong password → raise 401
         ↓
Step 5: Create tokens (auth_service.py lines 52-53):
        access_token  = create_access_token(owner.id)   → valid 15 minutes
        refresh_token = create_refresh_token(owner.id)  → valid 7 days
         ↓
Step 6: Set the refresh token as an httpOnly cookie (lines 56-63):
        response.set_cookie(
            key="refresh_token",
            value=refresh_token,
            httponly=True,       ← JavaScript cannot read this
            secure=True,         ← Only sent over HTTPS in production
            samesite="lax",      ← Protection against CSRF attacks
            max_age=604800,      ← 7 days in seconds
            path="/api/v1/auth/refresh"  ← Cookie only sent to this URL
        )
         ↓
Step 7: Return the access token in the JSON response body:
        return TokenResponse(access_token=access_token, expires_in=900)
         ↓
Step 8: Frontend (useAuth.ts, line 14) receives the access token:
        setAccessToken(res.data.access_token)
        → Stored in Zustand (JavaScript memory) — never in localStorage
```

### 6.4 How the httpOnly Cookie Works

An `httpOnly` cookie is a special type of cookie that the browser sends automatically with requests but **JavaScript code on the page cannot read it**. This is a critical security feature.

When the access token expires (after 15 minutes), the frontend's Axios interceptor automatically calls `/api/v1/auth/refresh`. The browser sends the httpOnly cookie automatically. The server reads it, validates it, and issues a new access token. The user never notices — they stay logged in seamlessly.

### 6.5 security.py Explained Line by Line

**File:** `backend/app/core/security.py`

```python
# Line 1-4: Import libraries
from datetime import datetime, timedelta, timezone
import bcrypt           # Industry-standard password hashing library
from jose import JWTError, jwt   # JWT creation and verification
from fastapi import HTTPException, status
from app.core.config import settings  # Reads SECRET_KEY from .env

# Lines 11-12: hash_password()
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt(rounds=12)).decode()
```

`bcrypt.gensalt(rounds=12)` generates a random "salt" — a unique piece of data mixed with the password before hashing. `rounds=12` means the computer does 2^12 (4096) iterations of the hash function. This makes brute-force attacks extremely slow. Even if someone steals the database, they cannot easily reverse the hashes.

```python
# Lines 15-16: verify_password()
def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode(), hashed.encode())
```

The plain text password is never stored. `checkpw` re-hashes the plain password with the same salt extracted from the stored hash, then compares. The original password cannot be recovered.

```python
# Lines 19-25: create_access_token()
def create_access_token(owner_id: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=15)
    return jwt.encode(
        {"sub": owner_id, "exp": expire, "type": "access"},
        settings.SECRET_KEY,     # The secret key from .env — only the server knows this
        algorithm="HS256",       # HMAC with SHA-256 — the signing algorithm
    )
```

The payload `{"sub": owner_id, "exp": expire, "type": "access"}` is encoded and signed. The signature makes it tamper-proof — if anyone changes the payload, the signature check fails.

```python
# Lines 37-53: decode_token()
def decode_token(token: str, expected_type: str = "access") -> str:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        if payload.get("type") != expected_type:
            raise exc  # Prevents using a refresh token where an access token is expected
        owner_id = payload.get("sub")
        if not owner_id:
            raise exc
        return owner_id
    except JWTError:
        raise exc  # Invalid signature, expired token, malformed token → all → 401
```

### 6.6 dependencies/auth.py Explained

**File:** `backend/app/dependencies/auth.py`

```python
bearer_scheme = HTTPBearer()   # Tells FastAPI to expect "Authorization: Bearer <token>"

def get_current_owner(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> Owner:
    token = credentials.credentials      # Extract the token string
    owner_id = decode_token(token)       # Verify signature, check expiry
    owner = db.query(Owner).filter(Owner.id == owner_id).first()  # Load from DB
    if not owner:
        raise HTTPException(status_code=401, detail="Owner not found")
    return owner
```

This function is a **dependency** — it's automatically called before any protected endpoint runs. Every router that needs authentication adds `current_owner: Owner = Depends(get_current_owner)` to its function signature. FastAPI handles the rest.

---

## 7. Database Connection

**File:** `backend/app/core/database.py`

### What is SQLAlchemy?

SQLAlchemy is a Python library that lets you work with databases using Python code instead of raw SQL. Instead of writing `SELECT * FROM properties WHERE owner_id = '...'`, you write `db.query(Property).filter(Property.owner_id == owner.id).all()`. SQLAlchemy translates this to the correct SQL automatically.

### What is a Connection Pool?

Opening a connection to a database is slow — it involves a network handshake, authentication, and session setup. If every single API request opened and closed its own connection, the system would be slow and the database would be overwhelmed.

A **connection pool** is like a taxi stand: instead of calling a taxi from scratch every time you need one, there's a row of taxis always waiting. You take one, use it, return it. The next person takes the same taxi without the overhead of summoning a new one.

```python
# database.py, lines 18-24
engine = create_engine(
    _get_db_url(settings.DATABASE_URL),
    pool_pre_ping=True,    # Before using a connection, ping the DB to ensure it's alive
    pool_size=3,           # Keep 3 connections always ready (suitable for free tier)
    max_overflow=5,        # Allow up to 5 extra connections during traffic spikes
    connect_args={"options": "-c timezone=Asia/Kolkata"},  # All times in IST
)
```

`pool_size=3` and `max_overflow=5` means we can handle up to 8 simultaneous database operations. Supabase's free tier limits connections, so we keep these numbers small.

### The get_db() Function

```python
# database.py, lines 29-34
def get_db():
    db = SessionLocal()   # Take a connection from the pool
    try:
        yield db          # Give it to the router function
    finally:
        db.close()        # Always return it to the pool, even if an error occurred
```

This is a Python **generator** using `yield`. The `finally` block guarantees the connection is always returned, preventing "connection leaks" where connections get stuck and the pool runs dry.

### SSL Requirement

The `_get_db_url()` function (lines 8-15) converts the URL to use the `psycopg3` driver (faster than the older psycopg2) and appends `sslmode=require`. This forces all database communications to be encrypted in transit — nobody can eavesdrop on the data flowing between our server and Supabase.

---

## 8. Router Files

Routers are the "front desk" of the application. They define which URLs exist, what HTTP method they accept, and what parameters are expected. They do almost no logic themselves — they delegate immediately to service functions.

### 8.1 auth.py Router

**File:** `backend/app/routers/auth.py`

All routes under `/api/v1/auth/`. Note that `/register` and `/login` do NOT have `get_current_owner` — they are public endpoints (you can't require login to log in!).

```python
@router.post("/register")  → auth_service.register()
@router.post("/login")     → auth_service.login()
@router.post("/refresh")   → auth_service.refresh()  [reads httpOnly cookie]
@router.post("/logout")    → auth_service.logout()   [deletes cookie]
@router.get("/me")         → auth_service.get_me()   [PROTECTED — needs token]
```

### 8.2 properties.py Router

**File:** `backend/app/routers/properties.py`

All routes under `/api/v1/properties/`. Every single endpoint is protected — you must be logged in.

```python
@router.get("/")                        → list_properties (with page, limit, city filters)
@router.post("/")                       → create_property
@router.get("/{property_id}")           → get_property (includes units)
@router.patch("/{property_id}")         → update_property
@router.delete("/{property_id}")        → delete_property
@router.get("/{property_id}/units")     → list_units (for a specific property)
@router.post("/{property_id}/units")    → create_unit (inside a property)
```

Note the `{property_id}` in curly braces — this is a **path parameter**. FastAPI extracts the actual ID from the URL automatically and passes it to the function.

### 8.3 units.py Router

**File:** `backend/app/routers/units.py`

Individual unit operations (not nested under properties):

```python
@router.get("/{unit_id}")     → get a single unit
@router.patch("/{unit_id}")   → update a unit
@router.delete("/{unit_id}")  → delete a unit
```

### 8.4 tenants.py Router

**File:** `backend/app/routers/tenants.py`

```python
@router.get("/")                       → list_tenants (with search filter)
@router.post("/")                      → create_tenant
@router.get("/{tenant_id}")            → get_tenant
@router.patch("/{tenant_id}")          → update_tenant
@router.delete("/{tenant_id}")         → delete_tenant
@router.post("/{tenant_id}/documents") → upload_document (ID proof PDF/image)
```

### 8.5 leases.py Router

**File:** `backend/app/routers/leases.py`

The most complex router due to the extra lease-specific operations:

```python
@router.get("/")                          → list_leases (filter by status, expiry, unit)
@router.post("/")                         → create_lease
@router.get("/{lease_id}")                → get_lease
@router.patch("/{lease_id}")              → update_lease (notes, end_date)
@router.patch("/{lease_id}/terminate")    → terminate_lease (with reason + date)
@router.post("/{lease_id}/documents")     → upload_agreement (PDF only, max 5MB)
@router.get("/{lease_id}/documents")      → get_document_url (signed URL for download)
```

The `/terminate` endpoint uses `PATCH` (not `DELETE`) because we're not deleting the lease — we're changing its status to `TERMINATED` and keeping the record for history.

### 8.6 payments.py Router

**File:** `backend/app/routers/payments.py`

```python
@router.get("/")             → list_payments (filter by status, lease_id, month)
@router.post("/")            → create_payment (record a rent payment)
@router.get("/{payment_id}") → get_payment
@router.patch("/{payment_id}") → update_payment
@router.delete("/{payment_id}") → delete_payment
```

### 8.7 dashboard.py Router

**File:** `backend/app/routers/dashboard.py`

A single endpoint that returns a comprehensive summary:

```python
@router.get("/")  → dashboard_service.get_dashboard(db, current_owner)
```

Returns: total properties, units, occupancy rate, monthly financials, overdue payments, and leases expiring in 30 days.

---

## 9. Service Files

Services are where the **business logic** lives. Business logic is the set of rules that make the application do something meaningful — not just store and retrieve data, but enforce real-world requirements.

### 9.1 auth_service.py

**File:** `backend/app/services/auth_service.py`

**`register()`** (line 18):
- Checks if the email already exists. If yes → 409 Conflict.
- Hashes the password using bcrypt.
- Creates an Owner row in the database.

**`login()`** (line 43):
- Finds the owner by email.
- Verifies the password hash.
- Creates both access and refresh tokens.
- Sets the refresh token as an httpOnly cookie scoped to `/api/v1/auth/refresh`.
- Returns the access token in the response body.

**`refresh()`** (line 68):
- Reads the `refresh_token` cookie from the request.
- Decodes and validates it.
- Issues a new access token AND a new refresh token (called **token rotation** — the old refresh token is discarded, making token theft much harder to exploit).

**`logout()`** (line 89):
- Deletes the `refresh_token` cookie by setting it to empty with `delete_cookie()`.
- The frontend independently clears the access token from memory.

### 9.2 property_service.py

**File:** `backend/app/services/property_service.py`

**Key design decision: Ownership filtering.** Every query filters by `Property.owner_id == owner.id`. This means Owner A can never see Owner B's properties, even if they know the property ID. This is called **multi-tenancy** — multiple users share the same database but are isolated from each other.

**`_property_to_response()`** (line 116):
- Computes `occupied_units` with `SELECT COUNT(*)` from the units table.
- Computes `monthly_revenue` with `SELECT SUM(monthly_rent)` for occupied units.
- These are computed on-the-fly, not stored, keeping the data always accurate.

**`delete_property()`** (line 89):
- Checks for active leases across all units before deleting.
- If any active lease exists → 409 Conflict (you cannot delete a building with tenants in it).

### 9.3 lease_service.py

**File:** `backend/app/services/lease_service.py`

**`create_lease()`** (line 63):
- Verifies the unit belongs to the logged-in owner (via a JOIN through property).
- Checks `unit.status == "VACANT"` — cannot create a lease for an occupied unit.
- Verifies the tenant also belongs to the same owner.
- Sets `status = "ACTIVE"` on the new lease.
- Also sets `unit.status = "OCCUPIED"` (though the database trigger also does this — belt and suspenders).

**`terminate_lease()`** (line 119):
- Only `ACTIVE` leases can be terminated.
- Sets `status = "TERMINATED"` and appends the reason to the notes field.
- Sets `unit.status = "VACANT"`.

**`_lease_to_response()`** (line 194):
- Computes a `payments_summary` using SQL aggregate functions:
  - `SUM(amount_due)` → total ever charged on this lease
  - `SUM(amount_paid)` → total ever paid
  - `SUM(amount_due) WHERE status = 'OVERDUE'` → outstanding overdue amount
- Embeds a `UnitSummary` and `TenantSummary` so the frontend gets all necessary context in one API call.

### 9.4 payment_service.py

**File:** `backend/app/services/payment_service.py`

**`_compute_status()`** (line 148):
- `amount_paid >= amount_due` → `"PAID"`
- `amount_paid > 0` but less than due → `"PARTIAL"`
- `amount_paid == 0` → `"PENDING"`
- `"OVERDUE"` is set by the daily scheduler (not here) when a PENDING payment's due date has passed.

**`update_payment()`** (line 102):
- After updating amounts, always re-runs `_compute_status()` so the status stays consistent with the actual amounts. You can't manually set status to "PAID" while the amount is wrong.

### 9.5 dashboard_service.py

**File:** `backend/app/services/dashboard_service.py`

This service runs five separate SQL queries to build the dashboard:

1. **Count properties** belonging to the owner.
2. **Count total / occupied / vacant units** (joining through properties).
3. **Financials query** — a single query using `SUM()` and `COUNT()` with SQL `extract()` to filter by the current month and year.
4. **Expiring leases** — leases with `status = 'ACTIVE'` and `end_date` within the next 30 days.
5. **Overdue payments** — payments with `status = 'OVERDUE'`, limited to 20 most urgent.

All queries use `Property.owner_id == owner.id` at the base, ensuring data isolation.

---

## 10. Model Files

Models are Python classes that map directly to database tables. Each class attribute maps to a column. We use **SQLAlchemy ORM** (Object-Relational Mapper) — a library that translates between Python objects and database rows.

### 10.1 mixins.py — Shared Columns

**File:** `backend/app/models/mixins.py`

```python
class TimestampMixin:
    id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),   # Python generates the UUID
        server_default=text("gen_random_uuid()"),  # DB can also generate it
    )
    created_at: Mapped[datetime] = mapped_column(...)
    updated_at: Mapped[datetime] = mapped_column(...)
```

Every table inherits from `TimestampMixin`, which gives it three columns automatically: `id`, `created_at`, `updated_at`. This is the **DRY principle** (Don't Repeat Yourself) — define once, use everywhere.

**Why UUID instead of an integer ID?**
Integer IDs are sequential (1, 2, 3...). Anyone who knows ID 5 can guess there's also an ID 4 and try to access it. UUID IDs look like `550e8400-e29b-41d4-a716-446655440000` — completely random and unguessable.

### 10.2 owner.py

```python
class Owner(TimestampMixin, Base):
    __tablename__ = "owners"
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(60), nullable=False)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    phone: Mapped[str | None] = mapped_column(String(20))  # Optional

    # Relationships
    properties: Mapped[list["Property"]] = relationship(..., cascade="all, delete-orphan")
    tenants: Mapped[list["Tenant"]] = relationship(..., cascade="all, delete-orphan")
```

`cascade="all, delete-orphan"` means: if an Owner is deleted, all their Properties and Tenants are automatically deleted too. This is handled in the database by the `ON DELETE CASCADE` foreign key constraint.

### 10.3 property.py

Key columns: `owner_id` (FK to owners), `name`, `address_line`, `city`, `state`, `pincode`, `property_type` (RESIDENTIAL/COMMERCIAL), `total_units`.

The `CheckConstraint("property_type IN ('RESIDENTIAL', 'COMMERCIAL')")` means the database itself rejects any other value — even if code somehow bypasses validation.

### 10.4 unit.py

Key columns: `property_id` (FK to properties), `unit_number`, `floor`, `area_sqft`, `unit_type` (1BHK/2BHK/etc.), `monthly_rent`, `deposit_amount`, `status` (VACANT/OCCUPIED/MAINTENANCE), `amenities` (array of text).

`amenities: Mapped[list[str] | None] = mapped_column(ARRAY(Text))` — PostgreSQL supports native array columns. A unit's amenities (["WiFi", "Parking", "AC"]) are stored as a proper array, not a comma-separated string.

### 10.5 tenant.py

Key columns: `owner_id`, `full_name`, `email`, `phone`, `emergency_contact_name`, `emergency_contact_phone`, `id_type` (AADHAAR/PAN/etc.), `id_number`, `id_document_url` (link to stored file), `notes`.

### 10.6 lease.py

Key columns: `unit_id`, `tenant_id`, `start_date`, `end_date`, `monthly_rent`, `deposit_paid`, `rent_due_day` (1-28, the day of the month rent is due), `status` (ACTIVE/EXPIRED/TERMINATED), `agreement_url`, `notes`.

The lease is the **central table** of the system — it connects a tenant to a unit for a period of time.

### 10.7 payment.py

Key columns: `lease_id`, `amount_due`, `amount_paid`, `due_date`, `paid_date`, `payment_method` (CASH/UPI/BANK_TRANSFER/CHEQUE), `reference_number` (e.g., UPI transaction ID), `status` (PENDING/PAID/PARTIAL/OVERDUE), `notes`.

---

## 11. Schemas — Pydantic Validation

**Pydantic** is a Python library for data validation. A "schema" in our context is a class that defines what data an API request or response must contain, and what types and constraints each field must meet.

**Analogy:** Think of it like a form you fill out at a bank. The form has specific fields, some required (name, account number) and some optional (middle name). If you leave out a required field, the teller rejects the form. If you write text where a number is expected, the form is invalid. Pydantic is that teller.

### Example: CreatePropertyRequest

```python
# schemas/property.py
class CreatePropertyRequest(BaseModel):
    name: str                          # Required string
    address_line: str                  # Required string
    city: str                          # Required string
    state: str                         # Required string
    pincode: str                       # Required string
    property_type: PropertyType        # Must be "RESIDENTIAL" or "COMMERCIAL"
    total_units: int = Field(ge=1)     # Integer, must be >= 1
```

If the frontend sends `"total_units": -5`, Pydantic automatically returns a `422 Unprocessable Entity` error with a clear message. No manual validation code needed.

### Request vs. Response Schemas

- **Request schemas** (e.g., `CreatePropertyRequest`) define what the client must send.
- **Response schemas** (e.g., `PropertyResponse`) define what the server returns — they may include computed fields like `occupied_units` that don't exist in the request.

### UpdatePropertyRequest — Partial Updates

```python
class UpdatePropertyRequest(BaseModel):
    name: str | None = None
    city: str | None = None
    # ... all fields optional
```

All fields are optional (using `None` defaults). Combined with `payload.model_dump(exclude_unset=True)` in the service layer, only the fields the client actually sent are updated. Send `{"city": "Mumbai"}` and only the city changes — everything else stays the same.

---

## 12. The Scheduler

**File:** `backend/app/tasks/scheduler.py`

### What Problem Does It Solve?

Payments have a `due_date`. After that date passes, if the payment is still `PENDING`, it should become `OVERDUE`. But no human is going to manually check every payment every day. The scheduler automates this.

### How It Works

```python
def run_daily_job() -> dict:
    db = SessionLocal()
    overdue_payments = (
        db.query(Payment)
        .filter(
            Payment.status == "PENDING",
            Payment.due_date < date.today(),   # Due date has passed
        )
        .all()
    )
    for payment in overdue_payments:
        payment.status = "OVERDUE"
        # Also sends email alert to tenant
    db.commit()
```

This runs every day at 9:00 AM IST (set in `start_scheduler()` with `hour=9, minute=0, timezone="Asia/Kolkata"`).

### Two Ways to Trigger It

1. **APScheduler** (paid Render plan): The `start_scheduler()` function is called when the app starts (`main.py` line 21 via `lifespan`). This creates a background thread that wakes up at the scheduled time.

2. **External cron + `/internal/daily-job` endpoint** (free plan): On Render's free tier, the server "sleeps" when not in use, making an internal scheduler unreliable. Instead, an external cron service (like cron-job.org) calls our `/api/v1/internal/daily-job` endpoint at 9 AM. The endpoint calls `run_daily_job()` directly.

### Email Alerts

After marking a payment overdue, the scheduler attempts to send an email to the tenant (if they have an email address) using the `email_service`. If the email fails (e.g., the email service is down), the exception is caught and swallowed — the job continues. A single failed email should not abort the entire daily run.

---

## 13. Environment Variables

**File:** `backend/app/core/config.py`

### What Are Environment Variables?

Environment variables are configuration values stored **outside** the code — in the server's operating environment. They're like a safe hidden in the wall — the code knows to look there, but the values are never written into the code itself.

**Why not just put the database password in the code?**
- The code is on GitHub (even if private). Secrets in code get accidentally exposed.
- Different environments (development, production) need different values.
- Rotating a secret (changing a password) shouldn't require a code change.

### Our Variables

```python
# config.py
class Settings(BaseSettings):
    DATABASE_URL: str                   # PostgreSQL connection string with password
    DATABASE_DIRECT_URL: str = ""       # Direct URL for Alembic migrations
    SECRET_KEY: str                     # Random string used to sign JWTs
    ALGORITHM: str = "HS256"            # JWT algorithm (default provided)
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    SUPABASE_URL: str = ""             # For file uploads
    SUPABASE_SERVICE_KEY: str = ""      # Service role key for Supabase
    SUPABASE_STORAGE_BUCKET: str = "rental-docs"
    RESEND_API_KEY: str = ""           # For sending emails
    EMAIL_SENDER: str = ""
    FRONTEND_URL: str = "http://localhost:5173"   # CORS whitelist
    ENVIRONMENT: str = "development"    # Controls debug mode, docs visibility
    INTERNAL_JOB_SECRET: str           # Secret for the cron job endpoint
```

`pydantic_settings.BaseSettings` reads these from the `.env` file (local development) or from the server's environment variables (production). Missing required variables (like `DATABASE_URL`) cause the app to refuse to start with a clear error message.

---

## 14. Deployment on Render

**Render** is a cloud hosting platform. Think of it like renting space on a very powerful computer connected to the internet, 24/7, without needing to own or maintain the hardware.

### How the App Starts

The `Procfile` in the backend root tells Render how to start the application:
```
web: uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

- `uvicorn` is the ASGI server — it translates incoming HTTP requests into Python function calls and vice versa.
- `app.main:app` means "the `app` object inside `main.py` inside the `app` package."
- `--host 0.0.0.0` means listen on all network interfaces (so the internet can reach it).
- `--port $PORT` uses the port Render assigns (Render sets this environment variable automatically).

### Deployment Process

1. We push code to GitHub.
2. Render detects the new commit automatically.
3. Render installs dependencies: `pip install -r requirements.txt`.
4. Render runs the `Procfile` command to start the server.
5. The app is live at a URL like `https://property-rental-api.onrender.com`.

### Environment Variables on Render

All secrets (`DATABASE_URL`, `SECRET_KEY`, etc.) are entered directly in Render's dashboard under "Environment Variables". They never appear in the code or the Git repository.

### CORS Configuration

CORS (Cross-Origin Resource Sharing) is a browser security feature that prevents a web page from making requests to a different domain than the one that served it. Our backend explicitly allows the frontend's domain:

```python
# main.py, line 31
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL],  # Only the Vercel frontend URL
    allow_credentials=True,                  # Allow cookies (needed for httpOnly refresh token)
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Rate Limiting

```python
# main.py, line 11-12
limiter = Limiter(key_func=get_remote_address)
```

The `slowapi` library limits how many requests a single IP address can make per unit of time. This prevents abuse (e.g., someone scripting 10,000 login attempts per second).

---

*This document covers the complete backend architecture of the RentEase Property Rental Management System. Every file referenced here exists at the path shown. All code snippets are taken directly from the actual source files.*
