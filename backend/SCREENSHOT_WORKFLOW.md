# Screenshot Yönetimi İş Akışı 🖼️

## Genel Bakış

Bu platform, kripto borsaların feature'larına ait ekran görüntülerini **OTOMATIK** olarak kategorize edip veritabanına kaydeder.

## ⚡ Hızlı Kullanım

```bash
# 1. Screenshot'ları yükle
# uploads/screenshots/[Borsa Adı]/ klasörüne PNG dosyalarını ekle

# 2. Otomatik tarama çalıştır
npm run screenshots:scan

# HEPSI BU KADAR! 🎉
```

## Veritabanı Yapısı

### CompetitorFeatureScreenshot Modeli

```prisma
model CompetitorFeatureScreenshot {
  id                   String            @id @default(uuid())
  competitorFeatureId  String            @map("competitor_feature_id")
  screenshotPath       String            @map("screenshot_path")
  caption              String?
  displayOrder         Int?              @map("display_order")
  competitorFeature    CompetitorFeature @relation(fields: [competitorFeatureId], references: [id], onDelete: Cascade)
  createdAt            DateTime          @default(now()) @map("created_at")
}
```

## İş Akışı

### Otomatik Tarama Nasıl Çalışır? 🤖

Script, `uploads/screenshots/` klasöründeki tüm klasörleri tarar:

1. **Klasör adından borsa adını tespit eder**:
   - `Binance` → `Binance Global`
   - `Coinbase ios Jan 2025` → `Coinbase`
   - `BinanceTR` → `BinanceTR`

2. **Alt klasör ve dosya adlarından feature tipini tahmin eder**:
   - `AI Tool/` klasörü → `AI Sentimentals` feature
   - `Mobile` içeren klasör → `Mobile App` feature
   - `Payment` içeren klasör → `Pay (Payments)` feature

3. **PNG dosyalarını otomatik olarak kategorize eder**

4. **Veritabanına kaydeder**

### 1. Screenshot'ları Yükleme

Screenshot'ları klasör yapısına göre organize edin:

```
uploads/screenshots/
├── Binance/
│   ├── AI Tool/
│   │   ├── IMG_7691.png
│   │   └── IMG_7692.png
│   └── Staking/
│       └── screenshot.png
├── Coinbase ios Jan 2025/
│   ├── IMG_0001.png
│   ├── IMG_0002.png
│   └── ...
└── BinanceTR/
    └── ...
```

**İPUCU**: Klasör ve alt klasör adları feature tespiti için kullanılır!

### 2. Screenshot Mapping Scripti Oluşturma

Her borsa için bir mapping scripti oluşturun. Örnek template:

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Feature'lara göre screenshot mapping
const screenshotMapping: Record<string, number[]> = {
  'Mobile App': [0, 1, 2, 3, 4, 5],
  'Sign in with Apple': [10, 11, 12],
  'Convert': [20, 21, 22, 23],
  // ... diğer feature'lar
};

async function main() {
  // Borsayı bul
  const exchange = await prisma.competitor.findUnique({
    where: { name: 'Borsa Adı' }
  });

  if (!exchange) {
    console.log('Borsa bulunamadı!');
    return;
  }

  // Her feature için screenshot'ları ekle
  for (const [featureName, screenshotNumbers] of Object.entries(screenshotMapping)) {
    if (screenshotNumbers.length === 0) continue;

    // Feature'ı bul
    const feature = await prisma.feature.findUnique({
      where: { name: featureName }
    });

    if (!feature) {
      console.log(`Feature bulunamadı: ${featureName}`);
      continue;
    }

    // CompetitorFeature ilişkisini getir veya oluştur
    const competitorFeature = await prisma.competitorFeature.upsert({
      where: {
        competitorId_featureId: {
          competitorId: exchange.id,
          featureId: feature.id
        }
      },
      update: {
        hasFeature: true,
        implementationQuality: 'good'
      },
      create: {
        competitorId: exchange.id,
        featureId: feature.id,
        hasFeature: true,
        implementationQuality: 'good'
      }
    });

    // Mevcut screenshot'ları temizle
    await prisma.competitorFeatureScreenshot.deleteMany({
      where: { competitorFeatureId: competitorFeature.id }
    });

    // Yeni screenshot'ları ekle
    for (let i = 0; i < screenshotNumbers.length; i++) {
      const num = screenshotNumbers[i];
      const screenshotPath = `uploads/screenshots/Borsa Adı/screenshot_${num}.png`;
      
      await prisma.competitorFeatureScreenshot.create({
        data: {
          competitorFeatureId: competitorFeature.id,
          screenshotPath,
          displayOrder: i,
          caption: `${featureName} - Screenshot ${i + 1}`
        }
      });
    }

    console.log(`✅ ${featureName}: ${screenshotNumbers.length} screenshots eklendi`);
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
  });
```

### 3. Scripti Çalıştırma

```bash
cd /Users/Furkan/Stablex/competitor-lens/backend
npx tsx src/scripts/add[BorsaAdi]Screenshots.ts
```

### 4. Frontend'te Görüntüleme

Screenshot'lar otomatik olarak feature detay sayfasında görünecektir:
- URL: `/features/[id]`
- Tab: Screenshots
- Lightbox ile büyük görüntüleme

## Örnek Kullanım

### Coinbase İçin

```bash
# 1. Screenshot'ları yükle
# uploads/screenshots/Coinbase ios Jan 2025/ klasörüne PNG dosyalarını ekle

# 2. Script'i çalıştır
npx tsx src/scripts/addCoinbaseScreenshots.ts

# 3. Frontend'te kontrol et
# http://localhost:3000/features/[feature-id] adresine git
```

## Önemli Notlar

1. **Screenshot Path**: Tam path'i kullanın (uploads/screenshots/... ile başlayan)
2. **Display Order**: Screenshot'lar sıralı gösterilir (0, 1, 2, ...)
3. **Cascade Delete**: CompetitorFeature silindiğinde screenshot'lar da otomatik silinir
4. **Güncelleme**: Aynı script'i tekrar çalıştırarak screenshot'ları güncelleyebilirsiniz

## API Endpoints

### Feature Detayı (Screenshot'lar dahil)

```bash
GET /api/features/:id
```

Response:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Mobile App",
    "competitors": [
      {
        "competitor": {
          "name": "Coinbase"
        },
        "screenshots": [
          {
            "id": "uuid",
            "screenshotPath": "uploads/screenshots/...",
            "caption": "Mobile App - Screenshot 1",
            "displayOrder": 0
          }
        ]
      }
    ]
  }
}
```

## Troubleshooting

### Screenshot'lar görünmüyor
1. API response'u kontrol edin: `curl http://localhost:3001/api/features/[id]`
2. Screenshot path'inin doğru olduğundan emin olun
3. Feature ilişkisinin `hasFeature: true` olduğunu kontrol edin

### Script hata veriyor
1. Feature adının veritabanındaki ile tam eşleştiğinden emin olun
2. Borsa adının doğru olduğunu kontrol edin
3. Screenshot dosyalarının mevcut olduğunu doğrulayın

