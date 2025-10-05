import { PrismaClient } from '@prisma/client';
import * as path from 'path';
import * as fs from 'fs';

const prisma = new PrismaClient();

// Screenshot'ları rakip sayfalarında göstermek için competitor-screenshot ilişkisi kurmamız gerekiyor
// Ayrıca klasör yapısına göre daha akıllı bir atama yapacağız

async function analyzeScreenshotStructure() {
  console.log('🔍 Analyzing screenshot folder structure...\n');
  
  const uploadsDir = path.join(process.cwd(), 'uploads', 'screenshots');
  const structure: Record<string, Record<string, string[]>> = {};
  
  // Her rakip klasörünü analiz et
  const competitorFolders = fs.readdirSync(uploadsDir, { withFileTypes: true })
    .filter(entry => entry.isDirectory() && !entry.name.startsWith('.'));
  
  for (const folder of competitorFolders) {
    const competitorPath = path.join(uploadsDir, folder.name);
    structure[folder.name] = {};
    
    // Alt klasörleri kontrol et
    const subFolders = fs.readdirSync(competitorPath, { withFileTypes: true });
    
    for (const entry of subFolders) {
      if (entry.isDirectory()) {
        const subPath = path.join(competitorPath, entry.name);
        const files = fs.readdirSync(subPath)
          .filter(f => /\.(png|jpg|jpeg|webp)$/i.test(f));
        
        if (files.length > 0) {
          structure[folder.name][entry.name] = files;
        }
      } else if (/\.(png|jpg|jpeg|webp)$/i.test(entry.name)) {
        if (!structure[folder.name]['_root']) {
          structure[folder.name]['_root'] = [];
        }
        structure[folder.name]['_root'].push(entry.name);
      }
    }
  }
  
  return structure;
}

// Klasör isminden feature tahmin et
function guessFeatureFromFolder(folderName: string): string | null {
  const folderLower = folderName.toLowerCase();
  
  // Doğrudan eşleşmeler
  const directMappings: Record<string, string> = {
    'ai tool': 'AI Sentimentals',
    'ai_tool': 'AI Sentimentals',
    'onboarding': 'Onboarding',
    'passkey': 'Sign in with Passkey',
    'passkeys': 'Sign in with Passkey',
    'sign in with passkey': 'Sign in with Passkey',
    'auto-invest': 'Auto-Invest (DCA)',
    'auto invest': 'Auto-Invest (DCA)',
    'dca': 'Auto-Invest (DCA)',
    'convert': 'Convert',
    'flexible staking': 'Flexible Staking',
    'staking': 'Flexible Staking',
    'locked staking': 'Locked Staking',
    'mobile app': 'Mobile App',
    'web app': 'Web App',
    'pay': 'Pay (Payments)',
    'payments': 'Pay (Payments)',
    'academy': 'Academy for Logged-in User',
    'card': 'Own Card',
    'chain': 'Own Chain',
    'stablecoin': 'Own Stablecoin',
    'on-ramp': 'On-Ramp / Off-Ramp (3rd Party)',
    'off-ramp': 'On-Ramp / Off-Ramp (3rd Party)',
    'onramp': 'On-Ramp / Off-Ramp (3rd Party)',
    'offramp': 'On-Ramp / Off-Ramp (3rd Party)'
  };
  
  for (const [key, value] of Object.entries(directMappings)) {
    if (folderLower === key || folderLower.includes(key)) {
      return value;
    }
  }
  
  return null;
}

async function main() {
  console.log('🎯 Smart Screenshot Assignment Starting...\n');

  try {
    // Klasör yapısını analiz et
    const structure = await analyzeScreenshotStructure();
    
    console.log('📁 Folder Structure:');
    for (const [competitor, folders] of Object.entries(structure)) {
      console.log(`\n${competitor}:`);
      for (const [folder, files] of Object.entries(folders)) {
        console.log(`   ${folder}: ${files.length} files`);
      }
    }
    
    // Önce tüm screenshot kayıtlarını temizle
    console.log('\n🧹 Cleaning existing assignments...');
    await prisma.competitorFeatureScreenshot.deleteMany({});
    console.log('✅ Cleaned all screenshot assignments');
    
    // Yeniden atama yap
    console.log('\n📸 Reassigning screenshots based on folder structure...\n');
    
    let totalAssigned = 0;
    const assignmentSummary: Record<string, number> = {};
    
    for (const [competitorFolder, folders] of Object.entries(structure)) {
      // Rakibi bul
      const competitor = await prisma.competitor.findFirst({
        where: {
          OR: [
            { name: { contains: competitorFolder.split(' ')[0] } },
            { name: competitorFolder }
          ]
        }
      });
      
      if (!competitor) {
        console.log(`❌ Competitor not found: ${competitorFolder}`);
        continue;
      }
      
      console.log(`\n🏢 Processing ${competitor.name}:`);
      
      for (const [folder, files] of Object.entries(folders)) {
        let featureName: string | null = null;
        
        // Klasör ismine göre feature tahmin et
        if (folder !== '_root') {
          featureName = guessFeatureFromFolder(folder);
        }
        
        // Default olarak Mobile App veya Web App kullan
        if (!featureName) {
          // Dosya isimlerinden tahmin et
          const hasIos = files.some(f => f.toLowerCase().includes('ios'));
          const hasAndroid = files.some(f => f.toLowerCase().includes('android'));
          const hasMobile = files.some(f => f.toLowerCase().includes('mobile'));
          const hasWeb = files.some(f => f.toLowerCase().includes('web'));
          
          if (hasIos || hasAndroid || hasMobile) {
            featureName = 'Mobile App';
          } else {
            featureName = 'Web App';
          }
        }
        
        // Feature'ı bul
        const feature = await prisma.feature.findFirst({
          where: { name: featureName }
        });
        
        if (!feature) {
          console.log(`   ❌ Feature not found: ${featureName}`);
          continue;
        }
        
        // CompetitorFeature ilişkisini bul veya oluştur
        let competitorFeature = await prisma.competitorFeature.findFirst({
          where: {
            competitorId: competitor.id,
            featureId: feature.id
          }
        });
        
        if (!competitorFeature) {
          competitorFeature = await prisma.competitorFeature.create({
            data: {
              competitorId: competitor.id,
              featureId: feature.id,
              hasFeature: true,
              notes: `Auto-detected from ${folder} folder`
            }
          });
        }
        
        // Screenshot'ları ekle
        let addedCount = 0;
        for (const file of files) {
          const relativePath = folder === '_root' 
            ? `uploads/screenshots/${competitorFolder}/${file}`
            : `uploads/screenshots/${competitorFolder}/${folder}/${file}`;
          
          try {
            await prisma.competitorFeatureScreenshot.create({
              data: {
                competitorFeatureId: competitorFeature.id,
                screenshotPath: relativePath,
                caption: `${competitor.name} - ${featureName} - ${file}`,
                displayOrder: addedCount
              }
            });
            addedCount++;
          } catch (error) {
            // Duplicate hatalarını yoksay
          }
        }
        
        if (addedCount > 0) {
          console.log(`   ✅ ${folder} → ${featureName}: ${addedCount} screenshots`);
          totalAssigned += addedCount;
          
          const key = `${competitor.name} - ${featureName}`;
          assignmentSummary[key] = (assignmentSummary[key] || 0) + addedCount;
        }
      }
    }
    
    // Özet
    console.log('\n' + '='.repeat(50));
    console.log('📊 Assignment Summary:');
    console.log(`   Total Screenshots Assigned: ${totalAssigned}`);
    
    console.log('\n📈 Screenshots by Competitor & Feature:');
    const sortedSummary = Object.entries(assignmentSummary)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20);
    
    for (const [key, count] of sortedSummary) {
      console.log(`   ${key}: ${count} screenshots`);
    }
    
    // Feature coverage güncelle
    console.log('\n🔄 Updating feature coverage...');
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
    
    console.log('✅ Feature coverage updated');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error);
