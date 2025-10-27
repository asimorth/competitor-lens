# 🚀 CompetitorLens - Quick Production Deployment

## Hızlı Özet
**Backend**: Railway (https://railway.app)  
**Frontend**: Vercel (https://vercel.com)  
**Database**: Railway PostgreSQL  

**Tahmini Süre**: 15-20 dakika

---

## 🗄️ Part 1: Railway Database & Backend (10 dakika)

### Step 1: Railway Login & Setup
1. https://railway.app adresine git
2. GitHub ile login ol
3. "New Project" tikla
4. "Deploy from GitHub repo" seç
5. **competitor-lens** repository'sini seç

### Step 2: PostgreSQL Database Ekle
1. Project dashboard'da "New" tikla
2. "Database" seç
3. "Add PostgreSQL" tikla
4. Database otomatik oluşturulur

### Step 3: Backend Service Kur
1. Project dashboard'da "New" tikla
2. "GitHub Repo" seç
3. **competitor-lens** repo'sunu seç
4. **Root Directory**: `backend` yaz
5. "Deploy" tikla

### Step 4: Environment Variables (Backend)
Railway dashboard → **backend service** → **Variables** tab:

```bash
# Otomatik set edilir (PostgreSQL service'den):
DATABASE_URL=postgresql://...
DIRECT_DATABASE_URL=postgresql://...

# Manuel ekle:
NODE_ENV=production
PORT=3001
ALLOWED_ORIGINS=https://your-project.vercel.app
```

**Not**: Frontend Vercel URL'ini deploy edince güncelleyeceğiz.

### Step 5: Backend URL Al
Deploy tamamlandıktan sonra:
1. Backend service → **Settings** → **Domains**
2. "Generate Domain" tikla
3. URL'i kopyala (örn: `https://competitorlens-backend.railway.app`)

**Test Et**:
```bash
curl https://your-backend.railway.app/health
```

---

## 🌐 Part 2: Vercel Frontend (5 dakika)

### Step 1: Vercel Login & Import
1. https://vercel.com adresine git
2. GitHub ile login ol
3. "Add New..." → "Project" tikla
4. **competitor-lens** repository'sini seç
5. "Import" tikla

### Step 2: Project Configuration
```
Framework Preset: Next.js
Root Directory: frontend
Build Command: npm run build
Output Directory: .next
Install Command: npm install
```

### Step 3: Environment Variables
**Environment Variables** bölümünde:

```bash
Name: NEXT_PUBLIC_API_URL
Value: https://your-backend.railway.app
Environment: Production
```

**Backend Railway URL'ini buraya yapıştır!**

### Step 4: Deploy
1. "Deploy" butonuna tikla
2. Build izle (2-3 dakika)
3. Deploy tamamlanınca URL al (örn: `https://competitorlens.vercel.app`)

**Test Et**: Frontend URL'i tarayıcıda aç

---

## 🔄 Part 3: CORS Fix & Reconnect (2 dakika)

### Step 1: Railway CORS Update
Railway'e dön → **backend service** → **Variables**:

```bash
ALLOWED_ORIGINS=https://competitorlens.vercel.app
```

(Vercel URL'ini yapıştır)

### Step 2: Redeploy
1. Backend service → **Deployments** tab
2. En son deployment'a tikla
3. "⋮" menu → "Redeploy" tikla

---

## 📊 Part 4: Data Import (3 dakika)

### Option A: Railway CLI (Önerilen)

```bash
# Terminal'de
cd /Users/Furkan/Stablex/competitor-lens/backend

# Railway CLI login
railway login

# Service seç
railway link

# Data import
railway run npm run import:excel
railway run npm run import:screenshots:smart
```

### Option B: Manuel (Railway Dashboard)
1. Backend service → **Settings** → **Service**
2. Connect to service
3. Shell açılır
4. Komutları çalıştır:
```bash
npm run import:excel
npm run import:screenshots:smart
```

---

## ✅ Part 5: Verification (2 dakika)

### Test Checklist

#### Backend API
```bash
# Health check
curl https://your-backend.railway.app/health

# Competitors endpoint
curl https://your-backend.railway.app/api/competitors

# Features endpoint
curl https://your-backend.railway.app/api/features
```

#### Frontend
1. **Desktop**: https://your-project.vercel.app
   - [ ] Dashboard loads
   - [ ] Stats display
   - [ ] Matrix loads
   - [ ] Navigation works

2. **Mobile** (telefonda aç):
   - [ ] Responsive layout
   - [ ] Touch navigation
   - [ ] Images load
   - [ ] Sidebar works

#### Cross-Device
- [ ] iPhone Safari
- [ ] Android Chrome
- [ ] Desktop Chrome
- [ ] Desktop Safari
- [ ] iPad

---

## 🎯 Final URLs

### Production Endpoints
```
Frontend: https://your-project.vercel.app
Backend:  https://your-backend.railway.app
API:      https://your-backend.railway.app/api
Health:   https://your-backend.railway.app/health
```

### Environment Variables Summary

**Railway (Backend)**:
```
DATABASE_URL             (auto from PostgreSQL)
DIRECT_DATABASE_URL      (auto from PostgreSQL)
NODE_ENV                 production
PORT                     3001
ALLOWED_ORIGINS          https://your-project.vercel.app
```

**Vercel (Frontend)**:
```
NEXT_PUBLIC_API_URL      https://your-backend.railway.app
```

---

## 🔧 Troubleshooting

### CORS Error (Frontend can't reach Backend)
**Symptom**: API calls fail in browser console

**Fix**:
1. Railway → backend → Variables
2. Update `ALLOWED_ORIGINS` with correct Vercel URL
3. Include `https://`
4. Redeploy backend

### Database Connection Error
**Symptom**: Backend health returns error

**Fix**:
1. Railway → Ensure PostgreSQL service exists
2. Check `DATABASE_URL` in backend variables
3. Verify it starts with `postgresql://`

### Build Failures

**Backend**:
```bash
# Test locally first
cd backend
npm run build
```

**Frontend**:
```bash
# Test locally first
cd frontend
npm run build
```

### Screenshots Not Loading
**Symptom**: Images return 404

**Options**:
1. **Reupload**: Railway file system is ephemeral
2. **Use S3**: Recommended for production
3. **Railway Volumes**: Persistent storage (paid)

---

## 🎨 Custom Domains (Opsiyonel)

### Frontend Domain (Vercel)
1. Vercel → Settings → Domains
2. Add: `app.yourdomain.com`
3. Configure DNS:
   ```
   CNAME app.yourdomain.com → cname.vercel-dns.com
   ```

### Backend Domain (Railway)
1. Railway → Settings → Domains
2. Add: `api.yourdomain.com`
3. Configure DNS:
   ```
   CNAME api.yourdomain.com → your-project.railway.app
   ```

---

## 📱 Mobile Testing

### iOS (Safari)
1. iPhone'da Safari aç
2. Frontend URL'e git
3. "Add to Home Screen" (PWA like)
4. Test all features

### Android (Chrome)
1. Chrome aç
2. Frontend URL'e git
3. Test responsive layout
4. Test touch interactions

---

## 🔄 Continuous Deployment

### Automatic Deploys
Both Railway and Vercel otomatik deploy eder:
- GitHub'a push → Otomatik build ve deploy
- Main branch → Production
- Other branches → Preview deployments

### Manual Redeploy
**Railway**: Dashboard → Deployments → Redeploy  
**Vercel**: Dashboard → Deployments → Redeploy

---

## 📊 Monitoring

### Railway
- **Logs**: Real-time application logs
- **Metrics**: CPU, Memory, Network
- **Deployments**: History ve rollback

### Vercel
- **Analytics**: Page views, performance
- **Logs**: Function logs
- **Speed Insights**: Performance metrics

---

## 💾 Important Notes

### File Persistence
Railway uses **ephemeral file system**:
- Screenshots upload'ları geçici
- Restart'ta silinir
- **Solution**: AWS S3 kullan

### Database Backups
Railway PostgreSQL:
- Otomatik backup yok (free tier)
- Manuel backup: `railway run pg_dump > backup.sql`
- **Solution**: Paid plan veya scheduled backups

---

## 🎉 Success!

Tüm adımlar tamamlandıysa:

✅ Backend Railway'de çalışıyor  
✅ Frontend Vercel'de çalışıyor  
✅ Database bağlantısı OK  
✅ CORS configured  
✅ Data imported  
✅ Cross-device accessible  

**CompetitorLens artık production'da ve TÜM CİHAZLARDAN erişilebilir! 🚀📱💻**

---

## 📞 Quick Commands

```bash
# Railway logs
railway logs -s backend

# Vercel logs
vercel logs

# Deploy backend
cd backend && railway up -s backend

# Deploy frontend
cd frontend && vercel --prod

# Database backup
railway run pg_dump > backup_$(date +%Y%m%d).sql
```

---

**⏱️ Total Time**: ~20 dakika  
**💰 Cost**: $0 (Free tiers)  
**🌍 Accessibility**: Global  

