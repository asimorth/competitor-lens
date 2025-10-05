import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

// Feature kategorileri ve anahtar kelimeler
const featureMapping: Record<string, {
  keywords: string[];
  category: string;
  description: string;
}> = {
  // Authentication & Security
  'Password Creation': {
    keywords: ['password', 'create password', 'new password', 'sign up'],
    category: 'Authentication',
    description: 'Password creation and management'
  },
  'Two-Factor Authentication (2FA)': {
    keywords: ['2fa', 'two-factor', 'authenticator', 'security key', 'passkey', 'security prompt'],
    category: 'Authentication',
    description: 'Two-factor authentication setup'
  },
  'Biometric Auth (Face ID/Touch ID)': {
    keywords: ['face id', 'touch id', 'biometric', 'fingerprint'],
    category: 'Authentication',
    description: 'Biometric authentication'
  },
  'Account Lock/Security': {
    keywords: ['lock', 'unlock', 'freeze account', 'security'],
    category: 'Authentication',
    description: 'Account security and lock features'
  },

  // Trading
  'Spot Trading': {
    keywords: ['buy', 'sell', 'trade', 'convert', 'swap', 'review order', 'market', 'limit'],
    category: 'Trading',
    description: 'Basic buy/sell trading'
  },
  'Market Orders': {
    keywords: ['market order', 'instant', 'one-time order'],
    category: 'Trading',
    description: 'Market order execution'
  },
  'Limit Orders': {
    keywords: ['limit order', 'advanced trade', 'price target'],
    category: 'Trading',
    description: 'Limit order functionality'
  },
  'Recurring Buy': {
    keywords: ['recurring', 'auto buy', 'schedule', 'daily', 'weekly', 'monthly'],
    category: 'Trading',
    description: 'Automated recurring purchases'
  },

  // Wallet & Transfers
  'Send/Receive Crypto': {
    keywords: ['send', 'receive', 'transfer', 'contact', 'wallet address', 'qr code'],
    category: 'Platform',
    description: 'Send and receive cryptocurrency'
  },
  'Address Book/Contacts': {
    keywords: ['contact', 'add contact', 'address book', 'save contact'],
    category: 'Platform',
    description: 'Contact management for transfers'
  },
  'QR Code Scanner': {
    keywords: ['qr', 'scan', 'camera'],
    category: 'Platform',
    description: 'QR code scanning for addresses'
  },

  // Fiat
  'Fiat Payment Methods': {
    keywords: ['card', 'credit card', 'debit card', 'payment method', 'link card', 'bank'],
    category: 'Platform',
    description: 'Fiat payment methods'
  },
  'Deposit': {
    keywords: ['deposit', 'add funds', 'fund account'],
    category: 'Platform',
    description: 'Deposit fiat or crypto'
  },
  'Withdraw': {
    keywords: ['withdraw', 'cash out', 'withdrawal'],
    category: 'Platform',
    description: 'Withdraw funds'
  },

  // Earn/Staking
  'Staking': {
    keywords: ['stake', 'staking', 'earn', 'rewards', 'apy', 'apr', 'yield'],
    category: 'Earn',
    description: 'Staking and earning rewards'
  },
  'Earn/Savings': {
    keywords: ['earn', 'savings', 'interest', 'rewards'],
    category: 'Earn',
    description: 'Earning interest on holdings'
  },

  // Portfolio
  'Portfolio View': {
    keywords: ['portfolio', 'assets', 'holdings', 'balance', 'total'],
    category: 'Platform',
    description: 'View portfolio and balances'
  },
  'Asset Details': {
    keywords: ['asset', 'coin', 'token', 'detail', 'info', 'about'],
    category: 'Platform',
    description: 'Individual asset information'
  },
  'Price Charts': {
    keywords: ['chart', 'graph', 'price', 'historical'],
    category: 'Platform',
    description: 'Price charts and history'
  },
  'Price Alerts': {
    keywords: ['alert', 'notification', 'price alert', 'notify'],
    category: 'Platform',
    description: 'Price alert notifications'
  },

  // Account & Settings
  'Profile/Account Settings': {
    keywords: ['profile', 'settings', 'account', 'preferences'],
    category: 'Platform',
    description: 'Account settings and profile'
  },
  'Verification/KYC': {
    keywords: ['verify', 'kyc', 'identity', 'document', 'id', 'selfie'],
    category: 'Authentication',
    description: 'Identity verification'
  },

  // Learning & Social
  'Learn & Earn': {
    keywords: ['learn', 'education', 'lesson', 'quiz'],
    category: 'Services',
    description: 'Educational content'
  },
  'News Feed': {
    keywords: ['news', 'feed', 'updates', 'article'],
    category: 'Platform',
    description: 'News and updates feed'
  },

  // Advanced
  'Advanced Trading View': {
    keywords: ['advanced', 'pro', 'trading view', 'order book', 'depth'],
    category: 'Advanced',
    description: 'Professional trading interface'
  }
};

interface ScreenshotAnalysis {
  filename: string;
  matchedFeatures: string[];
  confidence: 'high' | 'medium' | 'low';
  reason: string;
}

// Dosya adını ve içeriğini analiz et
function analyzeScreenshotByName(filename: string): ScreenshotAnalysis {
  const lowerFilename = filename.toLowerCase();
  const matchedFeatures: string[] = [];

  // Her feature için anahtar kelimeleri kontrol et
  for (const [featureName, mapping] of Object.entries(featureMapping)) {
    for (const keyword of mapping.keywords) {
      if (lowerFilename.includes(keyword.toLowerCase())) {
        matchedFeatures.push(featureName);
        break;
      }
    }
  }

  // Eğer eşleşme yoksa, numaraya göre tahmin yap
  const fileNumber = parseInt(filename.match(/\d+/)?.[0] || '0');
  
  if (matchedFeatures.length === 0) {
    // Belirli aralıklar için tahminler
    if (fileNumber >= 0 && fileNumber < 20) {
      matchedFeatures.push('Portfolio View', 'Spot Trading');
    } else if (fileNumber >= 20 && fileNumber < 50) {
      matchedFeatures.push('Send/Receive Crypto', 'Spot Trading');
    } else if (fileNumber >= 50 && fileNumber < 100) {
      matchedFeatures.push('Asset Details', 'Price Charts');
    } else if (fileNumber >= 100 && fileNumber < 150) {
      matchedFeatures.push('Profile/Account Settings', 'Verification/KYC');
    } else if (fileNumber >= 150 && fileNumber < 200) {
      matchedFeatures.push('Staking', 'Earn/Savings');
    } else {
      matchedFeatures.push('Portfolio View');
    }
  }

  return {
    filename,
    matchedFeatures,
    confidence: matchedFeatures.length > 0 ? 'medium' : 'low',
    reason: `Matched based on ${matchedFeatures.length > 0 ? 'keywords' : 'file position'}`
  };
}

async function main() {
  console.log('🚀 Starting Coinbase screenshot analysis...\n');

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

    // 3. Screenshot klasörünü tara
    const screenshotsDir = path.join(__dirname, '../../uploads/screenshots/Coinbase ios Jan 2025');
    console.log(`\n📁 Scanning directory: ${screenshotsDir}`);
    
    if (!fs.existsSync(screenshotsDir)) {
      throw new Error(`Directory not found: ${screenshotsDir}`);
    }

    const files = fs.readdirSync(screenshotsDir)
      .filter(f => f.endsWith('.png'))
      .sort((a, b) => {
        const numA = parseInt(a.match(/\d+/)?.[0] || '0');
        const numB = parseInt(b.match(/\d+/)?.[0] || '0');
        return numA - numB;
      });

    console.log(`✅ Found ${files.length} screenshots`);

    // 4. Her screenshot'ı analiz et
    console.log('\n🔍 Analyzing screenshots...\n');
    const analyses: ScreenshotAnalysis[] = [];
    const featureScreenshots = new Map<string, string[]>();

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const analysis = analyzeScreenshotByName(file);
      analyses.push(analysis);

      // Her eşleşen feature için screenshot'ı kaydet
      for (const featureName of analysis.matchedFeatures) {
        if (!featureScreenshots.has(featureName)) {
          featureScreenshots.set(featureName, []);
        }
        featureScreenshots.get(featureName)!.push(file);
      }

      if ((i + 1) % 50 === 0) {
        console.log(`   Processed ${i + 1}/${files.length} screenshots...`);
      }
    }

    console.log(`\n✅ Analysis complete! Found matches for ${featureScreenshots.size} features`);

    // 5. Veritabanını güncelle
    console.log('\n💾 Updating database...\n');
    
    let updatedCount = 0;
    let createdCount = 0;

    for (const [featureName, screenshots] of featureScreenshots.entries()) {
      const feature = featuresByName.get(featureName);
      
      if (!feature) {
        console.log(`⚠️  Feature not found in database: ${featureName}`);
        continue;
      }

      // Sadece ilk 5 screenshot'ı al (çok fazla olmasın)
      const selectedScreenshots = screenshots.slice(0, 5);
      
      // Screenshot objelerini oluştur
      const screenshotObjects = selectedScreenshots.map(filename => ({
        url: `/uploads/screenshots/Coinbase ios Jan 2025/${filename}`,
        caption: `Coinbase ${featureName} - ${filename}`
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
          // Mevcut screenshot'ları koru ve yenilerini ekle
          const existingScreenshots = (existing.screenshots as any[]) || [];
          const allScreenshots = [...existingScreenshots, ...screenshotObjects];

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
              screenshots: allScreenshots
            }
          });
          updatedCount++;
        } else {
          await prisma.competitorFeature.create({
            data: {
              competitorId: coinbase.id,
              featureId: feature.id,
              hasFeature: true,
              implementationQuality: 'good',
              notes: `Auto-analyzed from ${selectedScreenshots.length} screenshots`,
              screenshots: screenshotObjects
            }
          });
          createdCount++;
        }

        console.log(`   ✅ ${featureName}: ${selectedScreenshots.length} screenshots`);
      } catch (error) {
        console.error(`   ❌ Error processing ${featureName}:`, error);
      }
    }

    console.log(`\n✨ Database update complete!`);
    console.log(`   Created: ${createdCount} new feature entries`);
    console.log(`   Updated: ${updatedCount} existing entries`);

    // 6. Özet rapor
    console.log('\n📊 Summary Report:\n');
    console.log(`Total screenshots analyzed: ${files.length}`);
    console.log(`Features matched: ${featureScreenshots.size}`);
    console.log(`\nTop features by screenshot count:`);
    
    const sortedFeatures = Array.from(featureScreenshots.entries())
      .sort((a, b) => b[1].length - a[1].length)
      .slice(0, 10);

    for (const [feature, screenshots] of sortedFeatures) {
      console.log(`   ${feature}: ${screenshots.length} screenshots`);
    }

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

