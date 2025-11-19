# 🎯 Local Database'i Prisma Console'da Görüntüleme

## Hedef
Local development database'inizi Prisma Postgres'e import edip Prisma Console'da görüntülemek.

---

## 📋 Adım Adım Rehber

### 1️⃣ Prisma Postgres API Key Alın (2 dakika)

1. **Prisma Console**: https://console.prisma.io/
2. Projenize tıklayın (yoksa "Create Project")
3. **"Prisma Postgres"** veya **"Database"** sekmesine gidin
4. **"Create database"** veya **"Enable Prisma Postgres"**
5. **"Generate database credentials"** butonuna tıklayın
6. **Connection String** kopyalayın

Format:
```
prisma+postgres://accelerate.prisma-data.net/?api_key=eyJhbGc...
```

### 2️⃣ Otomatik Import Script Çalıştırın (3 dakika)

Terminal'de:

```bash
cd /Users/Furkan/Stablex/competitor-lens
./import-to-prisma.sh
```

Script sizden Prisma Postgres API Key'i isteyecek. Yapıştırın.

Script otomatik olarak:
1. ✅ Local database'den backup alacak
2. ✅ Prisma Postgres'e tunnel açacak
3. ✅ Backup'ı Prisma Postgres'e yükleyecek
4. ✅ Tunnel'i kapatacak

### 3️⃣ Prisma Console'da Görüntüleyin (1 dakika)

1. **Prisma Console**: https://console.prisma.io/
2. Projenize tıklayın
3. **"Data Browser"** sekmesine gidin
4. **Tüm tablolarınızı göreceksiniz!** 🎉

---

## 🔧 Manuel Adımlar (Script kullanmak istemezseniz)

### Adım 1: Backup Alın

```bash
cd /Users/Furkan/Stablex/competitor-lens/backend

pg_dump \
  -Fc \
  -v \
  -d "postgresql://Furkan@localhost:5432/competitor_lens" \
  -n public \
  -f db_dump.bak
```

### Adım 2: Tunnel Başlatın

Yeni bir terminal açın:

```bash
export DATABASE_URL="prisma+postgres://accelerate.prisma-data.net/?api_key=BURAYA_API_KEY"
npx @prisma/ppg-tunnel --host 127.0.0.1 --port 5433
```

Bu terminal açık kalsın!

### Adım 3: Restore Edin

İlk terminal'e dönün:

```bash
PGSSLMODE=disable \
  pg_restore \
    -h 127.0.0.1 \
    -p 5433 \
    -v \
    -d postgres \
    ./db_dump.bak \
  && echo "-complete-"
```

### Adım 4: Tunnel'i Kapatın

Tunnel çalışan terminalde `Ctrl+C` ile durdurun.

### Adım 5: Prisma Console'da Kontrol

https://console.prisma.io/ → Data Browser

---

## ✅ Beklenen Sonuç

### Prisma Console → Data Browser'da:

- ✅ `competitors` tablosu ve verileri
- ✅ `features` tablosu ve verileri
- ✅ `competitor_features` ilişkileri
- ✅ `screenshots` ve tüm media
- ✅ Tüm diğer tablolar ve veriler

### Özellikler:

- 🔍 Veri arama ve filtreleme
- ✏️ Veri ekleme/düzenleme/silme
- 📊 İlişkileri görüntüleme
- 💾 Export alma
- 🔗 Query çalıştırma

---

## 🎯 Production için

Import tamamlandıktan sonra Railway PostgreSQL yerine Prisma Postgres kullanabilirsiniz:

### Railway Backend Variables:

```env
DATABASE_URL=prisma+postgres://accelerate.prisma-data.net/?api_key=...
DIRECT_DATABASE_URL=prisma+postgres://accelerate.prisma-data.net/?api_key=...
```

Aynı API key'i kullanın.

---

## 📊 Mimari

```
┌──────────────────────────────────────────┐
│         DEVELOPMENT                       │
├──────────────────────────────────────────┤
│  Local Backend                           │
│      │                                    │
│      └──▶ PostgreSQL (localhost)         │
│              │                            │
│              └─── IMPORT ───▶             │
│                                           │
└──────────────────────────────────────────┘

┌──────────────────────────────────────────┐
│         PRISMA CONSOLE                    │
├──────────────────────────────────────────┤
│  Prisma Postgres                         │
│      │                                    │
│      ├──▶ Data Browser ✅                │
│      ├──▶ Query Console ✅               │
│      └──▶ Schema Viewer ✅               │
│                                           │
└──────────────────────────────────────────┘
```

---

## 🧪 Test

Import sonrası test için:

```bash
cd /Users/Furkan/Stablex/competitor-lens/backend

# Prisma Studio ile Prisma Postgres'i görüntüle
DATABASE_URL="prisma+postgres://..." npx prisma studio
```

Veya doğrudan Prisma Console'da Data Browser kullanın.

---

## 🔄 Güncellemeler

Local database'i her güncellediğinizde Prisma Postgres'i senkronize etmek için:

```bash
# Script'i tekrar çalıştırın
./import-to-prisma.sh
```

Veya otomatik sync için migration kullanın:

```bash
DATABASE_URL="prisma+postgres://..." npx prisma db push
```

---

## 🆘 Sorun Giderme

### "pg_dump command not found"
```bash
# PostgreSQL client tools yükleyin
brew install postgresql
```

### "Tunnel başlatılamıyor"
```bash
# @prisma/ppg-tunnel yükleyin
npm install -g @prisma/ppg-tunnel
```

### "Restore hatası"
- Tunnel çalışıyor mu kontrol edin
- API key doğru mu?
- Port 5433 kullanımda mı? (başka port deneyin: 5434)

### "Prisma Console'da veri görünmüyor"
- Import tamamlandı mı?
- Doğru projede misiniz?
- "Refresh" butonuna tıklayın

---

## 🎉 Tamamlandı!

Artık:
- ✅ Local database'iniz Prisma Console'da görünüyor
- ✅ Data Browser ile veri yönetimi yapabilirsiniz
- ✅ Production için de aynı database'i kullanabilirsiniz

**Prisma Console → Data Browser'a gidin ve verilerinizi görün! 🚀**

