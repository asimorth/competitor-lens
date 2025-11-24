#!/bin/bash

# 🚂 Railway Otomatik Setup Script
# Railway CLI ile tüm konfigürasyonu otomatik yapar

set -e

echo "🚂 Railway CompetitorLens - Otomatik Setup"
echo "=========================================="

# Railway CLI kontrolü
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI bulunamadı!"
    echo "📥 Kurulum için: npm install -g @railway/cli"
    exit 1
fi

echo "✅ Railway CLI bulundu"

# Login kontrolü
echo ""
echo "🔐 Railway Login Kontrol..."
if ! railway whoami &> /dev/null; then
    echo "❌ Railway'e login olmamışsınız"
    echo "👉 Şimdi login yapılacak..."
    railway login
else
    echo "✅ Railway'e login olunmuş"
fi

# Project link kontrolü
echo ""
echo "🔗 Project Link Kontrol..."
if [ ! -f ".railway/config.json" ]; then
    echo "❌ Bu dizin Railway project'e bağlı değil"
    echo "👉 Şimdi project'e bağlanılacak..."
    railway link
else
    echo "✅ Project'e bağlı"
fi

echo ""
echo "📊 Railway Servisler:"
railway status

echo ""
echo "🎯 Backend Service'i Seçiyorum..."

# Backend service için environment variables
echo ""
echo "📝 Environment Variables Ayarlanıyor..."

# Postgres DATABASE_URL'i otomatik al
echo "🔍 Postgres DATABASE_URL alınıyor..."
railway service postgres

# DATABASE_URL'i backend'e ekle (reference ile)
echo "✅ DATABASE_URL backend'e ekleniyor..."
railway variables --service backend set DATABASE_URL='${{Postgres.DATABASE_URL}}'

# Diğer gerekli variables
echo "✅ NODE_ENV ayarlanıyor..."
railway variables --service backend set NODE_ENV=production

echo "✅ PORT ayarlanıyor..."
railway variables --service backend set PORT=3001

# CORS
FRONTEND_URL="https://competitor-lens-prod.vercel.app"
echo "✅ ALLOWED_ORIGINS ayarlanıyor: $FRONTEND_URL"
railway variables --service backend set ALLOWED_ORIGINS="$FRONTEND_URL"

echo ""
echo "🎉 Temel Konfigürasyon Tamamlandı!"
echo ""
echo "📋 Opsiyonel Variables (Manuel Eklenebilir):"
echo "   - AWS_REGION (S3 için)"
echo "   - AWS_ACCESS_KEY_ID (S3 için)"
echo "   - AWS_SECRET_ACCESS_KEY (S3 için)"
echo "   - S3_BUCKET (Screenshot storage)"
echo "   - REDIS_HOST (Queue için)"
echo "   - REDIS_PORT (Queue için)"
echo "   - OPENAI_API_KEY (AI analiz için)"
echo ""

echo "🔄 Backend Service Restart..."
railway service backend
railway up --detach

echo ""
echo "✅ Setup Tamamlandı!"
echo ""
echo "🧪 Test için:"
echo "   railway logs --service backend"
echo "   curl https://competitor-lens-production.up.railway.app/health"
echo ""
echo "📊 Database Push için:"
echo "   railway run --service backend npx prisma db push"
echo ""

