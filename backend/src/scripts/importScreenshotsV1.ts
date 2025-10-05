import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

// Dosya tipini kontrol et
function isImageFile(filename: string): boolean {
  const ext = path.extname(filename).toLowerCase();
  return ['.png', '.jpg', '.jpeg', '.webp', '.gif'].includes(ext);
}

// Rakip isimlerini normalize et
function normalizeCompetitorName(name: string): string {
  const mapping: Record<string, string> = {
    'Binance TR': 'BinanceTR',
    'Binance Global': 'Binance Global',
    'BTC Turk': 'BTCTurk',
    'Garanti Kripto': 'Garanti Kripto',
    'OKX TR': 'OKX TR',
  };
  
  return mapping[name] || name;
}

// Feature ismi tahmin et (basit bir yaklaşım)
function guessFeatureFromPath(filePath: string): string | null {
  const pathLower = filePath.toLowerCase();
  
  // Klasör isimlerinden feature tahmin et
  if (pathLower.includes('ai tool')) return 'AI Sentimentals';
  if (pathLower.includes('onboarding')) return 'Onboarding';
  if (pathLower.includes('login') || pathLower.includes('sign')) return 'Authentication';
  if (pathLower.includes('payment') || pathLower.includes('pay')) return 'Pay (Payments)';
  if (pathLower.includes('staking')) return 'Flexible Staking';
  if (pathLower.includes('convert')) return 'Convert';
  if (pathLower.includes('academy')) return 'Academy for Logged-in User';
  if (pathLower.includes('card')) return 'Own Card';
  if (pathLower.includes('chain')) return 'Own Chain';
  if (pathLower.includes('stablecoin')) return 'Own Stablecoin';
  
  return null;
}

async function importScreenshotsToFeatures(dirPath: string, competitorId: string) {
  const screenshots: any[] = [];
  let totalAdded = 0;
  
  async function scan(currentPath: string, currentFeature: string | null = null) {
    const entries = fs.readdirSync(currentPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(currentPath, entry.name);
      
      if (entry.isFile() && isImageFile(entry.name)) {
        // Feature tahmin et
        const featureName = currentFeature || guessFeatureFromPath(fullPath);
        
        if (featureName) {
          // Feature'ı bul
          const feature = await prisma.feature.findFirst({
            where: { 
              OR: [
                { name: featureName },
                { name: { contains: featureName } }
              ]
            }
          });
          
          if (feature) {
            // CompetitorFeature ilişkisini bul veya oluştur
            let competitorFeature = await prisma.competitorFeature.findFirst({
              where: {
                competitorId,
                featureId: feature.id
              }
            });
            
            if (!competitorFeature) {
              competitorFeature = await prisma.competitorFeature.create({
                data: {
                  competitorId,
                  featureId: feature.id,
                  hasFeature: true
                }
              });
            }
            
            // Screenshot'ı ekle
            try {
              // Relative path oluştur
              const relativePath = path.relative(process.cwd(), fullPath);
              
              // Aynı screenshot var mı kontrol et
              const existing = await prisma.competitorFeatureScreenshot.findFirst({
                where: {
                  competitorFeatureId: competitorFeature.id,
                  screenshotPath: relativePath
                }
              });
              
              if (!existing) {
                await prisma.competitorFeatureScreenshot.create({
                  data: {
                    competitorFeatureId: competitorFeature.id,
                    screenshotPath: relativePath,
                    caption: entry.name,
                    displayOrder: totalAdded
                  }
                });
                totalAdded++;
                console.log(`      ✅ Added: ${entry.name} -> ${feature.name}`);
              }
            } catch (error) {
              console.error(`      ❌ Error adding ${entry.name}:`, error);
            }
          }
        }
      } else if (entry.isDirectory() && !entry.name.startsWith('.')) {
        // Alt klasör için feature tahmin et
        const subFeature = guessFeatureFromPath(entry.name) || currentFeature;
        await scan(fullPath, subFeature);
      }
    }
  }
  
  await scan(dirPath);
  return totalAdded;
}

async function main() {
  console.log('📸 Importing screenshots to V1 structure...\n');

  try {
    const uploadsDir = path.join(process.cwd(), 'uploads', 'screenshots');
    
    if (!fs.existsSync(uploadsDir)) {
      console.log('❌ Screenshots directory not found!');
      return;
    }

    // Her rakip klasörünü tara
    const competitorFolders = fs.readdirSync(uploadsDir, { withFileTypes: true })
      .filter(entry => entry.isDirectory() && !entry.name.startsWith('.'))
      .map(entry => entry.name);

    console.log(`📁 Found ${competitorFolders.length} competitor folders\n`);

    let totalImported = 0;

    for (const folderName of competitorFolders) {
      const competitorPath = path.join(uploadsDir, folderName);
      const competitorName = normalizeCompetitorName(folderName);
      
      console.log(`\n🏢 Processing: ${folderName}`);

      // Rakibi bul
      const competitor = await prisma.competitor.findFirst({
        where: { 
          OR: [
            { name: competitorName },
            { name: { contains: folderName.split(' ')[0] } }
          ]
        }
      });

      if (!competitor) {
        console.log(`   ❌ Competitor not found in database`);
        continue;
      }

      console.log(`   ✅ Found: ${competitor.name}`);

      // Screenshot'ları import et
      const count = await importScreenshotsToFeatures(competitorPath, competitor.id);
      console.log(`   📸 Total imported: ${count} screenshots`);
      totalImported += count;
    }

    // Özet
    console.log('\n' + '='.repeat(50));
    console.log('📊 Import Summary:');
    console.log(`   Total Screenshots Imported: ${totalImported}`);
    
    // Database istatistikleri
    const stats = await prisma.competitorFeatureScreenshot.groupBy({
      by: ['competitorFeatureId'],
      _count: true
    });
    
    console.log(`\n📈 Database Statistics:`);
    console.log(`   Total Screenshot Records: ${stats.reduce((sum, s) => sum + s._count, 0)}`);
    console.log(`   Features with Screenshots: ${stats.length}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error);
