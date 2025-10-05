#!/bin/bash

# CompetitorLens Production Backup Script
# This script backs up database and uploads

set -e

# Configuration
BACKUP_ROOT="/backups/competitorlens"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="$BACKUP_ROOT/$DATE"
RETENTION_DAYS=30

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Load environment variables
if [ -f ".env.production" ]; then
    export $(cat .env.production | grep -v '^#' | xargs)
fi

echo -e "${YELLOW}Starting CompetitorLens backup...${NC}"

# Create backup directory
mkdir -p $BACKUP_DIR

# 1. PostgreSQL Backup
echo -e "${YELLOW}Backing up PostgreSQL database...${NC}"
docker-compose -f docker-compose.prod.yml exec -T postgres pg_dump -U $DB_USER competitor_lens | gzip > $BACKUP_DIR/database_$DATE.sql.gz

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Database backup completed${NC}"
else
    echo -e "${RED}✗ Database backup failed${NC}"
    exit 1
fi

# 2. Uploads Backup
echo -e "${YELLOW}Backing up uploaded files...${NC}"
tar -czf $BACKUP_DIR/uploads_$DATE.tar.gz -C backend uploads/

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Uploads backup completed${NC}"
else
    echo -e "${RED}✗ Uploads backup failed${NC}"
    exit 1
fi

# 3. Redis Backup (optional)
echo -e "${YELLOW}Backing up Redis data...${NC}"
docker-compose -f docker-compose.prod.yml exec -T redis redis-cli -a $REDIS_PASSWORD --rdb $BACKUP_DIR/redis_$DATE.rdb BGSAVE

# 4. Configuration Backup
echo -e "${YELLOW}Backing up configuration files...${NC}"
tar -czf $BACKUP_DIR/config_$DATE.tar.gz \
    .env.production \
    docker-compose.prod.yml \
    nginx/nginx.prod.conf \
    nginx/ssl/

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Configuration backup completed${NC}"
else
    echo -e "${RED}✗ Configuration backup failed${NC}"
fi

# 5. Create backup manifest
echo -e "${YELLOW}Creating backup manifest...${NC}"
cat > $BACKUP_DIR/manifest.txt << EOF
CompetitorLens Backup Manifest
==============================
Date: $(date)
Version: $(git rev-parse HEAD 2>/dev/null || echo "unknown")
Files:
- database_$DATE.sql.gz
- uploads_$DATE.tar.gz
- redis_$DATE.rdb
- config_$DATE.tar.gz
EOF

# 6. Clean old backups
echo -e "${YELLOW}Cleaning old backups (older than $RETENTION_DAYS days)...${NC}"
find $BACKUP_ROOT -maxdepth 1 -type d -mtime +$RETENTION_DAYS -exec rm -rf {} \;

# 7. Create latest symlink
ln -sfn $BACKUP_DIR $BACKUP_ROOT/latest

# Calculate backup size
BACKUP_SIZE=$(du -sh $BACKUP_DIR | cut -f1)

echo -e "${GREEN}✅ Backup completed successfully!${NC}"
echo -e "Location: $BACKUP_DIR"
echo -e "Size: $BACKUP_SIZE"
echo ""
echo "To restore from this backup:"
echo "  ./scripts/restore-production.sh $DATE"
