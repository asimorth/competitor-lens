import fs from 'fs';
import path from 'path';
import axios from 'axios';
import FormData from 'form-data';
import { PrismaClient } from '@prisma/client';

// Configuration
const PROD_API_URL = 'https://competitor-lens-production.up.railway.app/api';
const LOCAL_UPLOADS_DIR = path.join(process.cwd(), 'uploads/screenshots');

const prisma = new PrismaClient();

async function main() {
    console.log('🚀 Starting Sync: Local Screenshots -> Production');

    // 1. Get Production Competitors (to map names to Prod IDs)
    console.log('📥 Fetching production competitors...');
    let prodCompetitors = [];
    try {
        const res = await axios.get(`${PROD_API_URL}/competitors`);
        prodCompetitors = res.data.data;
        console.log(`   ✅ Found ${prodCompetitors.length} competitors on production`);
    } catch (error) {
        console.error('   ❌ Failed to fetch competitors:', error.message);
        return;
    }

    // 2. Get Production Features (to map names to Prod IDs)
    console.log('📥 Fetching production features...');
    let prodFeatures = [];
    try {
        const res = await axios.get(`${PROD_API_URL}/features`);
        prodFeatures = res.data.data;
        console.log(`   ✅ Found ${prodFeatures.length} features on production`);
    } catch (error) {
        console.error('   ❌ Failed to fetch features:', error.message);
        return;
    }

    // 3. Scan Local Files
    console.log('📂 Scanning local files...');
    const filesToSync = [];

    // Helper to find feature ID by name (smart detection logic reused)
    function findFeatureId(filePath: string, filename: string): string | null {
        const parentFolder = path.basename(path.dirname(filePath)).toLowerCase();

        // 1. Check parent folder name
        for (const f of prodFeatures) {
            if (f.name.toLowerCase() === parentFolder || f.name.toLowerCase().includes(parentFolder)) {
                return f.id;
            }
        }

        // 2. Keywords (Mobile App priority)
        if (filePath.toLowerCase().includes('mobile') || filename.toLowerCase().includes('mobile')) {
            const mobile = prodFeatures.find(f => f.name === 'Mobile App');
            if (mobile) return mobile.id;
        }

        // Default to Mobile App if nothing else matches
        const mobile = prodFeatures.find(f => f.name === 'Mobile App');
        return mobile ? mobile.id : null;
    }

    async function scan(dir: string) {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                await scan(fullPath);
            } else if (entry.isFile() && /\.(png|jpg|jpeg|webp)$/i.test(entry.name)) {
                // Find competitor
                const relativePath = path.relative(LOCAL_UPLOADS_DIR, fullPath);
                const competitorName = relativePath.split(path.sep)[0];

                // Map to Prod Competitor
                // Explicit mappings
                const competitorMappings: Record<string, string> = {
                    'Bilira': 'BiLira',
                    'BTC Türk': 'BTCTurk',
                    'BTC Turk': 'BTCTurk',
                    'Binance Global': 'Binance Global',
                    'Binance TR': 'BinanceTR',
                    'GateTR': 'GateTR',
                    'Paribu': 'Paribu',
                    'Revolut': 'Revolut'
                };

                const dbName = competitorMappings[competitorName] || competitorName;

                // Handle naming variations
                let prodComp = prodCompetitors.find(c => c.name === dbName);
                if (!prodComp) {
                    // Try fuzzy
                    prodComp = prodCompetitors.find(c => c.name.toLowerCase() === dbName.toLowerCase());
                }
                if (!prodComp) {
                    prodComp = prodCompetitors.find(c => c.name.includes(dbName) || dbName.includes(c.name));
                }

                if (prodComp) {
                    const featureId = findFeatureId(fullPath, entry.name);
                    filesToSync.push({
                        filePath: fullPath,
                        competitorId: prodComp.id,
                        competitorName: prodComp.name,
                        featureId: featureId,
                        filename: entry.name
                    });
                }
            }
        }
    }

    await scan(LOCAL_UPLOADS_DIR);
    console.log(`   ✅ Found ${filesToSync.length} local screenshots to sync`);

    // 3.5 Fetch existing screenshots to avoid duplicates
    console.log('📥 Fetching existing screenshots from production...');
    const existingScreenshots = new Set();
    try {
        const res = await axios.get(`${PROD_API_URL}/screenshots?limit=2000`);
        if (res.data.data) {
            res.data.data.forEach((s: any) => {
                // Create a unique key: competitorId + fileSize
                // This is robust enough for our purpose
                existingScreenshots.add(`${s.competitorId}_${s.fileSize}`);
            });
        }
        console.log(`   ✅ Found ${existingScreenshots.size} existing screenshots on production`);
    } catch (error: any) {
        console.warn('   ⚠️  Could not fetch existing screenshots, proceeding with potential duplicates:', error.message);
    }

    // 4. Upload to Production
    console.log('out📤 Uploading to Production...');
    let success = 0;
    let failed = 0;
    let skipped = 0;

    // Helper for delay
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    for (const file of filesToSync) {
        // Get local file size
        const stats = fs.statSync(file.filePath);
        const fileSize = stats.size;

        // Check if exists in DB
        const existsInDb = existingScreenshots.has(`${file.competitorId}_${fileSize}`);

        if (existsInDb) {
            // Check if file actually exists on server (HEAD request)
            // Construct URL: /uploads/screenshots/CompetitorName/features/filename
            // Note: This assumes standard path structure.
            // We need to handle the path normalization logic here too if needed, 
            // but usually it's /uploads/screenshots/...

            // We can't easily guess the exact URL without the DB record's filePath.
            // But we can try to guess or just skip if we assume it's there.
            // However, we KNOW it's missing.

            // BETTER APPROACH:
            // Since we know files are missing, we can just try to RESTORE them if they are in DB.
            // But we don't want to restore if they are already there (slow).

            // Let's try to fetch the file.
            // We need the competitor name for the URL.
            const compName = file.competitorName;
            const url = `${PROD_API_URL.replace('/api', '')}/uploads/screenshots/${encodeURIComponent(compName)}/features/${encodeURIComponent(file.filename)}`;

            try {
                await axios.head(url);
                // File exists
                skipped++;
                process.stdout.write(`\r✅ Synced: ${success} | Restored: ${success} | Skipped: ${skipped}`);
                continue;
            } catch (err) {
                // File missing (404), proceed to RESTORE
                // Fall through to upload logic, but use /restore endpoint
            }
        }

        let retries = 3;
        while (retries > 0) {
            try {
                const form = new FormData();
                form.append('competitorId', file.competitorId);
                if (file.featureId) form.append('featureId', file.featureId);
                form.append('uploadSource', 'sync-script');
                form.append('screenshot', fs.createReadStream(file.filePath));

                // Determine endpoint: /restore if existsInDb, else /screenshots
                const endpoint = existsInDb ? `${PROD_API_URL}/screenshots/restore` : `${PROD_API_URL}/screenshots`;

                await axios.post(endpoint, form, {
                    headers: {
                        ...form.getHeaders(),
                        'Connection': 'close'
                    },
                    maxContentLength: Infinity,
                    maxBodyLength: Infinity,
                    timeout: 30000
                });

                success++;
                process.stdout.write(`\r✅ Synced: ${success} | Skipped: ${skipped} | Current: ${file.filename.substring(0, 15)}...`);

                await delay(500);
                break;
            } catch (error: any) {
                retries--;
                if (retries === 0) {
                    failed++;
                } else {
                    await delay(2000);
                }
            }
        }
    }

    console.log('\n\n🏁 Sync Complete');
    console.log(`   Total: ${filesToSync.length}`);
    console.log(`   Success: ${success}`);
    console.log(`   Failed: ${failed}`);
}

main().catch(console.error);
