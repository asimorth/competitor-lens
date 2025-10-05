import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

// Feature mapping - klasör ve dosya isimlerine göre
const featureMappings: Record<string, string[]> = {
  // Authentication
  'Sign in with Passkey': ['passkey', 'passkeys', 'sign-in-with-passkey'],
  'Sign in with Gmail': ['gmail', 'google', 'sign-in-with-gmail', 'google-login'],
  'Sign in with Apple': ['apple', 'sign-in-with-apple', 'apple-login'],
  'Sign in with Bank': ['bank-login', 'bank-sign', 'sign-in-with-bank'],
  'Sign up with Bank': ['bank-register', 'bank-signup', 'sign-up-with-bank'],
  'Login with QR': ['qr', 'qr-code', 'qr-login', 'login-with-qr'],
  'Onboarding': ['onboarding', 'onboard', 'welcome', 'signup', 'register', 'getting-started'],
  
  // Platform
  'Mobile App': ['mobile', 'ios', 'android', 'iphone', 'mobile-app'],
  'Web App': ['web', 'desktop', 'browser', 'web-app'],
  
  // Trading
  'Auto-Invest (DCA)': ['auto-invest', 'dca', 'recurring', 'dollar-cost', 'autoinvest'],
  'Convert': ['convert', 'swap', 'exchange', 'conversion'],
  'Copy Trading': ['copy', 'copy-trade', 'copy-trading', 'social-trading'],
  'API Management': ['api', 'developer', 'api-management', 'api-key'],
  
  // Earn & Stake
  'Flexible Staking': ['staking', 'stake', 'earn', 'flexible-staking', 'rewards'],
  'Locked Staking': ['locked-staking', 'fixed-staking', 'term-staking'],
  
  // AI & Tools
  'AI Sentimentals': ['ai', 'ai-tool', 'artificial', 'sentiment', 'ai-sentimentals'],
  'Academy for Logged-in User': ['academy', 'learn', 'education', 'tutorial', 'guide'],
  
  // Finance
  'Own Card': ['card', 'debit-card', 'credit-card', 'visa', 'mastercard'],
  'Own Chain': ['chain', 'blockchain', 'network', 'own-chain'],
  'Own Stablecoin': ['stablecoin', 'stable-coin', 'usdt', 'usdc', 'busd'],
  'Pay (Payments)': ['pay', 'payment', 'checkout', 'merchant', 'payments'],
  'On-Ramp / Off-Ramp (3rd Party)': ['onramp', 'offramp', 'on-ramp', 'off-ramp', 'fiat', 'deposit', 'withdraw'],
  
  // Marketing
  'Referral': ['referral', 'refer', 'invite', 'friend', 'bonus'],
  'Affiliate (KOL Program)': ['affiliate', 'kol', 'influencer', 'partner'],
  
  // NFT & Gaming
  'NFT / Marketplace': ['nft', 'marketplace', 'collectible', 'opensea'],
  'Gamification': ['game', 'gamification', 'reward', 'achievement', 'badge'],
  
  // Launch
  'Launchpool / Launchpad': ['launchpool', 'launchpad', 'ico', 'ido', 'launch'],
  
  // Social
  'Social Feed (Square)': ['social', 'feed', 'square', 'community', 'post']
};

// Dosya/klasör isminden feature tahmin et
function guessFeatureFromPath(filePath: string): string | null {
  const pathLower = filePath.toLowerCase();
  const pathParts = pathLower.split(/[\/\\]/);
  
  // Önce tam eşleşme ara
  for (const [featureName, keywords] of Object.entries(featureMappings)) {
    for (const keyword of keywords) {
      // Klasör veya dosya ismi tam eşleşme
      if (pathParts.some(part => part === keyword || part.replace(/[-_]/g, ' ') === keyword)) {
        return featureName;
      }
    }
  }
  
  // Sonra kısmi eşleşme
  for (const [featureName, keywords] of Object.entries(featureMappings)) {
    for (const keyword of keywords) {
      if (pathParts.some(part => part.includes(keyword) || keyword.includes(part))) {
        return featureName;
      }
    }
  }
  
  // Son olarak dosya isminde ara
  const fileName = path.basename(pathLower);
  for (const [featureName, keywords] of Object.entries(featureMappings)) {
    for (const keyword of keywords) {
      if (fileName.includes(keyword.replace(' ', '-')) || fileName.includes(keyword.replace(' ', '_'))) {
        return featureName;
      }
    }
  }
  
  return null;
}

// Screenshot'ları analiz et ve ata
async function analyzeAndAssignScreenshots() {
  console.log('🔍 Screenshot Analizi ve Feature Ataması Başlıyor...\n');

  try {
    // Tüm screenshot'ları al
    const screenshots = await prisma.competitorFeatureScreenshot.findMany({
      include: {
        competitorFeature: {
          include: {
            competitor: true,
            feature: true
          }
        }
      }
    });

    console.log(`📸 Toplam ${screenshots.length} screenshot bulundu\n`);

    const assignments: Record<string, { from: string; to: string; count: number }[]> = {};
    let reassigned = 0;
    let kept = 0;

    for (const screenshot of screenshots) {
      const currentFeature = screenshot.competitorFeature.feature.name;
      const competitorName = screenshot.competitorFeature.competitor.name;
      const guessedFeature = guessFeatureFromPath(screenshot.screenshotPath);

      if (guessedFeature && guessedFeature !== currentFeature) {
        // Yeni feature'ı bul
        const newFeature = await prisma.feature.findFirst({
          where: { name: guessedFeature }
        });

        if (newFeature) {
          // Yeni CompetitorFeature ilişkisini bul veya oluştur
          let newCompetitorFeature = await prisma.competitorFeature.findFirst({
            where: {
              competitorId: screenshot.competitorFeature.competitorId,
              featureId: newFeature.id
            }
          });

          if (!newCompetitorFeature) {
            newCompetitorFeature = await prisma.competitorFeature.create({
              data: {
                competitorId: screenshot.competitorFeature.competitorId,
                featureId: newFeature.id,
                hasFeature: true,
                notes: 'Auto-detected from screenshots'
              }
            });
          } else if (!newCompetitorFeature.hasFeature) {
            // Feature var ama hasFeature false ise true yap
            await prisma.competitorFeature.update({
              where: { id: newCompetitorFeature.id },
              data: { hasFeature: true }
            });
          }

          // Screenshot'ı yeni feature'a taşı
          await prisma.competitorFeatureScreenshot.update({
            where: { id: screenshot.id },
            data: { competitorFeatureId: newCompetitorFeature.id }
          });

          reassigned++;

          // Tracking için kaydet
          const key = competitorName;
          if (!assignments[key]) {
            assignments[key] = [];
          }
          
          const existing = assignments[key].find(a => a.from === currentFeature && a.to === guessedFeature);
          if (existing) {
            existing.count++;
          } else {
            assignments[key].push({ from: currentFeature, to: guessedFeature, count: 1 });
          }

          // Progress log
          if (reassigned % 50 === 0) {
            console.log(`   ✅ ${reassigned} screenshot yeniden atandı...`);
          }
        }
      } else {
        kept++;
      }
    }

    // Özet rapor
    console.log('\n' + '='.repeat(60));
    console.log('📊 ATAMA ÖZETİ:');
    console.log(`   Yeniden Atanan: ${reassigned} screenshot`);
    console.log(`   Değişmeyen: ${kept} screenshot`);
    console.log(`   Başarı Oranı: ${Math.round((reassigned / screenshots.length) * 100)}%`);

    if (Object.keys(assignments).length > 0) {
      console.log('\n📝 DETAYLI DEĞİŞİKLİKLER:\n');
      
      for (const [competitor, changes] of Object.entries(assignments)) {
        console.log(`🏢 ${competitor}:`);
        changes.sort((a, b) => b.count - a.count);
        
        for (const change of changes) {
          console.log(`   ${change.from} → ${change.to}: ${change.count} görsel`);
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

    // En çok screenshot'a sahip feature'lar
    console.log('\n📈 EN ÇOK SCREENSHOT\'A SAHİP FEATURE\'LAR:\n');
    const featureStats = await prisma.competitorFeature.findMany({
      select: {
        feature: { select: { name: true } },
        competitor: { select: { name: true } },
        _count: { select: { screenshots: true } }
      },
      where: {
        screenshots: { some: {} }
      },
      orderBy: {
        screenshots: { _count: 'desc' }
      },
      take: 20
    });

    const featureGroups = new Map<string, number>();
    featureStats.forEach(stat => {
      const current = featureGroups.get(stat.feature.name) || 0;
      featureGroups.set(stat.feature.name, current + stat._count.screenshots);
    });

    [...featureGroups.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .forEach(([feature, count]) => {
        console.log(`   ${feature}: ${count} screenshot`);
      });

    // Onboarding özel kontrolü
    const onboardingCount = await prisma.competitorFeatureScreenshot.count({
      where: {
        screenshotPath: {
          contains: 'onboarding',
          mode: 'insensitive'
        }
      }
    });

    if (onboardingCount > 0) {
      console.log(`\n🎯 Onboarding Screenshot'ları: ${onboardingCount} adet`);
    }

  } catch (error) {
    console.error('❌ Hata:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ana fonksiyonu çalıştır
analyzeAndAssignScreenshots()
  .then(() => {
    console.log('\n✅ Screenshot analizi ve atama tamamlandı!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Kritik hata:', error);
    process.exit(1);
  });
