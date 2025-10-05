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

async function importAllScreenshots(dirPath: string, competitorId: string, competitorName: string) {
  let totalAdded = 0;
  let displayOrder = 0;
  
  // Bu rakibin tüm feature'larını al
  const competitorFeatures = await prisma.competitorFeature.findMany({
    where: { 
      competitorId,
      hasFeature: true 
    },
    include: {
      feature: true
    }
  });
  
  if (competitorFeatures.length === 0) {
    console.log(`   ⚠️  No features found for ${competitorName}`);
    return 0;
  }
  
  console.log(`   📋 Found ${competitorFeatures.length} features for ${competitorName}`);
  
  // Default olarak ilk feature'ı kullan (genelde Mobile App veya Web App)
  const defaultFeature = competitorFeatures.find(cf => 
    cf.feature.name.includes('Mobile App') || cf.feature.name.includes('Web App')
  ) || competitorFeatures[0];
  
  async function scan(currentPath: string, level: number = 0) {
    const entries = fs.readdirSync(currentPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(currentPath, entry.name);
      
      if (entry.isFile() && isImageFile(entry.name)) {
        try {
          // Relative path oluştur
          const relativePath = path.relative(process.cwd(), fullPath);
          
          // Aynı screenshot var mı kontrol et
          const existing = await prisma.competitorFeatureScreenshot.findFirst({
            where: {
              competitorFeatureId: defaultFeature.id,
              screenshotPath: relativePath
            }
          });
          
          if (!existing) {
            await prisma.competitorFeatureScreenshot.create({
              data: {
                competitorFeatureId: defaultFeature.id,
                screenshotPath: relativePath,
                caption: `${competitorName} - ${entry.name}`,
                displayOrder: displayOrder++
              }
            });
            totalAdded++;
            
            if (totalAdded % 10 === 0) {
              console.log(`      ✅ Added ${totalAdded} screenshots...`);
            }
          }
        } catch (error: any) {
          console.error(`      ❌ Error adding ${entry.name}: ${error.message}`);
        }
      } else if (entry.isDirectory() && !entry.name.startsWith('.') && level < 3) {
        // Alt klasörleri de tara (max 3 seviye)
        await scan(fullPath, level + 1);
      }
    }
  }
  
  await scan(dirPath);
  return totalAdded;
}

async function main() {
  console.log('📸 Importing ALL screenshots to CompetitorLens Matrix...\n');

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

    let grandTotal = 0;

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

      console.log(`   ✅ Found: ${competitor.name} (ID: ${competitor.id})`);

      // Tüm screenshot'ları import et
      const count = await importAllScreenshots(competitorPath, competitor.id, competitor.name);
      console.log(`   📸 Total imported: ${count} screenshots`);
      grandTotal += count;
    }

    // Özet
    console.log('\n' + '='.repeat(50));
    console.log('📊 Import Summary:');
    console.log(`   Grand Total Screenshots Imported: ${grandTotal}`);
    
    // Database istatistikleri
    const stats = await prisma.competitorFeatureScreenshot.count();
    const byCompetitor = await prisma.competitorFeature.findMany({
      select: {
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
    
    console.log(`\n📈 Database Statistics:`);
    console.log(`   Total Screenshot Records: ${stats}`);
    console.log(`\n🏆 Screenshots by Competitor:`);
    
    byCompetitor.forEach(item => {
      if (item._count.screenshots > 0) {
        console.log(`   ${item.competitor.name}: ${item._count.screenshots} screenshots`);
      }
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error);
