#!/bin/bash

# Load environment variables
set -a
source .env 2>/dev/null || true
set +a

echo "🚀 Starting Smart Sync..."
echo ""

echo "📝 Step 1/3: Excel Matrix Import"
echo "=================================="
npx tsx src/scripts/importMatrixFromExcel.ts
echo ""

echo "📸 Step 2/3: Screenshot to Matrix Sync"
echo "=================================="
npx tsx src/scripts/syncScreenshotsToMatrix.ts
echo ""

echo "📁 Step 3/3: Local Files Sync"
echo "=================================="
npx tsx src/scripts/syncLocalFiles.ts
echo ""

echo "✅ Sync completed!"

