# 🔧 PostgreSQL Service Restart

## Railway Dashboard'da:

### Adım 1: PostgreSQL Service'i Seç
- Sol tarafta **"Postgres"** service'ini tıklayın
- Veya tam adı: `postgres-production-04e7`

### Adım 2: Restart
**İki yol var:**

#### Yol A: Redeploy
- Sağ üstte **"..."** (3 nokta) menüsü
- **"Redeploy"** seçeneğine tıklayın

#### Yol B: Restart
- Service ayarlarında **"Restart"** butonu
- Veya deployments tab'ında restart option

### Adım 3: Bekle
- 1-2 dakika içinde **Active** olacak
- Status: Failed → Deploying → Active

---

## ✅ PostgreSQL Active Olduğunda

Backend otomatik bağlanacak ve çalışacak!

**Test:**
```
https://competitor-lens-production.up.railway.app/health
```

---

**PostgreSQL service'i restart edin, backend otomatik çalışacak!** 🚀

