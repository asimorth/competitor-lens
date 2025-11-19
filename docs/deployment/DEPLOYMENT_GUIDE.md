# CompetitorLens Production Deployment Guide

## 📋 Genel Bakış

Bu doküman, CompetitorLens platformunun production ortamına deployment sürecini detaylı olarak açıklar.

## 🔧 Gereksinimler

### Minimum Sistem Gereksinimleri
- **CPU**: 4 vCPU
- **RAM**: 8 GB
- **Disk**: 50 GB SSD
- **OS**: Ubuntu 20.04+ veya Docker destekleyen herhangi bir Linux dağıtımı

### Yazılım Gereksinimleri
- Docker 20.10+
- Docker Compose 2.0+
- Git
- SSL Sertifikası (Let's Encrypt veya diğer)
- Domain name

## 🚀 Hızlı Başlangıç

```bash
# 1. Kodu clone et
git clone https://github.com/stablex/competitor-lens.git
cd competitor-lens

# 2. Production environment dosyasını oluştur
cp env.production.template .env.production
# .env.production dosyasını düzenle

# 3. Migration script'ini çalıştır
./scripts/migrate-to-production.sh
```

## 📝 Detaylı Kurulum Adımları

### 1. Sunucu Hazırlığı

```bash
# Sistem güncellemeleri
sudo apt update && sudo apt upgrade -y

# Docker kurulumu
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Docker Compose kurulumu
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Kullanıcıyı docker grubuna ekle
sudo usermod -aG docker $USER
```

### 2. Environment Variables Yapılandırması

`.env.production` dosyasını oluşturun ve aşağıdaki değerleri doldurun:

```env
# Database
DB_USER=competitorlens_user
DB_PASSWORD=<güçlü_parola>

# Redis
REDIS_PASSWORD=<güçlü_redis_parolası>

# Security
JWT_SECRET=<64_karakterlik_random_string>

# API Keys
OPENAI_API_KEY=<openai_api_key>

# URLs
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Storage
STORAGE_TYPE=local  # veya 's3'
```

### 3. SSL Sertifikası Kurulumu

#### Option A: Let's Encrypt (Önerilen)

```bash
# Certbot kurulumu
sudo apt install certbot python3-certbot-nginx -y

# SSL sertifikası al
sudo certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com

# Sertifikaları kopyala
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem ./nginx/ssl/cert.pem
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem ./nginx/ssl/key.pem
sudo chown $USER:$USER ./nginx/ssl/*
```

#### Option B: Kendi Sertifikanız

```bash
# SSL dosyalarını yerleştir
mkdir -p nginx/ssl
cp your-cert.pem nginx/ssl/cert.pem
cp your-key.pem nginx/ssl/key.pem
```

### 4. Nginx Yapılandırması

`nginx/nginx.prod.conf` dosyasında domain adınızı güncelleyin:

```nginx
server_name yourdomain.com www.yourdomain.com;
```

### 5. Data Migration

#### Excel Verisi
Matrix verisi otomatik olarak import edilecektir. Excel dosyanızın şu konumda olduğundan emin olun:
```
backend/Matrix/feature_matrix_FINAL_v3.xlsx
```

#### Screenshot'lar
Tüm screenshot'lar şu dizinde olmalı:
```
backend/uploads/screenshots/
```

Dizin yapısı:
```
uploads/
└── screenshots/
    ├── Binance Global/
    ├── Binance TR/
    ├── BTC Turk/
    ├── Coinbase/
    ├── Garanti Kripto/
    ├── Kraken/
    └── OKX TR/
```

### 6. Production Deployment

```bash
# Build ve deploy
docker-compose -f docker-compose.prod.yml up -d --build

# Logları kontrol et
docker-compose -f docker-compose.prod.yml logs -f

# Servislerin durumunu kontrol et
docker-compose -f docker-compose.prod.yml ps
```

## 🔍 Health Check ve Monitoring

### Health Endpoints

- Frontend: `https://yourdomain.com/`
- Backend: `https://yourdomain.com/api/health`
- Nginx: `https://yourdomain.com/health`

### Log Dosyaları

```bash
# Tüm loglar
docker-compose -f docker-compose.prod.yml logs

# Belirli servis logları
docker-compose -f docker-compose.prod.yml logs backend
docker-compose -f docker-compose.prod.yml logs frontend
docker-compose -f docker-compose.prod.yml logs nginx
```

### Monitoring Komutları

```bash
# Container kaynak kullanımı
docker stats

# Disk kullanımı
docker system df

# PostgreSQL bağlantı kontrolü
docker-compose -f docker-compose.prod.yml exec postgres pg_isready

# Redis bağlantı kontrolü
docker-compose -f docker-compose.prod.yml exec redis redis-cli -a $REDIS_PASSWORD ping
```

## 🔐 Güvenlik

### Firewall Ayarları

```bash
# UFW ile firewall ayarları
sudo ufw allow 22/tcp  # SSH
sudo ufw allow 80/tcp  # HTTP
sudo ufw allow 443/tcp # HTTPS
sudo ufw enable
```

### Güvenlik Headers
Nginx yapılandırmasında güvenlik header'ları otomatik olarak eklenmiştir:
- X-Frame-Options
- X-Content-Type-Options
- X-XSS-Protection
- Strict-Transport-Security

### Rate Limiting
API endpoint'leri için rate limiting aktiftir:
- API: 10 request/second
- Uploads: 100 request/minute

## 🔄 Backup ve Recovery

### Otomatik Backup Script

`scripts/backup-production.sh`:

```bash
#!/bin/bash
BACKUP_DIR="/backups/competitorlens"
DATE=$(date +%Y%m%d_%H%M%S)

# PostgreSQL backup
docker-compose -f docker-compose.prod.yml exec -T postgres pg_dump -U $DB_USER competitor_lens > $BACKUP_DIR/db_$DATE.sql

# Uploads backup
tar -czf $BACKUP_DIR/uploads_$DATE.tar.gz backend/uploads/

# Redis backup
docker-compose -f docker-compose.prod.yml exec -T redis redis-cli -a $REDIS_PASSWORD BGSAVE

# Eski backup'ları temizle (30 günden eski)
find $BACKUP_DIR -type f -mtime +30 -delete
```

### Cron Job Kurulumu

```bash
# Crontab düzenle
crontab -e

# Her gün saat 02:00'de backup al
0 2 * * * /path/to/competitor-lens/scripts/backup-production.sh
```

## 🔧 Maintenance

### Update Prosedürü

```bash
# 1. Backup al
./scripts/backup-production.sh

# 2. Kodu güncelle
git pull origin main

# 3. Servisleri güncelle
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d

# 4. Database migration (gerekirse)
docker-compose -f docker-compose.prod.yml run --rm backend npx prisma migrate deploy
```

### Servis Yeniden Başlatma

```bash
# Tüm servisleri yeniden başlat
docker-compose -f docker-compose.prod.yml restart

# Belirli servisi yeniden başlat
docker-compose -f docker-compose.prod.yml restart backend
```

### Cache Temizleme

```bash
# Redis cache temizle
docker-compose -f docker-compose.prod.yml exec redis redis-cli -a $REDIS_PASSWORD FLUSHALL

# Nginx cache temizle (varsa)
docker-compose -f docker-compose.prod.yml exec nginx rm -rf /var/cache/nginx/*
```

## 🚨 Troubleshooting

### Yaygın Sorunlar

#### 1. Backend başlamıyor
```bash
# Logları kontrol et
docker-compose -f docker-compose.prod.yml logs backend

# Database bağlantısını kontrol et
docker-compose -f docker-compose.prod.yml exec backend npx prisma db push
```

#### 2. Frontend 404 hatası
```bash
# Build loglarını kontrol et
docker-compose -f docker-compose.prod.yml logs frontend

# Environment variable kontrolü
docker-compose -f docker-compose.prod.yml exec frontend env | grep NEXT_PUBLIC
```

#### 3. Upload'lar görünmüyor
```bash
# Volume mount kontrolü
docker-compose -f docker-compose.prod.yml exec backend ls -la /app/uploads

# Nginx erişim kontrolü
docker-compose -f docker-compose.prod.yml exec nginx ls -la /var/www/uploads
```

### Debug Mode

```bash
# Debug logları için
docker-compose -f docker-compose.prod.yml down
LOG_LEVEL=debug docker-compose -f docker-compose.prod.yml up
```

## 📊 Performance Tuning

### PostgreSQL Optimizasyonu

`postgres` container'ına environment variable ekleyin:

```yaml
environment:
  POSTGRES_INITDB_ARGS: "-c shared_buffers=256MB -c max_connections=200"
```

### Node.js Memory Limit

Backend ve worker container'larına ekleyin:

```yaml
environment:
  NODE_OPTIONS: "--max-old-space-size=4096"
```

### Nginx Caching

Static dosyalar için cache sürelerini artırın:

```nginx
location /_next/static {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

## 📱 Mobile Optimizasyonlar

Platform iPhone 15 Pro ve benzeri cihazlar için optimize edilmiştir:
- Responsive tasarım
- Touch-friendly UI
- Optimized image loading
- PWA desteği (opsiyonel)

## 🔄 CI/CD Pipeline (GitHub Actions)

`.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to server
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.HOST }}
          username: ${{ secrets.USERNAME }}
          key: ${{ secrets.SSH_KEY }}
          script: |
            cd /path/to/competitor-lens
            git pull origin main
            docker-compose -f docker-compose.prod.yml build
            docker-compose -f docker-compose.prod.yml up -d
```

## 📞 Destek

Deployment sırasında sorun yaşarsanız:
1. Logları kontrol edin
2. Bu dokümandaki troubleshooting bölümüne bakın
3. GitHub Issues'da arayın veya yeni issue açın

## 🎉 Son Kontroller

Deployment tamamlandıktan sonra:

- [ ] Tüm sayfalar açılıyor mu?
- [ ] Screenshot'lar görüntüleniyor mu?
- [ ] Matrix verisi doğru yüklendi mi?
- [ ] API endpoint'leri çalışıyor mu?
- [ ] SSL sertifikası geçerli mi?
- [ ] Backup'lar alınıyor mu?
- [ ] Monitoring aktif mi?

Tüm kontroller tamamsa, CompetitorLens production'da hazır! 🚀