import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('📋 Fetching all features from database...\n');

  try {
    const features = await prisma.feature.findMany({
      orderBy: { category: 'asc' }
    });

    console.log(`Found ${features.length} features:\n`);

    const byCategory: Record<string, typeof features> = {};
    
    features.forEach(feature => {
      const category = feature.category || 'Uncategorized';
      if (!byCategory[category]) {
        byCategory[category] = [];
      }
      byCategory[category].push(feature);
    });

    for (const [category, featureList] of Object.entries(byCategory)) {
      console.log(`\n📁 ${category}:`);
      featureList.forEach(f => {
        console.log(`   - ${f.name}`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main();

