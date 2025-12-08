#!/usr/bin/env node

/**
 * SMART S3-DATABASE CLEANUP
 * Aligns production database EXACTLY with S3 bucket (source of truth)
 * 
 * Actions:
 * 1. List ALL files in S3 bucket
 * 2. Match with database by fileName
 * 3. DELETE orphan database records (no S3 file)
 * 4. UPDATE remaining records with correct cdnUrl
 */

const { S3Client, ListObjectsV2Command } = require('@aws-sdk/client-s3');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: process.env.DATABASE_URL
        }
    }
});

const S3_BUCKET = 'competitor-lens-screenshots';
const AWS_REGION = 'eu-central-1';
const CDN_URL = `https://${S3_BUCKET}.s3.${AWS_REGION}.amazonaws.com`;

const s3Client = new S3Client({
    region: AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
});

// Colors for console output
const colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
};

async function listAllS3Files() {
    console.log(`${colors.blue}📂 Listing S3 bucket files...${colors.reset}`);
    const fileMap = new Map(); // fileName -> s3Key
    let continuationToken = null;
    let totalFiles = 0;

    do {
        const command = new ListObjectsV2Command({
            Bucket: S3_BUCKET,
            Prefix: 'screenshots/',
            ContinuationToken: continuationToken
        });

        const response = await s3Client.send(command);

        if (response.Contents) {
            for (const obj of response.Contents) {
                if (obj.Key.endsWith('/')) continue; // Skip directories

                const fileName = obj.Key.split('/').pop();
                if (fileName && /\.(png|jpg|jpeg|webp)$/i.test(fileName)) {
                    fileMap.set(fileName, obj.Key);
                    totalFiles++;
                }
            }
        }

        continuationToken = response.IsTruncated ? response.NextContinuationToken : null;
    } while (continuationToken);

    console.log(`${colors.green}✅ Found ${totalFiles} files in S3${colors.reset}\n`);
    return fileMap;
}

async function smartCleanup() {
    console.log('='.repeat(70));
    console.log(`${colors.cyan}🧹 SMART S3-DATABASE CLEANUP${colors.reset}`);
    console.log('='.repeat(70));
    console.log();

    // Step 1: List S3 files
    const s3FileMap = await listAllS3Files();

    // Step 2: Fetch all database screenshots
    console.log(`${colors.blue}📊 Fetching database records...${colors.reset}`);
    const allScreenshots = await prisma.screenshot.findMany({
        select: { id: true, fileName: true, cdnUrl: true }
    });
    console.log(`${colors.green}✅ Found ${allScreenshots.length} database records${colors.reset}\n`);

    // Step 3: Categorize records
    const toUpdate = [];
    const toDelete = [];

    for (const screenshot of allScreenshots) {
        if (!screenshot.fileName) {
            toDelete.push(screenshot.id);
            continue;
        }

        const s3Key = s3FileMap.get(screenshot.fileName);

        if (s3Key) {
            // File exists in S3 - check if cdnUrl needs update
            const correctCdnUrl = `${CDN_URL}/${s3Key}`;
            if (screenshot.cdnUrl !== correctCdnUrl) {
                toUpdate.push({ id: screenshot.id, cdnUrl: correctCdnUrl });
            }
        } else {
            // File NOT in S3 - orphan record
            toDelete.push(screenshot.id);
        }
    }

    // Step 4: Report findings
    console.log('='.repeat(70));
    console.log(`${colors.yellow}📋 ANALYSIS RESULTS${colors.reset}`);
    console.log('='.repeat(70));
    console.log(`${colors.green}✅ Keep (with correct cdnUrl):${colors.reset} ${allScreenshots.length - toDelete.length - toUpdate.length}`);
    console.log(`${colors.yellow}⚠️  Update (wrong cdnUrl):${colors.reset} ${toUpdate.length}`);
    console.log(`${colors.red}❌ Delete (no S3 file):${colors.reset} ${toDelete.length}`);
    console.log(`${colors.cyan}📊 Final database count:${colors.reset} ${allScreenshots.length - toDelete.length}`);
    console.log('='.repeat(70));
    console.log();

    // Step 5: Execute cleanup
    let updated = 0;
    let deleted = 0;

    if (toUpdate.length > 0) {
        console.log(`${colors.blue}🔄 Updating ${toUpdate.length} records...${colors.reset}`);
        for (const record of toUpdate) {
            await prisma.screenshot.update({
                where: { id: record.id },
                data: { cdnUrl: record.cdnUrl }
            });
            updated++;
            if (updated % 100 === 0) {
                console.log(`   ✅ Updated ${updated}/${toUpdate.length}...`);
            }
        }
        console.log(`${colors.green}✅ Updated ${updated} records${colors.reset}\n`);
    }

    if (toDelete.length > 0) {
        console.log(`${colors.blue}🗑️  Deleting ${toDelete.length} orphan records...${colors.reset}`);

        // Delete in batches to avoid timeout
        const batchSize = 100;
        for (let i = 0; i < toDelete.length; i += batchSize) {
            const batch = toDelete.slice(i, i + batchSize);
            await prisma.screenshot.deleteMany({
                where: {
                    id: { in: batch }
                }
            });
            deleted += batch.length;
            console.log(`   🗑️  Deleted ${deleted}/${toDelete.length}...`);
        }
        console.log(`${colors.green}✅ Deleted ${deleted} orphan records${colors.reset}\n`);
    }

    // Step 6: Final verification
    const finalCount = await prisma.screenshot.count();

    console.log('='.repeat(70));
    console.log(`${colors.green}🎉 CLEANUP COMPLETE${colors.reset}`);
    console.log('='.repeat(70));
    console.log(`${colors.cyan}S3 Files:${colors.reset} ${s3FileMap.size}`);
    console.log(`${colors.cyan}Database Records:${colors.reset} ${finalCount}`);
    console.log(`${colors.cyan}Match:${colors.reset} ${finalCount === s3FileMap.size ? '✅ Perfect!' : '⚠️  Check logs'}`);
    console.log();
    console.log(`${colors.green}✅ Updated:${colors.reset} ${updated} cdnUrls`);
    console.log(`${colors.red}🗑️  Deleted:${colors.reset} ${deleted} orphan records`);
    console.log('='.repeat(70));

    await prisma.$disconnect();
}

smartCleanup().catch(error => {
    console.error(`${colors.red}❌ Fatal error:${colors.reset}`, error);
    process.exit(1);
});
