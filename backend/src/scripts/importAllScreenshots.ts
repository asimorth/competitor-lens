import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

interface ScreenshotMapping {
  [key: string]: {
    featureName?: string;
    category?: string;
  };
}

const screenshotMappings: ScreenshotMapping = {
  // BTC Turk
  'IMG_7866': { featureName: 'Mobile App' },
  'IMG_7867': { featureName: 'Web Trading' },
  'IMG_7868': { featureName: 'Convert' },
  'IMG_7869': { featureName: 'Price Alarm' },
  'IMG_7870': { featureName: 'Flexible Staking' },
  'IMG_7871': { featureName: 'Auto-Invest (DCA)' },
  'IMG_7872': { featureName: 'Referral' },
  'IMG_7873': { featureName: 'API Management' },
  'IMG_7874': { featureName: 'Academy for Logged-in User' },
  'IMG_7875': { featureName: 'Public API' },
  
  // OKX TR
  'IMG_7876': { featureName: 'Mobile App' },
  'IMG_7877': { featureName: 'Web Trading' },
  'IMG_7878': { featureName: 'Convert' },
  'IMG_7879': { featureName: 'Copy Trading' },
  'IMG_7880': { featureName: 'Trade Bots for Users' },
  
  // Binance TR
  'IMG_7843': { featureName: 'Mobile App' },
  'IMG_7844': { featureName: 'Web Trading' },
  'IMG_7845': { featureName: 'Convert' },
  'IMG_7846': { featureName: 'Auto-Invest (DCA)' },
  'IMG_7847': { featureName: 'Copy Trading' },
  'IMG_7848': { featureName: 'Trade Bots for Users' },
  'IMG_7849': { featureName: 'Flexible Staking' },
  'IMG_7850': { featureName: 'Locked Staking' },
  'IMG_7851': { featureName: 'Launchpool / Launchpad' },
  'IMG_7852': { featureName: 'NFT / Marketplace' },
  'IMG_7853': { featureName: 'Fan Token' },
  'IMG_7854': { featureName: 'Social Feed (Square)' },
  'IMG_7855': { featureName: 'Academy for Logged-in User' },
  'IMG_7856': { featureName: 'Referral' },
  'IMG_7857': { featureName: 'Affiliate (KOL Program)' },
  'IMG_7858': { featureName: 'Own Card' },
  'IMG_7859': { featureName: 'Pay (Payments)' },
  
  // Garanti Kripto
  'IMG_7791': { featureName: 'Mobile App' },
  'IMG_7792': { featureName: 'Web Trading' },
  'IMG_7793': { featureName: 'Sign up with Bank' },
  'IMG_7794': { featureName: 'Sign in with Bank' },
  'IMG_7795': { featureName: 'Convert' },
  'IMG_7796': { featureName: 'Price Alarm' },
  'IMG_7797': { featureName: 'Auto-Invest (DCA)' },
  'IMG_7798': { featureName: 'Flexible Staking' },
  'IMG_7799': { featureName: 'Academy for Logged-in User' },
  'IMG_7801': { featureName: 'Corporate Registration' },
  'IMG_7802': { featureName: 'Referral' },
  'IMG_7803': { featureName: 'API Management' }
};

// Feature name mappings for common patterns
const featurePatterns = {
  'onboarding': 'Sign up with Bank',
  'login': 'Sign in with Bank',
  'signin': 'Sign in with Bank',
  'signup': 'Sign up with Bank',
  'register': 'Corporate Registration',
  'kyc': 'Sign up with Bank',
  'convert': 'Convert',
  'swap': 'Convert',
  'stake': 'Flexible Staking',
  'staking': 'Flexible Staking',
  'earn': 'Flexible Staking',
  'lending': 'Loan Borrowing',
  'borrow': 'Loan Borrowing',
  'p2p': 'On-Ramp / Off-Ramp (3rd Party)',
  'nft': 'NFT / Marketplace',
  'launchpad': 'Launchpool / Launchpad',
  'launchpool': 'Launchpool / Launchpad',
  'referral': 'Referral',
  'affiliate': 'Affiliate (KOL Program)',
  'academy': 'Academy for Logged-in User',
  'education': 'Academy for Logged-in User',
  'api': 'Public API',
  'bot': 'Trade Bots for Users',
  'copy': 'Copy Trading',
  'dca': 'Auto-Invest (DCA)',
  'alarm': 'Price Alarm',
  'alert': 'Price Alarm',
  'card': 'Own Card',
  'pay': 'Pay (Payments)',
  'social': 'Social Feed (Square)',
  'square': 'Social Feed (Square)',
  'gamification': 'Gamification',
  'fan': 'Fan Token',
  'desktop': 'Desktop App',
  'mobile': 'Mobile App',
  'web': 'Web App'
};

async function getFeatureFromFilename(filename: string): Promise<string | null> {
  // Check direct mapping first
  const nameWithoutExt = path.basename(filename, path.extname(filename));
  if (screenshotMappings[nameWithoutExt]?.featureName) {
    return screenshotMappings[nameWithoutExt].featureName!;
  }
  
  // Check patterns
  const lowerFilename = filename.toLowerCase();
  for (const [pattern, featureName] of Object.entries(featurePatterns)) {
    if (lowerFilename.includes(pattern)) {
      return featureName;
    }
  }
  
  return null;
}

async function importScreenshots() {
  console.log('🚀 Starting Screenshot Import...\n');
  
  const uploadsDir = path.join(process.cwd(), 'uploads', 'screenshots');
  
  if (!fs.existsSync(uploadsDir)) {
    console.error('❌ Screenshots directory not found:', uploadsDir);
    return;
  }
  
  // Get all competitors
  const competitors = await prisma.competitor.findMany();
  console.log(`Found ${competitors.length} competitors\n`);
  
  let totalImported = 0;
  let totalSkipped = 0;
  let totalErrors = 0;
  
  // Process each competitor directory
  for (const competitor of competitors) {
    const competitorDirs = [
      competitor.name,
      competitor.name.replace(' ', ''),
      competitor.name.replace(' ', '_'),
      competitor.name === 'BTCTurk' ? 'BTC Turk' : null,
      competitor.name === 'OKX TR' ? 'OKX TR' : null,
      competitor.name === 'BinanceTR' ? 'Binance TR' : null,
      competitor.name === 'Garanti Kripto' ? 'Garanti Kripto' : null
    ].filter(Boolean);
    
    let competitorDir: string | null = null;
    for (const dir of competitorDirs) {
      const testPath = path.join(uploadsDir, dir!);
      if (fs.existsSync(testPath)) {
        competitorDir = testPath;
        break;
      }
    }
    
    if (!competitorDir) {
      console.log(`⚠️  No directory found for ${competitor.name}`);
      continue;
    }
    
    console.log(`\n📁 Processing ${competitor.name}...`);
    
    // Get all screenshots in the directory (including subdirectories)
    const screenshots = getAllFiles(competitorDir).filter(file => 
      ['.png', '.jpg', '.jpeg', '.webp'].includes(path.extname(file).toLowerCase())
    );
    
    console.log(`   Found ${screenshots.length} screenshots`);
    
    for (const screenshotPath of screenshots) {
      const relativePath = path.relative(process.cwd(), screenshotPath);
      const urlPath = '/' + relativePath.replace(/\\/g, '/');
      
      // Try to determine the feature
      const featureName = await getFeatureFromFilename(screenshotPath);
      
      if (!featureName) {
        console.log(`   ⚠️  No feature mapping for: ${path.basename(screenshotPath)}`);
        totalSkipped++;
        continue;
      }
      
      // Find the feature
      const feature = await prisma.feature.findUnique({
        where: { name: featureName }
      });
      
      if (!feature) {
        console.log(`   ⚠️  Feature not found: ${featureName}`);
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
      }
      
      // Check if screenshot already exists
      const existingScreenshot = await prisma.competitorFeatureScreenshot.findFirst({
        where: {
          competitorFeatureId: competitorFeature.id,
          screenshotPath: urlPath
        }
      });
      
      if (existingScreenshot) {
        console.log(`   ⏭️  Already exists: ${path.basename(screenshotPath)}`);
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
        
        console.log(`   ✅ Imported: ${path.basename(screenshotPath)} → ${feature.name}`);
        totalImported++;
      } catch (error) {
        console.error(`   ❌ Error importing ${path.basename(screenshotPath)}:`, error);
        totalErrors++;
      }
    }
  }
  
  console.log(`
📊 Import Summary:
   - Total Imported: ${totalImported}
   - Total Skipped: ${totalSkipped}
   - Total Errors: ${totalErrors}
   
✅ Screenshot import completed!
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

importScreenshots()
  .catch(console.error)
  .finally(() => prisma.$disconnect());