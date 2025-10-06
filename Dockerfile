# Backend Dockerfile for Railway deployment
FROM node:18-alpine

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache python3 make g++

# Copy backend files
COPY backend/package*.json ./
RUN npm ci --legacy-peer-deps

COPY backend/ ./

# Copy uploads directory with screenshots
COPY backend/uploads ./uploads

# Generate Prisma client
RUN npx prisma generate

# Build TypeScript (optional)
RUN npm run build || true

# Expose port (Railway will override this)
EXPOSE 3001

# Start server directly with tsx
CMD ["node", "./node_modules/.bin/tsx", "src/server.ts"]
