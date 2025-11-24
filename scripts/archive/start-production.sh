#!/bin/bash

# CompetitorLens Production Starter
# Bu script mevcut veritabanı ile production modunda servisleri başlatır

set -e

echo "🚀 CompetitorLens Production Başlatılıyor..."
echo "============================================="

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Environment variables
export NODE_ENV=production
export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/competitor_lens"
export OPENAI_API_KEY="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"
export NEXT_PUBLIC_API_URL="http://localhost:3002"

# Kill existing processes
echo -e "${YELLOW}Mevcut servisleri durduruyor...${NC}"
pkill -f "tsx" 2>/dev/null || true
pkill -f "next" 2>/dev/null || true
pkill -f "npm" 2>/dev/null || true
sleep 2

# Start Backend
echo -e "${YELLOW}Backend başlatılıyor (Port 3002)...${NC}"
cd backend
nohup env PORT=3002 npx tsx src/server.ts > ../logs/backend.log 2>&1 &
BACKEND_PID=$!
echo $BACKEND_PID > ../logs/backend.pid
cd ..

# Wait for backend to start
sleep 5

# Check backend health
if curl -f http://localhost:3002/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Backend başarıyla başlatıldı${NC}"
else
    echo -e "${RED}✗ Backend başlatılamadı${NC}"
    exit 1
fi

# Start Frontend
echo -e "${YELLOW}Frontend başlatılıyor (Port 3000)...${NC}"
cd frontend
nohup npm start > ../logs/frontend.log 2>&1 &
FRONTEND_PID=$!
echo $FRONTEND_PID > ../logs/frontend.pid
cd ..

# Wait for frontend to start
sleep 10

# Check frontend health
if curl -f http://localhost:3000 > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Frontend başarıyla başlatıldı${NC}"
else
    echo -e "${RED}✗ Frontend başlatılamadı${NC}"
    exit 1
fi

echo -e "${GREEN}🎉 Production deployment tamamlandı!${NC}"
echo ""
echo "Servisler:"
echo "- Frontend: http://localhost:3000"
echo "- Backend API: http://localhost:3002"
echo "- Health Check: http://localhost:3002/health"
echo ""
echo "Logları görüntülemek için:"
echo "  tail -f logs/backend.log"
echo "  tail -f logs/frontend.log"
echo ""
echo "Servisleri durdurmak için:"
echo "  ./stop-production.sh"
