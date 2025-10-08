# 🚀 Hızlı Database Setup - Railway PostgreSQL

## Adım Adım Rehber (5 Dakika)

### 1️⃣ Railway'de PostgreSQL Ekleyin

1. **Railway Dashboard'a gidin**: https://railway.app/dashboard
2. **competitor-lens-backend** projesine tıklayın
3. Sağ üstte **"+ New"** butonuna tıklayın
4. **"Database"** seçin
5. **"Add PostgreSQL"** seçin
6. PostgreSQL servisi otomatik oluşturulacak (1-2 dakika)

### 2️⃣ PostgreSQL Bağlantı Bilgilerini Alın

1. **PostgreSQL** servisine tıklayın
2. **"Variables"** sekmesine gidin
3. **`DATABASE_URL`** değerini kopyalayın
   - Format: `postgresql://postgres:password@hostname:port/railway`

### 3️⃣ Prisma Console'da Database Bağlantısını Yapın

1. **Prisma Console**: https://console.prisma.io/
2. Projenize tıklayın
3. Sol menüden **"Data Platform"** veya **"Accelerate"** sekmesine gidin
4. **"Configure"** veya **"Add Connection"** butonuna tıklayın
5. Railway'den kopyaladığınız **DATABASE_URL**'i yapıştırın
6. **"Test Connection"** → Başarılı olmalı ✅
7. **"Enable Accelerate"** butonuna tıklayın
8. **Yeni Accelerate URL'ini kopyalayın** (prisma+postgres:// ile başlar)

### 4️⃣ Railway Environment Variables Güncelleyin

1. **Railway** → **competitor-lens-backend** (backend servisi) → **Variables**
2. Şu variables'ları ekleyin/güncelleyin:

```
DATABASE_URL=prisma+postgres://accelerate.prisma-data.net/?api_key=YENI_API_KEY
```
(Prisma Console'dan aldığınız Accelerate URL)

```
DIRECT_DATABASE_URL=${PostgreSQL.DATABASE_URL}
```
(Railway PostgreSQL'e referans - otomatik doldurulacak)

3. **Save** - Backend otomatik redeploy olacak

### 5️⃣ Database Migration Çalıştırın

Railway backend deploy olduktan sonra migration otomatik çalışacak.

Veya manuel çalıştırmak isterseniz terminal'den:

```bash
cd /Users/Furkan/Stablex/competitor-lens/backend

# Railway PostgreSQL URL'ini kullanarak migration
DIRECT_DATABASE_URL="postgresql://..." npx prisma migrate deploy
```

---

## ✅ Doğrulama

### Test 1: Prisma Studio

```bash
cd /Users/Furkan/Stablex/competitor-lens/backend

# Accelerate URL ile
DATABASE_URL="prisma+postgres://..." npx prisma studio
```

### Test 2: Backend API

```bash
curl https://competitor-lens-production.up.railway.app/api/competitors
```

Artık boş bir array dönmeli: `{"success":true,"data":[]}`

---

## 📊 Final Mimari

```
Backend (Railway)
    │
    ├─── DATABASE_URL ────────▶ Prisma Accelerate
    │                              │
    │                              ▼
    └─── DIRECT_DATABASE_URL ───▶ PostgreSQL (Railway)
                                   (Migrations için)
```

---

## 🎯 Beklenen Sonuç

✅ Railway'de PostgreSQL çalışıyor
✅ Prisma Accelerate PostgreSQL'e bağlı
✅ Backend Accelerate üzerinden database'e erişiyor
✅ Migration'lar çalışıyor
✅ Database boş ama hazır (veri eklenebilir)

---

## 🔄 Mevcut Local Verileri Transfer (Opsiyonel)

Eğer local database'inizde veri varsa:

```bash
# 1. Local'den export
docker exec -it competitor-lens-db-1 pg_dump -U postgres competitor_lens > local_backup.sql

# 2. Railway'e import (Railway PostgreSQL URL'i ile)
psql "postgresql://postgres:password@hostname:port/railway" < local_backup.sql
```

---

## 🆘 Sorun Giderme

### PostgreSQL oluşturulmuyor:
- Railway hesabınızda limit var mı kontrol edin
- Free tier'da 2 database limit var

### Prisma bağlanamıyor:
- DATABASE_URL formatı doğru mu?
- PostgreSQL servisi çalışıyor mu?
- Network erişimi var mı?

### Migration çalışmıyor:
- `DIRECT_DATABASE_URL` doğru mu?
- PostgreSQL'e direkt erişim var mı?

---

**ŞİMDİ YAPMANIZ GEREKEN:**

1. Railway'de PostgreSQL ekleyin (yukarıdaki 1. adım)
2. Prisma Console'da bağlantıyı yapın (3. adım)  
3. Railway'de variables güncelleyin (4. adım)

**Tamamlayınca bana haber verin, test edelim! 🚀**

