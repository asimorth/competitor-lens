# 🔧 AWS Permissions Fix - HEMEN YAPIN!

## ❌ Sorun
```
AccessDenied: User is not authorized to perform: s3:PutObject
```

IAM user'ınız (`competitor-lens-uploader`) bucket'a upload yetkisine sahip değil.

---

## ✅ Çözüm (2 Dakika)

### Option 1: IAM Console (Önerilen)

1. **IAM Console'a Git**: 
   👉 https://console.aws.amazon.com/iam/home#/users/competitor-lens-uploader

2. **Permissions** tab → **Add permissions** → **Attach policies directly**

3. **Create policy** butonuna tıkla (yeni tab açılır)

4. **JSON** tab'a geç ve yapıştır:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:PutObjectAcl",
        "s3:GetObject",
        "s3:GetObjectAcl",
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

5. **Next** 
6. Policy name: `CompetitorLensS3FullAccess`
7. **Create policy**

8. İlk tab'a dön → ↻ Refresh policies
9. `CompetitorLensS3FullAccess` seç
10. **Add permissions**

---

### Option 2: AWS CLI (Hızlı)

```bash
# Policy dosyası oluştur
cat > s3-policy.json << 'EOF'
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Action": [
      "s3:PutObject",
      "s3:PutObjectAcl",
      "s3:GetObject",
      "s3:DeleteObject",
      "s3:ListBucket"
    ],
    "Resource": [
      "arn:aws:s3:::competitor-lens-screenshots",
      "arn:aws:s3:::competitor-lens-screenshots/*"
    ]
  }]
}
EOF

# Policy oluştur
aws iam create-policy \
  --policy-name CompetitorLensS3FullAccess \
  --policy-document file://s3-policy.json

# User'a attach et
aws iam attach-user-policy \
  --user-name competitor-lens-uploader \
  --policy-arn arn:aws:iam::744389574619:policy/CompetitorLensS3FullAccess
```

---

### Option 3: S3 Bucket Policy (Alternatif)

S3 bucket'ın kendisine policy ekleyin:

1. **S3 Console**: https://s3.console.aws.amazon.com/s3/buckets/competitor-lens-screenshots
2. **Permissions** tab
3. **Bucket Policy** → **Edit**
4. Yapıştır:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicRead",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::competitor-lens-screenshots/*"
    },
    {
      "Sid": "UploaderAccess",
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::744389574619:user/competitor-lens-uploader"
      },
      "Action": [
        "s3:PutObject",
        "s3:PutObjectAcl",
        "s3:GetObject",
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::competitor-lens-screenshots/*"
    },
    {
      "Sid": "UploaderList",
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::744389574619:user/competitor-lens-uploader"
      },
      "Action": "s3:ListBucket",
      "Resource": "arn:aws:s3:::competitor-lens-screenshots"
    }
  ]
}
```

5. **Save changes**

---

## ✅ Doğrulama

Permission ekledikten sonra:

```bash
cd /Users/Furkan/Stablex/competitor-lens/backend

# Export env vars (aynı terminal session'da)
export AWS_REGION=eu-central-1
export AWS_ACCESS_KEY_ID=YOUR_AWS_ACCESS_KEY_ID
export AWS_SECRET_ACCESS_KEY=YOUR_AWS_SECRET_ACCESS_KEY
export S3_BUCKET=competitor-lens-screenshots

# Test tekrar
npm run test:s3
```

**Beklenen**:
```
✅ Upload successful!
✅ File verified in S3
✅ Test file deleted
🎉 S3 Upload Test PASSED!
```

---

## 🎯 Özet

**Sorun**: IAM user'ın S3 permissions'ı eksik  
**Çözüm**: IAM policy ekle veya bucket policy güncelle  
**Süre**: 2 dakika  
**Link**: https://console.aws.amazon.com/iam/home#/users/competitor-lens-uploader

Permission ekledikten sonra `npm run test:s3` başarılı olacak! ✅

