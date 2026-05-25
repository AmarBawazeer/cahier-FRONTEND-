# 🚀 Cahier Production Deployment Checklist

## Phase 1: Pre-Deployment Prep

### Secrets & Keys
- [ ] Generate JWT_SECRET: `openssl rand -base64 32`
- [ ] Get Turso credentials (DB URL + token)
- [ ] Get TMDB API token from themoviedb.org/settings/api
- [ ] Store secrets in password manager (not git!)

### Database Pre-Setup
- [ ] Create Turso database: `turso db create cahier-prod`
- [ ] Get connection URL: `turso db show cahier-prod`
- [ ] Run migrations via Turso CLI

---

## Phase 2: Railway Backend Deployment

### 1. Deploy Service
```bash
cd backend/go
railway login
railway link  # Create new or select existing project
railway up    # Deploy
```

### 2. Set Environment Variables
Go to Railway Dashboard → Select project → Variables:

```
ENV                    prod
PORT                   8080
LOG_LEVEL              info
TURSO_DB_URL           libsql://[your-org]-[hash].turso.io
TURSO_DB_TOKEN         [bearer-token]
TMDB_API_READ_TOKEN    [your-token]
JWT_SECRET             [generated-32-chars]
ALLOWED_ORIGINS        https://cahier-prod.vercel.app
```

### 3. Verify Deployment
```bash
# Get Railway domain
railway domain  # or check dashboard

# Test health endpoint
curl https://cahier-xxx.railway.app/health
# Expected: {"status":"ok"}
```

**Save domain for Step 4** → `RAILWAY_DOMAIN`

---

## Phase 3: Vercel Frontend Deployment

### 1. Deploy Service
```bash
cd frontend
vercel --prod
```

### 2. Set Environment Variables
Go to Vercel Dashboard → Settings → Environment Variables:

| Name | Value | Environment |
|------|-------|-------------|
| VITE_API_BASE_URL | `/api` | Production |
| VITE_BACKEND_URL | `https://[RAILWAY_DOMAIN]` | Production |

### 3. Verify Deployment
- [ ] Frontend loads at your Vercel URL
- [ ] API calls succeed (check Network tab)
- [ ] Login/register flow works
- [ ] Games load properly

**Save domain** → `VERCEL_DOMAIN`

---

## Phase 4: Final Configuration

### Update Backend ALLOWED_ORIGINS
Go to Railway → Variables:
```
ALLOWED_ORIGINS=https://[VERCEL_DOMAIN].vercel.app
```

Redeploy or wait for auto-redeploy.

### Test End-to-End
1. [ ] Load frontend at Vercel URL
2. [ ] Create account / login
3. [ ] Play a game
4. [ ] Check leaderboard
5. [ ] View browser network requests (should use `/api` proxy)

---

## Phase 5: Post-Deployment

### Monitoring
- [ ] Enable Railway error notifications
- [ ] Enable Vercel Slack/email alerts
- [ ] Monitor first 24hrs actively
- [ ] Check logs for errors

### Performance
- [ ] Test on mobile
- [ ] Load test with artillery or similar
- [ ] Check Vercel analytics dashboard
- [ ] Monitor database query performance

### Security
- [ ] Verify HTTPS on both services
- [ ] Check CORS headers
- [ ] Verify JWT tokens working
- [ ] Monitor for any auth failures in logs

### Maintenance
- [ ] Schedule regular backups (Turso handles this)
- [ ] Document deployment process for team
- [ ] Create runbooks for common issues
- [ ] Set up auto-deploy from main branch (optional)

---

## Quick Reference: Environment Variables

### Backend (Railway)
```bash
ENV=prod
TURSO_DB_URL=libsql://...
TURSO_DB_TOKEN=...
TMDB_API_READ_TOKEN=...
JWT_SECRET=...
ALLOWED_ORIGINS=https://cahier-prod.vercel.app
```

### Frontend (Vercel)
```bash
VITE_API_BASE_URL=/api
VITE_BACKEND_URL=https://cahier-api.railway.app
```

---

## Rollback Procedures

### If Backend Breaks
1. Go to Railway → Deployments
2. Find last working deployment
3. Click "Redeploy"
4. Check logs: `railway logs`

### If Frontend Breaks
1. Go to Vercel → Deployments
2. Find last working deployment
3. Click "..." → "Promote to Production"
4. Check logs in Deployments tab

---

## Useful Commands

```bash
# Railway
railway logs                    # Stream backend logs
railway env:pull               # Download env vars locally
railway run go run main.go     # Test run locally with prod vars

# Vercel
vercel logs --follow           # Stream frontend logs
vercel env:pull .env.local     # Download env vars locally

# Turso
turso db list                  # List databases
turso db shell cahier-prod     # Access database CLI
turso db usage                 # Check storage/bandwidth
```

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| 502/503 from Vercel | Check Railway service is running, check CORS headers |
| Auth fails after deploy | Verify JWT_SECRET matches between builds |
| API calls from frontend fail | Check ALLOWED_ORIGINS, verify backend domain reachable |
| Database connection fails | Verify TURSO_DB_URL and TURSO_DB_TOKEN, check Turso dashboard |
| Frontend loads but API times out | Backend might be cold-starting, Railway has free tier spindown |

---

**Last Updated:** April 2, 2026
**Maintained by:** Cahier Team
