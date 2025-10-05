import { PrismaClient } from '@prisma/client';
import * as path from 'path';

const prisma = new PrismaClient();

// Feature mapping based on folder names and keywords
const featureMappings: Record<string, string[]> = {
  'Sign in with Passkey': ['passkey', 'passkeys'],
  'Sign in with Gmail': ['gmail', 'google'],
  'Sign in with Apple': ['apple'],
  'Sign in with Bank': ['bank login', 'bank sign'],
  'Sign up with Bank': ['bank register', 'bank signup'],
  'Login with QR': ['qr', 'qr code'],
  'Mobile App': ['mobile', 'ios', 'android', 'iphone'],
  'Web App': ['web', 'desktop'],
  'Auto-Invest (DCA)': ['auto invest', 'dca', 'recurring'],
  'Convert': ['convert', 'swap'],
  'Copy Trading': ['copy', 'copy trade'],
  'Flexible Staking': ['staking', 'stake', 'earn'],
  'Locked Staking': ['locked staking', 'fixed staking'],
  'AI Sentimentals': ['ai', 'ai tool', 'artificial'],
  'Academy for Logged-in User': ['academy', 'learn', 'education'],
  'Own Card': ['card', 'debit card', 'credit card'],
  'Own Chain': ['chain', 'blockchain'],
  'Own Stablecoin': ['stablecoin', 'stable coin', 'usdt', 'usdc'],
  'Pay (Payments)': ['pay', 'payment', 'checkout'],
  'On-Ramp / Off-Ramp (3rd Party)': ['onramp', 'offramp', 'on-ramp', 'off-ramp', 'fiat'],
  'Referral': ['referral', 'refer', 'invite'],
  'Affiliate (KOL Program)': ['affiliate', 'kol'],
  'NFT / Marketplace': ['nft', 'marketplace'],
  'Gamification': ['game', 'gamification', 'reward'],
  'Launchpool / Launchpad': ['launchpool', 'launchpad', 'ico'],
  'Social Feed (Square)': ['social', 'feed', 'square'],
  'API Management': ['api', 'developer'],
  'Onboarding': ['onboarding', 'onboard', 'welcome', 'signup', 'register']
};

// Klasör veya dosya ismine göre feature tahmin et
function guessFeatureFromPath(filePath: string): string | null {
  const pathLower = filePath.toLowerCase();
  
  // Önce klasör isimlerinden exact match ara
  for (const [featureName, keywords] of Object.entries(featureMappings)) {
    for (const keyword of keywords) {
      if (pathLower.includes(`/${keyword}/`) || pathLower.includes(`\\${keyword}\\`)) {
        return featureName;
      }
    }
  }
  
  // Sonra dosya isminde ara
  const fileName = path.basename(pathLower);
  for (const [featureName, keywords] of Object.entries(featureMappings)) {
    for (const keyword of keywords) {
      if (fileName.includes(keyword.replace(' ', '_')) || fileName.includes(keyword.replace(' ', '-'))) {
        return featureName;
      }
    }
  }
  
  // Özel durumlar
  if (pathLower.includes('onboarding')) return 'Onboarding';
  if (pathLower.includes('ai tool')) return 'AI Sentimentals';
  
  return null;
}

async function main() {
  console.log('🔧 Fixing screenshot assignments...\n');

  try {
    // Tüm screenshot'ları competitor feature'larıyla birlikte çek
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

    console.log(`📸 Found ${screenshots.length} screenshots to process\n`);

    let reassigned = 0;
    let kept = 0;
    const updates: Map<string, string[]> = new Map();

    for (const screenshot of screenshots) {
      const currentFeature = screenshot.competitorFeature.feature.name;
      const guessedFeature = guessFeatureFromPath(screenshot.screenshotPath);
      
      if (guessedFeature && guessedFeature !== currentFeature) {
        // Yeni feature'ı bul
        const newFeature = await prisma.feature.findFirst({
          where: { name: guessedFeature }
        });
        
        if (newFeature) {
          // CompetitorFeature ilişkisini bul veya oluştur
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
          }
          
          // Screenshot'ı yeni feature'a taşı
          await prisma.competitorFeatureScreenshot.update({
            where: { id: screenshot.id },
            data: { competitorFeatureId: newCompetitorFeature.id }
          });
          
          reassigned++;
          
          // Update tracking
          const key = `${screenshot.competitorFeature.competitor.name} - ${currentFeature} → ${guessedFeature}`;
          if (!updates.has(key)) {
            updates.set(key, []);
          }
          updates.get(key)!.push(path.basename(screenshot.screenshotPath));
        }
      } else {
        kept++;
      }
    }

    // Özet
    console.log('\n' + '='.repeat(50));
    console.log('📊 Summary:');
    console.log(`   Reassigned: ${reassigned} screenshots`);
    console.log(`   Kept: ${kept} screenshots`);
    
    if (updates.size > 0) {
      console.log('\n📝 Changes made:');
      for (const [change, files] of updates.entries()) {
        console.log(`\n   ${change}:`);
        files.slice(0, 5).forEach(f => console.log(`      - ${f}`));
        if (files.length > 5) {
          console.log(`      ... and ${files.length - 5} more`);
        }
      }
    }

    // Feature başına screenshot sayısı
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
      }
    });

    console.log('\n📈 Screenshots by Feature:');
    const featureGroups = new Map<string, number>();
    featureStats.forEach(stat => {
      const current = featureGroups.get(stat.feature.name) || 0;
      featureGroups.set(stat.feature.name, current + stat._count.screenshots);
    });
    
    [...featureGroups.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .forEach(([feature, count]) => {
        console.log(`   ${feature}: ${count} screenshots`);
      });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error);
