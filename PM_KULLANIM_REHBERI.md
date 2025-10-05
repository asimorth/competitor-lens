# CompetitorLens - Product Manager Kullanım Rehberi

## 🎯 Platform Amacı

CompetitorLens, **kişisel PM monitoring aracınızdır**. Public bir platform değil, sadece sizin kripto borsa benchmark işlerinizi yönetmek için tasarlandı.

## 📊 Mevcut Durum

### ✅ Yüklü Veriler
- **19 Kripto Borsa**: 
  - Global: Binance, Coinbase, Kraken, Revolut, OKX, Kucoin
  - TR: BTCTurk, Paribu, BinanceTR, Bitexen, BiLira, CoinTR, GateTR, KucoinTR, BybitTR, Garanti Kripto, Midas Kripto
  - **Stablex**: Kendi platformunuz!

- **46 Feature** (8 Kategori):
  - **Authentication** (7): Sign in with Passkey/Gmail/Apple/Telegram/Wallet, Login with QR, Sign up with Bank
  - **Trading** (7): Copy Trading, Trade Bots, Auto-Invest (DCA), Convert, Price Alarm
  - **Earn** (5): Locked/Flexible Staking, Loan Borrowing, Dual Investment, On-chain Earn, VIP Loan
  - **Platform** (4): Web/Mobile/Desktop App, Corporate Registration
  - **Advanced** (4): Own Chain, Own Stablecoin, Own Card, Launchpool/Launchpad
  - **Services** (5): NFT Marketplace, Pay, Public API, API Management, Academy
  - **Social** (4): Copy Trading, Referral, Affiliate, Gamification, Social Feed
  - **Other** (10): Stocks Trading, Tokenized Stocks, Global Customers, Crypto Services, vb.

- **874 Veri Noktası**: Her borsa-feature kombinasyonu

## 🌐 Platform Erişimi

- **Ana Sayfa**: http://localhost:3002
- **Dashboard**: http://localhost:3002/dashboard
- **Feature Matrix**: http://localhost:3002/matrix (⭐ En önemli sayfa)
- **Borsalar**: http://localhost:3002/competitors
- **Feature'lar**: http://localhost:3002/features
- **Gap Analizi**: http://localhost:3002/analytics
- **Veri Yükleme**: http://localhost:3002/uploads

## 🎯 Temel Kullanım Senaryoları

### 1. Pazar Fırsatı Keşfetme
**Amaç**: Hangi feature'ları ekleyerek rekabet avantajı sağlayabilirim?

**Adımlar**:
1. **Gap Analizi** sayfasına gidin → http://localhost:3002/analytics
2. En düşük coverage'a sahip feature'ları görün
3. Bu feature'ları kimler implement etmiş inceleyin
4. Kendi platformunuz (Stablex) için önceliklendirin

### 2. Rakip Feature Analizi
**Amaç**: Binance'de olan ama bende olmayan neler var?

**Adımlar**:
1. **Borsalar** sayfasına gidin → http://localhost:3002/competitors
2. Binance'i seçin
3. "Feature'lar" sekmesinde tüm feature'larını görün
4. Kendi platformunuzla karşılaştırın

### 3. Feature Detay İnceleme
**Amaç**: "Staking" feature'ını kimler nasıl implement etmiş?

**Adımlar**:
1. **Feature'lar** sayfasına gidin → http://localhost:3002/features
2. "Staking" feature'ını bulun ve tıklayın
3. "Borsalar" sekmesinde hangi borsalarda olduğunu görün
4. "Ekran Görüntüleri" sekmesinde UI implementasyonlarını inceleyin

### 4. Matrix Monitoring
**Amaç**: Tüm verileri bir bakışta görmek

**Adımlar**:
1. **Feature Matrix** sayfasına gidin → http://localhost:3002/matrix
2. Kategori filtresi ile odaklanın (örn: "Trading")
3. Heatmap görünümüne geçin
4. Coverage sütununda düşük skorları görün → fırsat!

## 📈 PM İçgörüleri

### Stablex İçin Öneriler
Matrix'te Stablex'i diğer borsalarla karşılaştırarak:

1. **Yüksek Öncelikli Eksikler**: 
   - Analytics'te en düşük coverage'a sahip ama "high priority" olan feature'lara bakın
   
2. **Quick Wins**:
   - Çoğu borsada olan ama Stablex'te eksik feature'lar → kolay kazanımlar
   
3. **Diferansiyasyon**:
   - Hiçbir borsada olmayan ama potansiyeli olan feature'lar → unique değer

## 💡 Pro İpuçları

### Matrix Sayfasında
- **Heatmap Görünümü**: Renk kodları ile hızlı pattern'leri yakalayın
  - Yeşil (4) = Mükemmel implementasyon
  - Mavi (3) = İyi
  - Sarı (2) = Temel
  - Gri (0) = Yok
  
- **Coverage Sütunu**: Her feature'ın pazar penetrasyonunu görün
  - 80%+ = Industry standard
  - 40-80% = Rekabetçi alan
  - <40% = Fırsat veya niche

### Feature Detay Sayfalarında
- **Ekran Görüntüleri**: UI/UX benchmarking için kritik
- **Implementation Quality**: "excellent" olanlardan ilham alın
- **Notes**: Özel notlarınızı ekleyerek organize olun

### Veri Güncelleme
- Excel dosyanızı düzenleyin
- Upload sayfasından yeniden yükleyin
- Veriler otomatik merge edilir (duplicate olmaz)

## 🔄 Veri Günceleme

### Excel Güncelleme
1. `/sample-data/excel/converted_feature_matrix.csv` dosyasını düzenleyin
2. Yeni borsa veya feature ekleyin
3. Upload sayfasından yükleyin
4. Matrix otomatik güncellenir

### Ekran Görüntüsü Ekleme
1. Borsa UI'ından screenshot alın
2. `{borsa-adı}-{feature-adı}.png` olarak kaydedin
3. Upload sayfasından yükleyin
4. Feature detay sayfasında görünsün

## 🎨 Görsel Organizasyon

**Öneri Dosya Adlandırma**:
```
binance-spot-trading.png
binance-staking-interface.png
coinbase-simple-buy.png
stablex-convert-feature.png
```

**Konum**: `backend/uploads/screenshots/`

## 🚨 Önemli Notlar

1. **Kişisel Araç**: Bu platform public değil, sadece sizin PM işleriniz için
2. **Local Çalışır**: Internet bağlantısı gerekmez
3. **Veri Güvenliği**: Tüm veriler local PostgreSQL'de
4. **Hızlı Karar**: Matrix görünümü ile saniyeler içinde insight
5. **Excel Master**: Tüm veriler Excel'de edit edilebilir

## 🔧 Hızlı Komutlar

```bash
# Platform'u başlat
cd backend && npm run dev      # Terminal 1
cd frontend && npm run dev     # Terminal 2

# Veritabanını görüntüle
cd backend && npm run prisma:studio

# Excel import et (script ile)
cd backend && node import-script.js

# Veritabanını backup al
pg_dump competitor_lens_dev > backup.sql
```

## 📱 Sayfa Kısa Yolları

| Sayfa | URL | Kullanım |
|-------|-----|----------|
| Dashboard | `/` | Genel özet ve hızlı erişim |
| Matrix | `/matrix` | ⭐ Ana monitoring sayfası |
| Borsalar | `/competitors` | Borsa detayları |
| Feature'lar | `/features` | Feature detayları |
| Gap Analizi | `/analytics` | Stratejik içgörüler |
| Upload | `/uploads` | Veri yönetimi |

## 🎓 Örnek PM Soruları ve Cevapları

**S: "Hangi feature'ları öncelikle eklemeliyim?"**
**C**: Analytics → Gap Analizi → En düşük coverage + high priority olanlar

**S: "Binance neden bu kadar başarılı?"**
**C**: Competitors → Binance → 88.4% coverage, hemen hemen tüm feature'lar mevcut

**S: "Stablex'in eksik olduğu kritik feature'lar?"**
**C**: Matrix → Stablex sütunu → Kırmızı/boş hücrelere bakın

**S: "Copy Trading'i kimler yapmış, nasıl yapmışlar?"**
**C**: Features → Copy Trading → Borsalar + Ekran Görüntüleri sekmeleri

## 🔮 Gelecek Özellikler

- [ ] API entegrasyonu ile otomatik veri güncelleme
- [ ] AI tabanlı feature öneri sistemi
- [ ] Trend analizi (zaman serisi)
- [ ] Otomatik rapor oluşturma
- [ ] Screenshot annotation tool

---

**Başarılar!** 🚀 Product management kararlarınızı data-driven şekilde alın.
