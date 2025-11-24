#!/bin/bash

echo "🧪 Migration Verification Test"
echo "==============================="
echo ""

echo "1️⃣  Testing Data Quality API..."
QUALITY_RESPONSE=$(curl -s "https://competitor-lens-production.up.railway.app/api/data-quality/score")
echo "$QUALITY_RESPONSE" | jq

if echo "$QUALITY_RESPONSE" | grep -q '"success":true'; then
    echo "✅ Data Quality API works!"
    echo ""
else
    echo "❌ Data Quality API still failing"
    echo "Migration might not have been applied"
    echo ""
    exit 1
fi

echo "2️⃣  Testing Intelligence API..."
COMP_ID="91d7af6f-b2dd-4033-8a4e-5a7878b6a2b8"
INTEL_RESPONSE=$(curl -s "https://competitor-lens-production.up.railway.app/api/intelligence/competitor/$COMP_ID/pm")
echo "$INTEL_RESPONSE" | jq -r '.success, .data.opportunityScore' | head -2

if echo "$INTEL_RESPONSE" | grep -q '"success":true'; then
    echo "✅ Intelligence API works!"
    echo ""
else
    echo "❌ Intelligence API failing"
    echo ""
    exit 1
fi

echo "==============================="
echo "✨ ALL TESTS PASSED!"
echo ""
echo "🎯 Next: Test Frontend"
echo "   https://competitor-lens-prod.vercel.app/competitors/$COMP_ID"
echo ""
echo "Expected to see:"
echo "  • Persona Toggle (top-right)"
echo "  • Smart Context Bar"
echo "  • Executive/PM/Designer views"
echo ""

