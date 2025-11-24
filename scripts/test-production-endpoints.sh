#!/bin/bash

# Production Endpoint Test Script
# Tests if screenshots and API are working after deployment

BACKEND_URL="https://competitor-lens-production.up.railway.app"
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🧪 Testing Production Endpoints"
echo "================================"
echo ""

# 1. Health Check
echo -n "1️⃣  Health Check: "
HEALTH=$(curl -s -o /dev/null -w "%{http_code}" "$BACKEND_URL/health")
if [ "$HEALTH" = "200" ]; then
    echo -e "${GREEN}✅ OK${NC} (200)"
else
    echo -e "${RED}❌ FAIL${NC} ($HEALTH)"
fi

# 2. API - Competitors List
echo -n "2️⃣  API Competitors: "
COMPETITORS=$(curl -s -o /dev/null -w "%{http_code}" "$BACKEND_URL/api/competitors")
if [ "$COMPETITORS" = "200" ]; then
    echo -e "${GREEN}✅ OK${NC} (200)"
    # Get actual data
    COMP_COUNT=$(curl -s "$BACKEND_URL/api/competitors" | jq -r '.count // 0')
    echo "   └─ Competitors in DB: $COMP_COUNT"
else
    echo -e "${RED}❌ FAIL${NC} ($COMPETITORS)"
fi

# 3. API - Features List
echo -n "3️⃣  API Features: "
FEATURES=$(curl -s -o /dev/null -w "%{http_code}" "$BACKEND_URL/api/features")
if [ "$FEATURES" = "200" ]; then
    echo -e "${GREEN}✅ OK${NC} (200)"
    FEAT_COUNT=$(curl -s "$BACKEND_URL/api/features" | jq -r '.count // 0')
    echo "   └─ Features in DB: $FEAT_COUNT"
else
    echo -e "${RED}❌ FAIL${NC} ($FEATURES)"
fi

# 4. Screenshot - BTC Turk
echo -n "4️⃣  Screenshot (BTC Turk): "
SCREENSHOT=$(curl -s -o /dev/null -w "%{http_code}" "$BACKEND_URL/uploads/screenshots/BTC%20Turk/IMG_7866.png")
if [ "$SCREENSHOT" = "200" ]; then
    echo -e "${GREEN}✅ OK${NC} (200)"
else
    echo -e "${RED}❌ FAIL${NC} ($SCREENSHOT)"
fi

# 5. Screenshot - Binance TR
echo -n "5️⃣  Screenshot (Binance TR): "
BINANCE=$(curl -s -o /dev/null -w "%{http_code}" "$BACKEND_URL/uploads/screenshots/Binance%20TR/IMG_7843.png")
if [ "$BINANCE" = "200" ]; then
    echo -e "${GREEN}✅ OK${NC} (200)"
else
    echo -e "${RED}❌ FAIL${NC} ($BINANCE)"
fi

# 6. Screenshot - OKX TR
echo -n "6️⃣  Screenshot (OKX TR): "
OKX=$(curl -s -o /dev/null -w "%{http_code}" "$BACKEND_URL/uploads/screenshots/OKX%20TR/IMG_7737.png")
if [ "$OKX" = "200" ]; then
    echo -e "${GREEN}✅ OK${NC} (200)"
else
    echo -e "${RED}❌ FAIL${NC} ($OKX)"
fi

# 7. Test specific competitor endpoint
echo -n "7️⃣  Competitor Detail API: "
# First get a competitor ID
COMP_ID=$(curl -s "$BACKEND_URL/api/competitors" | jq -r '.data[0].id // empty')
if [ -n "$COMP_ID" ]; then
    COMP_DETAIL=$(curl -s -o /dev/null -w "%{http_code}" "$BACKEND_URL/api/competitors/$COMP_ID")
    if [ "$COMP_DETAIL" = "200" ]; then
        echo -e "${GREEN}✅ OK${NC} (200)"
        # Get screenshot count
        SCREENSHOT_COUNT=$(curl -s "$BACKEND_URL/api/competitors/$COMP_ID" | jq -r '.data.screenshotStats.total // 0')
        echo "   └─ Screenshots in response: $SCREENSHOT_COUNT"
    else
        echo -e "${RED}❌ FAIL${NC} ($COMP_DETAIL)"
    fi
else
    echo -e "${YELLOW}⚠️  SKIP${NC} (No competitors found)"
fi

echo ""
echo "================================"
echo "✨ Test Complete!"
echo ""
echo "📊 Summary:"
echo "  - Backend URL: $BACKEND_URL"
echo "  - Check Railway dashboard for detailed logs"
echo "  - Check Vercel for frontend deployment"
echo ""

# 8. Database Screenshot Query (requires DATABASE_URL)
if [ -n "$DATABASE_URL" ]; then
    echo "8️⃣  Database Screenshot Check:"
    echo "   Running query..."
    psql "$DATABASE_URL" -c "SELECT COUNT(*) as total, COUNT(cdn_url) FILTER (WHERE cdn_url IS NOT NULL) as with_cdn FROM screenshots;" 2>/dev/null || echo "   └─ Database query failed (no credentials)"
fi

