#!/bin/bash

echo "🚀 Prisma Postgres'e Veri Import"
echo "================================="
echo ""

PRISMA_URL="prisma+postgres://accelerate.prisma-data.net/?api_key=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqd3RfaWQiOjEsInNlY3VyZV9rZXkiOiJza19Gd3NGQnRFdWFvZVo3Q1d1QUNDbGgiLCJhcGlfa2V5IjoiMDFLNzFHRzhBWjE5QjZQUFIyU05QQUg2N0oiLCJ0ZW5hbnRfaWQiOiJkYWEwZWQwYmE4NDQxMTVjN2NjMjg2OGMyMjFhN2ZmODc3YWQ2YTFlZWZlM2Q0ZjIxNGQ1OGRiMzA2YzVkYTY0IiwiaW50ZXJuYWxfc2VjcmV0IjoiODFkYWMwODktMWE3My00Nzg5LTkwOGQtZTMzYWY4ZGEzNTZiIn0.6C6rWqjFFs2oGY8xaTHmK_CbYlm6LjzmXjZJLHDSE0w"

cd /Users/Furkan/Stablex/competitor-lens

echo "🔌 Tunnel başlatılıyor..."
export DATABASE_URL="$PRISMA_URL"
npx @prisma/ppg-tunnel --host 127.0.0.1 --port 5433 &
TUNNEL_PID=$!

echo "   Tunnel PID: $TUNNEL_PID"
echo "   10 saniye bekleniyor..."
sleep 10

echo ""
echo "📥 Veri restore ediliyor (db_dump.bak)..."
PGSSLMODE=disable \
  pg_restore \
    -h 127.0.0.1 \
    -p 5433 \
    -v \
    -d postgres \
    --data-only \
    --disable-triggers \
    ./db_dump.bak 2>&1 | grep -v "^pg_restore: processing" | tail -20

echo ""
echo "🧹 Tunnel kapatılıyor..."
kill $TUNNEL_PID

echo ""
echo "✅ Import tamamlandı!"
echo ""
echo "🧪 Test:"
echo "   https://console.prisma.io/ → Data Browser"
echo ""

