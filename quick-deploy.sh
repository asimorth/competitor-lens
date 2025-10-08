#!/bin/bash
set -e

echo "🚀 Quick Production Deployment Starting..."
echo "========================================"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Backend deployment
echo -e "\n${YELLOW}1. Deploying Backend to Railway...${NC}"
railway up -d

# Get backend URL
sleep 5
BACKEND_URL="https://competitor-lens-backend.up.railway.app"
echo -e "${GREEN}✅ Backend URL: $BACKEND_URL${NC}"

# Frontend deployment
echo -e "\n${YELLOW}2. Deploying Frontend to Vercel...${NC}"
vercel --prod \
  --env NEXT_PUBLIC_API_URL=$BACKEND_URL/api \
  --build-env NEXT_PUBLIC_API_URL=$BACKEND_URL/api \
  --yes

echo -e "\n${GREEN}✅ Deployment Complete!${NC}"
echo "Backend: $BACKEND_URL"
echo "Frontend: https://competitor-lens.vercel.app"
