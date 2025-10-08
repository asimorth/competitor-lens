#!/bin/bash
set -e

echo "🚀 Starting Competitor Lens Backend..."

# Prisma migration
echo "📦 Running database migrations..."
npx prisma migrate deploy

# Start the server
echo "🌐 Starting Node.js server..."
node dist/server.js
