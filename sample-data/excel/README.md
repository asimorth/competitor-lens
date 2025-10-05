# Kripto Borsa Feature Verileri

## Dosyalar

### 1. crypto_exchanges_features.csv
Bu dosya 8 kripto borsasının 10 farklı feature'ı için karşılaştırma verilerini içerir.

**Borsalar:**
- Binance
- Coinbase  
- Kraken
- KuCoin
- Bybit
- OKX
- Huobi
- Gate.io

**Feature'lar:**
- **Trading:** Spot Trading, Futures Trading, Margin Trading, P2P Trading
- **Earn:** Staking, Savings
- **NFT:** NFT Marketplace
- **Social:** Copy Trading
- **DeFi:** DeFi Integration
- **Platform:** Mobile App

**Sütun Açıklamaları:**
- `competitorName`: Borsa adı
- `featureName`: Feature adı
- `category`: Feature kategorisi
- `hasFeature`: Feature'ın mevcut olup olmadığı (Yes/No)
- `quality`: Uygulama kalitesi (excellent/good/basic/none)
- `implementationQuality`: Aynı kalite değeri
- `notes`: Feature hakkında notlar
- `website`: Borsa website'i
- `description`: Borsa açıklaması
- `industry`: Sektör (Cryptocurrency Exchange)
- `featureDescription`: Feature açıklaması
- `priority`: Feature önceliği (high/medium/low)

## Kullanım

1. CSV dosyasını Excel'de açın
2. Platformdaki Upload sayfasından yükleyin
3. Veriler otomatik olarak parse edilip veritabanına kaydedilecek

## Özelleştirme

Kendi verilerinizi eklemek için:
1. Aynı sütun yapısını koruyun
2. `hasFeature` sütununda Yes/No kullanın
3. `quality` sütununda excellent/good/basic/none kullanın
4. `priority` sütununda high/medium/low kullanın
