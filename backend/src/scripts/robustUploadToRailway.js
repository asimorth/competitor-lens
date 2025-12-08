#!/usr/bin/env node

/**
 * PRODUCTION-GRADE Screenshot Upload to Railway
 * - Batch processing (10 files at a time)
 * - Automatic retry with exponential backoff
 * - Progress tracking and resume capability
 * - Comprehensive error logging
 * - Rate limiting to prevent API overload
 */

const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const fetch = require('node-fetch');

// Configuration
const CONFIG = {
    RAILWAY_API: 'https://competitor-lens-production.up.railway.app',
    LOCAL_SCREENSHOTS_DIR: path.join(__dirname, '..', '..', 'uploads', 'screenshots'),
    BATCH_SIZE: 10,
    MAX_RETRIES: 3,
    RETRY_DELAY_MS: 2000,
    RATE_LIMIT_DELAY_MS: 500,
    PROGRESS_FILE: path.join(__dirname, 'upload_progress.json')
};

// Progress tracking
let uploadProgress = {
    completed: [],
    failed: [],
    total: 0,
    startTime: null
};

// Load existing progress if resuming
function loadProgress() {
    if (fs.existsSync(CONFIG.PROGRESS_FILE)) {
        try {
            const data = fs.readFileSync(CONFIG.PROGRESS_FILE, 'utf8');
            uploadProgress = JSON.parse(data);
            console.log('📂 Resumed from previous session');
            console.log(`   Completed: ${uploadProgress.completed.length}`);
            console.log(`   Failed: ${uploadProgress.failed.length}\n`);
        } catch (error) {
            console.warn('⚠️  Could not load progress file, starting fresh\n');
        }
    }
}

// Save progress
function saveProgress() {
    try {
        fs.writeFileSync(CONFIG.PROGRESS_FILE, JSON.stringify(uploadProgress, null, 2));
    } catch (error) {
        console.error('⚠️  Could not save progress:', error.message);
    }
}

// Exponential backoff delay
function getRetryDelay(attempt) {
    return CONFIG.RETRY_DELAY_MS * Math.pow(2, attempt);
}

// Upload single file with retry
async function uploadFileWithRetry(filePath, competitorId, competitorName, attempt = 0) {
    try {
        const fileName = path.basename(filePath);
        const stats = fs.statSync(filePath);

        // Regular upload endpoint (more reliable than restore)
        const formData = new FormData();
        formData.append('screenshot', fs.createReadStream(filePath), {
            filename: fileName,
            contentType: 'image/png'
        });
        formData.append('competitorId', competitorId);

        const response = await fetch(`${CONFIG.RAILWAY_API}/api/screenshots`, {
            method: 'POST',
            body: formData,
            headers: formData.getHeaders(),
            timeout: 30000 // 30 second timeout
        });

        const result = await response.json().catch(() => ({ error: 'Invalid response' }));

        if (response.ok && result.success) {
            return { success: true, fileName, competitorName };
        } else {
            throw new Error(result.error || `HTTP ${response.status}`);
        }

    } catch (error) {
        if (attempt < CONFIG.MAX_RETRIES) {
            const delay = getRetryDelay(attempt);
            console.log(`\n   ⏳ Retry ${attempt + 1}/${CONFIG.MAX_RETRIES} after ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            return uploadFileWithRetry(filePath, competitorId, competitorName, attempt + 1);
        }

        return {
            success: false,
            fileName: path.basename(filePath),
            competitorName,
            error: error.message || String(error)
        };
    }
}

// Process batch of files
async function processBatch(batch, competitorId, competitorName) {
    const results = [];

    for (const file of batch) {
        const fileName = path.basename(file);

        // Skip if already completed
        if (uploadProgress.completed.includes(file)) {
            console.log(`   ✓ ${fileName} (already uploaded)`);
            continue;
        }

        process.stdout.write(`   → ${fileName}...`);

        const result = await uploadFileWithRetry(file, competitorId, competitorName);
        results.push(result);

        if (result.success) {
            uploadProgress.completed.push(file);
            console.log(' ✅');
        } else {
            uploadProgress.failed.push({ file, error: result.error });
            console.log(` ❌ (${result.error})`);
        }

        // Save progress after each file
        saveProgress();

        // Rate limiting between files
        await new Promise(resolve => setTimeout(resolve, CONFIG.RATE_LIMIT_DELAY_MS));
    }

    return results;
}

// Main upload function
async function uploadAllScreenshots() {
    console.log('🚀 PRODUCTION Screenshot Upload to Railway');
    console.log('='.repeat(60));
    console.log(`📁 Source: ${CONFIG.LOCAL_SCREENSHOTS_DIR}`);
    console.log(`🎯 Target: ${CONFIG.RAILWAY_API}`);
    console.log(`📦 Batch size: ${CONFIG.BATCH_SIZE}`);
    console.log(`🔄 Max retries: ${CONFIG.MAX_RETRIES}`);
    console.log('='.repeat(60) + '\n');

    // Load progress
    loadProgress();
    uploadProgress.startTime = uploadProgress.startTime || new Date().toISOString();

    // Verify directory exists
    if (!fs.existsSync(CONFIG.LOCAL_SCREENSHOTS_DIR)) {
        console.error('❌ Screenshots directory not found:', CONFIG.LOCAL_SCREENSHOTS_DIR);
        process.exit(1);
    }

    // Fetch competitors
    console.log('📡 Fetching competitors from Railway API...');
    const competitorsRes = await fetch(`${CONFIG.RAILWAY_API}/api/competitors`);
    const competitorsData = await competitorsRes.json();
    const competitors = competitorsData.data || [];

    const competitorMap = {};
    competitors.forEach(comp => {
        competitorMap[comp.name] = comp.id;
    });

    console.log(`✅ Found ${competitors.length} competitors\n`);

    // Scan directory
    const competitorDirs = fs.readdirSync(CONFIG.LOCAL_SCREENSHOTS_DIR)
        .filter(item => fs.statSync(path.join(CONFIG.LOCAL_SCREENSHOTS_DIR, item)).isDirectory());

    let totalFiles = 0;
    let totalSuccess = uploadProgress.completed.length;
    let totalFailed = uploadProgress.failed.length;

    // Process each competitor
    for (const competitorName of competitorDirs) {
        const competitorId = competitorMap[competitorName];

        if (!competitorId) {
            console.log(`⚠️  Skipping ${competitorName} (not in database)\n`);
            continue;
        }

        const competitorDir = path.join(CONFIG.LOCAL_SCREENSHOTS_DIR, competitorName);
        console.log(`📁 Processing: ${competitorName}`);

        // Recursively find files
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

        totalFiles += files.length;
        console.log(`   Files: ${files.length}\n`);

        // Process in batches
        for (let i = 0; i < files.length; i += CONFIG.BATCH_SIZE) {
            const batch = files.slice(i, i + CONFIG.BATCH_SIZE);
            const batchNum = Math.floor(i / CONFIG.BATCH_SIZE) + 1;
            const totalBatches = Math.ceil(files.length / CONFIG.BATCH_SIZE);

            console.log(`   📦 Batch ${batchNum}/${totalBatches} (${batch.length} files):`);

            const results = await processBatch(batch, competitorId, competitorName);

            const batchSuccess = results.filter(r => r.success).length;
            const batchFailed = results.filter(r => !r.success).length;

            totalSuccess += batchSuccess;
            totalFailed += batchFailed;

            console.log(`   ✅ ${batchSuccess} succeeded, ❌ ${batchFailed} failed\n`);

            // Delay between batches
            if (i + CONFIG.BATCH_SIZE < files.length) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }

        console.log('─'.repeat(60) + '\n');
    }

    // Final summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 UPLOAD COMPLETE');
    console.log('='.repeat(60));
    console.log(`Total files processed: ${totalFiles}`);
    console.log(`✅ Successful uploads: ${totalSuccess}`);
    console.log(`❌ Failed uploads: ${totalFailed}`);
    console.log(`📁 Success rate: ${((totalSuccess / totalFiles) * 100).toFixed(1)}%`);
    console.log('='.repeat(60));

    if (totalFailed > 0) {
        console.log('\n⚠️  Some uploads failed. Check upload_progress.json for details.');
        console.log('   You can re-run this script to retry failed uploads.\n');
    } else {
        console.log('\n🎉 All screenshots uploaded successfully!');
        console.log(`\n🔗 Verify at: ${CONFIG.RAILWAY_API}/debug/files\n`);

        // Clean up progress file on complete success
        if (fs.existsSync(CONFIG.PROGRESS_FILE)) {
            fs.unlinkSync(CONFIG.PROGRESS_FILE);
        }
    }
}

// Run with error handling
uploadAllScreenshots().catch(error => {
    console.error('\n❌ Fatal error:', error);
    console.error('\nProgress saved. You can resume by running this script again.\n');
    process.exit(1);
});
