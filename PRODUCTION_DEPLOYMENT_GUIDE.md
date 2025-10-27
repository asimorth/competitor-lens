# 🚀 CompetitorLens Production Deployment Guide

## Overview
Bu rehber CompetitorLens'i production ortamına deploy etmek için gerekli tüm adımları içerir.

**Stack**:
- **Database**: Railway PostgreSQL
- **Backend**: Railway (Node.js)
- **Frontend**: Vercel (Next.js)

---

## 📋 Pre-Deployment Checklist

- [ ] Railway hesabı oluşturuldu
- [ ] Vercel hesabı oluşturuldu
- [ ] GitHub repository hazır
- [ ] Local build'ler başarılı
- [ ] Environment variables hazır

---

## 🗄️ Step 1: Railway Database Setup

### 1.1 Database Oluştur

```bash
# Railway CLI install
npm i -g @railway/cli

# Login
railway login

# Yeni project oluştur
railway init

# PostgreSQL database ekle
railway add

# "PostgreSQL" seç ve oluştur
```

### 1.2 Database URL Al

```bash
# Database bilgilerini göster
railway variables

# DATABASE_URL'i kopyala
# Örnek: postgresql://postgres:PASSWORD@HOST:PORT/railway
```

### 1.3 Local'de Test Et

```bash
cd backend

# .env dosyasına Railway DATABASE_URL ekle
echo 'DATABASE_URL="postgresql://..."' > .env

# Schema push
npx prisma db push

# Data import
npm run import:excel
npm run import:screenshots:smart
```

---

## 🔧 Step 2: Backend Railway Deployment

### 2.1 Backend Hazırlık

```bash
cd backend

# railway.toml zaten oluşturuldu
# Kontrol et:
cat railway.toml
```

### 2.2 Environment Variables Set

Railway Dashboard'da (railway.app):
1. **Project** seç
2. **Variables** tab'ına git
3. Şu variable'ları ekle:

```
DATABASE_URL          (otomatik set edilir)
DIRECT_DATABASE_URL   (DATABASE_URL ile aynı)
NODE_ENV              production
PORT                  3001
OPENAI_API_KEY        (opsiyonel)
ALLOWED_ORIGINS       https://your-frontend.vercel.app
```

### 2.3 Deploy

**Option A: Railway CLI**
```bash
cd backend
railway up
```

**Option B: GitHub Integration**
```bash
# GitHub'a push
git add .
git commit -m "Production deployment"
git push origin main

# Railway Dashboard'da:
# 1. "Deploy from GitHub" seç
# 2. Repository connect et
# 3. backend/ dizinini seç
# 4. Deploy başlasın
```

### 2.4 Backend URL Al

Deploy tamamlandıktan sonra:
```
Backend URL: https://your-project.railway.app
Health Check: https://your-project.railway.app/health
```

---

## 🌐 Step 3: Frontend Vercel Deployment

### 3.1 Vercel Hazırlık

```bash
cd frontend

# Vercel CLI install (opsiyonel)
npm i -g vercel

# Login
vercel login
```

### 3.2 Environment Variables

Vercel Dashboard'da (vercel.com):
1. **Project Settings** → **Environment Variables**
2. Ekle:

```
NEXT_PUBLIC_API_URL = https://your-backend.railway.app
```

### 3.3 Deploy

**Option A: Vercel CLI**
```bash
cd frontend
vercel --prod
```

**Option B: GitHub Integration** (Önerilen)
```bash
# Vercel Dashboard:
# 1. "Import Project" tikla
# 2. GitHub repository seç
# 3. Root Directory: "frontend"
# 4. Framework Preset: "Next.js"
# 5. Environment Variables ekle
# 6. Deploy
```

### 3.4 Frontend URL

Deploy sonrası:
```
Frontend URL: https://your-project.vercel.app
```

---

## 🔄 Step 4: CORS ve API Configuration

### 4.1 Backend CORS Update

Railway'de `ALLOWED_ORIGINS` variable'ını güncelle:
```
ALLOWED_ORIGINS=https://your-project.vercel.app,https://www.your-domain.com
```

### 4.2 Frontend API URL Update

Vercel'de `NEXT_PUBLIC_API_URL` doğru olduğundan emin ol:
```
NEXT_PUBLIC_API_URL=https://your-backend.railway.app
```

### 4.3 Redeploy

Değişiklikler için:
```bash
# Backend redeploy (Railway)
railway up

# Frontend redeploy (Vercel)
vercel --prod
```

---

## 📊 Step 5: Database Migration & Import

### 5.1 Production Database Setup

Railway database'e bağlan:
```bash
# Local'den production'a bağlan
export DATABASE_URL="postgresql://..."

cd backend

# Schema deploy
npx prisma migrate deploy

# Data import
npm run import:excel
npm run import:screenshots:smart
```

### 5.2 Verify Data

```bash
# API test
curl https://your-backend.railway.app/api/competitors
curl https://your-backend.railway.app/api/features
```

---

## ✅ Step 6: Verification & Testing

### 6.1 Health Checks

```bash
# Backend health
curl https://your-backend.railway.app/health

# Expected:
# {"status":"ok","message":"CompetitorLens Backend API is running!"}
```

### 6.2 Frontend Test

```
1. https://your-project.vercel.app açın
2. Dashboard yüklenmeli
3. Stats görünmeli
4. Matrix data çalışmalı
```

### 6.3 Cross-Device Test

- **Desktop**: Chrome, Safari, Firefox
- **Mobile**: iPhone, Android
- **Tablet**: iPad

Test edilecekler:
- [ ] Dashboard loads
- [ ] API data displays
- [ ] Screenshots load
- [ ] Mobile responsive
- [ ] Navigation works

---

## 🔐 Step 7: Security & Performance

### 7.1 Environment Variables Check

Railway ve Vercel'de tüm secrets set edilmeli:
- [ ] DATABASE_URL (Railway)
- [ ] NEXT_PUBLIC_API_URL (Vercel)
- [ ] ALLOWED_ORIGINS (Railway)
- [ ] NODE_ENV=production (her ikisi)

### 7.2 HTTPS Verify

```bash
# SSL check
curl -I https://your-backend.railway.app
curl -I https://your-project.vercel.app
```

### 7.3 Performance Test

```bash
# Backend response time
curl -w "@-" -o /dev/null -s https://your-backend.railway.app/api/competitors << 'EOF'
time_total: %{time_total}
EOF
```

---

## 🚨 Troubleshooting

### Database Connection Issues

```bash
# Railway database logs
railway logs

# Test connection
railway run npx prisma db push
```

### CORS Errors

Frontend'den backend'e erişemiyorsa:

1. Railway'de `ALLOWED_ORIGINS` kontrol et
2. Vercel URL'ini ekle (https dahil)
3. Backend redeploy

### Build Failures

```bash
# Backend build test (local)
cd backend
npm run build

# Frontend build test (local)
cd frontend
npm run build
```

### Screenshot Upload Issues

Railway'de dosya upload limit'i var. Büyük dosyalar için:
1. AWS S3 kullan
2. Railway volume mount (Enterprise)

---

## 📱 Custom Domain (Opsiyonel)

### Frontend Custom Domain (Vercel)

1. Vercel Dashboard → **Settings** → **Domains**
2. Domain ekle (örn: app.yourdomain.com)
3. DNS records ekle:
   ```
   Type: CNAME
   Name: app
   Value: cname.vercel-dns.com
   ```

### Backend Custom Domain (Railway)

1. Railway Dashboard → **Settings** → **Domains**
2. Custom domain ekle (örn: api.yourdomain.com)
3. DNS records:
   ```
   Type: CNAME
   Name: api
   Value: your-project.railway.app
   ```

---

## 🔄 CI/CD Pipeline

### GitHub Actions (Opsiyonel)

`.github/workflows/deploy.yml`:
```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy Backend
        run: |
          npm i -g @railway/cli
          railway up --service backend

  frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy Frontend
        run: |
          npm i -g vercel
          vercel --prod --token=${{ secrets.VERCEL_TOKEN }}
```

---

## 📊 Monitoring

### Railway Monitoring

Railway Dashboard'da:
- **Metrics**: CPU, Memory, Network
- **Logs**: Real-time application logs
- **Deployments**: History ve rollback

### Vercel Analytics

Vercel Dashboard'da:
- **Analytics**: Page views, load times
- **Logs**: Function logs
- **Insights**: Performance metrics

---

## 💾 Backup Strategy

### Database Backup (Railway)

```bash
# Manual backup
railway run pg_dump > backup_$(date +%Y%m%d).sql

# Automated backup (Railway Plugin)
railway add
# "PostgreSQL Backup" seç
```

### Screenshot Backup

```bash
# Local backup
scp -r your-server:/path/to/uploads ./backups/

# S3 sync (recommended)
aws s3 sync backend/uploads/ s3://your-bucket/uploads/
```

---

## 🎉 Deployment Complete!

### Production URLs

```
Frontend: https://your-project.vercel.app
Backend:  https://your-backend.railway.app
Health:   https://your-backend.railway.app/health
```

### Quick Commands

```bash
# Railway logs
railway logs

# Vercel logs
vercel logs

# Redeploy backend
railway up

# Redeploy frontend
vercel --prod
```

---

## 📝 Post-Deployment Tasks

- [ ] Test all features
- [ ] Verify mobile responsiveness
- [ ] Check performance
- [ ] Set up monitoring alerts
- [ ] Configure backups
- [ ] Update documentation
- [ ] Share URLs with team

---

**🚀 Production deployment tamamlandı! Tüm cihazlardan erişilebilir.**

