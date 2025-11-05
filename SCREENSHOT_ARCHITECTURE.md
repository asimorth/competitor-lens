# Screenshot Mimarisi - CompetitorLens

## 📋 Genel Bakış

Bu doküman, CompetitorLens platformundaki screenshot yönetim mimarisini detaylı olarak açıklar. Sistemimiz **competitor** ve **feature** bazında iki ana kategoride screenshot'ları yönetir ve kullanıcıların her iki açıdan da ekran görüntülerine erişmesini sağlar.

## 🎯 Temel Prensipler

### 1. İki Yönlü Erişim
- **Competitor Bazında**: Kullanıcı bir borsaya tıkladığında, o borsanın tüm özelliklerine ait screenshot'ları görebilir
- **Feature Bazında**: Kullanıcı bir feature'a tıkladığında, o feature'ı implement eden tüm borsaların screenshot'larını görebilir

### 2. Smart Kategorileme
- Screenshot'lar otomatik olarak feature'lara atanabilir
- Manuel olarak feature ilişkilendirmesi yapılabilir
- Onboarding screenshot'ları özel olarak işaretlenir
- Kategorize edilmemiş screenshot'lar da desteklenir

### 3. Veri Tutarlılığı
- Her screenshot bir competitor'a ait olmalıdır (zorunlu)
- Feature ilişkisi opsiyoneldir
- Orphaned (sahipsiz) screenshot'lar sistem tarafından tespit edilir ve temizlenir

## 🗄️ Veritabanı Şeması

### Ana Tablolar

#### 1. Screenshot Tablosu (Ana Model)

```prisma
model Screenshot {
  id             String               @id @default(uuid())
  competitorId   String               @map("competitor_id")
  featureId      String?              @map("feature_id")
  filePath       String               @map("file_path")
  fileName       String               @map("file_name")
  fileSize       BigInt               @map("file_size")
  mimeType       String               @map("mime_type")
  width          Int?
  height         Int?
  thumbnailPath  String?              @map("thumbnail_path")
  cdnUrl         String?              @map("cdn_url")
  isOnboarding   Boolean              @default(false) @map("is_onboarding")
  uploadSource   String               @default("manual") @map("upload_source")
  
  // İlişkiler
  competitor     Competitor           @relation(fields: [competitorId], references: [id], onDelete: Cascade)
  feature        Feature?             @relation(fields: [featureId], references: [id])
  analyses       ScreenshotAnalysis[]
  syncStatus     SyncStatus?
  
  createdAt      DateTime             @default(now())
  updatedAt      DateTime             @updatedAt
  
  @@index([competitorId, featureId])
  @@map("screenshots")
}
```

**Önemli Alanlar:**
- `competitorId`: Zorunlu - her screenshot bir competitor'a ait
- `featureId`: Opsiyonel - screenshot bir feature ile ilişkili olabilir
- `isOnboarding`: Onboarding flow screenshot'larını işaretler
- `cdnUrl`: CDN'den serve edilen screenshot'lar için URL
- `uploadSource`: Screenshot'ın kaynağı (manual, auto-scan, api)

#### 2. CompetitorFeatureScreenshot (Legacy Model)

```prisma
model CompetitorFeatureScreenshot {
  id                  String            @id @default(uuid())
  competitorFeatureId String            @map("competitor_feature_id")
  screenshotPath      String            @map("screenshot_path")
  caption             String?
  displayOrder        Int?              @map("display_order")
  
  competitorFeature   CompetitorFeature @relation(fields: [competitorFeatureId], references: [id], onDelete: Cascade)
  createdAt           DateTime          @default(now())
  
  @@map("competitor_feature_screenshots")
}
```

**Not:** Bu model backwards compatibility için korunur. Yeni screenshot'lar `Screenshot` tablosuna eklenir.

#### 3. OnboardingScreenshot (Özel Onboarding Modeli)

```prisma
model OnboardingScreenshot {
  id              String     @id @default(uuid())
  competitorId    String     @map("competitor_id")
  screenshotPath  String     @map("screenshot_path")
  stepNumber      Int?       @map("step_number")
  stepDescription String?    @map("step_description")
  displayOrder    Int        @default(0) @map("display_order")
  cdnUrl          String?    @map("cdn_url")
  
  competitor      Competitor @relation(fields: [competitorId], references: [id], onDelete: Cascade)
  createdAt       DateTime   @default(now())
  
  @@map("onboarding_screenshots")
}
```

### İlişki Diyagramı

```
Competitor (1) ──┬── (N) Screenshot
                 │         │
                 │         └── (1) Feature
                 │
                 ├── (N) OnboardingScreenshot
                 │
                 └── (N) CompetitorFeature
                             │
                             └── (N) CompetitorFeatureScreenshot
```

## 🔌 Backend API Endpoints

### Screenshot CRUD Endpoints

#### 1. Tüm Screenshot'ları Listele
```
GET /api/screenshots
Query Params:
  - competitorId?: string (filtre)
  - featureId?: string (filtre)
  - isOnboarding?: boolean (filtre)

Response:
{
  "success": true,
  "data": Screenshot[],
  "count": number
}
```

#### 2. Competitor'a Göre Screenshot'ları Getir
```
GET /api/screenshots/competitor/:competitorId

Response:
{
  "success": true,
  "data": Screenshot[],
  "grouped": {
    "featureId": {
      "featureId": string,
      "featureName": string,
      "category": string,
      "screenshots": Screenshot[]
    }
  },
  "count": number,
  "competitor": {
    "id": string,
    "name": string,
    "logoUrl": string
  }
}
```

**Kullanım Senaryosu:** Kullanıcı bir borsanın detay sayfasına girdiğinde, o borsanın tüm screenshot'larını feature'lara göre gruplandırarak gösterir.

#### 3. Feature'a Göre Screenshot'ları Getir
```
GET /api/screenshots/feature/:featureId

Response:
{
  "success": true,
  "data": Screenshot[],
  "grouped": {
    "competitorId": {
      "competitorId": string,
      "competitorName": string,
      "logoUrl": string,
      "screenshots": Screenshot[]
    }
  },
  "count": number,
  "feature": {
    "id": string,
    "name": string,
    "category": string,
    "description": string
  }
}
```

**Kullanım Senaryosu:** Kullanıcı bir feature'ın detay sayfasına girdiğinde, o feature'ı implement eden tüm borsaların screenshot'larını gösterir.

#### 4. Screenshot Detayı
```
GET /api/screenshots/:id

Response:
{
  "success": true,
  "data": {
    ...Screenshot,
    "competitor": Competitor,
    "feature": Feature,
    "analyses": ScreenshotAnalysis[],
    "syncStatus": SyncStatus
  }
}
```

#### 5. Screenshot Feature İlişkisini Güncelle
```
PUT /api/screenshots/:id/feature
Body: {
  "featureId": string | null
}

Response:
{
  "success": true,
  "data": Screenshot,
  "message": "Screenshot feature updated successfully"
}
```

#### 6. Screenshot Sil
```
DELETE /api/screenshots/:id

Response:
{
  "success": true,
  "message": "Screenshot deleted successfully"
}
```

### Controller Zenginleştirmeleri

#### Competitor Controller
```typescript
// GET /api/competitors/:id
{
  ...competitor,
  "screenshots": Screenshot[], // Direkt screenshot ilişkisi
  "onboardingScreenshots": OnboardingScreenshot[],
  "screenshotStats": {
    "total": number,
    "byFeature": number,
    "onboarding": number,
    "uncategorized": number
  }
}
```

#### Feature Controller
```typescript
// GET /api/features/:id
{
  ...feature,
  "screenshots": Screenshot[], // Direkt screenshot ilişkisi
  "screenshotStats": {
    "total": number,
    "byCompetitor": { [competitorId: string]: number }
  },
  "implementationStats": {
    "total": number,
    "implemented": number,
    "notImplemented": number,
    "coverage": number
  }
}
```

## 💻 Frontend Implementation

### API Client (`/frontend/src/lib/api.ts`)

```typescript
api.screenshots = {
  // Tüm screenshot'ları getir (filtrelenebilir)
  getAll: async (filters?: { 
    featureId?: string; 
    competitorId?: string; 
    isOnboarding?: boolean 
  }),
  
  // Tek screenshot detayı
  getById: async (id: string),
  
  // Competitor bazında screenshot'lar
  getByCompetitor: async (competitorId: string),
  
  // Feature bazında screenshot'lar
  getByFeature: async (featureId: string),
  
  // Screenshot feature ilişkisini güncelle
  updateFeature: async (id: string, featureId: string | null),
  
  // Screenshot sil
  delete: async (id: string)
}
```

### Utility Functions (`/frontend/src/lib/screenshot-utils.ts`)

```typescript
// Screenshot URL'ini döndürür (CDN veya backend static)
getScreenshotUrl(screenshot: any): string

// Screenshot'ları feature bazında gruplar
groupScreenshotsByFeature(screenshots: any[]): Record<string, any>

// Screenshot'ları competitor bazında gruplar
groupScreenshotsByCompetitor(screenshots: any[]): Record<string, any>

// Screenshot'ları kategori bazında gruplar
groupScreenshotsByCategory(screenshots: any[]): Record<string, any>

// Screenshot tipini belirler
getScreenshotType(screenshot: any): 'onboarding' | 'feature' | 'uncategorized'

// Screenshot istatistiklerini hesaplar
calculateScreenshotStats(screenshots: any[]): {
  total: number,
  byType: { onboarding, feature, uncategorized },
  featureCount: number,
  competitorCount: number
}
```

### Frontend Sayfalarında Kullanım

#### 1. Competitor Detay Sayfası
```typescript
// /competitors/[id]/page.tsx
const fetchCompetitorData = async () => {
  const result = await api.competitors.getById(id);
  const screenshotsResult = await api.screenshots.getByCompetitor(id);
  
  // Screenshot'ları feature bazında grupla
  const grouped = groupScreenshotsByFeature(screenshotsResult.data);
}
```

#### 2. Feature Detay Sayfası
```typescript
// /features/[id]/page.tsx
const loadFeatureDetail = async () => {
  const featureRes = await api.features.getById(id);
  const screenshotsRes = await api.screenshots.getByFeature(id);
  
  // Screenshot'ları competitor bazında grupla
  const grouped = groupScreenshotsByCompetitor(screenshotsRes.data);
}
```

## 🔍 Veri Doğrulama ve Bakım

### Validation Script
```bash
npm run screenshots:validate
```

Bu script şunları yapar:
1. ✅ Screenshot'ların competitor ilişkilerini kontrol eder
2. ✅ Feature ilişkilerini doğrular
3. ✅ Dosya yollarının doğruluğunu kontrol eder
4. ✅ Orphaned screenshot'ları tespit eder
5. ✅ CompetitorFeatureScreenshot ile Screenshot tablolarını senkronize eder
6. ✅ Detaylı rapor oluşturur

### Örnek Çıktı
```
🔍 Screenshot verisi doğrulanıyor...

📊 Toplam screenshot sayısı: 825
✅ Geçerli: 810
❌ Geçersiz: 15
📁 Eksik Dosya: 10
🔗 Orphaned: 5

⚠️ SORUNLAR:
🔴 Hatalar:
  - Competitor bulunamadı: abc123... (ID: xyz789...)
  - Dosya bulunamadı: /uploads/... (ID: def456...)

📊 En Çok Screenshot'a Sahip Feature'lar:
  - Spot Trading: 150 screenshot
  - Futures Trading: 120 screenshot
  - Staking: 95 screenshot
```

## 🎨 Frontend Görsel Akış

### 1. Competitor Detay Sayfası
```
┌─────────────────────────────────────────┐
│  Binance                                │
│  ───────────────────────────────        │
│                                         │
│  📊 Screenshots: 45                     │
│  ├─ Spot Trading (15)                  │
│  ├─ Futures (12)                       │
│  ├─ Staking (10)                       │
│  └─ Onboarding (8)                     │
│                                         │
│  [Gallery View] [List View]            │
│                                         │
│  Feature: Spot Trading                  │
│  ┌───┐ ┌───┐ ┌───┐ ┌───┐             │
│  │img│ │img│ │img│ │img│ ...          │
│  └───┘ └───┘ └───┘ └───┘             │
│                                         │
│  Feature: Futures                       │
│  ┌───┐ ┌───┐ ┌───┐                    │
│  │img│ │img│ │img│ ...                 │
│  └───┘ └───┘ └───┘                    │
└─────────────────────────────────────────┘
```

### 2. Feature Detay Sayfası
```
┌─────────────────────────────────────────┐
│  Spot Trading                           │
│  ───────────────────────────────        │
│                                         │
│  📊 Implemented by: 18/20 exchanges     │
│  📷 Total Screenshots: 150              │
│                                         │
│  [Grid View] [Comparison View]         │
│                                         │
│  Binance (15 screenshots)               │
│  ┌───┐ ┌───┐ ┌───┐ ┌───┐             │
│  │img│ │img│ │img│ │img│ ...          │
│  └───┘ └───┘ └───┘ └───┘             │
│                                         │
│  Coinbase (12 screenshots)              │
│  ┌───┐ ┌───┐ ┌───┐                    │
│  │img│ │img│ │img│ ...                 │
│  └───┘ └───┘ └───┘                    │
└─────────────────────────────────────────┘
```

## 🔄 Data Flow

### Screenshot Upload Flow
```
1. User Upload
   ↓
2. Multer Middleware (file validation)
   ↓
3. File Storage (local/uploads/screenshots/{competitor}/{feature})
   ↓
4. Screenshot DB Record Creation
   ↓
5. Optional: AI Analysis (feature detection)
   ↓
6. Optional: CDN Sync
   ↓
7. Response to Frontend
```

### Screenshot Retrieval Flow
```
1. User Request (competitor or feature page)
   ↓
2. API Call (getByCompetitor or getByFeature)
   ↓
3. Database Query (with relations)
   ↓
4. Group by Feature/Competitor
   ↓
5. Add URL helpers (CDN or static)
   ↓
6. Frontend Rendering
```

## 📝 Best Practices

### Backend
1. ✅ Her zaman `competitorId` ile screenshot oluştur
2. ✅ `featureId` nullable - manuel veya otomatik atama
3. ✅ Cascade delete kullan (competitor silinince screenshot'lar da silinir)
4. ✅ İndexleri optimize et (`competitorId`, `featureId`)
5. ✅ Static file serving için caching kullan

### Frontend
1. ✅ `getScreenshotUrl()` utility'sini kullan (CDN/static path handling)
2. ✅ Lazy loading ile büyük galeri'leri optimize et
3. ✅ Screenshot'ları grupla (feature/competitor bazında)
4. ✅ Error handling - missing images için placeholder göster
5. ✅ Lightbox/modal ile tam boyut görüntüleme

### Veri Tutarlılığı
1. ✅ Periyodik olarak validation script çalıştır
2. ✅ Orphaned screenshot'ları temizle
3. ✅ Legacy tablolardan migration yap
4. ✅ File system ile DB'yi senkronize tut

## 🚀 Deployment Checklist

- [ ] Validation script çalıştırıldı
- [ ] Orphaned screenshot'lar temizlendi
- [ ] CDN konfigürasyonu yapıldı
- [ ] Static file serving test edildi
- [ ] API endpoints test edildi
- [ ] Frontend sayfalar test edildi
- [ ] Error handling doğrulandı
- [ ] Performance optimization yapıldı

## 📞 Yardım ve Destek

Sorularınız için:
- Backend: `/backend/src/routes/screenshots.ts`
- Frontend: `/frontend/src/lib/api.ts` ve `/frontend/src/lib/screenshot-utils.ts`
- Validation: `npm run screenshots:validate`
- Dokümantasyon: Bu dosya

---

**Son Güncelleme**: {{ CURRENT_DATE }}
**Versiyon**: 2.0
**Durum**: ✅ Aktif

