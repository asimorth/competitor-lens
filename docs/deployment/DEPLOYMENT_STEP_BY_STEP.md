# 🚀 ADIM ADIM GERÇEK DEPLOYMENT REHBERİ

## 📋 Deployment Öncesi Kontrol Listesi

- [x] Local development çalışıyor
- [x] Database'de veri var (21 competitor)
- [x] TypeScript build başarılı
- [x] Next.js build başarılı
- [ ] Railway hesabı ve CLI login
- [ ] Vercel hesabı ve CLI login
- [ ] Prisma Console'da proje oluşturulmuş

## 🔧 ADIM 1: Railway Setup

### 1.1 Railway Login
```bash
# Terminal'de çalıştırın
railway login
```
Browser açılacak, GitHub ile login olun.

### 1.2 Yeni Proje Oluştur
```bash
cd /Users/Furkan/Stablex/competitor-lens
railway init
```
Proje adı: `competitor-lens-backend`

### 1.3 PostgreSQL Database Ekle
```bash
railway add
```
"PostgreSQL" seçin.

### 1.4 Database URL'i Al
```bash
railway variables
```
`DATABASE_URL` değerini kopyalayın.

### 1.5 Environment Variables Ayarla
```bash
# Production environment variables
railway variables set NODE_ENV=production
railway variables set PORT=3001
railway variables set JWT_SECRET=$(openssl rand -base64 32)
railway variables set OPENAI_API_KEY=your-openai-key-here
railway variables set ALLOWED_ORIGINS="https://competitor-lens.vercel.app"
railway variables set RATE_LIMIT_PUBLIC=100

# Database URLs
railway variables set DIRECT_DATABASE_URL="<Railway'den aldığınız PostgreSQL URL>"
railway variables set DATABASE_URL="prisma+postgres://accelerate.prisma-data.net/?api_key=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqd3RfaWQiOjEsInNlY3VyZV9rZXkiOiJza19Pbm1MaF9hY2Y3YXlGcDM0NVIyRVYiLCJhcGlfa2V5IjoiMDFLNllYTjhHUk5LVDZQTURUN0o2UE5OVjciLCJ0ZW5hbnRfaWQiOiJkYWEwZWQwYmE4NDQxMTVjN2NjMjg2OGMyMjFhN2ZmODc3YWQ2YTFlZWZlM2Q0ZjIxNGQ1OGRiMzA2YzVkYTY0IiwiaW50ZXJuYWxfc2VjcmV0IjoiODFkYWMwODktMWE3My00Nzg5LTkwOGQtZTMzYWY4ZGEzNTZiIn0.eJmtPhzrSMu283EQoAJF2NdvYBmB7mLGfHk1fkxsR6w"
```

### 1.6 Database Migration
```bash
# Railway database'ine migration çalıştır
cd backend
DATABASE_URL="<Railway PostgreSQL URL>" npx prisma migrate deploy
```

### 1.7 Data Import (Opsiyonel)
```bash
# Local data'yı production'a kopyala
pg_dump -U Furkan competitor_lens > local_backup.sql
# Railway database'ine import et
DATABASE_URL="<Railway PostgreSQL URL>" psql < local_backup.sql
```

### 1.8 Deploy Backend
```bash
cd ..
railway up
```

## 🎨 ADIM 2: Vercel Frontend Setup

### 2.1 Vercel Login
```bash
vercel login
```

### 2.2 Frontend Deploy
```bash
cd frontend

# Railway'den backend URL'i alın
BACKEND_URL=$(railway status --json | jq -r '.url')

# Vercel'e deploy
vercel --prod \
  --env NEXT_PUBLIC_API_URL=$BACKEND_URL/api \
  --build-env NEXT_PUBLIC_API_URL=$BACKEND_URL/api
```

### 2.3 Custom Domain (Opsiyonel)
Vercel dashboard'dan custom domain ekleyin.

## 🔍 ADIM 3: Prisma Console Setup

### 3.1 Prisma Console'a Git
https://console.prisma.io/

### 3.2 Connection String Ekle
1. Sol menüden projenizi seçin
2. "Settings" → "Connection strings"
3. "Direct database connection" ekle:
   - Railway'den aldığınız PostgreSQL URL'i girin

### 3.3 Data Browser
"Data Browser" sekmesinden verilerinizi görüntüleyin.

## ✅ ADIM 4: Doğrulama

### 4.1 Backend Test
```bash
# Health check
curl https://your-backend.up.railway.app/health

# API test
curl https://your-backend.up.railway.app/api/competitors
```

### 4.2 Frontend Test
Browser'da: https://your-app.vercel.app

### 4.3 Prisma Console Test
Data Browser'da verilerinizi kontrol edin.

## 🚨 Sorun Giderme

### Railway Deploy Hatası
```bash
# Logs kontrol
railway logs

# Environment variables kontrol
railway variables
```

### Vercel Deploy Hatası
```bash
# Build logs
vercel logs

# Environment kontrol
vercel env ls
```

### Database Bağlantı Hatası
```bash
# Direct connection test
DATABASE_URL="railway-url" npx prisma db pull
```

## 📝 Notlar

1. **İlk deployment 5-10 dakika sürebilir**
2. **Railway free tier: 500 saat/ay**
3. **Vercel free tier: Unlimited for personal use**
4. **Prisma Accelerate: Free tier available**

---

**BU REHBERİ TAKİP EDİN VE HER ADIMDA ÇIKAN HATALARI BİLDİRİN!**
