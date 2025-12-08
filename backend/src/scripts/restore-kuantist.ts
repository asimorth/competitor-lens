import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import util from 'util';

const execAsync = util.promisify(exec);

const API_URL = 'https://competitor-lens-production.up.railway.app/api';
// Local path to Kuantist screenshots (Found in KYC folder)
const TARGET_DIR = path.join(process.cwd(), 'uploads/screenshots/Kuantist/KYC');

// Kuantist ID
const COMPETITOR_ID = 'a13e8c27-586d-4a0c-b4d6-8f25ed08597b';
// User Onboarding Feature ID
const FEATURE_ID = 'c45efd5f-6351-4c43-b744-3de3310400fd';

async function main() {
    console.log('🚀 Starting Targeted Restore: Kuantist -> KYC');

    if (!fs.existsSync(TARGET_DIR)) {
        console.error(`❌ Directory not found: ${TARGET_DIR}`);
        // Try root folder if Onboarding subfolder doesn't exist
        const ROOT_DIR = path.join(process.cwd(), 'uploads/screenshots/Kuantist');
        if (fs.existsSync(ROOT_DIR)) {
            console.log(`📂 Checking root folder: ${ROOT_DIR}`);
            await processFolder(ROOT_DIR);
        } else {
            return;
        }
    } else {
        await processFolder(TARGET_DIR);
    }
}

async function processFolder(dirPath: string) {
    const files = fs.readdirSync(dirPath).filter(f => /\.(png|jpg|jpeg|webp)$/i.test(f));
    console.log(`📂 Found ${files.length} files to upload.`);

    let successCount = 0;
    let failCount = 0;

    for (const file of files) {
        const filePath = path.join(dirPath, file);
        console.log(`📤 Uploading ${file}...`);

        // Construct curl command
        const url = `${API_URL}/screenshots`;
        const cmd = `curl -s -X POST -F "competitorId=${COMPETITOR_ID}" -F "featureId=${FEATURE_ID}" -F "screenshot=@${filePath}" "${url}"`;

        try {
            const { stdout } = await execAsync(cmd);
            try {
                const response = JSON.parse(stdout);
                if (response.success || response.id) {
                    console.log(`   ✅ Success`);
                    successCount++;
                } else {
                    console.error(`   ❌ Failed (API):`, response);
                    failCount++;
                }
            } catch (e) {
                console.error(`   ❌ Failed (Parse): ${stdout.substring(0, 100)}...`);
                failCount++;
            }

            // Small delay
            await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error: any) {
            console.error(`   ❌ Failed (Exec): ${error.message}`);
            failCount++;
        }
    }

    console.log('\n🏁 Restore Complete');
    console.log(`   ✅ Success: ${successCount}`);
    console.log(`   ❌ Failed: ${failCount}`);
}

main().catch(console.error);
