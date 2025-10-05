import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

// Coinbase ekran görüntülerinin manuel kategorize edilmiş mappingi
const coinbaseScreenshotMapping: Record<string, number[]> = {
  // Authentication
  'Sign in with Apple': [],
  'Sign in with Gmail': [],
  'Sign in with Wallet': [],
  'Login with QR': [],
  'Sign in with Passkey': [200, 201, 202, 203, 204, 205],

  // Trading
  'Auto-Invest (DCA)': [60, 61, 62, 80, 81],
  'Convert': [80, 265, 266, 267],
  'Convert Small Assets': [],

  // Earn
  'Flexible Staking': [300, 301, 302, 303, 304, 305],
  'Locked Staking': [300, 301, 302],

  // Platform
  'Mobile App': [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120, 130, 140, 150, 160, 170, 180, 190, 200, 210, 220, 230, 240, 250, 260, 270, 280, 290, 300, 310, 320],
  'Web App': [320],

  // Services
  'Pay (Payments)': [70, 71, 72, 73, 74, 75, 150, 151, 152, 153, 154, 155, 160],
  'NFT / Marketplace': [],
  'API Management': [],
  'Public API': [],
  'Academy for Logged-in User': [40, 41, 42, 310, 311, 312, 313, 314, 315],

  // Other
  'Own Card': [150, 151, 152, 153, 154, 155],
  'Own Chain': [320],
  'Own Stablecoin': [300, 301, 302],
  'On-Ramp / Off-Ramp (3rd Party)': [70, 71, 72, 73, 74, 75],
};

async function main() {
  console.log('🚀 Adding Coinbase screenshots to database...\n');

  try {
    // Coinbase'i bul
    const coinbase = await prisma.competitor.findUnique({
      where: { name: 'Coinbase' }
    });

    if (!coinbase) {
      console.log('❌ Coinbase not found in database!');
      return;
    }

    console.log(`✅ Found Coinbase: ${coinbase.id}\n`);

    let totalAdded = 0;

    // Her feature için screenshot'ları ekle
    for (const [featureName, screenshotNumbers] of Object.entries(coinbaseScreenshotMapping)) {
      if (screenshotNumbers.length === 0) {
        continue;
      }

      // Feature'ı bul
      const feature = await prisma.feature.findUnique({
        where: { name: featureName }
      });

      if (!feature) {
        console.log(`   ⚠️  Feature not found: ${featureName}`);
        continue;
      }

      // CompetitorFeature ilişkisini getir veya oluştur
      const competitorFeature = await prisma.competitorFeature.upsert({
        where: {
          competitorId_featureId: {
            competitorId: coinbase.id,
            featureId: feature.id
          }
        },
        update: {
          hasFeature: true,
          implementationQuality: 'good'
        },
        create: {
          competitorId: coinbase.id,
          featureId: feature.id,
          hasFeature: true,
          implementationQuality: 'good'
        }
      });

      // Mevcut screenshot'ları temizle
      await prisma.competitorFeatureScreenshot.deleteMany({
        where: { competitorFeatureId: competitorFeature.id }
      });

      // Yeni screenshot'ları ekle
      for (let i = 0; i < screenshotNumbers.length; i++) {
        const num = screenshotNumbers[i];
        const screenshotPath = `uploads/screenshots/Coinbase ios Jan 2025/Coinbase ios Jan 2025 ${num}.png`;
        
        await prisma.competitorFeatureScreenshot.create({
          data: {
            competitorFeatureId: competitorFeature.id,
            screenshotPath,
            displayOrder: i,
            caption: `${featureName} - Screenshot ${i + 1}`
          }
        });
      }

      totalAdded += screenshotNumbers.length;
      console.log(`   ✅ ${featureName}: ${screenshotNumbers.length} screenshots added`);
    }

    console.log(`\n📊 Total screenshots added: ${totalAdded}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();


