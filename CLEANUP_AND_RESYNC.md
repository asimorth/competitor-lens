# 🔄 Cleanup ve Resync Adımları

## Durum
- ✅ 747 screenshot database'e eklendi
- ❌ Sadece 7/14 borsa match oldu
- ❌ Tümü "Dashboard & Wallet" feature'ına atandı
- 🎯 Hedef: 1,307 screenshot tamamını doğru feature'larla ekle

## Adım 1: Mevcut Screenshot'ları Temizle

Railway Dashboard → Database → Query:

```sql
-- Auto-scan ile eklenen screenshot'ları sil
DELETE FROM screenshots WHERE upload_source = 'auto-scan';

-- Kontrol et
SELECT COUNT(*) FROM screenshots;
-- Beklenen: 0
```

## Adım 2: Sync'i Tekrar Çalıştır

Railway deploy bitince (2-3 dakika):

```bash
# Dry run - Test
curl -X POST "https://competitor-lens-production.up.railway.app/api/sync/screenshots?dryRun=true"

# Gerçek sync
curl -X POST "https://competitor-lens-production.up.railway.app/api/sync/screenshots"
```

## Adım 3: Sonuçları Kontrol Et

```bash
# Feature detail test
curl "https://competitor-lens-production.up.railway.app/api/features/simple"

# Screenshot count
curl "https://competitor-lens-production.up.railway.app/api/screenshots" | grep -o '"id"' | wc -l
```

## Adım 4: Frontend Test

1. Frontend URL'i yenile
2. Dashboard → "747" yerine "1,307" görmeli
3. Feature Gallery → Screenshot'lar görmeli
4. Feature detay → Screenshot grid çalışmalı

## İyileştirmeler (Son commit'te)

✅ Levenshtein distance matching
✅ Turkish char normalization (ı→i, ğ→g, ü→u, ş→s, ö→o, ç→c)
✅ Space removal
✅ Non-alphanumeric removal
✅ Contains + exact match

Şimdi çok daha fazla borsa match edecek!

