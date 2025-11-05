# 🚂 Railway AWS Environment Variables Setup

## Railway Dashboard'a Gidin

👉 https://railway.app/dashboard

---

## 📝 Eklenecek Variables

### 1. Projenizi Seçin
- **competitor-lens-backend** projesine tıklayın
- **Variables** tab'ına gidin

### 2. AWS Credentials Ekleyin

**Add Variable** butonuna tıklayıp şunları ekleyin:

```
Name: AWS_REGION
Value: eu-central-1
```

```
Name: AWS_ACCESS_KEY_ID
Value: YOUR_AWS_ACCESS_KEY_ID
```

```
Name: AWS_SECRET_ACCESS_KEY  
Value: YOUR_AWS_SECRET_ACCESS_KEY
```

```
Name: S3_BUCKET
Value: competitor-lens-screenshots
```

### 3. Verify

Tüm variables eklenmiş mi kontrol edin:
- ✅ AWS_REGION
- ✅ AWS_ACCESS_KEY_ID
- ✅ AWS_SECRET_ACCESS_KEY
- ✅ S3_BUCKET

---

## 🚀 Deployment

Variables ekledikten sonra:

### Option 1: Otomatik (Git Push)
Railway zaten otomatik deploy ediyor (son commit: 26c378a)

### Option 2: Manuel Trigger
Railway Dashboard → **Deployments** → **Deploy Now**

---

## ✅ Deployment Sonrası Test

Railway deployment tamamlandığında:

```bash
# Backend URL'inizi alın
BACKEND_URL="https://your-backend.railway.app"

# Health check
curl $BACKEND_URL/health

# Screenshot'lar artık S3'ten gelecek
curl $BACKEND_URL/api/screenshots | jq '.data[0].cdnUrl'

# Beklenen: S3 URL göreceksiniz!
# "https://competitor-lens-screenshots.s3.eu-central-1.amazonaws.com/..."
```

---

## 🎯 Sonuç

Railway variables eklendiğinde:
- ✅ Backend S3'e upload yapabilecek
- ✅ Screenshot'lar S3'ten serve edilecek
- ✅ CDN URLs database'de olacak
- ✅ Tüm cihazlardan erişilebilir olacak

**Bu Mac kapalı olsa da screenshot'lar görünecek!** 🌍

---

**Şimdi yapın**: Railway Dashboard → Variables → AWS credentials ekleyin!

