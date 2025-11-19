# GitHub'a Yükleme ve Deployment Rehberi

## 1. GitHub Repository Oluşturma

1. GitHub.com'a gidin ve giriş yapın
2. Sağ üstteki "+" butonuna tıklayın → "New repository"
3. Repository ayarları:
   - Repository name: `competitor-lens`
   - Description: "CompetitorLens v2 - Stablex competitor analysis platform"
   - Private repository seçin (güvenlik için)
   - "Create repository" tıklayın

## 2. Local Repository'yi GitHub'a Bağlama

Terminal'de şu komutları çalıştırın:

```bash
cd /Users/Furkan/Stablex/competitor-lens

# GitHub remote ekle (YOUR_USERNAME'i değiştirin)
git remote add origin https://github.com/YOUR_USERNAME/competitor-lens.git

# Main branch'e push et
git push -u origin main
```

## 3. Environment Variables Ayarlama

GitHub'da repository'ye gidin → Settings → Secrets and variables → Actions:

### Repository Secrets Ekleyin:
- `DATABASE_URL`: PostgreSQL connection string
- `OPENAI_API_KEY`: OpenAI API anahtarı
- `JWT_SECRET`: Güvenlik için rastgele string
- `VPS_HOST`: Deployment server IP
- `VPS_USER`: Server kullanıcı adı
- `VPS_KEY`: SSH private key (deployment için)

## 4. Vercel Deployment (Frontend)

### Vercel'e Bağlama:
1. [vercel.com](https://vercel.com) hesabınıza giriş yapın
2. "New Project" → GitHub'dan `competitor-lens` seçin
3. Framework Preset: Next.js
4. Root Directory: `frontend`
5. Environment Variables:
   ```
   NEXT_PUBLIC_API_URL=https://api.yourdomain.com
   ```
6. Deploy tıklayın

### Custom Domain Ekleme:
1. Vercel Dashboard → Project → Settings → Domains
2. Domain ekleyin (örn: `competitorlens.yourdomain.com`)
3. DNS ayarlarını yapın

## 5. Backend Deployment (VPS)

### VPS Hazırlık:
```bash
# VPS'e bağlanın
ssh user@your-vps-ip

# Gerekli yazılımları kurun
sudo apt update
sudo apt install -y docker.io docker-compose nginx certbot python3-certbot-nginx
sudo systemctl enable docker
sudo usermod -aG docker $USER

# Proje dizini oluşturun
mkdir -p ~/apps/competitor-lens
```

### Deployment Script:
```bash
# Local'de (kendi bilgisayarınızda)
cd /Users/Furkan/Stablex/competitor-lens

# Deploy script'i çalıştırın
./scripts/deploy-to-vps.sh
```

## 6. SSL Sertifikası (HTTPS)

VPS'te:
```bash
# Nginx config'i düzenleyin
sudo nano /etc/nginx/sites-available/competitor-lens

# SSL sertifikası alın
sudo certbot --nginx -d api.yourdomain.com
```

## 7. Monitoring ve Backup

### Otomatik Backup:
```bash
# Cron job ekleyin
crontab -e

# Her gün saat 3'te backup
0 3 * * * /home/user/apps/competitor-lens/scripts/backup-production.sh
```

### Health Check:
- Frontend: `https://competitorlens.yourdomain.com`
- Backend API: `https://api.yourdomain.com/health`
- Monitoring: `https://api.yourdomain.com/metrics`

## 8. GitHub Actions CI/CD

`.github/workflows/deploy.yml` otomatik olarak:
- Main branch'e push edildiğinde
- Backend'i build eder
- VPS'e deploy eder
- Health check yapar

## Önemli Notlar

1. **Güvenlik**:
   - Tüm secret'ları GitHub Secrets'ta saklayın
   - Production'da debug mode kapalı olmalı
   - CORS ayarları sadece frontend domain'ini kabul etmeli

2. **Performance**:
   - CDN kullanın (Cloudflare önerilir)
   - Redis cache aktif olmalı
   - Image'lar optimize edilmeli

3. **Backup**:
   - Günlük database backup
   - Screenshot'lar S3 veya benzeri storage'da
   - Backup'ları test edin

4. **Monitoring**:
   - Uptime monitoring (UptimeRobot)
   - Error tracking (Sentry)
   - Performance monitoring

## Sorun Giderme

### Frontend çalışmıyor:
- Vercel logs kontrol edin
- Environment variables doğru mu?

### Backend çalışmıyor:
- Docker logs: `docker logs competitor-lens-backend`
- Database bağlantısı: `docker exec -it competitor-lens-postgres psql -U postgres`

### Image'lar görünmüyor:
- Nginx static files config
- CORS headers
- File permissions
