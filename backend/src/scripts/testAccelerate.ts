import { prisma } from '../lib/db';

async function testAccelerate() {
  console.log('🚀 Prisma Accelerate Bağlantı Testi\n');
  
  try {
    // Basit bir query çalıştır
    console.log('1. Competitor sayısını kontrol ediyorum...');
    const competitorCount = await prisma.competitor.count();
    console.log(`✅ Toplam competitor sayısı: ${competitorCount}`);
    
    // İlk 3 competitor'ı getir
    console.log('\n2. İlk 3 competitor\'ı getiriyorum...');
    const competitors = await prisma.competitor.findMany({
      take: 3,
      select: {
        id: true,
        name: true,
        createdAt: true
      }
    });
    
    competitors.forEach((comp, index) => {
      console.log(`   ${index + 1}. ${comp.name} (${comp.createdAt.toLocaleDateString('tr-TR')})`);
    });
    
    // Feature sayısını kontrol et
    console.log('\n3. Feature sayısını kontrol ediyorum...');
    const featureCount = await prisma.feature.count();
    console.log(`✅ Toplam feature sayısı: ${featureCount}`);
    
    // Accelerate cache'i test et
    console.log('\n4. Cache performansını test ediyorum...');
    const startTime = Date.now();
    
    // Aynı query'yi 3 kez çalıştır
    for (let i = 0; i < 3; i++) {
      const start = Date.now();
      await prisma.competitor.findMany({
        where: { industry: { not: null } }
      });
      const duration = Date.now() - start;
      console.log(`   Query ${i + 1}: ${duration}ms`);
    }
    
    const totalDuration = Date.now() - startTime;
    console.log(`\n✅ Toplam süre: ${totalDuration}ms`);
    console.log('\n🎉 Prisma Accelerate bağlantısı başarılı!');
    
    // Environment bilgisi
    console.log('\n📋 Environment Bilgileri:');
    console.log(`   NODE_ENV: ${process.env.NODE_ENV}`);
    console.log(`   DATABASE_URL: ${process.env.DATABASE_URL?.substring(0, 50)}...`);
    
  } catch (error) {
    console.error('\n❌ Hata:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Script'i çalıştır
testAccelerate()
  .catch(console.error)
  .finally(() => process.exit(0));
