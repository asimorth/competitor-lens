# 🧪 Local Test Guide - Smart Frontend

## Frontend Local Test (Production Backend ile)

### Neden Güvenli?
✅ Backend production'da kalıyor (Railway)
✅ Frontend sadece local'de çalışıyor (localhost:3000)
✅ Production deployment etkilenmiyor
✅ Persona toggle ve tüm yeni özellikler test edilebilir

---

## ✅ Başlatıldı

### Frontend Development Server
```
Port: http://localhost:3000
Backend: https://competitor-lens-production.up.railway.app (production)
Status: Running in background
```

### Test Edebileceğin Sayfalar

1. **Dashboard**
   - http://localhost:3000

2. **Competitor Detail (Persona Views)**
   - http://localhost:3000/competitors/[ID]
   - Sağ üstten persona toggle ile:
     - Executive: High-level metrics
     - PM: Strategic analysis
     - Designer: Screenshot gallery

3. **Feature Detail (Persona Views)**
   - http://localhost:3000/features/[ID]
   - Her persona için farklı insights

4. **Analytics (Persona Dashboards)**
   - http://localhost:3000/analytics
   - Persona'ya göre farklı dashboard'lar

---

## 🎮 Test Senaryosu

### 1. Competitor Detail Test
```
1. http://localhost:3000/competitors adresine git
2. Herhangi bir borsaya tıkla (örn: BTC Turk)
3. Sağ üst köşede "Product Manager" dropdown'ına tıkla
4. "Executive" seç → High-level summary görüntülenir
5. "Designer" seç → Screenshot gallery görüntülenir
6. "Product Manager" seç → Strategic analysis görüntülenir
```

### 2. Feature Detail Test
```
1. http://localhost:3000/features adresine git
2. Herhangi bir feature'a tıkla (örn: Staking)
3. Persona toggle ile farklı view'ları test et
4. PM view'da opportunity score'u kontrol et
5. Designer view'da screenshot'ları incele
```

### 3. Analytics Test
```
1. http://localhost:3000/analytics
2. Persona toggle ile:
   - Executive: Market overview
   - PM: Gap analysis
   - Designer: Screenshot quality
```

---

## 🔍 Kontrol Edilecek Özellikler

### ✅ Persona Toggle
- [ ] Dropdown açılıyor
- [ ] 3 seçenek görünüyor (PM, Designer, Executive)
- [ ] Seçim değiştirince sayfa içeriği değişiyor
- [ ] LocalStorage'a kaydediyor (refresh sonrası seçim korunuyor)

### ✅ Smart Context Bar
- [ ] Breadcrumbs çalışıyor
- [ ] Data quality badge görünüyor
- [ ] Quick actions menu çalışıyor

### ✅ Executive View
- [ ] Market position gösteriliyor
- [ ] Overall score gösteriliyor
- [ ] Strategic recommendations var
- [ ] Temiz ve özlü görünüm

### ✅ PM View
- [ ] Opportunity scores gösteriliyor
- [ ] Gap analysis görünüyor
- [ ] Strategic recommendations var
- [ ] Feature matrix çalışıyor

### ✅ Designer View
- [ ] Screenshot gallery görünüyor
- [ ] Quality badges çalışıyor
- [ ] UI patterns gösteriliyor
- [ ] Screenshot'lara tıklanınca lightbox açılıyor

---

## 🐛 Sorun Giderme

### Frontend Açılmıyorsa
```bash
# Terminal'de kontrol et
cd /Users/Furkan/Stablex/competitor-lens/frontend
npm run dev

# Port zaten kullanılıyorsa
lsof -ti:3000 | xargs kill -9
npm run dev
```

### API Hataları
```bash
# Backend'e bağlanıp bağlanmadığını kontrol et
curl https://competitor-lens-production.up.railway.app/health

# Frontend .env.local dosyasını kontrol et
cat .env.local
# NEXT_PUBLIC_API_URL doğru olmalı
```

### Persona Toggle Görünmüyorsa
```bash
# Browser console'da kontrol et:
# F12 → Console
# PersonaContext hatası var mı?
```

---

## 📊 Beklenen Sonuç

### İlk Açılış
- Dashboard yüklenir
- Sağ üstte "Product Manager" butonu görünür
- Breadcrumbs "Home" gösterir

### Competitor Detail
- Persona: PM (default)
- Smart context bar üstte
- Competitive analysis card görünür
- Strength/weakness areas listelenmiş

### Persona Değiştirince
- Sayfa içeriği değişir
- Executive: Özet metrikler
- PM: Detaylı analiz
- Designer: Screenshot gallery

---

## 🛑 Server'ı Durdurma

```bash
# Frontend dev server'ı durdur
cd /Users/Furkan/Stablex/competitor-lens/frontend
# Ctrl+C veya
pkill -f "next dev"
```

---

## 🎯 Production'a Zarar Vermez Çünkü

1. ✅ Frontend sadece local'de (localhost:3000)
2. ✅ Backend production'da kalıyor (Railway)
3. ✅ Vercel production deployment değişmedi
4. ✅ Database'e yazma yok (sadece okuma)
5. ✅ Git push zaten yapıldı ama local test bağımsız

---

## 🚀 Test Sonrası

Eğer her şey çalışıyorsa:
1. Frontend otomatik Vercel'de deploy olacak (git push yaptık)
2. Railway backend'de deploy olacak
3. Database migration'ları Railway'de çalıştırman gerekecek

Eğer sorun varsa:
1. Local'de düzeltmeleri yap
2. Test et
3. Git commit + push
4. Tekrar deploy

---

**Frontend şu an arka planda çalışıyor!**
**Test için:** http://localhost:3000

