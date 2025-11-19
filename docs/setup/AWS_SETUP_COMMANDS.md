# 🚀 AWS S3 Hızlı Kurulum - Komutlar

## Seçenek 1: AWS Console (Tavsiye Edilen - Kolay)

### Adımlar:

#### 1. S3 Bucket Oluştur
1. https://s3.console.aws.amazon.com/s3/buckets adresine git
2. **Create bucket**
3. Settings:
   - Name: `competitor-lens-screenshots`
   - Region: `eu-central-1` (Frankfurt)
   - ❌ Block all public access (KAPAT)
   - ✅ ACLs enabled
   - Create bucket

#### 2. Bucket Policy Ekle
1. Bucket'a tıkla → **Permissions** tab
2. **Bucket Policy** → **Edit**
3. Aşağıdaki JSON'ı yapıştır:

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

4. **Save changes**

#### 3. IAM User Oluştur
1. https://console.aws.amazon.com/iam/home#/users adresine git
2. **Create user**
   - User name: `competitor-lens-uploader`
   - ✅ Provide user access to AWS Management Console - OPTIONAL (Hayır)
3. **Next**
4. **Attach policies directly**
5. **Create policy** (yeni tab açılır)
6. JSON tab:

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

7. **Next** → Policy name: `CompetitorLensS3Policy`
8. **Create policy** → İlk tab'a dön
9. ↻ Refresh → Yeni policy'yi seç
10. **Next** → **Create user**

#### 4. Access Keys Al
1. User detayına git
2. **Security credentials** tab
3. **Create access key**
4. **Application running outside AWS** seç
5. **Next** → **Create access key**
6. ⚠️ **KAYDET**: 

```
Access key ID: AKIA...
Secret access key: wJalr...
```

**ÇOK ÖNEMLİ**: Secret key'i sadece bu ekranda görebilirsiniz!

---

## Seçenek 2: AWS CLI (Advanced)

```bash
# AWS CLI yükle (eğer yoksa)
brew install awscli  # macOS
# veya
pip install awscli

# AWS configure
aws configure
# AWS Access Key ID: AKIA...
# AWS Secret Access Key: wJalr...
# Default region: eu-central-1
# Default output format: json

# S3 bucket oluştur
aws s3 mb s3://competitor-lens-screenshots --region eu-central-1

# Public access policy
aws s3api put-bucket-policy --bucket competitor-lens-screenshots --policy file://bucket-policy.json

# ACL enable
aws s3api put-bucket-acl --bucket competitor-lens-screenshots --acl public-read
```

---

## 📝 Environment Variables Ayarla

### Local (.env dosyasına ekle)

```bash
cd /Users/Furkan/Stablex/competitor-lens/backend

# .env dosyasını düzenle (nano veya text editor)
nano .env
```

Ekle:
```env
# AWS S3 Configuration
AWS_REGION=eu-central-1
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
S3_BUCKET=competitor-lens-screenshots
```

**⚠️ Kendi key'lerinizi kullanın!**

### Railway (Production)

```bash
# Railway CLI ile
railway variables set AWS_REGION=eu-central-1
railway variables set AWS_ACCESS_KEY_ID=AKIA...
railway variables set AWS_SECRET_ACCESS_KEY=wJalr...
railway variables set S3_BUCKET=competitor-lens-screenshots
```

**veya**

Railway Dashboard → Project → Variables → Add all variables

---

## ✅ Test Et

```bash
cd /Users/Furkan/Stablex/competitor-lens/backend

# S3 credentials test
npm run test:s3
```

Beklenen çıktı:
```
🧪 Testing S3 Upload
==================================================

📋 Environment Variables:
✅ AWS_ACCESS_KEY_ID: AKIA...
✅ AWS_SECRET_ACCESS_KEY: ***
✅ S3_BUCKET: competitor-lens-screenshots
✅ AWS_REGION: eu-central-1

📦 Initializing S3 Service...
📁 Scanning: /path/to/uploads/screenshots
✅ Test file: IMG_7691.png

📤 Uploading to S3...
   Key: screenshots/test-competitor/test-feature/IMG_7691-a1b2c3d4.png

✅ Upload successful!
   URL: https://competitor-lens-screenshots.s3.eu-central-1.amazonaws.com/...

🔍 Verifying upload...
✅ File verified in S3

🧹 Cleaning up test file...
✅ Test file deleted

==================================================
🎉 S3 Upload Test PASSED!
==================================================

✅ Your S3 configuration is working correctly!
✅ Ready to migrate all screenshots

Next step: npm run migrate:s3
```

---

## 🚀 Migration Başlat

Test başarılıysa:

```bash
npm run migrate:s3
```

Bu komut:
1. ✅ Tüm local screenshot'ları tarar (825 dosya)
2. ✅ Her birini S3'e yükler
3. ✅ Database'de `cdnUrl` field'larını günceller
4. ✅ Progress gösterir
5. ✅ Detaylı rapor oluşturur

---

## 📊 Beklenen Süre

```
825 screenshot × ~2 saniye = ~30 dakika
```

**Not**: Paralel upload ile hızlandırılabilir.

---

## ⚡ Hızlı Özet

```bash
# 1. AWS Console'da bucket oluştur (5 dakika)
# 2. IAM user ve keys al (3 dakika)
# 3. .env dosyasına ekle (1 dakika)
# 4. Test et
npm run test:s3

# 5. Migration başlat
npm run migrate:s3

# 6. Railway variables ekle
railway variables set AWS_REGION=eu-central-1
railway variables set AWS_ACCESS_KEY_ID=AKIA...
railway variables set AWS_SECRET_ACCESS_KEY=wJalr...
railway variables set S3_BUCKET=competitor-lens-screenshots

# 7. Deploy
git add -A
git commit -m "feat: AWS S3 integration for screenshots"
git push origin main
```

---

## 🎯 Sonuç

Migration tamamlandığında:
- ✅ Tüm screenshot'lar S3'te
- ✅ Database'de CDN URL'leri
- ✅ Frontend otomatik S3'ten yükler
- ✅ Bu Mac kapalı olsa da çalışır
- ✅ Tüm cihazlardan erişilebilir

**Total time: ~45 dakika**

Hazır mısınız? AWS Console'a girebilirsiniz:
👉 https://s3.console.aws.amazon.com/s3/buckets

