import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

// Feature isimlerine göre anahtar kelime mapping
const featureKeywords: Record<string, string[]> = {
  'AI Sentimentals': ['ai', 'sentiment', 'analysis', 'chat', 'gpt', 'bot'],
  'Mobile App': ['mobile', 'app', 'ios', 'android', 'home', 'dashboard'],
  'Web App': ['web', 'browser', 'desktop'],
  'Sign in with Apple': ['apple', 'signin', 'login'],
  'Sign in with Gmail': ['gmail', 'google', 'signin'],
  'Sign in with Passkey': ['passkey', 'biometric', 'face', 'fingerprint'],
  'Convert': ['convert', 'swap', 'exchange'],
  'Pay (Payments)': ['pay', 'payment', 'deposit', 'withdraw', 'card'],
  'NFT / Marketplace': ['nft', 'marketplace', 'collectible'],
  'Academy for Logged-in User': ['academy', 'learn', 'education', 'tutorial'],
  'Auto-Invest (DCA)': ['auto', 'invest', 'dca', 'recurring'],
  'Flexible Staking': ['staking', 'stake', 'earn'],
  'Own Card': ['card', 'visa', 'mastercard'],
  'Own Chain': ['chain', 'blockchain', 'network'],
  'Own Stablecoin': ['stablecoin', 'usdt', 'usdc', 'busd'],
  'Copy Trading': ['copy', 'mirror', 'follow'],
  'Trade Bots for Users': ['bot', 'trading bot', 'automated'],
  'Public API': ['api', 'developer', 'integration'],
};

// Klasör adından borsa adını çıkar
function getCompetitorName(folderName: string): string {
  // "Coinbase ios Jan 2025" -> "Coinbase"
  // "Binance" -> "Binance Global"
  // "BinanceTR" -> "BinanceTR"
  
  const cleanName = folderName.split(' ')[0]; // İlk kelimeyi al
  
  if (cleanName.toLowerCase() === 'binance' && !folderName.includes('TR')) {
    return 'Binance Global';
  }
  
  return cleanName;
}

// Dosya veya klasör adından feature tipini tahmin et
function detectFeatureFromPath(filepath: string): string | null {
  const lowerPath = filepath.toLowerCase();
  
  // Önce klasör adına bak
  for (const [featureName, keywords] of Object.entries(featureKeywords)) {
    for (const keyword of keywords) {
      if (lowerPath.includes(keyword.toLowerCase())) {
        return featureName;
      }
    }
  }
  
  return null;
}

async function scanDirectory(dirPath: string): Promise<Map<string, string[]>> {
  const screenshots = new Map<string, string[]>();
  
  if (!fs.existsSync(dirPath)) {
    console.log(`Directory not found: ${dirPath}`);
    return screenshots;
  }
  
  function scan(currentPath: string, relativePath: string = '') {
    const entries = fs.readdirSync(currentPath, { withFileTypes: true });
    
    for (const entry of entries) {
      if (entry.name.startsWith('.')) continue; // Hidden files
      
      const fullPath = path.join(currentPath, entry.name);
      const relPath = path.join(relativePath, entry.name);
      
      if (entry.isDirectory()) {
        // Klasör adından feature'ı tespit et
        const feature = detectFeatureFromPath(relPath);
        if (feature) {
          // Bu klasördeki tüm PNG dosyalarını bu feature'a ekle
          const pngFiles = fs.readdirSync(fullPath)
            .filter(f => f.toLowerCase().endsWith('.png') && !f.startsWith('.'))
            .map(f => path.join(relativePath, entry.name, f));
          
          if (!screenshots.has(feature)) {
            screenshots.set(feature, []);
          }
          screenshots.get(feature)!.push(...pngFiles);
          // Klasörü işlediyse alt klasörleri tarama
          continue;
        }
        
        // Alt klasörleri de tara (sadece feature tespit edilmediyse)
        scan(fullPath, relPath);
      }
    }
  }
  
  scan(dirPath);
  return screenshots;
}

async function main() {
  console.log('🔍 Auto-scanning screenshots folder...\n');

  try {
    const uploadsDir = path.join(process.cwd(), 'uploads', 'screenshots');
    
    if (!fs.existsSync(uploadsDir)) {
      console.log('❌ Screenshots directory not found!');
      return;
    }

    // Her borsa klasörünü tara
    const competitorFolders = fs.readdirSync(uploadsDir, { withFileTypes: true })
      .filter(entry => entry.isDirectory() && !entry.name.startsWith('.'))
      .map(entry => entry.name);

    console.log(`📁 Found ${competitorFolders.length} competitor folders:\n`);

    let totalAdded = 0;

    for (const folderName of competitorFolders) {
      const competitorPath = path.join(uploadsDir, folderName);
      const competitorName = getCompetitorName(folderName);
      
      console.log(`\n📊 Processing: ${competitorName} (${folderName})`);

      // Borsayı bul
      const competitor = await prisma.competitor.findFirst({
        where: { 
          OR: [
            { name: competitorName },
            { name: { contains: competitorName } }
          ]
        }
      });

      if (!competitor) {
        console.log(`   ⚠️  Competitor not found in database: ${competitorName}`);
        continue;
      }

      console.log(`   ✅ Found in DB: ${competitor.name}`);

      // Screenshot'ları tara
      const screenshots = await scanDirectory(competitorPath);
      
      if (screenshots.size === 0) {
        console.log(`   ℹ️  No categorizable screenshots found`);
        continue;
      }

      // Her feature için screenshot'ları ekle
      for (const [featureName, screenshotPaths] of screenshots.entries()) {
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
              competitorId: competitor.id,
              featureId: feature.id
            }
          },
          update: {
            hasFeature: true,
            implementationQuality: 'good'
          },
          create: {
            competitorId: competitor.id,
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
        for (let i = 0; i < screenshotPaths.length; i++) {
          // Path'i doğru şekilde oluştur
          const screenshotPath = screenshotPaths[i].startsWith('uploads') 
            ? screenshotPaths[i] 
            : path.join('uploads', 'screenshots', folderName, screenshotPaths[i]);
          
          await prisma.competitorFeatureScreenshot.create({
            data: {
              competitorFeatureId: competitorFeature.id,
              screenshotPath,
              displayOrder: i,
              caption: `${featureName} - Screenshot ${i + 1}`
            }
          });
        }

        totalAdded += screenshotPaths.length;
        console.log(`   ✅ ${featureName}: ${screenshotPaths.length} screenshots added`);
      }
    }

    console.log(`\n\n📊 Summary:`);
    console.log(`   Total screenshots added: ${totalAdded}`);
    console.log(`   Competitors processed: ${competitorFolders.length}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();


