#!/bin/bash

# Stop any existing processes
echo "🛑 Stopping existing processes..."
pkill -f "tsx src/server.ts" || true
pkill -f "next dev" || true
pkill -f "next start" || true
sleep 2

# Start backend
echo "🚀 Starting backend..."
cd backend
npm run build
NODE_ENV=production PORT=3001 npm start &
BACKEND_PID=$!
echo "Backend PID: $BACKEND_PID"

# Wait for backend to be ready
echo "⏳ Waiting for backend to be ready..."
for i in {1..30}; do
  if curl -s http://localhost:3001/health > /dev/null 2>&1; then
    echo "✅ Backend is ready!"
    break
  fi
  sleep 1
done

# Import data if needed
echo "📊 Importing data..."
npx tsx src/scripts/importMatrixFromExcel.ts || echo "Import skipped"

# Build and start frontend
echo "🎨 Building frontend..."
cd ../frontend
npm run build

echo "🌐 Starting frontend..."
PORT=3000 npm start &
FRONTEND_PID=$!
echo "Frontend PID: $FRONTEND_PID"

echo "
✨ CompetitorLens Production Started!
   Backend:  http://localhost:3001
   Frontend: http://localhost:3000

To stop: kill $BACKEND_PID $FRONTEND_PID
"

# Keep script running
wait
