# Simple Production Dockerfile for Railway
FROM node:20-alpine

WORKDIR /app

# Install system dependencies
RUN apk add --no-cache python3 make g++

# Copy package files
COPY backend/package*.json ./

# Install ALL dependencies (including dev for build)
RUN npm install

# Copy Prisma schema first (for generation)
COPY backend/prisma ./prisma/

# Copy source code
COPY backend/src ./src/
COPY backend/*.js ./
COPY backend/tsconfig.json ./

# 🎯 SCREENSHOTS - Railway'e dahil et (616MB, 1320 files)
# Production'da screenshot'lar Docker image içinde olacak
COPY backend/uploads/screenshots ./uploads/screenshots/

# Generate Prisma Client
RUN npx prisma generate

# Build TypeScript
RUN npm run build

# Create runtime directories
RUN mkdir -p uploads/screenshots logs

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))" || exit 1

# Start application
CMD ["node", "dist/server.js"]
