# 🚀 Screenshot Sync Commands

## Railway Backend Şimdi Deploy Oluyor...

Railway otomatik deploy başlattı. 2-3 dakika bekle, sonra sync'i tetikle.

## 1️⃣ Railway Deploy Durumunu Kontrol Et

Railway Dashboard:
- Backend service → Deployments
- En son deployment "Running" → "Success" olmalı
- Logs'da hata yoksa devam et

## 2️⃣ DRY RUN ile Test Et (Önerilen)

İlk önce dry-run yap, hiçbir şey değişmez, sadece ne yapacağını gösterir:

```bash
curl -X POST "https://competitor-lens-production.up.railway.app/api/sync/screenshots?dryRun=true" \
  -H "x-admin-secret: YOUR_JWT_SECRET_FROM_RAILWAY"
```

**JWT_SECRET'i Railway'den al:**
- Backend service → Variables → JWT_SECRET değerini kopyala

**Beklenen Response:**
```json
{
  "success": true,
  "message": "Dry run completed - no changes were made",
  "stats": {
    "scanned": 800,
    "added": 800,
    "skipped": 0,
    "errors": 0,
    "byCompetitor": { ... },
    "byFeature": { ... }
  },
  "dryRun": true
}
```

## 3️⃣ GERÇEK SYNC (Canlı Database)

Dry run başarılıysa, gerçek sync'i çalıştır:

```bash
curl -X POST "https://competitor-lens-production.up.railway.app/api/sync/screenshots" \
  -H "x-admin-secret: YOUR_JWT_SECRET_FROM_RAILWAY"
```

**Bu komut:**
- ✅ 800+ screenshot'ı database'e ekler
- ✅ Feature mapping'leri oluşturur
- ✅ CompetitorFeature ilişkileri günceller

**Beklenen Response:**
```json
{
  "success": true,
  "message": "Screenshot sync completed successfully",
  "stats": {
    "scanned": 800,
    "added": 800,
    "skipped": 0,
    "errors": 0,
    "byCompetitor": {
      "OKX TR": 108,
      "Coinbase": 568,
      "Kraken": 341,
      ...
    },
    "byFeature": {
      "KYC & Identity Verification": 200,
      "User Onboarding": 150,
      ...
    }
  },
  "dryRun": false
}
```

## 4️⃣ Railway Logs'u İzle

Sync çalışırken:
- Railway Dashboard → Backend Service → Logs
- Real-time progress göreceksin:
  ```
  🔍 Starting screenshot sync...
  📊 Found: 800 screenshots
  ✅ OKX TR: 108 screenshots
  ✅ Coinbase: 568 screenshots
  ...
  🎉 Sync completed!
  ```

## 5️⃣ Database Validation

Sync bittikten sonra Railway Database kontrol et:

**Railway Dashboard → Database → Query**

```sql
-- Screenshot count
SELECT COUNT(*) FROM screenshots;
-- Beklenen: ~800

-- Feature bazında count
SELECT f.name, COUNT(s.id) as screenshot_count
FROM features f
LEFT JOIN screenshots s ON s.feature_id = f.id
GROUP BY f.name
ORDER BY screenshot_count DESC;

-- Competitor bazında count
SELECT c.name, COUNT(s.id) as screenshot_count
FROM competitors c
LEFT JOIN screenshots s ON s.competitor_id = c.id
GROUP BY c.name
ORDER BY screenshot_count DESC;
```

## 6️⃣ Frontend Test

Sync başarılıysa frontend otomatik screenshot'ları gösterir:

1. Frontend URL'i aç
2. `/features-simple` sayfasına git
3. Feature'lara tıkla
4. Screenshot grid'i gör
5. Lightbox'ta screenshot'ları aç

## 🔄 Tekrar Çalıştırma

Script idempotent - tekrar çalıştırılabilir:
- Duplicate screenshot eklemez (skip eder)
- Mevcut kayıtları korur
- Sadece yeni dosyalar eklenir

## 🐛 Troubleshooting

**401 Unauthorized:**
- JWT_SECRET doğru mu kontrol et
- Header ismini doğrula: `x-admin-secret`

**500 Error:**
- Railway backend logs kontrol et
- Database bağlantısı çalışıyor mu?
- Screenshot klasörleri Docker image'de var mı?

**Added: 0:**
- Screenshot'lar zaten database'de olabilir
- Dry-run ile test et
- Railway logs'da detay gör

## ✅ Başarı Kriterleri

- [ ] Dry run 800+ screenshot gösteriyor
- [ ] Gerçek sync 800+ screenshot ekliyor
- [ ] Frontend `/features-simple` datalar gösteriyor
- [ ] Lightbox screenshot'ları açıyor
- [ ] No CORS errors

