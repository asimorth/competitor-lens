# 🚨 Frontend Sorunu - CORS Hatası

## Sorun Bulundu!

Backend CORS header'larında `access-control-allow-origin` eksik. Frontend'den gelen istekleri reddediyor.

---

## ✅ Çözüm: Railway'de ALLOWED_ORIGINS Ekleyin

### Railway Dashboard'da:

1. **https://railway.app/dashboard**
2. **competitor-lens-backend** projesine tıklayın
3. **competitor-lens** (backend servisi) → **Variables**
4. `ALLOWED_ORIGINS` variable'ını bulun (yoksa ekleyin)
5. Değerini güncelleyin:

```
ALLOWED_ORIGINS=https://frontend-jr3or17qj-asimorths-projects.vercel.app,https://frontend-asimorths-projects.vercel.app
```

6. **Save** - Backend otomatik redeploy olacak (2-3 dakika)

---

## 🧪 Test

Backend redeploy olduktan sonra:

```bash
curl -H "Origin: https://frontend-jr3or17qj-asimorths-projects.vercel.app" \
     -I https://competitor-lens-production.up.railway.app/api/competitors \
     | grep access-control-allow-origin
```

Şu header'ı görmeli:
```
access-control-allow-origin: https://frontend-jr3or17qj-asimorths-projects.vercel.app
```

---

## ✅ Sonuç

`ALLOWED_ORIGINS` ekledikten sonra:

✅ Backend frontend isteklerini kabul edecek
✅ CORS hatası çözülecek
✅ Frontend'de veri görünecek

**Railway'de ALLOWED_ORIGINS ekleyin ve 3 dakika bekleyin!**

