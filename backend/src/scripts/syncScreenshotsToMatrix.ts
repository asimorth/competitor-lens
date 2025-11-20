import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface SyncStats {
  screenshotsV2Processed: number;
  screenshotsV1Processed: number;
  newRelationsCreated: number;
  existingRelationsUpdated: number;
  orphanScreenshots: number;
  errors: number;
}

/**
 * Screenshot-Feature Matrix Senkronizasyonu
 * 
 * Bu script database'deki screenshot'ları tarar ve
 * feature matrix'e (competitor_features) senkronize eder.
 * 
 * Mantık:
 * 1. Yeni model (Screenshot v2) - screenshots tablosu
 * 2. Eski model (CompetitorFeatureScreenshot) - competitor_feature_screenshots tablosu
 * 3. Screenshot varsa ilgili CompetitorFeature kaydını oluştur/güncelle
 */
async function syncScreenshotsToMatrix(dryRun: boolean = false) {
  console.log('🔄 Starting Screenshot to Matrix Sync...');
  console.log(`   Mode: ${dryRun ? '🔍 DRY RUN (no changes)' : '✍️  WRITE MODE'}\n`);
  
  const stats: SyncStats = {
    screenshotsV2Processed: 0,
    screenshotsV1Processed: 0,
    newRelationsCreated: 0,
    existingRelationsUpdated: 0,
    orphanScreenshots: 0,
    errors: 0
  };

  try {
    // ============================================
    // 1. Process Screenshot v2 (new model)
    // ============================================
    console.log('📸 Processing Screenshot v2 (new model)...');
    
    const screenshotsV2 = await prisma.screenshot.findMany({
      where: {
        isOnboarding: false // Onboarding screenshot'ları hariç
      },
      include: {
        competitor: true,
        feature: true
      }
    });
    
    console.log(`   Found ${screenshotsV2.length} screenshots (v2)\n`);
    
    for (const screenshot of screenshotsV2) {
      stats.screenshotsV2Processed++;
      
      // Screenshot'un feature'ı yoksa orphan olarak işaretle
      if (!screenshot.featureId || !screenshot.feature) {
        stats.orphanScreenshots++;
        console.log(`   ⚠️  Orphan screenshot: ${screenshot.fileName} (competitor: ${screenshot.competitor.name})`);
        continue;
      }
      
      try {
        // CompetitorFeature ilişkisini kontrol et
        const existingRelation = await prisma.competitorFeature.findUnique({
          where: {
            competitorId_featureId: {
              competitorId: screenshot.competitorId,
              featureId: screenshot.featureId
            }
          }
        });
        
        if (!dryRun) {
          if (!existingRelation) {
            // Yeni ilişki oluştur
            await prisma.competitorFeature.create({
              data: {
                competitorId: screenshot.competitorId,
                featureId: screenshot.featureId,
                hasFeature: true,
                implementationQuality: 'good',
                notes: `Auto-synced from screenshot: ${screenshot.fileName}`
              }
            });
            stats.newRelationsCreated++;
            console.log(`   ✅ Created relation: ${screenshot.competitor.name} → ${screenshot.feature.name}`);
          } else if (!existingRelation.hasFeature) {
            // Mevcut ilişkiyi güncelle (hasFeature = false → true)
            await prisma.competitorFeature.update({
              where: { id: existingRelation.id },
              data: {
                hasFeature: true,
                implementationQuality: existingRelation.implementationQuality || 'good',
                notes: existingRelation.notes 
                  ? `${existingRelation.notes} | Updated from screenshot`
                  : `Updated from screenshot: ${screenshot.fileName}`
              }
            });
            stats.existingRelationsUpdated++;
            console.log(`   🔄 Updated relation: ${screenshot.competitor.name} → ${screenshot.feature.name}`);
          }
        } else {
          // Dry run mode - sadece rapor
          if (!existingRelation) {
            stats.newRelationsCreated++;
            console.log(`   [DRY RUN] Would create: ${screenshot.competitor.name} → ${screenshot.feature.name}`);
          } else if (!existingRelation.hasFeature) {
            stats.existingRelationsUpdated++;
            console.log(`   [DRY RUN] Would update: ${screenshot.competitor.name} → ${screenshot.feature.name}`);
          }
        }
      } catch (error) {
        stats.errors++;
        console.error(`   ❌ Error processing screenshot ${screenshot.id}:`, error);
      }
    }
    
    // ============================================
    // 2. Process CompetitorFeatureScreenshot (old model)
    // ============================================
    console.log('\n📸 Processing CompetitorFeatureScreenshot (old model)...');
    
    const screenshotsV1 = await prisma.competitorFeatureScreenshot.findMany({
      include: {
        competitorFeature: {
          include: {
            competitor: true,
            feature: true
          }
        }
      }
    });
    
    console.log(`   Found ${screenshotsV1.length} screenshots (v1)\n`);
    
    for (const screenshot of screenshotsV1) {
      stats.screenshotsV1Processed++;
      
      const { competitorFeature } = screenshot;
      
      try {
        if (!dryRun) {
          // Bu model zaten CompetitorFeature'a bağlı olduğu için
          // sadece hasFeature = true olduğundan emin ol
          if (!competitorFeature.hasFeature) {
            await prisma.competitorFeature.update({
              where: { id: competitorFeature.id },
              data: {
                hasFeature: true,
                implementationQuality: competitorFeature.implementationQuality || 'good',
                notes: competitorFeature.notes
                  ? `${competitorFeature.notes} | Has screenshots`
                  : 'Has screenshots'
              }
            });
            stats.existingRelationsUpdated++;
            console.log(`   🔄 Updated v1 relation: ${competitorFeature.competitor.name} → ${competitorFeature.feature.name}`);
          }
        } else {
          if (!competitorFeature.hasFeature) {
            stats.existingRelationsUpdated++;
            console.log(`   [DRY RUN] Would update v1: ${competitorFeature.competitor.name} → ${competitorFeature.feature.name}`);
          }
        }
      } catch (error) {
        stats.errors++;
        console.error(`   ❌ Error processing v1 screenshot ${screenshot.id}:`, error);
      }
    }
    
    // ============================================
    // 3. Summary Report
    // ============================================
    console.log('\n' + '='.repeat(60));
    console.log('📊 SYNC SUMMARY');
    console.log('='.repeat(60));
    console.log(`Mode: ${dryRun ? 'DRY RUN (no changes made)' : 'WRITE MODE (changes committed)'}`);
    console.log('');
    console.log('Screenshots Processed:');
    console.log(`   - V2 (new model): ${stats.screenshotsV2Processed}`);
    console.log(`   - V1 (old model): ${stats.screenshotsV1Processed}`);
    console.log(`   - Total: ${stats.screenshotsV2Processed + stats.screenshotsV1Processed}`);
    console.log('');
    console.log('Matrix Relations:');
    console.log(`   - New relations created: ${stats.newRelationsCreated}`);
    console.log(`   - Existing relations updated: ${stats.existingRelationsUpdated}`);
    console.log(`   - Total changes: ${stats.newRelationsCreated + stats.existingRelationsUpdated}`);
    console.log('');
    console.log('Issues:');
    console.log(`   - Orphan screenshots (no feature): ${stats.orphanScreenshots}`);
    console.log(`   - Errors: ${stats.errors}`);
    console.log('');
    
    if (stats.orphanScreenshots > 0) {
      console.log('⚠️  WARNING: Orphan screenshots found!');
      console.log('   These screenshots are not linked to any feature.');
      console.log('   Please review and assign them to appropriate features.');
      console.log('');
    }
    
    if (dryRun) {
      console.log('🔍 This was a DRY RUN. No changes were made.');
      console.log('   Run without --dry-run flag to apply changes.');
    } else {
      console.log('✅ Sync completed successfully!');
    }
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('\n❌ Sync failed with error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// CLI execution
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run') || args.includes('-d');

syncScreenshotsToMatrix(dryRun).catch(console.error);

