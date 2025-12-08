import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const TR_COMPETITORS = [
    'BiLira',
    'BinanceTR',
    'Bitexen',
    'BTCTurk',
    'BybitTR',
    'CoinTR',
    'Garanti Kripto',
    'GateTR',
    'Icrypex',
    'Kuantist',
    'KucoinTR',
    'Midas Kripto',
    'OKX TR',
    'Ortak App',
    'Paribu',
    'Stablex'
];

const GLOBAL_COMPETITORS = [
    'Binance Global',
    'Coinbase',
    'Kraken',
    'Revolut'
];

async function main() {
    console.log('🚀 Starting competitor region update...');

    // Update TR Competitors
    for (const name of TR_COMPETITORS) {
        try {
            const result = await prisma.competitor.updateMany({
                where: { name },
                data: { region: 'TR' }
            });
            if (result.count > 0) {
                console.log(`✅ Updated ${name} -> TR`);
            } else {
                console.warn(`⚠️ Competitor not found: ${name}`);
            }
        } catch (error) {
            console.error(`❌ Failed to update ${name}:`, error);
        }
    }

    // Update Global Competitors
    for (const name of GLOBAL_COMPETITORS) {
        try {
            const result = await prisma.competitor.updateMany({
                where: { name },
                data: { region: 'Global' }
            });
            if (result.count > 0) {
                console.log(`✅ Updated ${name} -> Global`);
            } else {
                console.warn(`⚠️ Competitor not found: ${name}`);
            }
        } catch (error) {
            console.error(`❌ Failed to update ${name}:`, error);
        }
    }

    console.log('🏁 Update complete.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
