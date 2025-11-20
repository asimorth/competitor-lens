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

// Feature öncelik mapping (Excel'deki coverage'a göre)
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

// Smart feature detection - supports multiple formats
const checkHasFeature = (value: any): boolean => {
  if (!value) return false;
  
  const valueStr = value.toString().trim().toLowerCase();
  
  // Supported "yes" formats
  const yesValues = ['var', 'yes', 'true', 'x', '✓', '✔', 'v', '1'];
  
  return yesValues.includes(valueStr);
};

async function importMatrixData() {
  console.log('🚀 Starting Matrix Data Import from Excel...\n');
  
  try {
    // Excel dosyasını oku
    const excelPath = path.join(process.cwd(), 'Matrix', 'feature_matrix_FINAL_v3.xlsx');
    const workbook = XLSX.readFile(excelPath);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
    
    if (data.length < 2) {
      throw new Error('Excel file has insufficient data');
    }
    
    // Headers (feature isimleri)
    const headers = data[0];
    const competitorNameIndex = 0;
    const regionIndex = 1;
    const coverageScoreIndex = headers.length - 1;
    
    // Feature'ları headers'dan çıkar (ilk 2 ve son sütun hariç)
    const features = headers.slice(2, -1);
    
    console.log(`Found ${features.length} features and ${data.length - 1} competitors\n`);
    
    // 1. Önce tüm Feature'ları oluştur/güncelle
    console.log('📝 Creating/Updating Features...');
    for (const featureName of features) {
      const category = featureCategories[featureName] || 'Other';
      const priority = getFeaturePriority(featureName);
      
      await prisma.feature.upsert({
        where: { name: featureName },
        update: {
          category,
          priority,
          description: `${featureName} feature for crypto exchanges`
        },
        create: {
          name: featureName,
          category,
          priority,
          description: `${featureName} feature for crypto exchanges`
        }
      });
      
      console.log(`   ✅ Feature: ${featureName} (${category}) - Priority: ${priority}`);
    }
    
    // 2. Competitor'ları ve ilişkileri oluştur
    console.log('\n👥 Processing Competitors...');
    
    // Validation tracking
    const validationReport = {
      totalProcessed: 0,
      totalFeatures: 0,
      totalYes: 0,
      totalNo: 0,
      invalidValues: [] as any[]
    };
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const competitorName = row[competitorNameIndex];
      const region = row[regionIndex];
      const coverageScore = row[coverageScoreIndex];
      
      if (!competitorName) continue;
      
      console.log(`\n   Processing: ${competitorName} (${region})`);
      validationReport.totalProcessed++;
      
      // Competitor oluştur/güncelle
      const competitor = await prisma.competitor.upsert({
        where: { name: competitorName },
        update: {
          description: `${region} crypto exchange - Coverage: ${coverageScore}%`,
          industry: 'Crypto Exchange',
          website: competitorName.toLowerCase().replace(/\s+/g, '') + '.com'
        },
        create: {
          name: competitorName,
          description: `${region} crypto exchange - Coverage: ${coverageScore}%`,
          industry: 'Crypto Exchange',
          website: competitorName.toLowerCase().replace(/\s+/g, '') + '.com'
        }
      });
      
      // Feature ilişkilerini oluştur
      for (let j = 0; j < features.length; j++) {
        const featureName = features[j];
        const cellValue = row[j + 2];
        const hasFeature = checkHasFeature(cellValue);
        
        validationReport.totalFeatures++;
        if (hasFeature) {
          validationReport.totalYes++;
        } else {
          validationReport.totalNo++;
        }
        
        // Track unusual values for manual review
        if (cellValue && cellValue !== 'Var' && cellValue !== 'Yok' && cellValue !== '') {
          const cellStr = cellValue.toString().trim();
          if (cellStr && cellStr !== 'Var' && cellStr !== 'Yok') {
            validationReport.invalidValues.push({
              competitor: competitorName,
              feature: featureName,
              value: cellValue,
              interpreted: hasFeature ? 'YES' : 'NO'
            });
          }
        }
        
        const feature = await prisma.feature.findUnique({
          where: { name: featureName }
        });
        
        if (feature) {
          await prisma.competitorFeature.upsert({
            where: {
              competitorId_featureId: {
                competitorId: competitor.id,
                featureId: feature.id
              }
            },
            update: {
              hasFeature,
              implementationQuality: hasFeature ? 'good' : 'none',
              notes: `Coverage Score: ${coverageScore}% - ${region} platform`
            },
            create: {
              competitorId: competitor.id,
              featureId: feature.id,
              hasFeature,
              implementationQuality: hasFeature ? 'good' : 'none',
              notes: `Coverage Score: ${coverageScore}% - ${region} platform`
            }
          });
        }
      }
      
      console.log(`   ✅ ${competitorName} processed with ${features.length} features`);
    }
    
    // Validation Report
    console.log('\n📋 Validation Report:');
    console.log(`   - Total Competitors Processed: ${validationReport.totalProcessed}`);
    console.log(`   - Total Feature Cells: ${validationReport.totalFeatures}`);
    console.log(`   - Features with "Yes" (Var): ${validationReport.totalYes}`);
    console.log(`   - Features with "No" (Yok): ${validationReport.totalNo}`);
    
    if (validationReport.invalidValues.length > 0) {
      console.log(`\n⚠️  Non-standard values found (${validationReport.invalidValues.length} cells):`);
      validationReport.invalidValues.slice(0, 10).forEach(item => {
        console.log(`   - ${item.competitor} / ${item.feature}: "${item.value}" → ${item.interpreted}`);
      });
      if (validationReport.invalidValues.length > 10) {
        console.log(`   ... and ${validationReport.invalidValues.length - 10} more`);
      }
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
      _count: true
    });
    
    console.log('\n📁 Features by Category:');
    categorySummary.forEach(cat => {
      console.log(`   - ${cat.category}: ${cat._count} features`);
    });
    
    console.log('\n✅ Import completed successfully!');
    
  } catch (error) {
    console.error('❌ Import failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Script'i çalıştır
importMatrixData().catch(console.error);
