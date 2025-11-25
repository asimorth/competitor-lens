# 🚨 Screenshot Import Fix - Manuel Guide

## Mevcut Durum (KRİTİK)

- Local: 1,306 screenshot fiziksel dosya
- Database: 4 screenshot
- Frontend: Datalar görünmüyor
- Sync: Sadece 77/1,306 eklemeye çalışıyor

## 🔍 Root Cause

1. **Competitor Matching Fail**: Coinbase, Kraken database'de bulunamıyor
2. **Feature Mapping Limited**: Sadece Onboarding ve AI Sentimentals çalışıyor  
3. **Root Files**: 796 root dosya işlenemiyor (path hataları olabilir)

## ✅ HIZLI ÇÖZÜM - Manuel Import Script

### Adım 1: Basit Import Script Oluştur

`backend/src/scripts/simpleScreenshotImport.ts`:

```typescript
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

// Tüm competitor ve feature'ları ÖNCEDen al
let allCompetitors: any[];
let allFeatures: any[];

async function init() {
  allCompetitors = await prisma.competitor.findMany();
  allFeatures = await prisma.feature.findMany();
  
  console.log(`Competitors: ${allCompetitors.length}`);
  console.log(`Features: ${allFeatures.length}`);
}

// Basit isim match
function findCompetitor(folderName: string) {
  const normalized = folderName.toLowerCase().replace(/\s/g, '');
  return allCompetitors.find(c => {
    const dbNorm = c.name.toLowerCase().replace(/\s/g, '');
    return dbNorm.includes(normalized) || normalized.includes(dbNorm);
  });
}

// Klasör isminden feature
function getFeatureForFolder(folderName: string) {
  const lower = folderName.toLowerCase();
  
  if (lower.includes('kyc')) return allFeatures.find(f => f.name.includes('KYC'));
  if (lower.includes('onboard')) return allFeatures.find(f => f.name.includes('Onboarding'));
  if (lower.includes('dashboard')) return allFeatures.find(f => f.name.includes('Dashboard'));
  if (lower.includes('wallet')) return allFeatures.find(f => f.name.includes('Dashboard'));
  if (lower.includes('ai')) return allFeatures.find(f => f.name.includes('AI'));
  if (lower.includes('try') || lower.includes('nema')) return allFeatures.find(f => f.name.includes('TRY'));
  
  // Default: Mobile App
  return allFeatures.find(f => f.name === 'Mobile App');
}

async function importAll() {
  await init();
  
  const uploadsPath = path.join(process.cwd(), 'uploads', 'screenshots');
  const competitors = fs.readdirSync(uploadsPath);
  
  let added = 0;
  
  for (const competitorFolder of competitors) {
    if (competitorFolder.startsWith('.')) continue;
    
    const competitor = findCompetitor(competitorFolder);
    if (!competitor) {
      console.log(`❌ Not found: ${competitorFolder}`);
      continue;
    }
    
    console.log(`\\n📊 ${competitorFolder} → ${competitor.name}`);
    
    const competitorPath = path.join(uploadsPath, competitorFolder);
    
    // Root dosyalar
    const rootFiles = fs.readdirSync(competitorPath)
      .filter(f => f.match(/\\.(png|PNG|jpg|jpeg|JPEG)$/));
    
    if (rootFiles.length > 0) {
      const feature = allFeatures.find(f => f.name === 'Mobile App');
      for (const file of rootFiles) {
        const filePath = `uploads/screenshots/${competitorFolder}/${file}`;
        
        await prisma.screenshot.create({
          data: {
            competitorId: competitor.id,
            featureId: feature?.id,
            filePath,
            fileName: file,
            fileSize: BigInt(0),
            mimeType: 'image/png',
            uploadSource: 'manual-import'
          }
        });
        added++;
      }
      console.log(`  ✅ Root: ${rootFiles.length}`);
    }
    
    // Alt klasörler
    const subdirs = fs.readdirSync(competitorPath, { withFileTypes: true })
      .filter(d => d.isDirectory());
    
    for (const subdir of subdirs) {
      const subdirPath = path.join(competitorPath, subdir.name);
      const files = fs.readdirSync(subdirPath)
        .filter(f => f.match(/\\.(png|PNG|jpg|jpeg|JPEG)$/));
      
      const feature = getFeatureForFolder(subdir.name);
      
      for (const file of files) {
        const filePath = `uploads/screenshots/${competitorFolder}/${subdir.name}/${file}`;
        
        await prisma.screenshot.create({
          data: {
            competitorId: competitor.id,
            featureId: feature?.id,
            filePath,
            fileName: file,
            fileSize: BigInt(0),
            mimeType: 'image/png',
            uploadSource: 'manual-import'
          }
        });
        added++;
      }
      console.log(`  ✅ ${subdir.name}: ${files.length}`);
    }
  }
  
  console.log(`\\n🎉 Total added: ${added}`);
}

importAll().finally(() => prisma.$disconnect());
```

### Adım 2: Railway'de Çalıştır

```bash
# Terminal'de
railway run npx tsx src/scripts/simpleScreenshotImport.ts
```

YA DA API endpoint'i düzenle ve curl ile tetikle.

## 🎯 Daha İyi Yol: Existing Script'i Debug Et

Railway Logs'u kontrol et - "Competitor not found" mesajlarına bak:
- Hangi isimler match olmuyor?
- Database'de isim ne?
- Klasör ismi ne?

Bu bilgiyi bana ver, alias mapping'e ekleyelim.

## ⚠️ Kritik Not

Şu an database'de sadece **4 screenshot** var. Acil olarak:

1. Basit import script çalıştır (yukarıdaki)
2. Veya Railway logs debug et
3. Feature Gallery çalışsın

Hangi yolu tercih edersin?

