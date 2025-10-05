import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function quickImport() {
  console.log('🚀 Quick Data Import Starting...');
  
  try {
    // Create TR competitors
    const trCompetitors = [
      { name: 'BTCTurk', description: 'Türkiye\'nin ilk kripto para borsası', website: 'https://btcturk.com' },
      { name: 'Paribu', description: 'Türkiye kripto para borsası', website: 'https://paribu.com' },
      { name: 'OKX TR', description: 'OKX\'in Türkiye platformu', website: 'https://okx.com' },
      { name: 'Binance TR', description: 'Binance\'in Türkiye platformu', website: 'https://trbinance.com' },
      { name: 'Bitexen', description: 'Türkiye kripto para borsası', website: 'https://bitexen.com' },
      { name: 'Garanti Kripto', description: 'Garanti BBVA kripto platformu', website: 'https://garantibbva.com.tr' }
    ];

    // Add global competitors
    const globalCompetitors = [
      { name: 'Coinbase', description: 'ABD merkezli kripto borsası', website: 'https://coinbase.com' },
      { name: 'Kraken', description: 'ABD kripto borsası', website: 'https://kraken.com' },
      { name: 'Binance', description: 'Global kripto para borsası', website: 'https://binance.com' }
    ];

    // Add Stablex
    const stablex = { name: 'Stablex', description: 'Stablex kripto borsası', website: 'https://stablex.com' };

    console.log('Creating competitors...');
    for (const comp of [...trCompetitors, ...globalCompetitors, stablex]) {
      await prisma.competitor.upsert({
        where: { name: comp.name },
        update: comp,
        create: comp
      });
    }

    // Create basic features
    const features = [
      { name: 'Mobile App', category: 'Platform', description: 'Mobil uygulama desteği' },
      { name: 'Web Trading', category: 'Platform', description: 'Web tabanlı işlem platformu' },
      { name: 'Spot Trading', category: 'Trading', description: 'Spot işlem desteği' },
      { name: 'Convert', category: 'Trading', description: 'Kripto dönüştürme' },
      { name: '2FA', category: 'Security', description: 'İki faktörlü doğrulama' },
      { name: 'Bank Transfer', category: 'Payment', description: 'Banka havalesi' },
      { name: 'Credit Card', category: 'Payment', description: 'Kredi kartı desteği' },
      { name: 'KYC', category: 'User', description: 'Kimlik doğrulama' }
    ];

    console.log('Creating features...');
    for (const feat of features) {
      await prisma.feature.upsert({
        where: { name: feat.name },
        update: feat,
        create: feat
      });
    }

    // Create some competitor features for TR exchanges
    const btcturk = await prisma.competitor.findUnique({ where: { name: 'BTCTurk' } });
    const mobileApp = await prisma.feature.findUnique({ where: { name: 'Mobile App' } });
    const webTrading = await prisma.feature.findUnique({ where: { name: 'Web Trading' } });

    if (btcturk && mobileApp) {
      console.log('Creating competitor features...');
      await prisma.competitorFeature.upsert({
        where: {
          competitorId_featureId: {
            competitorId: btcturk.id,
            featureId: mobileApp.id
          }
        },
        update: {
          hasFeature: true,
          implementationQuality: 'excellent',
          notes: 'iOS ve Android uygulamaları mevcut'
        },
        create: {
          competitorId: btcturk.id,
          featureId: mobileApp.id,
          hasFeature: true,
          implementationQuality: 'excellent',
          notes: 'iOS ve Android uygulamaları mevcut'
        }
      });
    }

    const counts = await Promise.all([
      prisma.competitor.count(),
      prisma.feature.count(),
      prisma.competitorFeature.count()
    ]);

    console.log(`
✅ Import completed!
   - Competitors: ${counts[0]}
   - Features: ${counts[1]}
   - Competitor Features: ${counts[2]}
`);

  } catch (error) {
    console.error('❌ Import failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

quickImport();
