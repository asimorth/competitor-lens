# 🔧 RAILWAY DATABASE CONNECTION TROUBLESHOOTING

**Sorun**: "Attempting to connect to the database..." sonsuza kadar devam ediyor
**Son Güncelleme**: 24 Kasım 2025

---

## 📋 KONTROL LİSTESİ (SIRALAMA ÖNEMLİ!)

### 1️⃣ Postgres Service Durumu

Railway Dashboard'da:
```
Sol sidebar → Services → Postgres-JixR (veya benzeri)
```

**Kontrol Et**:
- ✅ Service Status: **"Active"** (yeşil) mi?
- ❌ Status: **"Failed"** veya **"Deploying"** ise sorun burada!

**Eğer Postgres Failed/Crashed ise**:
```
Postgres service → "Restart" butonu
1-2 dakika bekle
Status: Active olana kadar
```

---

### 2️⃣ DATABASE_URL Variable Kontrolü

**Backend Service'de**:
```
Backend Service → Variables tab
```

**Aranacak**:
```
Name: DATABASE_URL
Value: postgresql://postgres:xxxxx@postgres.railway.internal:5432/railway
```

**Kontrol Et**:
- ✅ DATABASE_URL var mı?
- ✅ Value boş değil mi?
- ✅ `postgres.railway.internal` mi yoksa external URL mi?

**Eğer DATABASE_URL YOK ise**:
```
Bu KRİTİK bir sorun!

Çözüm:
1. Postgres service → Variables tab
2. DATABASE_URL'i kopyala
3. Backend service → Variables → Add Variable
4. Name: DATABASE_URL
5. Value: (kopyaladığın değeri yapıştır)
6. Backend service'i Restart et
```

**Eğer DATABASE_URL external (örn: monorail.proxy.rlwy.net) ise**:
```
Problem: Internal network yerine external kullanıyor

Çözüm:
1. Postgres service → Variables → DATABASE_PRIVATE_URL kopyala
2. Backend service → Variables → DATABASE_URL'i edit et
3. Value'yu DATABASE_PRIVATE_URL ile değiştir
4. Save → Restart backend
```

---

### 3️⃣ Backend Deployment Durumu

```
Backend Service → Deployments tab
```

**Kontrol Et**:
- Son deployment **"Success ✅"** mi?
- **"Failed ❌"** ise logs'a bak

**Eğer Deployment Failed ise**:
```
Failed deployment'a tıkla → "View Logs"

Sık hatalar:
❌ "Error: P1001: Can't reach database"
   → DATABASE_URL yanlış veya Postgres down

❌ "Error: No DATABASE_URL in environment"
   → Variable missing

❌ "Error: P3014: Migration failed"
   → prisma db push gerekiyor

❌ Docker build failed
   → Dockerfile syntax hatası
```

---

### 4️⃣ Railway Logs İnceleme

**Backend Service Logs**:
```
Backend Service → Logs tab (veya alt kısım)
```

**Aranacak Hatalar**:
```bash
# BAD - Database connection fail:
❌ "PrismaClientInitializationError"
❌ "Can't reach database server"
❌ "Invalid DATABASE_URL"
❌ "Connection timeout"

# GOOD - Başarılı bağlantı:
✅ "🚀 Server running on port 3001"
✅ "📊 Environment Info"
✅ "DATABASE_URL: ✅ Set"
✅ "✅ All checks passed! Starting server"
```

**Log'da DATABASE_URL Check**:
```
Logs'da ara: "DATABASE_URL:"

Görülmesi gereken:
✅ DATABASE_URL: ✅ Set

Eğer görünen:
❌ DATABASE_URL: ❌ Not set
   → Variable eksik!
```

---

### 5️⃣ Prisma Client Regeneration

**Backend Service'de Terminal Aç**:
```
Backend Service → Terminal butonu (üstte)
```

**Komutları Çalıştır**:
```bash
# 1. Prisma Client'ı regenerate et
npx prisma generate

# Beklenen çıktı:
# ✔ Generated Prisma Client (6.16.3)

# 2. Database bağlantısını test et
npx prisma db execute --stdin <<< "SELECT 1;"

# Başarılı ise:
# Result: 1

# Başarısız ise:
# Error: P1001: Can't reach database server
```

**Eğer "Can't reach database" hatası alıyorsan**:
```bash
# DATABASE_URL'i kontrol et
echo $DATABASE_URL

# Boş gelirse:
❌ Variable backend service'e inject edilmemiş!

# Değer gelirse:
# postgresql://user:pass@host:5432/db formatında mı?
```

---

### 6️⃣ Service Dependencies (Reference Kontrol)

**Railway'de Service'ler birbirine referans vermeli**:

```
Backend Service → Settings → Service Variables

Aranacak:
DATABASE_URL = ${{Postgres.DATABASE_URL}}

Bu format önemli! $ işareti ile reference yapmalı.
```

**Eğer hard-coded URL varsa (kötü)**:
```
❌ DATABASE_URL = postgres://user:pass@xxx.railway.app:5432/railway

Bu yanlış! Service down olunca veya yeniden deploy'da URL değişir.
```

**Doğru format (iyi)**:
```
✅ DATABASE_URL = ${{Postgres.DATABASE_URL}}

Railway otomatik doğru değeri inject eder.
```

---

## 🎯 EN SIK KARŞILAŞILAN SORUNLAR

### Problem 1: DATABASE_URL Eksik

**Belirtiler**:
- Backend logs'da: "DATABASE_URL: ❌ Not set"
- Database tab: "Attempting to connect..."
- API çağrıları: 500 error

**Çözüm**:
```
1. Postgres service → Connect → Copy DATABASE_URL
2. Backend service → Variables → New Variable
   Name: DATABASE_URL
   Value: (paste)
3. Restart backend
```

---

### Problem 2: Postgres Service Down

**Belirtiler**:
- Postgres status: "Failed" veya "Crashed"
- Backend logs: "Can't reach database server"

**Çözüm**:
```
1. Postgres service → Restart butonu
2. 1-2 dakika bekle
3. Status: Active olunca backend'i de restart et
```

---

### Problem 3: External URL Yerine Internal URL Gerekli

**Belirtiler**:
- DATABASE_URL: `postgres://...@monorail.proxy.rlwy.net:xxxxx`
- Slow connection veya timeout

**Çözüm**:
```
Railway internal network kullan (daha hızlı):

1. Postgres → Variables → DATABASE_PRIVATE_URL kopyala
   Format: postgres://...@postgres.railway.internal:5432

2. Backend → Variables → DATABASE_URL'i değiştir
   Value: (private URL'yi yapıştır)

3. Restart backend
```

---

### Problem 4: Prisma Client Outdated

**Belirtiler**:
- Schema değişti ama client eski
- "Unknown field" hataları

**Çözüm**:
```bash
# Railway terminal:
npx prisma generate
npx prisma db push

# Restart service
```

---

## 🚀 HIZLI FIX (5 ADIM)

Eğer hala bağlanamıyorsan, bu sırayla:

### 1. Postgres Status Kontrol
```
Postgres service → Status: Active mi?
Değilse → Restart
```

### 2. DATABASE_URL Var mı?
```
Backend → Variables → DATABASE_URL var mı?
Yoksa → Ekle (Postgres'ten kopyala)
```

### 3. Backend Deployment Success mu?
```
Backend → Deployments → Son deployment success mi?
Değilse → Logs oku
```

### 4. Terminal'de Test
```bash
Railway terminal:
echo $DATABASE_URL
npx prisma db execute --stdin <<< "SELECT 1;"
```

### 5. Her İkisini de Restart
```
1. Postgres service → Restart
2. Bekle 1 dakika
3. Backend service → Restart
4. Bekle 2 dakika
5. Database tab'ı refresh et (F5)
```

---

## ✅ BAŞARI KRİTERLERİ

Database bağlantısı çalışıyorsa:

```
Railway Dashboard → Backend Service → Database tab:

✅ Database Connection
   Connected to the database

Backend logs:
✅ DATABASE_URL: ✅ Set
✅ Server running on port 3001

API test:
✅ curl https://xxx.railway.app/health
   {"status":"ok"}
```

---

## 📞 MANUEL SQL BAĞLANTI TESTİ

Railway Postgres'e direkt bağlan:

```
Postgres service → Data tab → Query button

SQL çalıştır:
SELECT version();

Başarılı ise Postgres çalışıyor demektir.
Sorun backend → postgres arası connection'da.
```

---

## 🐛 DEBUG MODE

Backend'de database debug'ı aktif et:

**Backend Service → Variables → New Variable**:
```
Name: DEBUG
Value: prisma:*
```

Restart sonrası logs'da Prisma query'leri göreceksin.

---

## 📊 ÖZET CHECKLIST

- [ ] Postgres service: Active
- [ ] DATABASE_URL: Backend variables'da var
- [ ] DATABASE_URL: Doğru format (postgres://...)
- [ ] Backend deployment: Success
- [ ] Backend logs: DATABASE_URL ✅ Set
- [ ] Terminal test: `echo $DATABASE_URL` değer döndürür
- [ ] Terminal test: `npx prisma db execute` çalışır
- [ ] API test: `/health` endpoint 200 OK

**Hepsi ✅ ise bağlantı çalışmalı!**

---

**Hangisi sorun? Bana Railway screenshots veya logs göster, birlikte çözelim!**

