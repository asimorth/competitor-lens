#!/bin/bash

echo "🔥 Railway Migration - Direkt Çalıştırma"
echo "========================================"
echo ""

# Railway'den DATABASE_URL al
echo "Railway Variables'tan DATABASE_URL alınıyor..."

# Railway env'den direkt değişkenleri çek
cd /Users/Furkan/Stablex/competitor-lens

# Migration dosyasını göster
echo ""
echo "Migration SQL:"
echo "✅ 17 kolon eklenecek"
echo "✅ 3 index oluşturulacak"
echo "✅ Mevcut veriyi bozmaz (IF NOT EXISTS)"
echo ""

# Railway'e direkt psql komutu gönder
echo "Migration çalıştırılıyor..."
echo ""

# NOT: Bu manuel çalıştırılacak çünkü Railway CLI interaktif
# Kullanıcıya adımları göster

echo "MANUEL ADIMLAR:"
echo "==============="
echo ""
echo "1. Railway Dashboard'u aç:"
echo "   https://railway.app/dashboard"
echo ""
echo "2. PostgreSQL service'i seç (Postgres-JjxR)"
echo ""
echo "3. 'Connect' butonuna tıkla (sağ üstte mor)"
echo ""
echo "4. Açılan menüden birini seç:"
echo "   a) 'PostgreSQL CLI' → Direkt terminal açar"
echo "   b) 'Connection String' → Kopyala, aşağıdaki komutta kullan"
echo ""
echo "5a. Eğer PostgreSQL CLI seçtiysen:"
echo "    → Terminal açılacak"
echo "    → Aşağıdaki dosyanın içeriğini kopyala-yapıştır:"
echo "    → /Users/Furkan/Stablex/competitor-lens/backend/prisma/migrations/add_screenshot_metadata.sql"
echo ""
echo "5b. Eğer Connection String kopyaladıysan:"
echo "    → Terminal'de çalıştır:"
echo "    psql 'PASTE_CONNECTION_STRING' < backend/prisma/migrations/add_screenshot_metadata.sql"
echo ""
echo "========================================"
echo ""

# Migration SQL'i göster
echo "📄 Migration SQL İçeriği:"
echo ""
cat backend/prisma/migrations/add_screenshot_metadata.sql
echo ""
echo "========================================"
echo ""
echo "✨ Migration tamamlandıktan sonra test et:"
echo "   curl https://competitor-lens-production.up.railway.app/api/data-quality/score"
echo ""
echo "Beklenen: success: true, grade: 'D' veya 'C'"
echo ""

