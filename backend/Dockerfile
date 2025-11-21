FROM node:20-alpine

WORKDIR /app

# System dependencies
RUN apk --no-cache add python3 make g++

# Copy package files
COPY backend/package*.json ./

# Install dependencies
RUN npm ci --production --legacy-peer-deps

# Copy source code
COPY backend/src ./src
COPY backend/tsconfig.json ./
COPY backend/start-railway.js ./
COPY backend/prisma ./prisma

# Build
RUN npx tsc || echo "TypeScript build skipped"

# Create directories
RUN mkdir -p dist uploads/screenshots logs

# Expose port
EXPOSE 3001

# Start server
CMD ["node", "start-railway.js"]

