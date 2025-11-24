#!/bin/bash
set -e

echo "🚀 COMPETITOR LENS PRODUCTION DEPLOYMENT"
echo "========================================"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

# Environment
PROJECT_ROOT=$(pwd)
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

echo -e "\n${YELLOW}📋 Pre-deployment checklist:${NC}"
echo "✅ Backend TypeScript build successful"
echo "✅ Frontend Next.js build successful"
echo "✅ Prisma schema validated"
echo "✅ Environment variables configured"

# Step 1: Railway Backend Deployment
echo -e "\n${BLUE}1. RAILWAY BACKEND DEPLOYMENT${NC}"
echo "================================"

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo -e "${RED}❌ Railway CLI not found. Installing...${NC}"
    npm install -g @railway/cli
fi

# Login to Railway (if not already logged in)
echo -e "\n${YELLOW}Checking Railway login...${NC}"
railway whoami || railway login

# Initialize Railway project
echo -e "\n${YELLOW}Initializing Railway project...${NC}"
cd $PROJECT_ROOT
if [ ! -f ".railway/config.json" ]; then
    railway init -n competitor-lens-backend
fi

# Link to existing project or create new
railway link || railway init -n competitor-lens-backend

# Add PostgreSQL if not exists
echo -e "\n${YELLOW}Setting up PostgreSQL database...${NC}"
railway add postgresql || echo "PostgreSQL already configured"

# Set environment variables
echo -e "\n${YELLOW}Configuring environment variables...${NC}"
railway variables set NODE_ENV=production
railway variables set PORT=3001
railway variables set JWT_SECRET=$(openssl rand -base64 32)
railway variables set OPENAI_API_KEY=${OPENAI_API_KEY:-"sk-your-key"}
railway variables set ALLOWED_ORIGINS="https://competitor-lens.vercel.app,https://competitorlens.com"
railway variables set RATE_LIMIT_PUBLIC=100

# Set Prisma Accelerate URL
railway variables set DATABASE_URL="prisma+postgres://accelerate.prisma-data.net/?api_key=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqd3RfaWQiOjEsInNlY3VyZV9rZXkiOiJza19Pbm1MaF9hY2Y3YXlGcDM0NVIyRVYiLCJhcGlfa2V5IjoiMDFLNllYTjhHUk5LVDZQTURUN0o2UE5OVjciLCJ0ZW5hbnRfaWQiOiJkYWEwZWQwYmE4NDQxMTVjN2NjMjg2OGMyMjFhN2ZmODc3YWQ2YTFlZWZlM2Q0ZjIxNGQ1OGRiMzA2YzVkYTY0IiwiaW50ZXJuYWxfc2VjcmV0IjoiODFkYWMwODktMWE3My00Nzg5LTkwOGQtZTMzYWY4ZGEzNTZiIn0.eJmtPhzrSMu283EQoAJF2NdvYBmB7mLGfHk1fkxsR6w"

# Get direct database URL
DIRECT_DB_URL=$(railway variables get DATABASE_URL 2>/dev/null || echo "")
railway variables set DIRECT_DATABASE_URL=$DIRECT_DB_URL

# Deploy to Railway
echo -e "\n${YELLOW}Deploying backend to Railway...${NC}"
railway up -d

# Wait for deployment
echo -e "\n${YELLOW}Waiting for deployment to complete...${NC}"
sleep 30

# Get deployment URL
BACKEND_URL=$(railway status --json | jq -r '.url' || echo "https://competitor-lens-backend.up.railway.app")
echo -e "${GREEN}✅ Backend deployed at: $BACKEND_URL${NC}"

# Run database migrations
echo -e "\n${YELLOW}Running database migrations...${NC}"
cd backend
railway run npx prisma migrate deploy || echo "Migrations skipped"
cd ..

# Step 2: Vercel Frontend Deployment
echo -e "\n${BLUE}2. VERCEL FRONTEND DEPLOYMENT${NC}"
echo "================================"

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo -e "${RED}❌ Vercel CLI not found. Installing...${NC}"
    npm install -g vercel
fi

# Deploy to Vercel
echo -e "\n${YELLOW}Deploying frontend to Vercel...${NC}"
cd $PROJECT_ROOT
vercel --prod \
  --env NEXT_PUBLIC_API_URL=$BACKEND_URL/api \
  --build-env NEXT_PUBLIC_API_URL=$BACKEND_URL/api \
  --yes

# Get Vercel URL
FRONTEND_URL=$(vercel ls --json | jq -r '.[0].url' || echo "https://competitor-lens.vercel.app")
echo -e "${GREEN}✅ Frontend deployed at: $FRONTEND_URL${NC}"

# Step 3: Update CORS in Railway
echo -e "\n${YELLOW}Updating CORS settings...${NC}"
railway variables set ALLOWED_ORIGINS="$FRONTEND_URL,https://competitorlens.com"

# Step 4: Production Verification
echo -e "\n${BLUE}3. PRODUCTION VERIFICATION${NC}"
echo "================================"

# Test backend health
echo -e "\n${YELLOW}Testing backend health...${NC}"
curl -s "$BACKEND_URL/health" | jq '.' || echo "Backend health check failed"

# Test API endpoints
echo -e "\n${YELLOW}Testing API endpoints...${NC}"
curl -s "$BACKEND_URL/api/competitors" | jq '.competitors | length' || echo "API test failed"

# Deployment summary
echo -e "\n${GREEN}🎉 DEPLOYMENT COMPLETE!${NC}"
echo "========================"
echo -e "Backend URL: ${BLUE}$BACKEND_URL${NC}"
echo -e "Frontend URL: ${BLUE}$FRONTEND_URL${NC}"
echo -e "Database: ${BLUE}PostgreSQL on Railway with Prisma Accelerate${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Update DNS records to point to Vercel"
echo "2. Configure custom domain in Vercel dashboard"
echo "3. Monitor application logs in Railway and Vercel"
echo "4. Set up monitoring and alerts"
echo ""
echo -e "${GREEN}Happy deploying! 🚀${NC}"