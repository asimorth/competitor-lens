import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function generateScreenshotDistributionReport() {
  console.log('📊 SCREENSHOT DAĞILIM RAPORU\n');
  console.log('='.repeat(80));

  try {
    // Borsa bazında screenshot dağılımı
    const competitors = await prisma.competitor.findMany({
      orderBy: { name: 'asc' },
      include: {
        features: {
          include: {
            feature: true,
            _count: {
              select: { screenshots: true }
            }
          },
          where: {
            screenshots: {
              some: {}
            }
          }
        }
      }
    });

    console.log('\n🏢 BORSA BAZINDA SCREENSHOT DAĞILIMI:\n');

    for (const competitor of competitors) {
      const totalScreenshots = competitor.features.reduce((sum, cf) => sum + cf._count.screenshots, 0);
      
      if (totalScreenshots > 0) {
        console.log(`\n${competitor.name} (Toplam: ${totalScreenshots} screenshot)`);
        console.log('-'.repeat(50));
        
        const sortedFeatures = competitor.features
          .sort((a, b) => b._count.screenshots - a._count.screenshots);
        
        for (const cf of sortedFeatures) {
          const percentage = ((cf._count.screenshots / totalScreenshots) * 100).toFixed(1);
          console.log(`  ${cf.feature.name}: ${cf._count.screenshots} (${percentage}%)`);
        }
      }
    }

    // Feature bazında toplam dağılım
    console.log('\n\n📈 FEATURE BAZINDA TOPLAM DAĞILIM:\n');
    
    const featureStats = await prisma.feature.findMany({
      include: {
        competitors: {
          include: {
            _count: {
              select: { screenshots: true }
            },
            competitor: true
          },
          where: {
            screenshots: {
              some: {}
            }
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    const featureWithScreenshots = featureStats
      .map(f => ({
        name: f.name,
        category: f.category,
        totalScreenshots: f.competitors.reduce((sum, cf) => sum + cf._count.screenshots, 0),
        competitors: f.competitors.map(cf => ({
          name: cf.competitor.name,
          count: cf._count.screenshots
        }))
      }))
      .filter(f => f.totalScreenshots > 0)
      .sort((a, b) => b.totalScreenshots - a.totalScreenshots);

    console.log('Feature Name | Kategori | Toplam | Dağılım');
    console.log('-'.repeat(80));

    for (const feature of featureWithScreenshots) {
      const competitorList = feature.competitors
        .sort((a, b) => b.count - a.count)
        .map(c => `${c.name}(${c.count})`)
        .join(', ');
      
      console.log(`${feature.name.padEnd(30)} | ${(feature.category || '-').padEnd(15)} | ${feature.totalScreenshots.toString().padEnd(6)} | ${competitorList}`);
    }

    // Kategori bazında özet
    console.log('\n\n📂 KATEGORİ BAZINDA ÖZET:\n');
    
    const categoryStats = new Map<string, number>();
    featureWithScreenshots.forEach(f => {
      const category = f.category || 'Uncategorized';
      categoryStats.set(category, (categoryStats.get(category) || 0) + f.totalScreenshots);
    });

    [...categoryStats.entries()]
      .sort((a, b) => b[1] - a[1])
      .forEach(([category, count]) => {
        console.log(`  ${category}: ${count} screenshot`);
      });

    // Screenshot path analizi
    console.log('\n\n🔍 SCREENSHOT PATH ANALİZİ:\n');
    
    const pathPatterns = await prisma.$queryRaw<Array<{path: string, count: bigint}>>`
      SELECT 
        SUBSTRING(screenshot_path FROM '([^/]+)/[^/]+$') as path,
        COUNT(*) as count
      FROM "competitor_feature_screenshots"
      GROUP BY path
      ORDER BY count DESC
      LIMIT 20
    `;

    console.log('Klasör Yapısı | Adet');
    console.log('-'.repeat(40));
    pathPatterns.forEach(p => {
      if (p.path) {
        console.log(`${p.path.padEnd(25)} | ${p.count}`);
      }
    });

    // Onboarding özel raporu
    const onboardingScreenshots = await prisma.competitorFeatureScreenshot.findMany({
      where: {
        screenshotPath: {
          contains: 'Onboarding',
          mode: 'insensitive'
        }
      },
      include: {
        competitorFeature: {
          include: {
            competitor: true,
            feature: true
          }
        }
      }
    });

    if (onboardingScreenshots.length > 0) {
      console.log('\n\n🎯 ONBOARDING SCREENSHOT DETAYI:\n');
      
      const onboardingByCompetitor = new Map<string, number>();
      onboardingScreenshots.forEach(s => {
        const competitor = s.competitorFeature.competitor.name;
        onboardingByCompetitor.set(competitor, (onboardingByCompetitor.get(competitor) || 0) + 1);
      });

      [...onboardingByCompetitor.entries()]
        .sort((a, b) => b[1] - a[1])
        .forEach(([competitor, count]) => {
          console.log(`  ${competitor}: ${count} onboarding screenshot`);
        });
    }

  } catch (error) {
    console.error('❌ Hata:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Raporu çalıştır
generateScreenshotDistributionReport()
  .then(() => {
    console.log('\n✅ Rapor tamamlandı!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Kritik hata:', error);
    process.exit(1);
  });
