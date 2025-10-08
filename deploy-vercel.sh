#!/bin/bash

# Vercel Frontend Deployment Script

echo "🚀 Vercel Frontend Deployment"
echo "=============================="
echo ""

# Railway Backend URL
RAILWAY_URL="https://competitor-lens-production.up.railway.app"

echo "📝 Railway Backend URL: $RAILWAY_URL"
echo ""

# Frontend dizinine git
cd frontend

echo "✅ Environment Variable:"
echo "   NEXT_PUBLIC_API_URL=$RAILWAY_URL"
echo ""

# Vercel'e deploy et (environment variable ile)
echo "🚀 Deploying to Vercel..."
NEXT_PUBLIC_API_URL=$RAILWAY_URL vercel --prod --yes

echo ""
echo "✅ Deployment tamamlandı!"
echo ""
echo "📋 Sonraki Adımlar:"
echo "1. Vercel Dashboard'a gidin: https://vercel.com/dashboard"
echo "2. 'frontend' projesine tıklayın"
echo "3. Settings → Environment Variables"
echo "4. NEXT_PUBLIC_API_URL = $RAILWAY_URL ekleyin"
echo "5. Environment: Production seçin"
echo "6. Save butonuna tıklayın"
echo ""
echo "🔗 URLs:"
echo "Frontend: https://frontend-asimorths-projects.vercel.app"
echo "Backend: $RAILWAY_URL"

