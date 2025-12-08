#!/usr/bin/env node

/**
 * Upload Local Screenshots to AWS S3
 * Uploads all local screenshots from backend/uploads/screenshots to S3 bucket
 */

const fs = require('fs');
const path = require('path');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// S3 Configuration
const s3Client = new S3Client({
    region: process.env.AWS_REGION || 'eu-central-1',
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
});

const S3_BUCKET = process.env.S3_BUCKET || 'competitor-lens-screenshots';
const CDN_URL = `https://${S3_BUCKET}.s3.${process.env.AWS_REGION || 'eu-central-1'}.amazonaws.com`;
const LOCAL_DIR = path.join(__dirname, '..', '..', 'uploads', 'screenshots');

let stats = {
    total: 0,
    uploaded: 0,
    failed: 0,
    skipped: 0,
    dbUpdated: 0
};

async function uploadFile(filePath, s3Key) {
    try {
        const fileContent = fs.readFileSync(filePath);
        const contentType = filePath.endsWith('.png') ? 'image/png' :
            filePath.endsWith('.jpg') || filePath.endsWith('.jpeg') ? 'image/jpeg' :
                filePath.endsWith('.webp') ? 'image/webp' : 'application/octet-stream';

        const command = new PutObjectCommand({
            Bucket: S3_BUCKET,
            Key: s3Key,
            Body: fileContent,
            ContentType: contentType,
            CacheControl: 'public, max-age=31536000', // 1 year cache
        });

        await s3Client.send(command);
        return { success: true, url: `${CDN_URL}/${s3Key}` };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

async function updateDatabaseCdnUrl(fileName, cdnUrl) {
    try {
        const screenshot = await prisma.screenshot.findFirst({
            where: { fileName }
        });

        if (screenshot) {
            await prisma.screenshot.update({
                where: { id: screenshot.id },
                data: { cdnUrl }
            });
            return true;
        }
        return false;
    } catch (error) {
        console.error(`DB update error for ${fileName}:`, error.message);
        return false;
    }
}

async function scanAndUpload() {
    console.log('🚀 S3 Screenshot Upload');
    console.log('='.repeat(60));
    console.log(`S3 Bucket: ${S3_BUCKET}`);
    console.log(`Region: ${process.env.AWS_REGION}`);
    console.log(`CDN URL: ${CDN_URL}`);
    console.log(`Local Dir: ${LOCAL_DIR}\n`);

    if (!fs.existsSync(LOCAL_DIR)) {
        console.error('❌ Local screenshots directory not found!');
        process.exit(1);
    }

    const competitors = fs.readdirSync(LOCAL_DIR)
        .filter(item => fs.statSync(path.join(LOCAL_DIR, item)).isDirectory());

    for (const competitor of competitors) {
        console.log(`\n📁 ${competitor}`);
        const competitorPath = path.join(LOCAL_DIR, competitor);

        // Scan all files (including subdirectories)
        const files = [];
        function scan(dir, relativePath = '') {
            const items = fs.readdirSync(dir);
            for (const item of items) {
                const fullPath = path.join(dir, item);
                const relPath = relativePath ? path.join(relativePath, item) : item;

                if (fs.statSync(fullPath).isDirectory()) {
                    scan(fullPath, relPath);
                } else if (/\.(png|jpg|jpeg|webp)$/i.test(item)) {
                    files.push({ full: fullPath, relative: relPath, name: item });
                }
            }
        }

        scan(competitorPath, competitor);
        console.log(`   Found: ${files.length} files`);
        stats.total += files.length;

        // Upload each file
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const s3Key = `screenshots/${file.relative}`;

            process.stdout.write(`   [${i + 1}/${files.length}] ${file.name}...`);

            const result = await uploadFile(file.full, s3Key);

            if (result.success) {
                stats.uploaded++;

                // Update database
                const dbUpdated = await updateDatabaseCdnUrl(file.name, result.url);
                if (dbUpdated) stats.dbUpdated++;

                console.log(' ✅');
            } else {
                stats.failed++;
                console.log(` ❌ (${result.error})`);
            }

            // Small delay to avoid rate limits
            await new Promise(r => setTimeout(r, 50));
        }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 UPLOAD COMPLETE');
    console.log(`Total files: ${stats.total}`);
    console.log(`✅ Uploaded: ${stats.uploaded}`);
    console.log(`❌ Failed: ${stats.failed}`);
    console.log(`💾 DB Updated: ${stats.dbUpdated}`);
    console.log(`Success rate: ${((stats.uploaded / stats.total) * 100).toFixed(1)}%`);
    console.log('='.repeat(60));

    await prisma.$disconnect();
}

scanAndUpload().catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
});
