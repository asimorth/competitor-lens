import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Production Auto Invest (DCA) Update Script
 * Updates Auto-Invest feature to include Revolut, OKX TR, and CoinTR
 */
async function main() {
    console.log('🔄 Updating Auto-Invest (DCA) in PRODUCTION...\n');

    try {
        // Production Auto-Invest feature ID (from API)
        const featureId = '295b9b3e-4b29-43b0-b55d-0078a01fce4e';

        console.log(`Feature ID: ${featureId}`);

        // Find competitors
        const revolut = await prisma.competitor.findFirst({ where: { name: 'Revolut' } });
        const okxTr = await prisma.competitor.findFirst({ where: { name: 'OKX TR' } });
        const coinTr = await prisma.competitor.findFirst({ where: { name: 'CoinTR' } });

        if (!revolut || !okxTr || !coinTr) {
            console.log('❌ One or more competitors not found');
            console.log('Revolut:', revolut?.id);
            console.log('OKX TR:', okxTr?.id);
            console.log('CoinTR:', coinTr?.id);
            return;
        }

        console.log(`\n✅ Found competitors:`);
        console.log(`   Revolut: ${revolut.id}`);
        console.log(`   OKX TR: ${okxTr.id}`);
        console.log(`   CoinTR: ${coinTr.id}`);

        // Update each one
        const updates = [
            { name: 'Revolut', id: revolut.id },
            { name: 'OKX TR', id: okxTr.id },
            { name: 'CoinTR', id: coinTr.id }
        ];

        for (const comp of updates) {
            await prisma.competitorFeature.upsert({
                where: {
                    competitorId_featureId: {
                        competitorId: comp.id,
                        featureId
                    }
                },
                update: {
                    hasFeature: true,
                    implementationQuality: 'good',
                    notes: 'Auto-Invest (DCA) feature available'
                },
                create: {
                    competitorId: comp.id,
                    featureId,
                    hasFeature: true,
                    implementationQuality: 'good',
                    notes: 'Auto-Invest (DCA) feature available'
                }
            });
            console.log(`   ✅ ${comp.name} updated`);
        }

        // Verify
        const total = await prisma.competitorFeature.count({
            where: { featureId, hasFeature: true }
        });

        console.log(`\n📊 Total competitors with Auto-Invest: ${total}`);

        const all = await prisma.competitorFeature.findMany({
            where: { featureId, hasFeature: true },
            include: { competitor: { select: { name: true } } }
        });

        console.log('\n✅ Final list:');
        all.forEach(cf => console.log(`   - ${cf.competitor.name}`));

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
