# 🚀 Production Deployment Guide - Screenshot Architecture V2.0

## 📋 Yapılan Değişiklikler

### Backend Değişiklikleri
- ✅ `/backend/src/routes/screenshots.ts` - Yeni screenshot API route'ları
- ✅ `/backend/src/controllers/competitorController.ts` - Screenshot stats eklendi
- ✅ `/backend/src/controllers/featureController.ts` - Screenshot stats eklendi
- ✅ `/backend/src/scripts/validateScreenshotData.ts` - Data validation script
- ✅ `/backend/src/server.ts` - Screenshot route'ları entegre edildi
- ✅ `/backend/package.json` - `screenshots:validate` script eklendi

### Frontend Değişiklikleri
- ✅ `/frontend/src/lib/api.ts` - Screenshot API methods eklendi
- ✅ `/frontend/src/lib/screenshot-utils.ts` - Helper utilities (YENİ DOSYA)

### Dokümantasyon
- ✅ `SCREENSHOT_ARCHITECTURE.md` - Detaylı mimari
- ✅ `IMPLEMENTATION_SUMMARY.md` - Implementation özeti
- ✅ `QUICK_START.md` - Hızlı başlangıç

---

## 🔧 Manuel Deployment Adımları

### Option 1: Railway CLI ile Deploy (Önerilen)

#### Backend Deployment

```bash
cd /Users/Furkan/Stablex/competitor-lens/backend

# Railway projesine link (browser'da authentication)
railway link

# Service seç
railway service

# Deploy
railway up

# Logs'u izle
railway logs
```

#### Railway URL'i Al
```bash
railway status --json | grep url
```

veya Railway Dashboard'dan: https://railway.app/dashboard

---

### Option 2: Git Push ile Otomatik Deploy

#### Backend (Railway)

Railway projenizde GitHub integration aktifse:

```bash
cd /Users/Furkan/Stablex/competitor-lens

# Değişiklikleri commit et
git add .
git commit -m "feat: Add screenshot architecture improvements

- Add screenshot API routes (competitor & feature based)
- Enhance controllers with screenshot statistics
- Add frontend API client and utilities
- Add data validation script
- Update documentation"

# Railway'e push
git push origin main
```

Railway otomatik olarak yeni commit'i algılayıp deploy eder.

---

### Option 3: Railway Dashboard'dan Manuel Deploy

1. **Railway Dashboard'a Git**: https://railway.app/dashboard
2. **competitor-lens-backend** projesini seç
3. **Settings** → **Source** → **Trigger Deploy**
4. veya **Deployments** tab'ından **Deploy Now** butonuna tıkla

---

## 🎯 Vercel Frontend Deployment

### Otomatik Deploy (Git Push)

```bash
cd /Users/Furkan/Stablex/competitor-lens

# Frontend değişikliklerini commit et
git add frontend/
git commit -m "feat: Add screenshot utilities and API client improvements"

# Vercel'e push (main branch otomatik deploy olur)
git push origin main
```

### Manuel Deploy

```bash
cd /Users/Furkan/Stablex/competitor-lens/frontend

# Vercel'e login
vercel login

# Production'a deploy
vercel --prod
```

---

## ✅ Post-Deployment Checklist

### 1. Backend Health Check

Railway deployment'tan sonra:

```bash
# Backend URL'inizi alın (Railway dashboard'dan)
BACKEND_URL="https://competitor-lens-backend-production.up.railway.app"

# Health check
curl $BACKEND_URL/health

# Beklenen response:
# {
#   "status": "ok",
#   "message": "CompetitorLens Backend API is running!"
# }
```

### 2. API Endpoint Test

```bash
# Competitors API
curl $BACKEND_URL/api/competitors | jq '.count'

# Features API  
curl $BACKEND_URL/api/features | jq '.count'

# Screenshots API (YENİ!)
curl $BACKEND_URL/api/screenshots | jq '.count'

# Screenshot by Competitor (YENİ!)
curl $BACKEND_URL/api/screenshots/competitor/{COMPETITOR_ID} | jq '.count'

# Screenshot by Feature (YENİ!)
curl $BACKEND_URL/api/screenshots/feature/{FEATURE_ID} | jq '.count'
```

### 3. Frontend Test

Vercel URL'inizi browser'da açın:
- `https://competitor-lens.vercel.app` (veya custom domain)

Test sayfaları:
1. **Competitor Detay**: `/competitors/[id]` 
   - Screenshot'ların feature bazında gruplandığını kontrol edin
   
2. **Feature Detay**: `/features/[id]`
   - Screenshot'ların competitor bazında gruplandığını kontrol edin

3. **Dashboard**: `/dashboard`
   - Screenshot sayılarının doğru gösterildiğini kontrol edin

### 4. Database Validation

Railway'de backend container'a bağlanın:

```bash
railway run npm run screenshots:validate
```

veya railway shell:

```bash
railway shell
cd backend
npm run screenshots:validate
```

---

## 🔍 Troubleshooting

### Railway Deployment Sorunları

#### Problem: "Multiple services found"
```bash
# Servis listesini göster
railway service list

# Belirli bir servis için deploy
railway up --service backend
```

#### Problem: "Authentication failed"
```bash
# Yeniden login
railway logout
railway login
```

#### Problem: Build hatası
```bash
# Railway logs'u kontrol et
railway logs

# Local test
npm run build
```

### Vercel Deployment Sorunları

#### Problem: Build hatası
```bash
# Local test
npm run build

# Vercel build logs
vercel logs
```

#### Problem: Environment variables
Vercel Dashboard → Settings → Environment Variables kontrol edin:
- `NEXT_PUBLIC_API_URL` = Railway backend URL

---

## 📊 Environment Variables

### Railway (Backend)

Gerekli environment variables:

```env
NODE_ENV=production
PORT=3001
DATABASE_URL=prisma+postgres://...
DIRECT_DATABASE_URL=postgresql://...
JWT_SECRET=your-secret-key
ALLOWED_ORIGINS=https://competitor-lens.vercel.app
RATE_LIMIT_PUBLIC=100
OPENAI_API_KEY=sk-... (optional)
```

Railway Dashboard → Settings → Variables'dan ekleyin.

### Vercel (Frontend)

```env
NEXT_PUBLIC_API_URL=https://your-railway-backend.up.railway.app
```

Vercel Dashboard → Settings → Environment Variables'dan ekleyin.

---

## 🎯 Quick Deploy Commands

### Backend (Railway)

```bash
cd backend
railway up
```

### Frontend (Vercel)

```bash
cd frontend
vercel --prod
```

### Her İkisi Birden

```bash
# Backend
cd backend && railway up && cd ..

# Frontend
cd frontend && vercel --prod && cd ..
```

---

## 📝 Deployment Log

Her deployment sonrası kayıt tutun:

```bash
# Log dosyası oluştur
echo "Deployment: $(date)" >> deployments.log
echo "Backend: $(railway status --json | jq -r '.deployments[0].url')" >> deployments.log
echo "Frontend: $(vercel ls --json | jq -r '.[0].url')" >> deployments.log
echo "---" >> deployments.log
```

---

## 🚀 Hızlı Production Deploy (GitHub Actions ile)

`.github/workflows/deploy.yml` oluşturun:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - name: Install Railway CLI
        run: npm install -g @railway/cli
      - name: Deploy to Railway
        run: |
          cd backend
          railway up --detach
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}

  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - name: Deploy to Vercel
        run: |
          cd frontend
          npm install -g vercel
          vercel --prod --token=${{ secrets.VERCEL_TOKEN }}
        env:
          VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}
```

Secrets ekleyin:
- GitHub Repo → Settings → Secrets → Actions
- `RAILWAY_TOKEN` ve `VERCEL_TOKEN` ekleyin

---

## ✨ Production URLs

Deployment sonrası URL'leriniz:

### Backend (Railway)
```
https://competitor-lens-backend-production.up.railway.app
```

### Frontend (Vercel)
```
https://competitor-lens.vercel.app
```

### Custom Domains (Opsiyonel)
- Backend: `api.competitorlens.com`
- Frontend: `competitorlens.com`

---

## 🎉 Deployment Başarılı!

Yeni özellikler artık production'da:
- ✅ Screenshot API (competitor & feature based)
- ✅ Enhanced controller responses
- ✅ Frontend utilities
- ✅ Data validation

### Test Edin:
```bash
# Backend
curl https://your-backend-url.railway.app/api/screenshots

# Frontend
open https://your-frontend.vercel.app/competitors
```

---

**Son Güncelleme**: 5 Kasım 2024
**Versiyon**: 2.0
**Durum**: ✅ Production Ready

