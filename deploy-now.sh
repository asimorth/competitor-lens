#!/bin/bash

echo "🚀 CompetitorLens v2 Production Deployment"
echo "=========================================="

# Check if services are already running
if lsof -Pi :3001 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "✅ Backend already running on port 3001"
else
    echo "🔧 Starting backend..."
    cd backend
    nohup npm run dev > backend.log 2>&1 &
    echo "   Backend started in background (check backend/backend.log)"
    cd ..
fi

if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "✅ Frontend already running on port 3000"
else
    echo "🎨 Starting frontend..."
    cd frontend
    nohup npm run dev > frontend.log 2>&1 &
    echo "   Frontend started in background (check frontend/frontend.log)"
    cd ..
fi

echo "
✨ CompetitorLens v2 Ready!
===========================
Frontend: http://localhost:3000
Backend:  http://localhost:3001

📊 Current Status:
- 21 Competitors (including all TR exchanges)
- 64 Features from Excel matrix
- 864 Screenshots imported
- 911 Competitor-Feature relationships

🔍 Key Pages:
- Dashboard: http://localhost:3000/dashboard
- Stablex vs TR: http://localhost:3000/stablex-vs-tr
- Matrix: http://localhost:3000/matrix
- Competitors: http://localhost:3000/competitors
- Features: http://localhost:3000/features

To stop services:
  pkill -f 'npm run dev'

To view logs:
  tail -f backend/backend.log
  tail -f frontend/frontend.log
"
