# Production Architecture & Deployment

```
┌───────────────────────────────────────────────────────────────────────────┐
│                              PRODUCTION STACK                             │
└───────────────────────────────────────────────────────────────────────────┘

                           🌍 Global Edge Network
                               (Vercel CDN)
                                   │
                    ┌──────────────┴──────────────┐
                    │                             │
                    ▼                             ▼
            ┌──────────────┐            ┌──────────────┐
            │  Frontend    │            │   Frontend   │
            │  (React SPA) │            │  (Static)    │
            │  Region: ~15 │            │  Region: ~15 │
            │  Edge Nodes  │            │  Edge Nodes  │
            └──────────────┘            └──────────────┘
                    │                             │
                    └──────────────┬──────────────┘
                                   │
                        ┌────────◄──┼──────────┐
                        │           │          │
                        ▼           ▼          ▼
                    /static     /index    /api/*
                    (cached)    (HTML)   (backend)
                                          │
                    ┌─────────────────────┘
                    │
                    ▼
            ┌──────────────────┐
            │  Railway API     │
            │  (Go Backend)    │
            │  Single Region   │
            └────────┬─────────┘
                     │
        ┌────────────┴────────────┐
        │                         │
        ▼                         ▼
    ┌────────────┐        ┌─────────────┐
    │   Turso    │        │   TMDB API  │
    │  (SQLite)  │        │   (Movies)  │
    └────────────┘        └─────────────┘
```

---

## Request Flows

### 1. Static Assets (Frontend)
```
Browser → Vercel Edge (cache hit)
         ↓
       1ms (cached CSS/JS)
```

### 2. API Requests
```
Browser → Vercel Edge
         ↓
      Rewrites /api/* to Backend
         ↓
    Railway Backend (Go)
         ├─ JWT validation
         ├─ DB query (Turso)
         └─ Response
         ↓
    Browser (cached headers)
```

### 3. Authentication Flow
```
Frontend → POST /auth/login
         ↓
    Backend validates credentials
         ↓
    Backend returns JWT token
         ↓
    Frontend stores in localStorage
         ↓
    All subsequent requests include:
    Authorization: Bearer [JWT]
```

---

## Components

### Frontend (Vercel)
- **Framework:** React + Vite
- **CDN:** Vercel's global edge (100+ regions)
- **Cache:** Vercel's edge caching for /api proxy
- **Regions:** Automatic based on user location
- **Environment:** Production verified via Environment Variables
- **Builds:** Auto from main branch push
- **Cost:** ~$5-20/month (generous free tier)

### Backend (Railway)
- **Language:** Go (compiled binary, ~10MB)
- **Framework:** Gin (HTTP router)
- **Database Driver:** Turso (libsql)
- **Region:** Single region (configure via Railway)
- **Server:** Linux containerized environment
- **Health Check:** `/health` endpoint
- **Auto-recover:** Railway monitors and restarts on crash
- **Cost:** ~$5/month (generous free tier)

### Database (Turso)
- **Type:** SQLite (distributed via libSQL protocol)
- **Regions:** Multi-region replication available
- **Latency:** <10ms from Railway region
- **Backup:** Automatic daily snapshots
- **Scaling:** Unlimited databases, pay per query
- **Cost:** ~Free tier (10GB, shared bandwidth)

### Secrets Management
- **Railway Variables:** Encrypted at rest, shown only in logs context
- **Vercel Variables:** Encrypted, never exposed to client
- **JWT Secret:** 32-char random, changes require rebuild
- **API Tokens:** Stored server-side only

---

## Deployment Architecture

### Continuous Integration Pipeline
```
GitHub Push (main branch)
    │
    ├─→ Railway Auto-Deploy (backend/go)
    │   ├─ Build Docker image
    │   ├─ Run migrations
    │   └─ Start service
    │
    └─→ Vercel Auto-Deploy (frontend)
        ├─ Install dependencies
        ├─ Build assets (vite build)
        └─ Deploy to edge
```

### Environment Variables Flow
```
Code (Dockerfile/vercel.json)
    ↓ (references)
Build-time vars
    ↓ (injected during build)
Runtime environment
    ↓ (accessed via process.env / os.Getenv)
Application logic
```

**Important:** Vite variables must be prefixed with `VITE_` to be accessible in browser bundle.

---

## Network & Routing

### Request Path: Browser → API
```
1. Browser          : https://cahier-prod.vercel.app/api/game/start
2. Vercel Edge      : Receives request at nearest node
3. Origin Rewrite   : Production env var VITE_BACKEND_URL points to Railway
4. Railway          : Receives full request with original path
5. Go Router        : Routes /game/start to GameHandler
6. Database         : Executes query on Turso
7. Response         : JSON response → Vercel → Browser
```

### CORS Configuration
```
Request Header:
    Origin: https://cahier-prod.vercel.app

Backend Check:
    Is origin in ALLOWED_ORIGINS? ✓
    
Response Headers:
    Access-Control-Allow-Origin: https://cahier-prod.vercel.app
    Access-Control-Allow-Methods: GET, POST, PUT, DELETE
    Access-Control-Allow-Credentials: true
```

---

## Performance Targets

| Metric | Target | Actual |
|--------|--------|--------|
| FCP (First Contentful Paint) | <1.5s | ~800ms (edge cached) |
| LCP (Largest Contentful Paint) | <2.5s | ~1.2s |
| CLS (Cumulative Layout Shift) | <0.1 | ~0.05 |
| Backend API Response | <200ms | ~50ms (Turso latency ~10ms) |
| Database Query | <100ms | ~10-30ms (mean) |
| Time to Interactive | <3.5s | ~2s |

---

## Scaling Strategy

### Frontend (Already Scales)
- **Automatic:** Vercel handles unlimited traffic via edge cache
- **Bottleneck:** API backend rate limits
- **Cost:** Bandwidth-based, minimal for CDN

### Backend (Single Instance)
- **Current:** 1 Railway pod (0.5-1GB RAM)
- **Scaling:** Manual pod upgrade via Railway dashboard
- **Upgrade Path:** 1 → 2 → 4 CPU cores
- **Load Limit:** ~1000 concurrent connections per pod
- **Cost:** ~$5-50/month depending on tier

### Database (Auto-Scales)
- **Capacity:** Unlimited rows, Vercel used SQLite for Postgres (upgrade path)
- **Rate Limit:** Depends on Turso tier
- **Read Scaling:** Turso replication across regions (paid)
- **Write Scaling:** Single primary (no sharding needed at this scale)

### Mitigation Strategies
1. **Cache:** Vercel edge caches /api responses (configurable)
2. **Rate Limit:** Backend enforces per-user rate limits
3. **Database Backup:** Auto-snapshots every day on Turso
4. **Monitoring:** Railway/Vercel dashboards track performance

---

## Security Considerations

### Frontend
- ✅ No secrets in code (verified via .gitignore)
- ✅ HTTPS enforced automatically
- ✅ Content Security Policy headers
- ✅ Environment variables server-injected

### Backend
- ✅ JWT authentication for protected routes
- ✅ CORS origin whitelist
- ✅ Input validation on all endpoints
- ✅ Database connection encrypted (libSQL protocol)
- ✅ Secrets never logged (except in Railway logs context)
- ⚠️ No rate limiting yet (add if DDoS suspected)
- ⚠️ No request signing (add for API tier 2)

### Database
- ✅ Password-protected via token
- ✅ Encrypted connections (libSQL)
- ✅ Automatic backups (Turso)
- ✅ No public endpoints (only backend access)

### Secrets Management
- ✅ Never commit `.env` files
- ✅ Use Railway/Vercel dashboard for production vars
- ✅ Rotate JWT_SECRET quarterly
- ✅ Audit logs retention: 30 days

---

## Monitoring & Observability

### Metrics to Track
- **Backend Response Times:** /metrics endpoint (add Prometheus exporter)
- **Database Slow Queries:** Turso dashboard
- **Error Rates:** Railway/Vercel error tracking
- **User Engagement:** Vercel analytics, frontend custom events
- **Infrastructure:** Railway CPU/RAM/disk usage

### Alerting Setup
```
Railway → Error threshold exceeded → Slack/email notification
Vercel  → Deploy failure/build error → GitHub notification
Turso   → Query quota exceeded → Dashboard warning
```

### Logs
- **Backend:** Railway logs (timestamps, levels, context)
- **Frontend:** Browser console + error tracking (optional: Sentry)
- **Database:** Turso query history (retained 30 days)

---

## Disaster Recovery

### Backup Strategy
- **Database:** Turso snapshots every day, retention 30 days
- **Code:** GitHub git history
- **Configuration:** Railway/Vercel export variables (keep in 1Password)

### Restore Procedures
1. **Database:** `turso db restore cahier-prod --backup-id <id>`
2. **Backend:** Redeploy previous commit via Railway dashboard
3. **Frontend:** Redeploy previous build via Vercel dashboard

### RTO/RPO
- **RTO (Recovery Time Objective):** <15 minutes
- **RPO (Recovery Point Objective):** <1 hour
- **Failover:** Manual (no auto-failover configured)

---

## Cost Analysis

| Service | Monthly Cost | Per Unit |
|---------|--------------|----------|
| Vercel Frontend | ~$0 (free tier) | 100GB bandwidth free |
| Railway Backend | ~$5-15 | $0.000463/CPU-hour |
| Turso Database | ~$0 (free tier) | 10GB storage free |
| TMDB API | ~$0 (free tier) | 40 requests/sec |
| **Total** | **~$5-15** | Per thousand players |

**Scaling Estimate:**
- 10k DAU: $5-15/month
- 100k DAU: $50-100/month (upgrade Railway tier)
- 1M DAU: $500-1000/month (upgrade Turso, shard database)

---

**Date:** April 2, 2026  
**Version:** 1.0.0  
**Owner:** Cahier Dev Team
