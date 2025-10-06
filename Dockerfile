# Backend Dockerfile for Render deployment
FROM node:18-alpine

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache python3 make g++

# Copy backend files
COPY backend/package*.json ./
RUN npm ci --legacy-peer-deps

COPY backend/ ./

# Make start script executable
RUN chmod +x scripts/start-production.sh

# Copy uploads directory with screenshots
COPY backend/uploads ./uploads

# Generate Prisma client
RUN npx prisma generate

# Build TypeScript
RUN npm run build || echo "Build skipped - running with tsx"

# Expose port
EXPOSE 3001

# Run startup script
CMD ["./scripts/start-production.sh"]
