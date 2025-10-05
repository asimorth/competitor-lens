import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Coinbase ekran görüntülerinin manuel kategorize edilmiş mappingi
// Veritabanındaki feature isimleriyle eşleştirilmiş
const coinbaseScreenshotMapping = {
  // Authentication
  'Sign in with Apple': [],
  'Sign in with Gmail': [],
  'Sign in with Wallet': [],
  'Login with QR': [],
  'Sign in with Passkey': [200, 201, 202, 203, 204, 205],

  // Trading
  'Spot Trading': [50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 80, 81, 82, 83],
  'Futures Trading': [],
  'Margin Trading': [],
  'P2P Trading': [],
  'Copy Trading': [],
  'Auto-Invest (DCA)': [60, 61, 62, 80, 81], // Recurring Buy
  'Convert': [80, 265, 266, 267],
  'Convert Small Assets': [],
  'Trade Bots for Users': [],
  'Dual Investment': [],
  'Stocks & Commodity and Forex Trading': [],

  // Earn
  'Flexible Staking': [300, 301, 302, 303, 304, 305],
  'Locked Staking': [300, 301, 302],
  'On-chain Earn': [],
  'Loan Borrowing': [],
  'VIP Loan': [],

  // Platform
  'Mobile App': [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120, 130, 140, 150, 160, 170, 180, 190, 200, 210, 220, 230, 240, 250, 260, 270, 280, 290, 300, 310, 320],
  'Desktop App': [],
  'Web App': [320],

  // Services
  'Pay (Payments)': [70, 71, 72, 73, 74, 75, 150, 151, 152, 153, 154, 155, 160], // Deposit, Withdraw, Card linking
  'NFT / Marketplace': [],
  'API Management': [],
  'Public API': [],
  'Academy for Logged-in User': [40, 41, 42, 310, 311, 312, 313, 314, 315],

  // Social
  'Referral': [30, 180, 181],
  'Social Feed (Square)': [],
  'Gamification': [],
  'Affiliate (KOL Program)': [],

  // Advanced
  'Own Card': [150, 151, 152, 153, 154, 155],
  'Own Stablecoin': [300, 301, 302], // USDC
  'Own Chain': [],
  'Launchpool / Launchpad': [],

  // Other
  'Price Alarm': [],
  'Bug Bounty': [],
  'On-Ramp / Off-Ramp (3rd Party)': [70, 71, 72, 73, 74, 75],
  'Tokenized Stocks': [],
  'AI Sentimentals': [],
  'TRY Nemalandırma': [],
  'Corporate Registration': [],
  'Fan Token': [],
  'Crypto as a Services': [],
  'Global Customers': []
};

async function main() {
  console.log('🚀 Starting simplified Coinbase screenshot mapping...\n');

  try {
    // 1. Coinbase competitor'ını bul veya oluştur
    console.log('📊 Checking for Coinbase competitor...');
    let coinbase = await prisma.competitor.findUnique({
      where: { name: 'Coinbase' }
    });

    if (!coinbase) {
      console.log('Creating Coinbase competitor...');
      coinbase = await prisma.competitor.create({
        data: {
          name: 'Coinbase',
          website: 'https://www.coinbase.com',
          description: 'Major US-based cryptocurrency exchange',
          industry: 'Cryptocurrency Exchange'
        }
      });
      console.log('✅ Coinbase competitor created');
    } else {
      console.log('✅ Coinbase competitor found');
    }

    // 2. Tüm feature'ları çek
    console.log('\n📋 Fetching all features...');
    const features = await prisma.feature.findMany();
    console.log(`✅ Found ${features.length} features`);

    // Feature isimlerini map'le
    const featuresByName = new Map(features.map(f => [f.name, f]));

    // 3. Her feature için screenshot'ları ekle
    console.log('\n💾 Updating database...\n');
    
    let updatedCount = 0;
    let createdCount = 0;
    let skippedCount = 0;

    for (const [featureName, screenNumbers] of Object.entries(coinbaseScreenshotMapping)) {
      const feature = featuresByName.get(featureName);
      
      if (!feature) {
        console.log(`⚠️  Feature not found in database: ${featureName}`);
        skippedCount++;
        continue;
      }

      if (screenNumbers.length === 0) {
        console.log(`   ⏭️  ${featureName}: No screenshots`);
        skippedCount++;
        continue;
      }

      // Screenshot objelerini oluştur
      const screenshotObjects = screenNumbers.map(num => ({
        url: `/uploads/screenshots/Coinbase ios Jan 2025/Coinbase ios Jan 2025 ${num}.png`,
        caption: `Coinbase ${featureName} - Screen ${num}`
      }));

      try {
        const existing = await prisma.competitorFeature.findUnique({
          where: {
            competitorId_featureId: {
              competitorId: coinbase.id,
              featureId: feature.id
            }
          }
        });

        if (existing) {
          // Güncelle
          await prisma.competitorFeature.update({
            where: {
              competitorId_featureId: {
                competitorId: coinbase.id,
                featureId: feature.id
              }
            },
            data: {
              hasFeature: true,
              implementationQuality: 'good',
              screenshots: screenshotObjects,
              notes: `Analyzed from ${screenNumbers.length} screenshots (${screenNumbers.join(', ')})`
            }
          });
          updatedCount++;
          console.log(`   ✅ Updated: ${featureName} (${screenNumbers.length} screenshots)`);
        } else {
          // Oluştur
          await prisma.competitorFeature.create({
            data: {
              competitorId: coinbase.id,
              featureId: feature.id,
              hasFeature: true,
              implementationQuality: 'good',
              screenshots: screenshotObjects,
              notes: `Analyzed from ${screenNumbers.length} screenshots (${screenNumbers.join(', ')})`
            }
          });
          createdCount++;
          console.log(`   ✅ Created: ${featureName} (${screenNumbers.length} screenshots)`);
        }

      } catch (error: any) {
        console.error(`   ❌ Error processing ${featureName}:`, error.message);
      }
    }

    console.log(`\n✨ Database update complete!`);
    console.log(`   Created: ${createdCount} new feature entries`);
    console.log(`   Updated: ${updatedCount} existing entries`);
    console.log(`   Skipped: ${skippedCount} entries`);

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .then(() => {
    console.log('\n🎉 Script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Script failed:', error);
    process.exit(1);
  });

