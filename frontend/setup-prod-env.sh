#!/bin/bash
# Production Environment Setup Script
# Run this to generate secrets and configure both services

set -e

echo "🚀 Cahier Production Deployment Setup"
echo "======================================"
echo ""

# Generate JWT Secret
echo "📝 Generating JWT_SECRET..."
JWT_SECRET=$(openssl rand -base64 32)
echo "   JWT_SECRET=$JWT_SECRET"
echo "   ⚠️  Save this securely!"
echo ""

# Railway Environment Variables Template
echo "📍 Railway Backend Env Vars (Set in Dashboard)"
echo "================================================"
cat << EOF
ENV=prod
PORT=8080
LOG_LEVEL=info
TURSO_DB_URL=libsql://[your-org]-[hash].turso.io
TURSO_DB_TOKEN=[bearer-token-from-turso]
TMDB_API_READ_TOKEN=[your-tmdb-token]
JWT_SECRET=$JWT_SECRET
ALLOWED_ORIGINS=https://cahier-prod.vercel.app
EOF
echo ""

# Vercel Environment Variables Template
echo "🔗 Vercel Frontend Env Vars (Set in Dashboard)"
echo "=============================================="
cat << EOF
## Production
VITE_API_BASE_URL=/api
VITE_BACKEND_URL=https://cahier-api.railway.app

## Preview/Development
VITE_BACKEND_URL=http://localhost:8080
EOF
echo ""

echo "✅ Setup Guide:"
echo "1. Go to Railway Dashboard → New Project → GitHub"
echo "2. Select cahier repo, root=/backend/go"
echo "3. Copy env vars above to Railway Variables"
echo "4. Go to Vercel Dashboard → Add Project → GitHub"
echo "5. Select cahier repo, root=frontend"
echo "6. Copy env vars above to Vercel Variables"
echo "7. After deployment, update ALLOWED_ORIGINS with final Vercel URL"
echo ""

echo "🔐 JWT_SECRET saved to: $JWT_SECRET"
echo "   Make sure to save this in a secure location!"
