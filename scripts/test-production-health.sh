#!/bin/bash
# Production Health Check Script
# Tests all critical endpoints and services

echo "🏥 CompetitorLens Production Health Check"
echo "=========================================="
echo "Date: $(date)"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

BACKEND_URL="https://competitor-lens-production.up.railway.app"
FRONTEND_URL="https://competitor-lens-prod.vercel.app"

# Test Backend Health
echo -e "\n${YELLOW}1. Backend Health Check${NC}"
HEALTH_RESPONSE=$(curl -s -w "\n%{http_code}" "$BACKEND_URL/health")
HEALTH_CODE=$(echo "$HEALTH_RESPONSE" | tail -1)
HEALTH_BODY=$(echo "$HEALTH_RESPONSE" | head -1)

if [ "$HEALTH_CODE" = "200" ]; then
    echo -e "${GREEN}✅ Backend Health: OK${NC}"
    echo "   Response: $HEALTH_BODY"
else
    echo -e "${RED}❌ Backend Health: FAILED (HTTP $HEALTH_CODE)${NC}"
fi

# Test Competitors API
echo -e "\n${YELLOW}2. Competitors API${NC}"
COMPETITORS_RESPONSE=$(curl -s "$BACKEND_URL/api/competitors")
COMPETITORS_COUNT=$(echo "$COMPETITORS_RESPONSE" | jq -r '.count' 2>/dev/null || echo "0")

if [ "$COMPETITORS_COUNT" -gt "0" ]; then
    echo -e "${GREEN}✅ Competitors API: OK${NC}"
    echo "   Count: $COMPETITORS_COUNT exchanges"
else
    echo -e "${RED}❌ Competitors API: FAILED${NC}"
fi

# Test Features API
echo -e "\n${YELLOW}3. Features API${NC}"
FEATURES_RESPONSE=$(curl -s "$BACKEND_URL/api/features")
FEATURES_COUNT=$(echo "$FEATURES_RESPONSE" | jq -r '.count' 2>/dev/null || echo "0")

if [ "$FEATURES_COUNT" -gt "0" ]; then
    echo -e "${GREEN}✅ Features API: OK${NC}"
    echo "   Count: $FEATURES_COUNT features"
else
    echo -e "${RED}❌ Features API: FAILED${NC}"
fi

# Test Matrix API
echo -e "\n${YELLOW}4. Matrix API${NC}"
MATRIX_RESPONSE=$(curl -s "$BACKEND_URL/api/matrix")
MATRIX_SUCCESS=$(echo "$MATRIX_RESPONSE" | jq -r '.success' 2>/dev/null || echo "false")

if [ "$MATRIX_SUCCESS" = "true" ]; then
    echo -e "${GREEN}✅ Matrix API: OK${NC}"
    MATRIX_COUNT=$(echo "$MATRIX_RESPONSE" | jq -r '.data | length' 2>/dev/null || echo "0")
    echo "   Data points: $MATRIX_COUNT"
else
    echo -e "${RED}❌ Matrix API: FAILED${NC}"
fi

# Test Frontend
echo -e "\n${YELLOW}5. Frontend Status${NC}"
FRONTEND_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$FRONTEND_URL")

if [ "$FRONTEND_CODE" = "200" ] || [ "$FRONTEND_CODE" = "307" ]; then
    echo -e "${GREEN}✅ Frontend: OK (HTTP $FRONTEND_CODE)${NC}"
else
    echo -e "${RED}❌ Frontend: FAILED (HTTP $FRONTEND_CODE)${NC}"
fi

# Test Database Connection (via API)
echo -e "\n${YELLOW}6. Database Connection${NC}"
if [ "$COMPETITORS_COUNT" -gt "0" ] && [ "$FEATURES_COUNT" -gt "0" ]; then
    echo -e "${GREEN}✅ Database: CONNECTED${NC}"
    echo "   Data verified: $COMPETITORS_COUNT competitors, $FEATURES_COUNT features"
else
    echo -e "${RED}❌ Database: CONNECTION ISSUE${NC}"
fi

# Summary
echo -e "\n${YELLOW}========================================${NC}"
echo -e "${YELLOW}Summary${NC}"
echo -e "${YELLOW}========================================${NC}"

TOTAL_TESTS=6
PASSED_TESTS=0

[ "$HEALTH_CODE" = "200" ] && ((PASSED_TESTS++))
[ "$COMPETITORS_COUNT" -gt "0" ] && ((PASSED_TESTS++))
[ "$FEATURES_COUNT" -gt "0" ] && ((PASSED_TESTS++))
[ "$MATRIX_SUCCESS" = "true" ] && ((PASSED_TESTS++))
[ "$FRONTEND_CODE" = "200" ] || [ "$FRONTEND_CODE" = "307" ] && ((PASSED_TESTS++))
[ "$COMPETITORS_COUNT" -gt "0" ] && [ "$FEATURES_COUNT" -gt "0" ] && ((PASSED_TESTS++))

echo "Tests Passed: $PASSED_TESTS / $TOTAL_TESTS"

if [ "$PASSED_TESTS" -eq "$TOTAL_TESTS" ]; then
    echo -e "${GREEN}🎉 ALL SYSTEMS OPERATIONAL!${NC}"
    exit 0
else
    echo -e "${RED}⚠️  SOME TESTS FAILED${NC}"
    exit 1
fi
