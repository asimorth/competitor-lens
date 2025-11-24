import { PrismaClient } from '@prisma/client';
import { getScreenshotScanner } from '../services/screenshotScanner';
import { getFeatureScreenshotMapper, SMART_MAPPINGS } from '../services/featureScreenshotMapper';
import path from 'path';
import fs from 'fs/promises';

const prisma = new PrismaClient();

// Eksik feature'lar (screenshot klasörlerinde var ama Excel'de yok)
const MISSING_FEATURES = [
  {
    name: 'KYC & Identity Verification',
    category: 'Authentication',
    description: 'Know Your Customer - Kimlik doğrulama ve KYC süreçleri',
    priority: 'high'
  },
  {
    name: 'User Onboarding',
    category: 'User Experience',
    description: 'Kullanıcı onboarding ve ilk adımlar',
    priority: 'high'
  },
  {
    name: 'Dashboard & Wallet',
    category: 'Platform',
    description: 'Ana dashboard ve cüzdan görünümü',
    priority: 'high'
  }
];

interface SyncStats {
  scanned: number;
  added: number;
  skipped: number;
  errors: number;
  byCompetitor: Record<string, number>;
  byFeature: Record<string, number>;
}

export async function syncScreenshotsToDatabase(dryRun = false): Promise<SyncStats> {
  console.log('🔍 Starting screenshot sync to database...\n');
  console.log(`Mode: ${dryRun ? 'DRY RUN (no changes)' : 'LIVE (writing to database)'}\n`);

  const stats: SyncStats = {
    scanned: 0,
    added: 0,
    skipped: 0,
    errors: 0,
    byCompetitor: {},
    byFeature: {}
  };

  try {
    const scanner = getScreenshotScanner();
    const mapper = getFeatureScreenshotMapper();

    // Step 1: Eksik feature'ları ekle
    console.log('📝 Creating missing features...');
    if (!dryRun) {
      for (const featureData of MISSING_FEATURES) {
        const existing = await prisma.feature.findFirst({
          where: { name: featureData.name }
        });

        if (!existing) {
          await prisma.feature.create({
            data: featureData
          });
          console.log(`   ✅ Created: ${featureData.name}`);
        } else {
          console.log(`   ⏭️  Exists: ${featureData.name}`);
        }
      }
    } else {
      for (const featureData of MISSING_FEATURES) {
        console.log(`   [DRY RUN] Would create: ${featureData.name}`);
      }
    }
    console.log('');

    // Step 2: Screenshot'ları tara
    console.log('🔍 Scanning screenshots...');
    const structures = await scanner.scanAll();
    
    stats.scanned = structures.reduce((sum, s) => sum + s.totalScreenshots, 0);
    console.log(`📊 Found: ${stats.scanned} screenshots across ${structures.length} competitors\n`);

    // Step 3: Her competitor için screenshot'ları işle
    console.log('🔗 Mapping screenshots to features...\n');

    for (const structure of structures) {
      console.log(`\nProcessing: ${structure.competitorName} (${structure.totalScreenshots} screenshots)`);
      
      // Competitor'ı bul - Smart matching
      const normalizedName = structure.competitorName
        .toLowerCase()
        .replace(/\s+/g, '')
        .replace(/[türk]/gi, 'turk'); // Türk → turk
      
      const allCompetitors = await prisma.competitor.findMany();
      
      console.log(`   🔍 Looking for: "${structure.competitorName}" (normalized: "${normalizedName}")`);
      console.log(`   📋 Available competitors: ${allCompetitors.map(c => c.name).join(', ')}`);
      
      const competitor = allCompetitors.find(c => {
        const dbName = c.name
          .toLowerCase()
          .replace(/\s+/g, '')
          .replace(/[türk]/gi, 'turk');
        
        const matches = dbName.includes(normalizedName) || normalizedName.includes(dbName);
        if (matches) {
          console.log(`   ✅ Matched with: "${c.name}" (normalized: "${dbName}")`);
        }
        return matches;
      });

      if (!competitor) {
        console.log(`   ⚠️  Competitor not found in database: ${structure.competitorName}`);
        console.log(`      Tried matching with: ${normalizedName}`);
        stats.errors++;
        continue;
      }

      let competitorAdded = 0;

      // Her klasör için
      for (const folder of structure.folders) {
        // Root klasörü için özel handling - dosya isimlerinden feature çıkar
        let featureMapping = mapper.mapFolderToFeature(folder.folderName);
        
        // Eğer root klasörü (_root) ise, ilk screenshot'ın isminden feature belirle
        if (folder.folderName === '_root' && folder.screenshots.length > 0) {
          const firstFile = folder.screenshots[0];
          const lowerFile = firstFile.toLowerCase();
          
          // Dosya isminden feature çıkar
          if (lowerFile.includes('wallet') || lowerFile.includes('dashboard')) {
            featureMapping = SMART_MAPPINGS.find(m => m.excelFeatureName === 'Dashboard & Wallet') || null;
          } else if (lowerFile.includes('kyc')) {
            featureMapping = SMART_MAPPINGS.find(m => m.excelFeatureName === 'KYC & Identity Verification') || null;
          } else if (lowerFile.includes('onboard')) {
            featureMapping = SMART_MAPPINGS.find(m => m.excelFeatureName === 'User Onboarding') || null;
          } else {
            // Default: Dashboard & Wallet olarak işaretle
            featureMapping = SMART_MAPPINGS.find(m => m.excelFeatureName === 'Dashboard & Wallet') || null;
          }
        }
        
        if (!featureMapping) {
          console.log(`   ⚠️  No mapping for folder: ${folder.folderName}`);
          continue;
        }

        // Feature'ı bul
        const feature = await prisma.feature.findFirst({
          where: { name: featureMapping.excelFeatureName }
        });

        if (!feature) {
          console.log(`   ⚠️  Feature not found: ${featureMapping.excelFeatureName}`);
          stats.errors++;
          continue;
        }

        // Screenshot'ları ekle
        for (const screenshotFile of folder.screenshots) {
          const filePath = path.join(
            'uploads',
            'screenshots',
            structure.competitorName,
            folder.folderName,
            screenshotFile
          );

          // Duplicate kontrolü
          if (!dryRun) {
            const existing = await prisma.screenshot.findFirst({
              where: {
                competitorId: competitor.id,
                filePath: filePath
              }
            });

            if (existing) {
              stats.skipped++;
              continue;
            }

            // File bilgilerini al
            let fileSize = BigInt(0);
            let mimeType = 'image/png';
            
            try {
              const fullPath = path.join(process.cwd(), filePath);
              const stat = await fs.stat(fullPath);
              fileSize = BigInt(stat.size);
              
              if (screenshotFile.toLowerCase().endsWith('.jpg') || screenshotFile.toLowerCase().endsWith('.jpeg')) {
                mimeType = 'image/jpeg';
              } else if (screenshotFile.toLowerCase().endsWith('.webp')) {
                mimeType = 'image/webp';
              }
            } catch (error) {
              console.log(`   ⚠️  File not found: ${filePath}`);
            }

            // Screenshot'ı ekle
            try {
              await prisma.screenshot.create({
                data: {
                  competitorId: competitor.id,
                  featureId: feature.id,
                  filePath: filePath,
                  fileName: screenshotFile,
                  fileSize: fileSize,
                  mimeType: mimeType,
                  uploadSource: 'auto-scan',
                  isOnboarding: folder.folderName.toLowerCase().includes('onboarding')
                }
              });

              stats.added++;
              competitorAdded++;
              
              // By feature stats
              if (!stats.byFeature[feature.name]) {
                stats.byFeature[feature.name] = 0;
              }
              stats.byFeature[feature.name]++;

            } catch (error) {
              console.log(`   ❌ Error adding: ${screenshotFile}`);
              stats.errors++;
            }
          } else {
            // Dry run
            console.log(`   [DRY RUN] Would add: ${filePath} → ${feature.name}`);
            stats.added++;
            competitorAdded++;
          }
        }

        console.log(`   ✅ ${folder.folderName} → ${featureMapping.excelFeatureName}: ${folder.count} screenshots`);
      }

      stats.byCompetitor[structure.competitorName] = competitorAdded;
      console.log(`   📊 Total for ${structure.competitorName}: ${competitorAdded} screenshots\n`);
    }

    // Step 4: CompetitorFeature ilişkilerini güncelle
    if (!dryRun) {
      console.log('🔗 Updating CompetitorFeature relationships...');
      
      const screenshots = await prisma.screenshot.findMany({
        where: {
          uploadSource: 'auto-scan'
        },
        select: {
          competitorId: true,
          featureId: true
        },
        distinct: ['competitorId', 'featureId']
      });

      for (const screenshot of screenshots) {
        if (!screenshot.featureId) continue;

        await prisma.competitorFeature.upsert({
          where: {
            competitorId_featureId: {
              competitorId: screenshot.competitorId,
              featureId: screenshot.featureId
            }
          },
          update: {
            hasFeature: true,
            implementationQuality: 'good'
          },
          create: {
            competitorId: screenshot.competitorId,
            featureId: screenshot.featureId,
            hasFeature: true,
            implementationQuality: 'good'
          }
        });
      }

      console.log(`   ✅ Updated ${screenshots.length} CompetitorFeature relationships\n`);
    }

    // Summary
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 SYNC SUMMARY');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Scanned:  ${stats.scanned}`);
    console.log(`Added:    ${stats.added}`);
    console.log(`Skipped:  ${stats.skipped}`);
    console.log(`Errors:   ${stats.errors}`);
    console.log('');
    console.log('By Competitor:');
    Object.entries(stats.byCompetitor).forEach(([name, count]) => {
      console.log(`  - ${name}: ${count}`);
    });
    console.log('');
    console.log('By Feature:');
    Object.entries(stats.byFeature).forEach(([name, count]) => {
      console.log(`  - ${name}: ${count}`);
    });
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    if (dryRun) {
      console.log('✅ DRY RUN completed successfully! No changes were made.');
    } else {
      console.log('🎉 Sync completed successfully!');
    }

    return stats;

  } catch (error) {
    console.error('❌ Sync failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// CLI çalıştırma
if (require.main === module) {
  const dryRun = process.argv.includes('--dry-run');
  
  syncScreenshotsToDatabase(dryRun)
    .then(() => {
      console.log('✅ Script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}

