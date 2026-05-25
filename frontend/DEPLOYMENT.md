# Production Deployment Guide

## Overview
- **Backend**: Go API deployed on Railway
- **Frontend**: React/Vite deployed on Vercel
- **Database**: Turso (SQLite)
- **CDN**: Vercel's global edge network

---

## Backend (Railway) Setup

### Prerequisites
1. Railway account (railway.app)
2. Turso database & token
3. TMDB API read access token

### Step 1: Connect Repository & Deploy
```bash
# Via Railway CLI
railway login
cd backend/go
railway link   # Select/create project
railway up
```

Or via Railway Dashboard:
1. New Project → GitHub repo
2. Select `/backend/go` as root directory
3. Deploy

### Step 2: Set Environment Variables
In Railway Dashboard → Variables tab, set all REQUIRED vars:

**REQUIRED:**
- `ENV` = `prod`
- `TURSO_DB_URL` = `libsql://your-org-abc123.turso.io` (from Turso console)
- `TURSO_DB_TOKEN` = Bearer token from Turso (keep secret!)
- `TMDB_API_READ_TOKEN` = TMDB API token
- `JWT_SECRET` = Strong random secret (min 32 chars) `openssl rand -base64 32`
- `ALLOWED_ORIGINS` = `https://cahier-vercel-url.vercel.app` (set after Vercel deploy)

**OPTIONAL:**
- `LOG_LEVEL` = `info` (default: info for prod)
- `PORT` = Railway sets automatically

### Step 3: Verify Deployment
```bash
curl https://cahier-xxx.railway.app/health
# Expected: {"status":"ok"}
```

Save the domain: **https://cahier-xxx.railway.app**

---

## Frontend (Vercel) Setup

### Prerequisites
1. Vercel account (vercel.com)
2. GitHub repo connected

### Step 1: Connect & Deploy
```bash
cd frontend
vercel --prod
```

Or via Vercel Dashboard:
1. Add New → Project
2. Import GitHub repo
3. Framework: Vite
4. Deploy

### Step 2: Set Environment Variables
In Vercel Dashboard → Settings → Environment Variables:

**Production:**
- `VITE_API_BASE_URL` = `/api`
- `VITE_BACKEND_URL` = `https://cahier-xxx.railway.app`

**Preview/Development:**
- `VITE_BACKEND_URL` = `http://localhost:8080`

### Step 3: Configure API Proxy
Vercel routes `/api/*` to backend via:
- Edit `frontend/vercel.json` (uses rewrites for SPA routing)
- Backend CORS already configured to accept Vercel domain

---

## Update Backend ALLOWED_ORIGINS

Once Vercel domain is live (e.g., `cahier-prod.vercel.app`):

1. Go to Railway Dashboard → Variables
2. Update `ALLOWED_ORIGINS` = `https://cahier-prod.vercel.app`
3. Trigger redeploy or wait for auto-redeploy

---

## Database: Turso Migration

### Create Turso Database
```bash
# Via Turso CLI
turso db create cahier-prod

# Get connection details
turso db show cahier-prod
```

### Run Migrations
```bash
# From project root
sqlite3 cahier-migrations.db < data/migrations/001_schema.sql
sqlite3 cahier-migrations.db < data/migrations/004_collections_rankings.sql

# Verify
turso db shell cahier-prod
> SELECT name FROM sqlite_master WHERE type='table';
```

---

## Health Checks & Monitoring

### Backend Health
```bash
curl -i https://cahier-xxx.railway.app/health
```

### Logs
**Railway:**
```bash
railway logs
```

**Vercel:**
Dashboard → Deployments → Select build → Logs tab

### Errors
- 502/503: Backend down or slow
- CORS errors: Check `ALLOWED_ORIGINS` in Railway
- Auth fails: Verify `JWT_SECRET` matches between builds

---

## Rollback Plan

**Backend (Railway):**
1. Dashboard → Deployments
2. Click previous successful build
3. Click "Redeploy"

**Frontend (Vercel):**
1. Dashboard → Deployments
2. Click previous successful build
3. Click "..." → Redeploy

---

## Environment Variables Checklist

### Railway (Backend)
- [ ] `ENV=prod`
- [ ] `TURSO_DB_URL`
- [ ] `TURSO_DB_TOKEN`
- [ ] `TMDB_API_READ_TOKEN`
- [ ] `JWT_SECRET` (generated via `openssl rand -base64 32`)
- [ ] `ALLOWED_ORIGINS=https://cahier-prod.vercel.app`

### Vercel (Frontend)
- [ ] `VITE_API_BASE_URL=/api`
- [ ] `VITE_BACKEND_URL=https://cahier-xxx.railway.app`

### Turso
- [ ] Database created
- [ ] Migrations applied (001, 004)
- [ ] Token stored securely

---

## Post-Deployment

1. **Test login flow**: Register → Login → Game session
2. **Monitor logs**: Check both Railway and Vercel dashboards
3. **Load test**: Run basic load tests to ensure stability
4. **Enable auto-deploy**: Configure GitHub pushes to trigger deploys
5. **Set up alerts**: Configure Railway/Vercel alerts for errors

