#!/bin/bash

# CompetitorLens Production Migration Script
# This script migrates local data to production environment

set -e

echo "🚀 CompetitorLens Production Migration"
echo "====================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if production env file exists
if [ ! -f ".env.production" ]; then
    echo -e "${RED}Error: .env.production file not found!${NC}"
    echo "Please copy env.production.template to .env.production and configure it."
    exit 1
fi

# Load production environment variables
export $(cat .env.production | grep -v '^#' | xargs)

echo -e "${YELLOW}Step 1: Building Docker images for production...${NC}"
docker-compose -f docker-compose.prod.yml build

echo -e "${YELLOW}Step 2: Creating production volumes...${NC}"
docker volume create competitorlens_postgres_data
docker volume create competitorlens_redis_data
docker volume create competitorlens_uploads

echo -e "${YELLOW}Step 3: Starting database services...${NC}"
docker-compose -f docker-compose.prod.yml up -d postgres redis

# Wait for PostgreSQL to be ready
echo "Waiting for PostgreSQL to be ready..."
sleep 10

echo -e "${YELLOW}Step 4: Running database migrations...${NC}"
docker-compose -f docker-compose.prod.yml run --rm backend npx prisma migrate deploy

echo -e "${YELLOW}Step 5: Importing matrix data from Excel...${NC}"
# Copy Excel file to container and run import
docker cp backend/Matrix/feature_matrix_FINAL_v3.xlsx competitorlens-backend:/tmp/
docker-compose -f docker-compose.prod.yml run --rm backend npx tsx src/scripts/importMatrixFromExcel.ts

echo -e "${YELLOW}Step 6: Copying screenshots to production volume...${NC}"
# Create a temporary container to copy files
docker run --rm -v competitorlens_uploads:/uploads -v $(pwd)/backend/uploads:/source alpine sh -c "cp -r /source/* /uploads/"

echo -e "${YELLOW}Step 7: Importing screenshots to database...${NC}"
docker-compose -f docker-compose.prod.yml run --rm backend npx tsx src/scripts/importScreenshotsV1.ts

echo -e "${YELLOW}Step 8: Running screenshot analysis and assignment...${NC}"
docker-compose -f docker-compose.prod.yml run --rm backend npx tsx src/scripts/analyzeAndAssignScreenshots.ts
docker-compose -f docker-compose.prod.yml run --rm backend npx tsx src/scripts/assignSpecificScreenshots.ts

echo -e "${YELLOW}Step 9: Starting all production services...${NC}"
docker-compose -f docker-compose.prod.yml up -d

echo -e "${YELLOW}Step 10: Verifying deployment...${NC}"
sleep 10

# Check health endpoints
echo "Checking backend health..."
curl -f http://localhost:3002/health || echo -e "${RED}Backend health check failed!${NC}"

echo "Checking frontend health..."
curl -f http://localhost:3000 || echo -e "${RED}Frontend health check failed!${NC}"

echo -e "${GREEN}✅ Production migration completed!${NC}"
echo ""
echo "Services running:"
echo "- Frontend: http://localhost:3000"
echo "- Backend API: http://localhost:3002"
echo "- PostgreSQL: localhost:5432"
echo "- Redis: localhost:6379"
echo ""
echo "To view logs:"
echo "  docker-compose -f docker-compose.prod.yml logs -f"
echo ""
echo "To stop services:"
echo "  docker-compose -f docker-compose.prod.yml down"
