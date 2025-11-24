import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Turkish exchanges that should have "TR" region
const TR_EXCHANGES = new Set([
    'BTCTurk',
    'BTC Turk',
    'Paribu',
    'BinanceTR',
    'Binance TR',
    'Bitexen',
    'Icrypex',
    'CoinTR',
    'Coin TR',
    'KucoinTR',
    'Kucoin TR',
    'OKX TR',
    'BiLira',
    'Ortak App',
    'Garanti Kripto',
    'GateTR',
    'Gate TR',
    'Midas Kripto',
    'BybitTR',
    'Bybit TR',
    'Kuantist'
]);

function getRegion(competitorName: string): string {
    if (TR_EXCHANGES.has(competitorName)) {
        return 'TR';
    }
    return 'Global';
}

async function populateRegions() {
    console.log('🌍 Starting region population...\n');

    try {
        // Get all competitors
        const competitors = await prisma.competitor.findMany({
            select: {
                id: true,
                name: true,
                region: true
            }
        });

        console.log(`Found ${competitors.length} competitors\n`);

        let updated = 0;
        let skipped = 0;

        for (const competitor of competitors) {
            const region = getRegion(competitor.name);

            // Only update if region is different or null
            if (competitor.region !== region) {
                await prisma.competitor.update({
                    where: { id: competitor.id },
                    data: { region }
                });

                console.log(`✓ ${competitor.name.padEnd(25)} → ${region}`);
                updated++;
            } else {
                skipped++;
            }
        }

        console.log(`\n✅ Region population complete!`);
        console.log(`   Updated: ${updated}`);
        console.log(`   Skipped: ${skipped}`);
        console.log(`   Total: ${competitors.length}`);

        // Show region distribution
        const byRegion = await prisma.competitor.groupBy({
            by: ['region'],
            _count: true
        });

        console.log('\n📊 Region Distribution:');
        byRegion.forEach(r => {
            console.log(`   ${(r.region || 'Unknown').padEnd(10)} : ${r._count}`);
        });

    } catch (error) {
        console.error('❌ Error populating regions:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

populateRegions();
