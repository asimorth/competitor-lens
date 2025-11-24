# 🔧 HOTFIX: Frontend-Backend Connection

## 🐛 Problem
Frontend production'da deploy oldu ama data göstermiyordu (boş geliyordu).

## 🔍 Root Cause
`frontend/src/lib/config.ts` dosyasındaki `getApiUrl()` fonksiyonu:
- ❌ Server-side rendering (SSR) sırasında `window` objesi undefined
- ❌ Bu yüzden SSR sırasında `localhost:3001` kullanıyordu
- ❌ Production'da backend'e bağlanamıyordu

## ✅ Çözüm

### Değişiklik: `frontend/src/lib/config.ts`

**Önce:**
```typescript
export const getApiUrl = (): string => {
  // window kontrolü - SSR'da çalışmıyor!
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
    return 'https://competitor-lens-production.up.railway.app';
  }
  
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  
  return 'http://localhost:3001';
};
```

**Sonra (Düzeltilmiş):**
```typescript
export const getApiUrl = (): string => {
  // 1. Environment variable (en yüksek öncelik)
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  
  // 2. Client-side: Vercel domain kontrolü
  if (typeof window !== 'undefined') {
    if (window.location.hostname.includes('vercel.app') || 
        window.location.hostname === 'competitor-lens-prod.vercel.app') {
      return 'https://competitor-lens-production.up.railway.app';
    }
  }
  
  // 3. Server-side: NODE_ENV kontrolü (SSR için kritik!)
  if (process.env.NODE_ENV === 'production') {
    return 'https://competitor-lens-production.up.railway.app';
  }
  
  // 4. Local development
  return 'http://localhost:3002';
};
```

## 🎯 Düzeltilen Sorunlar

1. ✅ **SSR Desteği:** `NODE_ENV === 'production'` kontrolü eklendi
2. ✅ **Env Variable Önceliği:** Environment variables en üstte kontrol ediliyor
3. ✅ **Vercel Domain Detection:** Domain kontrolü geliştirildi
4. ✅ **Local Port:** localhost:3002 (backend ile eşleşiyor)

## 📦 Deployment

```bash
# Commit
git add frontend/src/lib/config.ts
git commit -m "fix: Frontend-backend connection - production API URL config"

# Deploy
git push origin main
```

**Commit Hash:** `60be363`  
**Deployment:** Vercel auto-deploy (2-3 dakika)

## 🧪 Test Sonrası

Deployment tamamlandığında test edin:

### 1. Matrix Page
```
https://competitor-lens-prod.vercel.app/matrix
```
- ✅ Data yükleniyor mu?
- ✅ Competitors listesi görünüyor mu?
- ✅ Features listesi görünüyor mu?

### 2. Competitors Page
```
https://competitor-lens-prod.vercel.app/competitors
```
- ✅ Borsalar listelenmiş mi?
- ✅ Screenshot sayıları doğru mu?

### 3. Browser Console
F12 → Console → API çağrıları kontrol et:
```
API_BASE_URL: https://competitor-lens-production.up.railway.app
```

## 🔄 Deploy Status

- **Backend:** ✅ Çalışıyor (değişiklik yok)
- **Frontend:** 🔄 Deploying... (ETA: 2-3 dakika)
- **Database:** ✅ Çalışıyor (değişiklik yok)

## ⏱️ Timeline

- **15:30** - İlk deployment (Smart Sync v2.0)
- **15:45** - Sorun tespit edildi (data görünmüyor)
- **15:48** - Root cause bulundu (SSR config hatası)
- **15:50** - Fix deployed (config.ts düzeltildi)
- **15:53** - Vercel auto-deployment tamamlanıyor...

## ✅ Beklenen Sonuç

Frontend artık:
- ✅ Server-side rendering sırasında doğru API URL kullanacak
- ✅ Client-side'da da doğru API URL kullanacak
- ✅ Tüm data production'dan gelecek
- ✅ Matrix, competitors, features hepsi çalışacak

---

**Status:** 🔄 Fix deployed, testing in progress...  
**ETA:** 2-3 dakika sonra fully operational

