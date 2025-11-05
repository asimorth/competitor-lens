# CompetitorLens Backend - Railway Production
# NO PRISMA COMMANDS - Database schema already exists!

FROM node:20-alpine

WORKDIR /app

# Install system dependencies
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package*.json ./

# Install ALL dependencies with NO scripts (prevents Prisma auto-run)
RUN npm ci --legacy-peer-deps --ignore-scripts

# Copy application source
COPY src ./src
COPY tsconfig.json ./
COPY start-railway.js ./

# Build TypeScript only
RUN npx tsc

# Create directories
RUN mkdir -p uploads/screenshots logs

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"

# Start application - NO PRISMA GENERATE!
CMD ["node", "start-railway.js"]
