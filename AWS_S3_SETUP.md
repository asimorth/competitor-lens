# 🪣 AWS S3 Setup Guide - Screenshot Storage

## Neden S3?

✅ **Kalıcı Storage**: Railway ephemeral değil, S3 kalıcı  
✅ **Ölçeklenebilir**: Unlimited storage  
✅ **Hızlı**: CDN ile global delivery  
✅ **Güvenli**: AWS güvenlik altyapısı  
✅ **Uygun Fiyat**: Pay-as-you-go

---

## 📋 Adım 1: AWS S3 Bucket Oluştur

### AWS Console'a Gir
1. https://console.aws.amazon.com/s3 adresine git
2. **Create bucket** butonuna tıkla

### Bucket Ayarları
```
Bucket name: competitor-lens-screenshots
                (veya benzersiz bir isim)

Region: eu-central-1 (Frankfurt)
        (veya size yakın bir region)

Object Ownership: ACLs enabled
                  (Public access için gerekli)

Block Public Access: 
  ❌ Block all public access
  (Ekran görüntüleri public olacak)

Bucket Versioning: Disabled
                   (Opsiyonel, cost azaltır)

Default encryption: Enable
                   SSE-S3

Object Lock: Disabled
```

### Public Access Policy

Bucket oluşturduktan sonra → **Permissions** tab → **Bucket Policy**:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::competitor-lens-screenshots/*"
    }
  ]
}
```

**Not**: `competitor-lens-screenshots` yerine kendi bucket isminizi yazın!

---

## 📋 Adım 2: IAM User ve Access Keys

### IAM User Oluştur
1. https://console.aws.amazon.com/iam adresine git
2. **Users** → **Create user**
3. User name: `competitor-lens-s3-uploader`
4. **Next**

### Permissions
1. **Attach policies directly** seç
2. **Create policy** butonuna tıkla
3. JSON editor'ü aç:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::competitor-lens-screenshots",
        "arn:aws:s3:::competitor-lens-screenshots/*"
      ]
    }
  ]
}
```

4. Policy name: `CompetitorLensS3Access`
5. **Create policy**
6. User'a bu policy'yi attach et

### Access Keys Oluştur
1. User detay sayfasında → **Security credentials** tab
2. **Create access key**
3. Use case: **Application running outside AWS**
4. **Next** → **Create access key**
5. ⚠️ **Access key ID** ve **Secret access key**'i kaydet!

```
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=wJalr...
```

---

## 📋 Adım 3: Environment Variables

### Local Development (.env)
```bash
# AWS S3 Configuration
AWS_REGION=eu-central-1
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
S3_BUCKET=competitor-lens-screenshots

# Optional: CloudFront CDN URL
CDN_URL=https://d1234567890.cloudfront.net
```

### Railway Production

Railway Dashboard → Variables:

```
AWS_REGION=eu-central-1
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
S3_BUCKET=competitor-lens-screenshots
```

---

## 📋 Adım 4: Local Screenshots'ı S3'e Migrate Et

### Migration Script Çalıştır

```bash
cd backend

# Environment variables set edilmiş mi kontrol et
echo $AWS_ACCESS_KEY_ID
echo $S3_BUCKET

# Migration başlat
npm run migrate:s3
```

### Script Ne Yapar?

1. ✅ `uploads/screenshots/` klasörünü tarar
2. ✅ Her dosyayı S3'e yükler
3. ✅ Database'de `cdnUrl` field'ını günceller
4. ✅ Migration raporu oluşturur

### Beklenen Çıktı

```
🚀 Starting S3 Migration
==================================================

📁 Scanning: /path/to/uploads/screenshots

✅ Found 825 screenshots

📤 Starting upload to S3...

📤 Uploading: IMG_7691.png → screenshots/binance-global/ai-tool/IMG_7691-a1b2c3d4.png
✅ Updated: IMG_7691.png

📤 Uploading: IMG_7692.png → screenshots/binance-global/ai-tool/IMG_7692-e5f6g7h8.png
✅ Created: IMG_7692.png

...

==================================================
📊 MIGRATION REPORT
==================================================
Total screenshots: 825
✅ Uploaded: 820
⚠️  Skipped: 3
❌ Failed: 2
==================================================

✅ Migration complete!
📝 Report saved: logs/s3-migration-1699999999.json
```

---

## 📋 Adım 5: Frontend URL Update (Otomatik)

Frontend'teki `screenshot-utils.ts` zaten CDN URL'leri kullanacak şekilde yapılandırılmış:

```typescript
export function getScreenshotUrl(screenshot: any): string {
  // 1. CDN URL varsa onu kullan
  if (screenshot.cdnUrl) {
    return screenshot.cdnUrl;  // S3 URL'i burada!
  }
  
  // 2. Fallback: Backend static
  // ...
}
```

**Hiçbir frontend değişikliği gerekmez!** ✅

---

## 📋 Adım 6: Test

### S3 Upload Test

```bash
cd backend
npm run test:s3
```

Test script:

```typescript
import { S3Service } from './services/s3Service';

const s3 = new S3Service();
const testFile = './test-image.png';
const s3Key = s3.generateS3Key('Test', 'Feature', 'test.png');

const url = await s3.uploadFile(testFile, s3Key, 'image/png');
console.log('✅ Uploaded:', url);
```

### Frontend Test

1. Railway deploy tamamlandıktan sonra
2. Frontend'i aç: `https://competitor-lens.vercel.app`
3. Bir competitor'a tıkla
4. Screenshot'lar S3'ten yüklensin ✅

---

## 💰 Maliyet Tahmini

### AWS S3 Pricing (eu-central-1)

```
Storage: $0.023 per GB/month
  → 1 GB (825 screenshots): ~$0.02/month

PUT Requests: $0.005 per 1,000 requests
  → 825 uploads: $0.004 (one-time)

GET Requests: $0.0004 per 1,000 requests
  → 10,000 views/month: $0.004/month

Data Transfer Out: First 1 GB free
  → Then $0.09 per GB
```

**Tahmini Aylık Maliyet**: **~$1-2/month** 💰

---

## 🚀 Optional: CloudFront CDN

### Neden CloudFront?

✅ Daha hızlı global delivery  
✅ Edge caching  
✅ DDoS protection  
✅ Custom domain support

### Setup

1. CloudFront console: https://console.aws.amazon.com/cloudfront
2. **Create distribution**
3. Origin domain: `competitor-lens-screenshots.s3.eu-central-1.amazonaws.com`
4. Origin access: Public
5. Viewer protocol policy: Redirect HTTP to HTTPS
6. Cache policy: CachingOptimized
7. **Create distribution**

### Distribution URL'i Kullan

```bash
# Railway environment variables
CDN_URL=https://d1234567890abcd.cloudfront.net
```

Frontend otomatik olarak CDN URL'lerini kullanacak! ✅

---

## 🔧 Troubleshooting

### "Access Denied" Hatası

```bash
# Bucket policy kontrolü
aws s3api get-bucket-policy --bucket competitor-lens-screenshots

# ACL kontrolü
aws s3api get-bucket-acl --bucket competitor-lens-screenshots
```

### "Credentials Not Found"

```bash
# Environment variables kontrolü
echo $AWS_ACCESS_KEY_ID
echo $AWS_SECRET_ACCESS_KEY

# Railway'de set edilmiş mi?
railway variables
```

### "Upload Failed"

```bash
# IAM permissions kontrolü
aws sts get-caller-identity
aws s3 ls s3://competitor-lens-screenshots
```

---

## 📚 Package.json Scripts

```json
{
  "scripts": {
    "migrate:s3": "tsx src/scripts/migrateToS3.ts",
    "test:s3": "tsx src/scripts/testS3Upload.ts"
  }
}
```

---

## ✅ Checklist

- [ ] S3 bucket oluşturuldu
- [ ] Bucket public access configured
- [ ] IAM user oluşturuldu
- [ ] Access keys alındı
- [ ] Local .env dosyası güncellendi
- [ ] Railway environment variables eklendi
- [ ] Migration script çalıştırıldı
- [ ] Database'de cdnUrl'ler güncellendi
- [ ] Frontend test edildi
- [ ] Tüm screenshot'lar görünüyor ✅

---

## 🎉 Başarı!

Artık:
- ✅ Screenshot'lar AWS S3'te
- ✅ Kalıcı storage
- ✅ Global CDN
- ✅ Bu Mac'ten bağımsız
- ✅ Tüm cihazlardan erişilebilir

**Deployment tamamlandığında herhangi bir cihazdan tüm ekran görüntüleri görünecek!** 🌍

