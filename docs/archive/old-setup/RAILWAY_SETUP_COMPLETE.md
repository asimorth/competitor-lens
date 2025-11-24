# 🚂 RAILWAY SETUP - EKSIKSIZ REHBER

**Tarih**: 24 Kasım 2025  
**Proje**: CompetitorLens Backend + Postgres

---

## 🎯 DATABASE_URL NEDIR?

Railway'de PostgreSQL database'inize bağlanmak için gereken connection string:

### Format:
```
postgresql://[username]:[password]@[host]:[port]/[database]
```

### Örnek:
```
postgresql://postgres:xKj9mPqW2nL5@postgres.railway.internal:5432/railway
```

### Railway'de 2 Tür URL Var:

1. **DATABASE_URL** (External/Public)
   ```
   postgresql://postgres:xxx@monorail.proxy.rlwy.net:12345/railway
   ```
   - Internet üzerinden erişim
   - Daha yavaş
   - Her yerden erişilebilir

2. **DATABASE_PRIVATE_URL** (Internal/Private) ⭐ **ÖNERİLEN**
   ```
   postgresql://postgres:xxx@postgres.railway.internal:5432/railway
   ```
   - Railway internal network
   - Çok daha hızlı
   - Sadece Railway içinde çalışır
   - **Backend için bu kullanılmalı!**

---

## 🔧 SEÇENEK 1: MANUEL SETUP (Railway Dashboard)

### Adım 1: Postgres SERVICE_NAME Öğren

```
Railway Dashboard → Sol sidebar → Postgres service
Service adını not et (örn: "Postgres-JixR")
```

### Adım 2: Postgres DATABASE_URL'i Bul

```
Postgres Service → "Variables" tab

Aşağıdaki variable'lardan birini kopyala (internal tercih et):
✅ DATABASE_PRIVATE_URL (önerilen)
veya
DATABASE_URL (external)
```

Örnek değer:
```
postgresql://postgres:xKj9mPqW2nL5@postgres.railway.internal:5432/railway
```

### Adım 3: Backend Service'e DATABASE_URL Ekle

```
Railway Dashboard → Backend Service (competitor-lens) → "Variables" tab
```

#### Yöntem A: Manuel Değer (Basit Ama Statik)

```
"New Variable" butonu:
Name: DATABASE_URL
Value: postgresql://postgres:xKj9mPqW2nL5@postgres.railway.internal:5432/railway
      (Postgres'ten kopyaladığın değeri yapıştır)
```

**Eksi**: Postgres credentials değişirse manuel güncellemen gerekir.

#### Yöntem B: Service Reference (Önerilen - Dinamik) ⭐

```
"New Variable" butonu:
Name: DATABASE_URL
Value: ${{Postgres.DATABASE_PRIVATE_URL}}
       (Service name'i kullanarak reference)
```

**Artı**: Railway otomatik doğru değeri inject eder, değişirse otomatik güncellenir!

### Adım 4: Diğer Gerekli Variables

Backend Service Variables tab'ında **MUTLAKA** olması gerekenler:

```
NODE_ENV = production
PORT = 3001
ALLOWED_ORIGINS = https://competitor-lens-prod.vercel.app
DATABASE_URL = ${{Postgres.DATABASE_PRIVATE_URL}}
```

### Adım 5: Restart Backend

```
Backend Service → "Restart" butonu
2-3 dakika bekle
```

### Adım 6: Test Et

```
Backend Service → "Database" tab → Refresh (F5)

Beklenen:
✅ Database Connection
   Connected to the database
```

---

## 🚀 SEÇENEK 2: OTOMATİK SETUP (Railway CLI)

### Kurulum:

```bash
# Railway CLI kur
npm install -g @railway/cli

# Login
railway login

# Project'e bağlan
cd /Users/Furkan/Stablex/competitor-lens
railway link
```

### Otomatik Setup Script Çalıştır:

```bash
chmod +x railway-setup.sh
./railway-setup.sh
```

Script şunları yapar:
- ✅ Railway login kontrol
- ✅ Project link kontrol
- ✅ DATABASE_URL reference ekler
- ✅ NODE_ENV, PORT ayarlar
- ✅ ALLOWED_ORIGINS ayarlar
- ✅ Backend service restart

---

## 📋 EKSİKSİZ ENVIRONMENT VARIABLES LİSTESİ

### ✅ Zorunlu (Olmadan Çalışmaz):

```bash
DATABASE_URL="${{Postgres.DATABASE_PRIVATE_URL}}"
NODE_ENV="production"
PORT="3001"
```

### ⚠️ Önemli (Olmazsa Bazı Özellikler Çalışmaz):

```bash
ALLOWED_ORIGINS="https://competitor-lens-prod.vercel.app"
```

### 🔵 Opsiyonel (İleride Gerekebilir):

```bash
# AWS S3 (Screenshot storage için)
AWS_REGION="eu-central-1"
AWS_ACCESS_KEY_ID="AKIAXXXXXXXXXXXXXXXX"
AWS_SECRET_ACCESS_KEY="wJalrXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
S3_BUCKET="competitor-lens-screenshots"
CDN_URL="https://cdn.example.com"

# Redis (Queue işlemleri için)
REDIS_HOST="redis.railway.internal"
REDIS_PORT="6379"
REDIS_PASSWORD="xxxxx"

# OpenAI (AI analiz için)
OPENAI_API_KEY="sk-xxxxx"

# Monitoring
SENTRY_DSN="https://xxxxx@sentry.io/xxxxx"
```

---

## 🎯 MEVCUT SETUP KONTROLÜ

Railway Dashboard'da kontrol et:

### Backend Service → Variables:

```
✅ DATABASE_URL = ${{Postgres.DATABASE_PRIVATE_URL}}
✅ NODE_ENV = production
✅ PORT = 3001
✅ ALLOWED_ORIGINS = https://competitor-lens-prod.vercel.app
```

### Postgres Service → Variables:

```
✅ DATABASE_URL (otomatik)
✅ DATABASE_PRIVATE_URL (otomatik)
✅ POSTGRES_USER (otomatik)
✅ POSTGRES_PASSWORD (otomatik)
✅ POSTGRES_DB (otomatik)
```

---

## 🔍 TROUBLESHOOTING

### Problem: "DATABASE_URL not found"

**Çözüm 1**: Manuel ekle
```
Backend → Variables → New Variable
Name: DATABASE_URL
Value: (Postgres service'den DATABASE_PRIVATE_URL'i kopyala)
```

**Çözüm 2**: Reference kullan
```
Name: DATABASE_URL
Value: ${{Postgres.DATABASE_PRIVATE_URL}}

NOT: "Postgres" kısmı tam olarak Postgres service'in adı olmalı!
Eğer "PostgreSQL-ABC123" ise:
${{PostgreSQL-ABC123.DATABASE_PRIVATE_URL}}
```

### Problem: "Can't reach database server"

**Çözüm**:
```
1. Postgres service Status: Active mi?
   Değilse → Restart

2. DATABASE_URL internal mi external mi?
   External ise → Internal URL kullan (DATABASE_PRIVATE_URL)

3. Network ayarları:
   Railway Dashboard → Project Settings → Networking
   Private networking: Enabled olmalı
```

### Problem: "Connection timeout"

**Çözüm**:
```
1. Postgres service health check:
   Postgres → Data tab → "Query" ile test

2. Backend logs kontrol:
   Backend → Logs → "DATABASE_URL" ara

3. Health check timeout artır:
   railway.json:
   {
     "healthcheckTimeout": 300
   }
```

---

## 🧪 MANUEL TEST

### Test 1: Railway CLI ile

```bash
# Backend environment kontrol
railway run --service backend env | grep DATABASE

# Beklenen:
# DATABASE_URL=postgresql://postgres:xxx@postgres.railway.internal:5432/railway

# Database bağlantı test
railway run --service backend npx prisma db execute --stdin <<< "SELECT 1;"

# Başarılı ise:
# Result: 1
```

### Test 2: Railway Shell ile

```bash
# Backend shell aç
railway run --service backend bash

# Shell içinde:
echo $DATABASE_URL
# Değer görmeli

psql $DATABASE_URL -c "SELECT version();"
# PostgreSQL version görmeli
```

### Test 3: API ile

```bash
curl https://competitor-lens-production.up.railway.app/health

# Beklenen:
# {"status":"ok","timestamp":"...","environment":"production"}

curl https://competitor-lens-production.up.railway.app/api/competitors

# Beklenen:
# {"success":true,"data":[...],"count":21}
```

---

## 📊 SETUP CHECKLIST

Tüm adımları tamamladıysan:

- [ ] Postgres service: **Active** ✅
- [ ] Backend service: **Active** ✅
- [ ] DATABASE_URL: Backend variables'da **var** ✅
- [ ] DATABASE_URL: **Internal URL** kullanıyor ✅
- [ ] NODE_ENV: **production** ✅
- [ ] PORT: **3001** ✅
- [ ] ALLOWED_ORIGINS: Vercel URL ile **eşleşiyor** ✅
- [ ] Backend deployment: **Success** ✅
- [ ] Backend logs: "DATABASE_URL: ✅ Set" ✅
- [ ] Database tab: "Connected to database" ✅
- [ ] Health endpoint: **200 OK** ✅
- [ ] API endpoints: **Data dönüyor** ✅

**Hepsi ✅ ise setup eksiksiz!** 🎉

---

## 🎯 SON ADIMLAR

Setup tamamlandıktan sonra:

### 1. Database Schema Uygula

```bash
railway run --service backend npx prisma db push
```

Beklenen:
```
✔ Database synchronized successfully
✔ Generated Prisma Client
```

### 2. Service Restart

```
Railway Dashboard → Backend Service → Restart
```

### 3. Test

```bash
# Health check
curl https://competitor-lens-production.up.railway.app/health

# API test
curl https://competitor-lens-production.up.railway.app/api/competitors

# Frontend test
open https://competitor-lens-prod.vercel.app/competitors
```

---

## 🚀 HIZLI BAŞLANGIÇ

En hızlı yol (3 dakika):

```bash
# 1. Railway CLI kur (eğer yoksa)
npm i -g @railway/cli

# 2. Login ve link
railway login
cd /Users/Furkan/Stablex/competitor-lens
railway link

# 3. Variables ayarla
railway variables --service backend set DATABASE_URL='${{Postgres.DATABASE_PRIVATE_URL}}'
railway variables --service backend set NODE_ENV=production
railway variables --service backend set PORT=3001
railway variables --service backend set ALLOWED_ORIGINS='https://competitor-lens-prod.vercel.app'

# 4. Restart
railway service backend
railway up --detach

# 5. Database push
railway run --service backend npx prisma db push

# 6. Test
curl https://competitor-lens-production.up.railway.app/health
```

**Done!** ✅

---

**Hangi yöntemi tercih edersin? Manuel (Dashboard) mı, Otomatik (CLI) mi?**

