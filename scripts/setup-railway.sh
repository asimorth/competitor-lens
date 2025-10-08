#!/bin/bash
set -e

echo "🚂 Railway Production Setup"
echo "=========================="

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "\n${YELLOW}1. Railway CLI Login${NC}"
railway login

echo -e "\n${YELLOW}2. Creating new Railway project${NC}"
railway init -n competitor-lens-prod

echo -e "\n${YELLOW}3. Adding PostgreSQL database${NC}"
railway add postgresql

echo -e "\n${YELLOW}4. Getting database URL${NC}"
DATABASE_URL=$(railway variables get DATABASE_URL)
echo -e "${GREEN}✅ Database URL retrieved${NC}"

echo -e "\n${YELLOW}5. Setting environment variables${NC}"
# Production environment variables
railway variables set NODE_ENV=production
railway variables set PORT=3001
railway variables set JWT_SECRET=$(openssl rand -base64 32)
railway variables set OPENAI_API_KEY=${OPENAI_API_KEY:-"your-openai-key"}
railway variables set ALLOWED_ORIGINS="https://competitor-lens.vercel.app"
railway variables set RATE_LIMIT_PUBLIC=100

# Prisma Accelerate URL
railway variables set DATABASE_URL="prisma+postgres://accelerate.prisma-data.net/?api_key=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqd3RfaWQiOjEsInNlY3VyZV9rZXkiOiJza19Pbm1MaF9hY2Y3YXlGcDM0NVIyRVYiLCJhcGlfa2V5IjoiMDFLNllYTjhHUk5LVDZQTURUN0o2UE5OVjciLCJ0ZW5hbnRfaWQiOiJkYWEwZWQwYmE4NDQxMTVjN2NjMjg2OGMyMjFhN2ZmODc3YWQ2YTFlZWZlM2Q0ZjIxNGQ1OGRiMzA2YzVkYTY0IiwiaW50ZXJuYWxfc2VjcmV0IjoiODFkYWMwODktMWE3My00Nzg5LTkwOGQtZTMzYWY4ZGEzNTZiIn0.eJmtPhzrSMu283EQoAJF2NdvYBmB7mLGfHk1fkxsR6w"

# Direct database URL for migrations
railway variables set DIRECT_DATABASE_URL=$DATABASE_URL

echo -e "${GREEN}✅ Environment variables set${NC}"

echo -e "\n${YELLOW}6. Running database migrations${NC}"
cd backend
DATABASE_URL=$DATABASE_URL npx prisma migrate deploy
echo -e "${GREEN}✅ Migrations completed${NC}"

echo -e "\n${YELLOW}7. Importing data${NC}"
DATABASE_URL=$DATABASE_URL npm run import:excel || echo "Data import skipped"
DATABASE_URL=$DATABASE_URL npm run import:screenshots:smart || echo "Screenshot import skipped"

echo -e "\n${YELLOW}8. Deploying to Railway${NC}"
cd ..
railway up

echo -e "\n${GREEN}✅ Railway deployment complete!${NC}"
echo -e "\n${YELLOW}Railway Dashboard:${NC} https://railway.app/dashboard"
echo -e "${YELLOW}Direct Database URL:${NC} $DATABASE_URL"
