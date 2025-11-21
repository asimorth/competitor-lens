
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

        // Scan files and directories
        const items = fs.readdirSync(competitorDir, { withFileTypes: true });

        for (const item of items) {
            const itemPath = path.join(competitorDir, item.name);

            if (item.isDirectory()) {
                if (item.name.toLowerCase() === 'onboarding') {
                    // Handle Onboarding
                    const onboardingFiles = fs.readdirSync(itemPath);
                    for (const onbFile of onboardingFiles) {
                        if (!isImage(onbFile)) continue;
                        console.log(`   ⬆️  Uploading Onboarding: ${onbFile}`);
                        try {
                            await uploadOnboarding(competitorId, path.join(itemPath, onbFile));
                            successCount++;
                        } catch (err) {
                            console.error(`   ❌ Failed: ${err}`);
                            failCount++;
                        }
                    }
                } else {
                    // Handle Feature Subdirectory (e.g. "AI Tool")
                    const featureName = item.name;
                    console.log(`   📂 Found Feature Folder: "${featureName}"`);

                    // Try to find feature ID (simple name match)
                    // We need to fetch features first or search via API? 
                    // For now, we'll upload with featureName in metadata or try to match if we had feature list.
                    // Better: The API /api/screenshots accepts featureId. 
                    // Let's try to find the feature in the competitor's feature list (which we can fetch).

                    // Note: To do this properly, we should have fetched competitor details with features.
                    // But for now, let's just upload them as competitor screenshots. 
                    // Ideally, we would lookup the feature ID.

                    const featureFiles = fs.readdirSync(itemPath);
                    for (const fFile of featureFiles) {
                        if (!isImage(fFile)) continue;
                        console.log(`   ⬆️  Uploading Feature [${featureName}]: ${fFile}`);
                        try {
                            // Pass featureName to help backend or future logic? 
                            // Currently backend expects featureId. 
                            // We will upload without featureId for now, but user can tag later.
                            // OR: We can implement a lookup.
                            await uploadFeatureScreenshot(competitorId, path.join(itemPath, fFile));
                            successCount++;
                        } catch (err) {
                            console.error(`   ❌ Failed: ${err}`);
                            failCount++;
                        }
                    }
                }
            } else if (item.isFile() && isImage(item.name)) {
                // Handle Root Feature Screenshot
                console.log(`   ⬆️  Uploading General Screenshot: ${item.name}`);
                try {
                    await uploadFeatureScreenshot(competitorId, itemPath);
                    successCount++;
                } catch (err) {
                    console.error(`   ❌ Failed: ${err}`);
                    failCount++;
                }
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
