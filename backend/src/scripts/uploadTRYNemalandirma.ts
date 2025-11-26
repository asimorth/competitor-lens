import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import util from 'util';

const execAsync = util.promisify(exec);

const API_URL = 'https://competitor-lens-production.up.railway.app/api';
const TARGET_DIR = path.join(process.cwd(), 'uploads/screenshots/OKX TR/TRY Nemalandırma');

const COMPETITOR_ID = 'c29cba24-384e-48ec-9c0d-eae220f4d7b0'; // OKX TR
const FEATURE_ID = '9a6e2291-2e51-49ec-8d9a-a55f3863c5eb';    // TRY Nemalandırma

async function main() {
    console.log('🚀 Starting Targeted Upload (CURL Mode): OKX TR -> TRY Nemalandırma');

    if (!fs.existsSync(TARGET_DIR)) {
        console.error(`❌ Directory not found: ${TARGET_DIR}`);
        return;
    }

    const files = fs.readdirSync(TARGET_DIR).filter(f => /\.(png|jpg|jpeg|webp)$/i.test(f));
    console.log(`📂 Found ${files.length} files to upload.`);

    let successCount = 0;
    let failCount = 0;

    for (const file of files) {
        const filePath = path.join(TARGET_DIR, file);
        console.log(`📤 Uploading ${file}...`);

        // Construct curl command
        // Note: -F "competitorId=..." MUST come before the file for multer to see it
        const url = `${API_URL}/screenshots`;
        const cmd = `curl -s -X POST -F "competitorId=${COMPETITOR_ID}" -F "featureId=${FEATURE_ID}" -F "screenshot=@${filePath}" "${url}"`;

        try {
            const { stdout, stderr } = await execAsync(cmd);
            // Check if stdout contains success
            try {
                const response = JSON.parse(stdout);
                if (response.success || response.id) {
                    console.log(`   ✅ Success`);
                    successCount++;
                } else {
                    console.error(`   ❌ Failed (API Error):`, response);
                    failCount++;
                }
            } catch (e) {
                // If not JSON, maybe error
                console.error(`   ❌ Failed (Parse Error): ${stdout.substring(0, 100)}...`);
                failCount++;
            }

            // Small delay
            await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error: any) {
            console.error(`   ❌ Failed (Exec Error): ${error.message}`);
            failCount++;
        }
    }

    console.log('\n🏁 Upload Complete');
    console.log(`   ✅ Success: ${successCount}`);
    console.log(`   ❌ Failed: ${failCount}`);
}

main().catch(console.error);
