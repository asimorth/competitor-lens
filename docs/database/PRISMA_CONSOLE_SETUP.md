# 🎯 Prisma Console'da Database Görüntüleme

## Sorun
Prisma Console'da database gözükmüyor çünkü Prisma Data Platform aktif değil.

## Çözüm: Adım Adım

### 1️⃣ Railway'de PostgreSQL Oluşturun (Production için)

1. **Railway Dashboard**: https://railway.app/dashboard
2. **competitor-lens-backend** projesine gidin
3. **"+ New"** → **"Database"** → **"Add PostgreSQL"**
4. PostgreSQL servisi oluşacak
5. **PostgreSQL** servisine tıklayın → **"Connect"** → **"Postgres Connection URL"** kopyalayın

Format şu şekilde olacak:
```
postgresql://postgres:PASSWORD@HOST.railway.app:PORT/railway
```

### 2️⃣ Prisma Console'da Proje Oluşturun

1. **Prisma Console**: https://console.prisma.io/
2. **"Create Project"** veya mevcut projenize gidin
3. **"Import Database"** veya **"Add a Database"** seçin
4. Railway PostgreSQL URL'ini yapıştırın
5. **"Test Connection"** → Başarılı olmalı ✅
6. **"Continue"** veya **"Import"**

### 3️⃣ Schema'yı Push Edin

Prisma Console'da database'i görebilmek için schema'yı push etmeniz gerekiyor:

```bash
cd /Users/Furkan/Stablex/competitor-lens/backend

# Railway PostgreSQL URL'ini kullanarak
DATABASE_URL="postgresql://postgres:PASSWORD@HOST.railway.app:PORT/railway" npx prisma db push
```

Bu komut:
- Schema'nızı Railway PostgreSQL'e yükleyecek
- Tüm tabloları oluşturacak
- Prisma Console'da görünür hale gelecek

### 4️⃣ Prisma Console'da Database'i Görüntüleyin

1. Prisma Console → Projeniz
2. **"Data Browser"** sekmesine gidin
3. Artık tüm tablolarınızı görebilirsiniz! 🎉

---

## 🔧 Environment Variables Yapılandırması

### Development (Local):
```env
# .env (local development)
DATABASE_URL="postgresql://Furkan@localhost:5432/competitor_lens"
DIRECT_DATABASE_URL="postgresql://Furkan@localhost:5432/competitor_lens"
```

### Production (Railway):
```env
# Railway Backend Variables
DATABASE_URL="postgresql://postgres:PASSWORD@HOST.railway.app:PORT/railway"
DIRECT_DATABASE_URL="postgresql://postgres:PASSWORD@HOST.railway.app:PORT/railway"
```

**Not**: Prisma Accelerate'i şimdilik kullanmayacağız. Direkt PostgreSQL bağlantısı kullanacağız.

---

## 📊 Alternatif: Prisma Accelerate ile (Önerilen)

Eğer Accelerate kullanmak isterseniz:

### Railway PostgreSQL + Accelerate:

1. **Railway PostgreSQL oluşturduktan sonra**:
2. **Prisma Console** → **"Accelerate"** sekmesi
3. **"Enable Accelerate"**
4. Railway PostgreSQL URL'ini girin
5. Yeni **Accelerate URL** alın (prisma+postgres://...)

### Production Variables (Accelerate ile):
```env
DATABASE_URL="prisma+postgres://accelerate.prisma-data.net/?api_key=..."
DIRECT_DATABASE_URL="${PostgreSQL.DATABASE_URL}"
```

---

## 🚀 Hızlı Başlangıç

### Komutlar (Sırayla):

```bash
cd /Users/Furkan/Stablex/competitor-lens/backend

# 1. Railway PostgreSQL URL'i ile schema push
DATABASE_URL="railway_postgresql_url" npx prisma db push

# 2. Prisma Studio ile kontrol edin
DATABASE_URL="railway_postgresql_url" npx prisma studio

# 3. Migration oluşturun (opsiyonel, production için önerilen)
DATABASE_URL="railway_postgresql_url" npx prisma migrate dev --name init
```

---

## ✅ Beklenen Sonuç

**Prisma Console → Data Browser'da görünecekler:**

- ✅ competitors tablosu
- ✅ features tablosu
- ✅ competitor_features tablosu
- ✅ screenshots tablosu
- ✅ Ve diğer tüm tablolar...

Her tabloda:
- Column'ları görebilirsiniz
- Veri ekleyip düzenleyebilirsiniz
- Query çalıştırabilirsiniz
- Relationships görebilirsiniz

---

## 🧪 Test

### Local'de Test:
```bash
cd /Users/Furkan/Stablex/competitor-lens/backend
npm run dev
```

### Production Test:
```bash
# Railway backend deploy olduktan sonra
curl https://competitor-lens-production.up.railway.app/health
curl https://competitor-lens-production.up.railway.app/api/competitors
```

---

## 📝 Özet

**Development:**
- Local PostgreSQL (Docker)
- DATABASE_URL → localhost

**Production:**
- Railway PostgreSQL
- DATABASE_URL → Railway PostgreSQL
- Prisma Console'da görülebilir

**Prisma Console'da görmek için:**
1. Railway PostgreSQL oluştur
2. Prisma Console'da import et
3. `prisma db push` çalıştır
4. Data Browser'da gör! 🎉

