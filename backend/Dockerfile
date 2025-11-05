# RAILWAY BACKEND PRODUCTION BUILD
# BUILD DATE: 2025-11-05-15:45
# NO PRISMA GENERATE - ZERO PRISMA COMMANDS
# Using pre-generated Prisma Client from repo

FROM node:20-alpine AS runtime

WORKDIR /app

# System deps
RUN apk add --no-cache python3 make g++ && \
    apk upgrade --no-cache

# Package files ONLY
COPY package*.json ./

# Install deps WITHOUT running ANY scripts
RUN npm ci --production --legacy-peer-deps --ignore-scripts --no-audit --no-fund && \
    npm cache clean --force

# Source files
COPY src ./src
COPY tsconfig.json ./
COPY start-railway.js ./

# Compile TypeScript
RUN npx tsc --skipLibCheck

# Setup directories
RUN mkdir -p uploads/screenshots logs && \
    chmod -R 755 uploads logs

# Port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"

# NO PRISMA COMMANDS HERE!
# Start server directly
CMD ["node", "start-railway.js"]
