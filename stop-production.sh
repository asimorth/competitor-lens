#!/bin/bash

# CompetitorLens Production Stopper

echo "🛑 CompetitorLens Production Durduruluyor..."

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Stop services using PID files
if [ -f "logs/backend.pid" ]; then
    BACKEND_PID=$(cat logs/backend.pid)
    if kill -0 $BACKEND_PID 2>/dev/null; then
        echo -e "${YELLOW}Backend durduruluyor (PID: $BACKEND_PID)...${NC}"
        kill $BACKEND_PID
        rm logs/backend.pid
        echo -e "${GREEN}✓ Backend durduruldu${NC}"
    else
        echo -e "${RED}Backend zaten çalışmıyor${NC}"
        rm -f logs/backend.pid
    fi
fi

if [ -f "logs/frontend.pid" ]; then
    FRONTEND_PID=$(cat logs/frontend.pid)
    if kill -0 $FRONTEND_PID 2>/dev/null; then
        echo -e "${YELLOW}Frontend durduruluyor (PID: $FRONTEND_PID)...${NC}"
        kill $FRONTEND_PID
        rm logs/frontend.pid
        echo -e "${GREEN}✓ Frontend durduruldu${NC}"
    else
        echo -e "${RED}Frontend zaten çalışmıyor${NC}"
        rm -f logs/frontend.pid
    fi
fi

# Fallback: kill by process name
echo -e "${YELLOW}Kalan prosesleri temizliyor...${NC}"
pkill -f "tsx" 2>/dev/null || true
pkill -f "next" 2>/dev/null || true
pkill -f "npm start" 2>/dev/null || true

echo -e "${GREEN}✅ Tüm servisler durduruldu${NC}"
