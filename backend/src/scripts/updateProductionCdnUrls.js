#!/usr/bin/env node

/**
 * Update Production Database with S3 CDN URLs
 * Uses S3 filenames to update cdnUrl fields in production database
 */

const { PrismaClient } = require('@prisma/client');

// Production database
const prisma = new PrismaClient({
    datasources: {
        db: {
            url: process.env.DATABASE_URL
        }
    }
});

const S3_BUCKET = 'competitor-lens-screenshots';
const CDN_URL = `https://${S3_BUCKET}.s3.eu-central-1.amazonaws.com`;

async function updateProductionCdnUrls() {
    console.log('🔄 Updating production database with S3 CDN URLs');
    console.log('='.repeat(60));
    console.log(`CDN URL: ${CDN_URL}\n`);

    let updated = 0;
    let alreadySet = 0;
    let failed = 0;

    // Get all screenshots
    const screenshots = await prisma.screenshot.findMany({
        select: { id: true, fileName: true, filePath: true, cdnUrl: true },
        where: {
            fileName: { not: null }
        }
    });

    console.log(`📊 Found ${screenshots.length} screenshots in database\n`);

    for (const screenshot of screenshots) {
        try {
            if (screenshot.cdnUrl && screenshot.cdnUrl.includes('s3.amazonaws.com')) {
                alreadySet++;
                continue; // Already has S3 URL
            }

            // Extract competitor and path from filePath
            // Example: /app/uploads/screenshots/Coinbase/file.png -> screenshots/Coinbase/file.png
            let s3Key = null;

            if (screenshot.filePath && screenshot.filePath.includes('screenshots/')) {
                const pathPart = screenshot.filePath.split('screenshots/')[1];
                s3Key = `screenshots/${pathPart}`;
            } else if (screenshot.fileName) {
                // Fallback: Try to find by fileName (less accurate)
                // This won't work for all cases since we don't know the competitor folder
                console.log(`⚠️  Skipping ${screenshot.fileName} - can't determine S3 path`);
                failed++;
                continue;
            }

            if (s3Key) {
                const cdnUrl = `${CDN_URL}/${s3Key}`;

                await prisma.screenshot.update({
                    where: { id: screenshot.id },
                    data: { cdnUrl }
                });

                updated++;
                if (updated % 100 === 0) {
                    console.log(`✅ Updated ${updated} records...`);
                }
            }
        } catch (error) {
            console.error(`❌ Error updating ${screenshot.fileName}:`, error.message);
            failed++;
        }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 UPDATE COMPLETE');
    console.log(`✅ Updated: ${updated}`);
    console.log(`⏭️  Already set: ${alreadySet}`);
    console.log(`❌ Failed: ${failed}`);
    console.log('='.repeat(60));

    await prisma.$disconnect();
}

updateProductionCdnUrls().catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
});
