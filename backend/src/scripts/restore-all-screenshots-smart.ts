import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import util from 'util';

const execAsync = util.promisify(exec);

const API_URL = 'https://competitor-lens-production.up.railway.app/api';
const SCREENSHOTS_DIR = path.join(process.cwd(), 'uploads/screenshots');

// Smart Mappings (Simplified version of featureScreenshotMapper.ts)
const SMART_MAPPINGS = [
    { name: "KYC & Identity Verification", folders: ["KYC", "kyc", "Identity", "Verification"] },
    { name: "User Onboarding", folders: ["Onboarding", "onboarding", "Welcome", "Getting Started"] },
    { name: "AI Sentimentals", folders: ["AI tools", "AI Tool", "AI", "Sentiment"] },
    { name: "TRY Nemalandırma", folders: ["TRY Nemalandırma", "TRY Earn", "Nemalandırma"] },
    { name: "Flexible Staking", folders: ["Staking", "Flexible Staking", "Earn"] },
    { name: "Locked Staking", folders: ["Locked Staking", "Locked Earn"] },
    { name: "Dashboard & Wallet", folders: ["Dashboard", "dashboard", "Wallet", "wallet"] },
    { name: "Web App", folders: ["Web", "Web App", "Desktop"] },
    { name: "Mobile App", folders: ["Mobile", "Mobile App", "App"] },
    { name: "Convert", folders: ["Convert", "Conversion", "Swap"] },
    { name: "Copy Trading", folders: ["Copy Trading", "Copy Trade"] },
    { name: "Referral", folders: ["Referral", "referral"] },
    { name: "NFT / Marketplace", folders: ["NFT", "nft", "Marketplace"] },
    { name: "Pay (Payments)", folders: ["Pay", "Payment", "Payments"] }
];

async function main() {
    console.log('🚀 Starting Smart Restore of All Screenshots...');

    // 1. Fetch Metadata
    console.log('📥 Fetching metadata from API...');

    // Fetch Competitors
    const compRes = await fetch(`${API_URL}/competitors`);
    const compData = await compRes.json();
    const competitors = compData.data || [];
    const competitorMap = new Map(competitors.map((c: any) => [c.name.toLowerCase(), c.id]));
    // Add variations
    competitorMap.set('btc turk', competitorMap.get('btcturk'));
    competitorMap.set('binance tr', competitorMap.get('binancetr'));
    competitorMap.set('okx tr', competitorMap.get('okx tr'));

    // Fetch Features
    const featRes = await fetch(`${API_URL}/features`);
    const featData = await featRes.json();
    const features = featData.data || [];
    const featureMap = new Map(features.map((f: any) => [f.name, f.id]));

    console.log(`✅ Loaded ${competitors.length} competitors and ${features.length} features.`);

    // 2. Scan and Upload
    if (!fs.existsSync(SCREENSHOTS_DIR)) {
        console.error(`❌ Directory not found: ${SCREENSHOTS_DIR}`);
        return;
    }

    const competitorDirs = fs.readdirSync(SCREENSHOTS_DIR, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);

    let successCount = 0;
    let failCount = 0;

    for (const competitorName of competitorDirs) {
        const competitorId = competitorMap.get(competitorName.toLowerCase());

        if (!competitorId) {
            console.warn(`⚠️  Competitor not found in DB: ${competitorName} (Skipping)`);
            continue;
        }

        console.log(`\n📂 Processing ${competitorName}...`);
        const competitorDir = path.join(SCREENSHOTS_DIR, competitorName);
        const items = fs.readdirSync(competitorDir, { withFileTypes: true });

        for (const item of items) {
            const itemPath = path.join(competitorDir, item.name);

            if (item.isDirectory()) {
                // Map Folder -> Feature
                const folderName = item.name;
                let featureId = null;
                let featureName = null;

                // Find matching feature
                for (const mapping of SMART_MAPPINGS) {
                    if (mapping.folders.some(f => folderName.toLowerCase().includes(f.toLowerCase()))) {
                        featureName = mapping.name;
                        featureId = featureMap.get(featureName);
                        break;
                    }
                }

                if (featureId) {
                    console.log(`   📂 Mapped folder "${folderName}" -> Feature "${featureName}"`);
                    const files = fs.readdirSync(itemPath).filter(f => /\.(png|jpg|jpeg|webp)$/i.test(f));

                    for (const file of files) {
                        await uploadFile(competitorId, featureId, path.join(itemPath, file));
                        successCount++;
                    }
                } else {
                    console.warn(`   ⚠️  No mapping for folder "${folderName}" (Skipping)`);
                }

            } else if (item.isFile() && /\.(png|jpg|jpeg|webp)$/i.test(item.name)) {
                // Root file -> Assume "User Onboarding"
                const featureName = "User Onboarding";
                const featureId = featureMap.get(featureName);

                if (featureId) {
                    console.log(`   📄 Root file "${item.name}" -> Defaulting to "${featureName}"`);
                    await uploadFile(competitorId, featureId, itemPath);
                    successCount++;
                } else {
                    console.warn(`   ⚠️  "User Onboarding" feature not found (Skipping root file)`);
                }
            }
        }
    }

    console.log('\n🏁 Restore Complete');
    console.log(`   ✅ Success: ${successCount}`);
    console.log(`   ❌ Failed: ${failCount}`);
}

async function uploadFile(competitorId: string, featureId: string, filePath: string) {
    // Construct curl command
    // -F "competitorId=..." MUST come before the file
    const url = `${API_URL}/screenshots`;
    const cmd = `curl -s -X POST -F "competitorId=${competitorId}" -F "featureId=${featureId}" -F "screenshot=@${filePath}" "${url}"`;

    try {
        const { stdout } = await execAsync(cmd);
        try {
            const response = JSON.parse(stdout);
            if (response.success || response.id) {
                // console.log(`      ✅ Uploaded`);
            } else {
                console.error(`      ❌ Failed (API):`, response);
                throw new Error(JSON.stringify(response));
            }
        } catch (e) {
            console.error(`      ❌ Failed (Parse): ${stdout.substring(0, 100)}...`);
            throw e;
        }
    } catch (error: any) {
        console.error(`      ❌ Failed (Exec): ${error.message}`);
        throw error;
    }
}

main().catch(console.error);
