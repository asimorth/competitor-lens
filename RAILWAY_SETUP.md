# Railway Deployment Rehberi

## 🚀 Railway Dashboard'da Yapılması Gerekenler

### 1. **Environment Variables Ayarlama**

Railway Dashboard'a gidin: https://railway.app/dashboard

**competitor-lens-backend** projesine tıklayın → **Variables** sekmesine gidin

Aşağıdaki environment variables'ları ekleyin:

```bash
NODE_ENV=production
PORT=3001
DATABASE_URL=prisma+postgres://accelerate.prisma-data.net/?api_key=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqd3RfaWQiOjEsInNlY3VyZV9rZXkiOiJza19Pbm1MaF9hY2Y3YXlGcDM0NVIyRVYiLCJhcGlfa2V5IjoiMDFLNllXTjhHUk5LVDZQTUVEN0o2UE5OVjciLCJ0ZW5hbnRfaWQiOiJkYWEwZWQwYmE4NDQxMTVjN2NjMjg2OGMyMjFhN2ZmODc3YWQ2YTFlZWZlM2Q0ZjIxNGQ1OGRiMzA2YzVkYTY0IiwiaW50ZXJuYWxfc2VjcmV0IjoiODFkYWMwODktMWE3My00Nzg5LTkwOGQtZTMzYWY4ZGEzNTZiIn0.eJmtPhzrSMu283EQoAJF2NdvYBmB7mLGfHk1fkxsR6w
JWT_SECRET=your-super-secret-jwt-key-change-this
ALLOWED_ORIGINS=https://your-frontend.vercel.app,https://competitor-lens-frontend.vercel.app
STORAGE_TYPE=local
OPENAI_API_KEY=your-openai-api-key-if-needed
```

### 2. **Servis Ayarları**

**Settings** sekmesine gidin:

- **Service Name**: `competitor-lens`
- **Start Command**: `npm start` (otomatik)
- **Build Command**: `npm run build` (otomatik)
- **Root Directory**: `/` veya `backend` (proje yapısına göre)

### 3. **Domain Ayarları**

**Settings** → **Domains** bölümünde:

- Railway size otomatik bir domain verir: `https://competitor-lens-production-xxxx.up.railway.app`
- Bu URL'i not edin, frontend'de kullanacaksınız

### 4. **Deploy Kontrolü**

**Deployments** sekmesinde:

- Son deployment'ın durumunu kontrol edin
- **Build Logs** ve **Deploy Logs** bölümlerini kontrol edin
- Deployment başarılı olduğunda **"Deployed"** yeşil badge görünmeli

### 5. **Test Etme**

Deployment tamamlandıktan sonra:

```bash
# Health check
curl https://your-railway-url/health

# Beklenen cevap:
# {"status":"ok","timestamp":"...","message":"CompetitorLens Backend API is running!","environment":"production"}
```

## ⚠️ Önemli Notlar

1. **Redis Opsiyonel**: Backend şu an Redis olmadan çalışacak şekilde ayarlandı. Queue özellikleri devre dışı olacak ama temel API çalışacak.

2. **Prisma Database**: Database olarak Prisma Accelerate kullanıyoruz. Veriler Prisma Cloud'da saklanıyor.

3. **Environment Variables**: Yukarıdaki tüm variables'ları Railway Dashboard'dan manuel olarak ekleyin.

## 🎯 Sonraki Adımlar

1. Railway'de environment variables ayarlandıktan sonra
2. Deployment'ı bekleyin (3-5 dakika)
3. Railway URL'ini alın
4. Frontend'i Vercel'e deploy edin
5. Frontend'de `NEXT_PUBLIC_API_URL` olarak Railway URL'ini kullanın

## 📞 Sorun Giderme

### Backend başlamıyor:
- Railway Logs'u kontrol edin
- Environment variables'ları kontrol edin
- DATABASE_URL doğru mu kontrol edin

### Database bağlantı hatası:
- Prisma Accelerate API key'ini kontrol edin
- DATABASE_URL formatını kontrol edin

### 404 hatası:
- Domain ayarlarını kontrol edin
- Deployment tamamlandı mı kontrol edin

