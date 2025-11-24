# 🚀 Railway Frontend Deploy - Adım Adım

## Railway Web Dashboard'dan Deploy (5 Dakika)

### 1. Railway Dashboard'a Git
https://railway.app/dashboard

### 2. Mevcut Projeyi Aç
- **"competitor-lens-backend"** projesini aç

### 3. Yeni Service Ekle
- **+ New** butonuna tıkla
- **GitHub Repo** seç
- Aynı repo'yu seç: `Stablex/competitor-lens` (veya doğru repo)

### 4. Frontend için Root Directory Ayarla
Service oluşturulunca:
- **Settings** → **Source**
- **Root Directory:** `/competitor-lens/frontend`
- **Watch Paths:** `/competitor-lens/frontend/**`
- Save

### 5. Environment Variables Ekle
**Settings** → **Variables** sekmesinde:

```
NODE_ENV=production
PORT=3000
```

**ÖNEMLİ:** Backend URL'i ekle:
```
NEXT_PUBLIC_API_URL=https://[BACKEND-URL].railway.app
```

**Backend URL'i bulmak için:**
- Backend service → Settings → Networking
- Public domain'i kopyala (örn: `competitor-lens-production.up.railway.app`)
- `https://` ekleyip `NEXT_PUBLIC_API_URL` olarak kaydet

### 6. Build Settings (Otomatik Detect Eder)
Railway.toml zaten hazır, otomatik kullanacak:
- Build: `npm install && npm run build`
- Start: `npm start`

### 7. Deploy Et
- **Deploy** butonu (sağ üstte)
- Ya da commit/push yaptığında otomatik deploy olur

### 8. Domain Al
Deploy bittikten sonra:
- **Settings** → **Networking**
- **Generate Domain** butonu
- URL'i not et (örn: `competitor-lens-frontend.up.railway.app`)

### 9. Backend CORS Güncelle
Backend'de frontend URL'ini CORS'a ekle:

`backend/src/server.ts` dosyasında:
```typescript
if (origin && (
  origin.includes('.vercel.app') || 
  origin.includes('localhost') ||
  origin.includes('.railway.app') // EKLE
)) {
  res.setHeader('Access-Control-Allow-Origin', origin);
  // ...
}
```

### 10. Test Et
Frontend URL'i aç:
- Ana sayfa yükleniyor mu?
- `/features-simple` çalışıyor mu?
- API calls backend'e gidiyor mu?

## 🎯 Hızlı Kontrol

✅ Railway Dashboard → competitor-lens-backend project
✅ + New → GitHub Repo → frontend için
✅ Root Directory: `/competitor-lens/frontend`
✅ Environment Variables: NODE_ENV, NEXT_PUBLIC_API_URL
✅ Deploy butonu
✅ Generate Domain
✅ Backend CORS'a railway.app ekle

## 🔄 Sonraki Deployment'lar

Her `git push` otomatik deploy olur!

```bash
git add .
git commit -m "update: ..."
git push origin main
# Railway otomatik deploy başlatır
```

## 📱 Ya da Railway CLI (Terminal)

Eğer interaktif mode çalışırsa:

```bash
cd frontend
railway link  # Projeye bağlan
railway up    # Deploy
```

Ama web dashboard daha kolay ve güvenli!

