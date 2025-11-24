#!/bin/bash

echo "🚀 Migration Çalıştırılıyor..."
echo ""

# Kullanıcıdan connection URL iste
echo "Railway'den kopyaladığın Connection URL'i yapıştır:"
echo "(postgresql://... ile başlayan)"
echo ""
read -p "Connection URL: " DATABASE_URL

if [ -z "$DATABASE_URL" ]; then
    echo "❌ Connection URL boş!"
    exit 1
fi

echo ""
echo "Migration SQL çalıştırılıyor..."
echo ""

# Migration çalıştır
psql "$DATABASE_URL" < backend/prisma/migrations/add_screenshot_metadata.sql

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Migration başarılı!"
    echo ""
    echo "Doğrulanıyor..."
    psql "$DATABASE_URL" -c "SELECT column_name FROM information_schema.columns WHERE table_name='screenshots' AND column_name IN ('quality', 'context', 'assignment_confidence');"
    echo ""
    echo "=========================================="
    echo "✨ Tamamlandı!"
    echo ""
    echo "Test et:"
    echo "  curl https://competitor-lens-production.up.railway.app/api/data-quality/score | jq"
else
    echo ""
    echo "❌ Migration başarısız!"
    exit 1
fi

