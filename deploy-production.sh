#!/bin/bash

echo "🚀 CompetitorLens Production Deployment"
echo "======================================="

# Configuration
BACKEND_PORT=3001
FRONTEND_PORT=3000

# Function to check if port is in use
check_port() {
  if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null ; then
    echo "⚠️  Port $1 is already in use"
    return 1
  fi
  return 0
}

# Function to stop services
stop_services() {
  echo "🛑 Stopping existing services..."
  pkill -f "tsx src/server.ts" || true
  pkill -f "next dev" || true
  pkill -f "next start" || true
  pkill -f "node start-backend.js" || true
  sleep 2
}

# Function to start backend
start_backend() {
  echo "🔧 Starting backend on port $BACKEND_PORT..."
  cd backend
  
  # Ensure .env exists
  if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cat > .env << 'EOF'
# Database
DATABASE_URL="postgresql://Furkan@localhost:5432/competitor_lens"

# OpenAI
OPENAI_API_KEY="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"

# Server
PORT=3001
NODE_ENV=production
EOF
  fi
  
  # Generate Prisma client
  npx prisma generate
  
  # Start backend
  node start-backend.js > backend.log 2>&1 &
  BACKEND_PID=$!
  
  # Wait for backend to be ready
  echo "⏳ Waiting for backend..."
  for i in {1..30}; do
    if curl -s http://localhost:$BACKEND_PORT/health > /dev/null 2>&1; then
      echo "✅ Backend is ready!"
      break
    fi
    if [ $i -eq 30 ]; then
      echo "❌ Backend failed to start"
      cat backend.log
      exit 1
    fi
    sleep 1
  done
  
  cd ..
}

# Function to start frontend
start_frontend() {
  echo "🎨 Starting frontend on port $FRONTEND_PORT..."
  cd frontend
  
  # Ensure next.config.js has correct API URL
  if ! grep -q "NEXT_PUBLIC_API_URL.*3001" next.config.js 2>/dev/null; then
    echo "📝 Updating frontend configuration..."
  fi
  
  # Build if needed
  if [ ! -d ".next" ] || [ "$1" == "--rebuild" ]; then
    echo "🔨 Building frontend..."
    npm run build
  fi
  
  # Start frontend
  PORT=$FRONTEND_PORT npm start > frontend.log 2>&1 &
  FRONTEND_PID=$!
  
  # Wait for frontend to be ready
  echo "⏳ Waiting for frontend..."
  for i in {1..30}; do
    if curl -s http://localhost:$FRONTEND_PORT > /dev/null 2>&1; then
      echo "✅ Frontend is ready!"
      break
    fi
    if [ $i -eq 30 ]; then
      echo "❌ Frontend failed to start"
      cat frontend.log
      exit 1
    fi
    sleep 1
  done
  
  cd ..
}

# Main deployment process
main() {
  # Stop existing services
  stop_services
  
  # Check ports
  if ! check_port $BACKEND_PORT; then
    echo "❌ Backend port $BACKEND_PORT is still in use"
    exit 1
  fi
  
  if ! check_port $FRONTEND_PORT; then
    echo "❌ Frontend port $FRONTEND_PORT is still in use"
    exit 1
  fi
  
  # Start services
  start_backend
  start_frontend $1
  
  echo "
🎉 CompetitorLens Production Deployment Complete!
================================================
Backend:  http://localhost:$BACKEND_PORT (PID: $BACKEND_PID)
Frontend: http://localhost:$FRONTEND_PORT (PID: $FRONTEND_PID)

To stop services:
  kill $BACKEND_PID $FRONTEND_PID

To view logs:
  tail -f backend/backend.log
  tail -f frontend/frontend.log
"
}

# Run main function
main $@
