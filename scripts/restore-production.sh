#!/bin/bash

# CompetitorLens Production Restore Script
# Usage: ./restore-production.sh [backup_date]

set -e

# Configuration
BACKUP_ROOT="/backups/competitorlens"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Check arguments
if [ -z "$1" ]; then
    echo -e "${RED}Error: Backup date required${NC}"
    echo "Usage: $0 [backup_date]"
    echo "Example: $0 20240101_120000"
    echo ""
    echo "Available backups:"
    ls -1 $BACKUP_ROOT | grep -E '^[0-9]{8}_[0-9]{6}$'
    exit 1
fi

BACKUP_DATE=$1
BACKUP_DIR="$BACKUP_ROOT/$BACKUP_DATE"

# Check if backup exists
if [ ! -d "$BACKUP_DIR" ]; then
    echo -e "${RED}Error: Backup not found: $BACKUP_DIR${NC}"
    exit 1
fi

echo -e "${YELLOW}⚠️  WARNING: This will restore from backup $BACKUP_DATE${NC}"
echo -e "${YELLOW}This operation will:${NC}"
echo "- Stop all services"
echo "- Restore database from backup"
echo "- Restore uploaded files"
echo "- Restore Redis data (if available)"
echo ""
read -p "Are you sure you want to continue? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo "Restore cancelled."
    exit 0
fi

# Load environment variables
if [ -f ".env.production" ]; then
    export $(cat .env.production | grep -v '^#' | xargs)
fi

echo -e "${YELLOW}Stopping services...${NC}"
docker-compose -f docker-compose.prod.yml down

# 1. Restore Database
echo -e "${YELLOW}Restoring PostgreSQL database...${NC}"
docker-compose -f docker-compose.prod.yml up -d postgres
sleep 10  # Wait for PostgreSQL to start

# Drop existing database and recreate
docker-compose -f docker-compose.prod.yml exec -T postgres psql -U $DB_USER -c "DROP DATABASE IF EXISTS competitor_lens;"
docker-compose -f docker-compose.prod.yml exec -T postgres psql -U $DB_USER -c "CREATE DATABASE competitor_lens;"

# Restore from backup
gunzip -c $BACKUP_DIR/database_$BACKUP_DATE.sql.gz | docker-compose -f docker-compose.prod.yml exec -T postgres psql -U $DB_USER competitor_lens

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Database restored successfully${NC}"
else
    echo -e "${RED}✗ Database restore failed${NC}"
    exit 1
fi

# 2. Restore Uploads
echo -e "${YELLOW}Restoring uploaded files...${NC}"
rm -rf backend/uploads
tar -xzf $BACKUP_DIR/uploads_$BACKUP_DATE.tar.gz -C backend/

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Uploads restored successfully${NC}"
else
    echo -e "${RED}✗ Uploads restore failed${NC}"
    exit 1
fi

# 3. Restore Redis (if backup exists)
if [ -f "$BACKUP_DIR/redis_$BACKUP_DATE.rdb" ]; then
    echo -e "${YELLOW}Restoring Redis data...${NC}"
    docker-compose -f docker-compose.prod.yml up -d redis
    sleep 5
    # Copy RDB file to Redis container
    docker cp $BACKUP_DIR/redis_$BACKUP_DATE.rdb competitorlens-redis:/data/dump.rdb
    docker-compose -f docker-compose.prod.yml restart redis
    echo -e "${GREEN}✓ Redis restored successfully${NC}"
fi

# 4. Start all services
echo -e "${YELLOW}Starting all services...${NC}"
docker-compose -f docker-compose.prod.yml up -d

# Wait for services to be ready
sleep 20

# 5. Verify services
echo -e "${YELLOW}Verifying services...${NC}"

# Check backend
if curl -f http://localhost:3002/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Backend is running${NC}"
else
    echo -e "${RED}✗ Backend health check failed${NC}"
fi

# Check frontend
if curl -f http://localhost:3000 > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Frontend is running${NC}"
else
    echo -e "${RED}✗ Frontend health check failed${NC}"
fi

echo -e "${GREEN}✅ Restore completed successfully!${NC}"
echo ""
echo "Services have been restored from backup: $BACKUP_DATE"
echo "Please verify that everything is working correctly."
