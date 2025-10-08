#!/bin/bash

# Prisma Console Database Setup Script

echo "🎯 Prisma Console Database Setup"
echo "=================================="
echo ""

# Railway PostgreSQL URL'ini iste
echo "📝 Railway'de PostgreSQL eklediniz mi?"
echo "   1. https://railway.app/dashboard"
echo "   2. competitor-lens-backend → + New → Database → PostgreSQL"
echo "   3. PostgreSQL servisi → Connect → Postgres Connection URL"
echo ""
echo "Railway PostgreSQL URL'ini girin:"
echo "(Format: postgresql://postgres:PASSWORD@HOST.railway.app:PORT/railway)"
read -r RAILWAY_DB_URL

if [ -z "$RAILWAY_DB_URL" ]; then
    echo "❌ URL girilmedi. Script sonlandırılıyor."
    exit 1
fi

echo ""
echo "✅ URL alındı: ${RAILWAY_DB_URL:0:30}..."
echo ""

# Backend dizinine git
cd /Users/Furkan/Stablex/competitor-lens/backend || exit

echo "📦 Prisma schema'yı Railway PostgreSQL'e push ediyorum..."
DATABASE_URL="$RAILWAY_DB_URL" npx prisma db push --accept-data-loss

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Schema başarıyla push edildi!"
    echo ""
else
    echo ""
    echo "❌ Schema push hatası! Railway PostgreSQL bağlantısını kontrol edin."
    exit 1
fi

echo "🔄 Prisma Client generate ediliyor..."
npx prisma generate

echo ""
echo "✅ Tamamlandı!"
echo ""
echo "📋 Sonraki Adımlar:"
echo ""
echo "1. Prisma Console'a gidin: https://console.prisma.io/"
echo "2. Projenize tıklayın (yoksa Create Project)"
echo "3. 'Import Database' veya 'Add Database' seçin"
echo "4. Railway PostgreSQL URL'ini girin: $RAILWAY_DB_URL"
echo "5. 'Test Connection' → Başarılı ✅"
echo "6. 'Continue' → Schema import edilecek"
echo "7. 'Data Browser' sekmesinde tablolarınızı göreceksiniz! 🎉"
echo ""
echo "🧪 Test için Prisma Studio:"
echo "   DATABASE_URL=\"$RAILWAY_DB_URL\" npx prisma studio"
echo ""
echo "🚀 Railway Backend Variables (Production):"
echo "   DATABASE_URL=$RAILWAY_DB_URL"
echo "   DIRECT_DATABASE_URL=$RAILWAY_DB_URL"
echo ""

