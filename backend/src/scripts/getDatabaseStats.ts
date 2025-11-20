import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function getStats() {
  try {
    const competitors = await prisma.competitor.count();
    const features = await prisma.feature.count();
    const competitorFeatures = await prisma.competitorFeature.count();
    const screenshotsV2 = await prisma.screenshot.count();
    const screenshotsV1 = await prisma.competitorFeatureScreenshot.count();
    const orphanScreenshots = await prisma.screenshot.count({
      where: { featureId: null, isOnboarding: false }
    });
    
    // En fazla feature'a sahip borsalar
    const topCompetitors = await prisma.competitor.findMany({
      include: {
        features: {
          where: { hasFeature: true }
        }
      },
      take: 5
    });
    
    // Feature kategorileri
    const categories = await prisma.feature.groupBy({
      by: ['category'],
      _count: true
    });
    
    console.log('\n📊 DATABASE İSTATİSTİKLERİ');
    console.log('═'.repeat(60));
    console.log('🏢 Borsalar:', competitors);
    console.log('⭐ Feature\'lar:', features);
    console.log('🔗 Feature İlişkileri:', competitorFeatures);
    console.log('');
    console.log('📸 Screenshot\'lar:');
    console.log('   - V2 (yeni model):', screenshotsV2);
    console.log('   - V1 (eski model):', screenshotsV1);
    console.log('   - Toplam:', screenshotsV2 + screenshotsV1);
    console.log('   - Orphan (feature\'sız):', orphanScreenshots);
    console.log('');
    console.log('🏆 En Fazla Feature\'a Sahip Borsalar:');
    topCompetitors
      .sort((a, b) => b.features.length - a.features.length)
      .forEach((c, i) => {
        const percentage = features > 0 ? Math.round((c.features.length / features) * 100) : 0;
        console.log(`   ${i+1}. ${c.name}: ${c.features.length} feature (${percentage}%)`);
      });
    console.log('');
    console.log('📁 Feature Kategorileri:');
    categories
      .sort((a, b) => b._count - a._count)
      .forEach((cat) => {
        console.log(`   - ${cat.category || 'N/A'}: ${cat._count} feature`);
      });
    console.log('═'.repeat(60));
    
  } catch (error) {
    console.error('Hata:', error);
  } finally {
    await prisma.$disconnect();
  }
}

getStats();

