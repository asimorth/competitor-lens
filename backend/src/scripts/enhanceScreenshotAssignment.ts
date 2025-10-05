import { PrismaClient } from '@prisma/client';
import * as path from 'path';

const prisma = new PrismaClient();

// Gelişmiş feature mapping
const enhancedFeatureMappings = {
  // Onboarding alt kategorileri
  'Sign up with Bank': ['bank-register', 'bank-signup', 'banka-ile-kayit', 'banka-kayit'],
  'Sign in with Bank': ['bank-login', 'bank-sign', 'banka-giris', 'banka-ile-giris'],
  'Sign in with Gmail': ['google', 'gmail', 'google-login', 'google-ile-giris'],
  'Sign in with Apple': ['apple', 'apple-login', 'apple-ile-giris'],
  'Login with QR': ['qr', 'qr-code', 'qr-login', 'qr-ile-giris'],
  'Sign in with Passkey': ['passkey', 'passkeys', 'touch-id', 'face-id'],
  
  // Kraken özel
  'Mobile App': ['kraken.*mobile', 'kraken.*ios', 'kraken.*android'],
  
  // Coinbase özel
  'Convert': ['coinbase.*convert', 'coinbase.*swap'],
  'Copy Trading': ['coinbase.*copy'],
  'Auto-Invest (DCA)': ['coinbase.*auto', 'coinbase.*dca', 'coinbase.*recurring'],
  
  // AI Tool
  'AI Sentimentals': ['ai tool', 'ai-tool', 'ai_tool', 'artificial'],
  
  // Payment & Finance
  'On-Ramp / Off-Ramp (3rd Party)': ['deposit', 'withdraw', 'para-yatir', 'para-cek', 'bank-transfer'],
  'Own Card': ['card', 'kart', 'visa', 'mastercard'],
  
  // Platform specific
  'Academy for Logged-in User': ['academy', 'egitim', 'ogren', 'learn'],
  'Referral': ['referral', 'davet', 'arkadas', 'invite'],
  'NFT / Marketplace': ['nft', 'marketplace', 'koleksiyon'],
  'Social Feed (Square)': ['social', 'feed', 'square', 'sosyal']
};

async function enhanceScreenshotAssignment() {
  console.log('🔍 Gelişmiş Screenshot Analizi ve Atama Başlıyor...\n');

  try {
    // Öncelikle mevcut Onboarding screenshot'larını analiz et
    const onboardingFeature = await prisma.feature.findFirst({
      where: { name: 'Onboarding' }
    });

    if (!onboardingFeature) {
      console.log('❌ Onboarding feature bulunamadı!');
      return;
    }

    // Onboarding screenshot'larını al
    const onboardingScreenshots = await prisma.competitorFeatureScreenshot.findMany({
      where: {
        competitorFeature: {
          featureId: onboardingFeature.id
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

    console.log(`📸 ${onboardingScreenshots.length} Onboarding screenshot analiz ediliyor...\n`);

    const reassignments: Record<string, number> = {};
    let reassigned = 0;

    for (const screenshot of onboardingScreenshots) {
      const screenshotPath = screenshot.screenshotPath.toLowerCase();
      const fileName = path.basename(screenshotPath);
      let targetFeature: string | null = null;

      // Özel pattern kontrolü
      for (const [featureName, patterns] of Object.entries(enhancedFeatureMappings)) {
        for (const pattern of patterns) {
          if (screenshotPath.includes(pattern) || fileName.includes(pattern)) {
            targetFeature = featureName;
            break;
          }
        }
        if (targetFeature) break;
      }

      // Dosya ismi analizi
      if (!targetFeature) {
        if (fileName.includes('bank') || fileName.includes('banka')) {
          if (fileName.includes('register') || fileName.includes('signup') || fileName.includes('kayit')) {
            targetFeature = 'Sign up with Bank';
          } else {
            targetFeature = 'Sign in with Bank';
          }
        } else if (fileName.includes('google') || fileName.includes('gmail')) {
          targetFeature = 'Sign in with Gmail';
        } else if (fileName.includes('apple')) {
          targetFeature = 'Sign in with Apple';
        } else if (fileName.includes('qr')) {
          targetFeature = 'Login with QR';
        } else if (fileName.includes('passkey') || fileName.includes('touch') || fileName.includes('face')) {
          targetFeature = 'Sign in with Passkey';
        }
      }

      // Feature bulunduysa yeniden ata
      if (targetFeature && targetFeature !== 'Onboarding') {
        const newFeature = await prisma.feature.findFirst({
          where: { name: targetFeature }
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
                notes: 'Auto-detected from onboarding screenshots'
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

          reassigned++;
          reassignments[targetFeature] = (reassignments[targetFeature] || 0) + 1;

          console.log(`✅ ${screenshot.competitorFeature.competitor.name}: ${fileName} → ${targetFeature}`);
        }
      }
    }

    // Diğer screenshot'ları da kontrol et
    console.log('\n📸 Diğer screenshot\'lar kontrol ediliyor...\n');

    const allScreenshots = await prisma.competitorFeatureScreenshot.findMany({
      where: {
        competitorFeature: {
          featureId: {
            not: onboardingFeature.id
          }
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

    let otherReassigned = 0;

    for (const screenshot of allScreenshots) {
      const screenshotPath = screenshot.screenshotPath.toLowerCase();
      const currentFeature = screenshot.competitorFeature.feature.name;
      
      // AI Tool kontrolü
      if ((screenshotPath.includes('ai tool') || screenshotPath.includes('ai-tool')) && currentFeature !== 'AI Sentimentals') {
        const aiFeature = await prisma.feature.findFirst({
          where: { name: 'AI Sentimentals' }
        });

        if (aiFeature) {
          let aiCompetitorFeature = await prisma.competitorFeature.findFirst({
            where: {
              competitorId: screenshot.competitorFeature.competitorId,
              featureId: aiFeature.id
            }
          });

          if (!aiCompetitorFeature) {
            aiCompetitorFeature = await prisma.competitorFeature.create({
              data: {
                competitorId: screenshot.competitorFeature.competitorId,
                featureId: aiFeature.id,
                hasFeature: true,
                notes: 'Auto-detected from AI Tool screenshots'
              }
            });
          }

          await prisma.competitorFeatureScreenshot.update({
            where: { id: screenshot.id },
            data: { competitorFeatureId: aiCompetitorFeature.id }
          });

          otherReassigned++;
          console.log(`✅ ${screenshot.competitorFeature.competitor.name}: AI Tool → AI Sentimentals`);
        }
      }
    }

    // Özet rapor
    console.log('\n' + '='.repeat(60));
    console.log('📊 ATAMA ÖZETİ:');
    console.log(`   Onboarding'den yeniden atanan: ${reassigned} screenshot`);
    console.log(`   Diğer yeniden atanan: ${otherReassigned} screenshot`);
    console.log(`   Toplam: ${reassigned + otherReassigned} screenshot\n`);

    if (Object.keys(reassignments).length > 0) {
      console.log('📝 ONBOARDING DAĞILIMI:');
      for (const [feature, count] of Object.entries(reassignments)) {
        console.log(`   ${feature}: ${count} screenshot`);
      }
    }

    // Feature coverage güncelle
    console.log('\n🔄 Feature coverage güncelleniyor...');
    
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
    console.error('❌ Hata:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ana fonksiyonu çalıştır
enhanceScreenshotAssignment()
  .then(() => {
    console.log('\n✅ Gelişmiş screenshot analizi tamamlandı!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Kritik hata:', error);
    process.exit(1);
  });
