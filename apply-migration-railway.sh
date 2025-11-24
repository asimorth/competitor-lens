#!/bin/bash

echo "🚀 Applying Database Migration to Railway Production"
echo "===================================================="
echo ""

# Get the DATABASE_URL from Railway
echo "1️⃣  Getting DATABASE_URL from Railway..."
DATABASE_URL=$(railway variables --json 2>/dev/null | jq -r '.DATABASE_URL // empty')

if [ -z "$DATABASE_URL" ]; then
    echo "❌ Could not get DATABASE_URL from Railway"
    echo ""
    echo "Manual alternative:"
    echo "1. Go to Railway dashboard"
    echo "2. Click on your service"
    echo "3. Go to Variables tab"
    echo "4. Copy DATABASE_URL value"
    echo "5. Run: psql 'YOUR_DATABASE_URL' < backend/prisma/migrations/add_screenshot_metadata.sql"
    exit 1
fi

echo "✅ DATABASE_URL retrieved"
echo ""

# Apply migration
echo "2️⃣  Applying migration..."
psql "$DATABASE_URL" < backend/prisma/migrations/add_screenshot_metadata.sql

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Migration applied successfully!"
    echo ""
    echo "3️⃣  Verifying columns..."
    psql "$DATABASE_URL" -c "SELECT column_name FROM information_schema.columns WHERE table_name='screenshots' AND column_name IN ('quality', 'context', 'assignment_confidence');"
    echo ""
    echo "===================================================="
    echo "✨ Migration Complete!"
    echo ""
    echo "Next step:"
    echo "  Run data foundation migration:"
    echo "  railway run npx tsx src/scripts/dataFoundationMigration.ts"
else
    echo ""
    echo "❌ Migration failed!"
    echo "Check the error above for details"
    exit 1
fi

