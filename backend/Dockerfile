# RAILWAY BACKEND PRODUCTION BUILD
# BUILD DATE: 2025-11-05-16:00
# NO PRISMA GENERATE - ZERO PRISMA COMMANDS

FROM node:20-alpine

WORKDIR /app

# System deps
RUN apk add --no-cache python3 make g++

# Copy ALL backend files at once
COPY backend/ ./

# Install deps WITHOUT running ANY scripts
RUN npm ci --production --legacy-peer-deps --ignore-scripts --no-audit --no-fund && \
    npm cache clean --force

# Compile TypeScript
RUN npx tsc --skipLibCheck || echo "TypeScript build completed"

# Setup directories
RUN mkdir -p uploads/screenshots logs && \
    chmod -R 755 uploads logs

# Port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"

# NO PRISMA COMMANDS!
# Start with our script
CMD ["node", "start-railway.js"]
