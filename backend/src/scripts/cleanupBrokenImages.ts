import { PrismaClient } from '@prisma/client';
import axios from 'axios';

const prisma = new PrismaClient();
const API_BASE_URL = 'https://competitor-lens-production.up.railway.app';

async function main() {
    console.log('🧹 Starting Broken Image Cleanup (Targeted: OKX & AI Sentimentals)...');

    // 1. Fetch screenshots for OKX and AI Sentimentals only
    const screenshots = await prisma.screenshot.findMany({
        where: {
            OR: [
                { competitor: { name: { contains: 'OKX', mode: 'insensitive' } } },
                { feature: { name: { contains: 'Sentiment', mode: 'insensitive' } } }
            ]
        },
        select: {
            id: true,
            filePath: true,
            fileName: true,
            competitor: {
                select: { name: true }
            },
            feature: {
                select: { name: true }
            }
        }
    });

    console.log(`📊 Found ${screenshots.length} matching screenshots in DB.`);

    let deletedCount = 0;
    let keptCount = 0;
    let errorCount = 0;

    // Process in chunks to avoid overwhelming the server
    const CHUNK_SIZE = 20;
    for (let i = 0; i < screenshots.length; i += CHUNK_SIZE) {
        const chunk = screenshots.slice(i, i + CHUNK_SIZE);

        await Promise.all(chunk.map(async (s) => {
            // Construct Public URL
            let relativePath = s.filePath;
            if (relativePath.startsWith('/app/')) {
                relativePath = relativePath.replace('/app/', '');
            }
            // Ensure it starts with /
            if (!relativePath.startsWith('/')) {
                relativePath = '/' + relativePath;
            }

            // Handle spaces in URL
            const parts = relativePath.split('/');
            const encodedParts = parts.map(p => encodeURIComponent(p));
            const finalPath = encodedParts.join('/');

            const url = `${API_BASE_URL}${finalPath}`;

            try {
                await axios.head(url, { timeout: 5000 });
                // console.log(`✅ OK: ${s.fileName}`);
                keptCount++;
            } catch (error: any) {
                if (error.response && error.response.status === 404) {
                    console.log(`❌ BROKEN (404): ${s.competitor.name} - ${s.fileName}`);
                    console.log(`   URL: ${url}`);

                    // DELETE RECORD
                    try {
                        await prisma.screenshot.delete({ where: { id: s.id } });
                        console.log(`   🗑️  Deleted record ${s.id}`);
                        deletedCount++;
                    } catch (delErr) {
                        console.error(`   ⚠️ Failed to delete: ${delErr}`);
                    }
                } else {
                    // Other error (timeout, 500, etc) - skip deletion to be safe
                    console.warn(`   ⚠️  Check failed for ${s.fileName}: ${error.message}`);
                    errorCount++;
                }
            }
        }));

        // Small delay between chunks
        await new Promise(resolve => setTimeout(resolve, 500));
        process.stdout.write(`\rProgress: ${Math.min(i + CHUNK_SIZE, screenshots.length)}/${screenshots.length}`);
    }

    console.log('\n\n🏁 Cleanup Complete');
    console.log(`   ✅ Kept: ${keptCount}`);
    console.log(`   🗑️  Deleted: ${deletedCount}`);
    console.log(`   ⚠️  Errors: ${errorCount}`);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
