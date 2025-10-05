import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Manuel atamalar - gerçek screenshot path'lerinden örnekler
const manualAssignments = [
  // BTC Turk - Web App screenshot'ları
  { path: 'uploads/screenshots/BTC Turk/IMG_7866.png', feature: 'Mobile App', competitor: 'BTCTurk' },
  { path: 'uploads/screenshots/BTC Turk/IMG_7867.png', feature: 'Mobile App', competitor: 'BTCTurk' },
  { path: 'uploads/screenshots/BTC Turk/IMG_7868.png', feature: 'Convert', competitor: 'BTCTurk' },
  { path: 'uploads/screenshots/BTC Turk/IMG_7869.png', feature: 'Convert', competitor: 'BTCTurk' },
  { path: 'uploads/screenshots/BTC Turk/IMG_7870.png', feature: 'On-Ramp / Off-Ramp (3rd Party)', competitor: 'BTCTurk' },
  { path: 'uploads/screenshots/BTC Turk/IMG_7871.png', feature: 'On-Ramp / Off-Ramp (3rd Party)', competitor: 'BTCTurk' },
  { path: 'uploads/screenshots/BTC Turk/IMG_7872.png', feature: 'Flexible Staking', competitor: 'BTCTurk' },
  { path: 'uploads/screenshots/BTC Turk/IMG_7873.png', feature: 'Academy for Logged-in User', competitor: 'BTCTurk' },
  { path: 'uploads/screenshots/BTC Turk/IMG_7874.png', feature: 'Referral', competitor: 'BTCTurk' },
  { path: 'uploads/screenshots/BTC Turk/IMG_7875.png', feature: 'Own Card', competitor: 'BTCTurk' },
  
  // Binance TR
  { path: 'uploads/screenshots/Binance TR/IMG_7843.png', feature: 'Mobile App', competitor: 'Binance TR' },
  { path: 'uploads/screenshots/Binance TR/IMG_7844.png', feature: 'Mobile App', competitor: 'Binance TR' },
  { path: 'uploads/screenshots/Binance TR/IMG_7854.png', feature: 'Convert', competitor: 'Binance TR' },
  { path: 'uploads/screenshots/Binance TR/IMG_7855.png', feature: 'Auto-Invest (DCA)', competitor: 'Binance TR' },
  { path: 'uploads/screenshots/Binance TR/IMG_7856.png', feature: 'Flexible Staking', competitor: 'Binance TR' },
  { path: 'uploads/screenshots/Binance TR/IMG_7857.png', feature: 'Copy Trading', competitor: 'Binance TR' },
  { path: 'uploads/screenshots/Binance TR/IMG_7858.png', feature: 'Academy for Logged-in User', competitor: 'Binance TR' },
  { path: 'uploads/screenshots/Binance TR/IMG_7859.png', feature: 'NFT / Marketplace', competitor: 'Binance TR' },
  
  // Garanti Kripto
  { path: 'uploads/screenshots/Garanti Kripto/IMG_7791.png', feature: 'Mobile App', competitor: 'Garanti Kripto' },
  { path: 'uploads/screenshots/Garanti Kripto/IMG_7792.png', feature: 'Mobile App', competitor: 'Garanti Kripto' },
  { path: 'uploads/screenshots/Garanti Kripto/IMG_7793.png', feature: 'Convert', competitor: 'Garanti Kripto' },
  { path: 'uploads/screenshots/Garanti Kripto/IMG_7794.png', feature: 'Convert', competitor: 'Garanti Kripto' },
  { path: 'uploads/screenshots/Garanti Kripto/IMG_7795.png', feature: 'On-Ramp / Off-Ramp (3rd Party)', competitor: 'Garanti Kripto' },
  { path: 'uploads/screenshots/Garanti Kripto/IMG_7796.png', feature: 'On-Ramp / Off-Ramp (3rd Party)', competitor: 'Garanti Kripto' },
  { path: 'uploads/screenshots/Garanti Kripto/IMG_7797.png', feature: 'Academy for Logged-in User', competitor: 'Garanti Kripto' },
  { path: 'uploads/screenshots/Garanti Kripto/IMG_7798.png', feature: 'Referral', competitor: 'Garanti Kripto' },
  { path: 'uploads/screenshots/Garanti Kripto/IMG_7799.png', feature: 'Sign in with Bank', competitor: 'Garanti Kripto' },
  { path: 'uploads/screenshots/Garanti Kripto/IMG_7801.png', feature: 'Sign up with Bank', competitor: 'Garanti Kripto' },
  { path: 'uploads/screenshots/Garanti Kripto/IMG_7802.png', feature: 'Sign up with Bank', competitor: 'Garanti Kripto' },
  { path: 'uploads/screenshots/Garanti Kripto/IMG_7803.png', feature: 'Own Card', competitor: 'Garanti Kripto' },
  
  // BTC Turk Onboarding
  { path: 'uploads/screenshots/BTC Turk/Onboarding/IMG_7860.png', feature: 'Sign in with Gmail', competitor: 'BTCTurk' },
  { path: 'uploads/screenshots/BTC Turk/Onboarding/IMG_7861.png', feature: 'Sign in with Apple', competitor: 'BTCTurk' },
  { path: 'uploads/screenshots/BTC Turk/Onboarding/IMG_7862.png', feature: 'Login with QR', competitor: 'BTCTurk' },
  { path: 'uploads/screenshots/BTC Turk/Onboarding/IMG_7863.png', feature: 'Login with QR', competitor: 'BTCTurk' },
  { path: 'uploads/screenshots/BTC Turk/Onboarding/IMG_7864.png', feature: 'Sign in with Passkey', competitor: 'BTCTurk' },
  { path: 'uploads/screenshots/BTC Turk/Onboarding/IMG_7865.png', feature: 'Sign in with Passkey', competitor: 'BTCTurk' },
  
  // Garanti Kripto Onboarding
  { path: 'uploads/screenshots/Garanti Kripto/Onboarding/IMG_7560.png', feature: 'Sign up with Bank', competitor: 'Garanti Kripto' },
  { path: 'uploads/screenshots/Garanti Kripto/Onboarding/IMG_7561.png', feature: 'Sign up with Bank', competitor: 'Garanti Kripto' },
  { path: 'uploads/screenshots/Garanti Kripto/Onboarding/IMG_7572.png', feature: 'Sign in with Bank', competitor: 'Garanti Kripto' },
  { path: 'uploads/screenshots/Garanti Kripto/Onboarding/IMG_7573.png', feature: 'Sign in with Bank', competitor: 'Garanti Kripto' },
  { path: 'uploads/screenshots/Garanti Kripto/Onboarding/IMG_7574.png', feature: 'Sign in with Bank', competitor: 'Garanti Kripto' },
  { path: 'uploads/screenshots/Garanti Kripto/Onboarding/IMG_7575.png', feature: 'Login with QR', competitor: 'Garanti Kripto' },
  { path: 'uploads/screenshots/Garanti Kripto/Onboarding/IMG_7576.png', feature: 'Login with QR', competitor: 'Garanti Kripto' },
  
  // OKX TR
  { path: 'uploads/screenshots/OKX TR/IMG_7837.png', feature: 'Mobile App', competitor: 'OKX TR' },
  { path: 'uploads/screenshots/OKX TR/IMG_7838.png', feature: 'Mobile App', competitor: 'OKX TR' },
  { path: 'uploads/screenshots/OKX TR/IMG_7839.png', feature: 'Convert', competitor: 'OKX TR' },
  { path: 'uploads/screenshots/OKX TR/IMG_7840.png', feature: 'Convert', competitor: 'OKX TR' },
  { path: 'uploads/screenshots/OKX TR/IMG_7841.png', feature: 'Copy Trading', competitor: 'OKX TR' },
  { path: 'uploads/screenshots/OKX TR/IMG_7842.png', feature: 'Copy Trading', competitor: 'OKX TR' },
  { path: 'uploads/screenshots/OKX TR/IMG_7721.png', feature: 'Auto-Invest (DCA)', competitor: 'OKX TR' },
  { path: 'uploads/screenshots/OKX TR/IMG_7722.png', feature: 'Auto-Invest (DCA)', competitor: 'OKX TR' },
  { path: 'uploads/screenshots/OKX TR/IMG_7753.png', feature: 'Academy for Logged-in User', competitor: 'OKX TR' },
  { path: 'uploads/screenshots/OKX TR/IMG_7754.png', feature: 'Academy for Logged-in User', competitor: 'OKX TR' },
  { path: 'uploads/screenshots/OKX TR/IMG_7755.png', feature: 'Flexible Staking', competitor: 'OKX TR' },
  { path: 'uploads/screenshots/OKX TR/IMG_7756.png', feature: 'Flexible Staking', competitor: 'OKX TR' },
  { path: 'uploads/screenshots/OKX TR/IMG_7757.png', feature: 'Referral', competitor: 'OKX TR' },
  { path: 'uploads/screenshots/OKX TR/IMG_7758.png', feature: 'Own Card', competitor: 'OKX TR' },
  { path: 'uploads/screenshots/OKX TR/IMG_7759.png', feature: 'Own Card', competitor: 'OKX TR' },
  { path: 'uploads/screenshots/OKX TR/IMG_7760.png', feature: 'NFT / Marketplace', competitor: 'OKX TR' },
  { path: 'uploads/screenshots/OKX TR/IMG_7761.png', feature: 'API Management', competitor: 'OKX TR' },
  { path: 'uploads/screenshots/OKX TR/IMG_7762.png', feature: 'API Management', competitor: 'OKX TR' },
  { path: 'uploads/screenshots/OKX TR/IMG_7763.png', feature: 'Pay (Payments)', competitor: 'OKX TR' },
  { path: 'uploads/screenshots/OKX TR/IMG_7764.png', feature: 'Social Feed (Square)', competitor: 'OKX TR' },
  { path: 'uploads/screenshots/OKX TR/IMG_7765.png', feature: 'Social Feed (Square)', competitor: 'OKX TR' },
  
  // OKX TR Onboarding
  { path: 'uploads/screenshots/OKX TR/Onboarding/IMG_7723.png', feature: 'Sign in with Gmail', competitor: 'OKX TR' },
  { path: 'uploads/screenshots/OKX TR/Onboarding/IMG_7724.png', feature: 'Sign in with Gmail', competitor: 'OKX TR' },
  { path: 'uploads/screenshots/OKX TR/Onboarding/IMG_7725.png', feature: 'Sign in with Apple', competitor: 'OKX TR' },
  { path: 'uploads/screenshots/OKX TR/Onboarding/IMG_7726.png', feature: 'Sign in with Apple', competitor: 'OKX TR' },
  { path: 'uploads/screenshots/OKX TR/Onboarding/IMG_7727.png', feature: 'Login with QR', competitor: 'OKX TR' },
  { path: 'uploads/screenshots/OKX TR/Onboarding/IMG_7728.png', feature: 'Login with QR', competitor: 'OKX TR' },
  { path: 'uploads/screenshots/OKX TR/Onboarding/IMG_7729.png', feature: 'Sign in with Passkey', competitor: 'OKX TR' },
  { path: 'uploads/screenshots/OKX TR/Onboarding/IMG_7730.png', feature: 'Sign in with Passkey', competitor: 'OKX TR' }
];

async function assignSpecificScreenshots() {
  console.log('🎯 Spesifik Screenshot Atamaları Başlıyor...\n');

  try {
    let assigned = 0;
    let skipped = 0;
    const assignments: Record<string, Record<string, number>> = {};

    for (const assignment of manualAssignments) {
      try {
        // Screenshot'ı bul
        const screenshot = await prisma.competitorFeatureScreenshot.findFirst({
          where: { screenshotPath: assignment.path },
          include: {
            competitorFeature: {
              include: {
                competitor: true,
                feature: true
              }
            }
          }
        });

        if (!screenshot) {
          console.log(`⚠️  Screenshot bulunamadı: ${assignment.path}`);
          skipped++;
          continue;
        }

        // Hedef feature'ı bul
        const targetFeature = await prisma.feature.findFirst({
          where: { name: assignment.feature }
        });

        if (!targetFeature) {
          console.log(`⚠️  Feature bulunamadı: ${assignment.feature}`);
          skipped++;
          continue;
        }

        // Zaten doğru feature'da mı?
        if (screenshot.competitorFeature.featureId === targetFeature.id) {
          skipped++;
          continue;
        }

        // Yeni CompetitorFeature ilişkisini bul veya oluştur
        let newCompetitorFeature = await prisma.competitorFeature.findFirst({
          where: {
            competitorId: screenshot.competitorFeature.competitorId,
            featureId: targetFeature.id
          }
        });

        if (!newCompetitorFeature) {
          newCompetitorFeature = await prisma.competitorFeature.create({
            data: {
              competitorId: screenshot.competitorFeature.competitorId,
              featureId: targetFeature.id,
              hasFeature: true,
              notes: 'Manually assigned screenshot'
            }
          });
        } else if (!newCompetitorFeature.hasFeature) {
          await prisma.competitorFeature.update({
            where: { id: newCompetitorFeature.id },
            data: { hasFeature: true }
          });
        }

        // Screenshot'ı yeniden ata
        await prisma.competitorFeatureScreenshot.update({
          where: { id: screenshot.id },
          data: { competitorFeatureId: newCompetitorFeature.id }
        });

        assigned++;

        // İstatistik için kaydet
        const competitorName = screenshot.competitorFeature.competitor.name;
        if (!assignments[competitorName]) {
          assignments[competitorName] = {};
        }
        assignments[competitorName][assignment.feature] = (assignments[competitorName][assignment.feature] || 0) + 1;

        console.log(`✅ ${competitorName}: ${screenshot.competitorFeature.feature.name} → ${assignment.feature}`);

      } catch (error) {
        console.error(`❌ Hata (${assignment.path}):`, error);
      }
    }

    // Özet rapor
    console.log('\n' + '='.repeat(60));
    console.log('📊 ATAMA ÖZETİ:');
    console.log(`   Başarıyla Atanan: ${assigned} screenshot`);
    console.log(`   Atlanan/Hatalı: ${skipped} screenshot\n`);

    if (Object.keys(assignments).length > 0) {
      console.log('📝 BORSA BAZINDA ATAMALAR:\n');
      
      for (const [competitor, features] of Object.entries(assignments)) {
        console.log(`🏢 ${competitor}:`);
        for (const [feature, count] of Object.entries(features)) {
          console.log(`   ${feature}: ${count} screenshot`);
        }
        console.log('');
      }
    }

    // Feature coverage güncelle
    console.log('🔄 Feature coverage güncelleniyor...');
    
    const competitors = await prisma.competitor.findMany();
    for (const competitor of competitors) {
      const featureCount = await prisma.competitorFeature.count({
        where: {
          competitorId: competitor.id,
          hasFeature: true
        }
      });

      const totalFeatures = await prisma.feature.count();
      const coverage = Math.round((featureCount / totalFeatures) * 100 * 10) / 10;

      await prisma.competitor.update({
        where: { id: competitor.id },
        data: {
          description: `${competitor.industry || 'Crypto Exchange'} - Coverage: ${coverage}%`
        }
      });
    }

    console.log('✅ Feature coverage güncellendi');

  } catch (error) {
    console.error('❌ Kritik hata:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ana fonksiyonu çalıştır
assignSpecificScreenshots()
  .then(() => {
    console.log('\n✅ Spesifik screenshot atamaları tamamlandı!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Kritik hata:', error);
    process.exit(1);
  });
