# Deployment — Property Rental Management System

## Stack Summary

| Layer | Service | Free Tier |
|---|---|---|
| Database | **Supabase** (PostgreSQL 15) | 500 MB DB, 1 GB Storage, 2 GB bandwidth |
| Backend | **Render** (FastAPI) | 750 instance hours/month (~1 service free) |
| Frontend | **Vercel** or **Netlify** (React SPA) | 100 GB bandwidth, unlimited deployments |
| Email | **Resend** | 3,000 emails/month, 100/day |
| External Cron | **cron-job.org** | Unlimited jobs, free |

**Total cost: ₹0/month** (no credit card required for any of these)

---

## Architecture Overview

```
Internet
    │
    ├── yourdomain.vercel.app  (or .netlify.app)
    │       Vercel / Netlify CDN
    │       React SPA — edge-cached, global CDN
    │       SPA routing handled by vercel.json / netlify.toml
    │
    └── rental-api.onrender.com
            FastAPI on Render (Singapore region)
            │
            ├── Supabase PostgreSQL (connection pooler port 6543)
            │       owners / properties / units / tenants / leases / payments
            │
            ├── Supabase Storage (bucket: rental-docs)
            │       Tenant ID docs + Lease agreement PDFs
            │
            └── Resend API
                    Rent due + overdue email alerts

cron-job.org → POST /api/v1/internal/daily-job   (daily at 9 AM IST)
```

---

## Step 1: Supabase — Database + Storage

### 1.1 Create a project

1. Go to [supabase.com](https://supabase.com) → Sign up (GitHub login works)
2. New Project → fill in:
   - Name: `rental-management`
   - Database password: `<strong-password>` → **save this, you cannot retrieve it later**
   - Region: **Southeast Asia (Singapore)** — closest to India
3. Wait ~2 minutes for the project to provision

### 1.2 Collect your connection strings

Go to **Project Settings → Database → Connection string**

| Variable | Where to copy from | Used for |
|---|---|---|
| `DATABASE_URL` | **Transaction pooler** tab (port 6543) | FastAPI runtime |
| `DATABASE_DIRECT_URL` | **Direct connection** tab (port 5432) | Alembic migrations |

The pooler URL looks like:
```
postgresql://postgres.[project-ref]:[password]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
```

The direct URL looks like:
```
postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres
```

### 1.3 Collect your API keys

Go to **Project Settings → API**

| Variable | Key name in dashboard |
|---|---|
| `SUPABASE_URL` | Project URL (e.g. `https://abcxyz.supabase.co`) |
| `SUPABASE_SERVICE_KEY` | `service_role` secret (not the `anon` key) |

> **Use the service role key in the backend only, never in the frontend.** It bypasses Row Level Security (which we're not using anyway, but good practice).

### 1.4 Create Storage bucket

1. Supabase Dashboard → **Storage** → **New bucket**
2. Name: `rental-docs`
3. **Public: OFF** — documents are private, accessed via signed URLs only
4. File size limit: `5242880` (5 MB)
5. Allowed MIME types: `application/pdf,image/jpeg,image/png`
6. Create bucket

### 1.5 Run Alembic migrations

Run this **once from your local machine** (not from Render — migrations need the direct connection):

```bash
# Clone the repo
git clone https://github.com/yourusername/rental-management.git
cd rental-management

# Install deps
pip install -r requirements.txt

# Set the direct URL in your local .env
echo 'DATABASE_DIRECT_URL=postgresql://postgres:<password>@db.<ref>.supabase.co:5432/postgres' >> .env

# Run migrations
DATABASE_URL=$DATABASE_DIRECT_URL alembic upgrade head

# Verify
DATABASE_URL=$DATABASE_DIRECT_URL alembic current
```

You should see all 6 tables + triggers in the **Supabase Dashboard → Table Editor**.

---

## Step 2: Resend — Transactional Email

### 2.1 Create account and get API key

1. Go to [resend.com](https://resend.com) → Sign up
2. **API Keys** → Create API Key → name it `rental-management` → copy the `re_...` key
3. Save as `RESEND_API_KEY`

### 2.2 Verify your sender domain (or use test address)

**If you have a domain:**
1. Resend → **Domains** → Add domain → enter your domain
2. Add the 3 DNS records (TXT + MX + DKIM) to your DNS provider
3. Wait a few minutes for verification → status turns green
4. Set `EMAIL_SENDER=noreply@yourdomain.com`

**If you don't have a domain yet:**
- Resend provides `onboarding@resend.dev` for testing — use this as `EMAIL_SENDER` during development
- In production, emails from `resend.dev` may land in spam — get a real domain (`.in` domains cost ~₹800/year on GoDaddy/Namecheap)

---

## Step 3: Render — FastAPI Backend

### 3.1 Create a Render account

1. Go to [render.com](https://render.com) → Sign up with GitHub
2. Connect your GitHub account

### 3.2 Create the web service

**Option A — Using render.yaml (recommended)**

Push `render.yaml` to your repo root. Then:
1. Render Dashboard → **New → Blueprint**
2. Select your GitHub repo → Render detects `render.yaml` automatically
3. Fill in the secret env vars marked `sync: false` (see env vars table below)
4. Click **Apply**

**Option B — Manual setup**

1. Render Dashboard → **New → Web Service**
2. Connect your GitHub repo
3. Settings:
   - Name: `rental-api`
   - Region: **Singapore**
   - Branch: `main`
   - Runtime: **Python 3**
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT --workers 2`
   - Plan: **Free**
   - Health check path: `/health`
4. Add all environment variables (see below)
5. Click **Create Web Service**

### 3.3 Set environment variables on Render

Go to your service → **Environment** tab → add these:

| Variable | Value |
|---|---|
| `DATABASE_URL` | Supabase pooler connection string (port 6543) |
| `DATABASE_DIRECT_URL` | Supabase direct connection string (port 5432) |
| `SECRET_KEY` | `python -c "import secrets; print(secrets.token_hex(32))"` |
| `ALGORITHM` | `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `15` |
| `REFRESH_TOKEN_EXPIRE_DAYS` | `7` |
| `SUPABASE_URL` | `https://<project-ref>.supabase.co` |
| `SUPABASE_SERVICE_KEY` | The `service_role` key from Supabase |
| `SUPABASE_STORAGE_BUCKET` | `rental-docs` |
| `RESEND_API_KEY` | `re_...` key from Resend |
| `EMAIL_SENDER` | `noreply@yourdomain.com` |
| `FRONTEND_URL` | Your Vercel/Netlify URL (update after Step 4) |
| `ENVIRONMENT` | `production` |
| `INTERNAL_JOB_SECRET` | `python -c "import secrets; print(secrets.token_hex(24))"` |

### 3.4 Note the Render service URL

After deploying, Render gives you a URL like:
```
https://rental-api.onrender.com
```

Test it: `curl https://rental-api.onrender.com/health` → should return `{"status":"ok"}`

> **Free tier caveat:** Render's free tier spins down services after 15 minutes of inactivity. The first request after sleep takes ~30 seconds (cold start). For a personal/internal tool this is fine. For a production app with real users, upgrade to Render's $7/month Starter plan to eliminate cold starts.

---

## Step 4: Vercel or Netlify — React Frontend

### Option A: Vercel (recommended)

1. Go to [vercel.com](https://vercel.com) → Sign up with GitHub
2. **Add New Project** → Import your GitHub repo
3. Configure:
   - Framework Preset: **Vite**
   - Root Directory: `frontend/` (if monorepo) or leave blank
   - Build Command: `npm run build`
   - Output Directory: `dist`
4. **Environment Variables** → Add:
   - `VITE_API_BASE_URL` = `https://rental-api.onrender.com/api/v1`
   - `VITE_APP_NAME` = `RentEase`
5. Click **Deploy**

Vercel gives you a URL like `https://rental-management.vercel.app`

### Option B: Netlify

1. Go to [netlify.com](https://netlify.com) → Sign up with GitHub
2. **Add new site → Import an existing project** → GitHub
3. Configure:
   - Base directory: `frontend/` (if monorepo) or blank
   - Build command: `npm run build`
   - Publish directory: `dist`
4. **Site settings → Environment variables** → Add:
   - `VITE_API_BASE_URL` = `https://rental-api.onrender.com/api/v1`
   - `VITE_APP_NAME` = `RentEase`
5. Deploy site

Netlify gives you a URL like `https://rental-management.netlify.app`

### After deploying the frontend

Go back to Render → Environment → update `FRONTEND_URL` to your Vercel/Netlify URL:
```
FRONTEND_URL=https://rental-management.vercel.app
```
Render auto-redeploys on env var changes. This is required for CORS to work.

---

## Step 5: External Cron Job (Free Tier Scheduler)

Since Render's free tier has cold starts, we don't rely on APScheduler. Instead, an external cron hits the `/internal/daily-job` endpoint.

### Setup on cron-job.org (free, no credit card)

1. Go to [cron-job.org](https://cron-job.org) → Create free account
2. Dashboard → **Create Cronjob**
3. Fill in:
   - Title: `Rental App — Daily Overdue Check`
   - URL: `https://rental-api.onrender.com/api/v1/internal/daily-job`
   - Schedule: **Custom** → `30 3 * * *` (3:30 UTC = 9:00 AM IST)
   - Request method: `POST`
   - Headers → Add: `X-Internal-Secret` = `<your INTERNAL_JOB_SECRET value>`
4. Save

This hits the backend daily, which wakes it up from cold start and runs the overdue check. Execution logs are visible in the cron-job.org dashboard.

---

## Step 6: CI/CD with GitHub Actions

Push this file to `.github/workflows/deploy.yml`. On every push to `main`:
- Backend tests run, then Render deploys automatically (Render's GitHub integration handles this)
- Frontend builds, tests, and deploys to Vercel/Netlify

```yaml
# .github/workflows/deploy.yml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  # ── Backend Tests ─────────────────────────────────────────────────────────────
  backend-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Set up Python 3.11
        uses: actions/setup-python@v5
        with:
          python-version: "3.11"

      - name: Cache pip
        uses: actions/cache@v4
        with:
          path: ~/.cache/pip
          key: ${{ runner.os }}-pip-${{ hashFiles('requirements.txt') }}

      - name: Install dependencies
        run: pip install -r requirements.txt pytest

      - name: Run tests
        run: pytest tests/ -v
        env:
          DATABASE_URL: ${{ secrets.TEST_DATABASE_URL }}  # SQLite or Supabase test project
          SECRET_KEY: test-secret-key-for-ci-only
          SUPABASE_URL: https://placeholder.supabase.co
          SUPABASE_SERVICE_KEY: placeholder
          SUPABASE_STORAGE_BUCKET: test-bucket
          RESEND_API_KEY: placeholder
          EMAIL_SENDER: test@example.com
          INTERNAL_JOB_SECRET: test-secret
          FRONTEND_URL: http://localhost:5173
          ENVIRONMENT: development

  # ── Backend Deploy (Render does this automatically via GitHub integration) ──
  # Render redeploys on every push to main.
  # No extra step needed here — just ensure render.yaml is in repo root.

  # ── Frontend Tests + Deploy ───────────────────────────────────────────────────
  frontend:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: frontend
    steps:
      - uses: actions/checkout@v4

      - name: Set up Node 20
        uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"
          cache-dependency-path: frontend/package-lock.json

      - name: Install dependencies
        run: npm ci

      - name: Type check
        run: npx tsc --noEmit

      - name: Run tests
        run: npm run test -- --run

      - name: Build
        run: npm run build
        env:
          VITE_API_BASE_URL: https://rental-api.onrender.com/api/v1
          VITE_APP_NAME: RentEase

      # Vercel deploys automatically via Vercel's GitHub integration.
      # Netlify deploys automatically via Netlify's GitHub integration.
      # No extra deploy step needed here — the build above just validates it.
```

> **Tip:** Both Vercel and Netlify have their own GitHub integrations that trigger deployments automatically on push. You don't need a custom deploy step in GitHub Actions — the CI job above just validates the build. The actual deploy happens in Vercel/Netlify's own system.

### GitHub Secrets to configure

Go to **GitHub repo → Settings → Secrets → Actions → New repository secret**:

| Secret Name | Value |
|---|---|
| `TEST_DATABASE_URL` | A separate Supabase test project URL, or `sqlite:///./test.db` if using SQLite for CI |

That's it — no AWS keys, no SSH keys, no EC2 deploy scripts.

---

## Environment Variables Reference

### Backend (set in Render dashboard)

```env
DATABASE_URL=postgresql://postgres.[ref]:[password]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
DATABASE_DIRECT_URL=postgresql://postgres:[password]@db.[ref].supabase.co:5432/postgres
SECRET_KEY=<64-char hex string>
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=7
SUPABASE_URL=https://[ref].supabase.co
SUPABASE_SERVICE_KEY=eyJ...
SUPABASE_STORAGE_BUCKET=rental-docs
RESEND_API_KEY=re_...
EMAIL_SENDER=noreply@yourdomain.com
FRONTEND_URL=https://your-app.vercel.app
ENVIRONMENT=production
INTERNAL_JOB_SECRET=<48-char hex string>
```

### Frontend (set in Vercel/Netlify dashboard — not in git)

```env
VITE_API_BASE_URL=https://rental-api.onrender.com/api/v1
VITE_APP_NAME=RentEase
```

---

## Running the Full Stack Locally

```bash
# Terminal 1 — Backend
cd rental-management
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # fill in your local Supabase + Resend values
DATABASE_URL=$DATABASE_DIRECT_URL alembic upgrade head
uvicorn app.main:app --reload --port 8000

# Terminal 2 — Frontend
cd rental-management/frontend
npm install
echo "VITE_API_BASE_URL=http://localhost:8000/api/v1" > .env.local
npm run dev
# → http://localhost:5173
```

---

## Useful Commands (Post-Deploy)

```bash
# Check Render logs (via Render dashboard → Logs tab)
# Or use Render CLI:
render logs --service rental-api --tail

# Manually trigger the daily job (from your machine)
curl -X POST https://rental-api.onrender.com/api/v1/internal/daily-job \
     -H "X-Internal-Secret: <your INTERNAL_JOB_SECRET>"

# Manually run migrations against Supabase
DATABASE_URL=$DATABASE_DIRECT_URL alembic upgrade head

# Rollback one migration
DATABASE_URL=$DATABASE_DIRECT_URL alembic downgrade -1

# Check DB directly (from local machine)
psql "postgresql://postgres:<password>@db.<ref>.supabase.co:5432/postgres" -c "\dt"

# Redeploy backend manually
# Push a commit to main, or Render dashboard → Manual Deploy → Deploy latest commit

# Redeploy frontend manually
# Push a commit to main, or Vercel/Netlify dashboard → Deployments → Redeploy
```

---

## Cost After Free Tier Limits

| Service | When free tier runs out | Cost |
|---|---|---|
| Supabase | 500 MB DB / 1 GB Storage | Pro plan $25/month (8 GB DB + 100 GB storage) |
| Render | >750 instance hours or needs no cold starts | Starter $7/month (always-on) |
| Vercel | >100 GB bandwidth | Pro $20/month (1 TB bandwidth) |
| Netlify | >100 GB bandwidth or >300 build min | Pro $19/month |
| Resend | >3,000 emails/month | $20/month (50K emails) |

For a small landlord managing ~20-30 units, the free tier comfortably handles everything indefinitely. The only pain point is Render's cold start — upgrade to $7/month if tenants or you find the 30-second first-load annoying.

---

## Deployment Checklist

### Supabase
- [ ] Project created in **Singapore** region
- [ ] Both `DATABASE_URL` (pooler) and `DATABASE_DIRECT_URL` (direct) copied
- [ ] `SUPABASE_SERVICE_KEY` is the **service_role** key, not the anon key
- [ ] `rental-docs` storage bucket created with **public: OFF**
- [ ] Alembic migrations run successfully (`alembic current` shows `001`)
- [ ] All 6 tables visible in Supabase Table Editor

### Resend
- [ ] API key created and saved as `RESEND_API_KEY`
- [ ] Sender domain verified (or using `onboarding@resend.dev` for testing)
- [ ] `EMAIL_SENDER` matches the verified domain/email

### Render
- [ ] `Procfile` and `render.yaml` committed to repo root
- [ ] Web service connected to GitHub repo
- [ ] All 13 environment variables set in Render dashboard
- [ ] `ENVIRONMENT=production` (disables FastAPI `/docs` endpoint)
- [ ] Health check path set to `/health`
- [ ] First deploy succeeds (`/health` returns `{"status":"ok"}`)

### Vercel / Netlify
- [ ] `vercel.json` (Vercel) or `netlify.toml` (Netlify) committed to `frontend/` folder — without this, page refresh on any route returns a 404
- [ ] `VITE_API_BASE_URL` set in platform dashboard environment variables
- [ ] First deploy succeeds and app loads at the platform URL

### Wiring together
- [ ] `FRONTEND_URL` on Render updated to the actual Vercel/Netlify URL
- [ ] Backend re-deployed after `FRONTEND_URL` update (CORS breaks without this)
- [ ] Login flow tested end-to-end (register → login → dashboard loads data)
- [ ] File upload tested (upload tenant ID doc → signed URL returned and file opens)

### Scheduler
- [ ] cron-job.org job created, schedule `30 3 * * *`
- [ ] URL is `https://rental-api.onrender.com/api/v1/internal/daily-job`
- [ ] `X-Internal-Secret` header matches `INTERNAL_JOB_SECRET` env var on Render
- [ ] First manual trigger returns `{"marked_overdue": ..., "emails_sent": ...}`

### Security
- [ ] `SECRET_KEY` is a random 256-bit hex string (not a dictionary word)
- [ ] `INTERNAL_JOB_SECRET` is a random hex string (not guessable)
- [ ] `.env` is in `.gitignore` — not committed to the repo
- [ ] Supabase storage bucket is **not** set to public
- [ ] FastAPI `/docs` is disabled in production (`ENVIRONMENT=production`)
- [ ] HTTPS enforced on all three services (Render, Vercel, Netlify all do this by default)
