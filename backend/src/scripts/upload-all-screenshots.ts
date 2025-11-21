
import fs from 'fs';
import path from 'path';

// Node 18+ has global fetch and FormData

const API_URL = 'https://competitor-lens-production.up.railway.app';
const SCREENSHOTS_DIR = path.join(process.cwd(), 'uploads/screenshots');

async function main() {
    console.log('🚀 Starting screenshot upload to production...');
    console.log(`Target: ${API_URL}`);
    console.log(`Source: ${SCREENSHOTS_DIR}`);

    // 1. Fetch Competitors
    console.log('\n📥 Fetching competitors...');
    let competitors: any[] = [];
    try {
        const res = await fetch(`${API_URL}/api/competitors`);
        if (!res.ok) throw new Error(`Failed to fetch competitors: ${res.statusText}`);
        const data = await res.json();
        competitors = data.data || [];
        console.log(`✅ Found ${competitors.length} competitors`);
    } catch (error) {
        console.error('❌ Error fetching competitors:', error);
        process.exit(1);
    }

    // Map names to IDs
    const competitorMap = new Map<string, string>();
    competitors.forEach((c: any) => {
        competitorMap.set(c.name.toLowerCase(), c.id);
        // Add variations
        if (c.name === 'BTCTurk') competitorMap.set('btc turk', c.id);
        if (c.name === 'Binance TR') competitorMap.set('binancetr', c.id);
        if (c.name === 'OKX TR') competitorMap.set('okx tr', c.id);
        if (c.name === 'Garanti Kripto') competitorMap.set('garanti kripto', c.id);
    });

    // 2. Scan and Upload
    if (!fs.existsSync(SCREENSHOTS_DIR)) {
        console.error(`❌ Directory not found: ${SCREENSHOTS_DIR}`);
        process.exit(1);
    }

    const competitorDirs = fs.readdirSync(SCREENSHOTS_DIR, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);

    let successCount = 0;
    let failCount = 0;
    let skipCount = 0;

    for (const competitorName of competitorDirs) {
        const competitorId = competitorMap.get(competitorName.toLowerCase());

        if (!competitorId) {
            console.warn(`⚠️  Competitor not found in DB: ${competitorName} (Skipping)`);
            continue;
        }

        console.log(`\n📂 Processing ${competitorName}...`);
        const competitorDir = path.join(SCREENSHOTS_DIR, competitorName);

        // Scan files
        const files = fs.readdirSync(competitorDir, { withFileTypes: true });

        for (const file of files) {
            const filePath = path.join(competitorDir, file.name);

            if (file.isDirectory() && file.name === 'onboarding') {
                // Handle Onboarding
                const onboardingFiles = fs.readdirSync(filePath);
                for (const onbFile of onboardingFiles) {
                    if (!isImage(onbFile)) continue;

                    console.log(`   ⬆️  Uploading Onboarding: ${onbFile}`);
                    try {
                        await uploadOnboarding(competitorId, path.join(filePath, onbFile));
                        successCount++;
                    } catch (err) {
                        console.error(`   ❌ Failed: ${err}`);
                        failCount++;
                    }
                }
            } else if (file.isFile() && isImage(file.name)) {
                // Handle Feature Screenshot
                console.log(`   ⬆️  Uploading Feature Screenshot: ${file.name}`);
                try {
                    await uploadFeatureScreenshot(competitorId, filePath);
                    successCount++;
                } catch (err) {
                    console.error(`   ❌ Failed: ${err}`);
                    failCount++;
                }
            }
        }
    }

    console.log('\n🎉 Upload Complete!');
    console.log(`✅ Success: ${successCount}`);
    console.log(`❌ Failed: ${failCount}`);
}

function isImage(filename: string) {
    return /\.(png|jpg|jpeg|webp)$/i.test(filename);
}

async function uploadOnboarding(competitorId: string, filePath: string) {
    const formData = new FormData();
    const fileContent = fs.readFileSync(filePath);
    const blob = new Blob([fileContent], { type: 'image/png' }); // Assuming PNG/JPG

    formData.append('screenshot', blob, path.basename(filePath));

    const res = await fetch(`${API_URL}/api/competitors/${competitorId}/onboarding`, {
        method: 'POST',
        body: formData
    });

    if (!res.ok) {
        const text = await res.text();
        throw new Error(`API Error ${res.status}: ${text}`);
    }
}

async function uploadFeatureScreenshot(competitorId: string, filePath: string) {
    const formData = new FormData();
    const fileContent = fs.readFileSync(filePath);
    const blob = new Blob([fileContent], { type: 'image/png' });

    formData.append('screenshot', blob, path.basename(filePath));
    formData.append('competitorId', competitorId);

    const res = await fetch(`${API_URL}/api/screenshots`, {
        method: 'POST',
        body: formData
    });

    if (!res.ok) {
        const text = await res.text();
        throw new Error(`API Error ${res.status}: ${text}`);
    }
}

main().catch(console.error);
