# ✅ Prisma Console'da Veri Görüntüleme - Final Çözüm

## Durum

- ✅ Prisma Postgres oluşturuldu
- ✅ Schema push edildi (tablolar var)
- ❌ Veri henüz yüklenmedi

## 🎯 En Kolay Çözüm: Prisma Console'un Import Özelliği

### Yöntem 1: CSV Export/Import (ÖNERİLEN)

#### Adım 1: Local'den CSV Export

```bash
cd /Users/Furkan/Stablex/competitor-lens

# Prisma Studio'yu başlatın
cd backend
npx prisma studio
```

Prisma Studio'da (http://localhost:5555):
1. Her tablo için:
   - Tabloya tıklayın
   - Sağ üst köşede "..." menüsü
   - "Export as CSV"
   - CSV dosyasını kaydedin

#### Adım 2: Prisma Console'a Import

1. **Prisma Console**: https://console.prisma.io/
2. Projenize gidin
3. **"Data Browser"** sekmesi
4. Bir tabloya tıklayın (örn: "competitors")
5. Sağ üst "..." menüsü → "Import data"
6. CSV dosyasını seçin
7. Column mapping'i kontrol edin
8. "Import" butonuna tıklayın

Her tablo için tekrarlayın.

---

### Yöntem 2: Prisma Studio ile Manuel Kopyalama

#### İki Prisma Studio Açın:

**Terminal 1 - Local:**
```bash
cd /Users/Furkan/Stablex/competitor-lens/backend
npx prisma studio
# http://localhost:5555
```

**Terminal 2 - Prisma Postgres:**
```bash
cd /Users/Furkan/Stablex/competitor-lens/backend
DATABASE_URL="prisma+postgres://accelerate.prisma-data.net/?api_key=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqd3RfaWQiOjEsInNlY3VyZV9rZXkiOiJza19Gd3NGQnRFdWFvZVo3Q1d1QUNDbGgiLCJhcGlfa2V5IjoiMDFLNzFHRzhBWjE5QjZQUFIyU05QQUg2N0oiLCJ0ZW5hbnRfaWQiOiJkYWEwZWQwYmE4NDQxMTVjN2NjMjg2OGMyMjFhN2ZmODc3YWQ2YTFlZWZlM2Q0ZjIxNGQ1OGRiMzA2YzVkYTY0IiwiaW50ZXJuYWxfc2VjcmV0IjoiODFkYWMwODktMWE3My00Nzg5LTkwOGQtZTMzYWY4ZGEzNTZiIn0.6C6rWqjFFs2oGY8xaTHmK_CbYlm6LjzmXjZJLHDSE0w" npx prisma studio --port 5556
# http://localhost:5556
```

Şimdi:
1. Local Studio'da veri seçin (select all)
2. Copy (Cmd+C)
3. Prisma Postgres Studio'ya geçin
4. "Add record" → Paste (Cmd+V)
5. Save

---

### Yöntem 3: SQL Dump (Manuel Import)

SQL dump'ı oluşturduk, şimdi manuel olarak Prisma Console'a import edin:

1. **SQL dump dosyası hazır**: `data_dump.sql`

2. **Prisma Console**: https://console.prisma.io/
3. Projeniz → **"Query Console"** veya **"SQL Editor"**
4. `data_dump.sql` içeriğini açın
5. SQL'leri küçük parçalar halinde çalıştırın

Veya:

```bash
# 1. @prisma/ppg-tunnel yükleyin (global)
npm install -g @prisma/ppg-tunnel

# 2. Yeni terminal'de tunnel başlatın
export DATABASE_URL="prisma+postgres://accelerate.prisma-data.net/?api_key=..."
npx @prisma/ppg-tunnel --host 127.0.0.1 --port 5433

# 3. Başka terminal'de import edin
PGSSLMODE=disable psql -h 127.0.0.1 -p 5433 -d postgres -f data_dump.sql
```

---

## 🎯 En Hızlı Yöntem

Eğer az veri varsa (< 1000 kayıt):

**Prisma Console'un Web Interface'i kullanın:**

1. https://console.prisma.io/
2. Data Browser → Bir tablo seçin
3. "Add record" butonuna tıklayın
4. Verileri manuel girin

Çok kayıt varsa Yöntem 1 (CSV) kullanın.

---

## ✅ Alternatif: Production İçin

Eğer sadece production'da görmek istiyorsanız:

### Railway PostgreSQL Kullanın:

1. Railway PostgreSQL zaten oluşturuldu
2. Railway variables'ı güncelleyin:
   ```
   DATABASE_URL=postgresql://postgres:ZCdmhhPofHfVJcRWINmaHnMhMZCIDiBS@switchyard.proxy.rlwy.net:25767/railway
   ```

3. Local data'yı Railway'e kopyalayın:
   ```bash
   # Local'den dump
   pg_dump postgresql://Furkan@localhost:5432/competitor_lens > local_data.sql
   
   # Railway'e import
   psql postgresql://postgres:ZCdmhhPofHfVJcRWINmaHnMhMZCIDiBS@switchyard.proxy.rlwy.net:25767/railway < local_data.sql
   ```

4. Prisma Console'a Railway PostgreSQL'i bağlayın

---

## 📊 Özet

### Prisma Postgres (Şu an):
- ✅ Oluşturuldu
- ✅ Schema var (tablolar)
- ❌ Veri yok

### Önerilen Aksiyon:

**Eğer az veri varsa:**
→ Prisma Console'da manuel olarak ekleyin

**Eğer çok veri varsa:**
→ CSV export/import kullanın (Yöntem 1)

**Production için:**
→ Railway PostgreSQL kullanın (daha kolay)

---

## 🚀 Hızlı Karar:

**Şu anda Prisma Console'da görmek istiyorsanız:**
```bash
# 1. Local Prisma Studio
cd backend
npx prisma studio

# 2. CSV export edin
# Her tablo için: ... → Export as CSV

# 3. Prisma Console'da import edin
# https://console.prisma.io/ → Data Browser → Import
```

**Production için:**
Railway PostgreSQL + Prisma Console entegrasyonu yapın (daha stabil)

**Hangi yöntemi tercih edersiniz?**

