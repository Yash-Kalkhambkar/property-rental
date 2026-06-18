# Backend — Property Rental Management System

## Tech Stack

| Tool | Version | Purpose |
|---|---|---|
| Python | 3.11 | Runtime |
| FastAPI | 0.111 | Web framework, auto-docs |
| SQLAlchemy | 2.0 | ORM |
| Alembic | 1.13 | Database migrations |
| Pydantic | 2.x | Request/response validation |
| pydantic-settings | 2.x | `.env` config |
| python-jose[cryptography] | 3.3 | JWT encode/decode |
| passlib[bcrypt] | 1.7 | Password hashing |
| supabase | 2.x | Supabase Storage client (replaces boto3) |
| resend | 2.x | Transactional email (replaces AWS SES) |
| APScheduler | 3.10 | Background jobs (rent-due checks) |
| slowapi | 0.1 | Rate limiting |
| uvicorn | 0.29 | ASGI server |
| psycopg2-binary | 2.9 | PostgreSQL adapter |
| python-multipart | 0.0.9 | File upload support |

> **Why these replacements?**
> `boto3` → `supabase` (Supabase Storage API, no IAM keys needed).
> `SES` → `Resend` (3,000 emails/month free, 60-second setup vs SES sandbox + production access request).

---

## Environment Variables

```env
# .env
DATABASE_URL=postgresql://postgres.[project-ref]:[password]@aws-0-ap-south-1.pooler.supabase.com:6543/postgres
DATABASE_DIRECT_URL=postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres

SECRET_KEY=<generate: python -c "import secrets; print(secrets.token_hex(32))">
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=7

# Supabase (replaces AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY / S3_BUCKET_NAME)
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_SERVICE_KEY=eyJ...   # Service role key (not anon key) — found in Project Settings → API
SUPABASE_STORAGE_BUCKET=rental-docs

# Resend (replaces SES_SENDER_EMAIL + AWS email creds)
RESEND_API_KEY=re_...
EMAIL_SENDER=noreply@yourdomain.com   # must be a verified domain in Resend dashboard

# App
FRONTEND_URL=https://your-app.vercel.app   # or netlify URL
ENVIRONMENT=production                     # development | production

# Scheduler (protects the /internal/daily-job endpoint called by external cron)
INTERNAL_JOB_SECRET=<generate: python -c "import secrets; print(secrets.token_hex(24))">
```

---

## Folder Structure

```
app/
├── main.py                    # App factory, middleware, router registration
├── core/
│   ├── config.py              # Pydantic Settings (reads .env)
│   ├── database.py            # Engine, SessionLocal, Base, get_db dependency
│   └── security.py            # JWT create/verify, password hash/verify
├── models/                    # SQLAlchemy ORM models
│   ├── owner.py
│   ├── property.py
│   ├── unit.py
│   ├── tenant.py
│   ├── lease.py
│   └── payment.py
├── schemas/                   # Pydantic request + response schemas (API contract)
│   ├── auth.py
│   ├── property.py
│   ├── unit.py
│   ├── tenant.py
│   ├── lease.py
│   ├── payment.py
│   └── dashboard.py
├── routers/                   # FastAPI route handlers
│   ├── auth.py
│   ├── properties.py
│   ├── units.py
│   ├── tenants.py
│   ├── leases.py
│   ├── payments.py
│   ├── dashboard.py
│   └── internal.py            # Internal job endpoint (triggered by external cron)
├── services/                  # Business logic (called by routers)
│   ├── auth_service.py
│   ├── property_service.py
│   ├── unit_service.py
│   ├── tenant_service.py
│   ├── lease_service.py
│   ├── payment_service.py
│   ├── dashboard_service.py
│   ├── storage_service.py     # Supabase Storage (replaces s3_service.py)
│   └── email_service.py       # Resend (replaces SES)
├── tasks/
│   └── scheduler.py           # APScheduler + standalone job function
├── dependencies/
│   └── auth.py                # get_current_owner dependency
└── alembic/
    ├── env.py
    └── versions/
        └── 001_initial_schema.py
```

---

## `main.py` — App Factory

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from app.core.config import settings
from app.routers import auth, properties, units, tenants, leases, payments, dashboard, internal
from app.tasks.scheduler import start_scheduler

limiter = Limiter(key_func=get_remote_address)

def create_app() -> FastAPI:
    app = FastAPI(
        title="Property Rental Management API",
        version="1.0.0",
        docs_url="/docs" if settings.ENVIRONMENT == "development" else None,
        redoc_url=None,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=[settings.FRONTEND_URL],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

    prefix = "/api/v1"
    app.include_router(auth.router,       prefix=f"{prefix}/auth",       tags=["Auth"])
    app.include_router(properties.router, prefix=f"{prefix}/properties",  tags=["Properties"])
    app.include_router(units.router,      prefix=f"{prefix}/units",       tags=["Units"])
    app.include_router(tenants.router,    prefix=f"{prefix}/tenants",     tags=["Tenants"])
    app.include_router(leases.router,     prefix=f"{prefix}/leases",      tags=["Leases"])
    app.include_router(payments.router,   prefix=f"{prefix}/payments",    tags=["Payments"])
    app.include_router(dashboard.router,  prefix=f"{prefix}/dashboard",   tags=["Dashboard"])
    app.include_router(internal.router,   prefix=f"{prefix}/internal",    tags=["Internal"])

    @app.on_event("startup")
    async def startup():
        start_scheduler()

    @app.get("/health")
    def health():
        return {"status": "ok"}

    return app

app = create_app()
```

---

## `core/config.py`

```python
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    DATABASE_URL: str
    DATABASE_DIRECT_URL: str = ""   # fallback to DATABASE_URL if not set

    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    SUPABASE_URL: str
    SUPABASE_SERVICE_KEY: str
    SUPABASE_STORAGE_BUCKET: str = "rental-docs"

    RESEND_API_KEY: str
    EMAIL_SENDER: str

    FRONTEND_URL: str = "http://localhost:5173"
    ENVIRONMENT: str = "development"

    INTERNAL_JOB_SECRET: str

    model_config = SettingsConfigDict(env_file=".env")

settings = Settings()
```

---

## `core/database.py`

```python
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from app.core.config import settings

engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,
    pool_size=3,        # keep low — Supabase pooler manages connections
    max_overflow=5,
    connect_args={"options": "-c timezone=Asia/Kolkata"},
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

class Base(DeclarativeBase):
    pass

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

---

## `core/security.py`

```python
from datetime import datetime, timedelta, timezone
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import HTTPException, status
from app.core.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto", bcrypt__rounds=12)

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)

def create_access_token(owner_id: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return jwt.encode({"sub": owner_id, "exp": expire, "type": "access"}, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

def create_refresh_token(owner_id: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    return jwt.encode({"sub": owner_id, "exp": expire, "type": "refresh"}, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

def decode_token(token: str, expected_type: str = "access") -> str:
    """Returns owner_id or raises 401."""
    exc = HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token", headers={"WWW-Authenticate": "Bearer"})
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        if payload.get("type") != expected_type:
            raise exc
        owner_id: str = payload.get("sub")
        if not owner_id:
            raise exc
        return owner_id
    except JWTError:
        raise exc
```

---

## `services/storage_service.py` — Supabase Storage

Replaces the old `s3_service.py`. The public API (`upload`, `signed_url`, `delete`) is identical so no other file needs to change.

```python
# services/storage_service.py
from supabase import create_client, Client
from app.core.config import settings

class StorageService:
    def __init__(self):
        self._client: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)
        self.bucket = settings.SUPABASE_STORAGE_BUCKET

    def upload(self, key: str, body: bytes, content_type: str = "application/octet-stream") -> None:
        """Upload a file. Upserts if the key already exists."""
        self._client.storage.from_(self.bucket).upload(
            path=key,
            file=body,
            file_options={"content-type": content_type, "upsert": "true"},
        )

    def signed_url(self, key: str, expires_in: int = 900) -> str:
        """Generate a 15-minute signed GET URL. Never store this in the DB."""
        response = self._client.storage.from_(self.bucket).create_signed_url(key, expires_in)
        return response["signedURL"]

    def delete(self, key: str) -> None:
        self._client.storage.from_(self.bucket).remove([key])

storage_service = StorageService()
```

> **Usage note:** Anywhere the old code referenced `s3_service`, rename the import to `storage_service`. The method names (`upload`, `signed_url`, `delete`) are intentionally the same — the only difference is `presigned_url` is now called `signed_url`.

---

## `services/email_service.py` — Resend

Replaces the old AWS SES client. Same method signatures.

```python
# services/email_service.py
import resend
from app.core.config import settings

resend.api_key = settings.RESEND_API_KEY

class EmailService:

    def send_rent_due_reminder(
        self, to_email: str, tenant_name: str, amount: float, due_date: str, unit: str
    ) -> None:
        resend.Emails.send({
            "from":    settings.EMAIL_SENDER,
            "to":      [to_email],
            "subject": f"Rent Due Reminder — {unit}",
            "text": (
                f"Dear {tenant_name},\n\n"
                f"This is a reminder that rent of ₹{amount:,.0f} for {unit} "
                f"is due on {due_date}.\n\n"
                f"Please ensure timely payment.\n\nThank you."
            ),
        })

    def send_overdue_alert(
        self, to_email: str, tenant_name: str, amount: float, days_overdue: int, unit: str
    ) -> None:
        resend.Emails.send({
            "from":    settings.EMAIL_SENDER,
            "to":      [to_email],
            "subject": f"Overdue Rent Alert — {unit}",
            "text": (
                f"Dear {tenant_name},\n\n"
                f"Your rent of ₹{amount:,.0f} for {unit} is {days_overdue} days overdue.\n\n"
                f"Please contact your landlord immediately.\n\nThank you."
            ),
        })

email_service = EmailService()
```

---

## `tasks/scheduler.py`

APScheduler still works on Render's paid plan (persistent process). On the **free tier**, the service sleeps after 15 minutes of inactivity — APScheduler may miss its scheduled run. The solution is to expose the job as an HTTP endpoint and trigger it with an external cron (see `routers/internal.py` below).

```python
# tasks/scheduler.py
from apscheduler.schedulers.background import BackgroundScheduler
from datetime import date
from app.core.database import SessionLocal
from app.models.payment import Payment
from app.models.lease import Lease
from app.models.unit import Unit
from app.models.property import Property
from app.models.tenant import Tenant
from app.services.email_service import email_service

def run_daily_job() -> dict:
    """
    Marks overdue payments and sends email alerts.
    Called either by APScheduler (paid plan) or the /internal/daily-job
    endpoint (free plan via external cron).
    Returns a summary dict for logging.
    """
    db = SessionLocal()
    marked = 0
    emailed = 0
    try:
        overdue_payments = (
            db.query(Payment)
            .join(Lease,    Lease.id    == Payment.lease_id)
            .join(Unit,     Unit.id     == Lease.unit_id)
            .join(Property, Property.id == Unit.property_id)
            .join(Tenant,   Tenant.id   == Lease.tenant_id)
            .filter(
                Payment.status == "PENDING",
                Payment.due_date < date.today(),
            )
            .all()
        )

        for payment in overdue_payments:
            payment.status = "OVERDUE"
            marked += 1
            if payment.lease.tenant.email:
                days_late = (date.today() - payment.due_date).days
                email_service.send_overdue_alert(
                    to_email=payment.lease.tenant.email,
                    tenant_name=payment.lease.tenant.full_name,
                    amount=payment.amount_due,
                    days_overdue=days_late,
                    unit=f"{payment.lease.unit.unit_number} — {payment.lease.unit.property.name}",
                )
                emailed += 1
        db.commit()
        return {"marked_overdue": marked, "emails_sent": emailed}
    except Exception as e:
        db.rollback()
        raise e
    finally:
        db.close()

def start_scheduler():
    """Start APScheduler — only reliable on Render paid plan (no cold starts)."""
    scheduler = BackgroundScheduler(timezone="Asia/Kolkata")
    scheduler.add_job(run_daily_job, "cron", hour=9, minute=0)
    scheduler.start()
```

---

## `routers/internal.py` — Scheduler HTTP Endpoint

External cron services (cron-job.org, EasyCron — both free) can POST to this endpoint daily at 9 AM IST. The `X-Internal-Secret` header prevents unauthorized calls.

```python
# routers/internal.py
from fastapi import APIRouter, Header, HTTPException
from app.core.config import settings
from app.tasks.scheduler import run_daily_job

router = APIRouter()

@router.post("/daily-job")
def trigger_daily_job(x_internal_secret: str = Header(...)):
    if x_internal_secret != settings.INTERNAL_JOB_SECRET:
        raise HTTPException(status_code=403, detail="Forbidden")
    result = run_daily_job()
    return {"message": "Daily job completed", "result": result}
```

**cron-job.org setup** (free, no account credit card):
1. Sign up at cron-job.org
2. Create job: `POST https://your-render-app.onrender.com/api/v1/internal/daily-job`
3. Header: `X-Internal-Secret: <your INTERNAL_JOB_SECRET>`
4. Schedule: `0 3 * * *` (3:30 UTC = 9:00 AM IST)

---

## Pydantic Schemas — API Contract

All schemas are unchanged. They define exactly what the frontend sends and receives. Field names, types, and optionality must not diverge from the TypeScript interfaces in `frontend.md`.

```python
# schemas/auth.py
from pydantic import BaseModel, EmailStr, field_validator
import re

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    phone: str | None = None

    @field_validator("password")
    @classmethod
    def password_strength(cls, v):
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        if not re.search(r"[A-Z]", v):
            raise ValueError("Password must contain an uppercase letter")
        if not re.search(r"\d", v):
            raise ValueError("Password must contain a number")
        if not re.search(r"[!@#$%^&*]", v):
            raise ValueError("Password must contain a special character")
        return v

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int

class OwnerResponse(BaseModel):
    id: str
    email: str
    full_name: str
    phone: str | None
    created_at: str
    model_config = {"from_attributes": True}
```

```python
# schemas/lease.py
from pydantic import BaseModel, model_validator
from datetime import date
from typing import Literal

LeaseStatus = Literal["ACTIVE", "EXPIRED", "TERMINATED"]

class CreateLeaseRequest(BaseModel):
    unit_id: str
    tenant_id: str
    start_date: date
    end_date: date
    monthly_rent: float
    deposit_paid: float
    rent_due_day: int = 1
    notes: str | None = None

    @model_validator(mode="after")
    def validate_dates(self):
        if self.end_date <= self.start_date:
            raise ValueError("end_date must be after start_date")
        if not (1 <= self.rent_due_day <= 28):
            raise ValueError("rent_due_day must be between 1 and 28")
        return self

class TerminateLeaseRequest(BaseModel):
    reason: str
    termination_date: date

class UnitSummary(BaseModel):
    id: str; unit_number: str; property_name: str; property_id: str

class TenantSummary(BaseModel):
    id: str; full_name: str; phone: str; email: str | None

class PaymentsSummary(BaseModel):
    total_due: float; total_paid: float; overdue_amount: float

class LeaseResponse(BaseModel):
    id: str; unit_id: str; tenant_id: str
    unit: UnitSummary; tenant: TenantSummary
    start_date: str; end_date: str
    monthly_rent: float; deposit_paid: float; rent_due_day: int
    status: str; agreement_url: str | None; notes: str | None
    payments_summary: PaymentsSummary
    created_at: str; updated_at: str
    model_config = {"from_attributes": True}
```

*(All other schemas — property, unit, tenant, payment, dashboard — are unchanged from the original design.)*

---

## Routers

All routers are unchanged except `leases.py` which references `storage_service` instead of `s3_service`:

```python
# routers/leases.py — only the upload handler changes
from app.services.storage_service import storage_service   # was: s3_service

@router.post("/{lease_id}/documents", response_model=dict)
async def upload_agreement(
    lease_id: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_owner: Owner = Depends(get_current_owner),
):
    if file.content_type not in ["application/pdf"]:
        raise HTTPException(status_code=400, detail="Only PDF files are accepted")
    if file.size > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File size must be under 5MB")
    result = await lease_service.upload_agreement(db, lease_id, file, owner_id=current_owner.id)
    return {"data": result, "message": "Agreement uploaded"}

# In lease_service.py — same change:
# storage_service.upload(key=s3_key, ...) — method name unchanged
# storage_service.signed_url(s3_key)      — was presigned_url()
```

Similarly in `tenants.py`, the document upload calls `storage_service` instead of `s3_service`.

---

## Service Layer (Business Logic)

All services are unchanged. The only edit is renaming the `s3_service` import to `storage_service` and `presigned_url` → `signed_url` in the two places file uploads happen (lease_service and tenant_service):

```python
# services/lease_service.py — only these two lines change
from app.services.storage_service import storage_service   # ← was s3_service

async def upload_agreement(self, db, lease_id, file, owner_id):
    # ...
    storage_service.upload(key=s3_key, body=contents, content_type="application/pdf")
    lease.agreement_url = s3_key
    db.commit()
    signed = storage_service.signed_url(s3_key)            # ← was presigned_url
    return {"document_url": s3_key, "presigned_url": signed}
```

---

## `dependencies/auth.py`

Unchanged:

```python
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import decode_token
from app.models.owner import Owner

bearer_scheme = HTTPBearer()

def get_current_owner(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> Owner:
    token = credentials.credentials
    owner_id = decode_token(token, expected_type="access")
    owner = db.query(Owner).filter(Owner.id == owner_id).first()
    if not owner:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Owner not found")
    return owner
```

---

## Render Configuration Files

### `Procfile` (tells Render how to start the app)

```
web: uvicorn app.main:app --host 0.0.0.0 --port $PORT --workers 2
```

### `render.yaml` (Infrastructure as Code — optional but recommended)

```yaml
services:
  - type: web
    name: rental-api
    runtime: python
    region: singapore   # closest free region to India
    plan: free
    buildCommand: pip install -r requirements.txt
    startCommand: uvicorn app.main:app --host 0.0.0.0 --port $PORT --workers 2
    healthCheckPath: /health
    envVars:
      - key: DATABASE_URL
        sync: false          # set manually in Render dashboard
      - key: DATABASE_DIRECT_URL
        sync: false
      - key: SECRET_KEY
        generateValue: true  # Render auto-generates a random value
      - key: SUPABASE_URL
        sync: false
      - key: SUPABASE_SERVICE_KEY
        sync: false
      - key: SUPABASE_STORAGE_BUCKET
        value: rental-docs
      - key: RESEND_API_KEY
        sync: false
      - key: EMAIL_SENDER
        sync: false
      - key: FRONTEND_URL
        sync: false
      - key: ENVIRONMENT
        value: production
      - key: INTERNAL_JOB_SECRET
        generateValue: true
      - key: ALGORITHM
        value: HS256
      - key: ACCESS_TOKEN_EXPIRE_MINUTES
        value: 15
      - key: REFRESH_TOKEN_EXPIRE_DAYS
        value: 7
```

### `requirements.txt`

```
fastapi==0.111.0
uvicorn[standard]==0.29.0
sqlalchemy==2.0.30
alembic==1.13.1
pydantic==2.7.1
pydantic-settings==2.2.1
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
supabase==2.4.3
resend==2.1.0
apscheduler==3.10.4
slowapi==0.1.9
psycopg2-binary==2.9.9
python-multipart==0.0.9
```

---

## Running Locally

```bash
# Install deps
pip install -r requirements.txt

# Copy env template
cp .env.example .env
# Fill in SUPABASE_URL, SUPABASE_SERVICE_KEY, RESEND_API_KEY, DATABASE_URL etc.

# Run migrations (use DATABASE_DIRECT_URL for Alembic)
DATABASE_URL=$DATABASE_DIRECT_URL alembic upgrade head

# Start dev server
uvicorn app.main:app --reload --port 8000

# Access auto-docs (development only)
open http://localhost:8000/docs
```

---

## Error Response Format

```python
# FastAPI raises these; they are serialized automatically
raise HTTPException(
    status_code=404,
    detail="Lease not found or access denied",
    headers={"X-Error-Code": "NOT_FOUND"},
)
# Frontend receives: { "detail": "Lease not found or access denied" }

# Pydantic validation errors (422):
# { "detail": [{ "loc": ["body", "email"], "msg": "value is not a valid email address" }] }
```

---

## Integration Checklist (Backend Side)

- [ ] CORS `allow_origins` includes `http://localhost:5173` in dev and the Vercel/Netlify URL in prod
- [ ] Cookie `secure=True` only in production; `False` in development (HTTP)
- [ ] All date fields serialized as `YYYY-MM-DD` strings in Pydantic responses
- [ ] All money fields as `float` (not `Decimal`) in JSON responses
- [ ] `owner_id` filter applied in **every** query — no cross-owner data leaks
- [ ] Supabase Storage keys stored in DB, never full signed URLs (signed URLs generated on demand)
- [ ] Resend sender domain verified in Resend dashboard before deploying
- [ ] `withCredentials: true` required on frontend — backend `allow_credentials=True` in CORS
- [ ] `path="/api/v1/auth/refresh"` on cookie — limits cookie exposure to refresh endpoint only
- [ ] `INTERNAL_JOB_SECRET` is a random hex string, not a dictionary word
- [ ] `/internal/daily-job` endpoint is **not** listed in Swagger docs (internal router has `include_in_schema=False` or docs are disabled in production)
- [ ] Alembic migrations run with `DATABASE_DIRECT_URL`, not the pooler URL
- [ ] `Procfile` and `render.yaml` present at repo root before connecting to Render
