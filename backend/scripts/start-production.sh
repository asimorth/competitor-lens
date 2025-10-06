#!/bin/sh

echo "🚀 Starting production server..."

# Run database migrations
echo "📊 Running database migrations..."
npx prisma migrate deploy

# Import Excel data
echo "📝 Importing Excel data..."
npm run import:excel || echo "Excel import completed or skipped"

# Import screenshots
echo "📸 Importing screenshots..."
npm run import:screenshots:smart || echo "Screenshot import completed or skipped"

# Start the server
echo "✅ Starting server..."
exec npx tsx src/server.ts
