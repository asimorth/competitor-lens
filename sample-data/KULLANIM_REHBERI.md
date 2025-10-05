# CompetitorLens - Local Veri Besleme Rehberi

Bu rehber, CompetitorLens platformunu local'de nasıl besleyeceğinizi açıklar.

## 📁 Hazırlanan Dosyalar

### 1. Excel Veri Dosyası
**Konum**: `sample-data/excel/crypto_exchanges_features.csv`

**İçerik**: 8 kripto borsasının 10 feature'ı için 80 satır veri
- Binance, Coinbase, Kraken, KuCoin, Bybit, OKX, Huobi, Gate.io
- Spot Trading, Futures Trading, Margin Trading, P2P Trading, Staking, Savings, NFT Marketplace, Copy Trading, DeFi Integration, Mobile App

### 2. Ekran Görüntüleri
**Konum**: `backend/uploads/screenshots/`

**İçerik**: 13 adet örnek PNG dosyası
- binance-spot.png, binance-futures.png, binance-p2p.png
- coinbase-spot.png, coinbase-spot-pro.png
- kraken-spot.png, kucoin-spot.png, okx-spot.png
- bybit-futures.png, huobi-spot.png, gate-spot.png
- ve daha fazlası...

## 🚀 Adım Adım Kullanım

### Adım 1: Platformu Başlatın
```bash
# Backend'i başlatın
cd backend
npm run dev

# Frontend'i başlatın (yeni terminal)
cd frontend
npm run dev
```

### Adım 2: Excel Verilerini Yükleyin
1. http://localhost:3002/uploads sayfasına gidin
2. "Excel Dosyası Yükle" bölümünde "Excel Dosyası Seç" butonuna tıklayın
3. `sample-data/excel/crypto_exchanges_features.csv` dosyasını seçin
4. Dosya otomatik olarak parse edilip veritabanına kaydedilecek

### Adım 3: Verileri Kontrol Edin
1. **Dashboard**: http://localhost:3002/ - Genel istatistikleri görün
2. **Borsalar**: http://localhost:3002/competitors - 8 borsa listesini görün
3. **Feature'lar**: http://localhost:3002/features - 10 feature listesini görün
4. **Feature Matrix**: http://localhost:3002/matrix - Karşılaştırma tablosunu görün

### Adım 4: Ekran Görüntülerini İnceleyin
1. Herhangi bir feature detay sayfasına gidin (örn: http://localhost:3002/features/1)
2. "Ekran Görüntüleri" sekmesine tıklayın
3. Örnek ekran görüntülerini görüntüleyin

### Adım 5: Analizleri İnceleyin
1. http://localhost:3002/analytics sayfasına gidin
2. Feature coverage, gap analizi, borsa performansı ve trendleri inceleyin

## 📊 Veri Yapısı

### Excel Dosyası Sütunları
```
competitorName    : Borsa adı (Binance, Coinbase, vb.)
featureName      : Feature adı (Spot Trading, Staking, vb.)
category         : Kategori (Trading, Earn, NFT, Social, DeFi, Platform)
hasFeature       : Yes/No
quality          : excellent/good/basic/none
implementationQuality : Aynı kalite değeri
notes            : Açıklama notları
website          : Borsa website'i
description      : Borsa açıklaması
industry         : Cryptocurrency Exchange
featureDescription : Feature açıklaması
priority         : high/medium/low
```

### Örnek Veri Satırı
```csv
Binance,Spot Trading,Trading,Yes,excellent,excellent,Çok kapsamlı spot trading özellikleri,https://binance.com,Dünyanın en büyük kripto para borsası,Cryptocurrency Exchange,Kripto paraların anında alım satımı,high
```

## 🎨 Kendi Verilerinizi Ekleme

### Yeni Borsa Ekleme
1. Excel dosyasında yeni satırlar ekleyin
2. `competitorName` sütununda yeni borsa adını kullanın
3. Tüm feature'lar için satır ekleyin

### Yeni Feature Ekleme
1. Excel dosyasında yeni feature adı kullanın
2. Tüm borsalar için bu feature'ı ekleyin
3. Uygun kategori ve öncelik belirleyin

### Yeni Ekran Görüntüsü Ekleme
1. PNG dosyalarını `backend/uploads/screenshots/` klasörüne koyun
2. Dosya adlandırma: `{borsa-adı}-{feature-adı}.png`
3. Örnek: `binance-spot-trading.png`

## 🔧 Troubleshooting

### Excel Yükleme Sorunları
- Dosya formatının CSV veya Excel olduğundan emin olun
- Sütun adlarının tam olarak eşleştiğinden emin olun
- `hasFeature` sütununda sadece "Yes" veya "No" kullanın
- `quality` sütununda sadece "excellent", "good", "basic", "none" kullanın

### Ekran Görüntüsü Sorunları
- PNG, JPG veya JPEG formatı kullanın
- Dosya boyutunu 5MB'ın altında tutun
- Dosya adlarında Türkçe karakter kullanmayın

### Veritabanı Sorunları
- Backend'in çalıştığından emin olun
- PostgreSQL servisinin aktif olduğunu kontrol edin
- Migration'ların çalıştırıldığından emin olun

## 📈 Örnek Kullanım Senaryoları

### Senaryo 1: Yeni Borsa Analizi
1. Yeni bir kripto borsası keşfettiniz
2. Excel'e yeni satırlar ekleyerek bu borsanın tüm feature'larını kaydedin
3. Borsa'nın ekran görüntülerini çekin ve yükleyin
4. Analytics sayfasından rakiplerle karşılaştırın

### Senaryo 2: Feature Gap Analizi
1. Analytics sayfasında gap analizine bakın
2. En düşük coverage'a sahip feature'ları belirleyin
3. Bu feature'ları implement etmeyen borsaları inceleyin
4. Pazar fırsatlarını değerlendirin

### Senaryo 3: Rakip Takibi
1. Belirli bir borsanın detay sayfasına gidin
2. Feature implementasyonlarını inceleyin
3. Ekran görüntülerinden UI/UX özelliklerini analiz edin
4. Kendi ürününüzle karşılaştırın

## 🎯 Sonraki Adımlar

1. **Gerçek Veri Toplama**: Örnek veriler yerine gerçek borsa verilerini toplayın
2. **Görsel Zenginleştirme**: Daha fazla ekran görüntüsü ekleyin
3. **Detaylı Analiz**: Feature'ları daha detaylı kategorilere ayırın
4. **Otomatik Güncelleme**: API'ler üzerinden otomatik veri güncelleme sistemi kurun

## 📞 Destek

Herhangi bir sorun yaşarsanız:
1. Backend loglarını kontrol edin
2. Browser console'da hata mesajlarına bakın
3. Database bağlantısını test edin
4. Dosya formatlarını doğrulayın

---

**Başarılar!** 🚀 CompetitorLens ile kripto borsa benchmark analizlerinizi bir üst seviyeye taşıyın.
