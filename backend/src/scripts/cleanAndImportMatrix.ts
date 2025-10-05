import * as XLSX from 'xlsx';
import { PrismaClient } from '@prisma/client';
import * as path from 'path';

const prisma = new PrismaClient();

// Feature kategorileri mapping
const featureCategories: Record<string, string> = {
  // Platform
  'Web App': 'Platform',
  'Mobile App': 'Platform',
  'Desktop App': 'Platform',
  
  // Müşteri & Kayıt
  'Corporate Registration': 'Customer & Registration',
  'Global Customers': 'Customer & Registration',
  
  // Trading & Yatırım
  'Stocks & Commodity and Forex Trading': 'Trading',
  'Tokenized Stocks': 'Trading',
  'Copy Trading': 'Trading',
  'Trade Bots for Users': 'Trading',
  'Auto-Invest (DCA)': 'Trading',
  'Convert': 'Trading',
  'Convert Small Assets': 'Trading',
  'Dual Investment': 'Trading',
  
  // Kripto Altyapı
  'Crypto as a Services': 'Crypto Infrastructure',
  'Own Stablecoin': 'Crypto Infrastructure',
  'Own Chain': 'Crypto Infrastructure',
  'Own Card': 'Crypto Infrastructure',
  
  // Kimlik Doğrulama
  'Sign up with Bank': 'Authentication',
  'Sign in with Bank': 'Authentication',
  'Sign in with Passkey': 'Authentication',
  'Sign in with Gmail': 'Authentication',
  'Sign in with Apple': 'Authentication',
  'Sign in with Telegram': 'Authentication',
  'Sign in with Wallet': 'Authentication',
  'Login with QR': 'Authentication',
  
  // API & Teknoloji
  'Public API': 'API & Technology',
  'API Management': 'API & Technology',
  'AI Sentimentals': 'API & Technology',
  
  // Staking & Kazanç
  'Locked Staking': 'Earn',
  'Flexible Staking': 'Earn',
  'Loan Borrowing': 'Earn',
  'On-chain Earn': 'Earn',
  'VIP Loan': 'Earn',
  'TRY Nemalandırma': 'Earn',
  
  // Pazarlama & Büyüme
  'Referral': 'Marketing & Growth',
  'Affiliate (KOL Program)': 'Marketing & Growth',
  'Bug Bounty': 'Marketing & Growth',
  
  // Ödeme & Finansal
  'On-Ramp / Off-Ramp (3rd Party)': 'Payment & Financial',
  'Pay (Payments)': 'Payment & Financial',
  
  // Eğitim & Sosyal
  'Academy for Logged-in User': 'Education & Social',
  'Social Feed (Square)': 'Education & Social',
  
  // NFT & Oyun
  'NFT / Marketplace': 'NFT & Gaming',
  'Fan Token': 'NFT & Gaming',
  'Gamification': 'NFT & Gaming',
  'Launchpool / Launchpad': 'NFT & Gaming',
  
  // Diğer
  'Price Alarm': 'Other'
};

// Feature öncelik mapping
const getFeaturePriority = (featureName: string): string => {
  const criticalFeatures = [
    'Web App', 'Mobile App', 'Sign in with Gmail', 
    'Sign in with Apple', 'Convert', 'Public API'
  ];
  
  const highPriorityFeatures = [
    'Corporate Registration', 'Global Customers',
    'Auto-Invest (DCA)', 'Flexible Staking', 'Referral'
  ];
  
  if (criticalFeatures.includes(featureName)) return 'critical';
  if (highPriorityFeatures.includes(featureName)) return 'high';
  return 'medium';
};

async function cleanAndImportMatrix() {
  console.log('🧹 Cleaning existing data...\n');
  
  try {
    // Önce mevcut verileri temizle
    await prisma.competitorFeature.deleteMany({});
    await prisma.feature.deleteMany({});
    await prisma.competitor.deleteMany({});
    
    console.log('✅ Existing data cleaned\n');
    
    // Excel dosyasını oku
    console.log('📊 Reading Excel file...\n');
    const excelPath = path.join(process.cwd(), 'Matrix', 'feature_matrix_FINAL_v3.xlsx');
    const workbook = XLSX.readFile(excelPath);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
    
    if (data.length < 2) {
      throw new Error('Excel file has insufficient data');
    }
    
    // Headers
    const headers = data[0];
    const competitorNameIndex = 0;
    const regionIndex = 1;
    const coverageScoreIndex = headers.length - 1;
    
    // Feature'ları çıkar
    const features = headers.slice(2, -1);
    
    console.log(`Found ${features.length} features and ${data.length - 1} competitors\n`);
    
    // 1. Feature'ları oluştur
    console.log('📝 Creating Features...');
    const featureMap = new Map<string, string>();
    
    for (const featureName of features) {
      if (!featureName || typeof featureName !== 'string') continue;
      
      const category = featureCategories[featureName] || 'Other';
      const priority = getFeaturePriority(featureName);
      
      try {
        const feature = await prisma.feature.create({
          data: {
            name: featureName,
            category,
            priority,
            description: `${featureName} feature for crypto exchanges`
          }
        });
        
        featureMap.set(featureName, feature.id);
        console.log(`   ✅ ${featureName} (${category})`);
      } catch (err) {
        console.log(`   ⚠️  Skipped duplicate: ${featureName}`);
      }
    }
    
    // 2. Competitor'ları oluştur
    console.log('\n👥 Creating Competitors and Relations...');
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const competitorName = row[competitorNameIndex];
      const region = row[regionIndex];
      const coverageScore = row[coverageScoreIndex];
      
      if (!competitorName || typeof competitorName !== 'string') continue;
      
      console.log(`\n   📌 ${competitorName} (${region})`);
      
      // Competitor oluştur
      let competitor;
      try {
        competitor = await prisma.competitor.create({
          data: {
            name: competitorName,
            description: `${region} crypto exchange - Coverage: ${coverageScore}%`,
            industry: 'Crypto Exchange',
            website: `https://${competitorName.toLowerCase().replace(/\s+/g, '')}.com`
          }
        });
      } catch (err) {
        console.log(`   ⚠️  Competitor already exists: ${competitorName}`);
        competitor = await prisma.competitor.findUnique({
          where: { name: competitorName }
        });
      }
      
      if (!competitor) continue;
      
      // Feature ilişkilerini oluştur
      let featureCount = 0;
      for (let j = 0; j < features.length; j++) {
        const featureName = features[j];
        const featureId = featureMap.get(featureName);
        const hasFeature = row[j + 2] === 'Var';
        
        if (featureId) {
          try {
            await prisma.competitorFeature.create({
              data: {
                competitorId: competitor.id,
                featureId: featureId,
                hasFeature,
                implementationQuality: hasFeature ? 'good' : 'none',
                notes: `Coverage Score: ${coverageScore}% - ${region} platform`
              }
            });
            if (hasFeature) featureCount++;
          } catch (err) {
            // İlişki zaten varsa skip
          }
        }
      }
      
      console.log(`   ✅ Added ${featureCount} features`);
    }
    
    // 3. İstatistikleri göster
    const totalCompetitors = await prisma.competitor.count();
    const totalFeatures = await prisma.feature.count();
    const totalRelations = await prisma.competitorFeature.count();
    
    console.log('\n📊 Import Summary:');
    console.log(`   - Total Competitors: ${totalCompetitors}`);
    console.log(`   - Total Features: ${totalFeatures}`);
    console.log(`   - Total Relations: ${totalRelations}`);
    
    // 4. Kategori bazlı özet
    const categorySummary = await prisma.feature.groupBy({
      by: ['category'],
      _count: true,
      orderBy: {
        _count: {
          category: 'desc'
        }
      }
    });
    
    console.log('\n📁 Features by Category:');
    categorySummary.forEach(cat => {
      console.log(`   - ${cat.category}: ${cat._count} features`);
    });
    
    // 5. Coverage özeti
    const competitors = await prisma.competitor.findMany({
      include: {
        features: {
          where: { hasFeature: true }
        }
      }
    });
    
    console.log('\n🏆 Top Competitors by Coverage:');
    competitors
      .sort((a, b) => b.features.length - a.features.length)
      .slice(0, 5)
      .forEach((comp, index) => {
        const coverage = ((comp.features.length / totalFeatures) * 100).toFixed(1);
        console.log(`   ${index + 1}. ${comp.name}: ${comp.features.length}/${totalFeatures} features (${coverage}%)`);
      });
    
    console.log('\n✅ Import completed successfully!');
    
  } catch (error) {
    console.error('❌ Import failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Script'i çalıştır
cleanAndImportMatrix().catch(console.error);
