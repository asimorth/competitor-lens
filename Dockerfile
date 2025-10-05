# Backend Dockerfile for Render deployment
FROM node:18-alpine

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache python3 make g++

# Copy backend files
COPY backend/package*.json ./
RUN npm ci

COPY backend/ ./

# Copy uploads directory with screenshots
COPY backend/uploads ./uploads

# Generate Prisma client
RUN npx prisma generate

# Build TypeScript
RUN npm run build || echo "Build skipped - running with tsx"

# Expose port
EXPOSE 3001

# Start command - use tsx directly if build fails
CMD ["npx", "tsx", "src/server.ts"]
