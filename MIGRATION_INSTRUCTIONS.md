# 🔧 Database Migration Instructions

## ⚠️ SORUN

UX'te fark görememenin nedeni: **Database migration henüz yapılmadı!**

Error: `The column screenshots.quality does not exist in the current database`

---

## ✅ SON DURUM

### Backend
- ✅ Deploy edildi (commit: cc9a33c)
- ✅ Intelligence routes çalışıyor
- ✅ API endpoints aktif
- ❌ Schema migration YAPILMADI

### Frontend
- ✅ Deploy edildi (Vercel)
- ✅ Persona toggle component'leri aktif
- ✅ Yeni sayfalar deploy edildi
- ⏳ Backend migration bekleniyor (API'ler hata veriyor)

---

## 🚀 Migration Nasıl Yapılır

### Seçenek 1: Railway Dashboard (En Kolay)

1. **Railway Dashboard'u Aç**
   - https://railway.app/dashboard
   - Project'i seç

2. **PostgreSQL Service'i Seç**
   - "PostgreSQL" service'ine tıkla

3. **"Data" Tab'ına Git**
   - "Query" butonuna tıkla

4. **Migration SQL'i Çalıştır**
   ```sql
   -- Copy-paste from: backend/prisma/migrations/add_screenshot_metadata.sql
   
   ALTER TABLE screenshots ADD COLUMN IF NOT EXISTS quality VARCHAR(20) DEFAULT 'unknown';
   ALTER TABLE screenshots ADD COLUMN IF NOT EXISTS context VARCHAR(50);
   ALTER TABLE screenshots ADD COLUMN IF NOT EXISTS visual_complexity VARCHAR(20);
   ALTER TABLE screenshots ADD COLUMN IF NOT EXISTS has_text BOOLEAN DEFAULT false;
   ALTER TABLE screenshots ADD COLUMN IF NOT EXISTS has_ui BOOLEAN DEFAULT false;
   ALTER TABLE screenshots ADD COLUMN IF NOT EXISTS has_data BOOLEAN DEFAULT false;
   ALTER TABLE screenshots ADD COLUMN IF NOT EXISTS ui_pattern VARCHAR(50);
   ALTER TABLE screenshots ADD COLUMN IF NOT EXISTS color_scheme VARCHAR(20);
   ALTER TABLE screenshots ADD COLUMN IF NOT EXISTS assignment_confidence DOUBLE PRECISION DEFAULT 0;
   ALTER TABLE screenshots ADD COLUMN IF NOT EXISTS assignment_method VARCHAR(20) DEFAULT 'manual';
   ALTER TABLE screenshots ADD COLUMN IF NOT EXISTS needs_review BOOLEAN DEFAULT false;
   ALTER TABLE screenshots ADD COLUMN IF NOT EXISTS reviewed_by VARCHAR(255);
   ALTER TABLE screenshots ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP;
   ALTER TABLE screenshots ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;
   ALTER TABLE screenshots ADD COLUMN IF NOT EXISTS last_viewed_at TIMESTAMP;
   ALTER TABLE screenshots ADD COLUMN IF NOT EXISTS is_showcase BOOLEAN DEFAULT false;
   ALTER TABLE screenshots ADD COLUMN IF NOT EXISTS display_order INTEGER;
   
   CREATE INDEX IF NOT EXISTS idx_screenshots_needs_review ON screenshots(needs_review);
   CREATE INDEX IF NOT EXISTS idx_screenshots_quality ON screenshots(quality);
   CREATE INDEX IF NOT EXISTS idx_screenshots_assignment_confidence ON screenshots(assignment_confidence);
   ```

5. **"Run Query" Butonu**
   - Execute et
   - Success mesajı bekle

### Seçenek 2: Railway CLI

```bash
cd /Users/Furkan/Stablex/competitor-lens

# Connect to database
railway connect postgres

# Paste migration SQL and execute
# (Railway açacağı psql prompt'unda migration SQL'i çalıştır)
```

### Seçenek 3: Direct psql (DATABASE_URL ile)

```bash
# 1. Get DATABASE_URL from Railway dashboard
# Variables tab → DATABASE_URL → Copy

# 2. Run migration
psql "PASTE_DATABASE_URL_HERE" < backend/prisma/migrations/add_screenshot_metadata.sql
```

---

## ✅ Migration Sonrası Test

### 1. Data Quality Endpoint Test
```bash
curl https://competitor-lens-production.up.railway.app/api/data-quality/score | jq
```

Beklenen:
```json
{
  "success": true,
  "data": {
    "overall": 65,
    "screenshots": 70,
    "assignments": 55,
    "metadata": 15,
    "grade": "D"
  }
}
```

### 2. Intelligence Endpoint Test
```bash
COMP_ID="91d7af6f-b2dd-4033-8a4e-5a7878b6a2b8"
curl "https://competitor-lens-production.up.railway.app/api/intelligence/competitor/$COMP_ID/pm" | jq '.data.opportunityScore'
```

Beklenen: Sayı değeri (örn: 72)

### 3. Frontend Test
```
https://competitor-lens-prod.vercel.app/competitors/91d7af6f-b2dd-4033-8a4e-5a7878b6a2b8
```

Beklenen:
- ✅ Sağ üstte Persona Toggle görünür
- ✅ PM/Designer/Executive seçenekleri çalışır
- ✅ Her persona farklı içerik gösterir

---

## 🔄 Migration Sonrası Data Enhancement (Opsiyonel)

Migration çalıştıktan sonra data kalitesini artırmak için:

```bash
# Railway'de data foundation migration çalıştır
railway run npx tsx src/scripts/dataFoundationMigration.ts
```

Bu script:
- Screenshot'ları analiz eder
- Feature assignment yapar
- Metadata generate eder
- Quality score'u yükseltir

---

## 📊 Beklenen Sonuç

### Migration Öncesi (Şu An)
- ❌ Persona toggle görünüyor ama insights yüklenmiyor
- ❌ Data quality endpoint hata veriyor
- ❌ Screenshot metadata yok
- Grade: N/A

### Migration Sonrası
- ✅ Persona toggle çalışıyor
- ✅ Executive/PM/Designer view'lar farklı içerik gösteriyor
- ✅ Data quality score: D veya C
- ✅ Screenshot metadata mevcut

### Data Foundation Migration Sonrası
- ✅ AI-powered feature assignment
- ✅ Confidence scores
- ✅ Quality metadata
- ✅ Data quality score: B veya A

---

## 🎯 Hızlı Çözüm

**En hızlı yol:**
1. Railway Dashboard → PostgreSQL → Query
2. Migration SQL'i copy-paste
3. Execute
4. Test: `curl https://competitor-lens-production.up.railway.app/api/data-quality/score`
5. Frontend'i yenile: https://competitor-lens-prod.vercel.app

Sonrasında UX'teki farkı göreceksin! 🚀

