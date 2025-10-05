import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Verifying Coinbase data in database...\n');

  try {
    // Coinbase competitor'ını çek
    const coinbase = await prisma.competitor.findUnique({
      where: { name: 'Coinbase' },
      include: {
        features: {
          include: {
            feature: true
          },
          where: {
            hasFeature: true
          }
        }
      }
    });

    if (!coinbase) {
      console.log('❌ Coinbase not found in database!');
      return;
    }

    console.log(`✅ Found Coinbase competitor`);
    console.log(`   ID: ${coinbase.id}`);
    console.log(`   Website: ${coinbase.website}`);
    console.log(`   Description: ${coinbase.description}\n`);

    console.log(`📊 Coinbase has ${coinbase.features.length} features with screenshots:\n`);

    // Her feature'ı kategorilere ayır
    const byCategory: Record<string, typeof coinbase.features> = {};
    
    coinbase.features.forEach(cf => {
      const category = cf.feature.category || 'Uncategorized';
      if (!byCategory[category]) {
        byCategory[category] = [];
      }
      byCategory[category].push(cf);
    });

    // Kategorilere göre yazdır
    for (const [category, features] of Object.entries(byCategory)) {
      console.log(`\n📁 ${category}:`);
      features.forEach(cf => {
        const screenshots = (cf.screenshots as any[]) || [];
        console.log(`   ✅ ${cf.feature.name}`);
        console.log(`      - Quality: ${cf.implementationQuality}`);
        console.log(`      - Screenshots: ${screenshots.length}`);
        if (cf.notes) {
          console.log(`      - Notes: ${cf.notes}`);
        }
      });
    }

    // İstatistikler
    console.log(`\n\n📈 Summary Statistics:`);
    console.log(`   Total Features: ${coinbase.features.length}`);
    
    const totalScreenshots = coinbase.features.reduce((acc, cf) => {
      const screenshots = (cf.screenshots as any[]) || [];
      return acc + screenshots.length;
    }, 0);
    console.log(`   Total Screenshots: ${totalScreenshots}`);

    const qualityDist = coinbase.features.reduce((acc: any, cf) => {
      const quality = cf.implementationQuality || 'unknown';
      acc[quality] = (acc[quality] || 0) + 1;
      return acc;
    }, {});
    console.log(`   Quality Distribution:`);
    for (const [quality, count] of Object.entries(qualityDist)) {
      console.log(`      - ${quality}: ${count}`);
    }

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .then(() => {
    console.log('\n✅ Verification complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Verification failed:', error);
    process.exit(1);
  });

