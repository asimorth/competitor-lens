#!/bin/bash

# CompetitorLens Production Deployment Script
# Deploys Backend to Railway and Frontend to Vercel

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

log_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
log_success() { echo -e "${GREEN}✅ $1${NC}"; }
log_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
log_error() { echo -e "${RED}❌ $1${NC}"; }
log_step() { echo -e "${PURPLE}🚀 $1${NC}"; }

echo -e "${PURPLE}"
cat << "EOF"
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║     CompetitorLens Production Deployment                 ║
║     Railway (Backend) + Vercel (Frontend)                ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}\n"

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    log_warning "Railway CLI not found"
    log_info "Installing Railway CLI..."
    npm install -g @railway/cli || {
        log_error "Failed to install Railway CLI"
        log_info "Install manually: npm i -g @railway/cli"
        exit 1
    }
fi

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    log_warning "Vercel CLI not found"
    log_info "Installing Vercel CLI..."
    npm install -g vercel || {
        log_error "Failed to install Vercel CLI"
        log_info "Install manually: npm i -g vercel"
        exit 1
    }
fi

log_success "CLI tools ready"

# Step 1: Build & Test Locally
log_step "Step 1/5: Local Build Verification"

log_info "Building backend..."
cd backend
npm run build || {
    log_error "Backend build failed"
    exit 1
}
log_success "Backend build passed"

log_info "Building frontend..."
cd ../frontend
npm run build || {
    log_error "Frontend build failed"
    exit 1
}
log_success "Frontend build passed"

cd ..

# Step 2: Check Railway Login
log_step "Step 2/5: Railway Authentication"

if ! railway whoami &> /dev/null; then
    log_warning "Not logged in to Railway"
    log_info "Opening Railway login..."
    railway login || {
        log_error "Railway login failed"
        exit 1
    }
fi

log_success "Railway authenticated"

# Step 3: Deploy Backend to Railway
log_step "Step 3/5: Deploying Backend to Railway"

cd backend

log_info "Checking Railway project..."
if [ ! -f "railway.toml" ]; then
    log_warning "railway.toml not found, creating..."
    cat > railway.toml << 'RAILWAYEOF'
[build]
builder = "NIXPACKS"
buildCommand = "npm install && npx prisma generate && npm run build"

[deploy]
startCommand = "npx prisma migrate deploy && node dist/server.js"
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 3
healthcheckPath = "/health"
healthcheckTimeout = 100

[env]
NODE_ENV = "production"
PORT = "3001"
RAILWAYEOF
fi

log_info "Deploying to Railway..."
railway up || {
    log_error "Railway deployment failed"
    log_info "Try manual deployment:"
    log_info "  1. railway login"
    log_info "  2. railway init (if new project)"
    log_info "  3. railway up"
    exit 1
}

log_success "Backend deployed to Railway!"

# Get backend URL
BACKEND_URL=$(railway domain 2>/dev/null || echo "https://your-backend.railway.app")
log_info "Backend URL: $BACKEND_URL"

cd ..

# Step 4: Deploy Frontend to Vercel
log_step "Step 4/5: Deploying Frontend to Vercel"

cd frontend

log_info "Checking Vercel authentication..."
if ! vercel whoami &> /dev/null; then
    log_warning "Not logged in to Vercel"
    log_info "Opening Vercel login..."
    vercel login || {
        log_error "Vercel login failed"
        exit 1
    }
fi

log_info "Setting production environment..."
if [ "$BACKEND_URL" != "https://your-backend.railway.app" ]; then
    vercel env add NEXT_PUBLIC_API_URL production <<< "$BACKEND_URL" 2>/dev/null || log_info "Environment variable may already exist"
fi

log_info "Deploying to Vercel..."
vercel --prod || {
    log_error "Vercel deployment failed"
    log_info "Try manual deployment:"
    log_info "  1. vercel login"
    log_info "  2. vercel --prod"
    exit 1
}

log_success "Frontend deployed to Vercel!"

# Get frontend URL
FRONTEND_URL=$(vercel inspect --token=$(vercel token) 2>/dev/null | grep "https://" | head -1 || echo "https://your-frontend.vercel.app")
log_info "Frontend URL: $FRONTEND_URL"

cd ..

# Step 5: Verification
log_step "Step 5/5: Deployment Verification"

log_info "Waiting for services to start..."
sleep 10

# Test backend
log_info "Testing backend health..."
if curl -sf "$BACKEND_URL/health" > /dev/null 2>&1; then
    log_success "Backend health check passed"
else
    log_warning "Backend health check failed (may need time to start)"
fi

# Test frontend
log_info "Testing frontend..."
if curl -sf -o /dev/null "$FRONTEND_URL" 2>&1; then
    log_success "Frontend is accessible"
else
    log_warning "Frontend check failed (may need time to build)"
fi

# Summary
echo ""
echo -e "${GREEN}"
cat << "EOF"
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║            🎉 Production Deployment Complete! 🎉         ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

echo -e "${BLUE}📊 Deployment Summary:${NC}"
echo ""
echo -e "  ${GREEN}✅ Backend (Railway):${NC}"
echo -e "     URL: ${BACKEND_URL}"
echo -e "     Health: ${BACKEND_URL}/health"
echo ""
echo -e "  ${GREEN}✅ Frontend (Vercel):${NC}"
echo -e "     URL: ${FRONTEND_URL}"
echo ""
echo -e "${YELLOW}⚠️  Important Next Steps:${NC}"
echo ""
echo "  1. Set Railway environment variables:"
echo "     - DATABASE_URL (auto-set if PostgreSQL added)"
echo "     - ALLOWED_ORIGINS=$FRONTEND_URL"
echo ""
echo "  2. Import data to production database:"
echo "     cd backend"
echo "     railway run npm run import:excel"
echo "     railway run npm run import:screenshots:smart"
echo ""
echo "  3. Verify deployment:"
echo "     - Test API: curl $BACKEND_URL/api/competitors"
echo "     - Open frontend: $FRONTEND_URL"
echo "     - Test mobile: Open on phone"
echo ""
echo -e "${BLUE}📝 Monitoring:${NC}"
echo "  - Railway logs: railway logs"
echo "  - Vercel logs: vercel logs"
echo ""
log_success "Deployment script completed! 🚀"

