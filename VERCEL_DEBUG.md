# 🔍 Vercel Frontend Debug

## Kontrol Edilecekler

### 1. Vercel Environment Variables Kontrolü

**Vercel Dashboard**:
1. https://vercel.com/dashboard → **frontend** projesi
2. **Settings** → **Environment Variables**
3. `NEXT_PUBLIC_API_URL` var mı kontrol edin

**Olması gereken:**
```
Name: NEXT_PUBLIC_API_URL
Value: https://competitor-lens-production.up.railway.app
Environments: ✓ Production
```

### 2. Son Deployment Kontrol

**Vercel Dashboard** → **Deployments**:
- En son deployment'ın **tarihini** kontrol edin
- Environment variable ekledikten SONRA deploy edildi mi?
- Build logs'da `API_BASE_URL` ne yazıyor?

Build logs'da şunu aramalısınız:
```
API_BASE_URL: https://competitor-lens-production.up.railway.app
```

Eğer hala `http://localhost:3001` yazıyorsa:
- Environment variable eklenmemiş VEYA
- Environment variable ekledikten sonra redeploy yapılmamış

### 3. Manuel Redeploy

Eğer environment variable eklediğinizden eminseniz ama çalışmıyorsa:

1. **Vercel Dashboard** → **Deployments**
2. En son deployment'ın **"..."** menüsü
3. **"Redeploy"** → **"Redeploy"** (confirm)
4. Yeni deployment'ın build logs'unu izleyin

Build tamamlandıktan sonra logs'da şunu görmelisiniz:
```
API_BASE_URL: https://competitor-lens-production.up.railway.app
```

---

## 🧪 Test Komutları

### Frontend Build Zamanı API URL Test:

Frontend'in kaynak kodunda ne yazdığını görmek için:

```bash
curl -s https://frontend-jr3or17qj-asimorths-projects.vercel.app/_next/static/chunks/*.js 2>/dev/null | grep -o "http[s]*://[^\"]*3001" | head -1
```

Eğer `localhost:3001` çıkarsa:
→ Environment variable build zamanında kullanılmamış
→ Yeniden deploy edin

Eğer `competitor-lens-production.up.railway.app` çıkarsa:
→ Environment variable doğru
→ Başka bir sorun var

---

## ✅ Doğru Deployment Sırası:

1. ✅ Vercel → Settings → Environment Variables → `NEXT_PUBLIC_API_URL` ekle
2. ✅ **Save** butonuna tıkla
3. ✅ Deployments → En son deployment → **"..."** → **"Redeploy"**
4. ✅ Build logs'da `API_BASE_URL` kontrol et
5. ✅ Deployment tamamlan (2-3 dakika)
6. ✅ Frontend'i aç ve test et

---

## 🔧 Alternatif: CLI ile Deploy

Eğer Vercel Dashboard ile sorun yaşıyorsanız:

```bash
cd /Users/Furkan/Stablex/competitor-lens/frontend

# Environment variable ile deploy
NEXT_PUBLIC_API_URL=https://competitor-lens-production.up.railway.app vercel --prod --yes
```

---

## 🆘 Hala Çalışmıyorsa

### Browser Console Kontrol:

1. Frontend'i açın: https://frontend-jr3or17qj-asimorths-projects.vercel.app
2. F12 → Console
3. Ne yazıyor?

**Beklenen:**
```
API_BASE_URL: https://competitor-lens-production.up.railway.app
```

**Eğer farklı bir şey yazıyorsa:**
- Environment variable build'e dahil olmamış
- Yeniden deploy edin

### Network Tab Kontrol:

1. F12 → Network
2. Sayfayı yenileyin
3. `/api/competitors` isteğine tıklayın
4. Request URL ne?

**Olması gereken:**
```
https://competitor-lens-production.up.railway.app/api/competitors
```

**Eğer farklıysa:**
- Environment variable yanlış
- Frontend kodu güncel değil

---

## 📋 Hızlı Checklist

- [ ] Vercel Settings → Environment Variables → `NEXT_PUBLIC_API_URL` var
- [ ] Environment: **Production** seçili
- [ ] Value: `https://competitor-lens-production.up.railway.app`
- [ ] Environment variable ekledikten SONRA redeploy yapıldı
- [ ] Build logs'da doğru API URL var
- [ ] Browser console'da API_BASE_URL doğru

---

**Vercel Deployments → Build Logs'da `API_BASE_URL` ne yazıyor kontrol edin!**

