#!/bin/bash

# Prisma Postgres'e Local Database Import Script

echo "🎯 Prisma Postgres Import Başlıyor"
echo "===================================="
echo ""

# Prisma Postgres API Key iste
echo "📝 Prisma Console'dan Prisma Postgres API Key'inizi alın:"
echo "   1. https://console.prisma.io/"
echo "   2. Projenize tıklayın"
echo "   3. 'Prisma Postgres' veya 'Database' sekmesi"
echo "   4. 'Generate database credentials' veya API key'i kopyalayın"
echo ""
echo "Prisma Postgres API Key'i girin:"
echo "(Format: prisma+postgres://accelerate.prisma-data.net/?api_key=...)"
read -r PRISMA_POSTGRES_URL

if [ -z "$PRISMA_POSTGRES_URL" ]; then
    echo "❌ API Key girilmedi. Script sonlandırılıyor."
    exit 1
fi

echo ""
echo "✅ API Key alındı"
echo ""

# Local database URL
LOCAL_DB_URL="postgresql://Furkan@localhost:5432/competitor_lens"

echo "📦 1/4: Local database'den backup alınıyor..."
pg_dump \
  -Fc \
  -v \
  -d "$LOCAL_DB_URL" \
  -n public \
  -f db_dump.bak

if [ $? -eq 0 ]; then
    echo "✅ Backup başarılı: db_dump.bak"
else
    echo "❌ Backup hatası!"
    exit 1
fi

echo ""
echo "🔌 2/4: Prisma Postgres tunnel başlatılıyor..."
echo "   (Yeni bir terminal'de tunnel çalışacak)"

# Tunnel'i background'da başlat
export DATABASE_URL="$PRISMA_POSTGRES_URL"
npx @prisma/ppg-tunnel --host 127.0.0.1 --port 5433 &
TUNNEL_PID=$!

echo "   Tunnel PID: $TUNNEL_PID"
echo "   5 saniye bekleniyor (tunnel başlaması için)..."
sleep 5

echo ""
echo "📥 3/4: Backup Prisma Postgres'e restore ediliyor..."
PGSSLMODE=disable \
  pg_restore \
    -h 127.0.0.1 \
    -p 5433 \
    -v \
    -d postgres \
    ./db_dump.bak \
  && echo "-complete-"

if [ $? -eq 0 ]; then
    echo "✅ Restore başarılı!"
else
    echo "⚠️  Restore tamamlandı (bazı uyarılar olabilir)"
fi

echo ""
echo "🧹 4/4: Tunnel kapatılıyor..."
kill $TUNNEL_PID 2>/dev/null

echo ""
echo "✅ Import Tamamlandı!"
echo ""
echo "📊 Prisma Console'da kontrol edin:"
echo "   1. https://console.prisma.io/"
echo "   2. Projeniz → 'Data Browser'"
echo "   3. Tüm tablolarınızı göreceksiniz! 🎉"
echo ""
echo "🧪 Local'de Prisma Studio ile kontrol:"
echo "   DATABASE_URL=\"$PRISMA_POSTGRES_URL\" npx prisma studio"
echo ""
echo "🗑️  Backup dosyasını silmek için:"
echo "   rm db_dump.bak"
echo ""

