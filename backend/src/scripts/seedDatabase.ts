import { PrismaClient } from '@prisma/client';
import * as path from 'path';
import * as fs from 'fs';

const prisma = new PrismaClient();

async function seedDatabase() {
  console.log('🌱 Starting database seeding...\n');

  try {
    // Check if we need to seed
    const competitorCount = await prisma.competitor.count();
    const featureCount = await prisma.feature.count();

    console.log(`Current database state:`);
    console.log(`  - Competitors: ${competitorCount}`);
    console.log(`  - Features: ${featureCount}\n`);

    if (competitorCount > 0 && featureCount > 0) {
      console.log('✅ Database already seeded. Skipping...\n');
      console.log('💡 Tip: To re-seed, run: npm run db:reset\n');
      return;
    }

    console.log('📊 Seeding will import data from:');
    console.log('  1. Excel file: Matrix/feature_matrix_FINAL_v3.xlsx');
    console.log('  2. Screenshots: uploads/screenshots/\n');

    // Import Excel data
    console.log('🔄 Step 1: Importing Excel matrix data...');
    const excelPath = path.join(process.cwd(), 'Matrix', 'feature_matrix_FINAL_v3.xlsx');
    
    if (!fs.existsSync(excelPath)) {
      console.log('⚠️  Excel file not found. Please ensure it exists at:');
      console.log(`   ${excelPath}\n`);
      console.log('You can run the import scripts manually:');
      console.log('   npm run import:excel');
      console.log('   npm run import:screenshots:smart\n');
      return;
    }

    console.log('✅ Excel file found. Ready to import.\n');

    // Verify screenshots directory
    const screenshotsPath = path.join(process.cwd(), 'uploads', 'screenshots');
    if (fs.existsSync(screenshotsPath)) {
      const screenshotCount = fs.readdirSync(screenshotsPath).length;
      console.log(`✅ Screenshots directory found with ${screenshotCount} items.\n`);
    } else {
      console.log('⚠️  Screenshots directory not found.\n');
    }

    // Final check
    console.log('✅ Database seed check completed!\n');
    console.log('📝 Next steps:');
    console.log('   1. Run: npm run import:excel');
    console.log('   2. Run: npm run import:screenshots:smart');
    console.log('   3. Verify: Check /api/competitors and /api/features\n');

  } catch (error) {
    console.error('❌ Seed failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seedDatabase().catch((error) => {
  console.error(error);
  process.exit(1);
});

