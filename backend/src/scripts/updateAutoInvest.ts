import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🔄 Auto Invest (DCA) production update...\n');

    try {
        // Önce doğru feature'ı bul (production'daki)
        const feature = await prisma.feature.findFirst({
            where: { name: 'Auto-Invest (DCA)' }
        });

        if (!feature) {
            console.log('❌ Feature bulunamadı!');
            return;
        }

        console.log(`✅ Feature: ${feature.name} (${feature.id})`);

        // Revolut, OKX TR, CoinTR bul
        const toAdd = ['Revolut', 'OKX TR', 'CoinTR'];

        for (const name of toAdd) {
            const competitor = await prisma.competitor.findFirst({
                where: { name }
            });

            if (!competitor) {
                console.log(`   ⚠️ ${name} bulunamadı`);
                continue;
            }

            try {
                await prisma.competitorFeature.upsert({
                    where: {
                        competitorId_featureId: {
                            competitorId: competitor.id,
                            featureId: feature.id
                        }
                    },
                    update: { hasFeature: true, implementationQuality: 'good' },
                    create: {
                        competitorId: competitor.id,
                        featureId: feature.id,
                        hasFeature: true,
                        implementationQuality: 'good'
                    }
                });
                console.log(`   ✅ ${name} eklendi`);
            } catch (e: any) {
                console.log(`   ❌ ${name}: ${e.message}`);
            }
        }

        // Verify
        const count = await prisma.competitorFeature.count({
            where: { featureId: feature.id, hasFeature: true }
        });
        console.log(`\n📊 Toplam: ${count} borsada var`);

        const all = await prisma.competitorFeature.findMany({
            where: { featureId: feature.id, hasFeature: true },
            include: { competitor: { select: { name: true } } }
        });
        all.forEach(x => console.log(`   - ${x.competitor.name}`));

    } catch (error) {
        console.error('❌ Hata:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
