import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

// Enhanced feature patterns with more variations
const featurePatterns = {
  // Platform
  'mobile': 'Mobile App',
  'app': 'Mobile App',
  'ios': 'Mobile App',
  'android': 'Mobile App',
  'web': 'Web App',
  'desktop': 'Desktop App',
  
  // Authentication
  'onboarding': 'Sign up with Bank',
  'register': 'Sign up with Bank',
  'signup': 'Sign up with Bank',
  'kyc': 'Sign up with Bank',
  'login': 'Sign in with Bank',
  'signin': 'Sign in with Bank',
  'gmail': 'Sign in with Gmail',
  'apple': 'Sign in with Apple',
  'telegram': 'Sign in with Telegram',
  'wallet': 'Sign in with Wallet',
  'qr': 'Login with QR',
  'passkey': 'Sign in with Passkey',
  
  // Trading
  'convert': 'Convert',
  'swap': 'Convert',
  'spot': 'Spot Trading',
  'futures': 'Futures Trading',
  'copy': 'Copy Trading',
  'bot': 'Trade Bots for Users',
  'dca': 'Auto-Invest (DCA)',
  'dual': 'Dual Investment',
  
  // Financial
  'stake': 'Flexible Staking',
  'staking': 'Flexible Staking',
  'locked': 'Locked Staking',
  'earn': 'Flexible Staking',
  'lending': 'Loan Borrowing',
  'borrow': 'Loan Borrowing',
  'loan': 'VIP Loan',
  'saving': 'Flexible Staking',
  
  // Payment
  'p2p': 'On-Ramp / Off-Ramp (3rd Party)',
  'ramp': 'On-Ramp / Off-Ramp (3rd Party)',
  'card': 'Own Card',
  'pay': 'Pay (Payments)',
  'payment': 'Pay (Payments)',
  
  // NFT & Gaming
  'nft': 'NFT / Marketplace',
  'marketplace': 'NFT / Marketplace',
  'launchpad': 'Launchpool / Launchpad',
  'launchpool': 'Launchpool / Launchpad',
  'gamification': 'Gamification',
  'game': 'Gamification',
  'fan': 'Fan Token',
  'token': 'Fan Token',
  
  // Social & Education
  'social': 'Social Feed (Square)',
  'square': 'Social Feed (Square)',
  'feed': 'Social Feed (Square)',
  'academy': 'Academy for Logged-in User',
  'education': 'Academy for Logged-in User',
  'learn': 'Academy for Logged-in User',
  
  // Other
  'referral': 'Referral',
  'affiliate': 'Affiliate (KOL Program)',
  'kol': 'Affiliate (KOL Program)',
  'api': 'Public API',
  'alarm': 'Price Alarm',
  'alert': 'Price Alarm',
  'price': 'Price Alarm',
  'ai': 'AI Sentimentals',
  'bug': 'Bug Bounty',
  'bounty': 'Bug Bounty',
  
  // Infrastructure
  'chain': 'Own Chain',
  'stablecoin': 'Own Stablecoin',
  'corporate': 'Corporate Registration',
  'business': 'Corporate Registration'
};

// Competitor name variations
const competitorMappings: {[key: string]: string} = {
  'BTC Turk': 'BTCTurk',
  'BTCTurk': 'BTCTurk',
  'Binance TR': 'BinanceTR',
  'BinanceTR': 'BinanceTR',
  'Binance Global': 'Binance Global',
  'OKX TR': 'OKX TR',
  'OKXTR': 'OKX TR',
  'Garanti Kripto': 'Garanti Kripto',
  'GarantiKripto': 'Garanti Kripto',
  'Coinbase': 'Coinbase',
  'Kraken': 'Kraken',
  'Paribu': 'Paribu',
  'Bitexen': 'Bitexen',
  'GateTR': 'GateTR',
  'Gate TR': 'GateTR',
  'BybitTR': 'BybitTR',
  'Bybit TR': 'BybitTR'
};

async function getFeatureFromPath(filePath: string): Promise<string | null> {
  const pathLower = filePath.toLowerCase();
  
  // Check each pattern
  for (const [pattern, featureName] of Object.entries(featurePatterns)) {
    if (pathLower.includes(pattern)) {
      return featureName;
    }
  }
  
  // Check directory structure for clues
  const parts = pathLower.split(/[\/\\]/);
  for (const part of parts) {
    for (const [pattern, featureName] of Object.entries(featurePatterns)) {
      if (part.includes(pattern)) {
        return featureName;
      }
    }
  }
  
  // Default to Mobile App for general screenshots
  if (pathLower.includes('.png') || pathLower.includes('.jpg') || pathLower.includes('.jpeg')) {
    return 'Mobile App';
  }
  
  return null;
}

async function smartImportScreenshots() {
  console.log('🚀 Starting Smart Screenshot Import...\n');
  
  const uploadsDir = path.join(process.cwd(), 'uploads', 'screenshots');
  
  if (!fs.existsSync(uploadsDir)) {
    console.error('❌ Screenshots directory not found:', uploadsDir);
    return;
  }
  
  // Get all image files
  const allImages = getAllFiles(uploadsDir).filter(file => 
    ['.png', '.jpg', '.jpeg', '.webp'].includes(path.extname(file).toLowerCase())
  );
  
  console.log(`Found ${allImages.length} total images\n`);
  
  let totalImported = 0;
  let totalSkipped = 0;
  let totalErrors = 0;
  
  // Group images by potential competitor
  const imagesByCompetitor = new Map<string, string[]>();
  
  for (const imagePath of allImages) {
    const relativePath = path.relative(uploadsDir, imagePath);
    const parts = relativePath.split(/[\/\\]/);
    
    if (parts.length > 0) {
      const dirName = parts[0];
      const competitorName = competitorMappings[dirName] || dirName;
      
      if (!imagesByCompetitor.has(competitorName)) {
        imagesByCompetitor.set(competitorName, []);
      }
      imagesByCompetitor.get(competitorName)!.push(imagePath);
    }
  }
  
  // Process each competitor
  for (const [competitorName, images] of imagesByCompetitor) {
    console.log(`\n📁 Processing ${competitorName}...`);
    console.log(`   Found ${images.length} images`);
    
    // Find competitor in database
    const competitor = await prisma.competitor.findFirst({
      where: {
        OR: [
          { name: competitorName },
          { name: { contains: competitorName } },
          { name: { contains: competitorName.replace(' ', '') } }
        ]
      }
    });
    
    if (!competitor) {
      console.log(`   ⚠️  Competitor not found in database: ${competitorName}`);
      totalSkipped += images.length;
      continue;
    }
    
    // Process each image
    for (const imagePath of images) {
      const relativePath = path.relative(process.cwd(), imagePath);
      const urlPath = '/' + relativePath.replace(/\\/g, '/');
      
      // Try to determine feature
      const featureName = await getFeatureFromPath(imagePath);
      
      if (!featureName) {
        totalSkipped++;
        continue;
      }
      
      // Find feature
      const feature = await prisma.feature.findUnique({
        where: { name: featureName }
      });
      
      if (!feature) {
        totalSkipped++;
        continue;
      }
      
      // Find or create competitor feature
      let competitorFeature = await prisma.competitorFeature.findUnique({
        where: {
          competitorId_featureId: {
            competitorId: competitor.id,
            featureId: feature.id
          }
        }
      });
      
      if (!competitorFeature) {
        competitorFeature = await prisma.competitorFeature.create({
          data: {
            competitorId: competitor.id,
            featureId: feature.id,
            hasFeature: true,
            implementationQuality: 'good'
          }
        });
      } else {
        // Update to hasFeature = true if screenshot exists
        await prisma.competitorFeature.update({
          where: { id: competitorFeature.id },
          data: { hasFeature: true }
        });
      }
      
      // Check if screenshot already exists
      const existingScreenshot = await prisma.competitorFeatureScreenshot.findFirst({
        where: {
          competitorFeatureId: competitorFeature.id,
          screenshotPath: urlPath
        }
      });
      
      if (existingScreenshot) {
        totalSkipped++;
        continue;
      }
      
      // Create screenshot
      try {
        await prisma.competitorFeatureScreenshot.create({
          data: {
            competitorFeatureId: competitorFeature.id,
            screenshotPath: urlPath,
            caption: `${competitor.name} - ${feature.name}`,
            displayOrder: 0
          }
        });
        
        console.log(`   ✅ Imported: ${path.basename(imagePath)} → ${feature.name}`);
        totalImported++;
      } catch (error) {
        console.error(`   ❌ Error: ${path.basename(imagePath)}`);
        totalErrors++;
      }
    }
  }
  
  // Final statistics
  const totalScreenshots = await prisma.competitorFeatureScreenshot.count();
  const competitorsWithScreenshots = await prisma.competitor.findMany({
    where: {
      features: {
        some: {
          screenshots: {
            some: {}
          }
        }
      }
    }
  });
  
  console.log(`
📊 Import Summary:
   - Total Images Processed: ${allImages.length}
   - Newly Imported: ${totalImported}
   - Skipped: ${totalSkipped}
   - Errors: ${totalErrors}
   
   Database Status:
   - Total Screenshots: ${totalScreenshots}
   - Competitors with Screenshots: ${competitorsWithScreenshots.length}
   
✅ Smart import completed!
`);
}

function getAllFiles(dirPath: string, arrayOfFiles: string[] = []): string[] {
  const files = fs.readdirSync(dirPath);
  
  files.forEach((file) => {
    const filePath = path.join(dirPath, file);
    if (fs.statSync(filePath).isDirectory()) {
      arrayOfFiles = getAllFiles(filePath, arrayOfFiles);
    } else {
      arrayOfFiles.push(filePath);
    }
  });
  
  return arrayOfFiles;
}

smartImportScreenshots()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
