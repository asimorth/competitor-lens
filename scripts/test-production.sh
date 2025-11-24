#!/bin/bash
set -e

echo "🧪 Production Test Script"
echo "========================"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Test local development first
echo -e "\n${YELLOW}1. Testing Local Development${NC}"
echo "================================"

# Backend health check
echo -n "Backend Health: "
if curl -s http://localhost:3001/health | grep -q "ok"; then
    echo -e "${GREEN}✅ OK${NC}"
else
    echo -e "${RED}❌ FAILED${NC}"
fi

# Database connection
echo -n "Database Connection: "
if psql -U Furkan -d competitor_lens -c "SELECT 1;" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ OK${NC}"
else
    echo -e "${RED}❌ FAILED${NC}"
fi

# Frontend check
echo -n "Frontend Server: "
if curl -s http://localhost:3000 | grep -q "CompetitorLens"; then
    echo -e "${GREEN}✅ OK${NC}"
else
    echo -e "${RED}❌ FAILED${NC}"
fi

# Prisma check
echo -e "\n${YELLOW}2. Prisma Configuration${NC}"
echo "================================"
cd backend
echo "Current DATABASE_URL:"
grep DATABASE_URL .env | head -1

echo -e "\n${YELLOW}3. Build Status${NC}"
echo "================================"
echo -n "TypeScript Build: "
if [ -d "dist" ]; then
    echo -e "${GREEN}✅ OK${NC}"
else
    echo -e "${RED}❌ Missing dist folder${NC}"
fi

echo -n "Prisma Client: "
if [ -d "node_modules/@prisma/client" ]; then
    echo -e "${GREEN}✅ OK${NC}"
else
    echo -e "${RED}❌ Missing${NC}"
fi

echo -e "\n${YELLOW}4. Railway Status${NC}"
echo "================================"
if command -v railway &> /dev/null; then
    echo "Railway CLI: ✅ Installed"
    railway whoami 2>&1 || echo "Status: Not logged in - Run 'railway login'"
else
    echo -e "${RED}Railway CLI: ❌ Not installed${NC}"
fi

echo -e "\n${YELLOW}5. Next Steps${NC}"
echo "================================"
echo "1. Run 'railway login' if not logged in"
echo "2. Follow DEPLOYMENT_STEP_BY_STEP.md"
echo "3. Check env.production file for production settings"
echo ""
