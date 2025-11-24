# 🎯 Sonraki Adımlar - Railway Screenshot Import

## ✅ Tamamlananlar

1. ✅ Dockerfile'a screenshot'lar eklendi (616MB, 1320 files)
2. ✅ Screenshot import script'i hazırlandı
3. ✅ GitHub'a push edildi ve Railway deploy başladı
4. ✅ Screenshot serving test edildi ve çalışıyor
5. ✅ API endpoint'leri test edildi ve çalışıyor

## ⏳ Şimdi Yapılması Gerekenler

### 1. Railway Deployment'ın Tamamlanmasını Bekle (5-10 dk)

Railway dashboard'u kontrol et:
- https://railway.app/dashboard
- Deployment status: ✅ Success olmalı
- Logs'da hata olmamalı

### 2. Screenshot Import Script'i Railway'de Çalıştır

**Seçenek A: Railway Dashboard'dan** (Önerilen)
```
1. Railway Dashboard'u aç
2. Service'i seç
3. "Deployments" sekmesine git
4. En son successful deployment'a tıkla
5. "..." menüsünden "Run a command" seç
6. Komutu gir: npx tsx src/scripts/scanAndImportScreenshots.ts
7. "Run" butonuna tıkla
8. Logları izle
```

**Seçenek B: Railway CLI'dan**
```bash
cd /Users/Furkan/Stablex/competitor-lens

# Service'e bağlan (gerekirse)
railway link

# Import script'i çalıştır
railway run npx tsx src/scripts/scanAndImportScreenshots.ts

# Logları izle
railway logs
```

### 3. Import Sonucunu Kontrol Et

Import tamamlandıktan sonra:

```bash
# Production endpoint'leri test et
./test-production-endpoints.sh

# Ya da manuel kontrol:
curl https://competitor-lens-production.up.railway.app/api/competitors | jq '.data[0].screenshotStats'
```

Beklenen çıktı:
```json
{
  "screenshotStats": {
    "total": 68,
    "byFeature": 45,
    "onboarding": 15,
    "orphan": 8
  }
}
```

### 4. Frontend'de Borsa Detay Sayfasını Test Et

1. Frontend URL'i aç: https://competitor-lens-prod.vercel.app
2. Herhangi bir borsaya tıkla (örn: BTC Turk)
3. Ekran görüntüleri görünmeli
4. Screenshot'lara tıkladığında lightbox açılmalı

## 🐛 Sorun Giderme

### Import Script Hata Verirse:

**Hata: "Directory not found"**
```bash
# Dockerfile'da screenshot'lar doğru kopyalanmış mı kontrol et
railway run ls -la /app/uploads/screenshots
```

**Hata: "Database connection failed"**
```bash
# Environment variables kontrol et
railway variables
# DATABASE_URL ve DIRECT_DATABASE_URL olmalı
```

**Hata: "Permission denied"**
```bash
# Railway service account'un database write izni var mı?
# Railway dashboard → Service → Variables → DATABASE_URL kontrol et
```

### Screenshot'lar Hala Görünmüyorsa:

1. **Browser Cache Temizle**
   ```
   Chrome: Cmd+Shift+R (Mac) / Ctrl+Shift+R (Windows)
   ```

2. **Vercel Frontend Redeploy**
   ```bash
   # Vercel dashboard → Deployments → Redeploy
   ```

3. **API URL Kontrol**
   ```
   Vercel → Settings → Environment Variables
   NEXT_PUBLIC_API_URL = https://competitor-lens-production.up.railway.app
   ```

## 📊 İzleme ve Monitoring

### Railway Logs
```bash
railway logs --tail
```

### Health Check
```bash
watch -n 5 'curl -s https://competitor-lens-production.up.railway.app/health | jq'
```

### Screenshot Endpoint
```bash
curl -I https://competitor-lens-production.up.railway.app/uploads/screenshots/BTC%20Turk/IMG_7866.png
```

## 🎉 Başarı Kriterleri

Import başarılı kabul edilir eğer:

- ✅ Railway logs'da "✅ Import complete!" görünürse
- ✅ Database'de 1000+ screenshot kaydı varsa
- ✅ API response'da screenshot sayıları 0'dan büyükse
- ✅ Frontend'de screenshot'lar görünüyorsa
- ✅ Borsa detay sayfası açılıyorsa

## 📞 Yardım

Sorun yaşarsan:

1. Railway logs'u kontrol et: `railway logs`
2. Test script'i çalıştır: `./test-production-endpoints.sh`
3. Database'i kontrol et: `psql $DATABASE_URL -f test-screenshot-paths.sql`

---

## 🚀 Özet Komutlar

```bash
# 1. Deployment durumunu kontrol et
railway status

# 2. Import script'i çalıştır
railway run npx tsx src/scripts/scanAndImportScreenshots.ts

# 3. Sonucu test et
./test-production-endpoints.sh

# 4. Frontend'i kontrol et
open https://competitor-lens-prod.vercel.app
```

Tüm adımlar başarıyla tamamlandığında:
**🎉 Production'da ekran görüntüleri çalışıyor olacak!**

