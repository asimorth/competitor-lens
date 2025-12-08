import axios from 'axios';

const API_BASE_URL = 'https://competitor-lens-production.up.railway.app';

async function main() {
    console.log('🧹 Starting Broken Image Cleanup (API Mode)...');

    // 1. Fetch screenshots for OKX and AI Sentimentals
    // We have to fetch all and filter client-side because API filtering is limited
    console.log('📥 Fetching screenshots...');
    const res = await axios.get(`${API_BASE_URL}/api/screenshots?limit=2000`);
    const allScreenshots = res.data.data;

    const targets = allScreenshots.filter((s: any) => {
        const isOKX = s.competitor?.name?.toLowerCase().includes('okx');
        const isSentiment = s.feature?.name?.toLowerCase().includes('sentiment');
        return isOKX || isSentiment;
    });

    console.log(`📊 Found ${targets.length} target screenshots (OKX + Sentiment).`);

    let deletedCount = 0;
    let keptCount = 0;

    for (const s of targets) {
        // Construct Public URL
        let relativePath = s.filePath;
        if (relativePath.startsWith('/app/')) {
            relativePath = relativePath.replace('/app/', '');
        }
        if (!relativePath.startsWith('/')) {
            relativePath = '/' + relativePath;
        }

        // Handle spaces
        const parts = relativePath.split('/');
        const encodedParts = parts.map((p: string) => encodeURIComponent(p));
        const finalPath = encodedParts.join('/');

        const url = `${API_BASE_URL}${finalPath}`;

        try {
            await axios.head(url, { timeout: 5000 });
            // console.log(`✅ OK: ${s.fileName}`);
            keptCount++;
        } catch (error: any) {
            if (error.response && error.response.status === 404) {
                console.log(`❌ BROKEN (404): ${s.competitor?.name} - ${s.fileName}`);
                console.log(`   URL: ${url}`);

                // DELETE via API
                try {
                    await axios.delete(`${API_BASE_URL}/api/screenshots/${s.id}`);
                    console.log(`   🗑️  Deleted record ${s.id}`);
                    deletedCount++;
                } catch (delErr: any) {
                    console.error(`   ⚠️ Failed to delete: ${delErr.message}`);
                }
            } else {
                // console.warn(`   ⚠️  Check failed for ${s.fileName}: ${error.message}`);
            }
        }
    }

    console.log('\n\n🏁 Cleanup Complete');
    console.log(`   ✅ Kept: ${keptCount}`);
    console.log(`   🗑️  Deleted: ${deletedCount}`);
}

main().catch(console.error);
