/**
 * Screenshot Veri Doğrulama ve Temizleme Script'i
 * 
 * Bu script şunları yapar:
 * 1. Screenshot'ların competitor ve feature ilişkilerini kontrol eder
 * 2. Eksik veya hatalı ilişkileri tespit eder
 * 3. Dosya yollarının doğruluğunu kontrol eder
 * 4. CompetitorFeatureScreenshot ile Screenshot tablolarını senkronize eder
 */

import { PrismaClient } from '@prisma/client';
import fs from 'fs/promises';
import path from 'path';

const prisma = new PrismaClient();

interface ValidationResult {
  totalScreenshots: number;
  validScreenshots: number;
  invalidScreenshots: number;
  missingFiles: number;
  orphanedScreenshots: number;
  issues: Array<{
    screenshotId: string;
    issue: string;
    severity: 'error' | 'warning';
  }>;
}

async function validateScreenshots(): Promise<ValidationResult> {
  console.log('🔍 Screenshot verisi doğrulanıyor...\n');
  
  const result: ValidationResult = {
    totalScreenshots: 0,
    validScreenshots: 0,
    invalidScreenshots: 0,
    missingFiles: 0,
    orphanedScreenshots: 0,
    issues: []
  };
  
  // Tüm screenshot'ları getir
  const screenshots = await prisma.screenshot.findMany({
    include: {
      competitor: true,
      feature: true
    }
  });
  
  result.totalScreenshots = screenshots.length;
  console.log(`📊 Toplam screenshot sayısı: ${screenshots.length}`);
  
  for (const screenshot of screenshots) {
    let isValid = true;
    
    // 1. Competitor kontrolü
    if (!screenshot.competitor) {
      result.issues.push({
        screenshotId: screenshot.id,
        issue: `Competitor bulunamadı: ${screenshot.competitorId}`,
        severity: 'error'
      });
      isValid = false;
      result.orphanedScreenshots++;
    }
    
    // 2. Feature kontrolü (opsiyonel ama önemli)
    if (screenshot.featureId && !screenshot.feature) {
      result.issues.push({
        screenshotId: screenshot.id,
        issue: `Feature bulunamadı: ${screenshot.featureId}`,
        severity: 'warning'
      });
    }
    
    // 3. Dosya yolu kontrolü
    if (screenshot.filePath) {
      try {
        // Relative veya absolute path'i handle et
        const fullPath = screenshot.filePath.startsWith('/') 
          ? screenshot.filePath 
          : path.join(process.cwd(), screenshot.filePath);
        
        await fs.access(fullPath);
      } catch (error) {
        result.issues.push({
          screenshotId: screenshot.id,
          issue: `Dosya bulunamadı: ${screenshot.filePath}`,
          severity: 'error'
        });
        result.missingFiles++;
        isValid = false;
      }
    } else {
      result.issues.push({
        screenshotId: screenshot.id,
        issue: 'Dosya yolu tanımlanmamış',
        severity: 'error'
      });
      isValid = false;
    }
    
    // 4. MIME type kontrolü
    if (!screenshot.mimeType || !screenshot.mimeType.startsWith('image/')) {
      result.issues.push({
        screenshotId: screenshot.id,
        issue: `Geçersiz MIME type: ${screenshot.mimeType}`,
        severity: 'warning'
      });
    }
    
    if (isValid) {
      result.validScreenshots++;
    } else {
      result.invalidScreenshots++;
    }
  }
  
  return result;
}

async function syncCompetitorFeatureScreenshots(): Promise<void> {
  console.log('\n🔄 CompetitorFeatureScreenshot tablosu kontrol ediliyor...\n');
  
  // CompetitorFeatureScreenshot'ları al
  const cfScreenshots = await prisma.competitorFeatureScreenshot.findMany({
    include: {
      competitorFeature: {
        include: {
          competitor: true,
          feature: true
        }
      }
    }
  });
  
  console.log(`📊 CompetitorFeatureScreenshot sayısı: ${cfScreenshots.length}`);
  
  let synced = 0;
  let errors = 0;
  
  for (const cfScreenshot of cfScreenshots) {
    try {
      // Bu screenshot Screenshot tablosunda var mı?
      const existingScreenshot = await prisma.screenshot.findFirst({
        where: {
          OR: [
            { filePath: cfScreenshot.screenshotPath },
            { fileName: path.basename(cfScreenshot.screenshotPath) }
          ],
          competitorId: cfScreenshot.competitorFeature.competitorId
        }
      });
      
      if (!existingScreenshot) {
        // Screenshot tablosuna ekle
        try {
          await fs.access(cfScreenshot.screenshotPath);
          const stats = await fs.stat(cfScreenshot.screenshotPath);
          const ext = path.extname(cfScreenshot.screenshotPath).toLowerCase();
          const mimeTypes: Record<string, string> = {
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.webp': 'image/webp'
          };
          
          await prisma.screenshot.create({
            data: {
              competitorId: cfScreenshot.competitorFeature.competitorId,
              featureId: cfScreenshot.competitorFeature.featureId,
              filePath: cfScreenshot.screenshotPath,
              fileName: path.basename(cfScreenshot.screenshotPath),
              fileSize: BigInt(stats.size),
              mimeType: mimeTypes[ext] || 'image/jpeg',
              uploadSource: 'legacy-migration'
            }
          });
          
          synced++;
          console.log(`✅ Senkronize edildi: ${path.basename(cfScreenshot.screenshotPath)}`);
        } catch (fileError) {
          console.log(`⚠️  Dosya bulunamadı: ${cfScreenshot.screenshotPath}`);
          errors++;
        }
      }
    } catch (error) {
      console.error(`❌ Hata: ${error}`);
      errors++;
    }
  }
  
  console.log(`\n✅ Senkronize edilen: ${synced}`);
  console.log(`❌ Hata: ${errors}`);
}

async function fixOrphanedScreenshots(): Promise<void> {
  console.log('\n🔧 Orphaned screenshot\'lar düzeltiliyor...\n');
  
  // Competitor'ı olmayan screenshot'ları bul
  const orphanedScreenshots = await prisma.screenshot.findMany({
    where: {
      competitor: null
    }
  });
  
  console.log(`📊 Orphaned screenshot sayısı: ${orphanedScreenshots.length}`);
  
  if (orphanedScreenshots.length === 0) {
    console.log('✅ Orphaned screenshot bulunamadı.');
    return;
  }
  
  console.log('⚠️  Orphaned screenshot\'lar silinecek...');
  
  // Orphaned screenshot'ları sil
  const result = await prisma.screenshot.deleteMany({
    where: {
      competitor: null
    }
  });
  
  console.log(`✅ ${result.count} orphaned screenshot silindi.`);
}

async function generateReport(result: ValidationResult): Promise<void> {
  console.log('\n📋 DOĞRULAMA RAPORU\n');
  console.log('='.repeat(50));
  console.log(`Toplam Screenshot: ${result.totalScreenshots}`);
  console.log(`✅ Geçerli: ${result.validScreenshots}`);
  console.log(`❌ Geçersiz: ${result.invalidScreenshots}`);
  console.log(`📁 Eksik Dosya: ${result.missingFiles}`);
  console.log(`🔗 Orphaned: ${result.orphanedScreenshots}`);
  console.log('='.repeat(50));
  
  if (result.issues.length > 0) {
    console.log('\n⚠️  SORUNLAR:\n');
    
    // Error'ları önce göster
    const errors = result.issues.filter(i => i.severity === 'error');
    const warnings = result.issues.filter(i => i.severity === 'warning');
    
    if (errors.length > 0) {
      console.log('🔴 Hatalar:');
      errors.slice(0, 10).forEach(issue => {
        console.log(`  - ${issue.issue} (ID: ${issue.screenshotId.substring(0, 8)}...)`);
      });
      if (errors.length > 10) {
        console.log(`  ... ve ${errors.length - 10} hata daha`);
      }
    }
    
    if (warnings.length > 0) {
      console.log('\n🟡 Uyarılar:');
      warnings.slice(0, 10).forEach(issue => {
        console.log(`  - ${issue.issue} (ID: ${issue.screenshotId.substring(0, 8)}...)`);
      });
      if (warnings.length > 10) {
        console.log(`  ... ve ${warnings.length - 10} uyarı daha`);
      }
    }
  } else {
    console.log('\n✅ Sorun bulunamadı!');
  }
  
  // Feature ve Competitor istatistikleri
  const featureStats = await prisma.screenshot.groupBy({
    by: ['featureId'],
    _count: true,
    orderBy: {
      _count: {
        featureId: 'desc'
      }
    },
    take: 5
  });
  
  console.log('\n📊 En Çok Screenshot\'a Sahip Feature\'lar:');
  for (const stat of featureStats) {
    if (stat.featureId) {
      const feature = await prisma.feature.findUnique({
        where: { id: stat.featureId }
      });
      console.log(`  - ${feature?.name || 'Bilinmeyen'}: ${stat._count} screenshot`);
    }
  }
}

async function main() {
  try {
    console.log('🚀 Screenshot Veri Doğrulama Başlıyor...\n');
    
    // 1. Screenshot'ları doğrula
    const validationResult = await validateScreenshots();
    
    // 2. CompetitorFeatureScreenshot ile senkronize et
    await syncCompetitorFeatureScreenshots();
    
    // 3. Orphaned screenshot'ları düzelt
    if (validationResult.orphanedScreenshots > 0) {
      await fixOrphanedScreenshots();
    }
    
    // 4. Rapor oluştur
    await generateReport(validationResult);
    
    console.log('\n✅ Doğrulama tamamlandı!');
  } catch (error) {
    console.error('❌ Hata oluştu:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Script'i çalıştır
if (require.main === module) {
  main();
}

export { validateScreenshots, syncCompetitorFeatureScreenshots, fixOrphanedScreenshots };

