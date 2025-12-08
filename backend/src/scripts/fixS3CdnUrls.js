#!/usr/bin/env node

/**
 * CORRECT S3 URL Sync - Find actual S3 files and update database
 * Uses AWS SDK to list S3 files and match by fileName
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

async function listAllS3Files() {
    const files = new Map(); // fileName -> s3Key
    let continuationToken = null;

    do {
        const command = new ListObjectsV2Command({
            Bucket: S3_BUCKET,
            Prefix: 'screenshots/',
            ContinuationToken: continuationToken
        });

        const response = await s3Client.send(command);

        if (response.Contents) {
            for (const obj of response.Contents) {
                const fileName = obj.Key.split('/').pop();
                if (fileName && /\.(png|jpg|jpeg|webp)$/i.test(fileName)) {
                    files.set(fileName, obj.Key);
                }
            }
        }

        continuationToken = response.IsTruncated ? response.NextContinuationToken : null;
    } while (continuationToken);

    return files;
}

async function fixCdnUrls() {
    console.log('🔍 Listing all S3 files...');
    const s3Files = await listAllS3Files();
    console.log(`Found ${s3Files.size} files in S3\n`);

    console.log('📊 Fetching database screenshots...');
    const screenshots = await prisma.screenshot.findMany({
        select: { id: true, fileName: true, cdnUrl: true }
    });
    console.log(`Found ${screenshots.length} screenshots in database\n`);

    let updated = 0;
    let notFound = 0;
    let alreadyCorrect = 0;

    for (const screenshot of screenshots) {
        if (!screenshot.fileName) {
            notFound++;
            continue;
        }

        const s3Key = s3Files.get(screenshot.fileName);

        if (s3Key) {
            const correctCdnUrl = `${CDN_URL}/${s3Key}`;

            if (screenshot.cdnUrl !== correctCdnUrl) {
                await prisma.screenshot.update({
                    where: { id: screenshot.id },
                    data: { cdnUrl: correctCdnUrl }
                });
                updated++;

                if (updated % 100 === 0) {
                    console.log(`✅ Updated ${updated}...`);
                }
            } else {
                alreadyCorrect++;
            }
        } else {
            notFound++;
        }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 FIX COMPLETE');
    console.log(`✅ Updated: ${updated}`);
    console.log(`⏭️  Already correct: ${alreadyCorrect}`);
    console.log(`❌ Not found in S3: ${notFound}`);
    console.log('='.repeat(60));

    await prisma.$disconnect();
}

fixCdnUrls().catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
});
