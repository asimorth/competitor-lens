# 🚨 BACKEND 502 ERROR - Acil Düzeltme

## ❌ Problem
Backend API 502 hatası veriyor:
```json
{"status":"error","code":502,"message":"Application failed to respond"}
```

## 🔍 Muhtemel Nedenler

### 1. Build/Deploy Hatası
Railway'de build başarısız olmuş olabilir.

### 2. Environment Variables Eksik
Production database URL veya diğer env variables eksik.

### 3. Port Configuration
Backend yanlış port'ta dinliyor olabilir.

## ✅ Hızlı Çözüm Adımları

### Adım 1: Railway Logs Kontrol
1. https://railway.app/dashboard adresine git
2. Backend service'i seç
3. "Deployments" tab'ına git
4. En son deployment'ı seç
5. Logs'ları kontrol et

**Aranacak hatalar:**
- `Error: Cannot find module...`
- `DATABASE_URL is not defined`
- `Port already in use`
- `Prisma Client is not generated`

### Adım 2: Environment Variables Kontrol
Railway Dashboard → Backend Service → Variables

**Gerekli variables:**
```
DATABASE_URL=postgresql://...
DIRECT_DATABASE_URL=postgresql://...
NODE_ENV=production
PORT=3000
```

### Adım 3: Redeploy
Eğer logs'da açık hata yoksa:
1. Railway Dashboard'da "Redeploy" butonuna tıkla
2. 2-3 dakika bekle
3. Health check yap

### Adım 4: Manual Fix (Eğer hala çalışmazsa)

Railway Terminal'den:
```bash
# Prisma client generate
npx prisma generate

# Build
npm run build

# Start
npm start
```

## 🔧 Geçici Çözüm

Eğer backend hızlıca düzeltilemezse, **rollback** yapılabilir:

### Railway'de Önceki Versiyona Dön
1. Railway Dashboard → Deployments
2. Önceki başarılı deployment'ı bul (commit: `08ea2f8` veya daha eski)
3. "Redeploy" butonuna tıkla

## 📊 Debug Commands

Railway Terminal'den çalıştır:

```bash
# Node version
node --version

# NPM version
npm --version

# Environment check
echo $DATABASE_URL | head -c 30

# Prisma status
npx prisma --version

# Files check
ls -la dist/

# Start manually
node dist/server.js
```

## 🎯 Beklenen Çıktılar

### Başarılı Health Check:
```json
{
  "status": "ok",
  "environment": "production",
  "timestamp": "2025-11-20T...",
  "message": "CompetitorLens Backend API is running!"
}
```

### Başarılı API Call:
```json
{
  "success": true,
  "data": [...],
  "count": 14
}
```

## 📞 Acil Destek

Eğer Railway'e erişim sorunu varsa:
1. GitHub repo'dan railway.json kontrol et
2. start-railway.js dosyasını kontrol et
3. package.json'daki start script'i kontrol et

---

**Status:** ❌ Backend DOWN  
**Priority:** CRITICAL  
**Action Required:** Railway logs kontrol + redeploy

