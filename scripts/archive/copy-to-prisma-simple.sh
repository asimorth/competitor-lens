#!/bin/bash

# Basit Veri Kopyalama - SQL Export/Import

echo "🚀 Local'den Prisma Postgres'e Veri Kopyalama"
echo "=============================================="
echo ""

PRISMA_URL="prisma+postgres://accelerate.prisma-data.net/?api_key=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqd3RfaWQiOjEsInNlY3VyZV9rZXkiOiJza19Gd3NGQnRFdWFvZVo3Q1d1QUNDbGgiLCJhcGlfa2V5IjoiMDFLNzFHRzhBWjE5QjZQUFIyU05QQUg2N0oiLCJ0ZW5hbnRfaWQiOiJkYWEwZWQwYmE4NDQxMTVjN2NjMjg2OGMyMjFhN2ZmODc3YWQ2YTFlZWZlM2Q0ZjIxNGQ1OGRiMzA2YzVkYTY0IiwiaW50ZXJuYWxfc2VjcmV0IjoiODFkYWMwODktMWE3My00Nzg5LTkwOGQtZTMzYWY4ZGEzNTZiIn0.6C6rWqjFFs2oGY8xaTHmK_CbYlm6LjzmXjZJLHDSE0w"
LOCAL_URL="postgresql://Furkan@localhost:5432/competitor_lens"

cd /Users/Furkan/Stablex/competitor-lens

# 1. SQL dump al (sadece data)
echo "📦 1/3: Local database'den SQL dump alınıyor..."
pg_dump "$LOCAL_URL" \
  --data-only \
  --no-owner \
  --no-privileges \
  --column-inserts \
  > data_dump.sql

if [ $? -eq 0 ]; then
    echo "✅ SQL dump oluşturuldu: data_dump.sql"
    echo "   Dosya boyutu: $(ls -lh data_dump.sql | awk '{print $5}')"
else
    echo "❌ SQL dump hatası!"
    exit 1
fi

echo ""
echo "🔌 2/3: Prisma Postgres tunnel başlatılıyor..."
export DATABASE_URL="$PRISMA_URL"
npx @prisma/ppg-tunnel --host 127.0.0.1 --port 5433 &
TUNNEL_PID=$!
sleep 5

echo ""
echo "📥 3/3: SQL dump Prisma Postgres'e yükleniyor..."
PGSSLMODE=disable psql \
  -h 127.0.0.1 \
  -p 5433 \
  -d postgres \
  -f data_dump.sql 2>&1 | grep -v "^INSERT" | head -20

echo ""
echo "🧹 Tunnel kapatılıyor..."
kill $TUNNEL_PID 2>/dev/null

echo ""
echo "✅ Veri kopyalama tamamlandı!"
echo ""
echo "🧪 Test için Prisma Console'a gidin:"
echo "   https://console.prisma.io/ → Data Browser"
echo ""
echo "🗑️  Temizlik:"
echo "   rm data_dump.sql"
echo ""

