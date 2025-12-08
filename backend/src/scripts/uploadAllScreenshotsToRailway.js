#!/usr/bin/env node

/**
 * Upload All Screenshots to Railway
 * Uses the /api/screenshots/restore endpoint to re-upload local files
 */

const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const fetch = require('node-fetch');

const RAILWAY_API = 'https://competitor-lens-production.up.railway.app';
const LOCAL_SCREENSHOTS_DIR = path.join(__dirname, '..', '..', 'uploads', 'screenshots');

async function uploadScreenshot(filePath, competitorName) {
    try {
        const fileName = path.basename(filePath);
        const stats = fs.statSync(filePath);
        const fileSize = stats.size;

        // Create form data
        const formData = new FormData();
        formData.append('screenshot', fs.createReadStream(filePath), {
            filename: fileName,
            contentType: 'image/png'
        });
        formData.append('competitorId', competitorName); // Will be looked up by name
        formData.append('fileSize', fileSize);

        // Upload to Railway restore endpoint
        const response = await fetch(`${RAILWAY_API}/api/screenshots/restore`, {
            method: 'POST',
            body: formData,
            headers: formData.getHeaders()
        });

        const result = await response.json();

        if (response.ok) {
            return { success: true, fileName };
        } else {
            return { success: false, fileName, error: result.error || 'Upload failed' };
        }
    } catch (error) {
        return { success: false, fileName: path.basename(filePath), error: error.message };
    }
}

async function scanAndUpload() {
    console.log('📤 Starting screenshot upload to Railway...\n');
    console.log(`Local directory: ${LOCAL_SCREENSHOTS_DIR}\n`);

    if (!fs.existsSync(LOCAL_SCREENSHOTS_DIR)) {
        console.error('❌ Screenshots directory not found:', LOCAL_SCREENSHOTS_DIR);
        process.exit(1);
    }

    // Fetch all competitors to map names to IDs
    console.log('📡 Fetching competitors from Railway...');
    const competitorsRes = await fetch(`${RAILWAY_API}/api/competitors`);
    const competitorsData = await competitorsRes.json();
    const competitors = competitorsData.data || [];

    // Create name -> ID map
    const competitorMap = {};
    competitors.forEach(comp => {
        competitorMap[comp.name] = comp.id;
    });

    console.log(`✅ Found ${competitors.length} competitors\n`);

    const competitorDirs = fs.readdirSync(LOCAL_SCREENSHOTS_DIR)
        .filter(item => fs.statSync(path.join(LOCAL_SCREENSHOTS_DIR, item)).isDirectory());

    let totalFiles = 0;
    let successCount = 0;
    let failCount = 0;

    for (const competitorName of competitorDirs) {
        const competitorId = competitorMap[competitorName];

        if (!competitorId) {
            console.log(`\n⚠️  Skipping ${competitorName} (not found in database)`);
            continue;
        }

        const competitorDir = path.join(LOCAL_SCREENSHOTS_DIR, competitorName);
        console.log(`\n📁 Processing: ${competitorName} (${competitorId})`);

        // Recursively find all image files
        const files = [];

        function scanDir(dir) {
            const items = fs.readdirSync(dir);
            for (const item of items) {
                const fullPath = path.join(dir, item);
                const stat = fs.statSync(fullPath);

                if (stat.isDirectory()) {
                    scanDir(fullPath);
                } else if (/\.(png|jpg|jpeg|webp)$/i.test(item)) {
                    files.push(fullPath);
                }
            }
        }

        scanDir(competitorDir);

        console.log(`   Found ${files.length} images`);
        totalFiles += files.length;

        // Upload each file
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const fileName = path.basename(file);

            process.stdout.write(`   [${i + 1}/${files.length}] ${fileName}...`);

            const result = await uploadScreenshot(file, competitorId);

            if (result.success) {
                successCount++;
                console.log(' ✅');
            } else {
                failCount++;
                console.log(` ❌ (${result.error})`);
            }

            // Rate limiting: wait 100ms between uploads
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 Upload Summary:');
    console.log(`   Total files: ${totalFiles}`);
    console.log(`   ✅ Success: ${successCount}`);
    console.log(`   ❌ Failed: ${failCount}`);
    console.log('='.repeat(60));

    if (successCount > 0) {
        console.log('\n✅ Screenshots uploaded! Verify at:');
        console.log(`   ${RAILWAY_API}/debug/files`);
    }
}

// Run
scanAndUpload().catch(error => {
    console.error('\n❌ Upload failed:', error);
    process.exit(1);
});
