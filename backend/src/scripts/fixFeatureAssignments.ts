import fs from 'fs';
import path from 'path';
import axios from 'axios';
import FormData from 'form-data';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const API_URL = 'https://competitor-lens-production.up.railway.app/api';
const LOCAL_UPLOADS_DIR = path.join(__dirname, '../../uploads/screenshots');

async function main() {
    console.log('🚀 Starting Feature Assignment Fix...');

    // Helper for delay
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    // Helper for retrying requests
    async function fetchWithRetry(url: string, retries = 5) {
        for (let i = 0; i < retries; i++) {
            try {
                return await axios.get(url);
            } catch (err: any) {
                if (err.response?.status === 429 && i < retries - 1) {
                    const waitTime = 5000 * (i + 1); // Increased to 5s base
                    console.log(`   ⚠️  Rate limited on ${url}, waiting ${waitTime / 1000}s...`);
                    await delay(waitTime);
                    continue;
                }
                throw err;
            }
        }
    }

    // 1. Fetch metadata from production (Sequential to avoid concurrency limits)
    console.log('📥 Fetching production data...');

    console.log('   Fetching competitors...');
    const competitorsRes = await fetchWithRetry(`${API_URL}/competitors`);
    await delay(1000);

    console.log('   Fetching features...');
    const featuresRes = await fetchWithRetry(`${API_URL}/features`);
    await delay(1000);

    console.log('   Fetching screenshots...');
    const screenshotsRes = await fetchWithRetry(`${API_URL}/screenshots?limit=2000`);

    const competitors = competitorsRes!.data.data;
    const features = featuresRes!.data.data;
    const screenshots = screenshotsRes!.data.data;

    console.log(`   ✅ Loaded ${competitors.length} competitors`);
    console.log(`   ✅ Loaded ${features.length} features`);
    console.log(`   ✅ Loaded ${screenshots.length} existing screenshots`);

    // Helper to find feature ID
    function findFeatureId(filePath: string, filename: string): string | null {
        const parentFolder = path.basename(path.dirname(filePath)).toLowerCase();

        // 1. Special mappings for common folder names
        if (parentFolder === 'kyc' || parentFolder.includes('kyc')) {
            const userOnboarding = features.find((f: any) => f.name === 'User Onboarding' || f.name.toLowerCase().includes('onboarding'));
            if (userOnboarding) return userOnboarding.id;
        }

        if (parentFolder === 'ai tool' || parentFolder.includes('ai tool')) {
            const aiSentiment = features.find((f: any) => f.name === 'AI Sentimentals' || f.name.toLowerCase().includes('sentiment'));
            if (aiSentiment) return aiSentiment.id;
        }

        // 2. Check parent folder name
        for (const f of features) {
            if (f.name.toLowerCase() === parentFolder || f.name.toLowerCase().includes(parentFolder)) {
                return f.id;
            }
        }

        // 3. Keywords (Mobile App priority)
        if (filePath.toLowerCase().includes('mobile') || filename.toLowerCase().includes('mobile')) {
            const mobile = features.find((f: any) => f.name === 'Mobile App');
            if (mobile) return mobile.id;
        }

        const mobile = features.find((f: any) => f.name === 'Mobile App');
        return mobile ? mobile.id : null;
    }

    // 2. Scan local files
    console.log('📂 Scanning local files...');
    let updatedCount = 0;
    let skippedCount = 0;
    let notFoundCount = 0;

    async function scan(dir: string) {
        const entries = fs.readdirSync(dir, { withFileTypes: true });

        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);

            if (entry.isDirectory()) {
                await scan(fullPath);
            } else if (entry.isFile() && /\.(png|jpg|jpeg|webp)$/i.test(entry.name)) {

                // Determine Competitor
                // Path structure: .../uploads/screenshots/[CompetitorName]/...
                const relativePath = path.relative(LOCAL_UPLOADS_DIR, fullPath);
                const parts = relativePath.split(path.sep);
                const competitorName = parts[0];

                let prodComp = competitors.find((c: any) => c.name === competitorName);
                if (!prodComp) {
                    prodComp = competitors.find((c: any) => c.name.toLowerCase() === competitorName.toLowerCase());
                }

                if (prodComp) {
                    const correctFeatureId = findFeatureId(fullPath, entry.name);
                    const stats = fs.statSync(fullPath);
                    const fileSize = stats.size;

                    // Find ALL matching DB screenshots by competitorId + fileSize
                    const dbScreenshots = screenshots.filter((s: any) =>
                        s.competitorId === prodComp.id &&
                        Math.abs(s.fileSize - fileSize) < 100 // Allow small variance
                    );

                    if (dbScreenshots.length > 0) {
                        for (const dbScreenshot of dbScreenshots) {
                            if (dbScreenshot.featureId !== correctFeatureId) {
                                // UPDATE NEEDED
                                // Retry loop for update
                                let retries = 3;
                                for (let i = 0; i < retries; i++) {
                                    try {
                                        await axios.put(`${API_URL}/screenshots/${dbScreenshot.id}/feature`, {
                                            featureId: correctFeatureId
                                        });
                                        process.stdout.write('✓');
                                        updatedCount++;
                                        await delay(500); // Base delay
                                        break; // Success, exit retry loop
                                    } catch (err: any) {
                                        if (err.response?.status === 429 && i < retries - 1) {
                                            const waitTime = 2000 * (i + 1);
                                            await delay(waitTime);
                                            continue;
                                        }
                                        if (i === retries - 1) {
                                            process.stdout.write('X');
                                            console.error(`\nFailed to update ${entry.name} (ID: ${dbScreenshot.id}): ${err.message}`);
                                        }
                                    }
                                }
                            } else {
                                skippedCount++;
                            }
                        }
                    } else {
                        notFoundCount++;
                    }
                }
            }
        }
    }

    await scan(LOCAL_UPLOADS_DIR);

    console.log('\n\n🏁 Feature Assignment Fix Complete');
    console.log(`   ✅ Updated: ${updatedCount}`);
    console.log(`   ⏭️  Skipped (Already Correct): ${skippedCount}`);
    console.log(`   ❓ Not Found in DB: ${notFoundCount}`);
}

main().catch(console.error);
