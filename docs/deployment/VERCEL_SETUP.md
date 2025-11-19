# Vercel Frontend Deployment Rehberi

## ✅ Frontend Deploy Edildi!

Frontend başarıyla Vercel'e deploy edildi:
- **URL**: https://frontend-n5a4obyhp-asimorths-projects.vercel.app

## ⚠️ Önemli: Environment Variable Ekleyin

Şu anda frontend localhost'a bağlanıyor. Railway backend URL'ini eklememiz gerekiyor.

### 1. **Vercel Dashboard'a Gidin**

https://vercel.com/dashboard

### 2. **Projenizi Seçin**

"frontend" projesine tıklayın

### 3. **Settings → Environment Variables**

1. **Settings** sekmesine gidin
2. **Environment Variables** bölümüne gidin
3. Yeni variable ekleyin:

```
Name: NEXT_PUBLIC_API_URL
Value: https://competitor-lens-production.up.railway.app
Environment: Production
```

4. **Save** butonuna tıklayın

### 4. **Yeniden Deploy Edin**

Environment variable ekledikten sonra:

1. **Deployments** sekmesine gidin
2. En son deployment'ın yanındaki **"..."** menüsüne tıklayın
3. **"Redeploy"** seçeneğine tıklayın
4. **"Redeploy"** butonuna tekrar tıklayın

VEYA terminal'den:

```bash
cd /Users/Furkan/Stablex/competitor-lens/frontend
vercel --prod
```

### 5. **Test Edin**

Yeni deployment tamamlandıktan sonra:

https://frontend-n5a4obyhp-asimorths-projects.vercel.app

Frontend artık Railway backend'e bağlanacak!

## 📋 Tüm URL'ler

- **Frontend (Vercel)**: https://frontend-n5a4obyhp-asimorths-projects.vercel.app
- **Backend (Railway)**: https://competitor-lens-production.up.railway.app
- **Backend Health**: https://competitor-lens-production.up.railway.app/health
- **Prisma Console**: https://console.prisma.io/

## 🎯 Sonraki Adımlar

1. Vercel'de `NEXT_PUBLIC_API_URL` environment variable'ını ekleyin
2. Frontend'i yeniden deploy edin
3. Frontend'i test edin
4. Railway backend'de `ALLOWED_ORIGINS` environment variable'ına Vercel URL'ini ekleyin

## 🔧 Railway CORS Güncelleme

Railway Dashboard → competitor-lens-backend → Variables:

```
ALLOWED_ORIGINS=https://frontend-n5a4obyhp-asimorths-projects.vercel.app,https://frontend-asimorths-projects.vercel.app
```

Veya terminal'den:

```bash
railway variables --set ALLOWED_ORIGINS="https://frontend-n5a4obyhp-asimorths-projects.vercel.app,https://frontend-asimorths-projects.vercel.app"
```

## ✅ Deployment Tamamlandı!

Tüm adımlar tamamlandığında:

✓ Database: Prisma Cloud (Accelerate)
✓ Backend: Railway
✓ Frontend: Vercel
✓ Production Ready!

