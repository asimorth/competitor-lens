/**
 * Sync Excel Features with Screenshots
 * Maps screenshot folders to Excel features intelligently
 */

import { PrismaClient } from '@prisma/client';
import { getScreenshotFeatureMapper } from '../services/screenshotFeatureMapper';

const prisma = new PrismaClient();
const mapper = getScreenshotFeatureMapper();

async function main() {
  console.log('🔄 Syncing Excel Features with Screenshots\n');
  console.log('='.repeat(60));

  try {
    // TR Competitors (Priority - Stablex's direct competitors)
    const trCompetitors = [
      "OKX TR",
      "Garanti Kripto", 
      "Paribu",
      "BTCTurk",
      "BinanceTR",
      "BybitTR",
      "BiLira",
      "GateTR",
      "Kuantist"
    ];

    // Global Competitors (Benchmark)
    const globalCompetitors = [
      "Coinbase",
      "Kraken",
      "Binance Global",
      "Revolut"
    ];

    let totalMapped = 0;
    let totalSkipped = 0;
    const featureSet = new Set<string>();

    // Process TR competitors first
    console.log('\n📍 Processing TR Competitors...\n');
    for (const compName of trCompetitors) {
      try {
        const result = await mapper.mapCompetitorScreenshots(compName);
        totalMapped += result.mapped;
        totalSkipped += result.skipped;
        result.features.forEach(f => featureSet.add(f));
        
        console.log(`   ${compName}: ${result.mapped} mapped, ${result.skipped} skipped`);
      } catch (error) {
        console.error(`   ❌ Error processing ${compName}:`, error);
      }
    }

    // Process Global competitors
    console.log('\n🌍 Processing Global Competitors...\n');
    for (const compName of globalCompetitors) {
      try {
        const result = await mapper.mapCompetitorScreenshots(compName);
        totalMapped += result.mapped;
        totalSkipped += result.skipped;
        result.features.forEach(f => featureSet.add(f));
        
        console.log(`   ${compName}: ${result.mapped} mapped, ${result.skipped} skipped`);
      } catch (error) {
        console.error(`   ❌ Error processing ${compName}:`, error);
      }
    }

    // Generate report
    console.log('\n' + '='.repeat(60));
    console.log('📊 SYNC REPORT');
    console.log('='.repeat(60));
    console.log(`Total screenshots mapped: ${totalMapped}`);
    console.log(`Total skipped (already exist): ${totalSkipped}`);
    console.log(`Unique features detected: ${featureSet.size}`);
    console.log('\nDetected features:');
    Array.from(featureSet).sort().forEach(f => console.log(`  - ${f}`));

    // Get detailed mapping report
    console.log('\n' + '='.repeat(60));
    console.log('📈 MAPPING QUALITY');
    console.log('='.repeat(60));
    
    const report = await mapper.getMappingReport();
    console.log(`Mapping Rate: ${report.mappingRate}%`);
    console.log(`Mapped: ${report.mapped}/${report.total}`);
    console.log(`Unmapped: ${report.unmapped}`);
    
    console.log('\nBy Competitor:');
    Object.entries(report.byCompetitor).forEach(([name, stats]) => {
      const rate = stats.total > 0 ? Math.round((stats.mapped / stats.total) * 100) : 0;
      console.log(`  ${name}: ${stats.mapped}/${stats.total} (${rate}%)`);
    });

    console.log('\n' + '='.repeat(60));
    console.log('✨ Sync Complete!');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('\n❌ Sync failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main();

