#!/usr/bin/env node

/**
 * Final Upload Script - Using Bulk Upload Endpoint
 * Optimized for Railway's /api/bulk-upload endpoint
 */

const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const fetch = require('node-fetch');

const CONFIG = {
    RAILWAY_API: 'https://competitor-lens-production.up.railway.app',
    LOCAL_DIR: path.join(__dirname, '..', '..', 'uploads', 'screenshots'),
    BATCH_SIZE: 5, // Smaller batches for stability
    DELAY_BETWEEN_FILES: 300,
    DELAY_BETWEEN_BATCHES: 2000
};

let stats = {
    total: 0,
    success: 0,
    failed: 0,
    skipped: 0
};

async function uploadFile(filePath, competitorId, originalPath) {
    try {
        const formData = new FormData();
        formData.append('file', fs.createReadStream(filePath), {
            filename: path.basename(filePath),
            contentType: 'image/png'
        });
        formData.append('competitorId', competitorId);
        formData.append('originalPath', originalPath);

        const response = await fetch(`${CONFIG.RAILWAY_API}/api/bulk-upload/screenshot`, {
            method: 'POST',
            body: formData,
            headers: formData.getHeaders(),
            timeout: 30000
        });

        const result = await response.json();

        if (response.ok && result.success) {
            return { success: true };
        } else {
            return { success: false, error: result.error || `HTTP ${response.status}` };
        }
    } catch (error) {
        return { success: false, error: error.message };
    }
}

async function main() {
    console.log('🚀 FINAL Screenshot Upload');
    console.log('='.repeat(60));
    console.log(`API: ${CONFIG.RAILWAY_API}`);
    console.log(`Source: ${CONFIG.LOCAL_DIR}\n`);

    // Get competitors
    console.log('📡 Fetching competitors...');
    const res = await fetch(`${CONFIG.RAILWAY_API}/api/competitors`);
    const data = await res.json();
    const competitors = data.data || [];

    const competitorMap = {};
    competitors.forEach(c => { competitorMap[c.name] = c.id; });

    console.log(`✅ Found ${competitors.length} competitors\n`);

    // Scan directories
    const dirs = fs.readdirSync(CONFIG.LOCAL_DIR)
        .filter(item => fs.statSync(path.join(CONFIG.LOCAL_DIR, item)).isDirectory());

    for (const competitorName of dirs) {
        const competitorId = competitorMap[competitorName];

        if (!competitorId) {
            console.log(`⚠️  Skipping ${competitorName} (not in DB)\n`);
            continue;
        }

        console.log(`📁 ${competitorName}`);

        // Find all images
        const files = [];
        function scan(dir, relativePath = '') {
            const items = fs.readdirSync(dir);
            for (const item of items) {
                const fullPath = path.join(dir, item);
                const relPath = path.join(relativePath, item);
                const stat = fs.statSync(fullPath);

                if (stat.isDirectory()) {
                    scan(fullPath, relPath);
                } else if (/\.(png|jpg|jpeg|webp)$/i.test(item)) {
                    files.push({ full: fullPath, relative: relPath });
                }
            }
        }

        scan(path.join(CONFIG.LOCAL_DIR, competitorName), competitorName);

        console.log(`   Found: ${files.length} files`);
        stats.total += files.length;

        // Upload in batches
        for (let i = 0; i < files.length; i += CONFIG.BATCH_SIZE) {
            const batch = files.slice(i, i + CONFIG.BATCH_SIZE);

            for (const file of batch) {
                process.stdout.write(`   ${path.basename(file.full)}...`);

                const result = await uploadFile(file.full, competitorId, file.relative);

                if (result.success) {
                    stats.success++;
                    console.log(' ✅');
                } else {
                    stats.failed++;
                    console.log(` ❌ (${result.error})`);
                }

                await new Promise(r => setTimeout(r, CONFIG.DELAY_BETWEEN_FILES));
            }

            if (i + CONFIG.BATCH_SIZE < files.length) {
                await new Promise(r => setTimeout(r, CONFIG.DELAY_BETWEEN_BATCHES));
            }
        }

        console.log('');
    }

    console.log('='.repeat(60));
    console.log('📊 UPLOAD COMPLETE');
    console.log(`Total: ${stats.total}`);
    console.log(`✅ Success: ${stats.success}`);
    console.log(`❌ Failed: ${stats.failed}`);
    console.log(`Success rate: ${((stats.success / stats.total) * 100).toFixed(1)}%`);
    console.log('='.repeat(60));

    if (stats.failed === 0) {
        console.log('\n🎉 All screenshots uploaded successfully!\n');
    }
}

main().catch(console.error);
