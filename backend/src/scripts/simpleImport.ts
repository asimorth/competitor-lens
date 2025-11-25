import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function simpleImport() {
  console.log('🚀 Simple Screenshot Import Started...\n');
  
  // Önce tüm competitor ve feature'ları al
  const competitors = await prisma.competitor.findMany();
  const features = await prisma.feature.findMany();
  
  console.log(`📋 Found ${competitors.length} competitors, ${features.length} features\n`);
  
  const uploadsPath = path.join(process.cwd(), 'uploads', 'screenshots');
  const folders = fs.readdirSync(uploadsPath);
  
  let added = 0;
  let skipped = 0;
  
  for (const folderName of folders) {
    if (folderName.startsWith('.')) continue;
    
    const folderPath = path.join(uploadsPath, folderName);
    if (!fs.statSync(folderPath).isDirectory()) continue;
    
    // Competitor match (basit)
    const normalized = folderName.toLowerCase().replace(/\s/g, '').replace(/ı/g, 'i').replace(/ü/g, 'u').replace(/ş/g, 's').replace(/ğ/g, 'g').replace(/ö/g, 'o').replace(/ç/g, 'c');
    
    const competitor = competitors.find(c => {
      const cNorm = c.name.toLowerCase().replace(/\s/g, '').replace(/ı/g, 'i').replace(/ü/g, 'u').replace(/ş/g, 's').replace(/ğ/g, 'g').replace(/ö/g, 'o').replace(/ç/g, 'c');
      return cNorm.includes(normalized) || normalized.includes(cNorm) || cNorm === normalized;
    });
    
    if (!competitor) {
      console.log(`❌ ${folderName} - Competitor not found`);
      continue;
    }
    
    console.log(`\n📊 ${folderName} → ${competitor.name}`);
    
    // Root dosyalar
    const rootFiles = fs.readdirSync(folderPath).filter(f => f.match(/\.(png|PNG|jpg|jpeg|JPEG)$/));
    const mobileApp = features.find(f => f.name === 'Mobile App');
    
    for (const file of rootFiles) {
      const filePath = `uploads/screenshots/${folderName}/${file}`;
      const existing = await prisma.screenshot.findFirst({
        where: { competitorId: competitor.id, filePath }
      });
      
      if (existing) { skipped++; continue; }
      
      await prisma.screenshot.create({
        data: {
          competitorId: competitor.id,
          featureId: mobileApp?.id,
          filePath,
          fileName: file,
          fileSize: BigInt(0),
          mimeType: 'image/png',
          uploadSource: 'simple-import'
        }
      });
      added++;
    }
    
    if (rootFiles.length > 0) console.log(`  ✅ Root: ${rootFiles.length}`);
    
    // Alt klasörler
    const entries = fs.readdirSync(folderPath, { withFileTypes: true });
    
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      
      const subdirPath = path.join(folderPath, entry.name);
      const files = fs.readdirSync(subdirPath).filter(f => f.match(/\.(png|PNG|jpg|jpeg|JPEG)$/));
      
      // Feature mapping
      const lower = entry.name.toLowerCase();
      let feature = null;
      
      if (lower.includes('kyc')) feature = features.find(f => f.name.includes('KYC'));
      else if (lower.includes('onboard')) feature = features.find(f => f.name.includes('Onboarding'));
      else if (lower.includes('dashboard')) feature = features.find(f => f.name.includes('Dashboard'));
      else if (lower.includes('wallet')) feature = features.find(f => f.name.includes('Dashboard'));
      else if (lower.includes('ai')) feature = features.find(f => f.name.includes('AI'));
      else if (lower.includes('try') || lower.includes('nema')) feature = features.find(f => f.name.includes('TRY'));
      else feature = mobileApp;
      
      for (const file of files) {
        const filePath = `uploads/screenshots/${folderName}/${entry.name}/${file}`;
        const existing = await prisma.screenshot.findFirst({
          where: { competitorId: competitor.id, filePath }
        });
        
        if (existing) { skipped++; continue; }
        
        await prisma.screenshot.create({
          data: {
            competitorId: competitor.id,
            featureId: feature?.id,
            filePath,
            fileName: file,
            fileSize: BigInt(0),
            mimeType: 'image/png',
            uploadSource: 'simple-import'
          }
        });
        added++;
      }
      
      if (files.length > 0) console.log(`  ✅ ${entry.name}: ${files.length}`);
    }
  }
  
  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`✅ Added: ${added}`);
  console.log(`⏭️  Skipped: ${skipped}`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━\n`);
}

simpleImport()
  .then(() => prisma.$disconnect())
  .catch((e) => { console.error(e); prisma.$disconnect(); });

