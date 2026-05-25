# Production Deployment Quick Start

> **Status:** Ready for Production Deployment  
> **Target:** Railway (backend) + Vercel (frontend)  
> **Date:** April 2, 2026

---

## 📋 Pre-Flight Checklist (5 mins)

```bash
# 1. Generate JWT Secret
openssl rand -base64 32
# → Save this somewhere secure!

# 2. Verify backend builds
cd backend/go
go build -o main

# 3. Verify frontend builds  
cd frontend
npm run build
# Check dist/ folder exists

# 4. Verify migrations exist
ls -la data/migrations/
# Should have: 001_schema.sql, 004_collections_rankings.sql
```

---

## 🚀 Deployment Steps (30 mins)

### Step 1: Deploy Backend to Railway

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Navigate to backend
cd backend/go

# Link to Railway project (create new)
railway link --new

# Deploy
railway up

# Get your domain
railway domain
# Save as: RAILWAY_DOMAIN
```

### Step 2: Configure Railway Environment

In Railway Dashboard → Project → Variables:

```bash
ENV                    prod
PORT                   8080
LOG_LEVEL              info
TURSO_DB_URL           ← From Turso console
TURSO_DB_TOKEN         ← From Turso console
TMDB_API_READ_TOKEN    ← From TMDB settings
JWT_SECRET             ← From openssl command above
ALLOWED_ORIGINS        https://cahier-prod.vercel.app
```

### Step 3: Test Backend

```bash
curl https://[RAILWAY_DOMAIN]/health
# Expected: {"status":"ok"}

# If it fails:
railway logs
# Check for connection errors
```

### Step 4: Deploy Frontend to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Navigate to frontend
cd frontend

# Deploy to production
vercel --prod
# Select project (or create new)
# DO NOT override settings on first prompt

# Get your domain
# Saved as: VERCEL_DOMAIN
```

### Step 5: Configure Vercel Environment

In Vercel Dashboard → Settings → Environment Variables:

| Name | Value | Env |
|------|-------|-----|
| `VITE_API_BASE_URL` | `/api` | Production |
| `VITE_BACKEND_URL` | `https://[RAILWAY_DOMAIN]` | Production |

### Step 6: Update Backend CORS

Back to Railway → Variables:

```bash
ALLOWED_ORIGINS    https://[VERCEL_DOMAIN].vercel.app
# Redeploy triggers automatically
```

### Step 7: End-to-End Test

```bash
# Open frontend
https://[VERCEL_DOMAIN].vercel.app

# Test flow:
□ Homepage loads
□ Register → Create account
□ Login → Get JWT token
□ Play game → API calls work
□ Leaderboard → Loads and displays
```

---

## 🔧 Environment Variables Reference

### Backend (Railway)
```
ENV=prod
TURSO_DB_URL=libsql://your-org-hash.turso.io
TURSO_DB_TOKEN=eyJhbGc...
TMDB_API_READ_TOKEN=eyJhbGc...
JWT_SECRET=[openssl-generated-32-chars]
ALLOWED_ORIGINS=https://cahier-prod.vercel.app
LOG_LEVEL=info
PORT=8080
```

### Frontend (Vercel)
```
VITE_API_BASE_URL=/api
VITE_BACKEND_URL=https://cahier-api.railway.app
```

---

## 📊 Post-Deployment Verification

```bash
# 1. Health Checks
curl https://[RAILWAY_DOMAIN]/health
curl https://[VERCEL_DOMAIN].vercel.app/

# 2. API Endpoint Test
curl -X POST https://[VERCEL_DOMAIN].vercel.app/api/items/movies \
  -H "Content-Type: application/json" \
  -d '{}'

# 3. Check Logs
railway logs                    # Backend logs
vercel logs --follow           # Frontend logs

# 4. Monitor Performance
# Railway Dashboard → Metrics
# Vercel Dashboard → Analytics
```

---

## 🆘 Troubleshooting

### Issue: "502 Bad Gateway" from Vercel
```bash
# Check 1: Is Railway running?
railway logs | grep "error"

# Check 2: Is CORS configured?
curl -i https://[RAILWAY_DOMAIN]/health

# Check 3: Environment variables set?
railway env:list
```

### Issue: "CORS Error" in Browser
```bash
# Check Vercel frontend sending correct origin
railway logs | grep "origin"

# Fix: Update ALLOWED_ORIGINS in Railway
# Then verify redeploy triggered
railway status
```

### Issue: "Database Connection Failed"  
```bash
# Verify credentials
echo $TURSO_DB_URL
echo $TURSO_DB_TOKEN

# Test Turso directly
turso db show

# If credentials wrong, update in Railway and redeploy
```

### Issue: "JWT Signature Invalid"
```bash
# JWT_SECRET mismatch between builds
# Regenerate: openssl rand -base64 32
# Update in Railway → Variables → JWT_SECRET
# REDEPLOY both services
```

---

## 📝 Common Commands

```bash
# Railway
railway login                  # Authenticate
railway link                   # Link to project
railway up                     # Deploy
railway domain                 # Get service domain
railway env:pull              # Download env vars
railway logs                  # Stream logs
railway status                # Check deployment status

# Vercel  
vercel --prod                 # Deploy to production
vercel env:pull              # Download env vars
vercel logs --follow         # Stream logs
vercel list                  # List deployments

# Turso
turso db create              # Create new database
turso db shell               # Access database CLI
turso db show                # Get connection details
turso account                # Show account info
```

---

## 📱 Testing Checklist

After deployment, test these flows:

### Authentication
- [ ] Register new account
- [ ] Login with credentials
- [ ] Logout

### Game Flow
- [ ] Start game
- [ ] Answer questions
- [ ] Submit answers
- [ ] View score/results

### Leaderboards
- [ ] View game session leaderboard
- [ ] View ranking mixer leaderboard
- [ ] Switch categories (movies/tv/anime/mixed)

### Performance
- [ ] Load times < 2s
- [ ] API responses < 200ms
- [ ] No console errors
- [ ] Network requests show `/api` proxy

---

## 🔐 Security Reminders

⚠️ **Never:**
- Commit `.env` files to git
- Share environment variables in chat/email
- Use default/simple JWT_SECRET
- Expose TURSO_DB_TOKEN publicly

✅ **Always:**
- Use Railway/Vercel dashboard for secrets
- Rotate JWT_SECRET monthly
- Check logs for security warnings
- Monitor failed auth attempts

---

## 🎯 Next Steps After Deployment

1. **Monitor** first 24 hours actively
2. **Set up alerts** in Railway/Vercel
3. **Test failover** (redeploy previous build)
4. **Document runbooks** for your ops team
5. **Plan scaling** (Turso tier upgrade if needed)
6. **Enable auto-deploy** from main branch (optional)

---

## 📞 Support

**Issues?**
- Railway Debug: `railway logs` + error search
- Vercel Debug: Dashboard → Deployments → Logs tab
- Turso Debug: `turso db shell` for direct SQL
- GitHub: Check backend/go logs during build

---

**Deployment Completed:** ✅  
**Ready for Production:** ✅  
**Last Updated:** April 2, 2026
