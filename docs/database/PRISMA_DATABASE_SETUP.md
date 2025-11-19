# Prisma Cloud Database Integration Rehberi

## 🎯 Amaç

Prisma Cloud'da gerçek bir PostgreSQL database oluşturmak ve mevcut verilerinizi oraya taşımak.

## 📋 Mevcut Durum

- ✅ Local PostgreSQL database var (Docker)
- ✅ Prisma schema güncel
- ❌ Prisma Cloud'da database yok
- ❌ Prisma Accelerate database'e bağlı değil

## 🔧 Çözüm: Adım Adım

### Seçenek 1: Prisma Cloud ile Yeni PostgreSQL Database (ÖNERİLEN)

Prisma artık kendi managed database hizmeti sunmuyor, ancak connection pooling sağlıyor.

#### A. Railway'de Yeni PostgreSQL Database Oluşturun

1. **Railway Dashboard**: https://railway.app/dashboard
2. **competitor-lens-backend** projesine gidin
3. **"+ New Service"** → **"Database"** → **"PostgreSQL"**
4. PostgreSQL servisi otomatik oluşturulacak

5. **PostgreSQL Variables'ı alın**:
   - `DATABASE_URL` (private network için)
   - `DATABASE_PUBLIC_URL` (public erişim için)

6. **Database URL'i kopyalayın** (PostgreSQL service → Connect → Connection String)

#### B. Prisma Accelerate'i Railway Database'e Bağlayın

1. **Prisma Console**: https://console.prisma.io/
2. **Projenize tıklayın**
3. **"Accelerate"** sekmesine gidin
4. **"Configure Database Connection"** butonuna tıklayın
5. **Railway'den aldığınız DATABASE_URL'i yapıştırın**
   ```
   postgresql://postgres:password@hostname:port/railway
   ```
6. **Test Connection** → Başarılı olmalı
7. **Yeni Accelerate URL'i kopyalayın** (prisma+postgres:// ile başlar)

#### C. Railway Backend Environment Variables

1. **Railway** → **competitor-lens-backend** → **Variables**
2. Şu variables'ları ekleyin/güncelleyin:
   ```
   DATABASE_URL=prisma+postgres://accelerate.prisma-data.net/?api_key=YENI_API_KEY
   DIRECT_DATABASE_URL=${PostgreSQL.DATABASE_URL}
   ```

`DIRECT_DATABASE_URL` migration'lar için gerekli.

#### D. Prisma Schema Güncelleme

Schema'da `directUrl` ekleyin (migration için):

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")      // Accelerate URL
  directUrl = env("DIRECT_DATABASE_URL") // Direct PostgreSQL URL
}
```

#### E. Database Migration

```bash
cd /Users/Furkan/Stablex/competitor-lens/backend

# Migration çalıştır
npx prisma migrate deploy

# Prisma Client yeniden generate et
npx prisma generate
```

#### F. Mevcut Verileri Transfer Et (Opsiyonel)

Eğer local database'inizde veri varsa:

```bash
# 1. Local database'den dump al
pg_dump -h localhost -p 5432 -U postgres -d competitor_lens > backup.sql

# 2. Railway database'e import et
# Railway PostgreSQL URL'ini kullanın
psql "postgresql://postgres:password@hostname:port/railway" < backup.sql
```

---

### Seçenek 2: Mevcut Local Database'i Production'da Kullan

Eğer Railway'de zaten bir PostgreSQL varsa veya local'i kullanmak istiyorsanız:

1. **Railway PostgreSQL ekleyin** (yukarıdaki A adımı)
2. **Prisma Accelerate'i bypass edin** (development için):
   ```env
   # Railway Variables
   DATABASE_URL=${PostgreSQL.DATABASE_URL}  # Direct connection
   ```

Ama bu durumda Prisma Accelerate'in avantajlarını (caching, connection pooling) kaybedersiniz.

---

### Seçenek 3: Supabase veya Neon Database (ÜCRETSİZ)

#### Supabase:

1. **https://supabase.com** → Ücretsiz hesap oluşturun
2. **Yeni proje oluşturun**
3. **Settings** → **Database** → **Connection String** kopyalayın
4. **Prisma Accelerate'e bağlayın** (yukarıdaki B adımı)

#### Neon:

1. **https://neon.tech** → Ücretsiz hesap oluşturun
2. **Yeni proje oluşturun**
3. **Connection String** kopyalayın
4. **Prisma Accelerate'e bağlayın**

---

## 🚀 Hızlı Başlangıç (ÖNERİLEN YÖNTEM)

### Railway PostgreSQL + Prisma Accelerate

```bash
# 1. Railway Dashboard'da PostgreSQL ekleyin
# 2. PostgreSQL URL'i kopyalayın

# 3. Backend schema'yı güncelleyin
cd /Users/Furkan/Stablex/competitor-lens/backend
```

Prisma schema'ya `directUrl` ekleyin:

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_DATABASE_URL")
}
```

```bash
# 4. Migration çalıştırın
npx prisma migrate deploy

# 5. Railway'de variables ayarlayın:
# DATABASE_URL=prisma+postgres://... (Accelerate URL)
# DIRECT_DATABASE_URL=${PostgreSQL.DATABASE_URL}
```

---

## ✅ Test

```bash
# Prisma Studio ile database'i kontrol edin
cd /Users/Furkan/Stablex/competitor-lens/backend
DATABASE_URL="prisma+postgres://..." npx prisma studio
```

Veya Railway backend'den:

```bash
# Backend'de test query
curl https://competitor-lens-production.up.railway.app/api/competitors
```

---

## 📊 Önerilen Mimari

```
┌─────────────────────────────────────────────┐
│              PRODUCTION                      │
├─────────────────────────────────────────────┤
│                                              │
│  Backend (Railway)                          │
│      │                                       │
│      ├─── DATABASE_URL ────▶ Prisma Accelerate
│      │                            │          │
│      │                            ▼          │
│      └─── DIRECT_DATABASE_URL ──▶ PostgreSQL│
│                                   (Railway)  │
│                                              │
└─────────────────────────────────────────────┘

Benefits:
✅ Connection pooling (Accelerate)
✅ Query caching (Accelerate)
✅ Direct migration access
✅ Ölçeklenebilir
```

---

## 🎯 Hangi Yöntemi Seçmeliyim?

1. **Railway PostgreSQL + Prisma Accelerate** ✅ ÖNERİLEN
   - En kolay setup
   - Tek platform
   - Güvenilir

2. **Supabase + Prisma Accelerate** ✅ İYİ
   - Ücretsiz tier cömert
   - Realtime özellikler
   - Dashboard güzel

3. **Neon + Prisma Accelerate** ✅ İYİ
   - Serverless PostgreSQL
   - Auto-scaling
   - Ücretsiz tier var

**Tercih: Railway PostgreSQL** (Zaten Railway kullanıyoruz, integration kolay)

