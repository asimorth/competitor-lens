# 🎯 RAILWAY TERMINAL - DETAYLI GÖRSEL REHBER

Railway Dashboard'da terminal bulma ve kullanma rehberi.

---

## 📍 RAILWAY DASHBOARD'DA TERMINAL NEREDE?

### Yöntem 1: Service Detail Sayfasından (EN KOLAY)

1. **Railway Dashboard'a Git**
   ```
   https://railway.app/dashboard
   ```

2. **Project'i Aç**
   - "competitor-lens-backend" project'ine tıkla

3. **Backend Service Kartını Bul**
   - Ekranda 2 kart göreceksin:
     - Postgres (database ikonu)
     - competitor-lens veya backend (kod ikonu)
   - **Backend/competitor-lens kartına** tıkla

4. **Üst Menü Tabs**
   ```
   Overview | Deployments | Settings | Metrics | Variables | ...
   ```

5. **Settings Tab'a Git**
   - "Settings" tab'ına tıkla
   - Sol sidebar'da seçenekler var:
     - General
     - Domains
     - Environment
     - **→ "Shell"** veya **"Console"** (BURASI!)

6. **Shell/Console Aç**
   - "Shell" veya "Console" seçeneğine tıkla
   - Terminal penceresi açılacak

---

## 🚀 YÖNTEMYöntem 2: Deployment'tan (ALTERNATİF)

1. **Backend Service → Deployments Tab**

2. **En Son Başarılı Deployment'ı Bul**
   - Yeşil tik (✓) olan deployment

3. **Deployment'a Tıkla**
   - Detay sayfası açılır

4. **Sağ Tarafta Panel**
   ```
   - Logs
   - Shell / Console  ← BURASI
   ```

5. **"Shell" veya "Open Console" Butonuna Tıkla**

---

## 💻 TERMINAL AÇILDIKTAN SONRA

Terminal açıldığında şu komutları **SIRAYLA** çalıştır:

```bash
# 1. Prisma Client'ı regenerate et
npx prisma generate

# Beklenen çıktı:
# ✔ Generated Prisma Client (6.16.3)

# 2. Database schema'yı uygula (region field ekler)
npx prisma db push

# Beklenen çıktı:
# ✔ Database synchronized successfully
# ✔ Generated Prisma Client

# 3. Bitti! Terminal'i kapat
exit
```

---

## 🔄 TERMINAL KAPANDIKTAN SONRA

1. **Backend Service'i Restart Et**
   ```
   Backend Service → Üstte "Restart" butonu
   ```

2. **30 Saniye Bekle**
   - Service'in başlamasını bekle

3. **Test Et**
   ```
   Browser'da aç:
   https://competitor-lens-production.up.railway.app/health
   
   Görmeli:
   {"status":"ok","timestamp":"..."}
   ```

---

## 📸 GÖRSEL YARDIM

### Railway UI'da Terminal Konumları:

```
┌─────────────────────────────────────────┐
│ Railway Dashboard                       │
├─────────────────────────────────────────┤
│                                         │
│  [Postgres]  [Backend/competitor-lens] │  ← Service kartları
│                     ↓                   │
│              (Backend'e tıkla)          │
│                                         │
├─────────────────────────────────────────┤
│ Overview | Deployments | Settings | .. │  ← Tabs
│                             ↓           │
│                      (Settings'e tıkla) │
│                                         │
├──────────┬──────────────────────────────┤
│ General  │                              │
│ Domains  │  Settings İçeriği            │
│ Env      │                              │
│ Shell ←──┤  (Shell'e tıkla)            │  ← BURASI!
│ Deploy   │                              │
└──────────┴──────────────────────────────┘
```

---

## 🐛 SORUN GİDERME

### "Shell" veya "Console" Seçeneği Yok

**Çözüm 1**: Deployment üzerinden dene
```
Deployments → Latest successful → Shell button
```

**Çözüm 2**: Service Overview'dan
```
Overview sayfasında sağ üstte "..." menü → "Open Shell"
```

**Çözüm 3**: Railway CLI kullan (TTY sorunu olabilir)
```bash
# Mac Terminal'den:
railway link  # Interaktif - project ve service seç
railway run bash  # Shell aç
```

### Terminal Açılıyor Ama Komut Çalışmıyor

**Kontrol Et**:
```bash
# Environment kontrol
echo $DATABASE_URL
# Değer görmeli

# Node version
node --version
# v20.x.x görmeli

# Prisma CLI var mı
npx prisma --version
# Prisma version görmeli
```

### "Command not found: npx"

**Çözüm**:
```bash
# Node path'i bul
which node

# Manuel npx kullan
/usr/local/bin/node /usr/local/bin/npx prisma generate
```

---

## ✅ BAŞARI KRİTERLERİ

Terminal'de komutlar başarılı olduysa:

```bash
✅ npx prisma generate
   → "Generated Prisma Client (6.16.3)"

✅ npx prisma db push
   → "Database synchronized successfully"
   → "Generated Prisma Client"

✅ Service Restart
   → Status: Active

✅ Health Check
   → {"status":"ok"}

✅ API Test
   → {"success":true,"count":21}
```

---

## 🎯 ÖZET: YAPILACAK 3 ADIM

```
1. Railway Dashboard → Backend Service → Settings → Shell
2. Terminal'de: npx prisma generate && npx prisma db push
3. Service Restart → Test
```

**Süre**: 3 dakika  
**Zorluk**: Kolay  
**Sonuç**: Backend çalışacak! 🚀

---

## 📞 HALA TERMINAL BULAMADIYSAN?

Railway Dashboard'ın sağ alt köşesinde **"Help" veya "?"** butonu var.
Tıkla ve "How to open shell?" diye sor - canlı destek yardımcı olur.

Ya da ekran görüntüsü at bana, tam olarak nerede olduğunu göstereyim! 📸

