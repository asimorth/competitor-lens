# Railway Frontend Deploy Guide

## 🚀 Frontend'i Railway'e Deploy Etme

### Adım 1: Railway CLI Kurulumu

```bash
# Railway CLI kur
npm install -g @railway/cli

# Login
railway login
```

### Adım 2: Frontend için Yeni Railway Service Oluştur

Railway web dashboard'unda:

1. **Mevcut projeyi aç** (Backend'in olduğu proje)
2. **+ New Service** → **GitHub Repo**
3. Aynı repo'yu seç ama **Root Directory: `/competitor-lens/frontend`**
4. Service ismini ver: `competitor-lens-frontend`

### Adım 3: Environment Variables (Railway Dashboard)

Frontend service settings'de ekle:

```env
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://your-backend-railway-url.railway.app
PORT=3000
```

**Backend URL'i bul:**
- Backend service → Settings → Domains
- Public domain'i kopyala
- `NEXT_PUBLIC_API_URL` olarak ekle

### Adım 4: Build & Deploy Settings

Railway otomatik detect eder ama doğrulamak için:

**Build Command:**
```bash
npm install && npm run build
```

**Start Command:**
```bash
npm start
```

**Watch Paths:** (Sadece frontend değişikliklerinde deploy)
```
/competitor-lens/frontend/**
```

### Adım 5: Deploy

Railway otomatik deploy başlatır. Ya da CLI ile:

```bash
cd frontend
railway up
```

### Adım 6: Custom Domain (Opsiyonel)

Railway Dashboard → Frontend Service → Settings → Domains
- Generate Domain butonu
- Custom domain ekleyebilirsin

## 🔧 Railway.toml (Zaten oluşturdum)

`frontend/railway.toml` dosyası hazır:

```toml
[build]
builder = "nixpacks"
buildCommand = "npm install && npm run build"

[deploy]
startCommand = "npm start"
restartPolicyType = "on-failure"
restartPolicyMaxRetries = 3

[healthcheck]
path = "/"
timeout = 100
interval = 60

[env]
NODE_ENV = "production"
```

## 📝 Environment Variables Listesi

Railway Dashboard'da eklenecekler:

| Variable | Value | Açıklama |
|----------|-------|----------|
| `NODE_ENV` | `production` | Production mode |
| `NEXT_PUBLIC_API_URL` | `https://backend-url.railway.app` | Backend API URL |
| `PORT` | `3000` | Frontend port (Railway otomatik set eder) |

## ✅ Deploy Sonrası Test

1. Railway URL'i aç
2. Feature Gallery sayfasını test et (`/features-simple`)
3. Backend connection test et (API calls)
4. Mobile responsive test et

## 🎯 Avantajları

- ✅ Unlimited deployments (Vercel limiti yok)
- ✅ Backend ile aynı yerde (network hızı)
- ✅ Otomatik SSL
- ✅ Environment variables kolay yönetim
- ✅ Free tier generous

## 🔄 Sonraki Deployment'lar

Her commit/push otomatik deploy olur. Veya manuel:

```bash
cd frontend
railway up
```

## 🐛 Troubleshooting

**Build fails:**
- Railway logs kontrol et
- `npm install` başarılı mı?
- `next build` çalışıyor mu?

**API calls fail:**
- `NEXT_PUBLIC_API_URL` doğru set edilmiş mi?
- Backend Railway service çalışıyor mu?
- CORS ayarları backend'de doğru mu?

**Port issues:**
- Railway otomatik PORT verir
- `next start` PORT'u kullanır

