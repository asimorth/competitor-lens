# Railway Database Setup Guide

## 1. Terminal'de Railway Login
```bash
cd /Users/Furkan/Stablex/competitor-lens
railway login
railway link
```

## 2. Database Migration
```bash
# Railway shell'e bağlan
railway shell

# Migration'ları çalıştır
cd backend
npx prisma migrate deploy
```

## 3. Data Import Scripts

### Option A: Railway Shell İçinde
```bash
railway shell
cd backend

# Import Excel data
npm run import:excel

# Import screenshots (864 adet)
npm run import:screenshots:smart
```

### Option B: Local'den Railway Database'e Bağlanma
```bash
# Railway'den DATABASE_URL'i al ve local'de kullan
export DATABASE_URL="postgresql://postgres:password@host.railway.internal:5432/railway"

cd backend
npx prisma migrate deploy
npm run import:excel
npm run import:screenshots:smart
```

## 4. Doğrulama

Railway shell veya local'de:
```bash
# Database'deki kayıt sayılarını kontrol et
npx prisma studio
```

Veya SQL ile:
```sql
SELECT COUNT(*) FROM "competitors"; -- 21 olmalı
SELECT COUNT(*) FROM "features"; -- 64 olmalı  
SELECT COUNT(*) FROM "competitor_feature_screenshots"; -- 864 olmalı
```

## 5. Frontend Environment Update

Vercel'de environment variable güncelle:
```
NEXT_PUBLIC_API_URL=https://your-app.up.railway.app
```

## Önemli Notlar

1. **Screenshot Dosyaları**: 
   - Railway'de `/app/uploads/screenshots` dizininde olmalı
   - Dockerfile bu dosyaları kopyalıyor

2. **Database Bağlantısı**:
   - Internal URL: `postgresql://postgres:password@postgres.railway.internal:5432/railway`
   - External URL: Railway dashboard'dan alın

3. **Environment Variables**:
   - DATABASE_URL ✓
   - OPENAI_API_KEY ✓
   - NODE_ENV=production ✓
   - JWT_SECRET ✓
