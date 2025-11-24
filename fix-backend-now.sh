#!/bin/bash

# 🚨 Backend Fix - Hızlı Çözüm
# Backend servisi çalışmıyor - Prisma regenerate + restart

echo "🔧 Backend Fix Başlıyor..."
echo ""

# Railway CLI kontrolü
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI bulunamadı!"
    echo "Kurulum: npm install -g @railway/cli"
    exit 1
fi

echo "📊 Backend service'e bağlanıyor..."
railway service backend

echo ""
echo "🔄 Prisma Client Regenerate..."
railway run npx prisma generate

echo ""
echo "📝 Database Schema Push..."
railway run npx prisma db push

echo ""
echo "🔄 Backend Service Restart..."
railway service backend
railway up --detach

echo ""
echo "⏳ 30 saniye bekleniyor (backend başlasın)..."
sleep 30

echo ""
echo "🧪 Health Check Test..."
curl -s https://competitor-lens-production.up.railway.app/health | jq .

echo ""
echo "✅ Fix tamamlandı!"
echo ""
echo "🔍 Logs için:"
echo "   railway logs --service backend"

