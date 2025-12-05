import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

const S3_BUCKET = process.env.S3_BUCKET || 'competitor-lens-screenshots';
const AWS_REGION = process.env.AWS_REGION || 'eu-central-1';
const CDN_URL = `https://${S3_BUCKET}.s3.${AWS_REGION}.amazonaws.com`;

/**
 * POST /api/screenshots/sync-s3-urls
 * Updates all screenshot records with S3 CDN URLs
 */
router.post('/sync-s3-urls', async (req, res) => {
    try {
        console.log('🔄 Starting S3 URL sync...');

        let updated = 0;
        let alreadySet = 0;
        let skipped = 0;

        // Get all screenshots with filePath
        const screenshots = await prisma.screenshot.findMany({
            where: {
                filePath: { not: null }
            },
            select: { id: true, fileName: true, filePath: true, cdnUrl: true }
        });

        console.log(`Found ${screenshots.length} screenshots`);

        for (const screenshot of screenshots) {
            try {
                // Skip if already has S3 URL
                if (screenshot.cdnUrl && screenshot.cdnUrl.includes('s3.amazonaws.com')) {
                    alreadySet++;
                    continue;
                }

                // Extract S3 key from filePath
                // Example: /app/uploads/screenshots/Coinbase/file.png -> screenshots/Coinbase/file.png
                let s3Key = null;

                if (screenshot.filePath.includes('screenshots/')) {
                    const pathPart = screenshot.filePath.split('screenshots/')[1];
                    s3Key = `screenshots/${pathPart}`;
                }

                if (s3Key) {
                    const cdnUrl = `${CDN_URL}/${s3Key}`;

                    await prisma.screenshot.update({
                        where: { id: screenshot.id },
                        data: { cdnUrl }
                    });

                    updated++;
                } else {
                    skipped++;
                }
            } catch (error) {
                console.error(`Error updating ${screenshot.fileName}:`, error);
                skipped++;
            }
        }

        console.log(`✅ Sync complete: ${updated} updated, ${alreadySet} already set, ${skipped} skipped`);

        res.json({
            success: true,
            totalScreenshots: screenshots.length,
            updated,
            alreadySet,
            skipped,
            cdnUrl: CDN_URL
        });

    } catch (error) {
        console.error('Sync error:', error);
        res.status(500).json({
            success: false,
            error: 'Sync failed',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

export default router;
