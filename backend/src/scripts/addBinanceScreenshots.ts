import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Binance screenshot mappings
const binanceScreenshotMapping: Record<string, string[]> = {
  // AI Sentimentals - AI Tool klasöründeki görseller
  'AI Sentimentals': [
    'uploads/screenshots/Binance/AI Tool/IMG_7691.png',
    'uploads/screenshots/Binance/AI Tool/IMG_7692.png',
    'uploads/screenshots/Binance/AI Tool/IMG_7693.png',
    'uploads/screenshots/Binance/AI Tool/IMG_7694.png'
  ],
};

async function main() {
  console.log('🚀 Adding Binance screenshots to database...\n');

  try {
    // Binance'i bul
    const binance = await prisma.competitor.findFirst({
      where: { 
        OR: [
          { name: 'Binance Global' },
          { name: { contains: 'Binance' } }
        ]
      }
    });

    if (!binance) {
      console.log('❌ Binance not found in database!');
      return;
    }

    console.log(`✅ Found Binance: ${binance.name} (${binance.id})\n`);

    let totalAdded = 0;

    // Her feature için screenshot'ları ekle
    for (const [featureName, screenshotPaths] of Object.entries(binanceScreenshotMapping)) {
      if (screenshotPaths.length === 0) {
        continue;
      }

      // Feature'ı bul
      const feature = await prisma.feature.findUnique({
        where: { name: featureName }
      });

      if (!feature) {
        console.log(`   ⚠️  Feature not found: ${featureName}`);
        continue;
      }

      // CompetitorFeature ilişkisini getir veya oluştur
      const competitorFeature = await prisma.competitorFeature.upsert({
        where: {
          competitorId_featureId: {
            competitorId: binance.id,
            featureId: feature.id
          }
        },
        update: {
          hasFeature: true,
          implementationQuality: 'good'
        },
        create: {
          competitorId: binance.id,
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
      for (let i = 0; i < screenshotPaths.length; i++) {
        const screenshotPath = screenshotPaths[i];
        
        await prisma.competitorFeatureScreenshot.create({
          data: {
            competitorFeatureId: competitorFeature.id,
            screenshotPath,
            displayOrder: i,
            caption: `${featureName} - Screenshot ${i + 1}`
          }
        });
      }

      totalAdded += screenshotPaths.length;
      console.log(`   ✅ ${featureName}: ${screenshotPaths.length} screenshots added`);
    }

    console.log(`\n📊 Total screenshots added: ${totalAdded}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();


