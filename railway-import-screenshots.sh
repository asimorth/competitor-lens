#!/bin/bash

# Railway'de Screenshot Import Script
# Bu script Railway production database'ine screenshot'ları import eder

echo "🚀 Importing Screenshots to Railway Production"
echo "================================================"
echo ""

# Railway CLI kullanarak production ortamında script çalıştır
echo "📦 Running import script on Railway..."
echo ""

railway run --service competitor-lens-production \
  node dist/scripts/scanAndImportScreenshots.js

echo ""
echo "================================================"
echo "✅ Import completed!"
echo ""
echo "🔍 Test endpoints:"
echo "   curl https://competitor-lens-production.up.railway.app/api/competitors | jq '.data[0]'"
echo ""

