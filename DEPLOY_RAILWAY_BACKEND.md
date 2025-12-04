# Backend Railway Deployment Guide

Bu dokümanda CompetitorLens backend'ini Railway'e deploy etmek için gereken tüm adımlar detaylı olarak açıklanmıştır.

## ✅ Pre-Deployment Checklist

Deployment öncesi aşağıdaki kontrolleri yapın:

- [ ] DATABASE_URL environment variable hazır (Prisma Accelerate connection string)
- [ ] Frontend Vercel'de deploy edilmiş ve URL'i biliniyor
- [ ] Backend kodu local'de başarıyla build ediliyor
- [ ] Environment variables listesi hazır

## 🔑 Required Environment Variables

Railway Dashboard → Settings → Variables bölümünde aşağıdaki değişkenleri ekleyin:

### Zorunlu Variables

```bash
DATABASE_URL=prisma+postgres://accelerate.prisma-data.net/?api_key=YOUR_API_KEY
NODE_ENV=production
ALLOWED_ORIGINS=https://your-frontend.vercel.app,https://competitor-lens.vercel.app
```

### Opsiyonel Variables

```bash
# JWT Authentication (henüz kullanılmıyor ama hazır)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# S3 Storage (opsiyonel, yoksa local storage kullanılır)
S3_BUCKET=your-bucket-name
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=eu-central-1
CDN_URL=https://your-cdn-url.com

# OpenAI (opsiyonel, AI features için)
OPENAI_API_KEY=sk-...

# Rate Limiting (opsiyonel, varsayılan: 100)
RATE_LIMIT_PUBLIC=100
```

> **Not**: `PORT` değişkenini Railway otomatik olarak set eder, manuel eklemeye gerek yok.

## 🚀 Deployment Steps

### 1. Railway Project Oluştur veya Mevcut Projeyi Aç

Railway Dashboard: https://railway.app/dashboard

- Mevcut `competitor-lens-backend` projesini açın
- Veya yeni proje oluşturun: "New Project" → "Deploy from GitHub repo"

### 2. GitHub Repository Bağla

- Settings → Service → Connect to GitHub
- Repository: `asimorth/competitor-lens`
- Root Directory: `backend` olarak ayarlayın

### 3. Environment Variables Ekle

Settings → Variables bölümünde yukarıdaki environment variables'ları ekleyin.

> **Önemli**: `ALLOWED_ORIGINS` değişkenine mutlaka frontend URL'inizi ekleyin, yoksa CORS hatası alırsınız!

### 4. Build Settings Kontrolü

Railway otomatik olarak `nixpacks.toml` dosyasını kullanır. Kontrol için:

- Settings → Build → Build Command: `npm run build`
- Settings → Deploy → Start Command: `npm start`

### 5. Deploy Başlat

Railway otomatik olarak deploy başlatacaktır. Manuel olarak başlatmak için:

- Deployments → Redeploy

### 6. Domain Ayarları

Settings → Networking → Public Networking:

- Railway otomatik bir domain verir: `https://your-service.up.railway.app`
- Bu URL'i not edin, frontend'de kullanacaksınız
- İsterseniz custom domain ekleyebilirsiniz

## 🔍 Deployment Verification

### Build Logs Kontrolü

Deployments → View Logs → Build Logs:

```
✓ Installing dependencies...
✓ Generating Prisma Client...
✓ Building TypeScript...
✓ Build complete!
```

### Deploy Logs Kontrolü

Deployments → View Logs → Deploy Logs:

```
🚀 CompetitorLens Backend - Railway Startup
📊 Environment Info:
   NODE_ENV: production
   DATABASE_URL: ✅ Set
   └─ Using Prisma Accelerate ✨
✅ All checks passed! Starting server...
🚀 Server running on port 3001
✅ Server ready to accept connections
```

### Health Check Test

Terminal'den:

```bash
curl https://your-railway-url.up.railway.app/health
```

Beklenen yanıt:

```json
{
  "status": "ok",
  "timestamp": "2025-12-04T11:30:00.000Z",
  "message": "CompetitorLens Backend API is running!",
  "environment": "production",
  "database": "connected"
}
```

> **Önemli**: `database: "connected"` görmek zorundasınız. Aksi halde DATABASE_URL'i kontrol edin.

### API Endpoint Test

```bash
# Competitors listesi
curl https://your-railway-url.up.railway.app/api/competitors

# Features listesi
curl https://your-railway-url.up.railway.app/api/features
```

## 🔧 Troubleshooting

### Problem: Build Failed - "Cannot find module 'typescript'"

**Sebep**: nixpacks.toml'da `--omit=dev` kullanılmış olabilir.

**Çözüm**: nixpacks.toml'u kontrol edin:

```toml
[phases.install]
cmds = ["npm ci --legacy-peer-deps"]  # --omit=dev olmamalı!
```

### Problem: "database schema is not empty" hatası

**Sebep**: Migration dosyaları deployment'a dahil edilmiş.

**Çözüm**: 
- `.railwayignore` dosyasında `prisma/migrations/` satırı olmalı
- `prisma/migrations/` klasörü git'te ignore edilmeli
- Railway build logs'da `prisma migrate` komutu çalışmamalı

### Problem: Health check'te "database: disconnected"

**Sebep**: DATABASE_URL yanlış veya Prisma Accelerate erişilemiyor.

**Çözüm**:
1. Railway Variables'da DATABASE_URL'i kontrol edin
2. Prisma Accelerate API key'in geçerli olduğundan emin olun
3. Format: `prisma+postgres://accelerate.prisma-data.net/?api_key=...`

### Problem: CORS Hatası - Frontend API'ye erişemiyor

**Sebep**: ALLOWED_ORIGINS environment variable eksik veya yanlış.

**Çözüm**:
1. Railway Variables'a `ALLOWED_ORIGINS` ekleyin
2. Vercel frontend URL'inizi ekleyin: `https://your-app.vercel.app`
3. Birden fazla origin için virgülle ayırın: `https://app1.vercel.app,https://app2.vercel.app`
4. Deploy'u yeniden başlatın

### Problem: Server başlamıyor - Exit Code 1

**Sebep**: 
- Environment variable eksik
- TypeScript build hatası
- Port çakışması

**Çözüm**:
1. Deploy Logs'u inceleyin
2. Eksik environment variables varsa ekleyin
3. Build logs'da TypeScript hatası varsa kod düzeltin
4. Railway PORT environment variable'ı otomatik set ediyor, manuel eklemeyin

### Problem: 404 Not Found - Tüm API endpoints

**Sebep**: Start command yanlış veya server başlamamış.

**Çözüm**:
1. Deploy Logs'da "Server running on port" mesajını görüyor musunuz?
2. Settings → Deploy → Start Command: `npm start` olmalı
3. `package.json` → `scripts.start`: `node start-railway.js` olmalı

## 📊 Monitoring

### Railway Logs

Real-time logs için:

- Railway Dashboard → Your Service → Logs
- Filter: All, Errors, Deployment

### Health Check Monitoring

Periyodik health check için (opsiyonel):

- UptimeRobot: https://uptimerobot.com/
- Endpoint: `https://your-railway-url.up.railway.app/health`
- Interval: 5 minutes

## 🔄 Production Updates

Kod değişikliklerini production'a göndermek için:

1. **Local'de test edin**:
   ```bash
   cd backend
   npm run build
   npm start
   ```

2. **GitHub'a push edin**:
   ```bash
   git add .
   git commit -m "feat: your changes"
   git push origin main
   ```

3. **Railway otomatik deploy eder**:
   - Railway GitHub'ı dinler
   - Push sonrası otomatik build başlar
   - 3-5 dakika içinde yeni versiyon live olur

4. **Verify deployment**:
   ```bash
   curl https://your-railway-url.up.railway.app/health
   ```

## 🎯 Next Steps

Backend deployment başarılı olduktan sonra:

1. ✅ Railway URL'i Vercel frontend environment variables'a ekleyin
2. ✅ Frontend'den API çağrılarını test edin
3. ✅ Screenshot upload ve display fonksiyonlarını test edin
4. ✅ Production monitoring kurun (opsiyonel)

## 📞 Support

Deployment sırasında sorun yaşarsanız:

1. Railway Logs'u kontrol edin
2. Bu guide'daki Troubleshooting bölümüne bakın
3. Railway Discord: https://discord.gg/railway
4. Railway Docs: https://docs.railway.app/

---

**Last Updated**: 2025-12-04  
**Railway Backend URL**: Will be provided after deployment
