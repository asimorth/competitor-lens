// Local'den Prisma Postgres'e Veri Kopyalama
import { PrismaClient } from '@prisma/client';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// İki ayrı Prisma Client instance'ı oluşturmak yerine
// environment variable ile çalışacağız
async function getLocalData() {
  const { PrismaClient: LocalClient } = await import('@prisma/client');
  const client = new LocalClient();
  return client;
}

async function getPrismaPostgresClient() {
  const { PrismaClient: RemoteClient } = await import('@prisma/client');
  const client = new RemoteClient();
  return client;
}

async function copyData() {
  console.log('🚀 Veri kopyalama başlıyor...\n');

  try {
    // 1. Competitors
    console.log('📋 Competitors kopyalanıyor...');
    const competitors = await localPrisma.competitor.findMany();
    console.log(`   Bulunan: ${competitors.length} competitor`);
    
    for (const competitor of competitors) {
      await prismaPrisma.competitor.upsert({
        where: { id: competitor.id },
        update: competitor,
        create: competitor
      });
    }
    console.log('   ✅ Competitors kopyalandı\n');

    // 2. Features
    console.log('📋 Features kopyalanıyor...');
    const features = await localPrisma.feature.findMany();
    console.log(`   Bulunan: ${features.length} feature`);
    
    for (const feature of features) {
      await prismaPrisma.feature.upsert({
        where: { id: feature.id },
        update: feature,
        create: feature
      });
    }
    console.log('   ✅ Features kopyalandı\n');

    // 3. CompetitorFeatures
    console.log('📋 CompetitorFeatures kopyalanıyor...');
    const competitorFeatures = await localPrisma.competitorFeature.findMany();
    console.log(`   Bulunan: ${competitorFeatures.length} competitor-feature ilişkisi`);
    
    for (const cf of competitorFeatures) {
      await prismaPrisma.competitorFeature.upsert({
        where: { id: cf.id },
        update: cf,
        create: cf
      });
    }
    console.log('   ✅ CompetitorFeatures kopyalandı\n');

    // 4. Screenshots
    console.log('📋 Screenshots kopyalanıyor...');
    const screenshots = await localPrisma.screenshot.findMany();
    console.log(`   Bulunan: ${screenshots.length} screenshot`);
    
    for (const screenshot of screenshots) {
      await prismaPrisma.screenshot.upsert({
        where: { id: screenshot.id },
        update: screenshot,
        create: screenshot
      });
    }
    console.log('   ✅ Screenshots kopyalandı\n');

    // 5. OnboardingScreenshots
    console.log('📋 OnboardingScreenshots kopyalanıyor...');
    const onboardingScreenshots = await localPrisma.onboardingScreenshot.findMany();
    console.log(`   Bulunan: ${onboardingScreenshots.length} onboarding screenshot`);
    
    for (const os of onboardingScreenshots) {
      await prismaPrisma.onboardingScreenshot.upsert({
        where: { id: os.id },
        update: os,
        create: os
      });
    }
    console.log('   ✅ OnboardingScreenshots kopyalandı\n');

    // 6. CompetitorFeatureScreenshots
    console.log('📋 CompetitorFeatureScreenshots kopyalanıyor...');
    const cfScreenshots = await localPrisma.competitorFeatureScreenshot.findMany();
    console.log(`   Bulunan: ${cfScreenshots.length} competitor-feature-screenshot`);
    
    for (const cfs of cfScreenshots) {
      await prismaPrisma.competitorFeatureScreenshot.upsert({
        where: { id: cfs.id },
        update: cfs,
        create: cfs
      });
    }
    console.log('   ✅ CompetitorFeatureScreenshots kopyalandı\n');

    console.log('🎉 Tüm veri başarıyla kopyalandı!\n');
    
    // Test
    const count = await prismaPrisma.competitor.count();
    console.log(`✅ Prisma Postgres'te ${count} competitor var`);

  } catch (error) {
    console.error('❌ Hata:', error);
  } finally {
    await localPrisma.$disconnect();
    await prismaPrisma.$disconnect();
  }
}

copyData();

