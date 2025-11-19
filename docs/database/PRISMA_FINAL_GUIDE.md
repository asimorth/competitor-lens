# 🎯 Prisma Console'da Database Görüntüleme - Final Rehber

## Durum

- ✅ Development: Local PostgreSQL çalışıyor
- ❌ Production: Railway PostgreSQL yok (oluşturulacak)
- ❌ Prisma Console: Database görünmüyor

## Hedef

- ✅ Dev ortam: Local PostgreSQL kullanmaya devam
- ✅ Prod ortam: Railway PostgreSQL (Cloud)
- ✅ Prisma Console'da database'i görmek

---

## 🚀 3 Adımlı Kurulum

### ADIM 1: Railway'de PostgreSQL Oluştur (2 dakika)

1. **Railway Dashboard**: https://railway.app/dashboard
2. **competitor-lens-backend** projesine tıklayın
3. Sağ üstte **"+ New"** butonuna tıklayın
4. **"Database"** → **"Add PostgreSQL"**
5. PostgreSQL servisi oluşacak (1-2 dakika bekleyin)

6. **PostgreSQL URL'ini alın**:
   - PostgreSQL servisine tıklayın
   - **"Connect"** sekmesi
   - **"Postgres Connection URL"** kopyalayın
   
   Format:
   ```
   postgresql://postgres:PASSWORD@HOST.railway.app:PORT/railway
   ```

### ADIM 2: Schema'yı Railway'e Push Et (1 dakika)

Terminal'de şu komutu çalıştırın:

```bash
cd /Users/Furkan/Stablex/competitor-lens/backend

# Railway PostgreSQL URL'i ile schema push
DATABASE_URL="railway_postgresql_url_buraya" npx prisma db push
```

**VEYA** otomatik script kullanın:

```bash
cd /Users/Furkan/Stablex/competitor-lens
./setup-prisma-console.sh
```

Script sizden Railway URL'i isteyecek, girdiğinizde otomatik olarak:
- Schema'yı push edecek
- Tabloları oluşturacak
- Prisma Client generate edecek

### ADIM 3: Prisma Console'da Database'i Görüntüle (2 dakika)

1. **Prisma Console**: https://console.prisma.io/
2. **"Create Project"** (ilk kez) veya mevcut projenize tıklayın
3. **"Import existing database"** veya **"Add Database"**
4. **Railway PostgreSQL URL'ini yapıştırın**
5. **"Test connection"** → Başarılı olmalı ✅
6. **"Continue"** veya **"Import Schema"**
7. **"Data Browser"** sekmesine gidin
8. **Tüm tablolarınızı göreceksiniz!** 🎉

---

## 📊 Beklenen Sonuç

### Prisma Console → Data Browser'da göreceğiniz tablolar:

- ✅ `competitors` - Rakip firmalar
- ✅ `features` - Özellikler
- ✅ `competitor_features` - Rakip-Özellik ilişkileri
- ✅ `screenshots` - Ekran görüntüleri
- ✅ `onboarding_screenshots` - Onboarding ekranları
- ✅ `screenshot_analyses` - Screenshot analizleri
- ✅ `competitor_feature_screenshots` - İlişkili screenshot'lar
- ✅ `sync_status` - Sync durumları

Her tabloda:
- Kolon yapısını görebilirsiniz
- Relationships görebilirsiniz
- Veri ekleyip düzenleyebilirsiniz
- Query çalıştırabilirsiniz
- Export alabilirsiniz

---

## 🔧 Environment Variables

### Local Development (.env):
```env
DATABASE_URL="postgresql://Furkan@localhost:5432/competitor_lens"
DIRECT_DATABASE_URL="postgresql://Furkan@localhost:5432/competitor_lens"
```

### Railway Production (Variables):
```env
DATABASE_URL=<PostgreSQL URL'i buraya>
DIRECT_DATABASE_URL=<PostgreSQL URL'i buraya>
NODE_ENV=production
PORT=3001
JWT_SECRET=your-jwt-secret
ALLOWED_ORIGINS=https://frontend-jr3or17qj-asimorths-projects.vercel.app
```

**Önemli**: Railway'de PostgreSQL ekledikten sonra backend variables'ına DATABASE_URL ekleyin!

---

## 🧪 Test Komutları

### 1. Railway Database'e Bağlantı Testi:
```bash
cd /Users/Furkan/Stablex/competitor-lens/backend

# Railway PostgreSQL ile Prisma Studio
DATABASE_URL="railway_url" npx prisma studio
```

### 2. Schema Kontrolü:
```bash
# Schema'nın Railway'de olup olmadığını kontrol
DATABASE_URL="railway_url" npx prisma db pull
```

### 3. Backend Production Test:
```bash
# Backend deploy olduktan sonra
curl https://competitor-lens-production.up.railway.app/health
curl https://competitor-lens-production.up.railway.app/api/competitors
```

---

## 🎯 Mimari

```
┌─────────────────────────────────────────────┐
│            DEVELOPMENT                       │
├─────────────────────────────────────────────┤
│  Local Backend                              │
│      │                                       │
│      └──▶ PostgreSQL (Docker - localhost)   │
│                                              │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│            PRODUCTION                        │
├─────────────────────────────────────────────┤
│  Backend (Railway)                          │
│      │                                       │
│      └──▶ PostgreSQL (Railway)              │
│              │                               │
│              └──▶ Prisma Console ✅         │
│                   (Data Browser görünür)    │
│                                              │
└─────────────────────────────────────────────┘
```

---

## 🔄 Veri Aktarımı (Opsiyonel)

Eğer local database'inizde veri varsa Railway'e aktarabilirsiniz:

### Local → Railway Transfer:

```bash
# 1. Local'den export
cd /Users/Furkan/Stablex/competitor-lens
docker exec -it competitor-lens-db-1 pg_dump -U Furkan competitor_lens > local_data.sql

# 2. Railway'e import
psql "railway_postgresql_url" < local_data.sql

# 3. Veya Prisma Studio ile manuel transfer
# Local Studio: npx prisma studio
# Railway Studio: DATABASE_URL="railway_url" npx prisma studio
# Copy-paste ile veri aktarın
```

---

## ✅ Kontrol Listesi

### Railway Setup:
- [ ] Railway'de PostgreSQL servisi oluşturuldu
- [ ] PostgreSQL URL'i kopyalandı
- [ ] Backend variables'a DATABASE_URL eklendi

### Schema Push:
- [ ] `prisma db push` çalıştırıldı
- [ ] Tüm tablolar oluşturuldu
- [ ] Prisma Client generate edildi

### Prisma Console:
- [ ] Prisma Console'da proje oluşturuldu
- [ ] Railway PostgreSQL bağlandı
- [ ] Data Browser'da tablolar görünüyor
- [ ] Query çalıştırılabiliyior

### Production:
- [ ] Backend Railway'de çalışıyor
- [ ] Database bağlantısı başarılı
- [ ] API endpoint'leri çalışıyor

---

## 🆘 Sorun Giderme

### "Railway PostgreSQL oluşturulmuyor"
- Free tier'da 2 database limiti var
- Kullanılmayan servisleri silin

### "Schema push hatası"
- Railway PostgreSQL çalışıyor mu kontrol edin
- URL formatı doğru mu? (postgresql://...)
- Network bağlantısı var mı?

### "Prisma Console'da tablolar görünmüyor"
- Schema push edildi mi?
- Doğru database'e bağlandınız mı?
- "Refresh" butonuna tıklayın

### "Backend production'da database'e bağlanamıyor"
- Railway variables'da DATABASE_URL var mı?
- URL doğru mu?
- PostgreSQL servisi active mi?

---

## 📚 Yararlı Komutlar

```bash
# Schema'yı Railway'e push et
DATABASE_URL="railway_url" npx prisma db push

# Railway database'ten schema çek
DATABASE_URL="railway_url" npx prisma db pull

# Migration oluştur
DATABASE_URL="railway_url" npx prisma migrate dev --name init

# Prisma Studio (Railway)
DATABASE_URL="railway_url" npx prisma studio

# Prisma Studio (Local)
npx prisma studio

# Database reset (UYARI: Tüm veri silinir!)
DATABASE_URL="railway_url" npx prisma db push --force-reset
```

---

## 🎉 Başarı!

3 adımı tamamladıktan sonra:

✅ **Railway PostgreSQL çalışıyor**
✅ **Prisma Console'da database görünüyor**
✅ **Production backend database'e bağlı**
✅ **Dev ortam local PostgreSQL kullanıyor**
✅ **Her iki ortam da bağımsız çalışıyor**

**Prisma Console → Data Browser'da tüm tablolarınızı görebilir, veri ekleyebilir, düzenleyebilirsiniz!** 🚀

---

## 📞 Yardım

Herhangi bir sorun yaşarsanız:

1. Railway logs kontrol edin
2. Prisma Console connection test yapın
3. `setup-prisma-console.sh` scriptini çalıştırın
4. `PRISMA_CONSOLE_SETUP.md` detaylı rehbere bakın

**Haydi başlayalım! 🎯**

