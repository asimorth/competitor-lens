import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';

const router = Router();
const prisma = new PrismaClient();

const S3_BUCKET = process.env.S3_BUCKET || 'competitor-lens-screenshots';
const AWS_REGION = process.env.AWS_REGION || 'eu-central-1';
const CDN_URL = `https://${S3_BUCKET}.s3.${AWS_REGION}.amazonaws.com`;

/**
 * POST /api/screenshots/fix-s3-urls
 * Scans S3 bucket and updates database with ACTUAL file paths
 */
router.post('/fix-s3-urls', async (req, res) => {
    try {
        console.log('🔍 Scanning S3 bucket for actual files...');

        // Initialize S3 client
        const s3Client = new S3Client({
            region: AWS_REGION,
            credentials: {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
            }
        });

        // List ALL files in S3 bucket
        const fileMap = new Map<string, string>(); // fileName -> s3Key
        let continuationToken: string | undefined;

        do {
            const command = new ListObjectsV2Command({
                Bucket: S3_BUCKET,
                Prefix: 'screenshots/',
                ContinuationToken: continuationToken
            });

            const response = await s3Client.send(command);

            if (response.Contents) {
                for (const obj of response.Contents) {
                    if (obj.Key && !obj.Key.endsWith('/')) {
                        const fileName = obj.Key.split('/').pop();
                        if (fileName && /\.(png|jpg|jpeg|webp)$/i.test(fileName)) {
                            fileMap.set(fileName, obj.Key);
                        }
                    }
                }
            }

            continuationToken = response.IsTruncated ? response.NextContinuationToken : undefined;
        } while (continuationToken);

        console.log(`✅ Found ${fileMap.size} files in S3`);

        // Get all database screenshots
        const screenshots = await prisma.screenshot.findMany({
            select: { id: true, fileName: true, cdnUrl: true }
        });

        console.log(`📊 Found ${screenshots.length} database records`);

        let updated = 0;
        let notFound = 0;
        let alreadyCorrect = 0;

        // Match and update
        for (const screenshot of screenshots) {
            if (!screenshot.fileName) {
                notFound++;
                continue;
            }

            const s3Key = fileMap.get(screenshot.fileName);

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

        const result = {
            success: true,
            s3Files: fileMap.size,
            databaseRecords: screenshots.length,
            updated,
            alreadyCorrect,
            notFound,
            cdnUrl: CDN_URL
        };

        console.log('🎉 Fix complete:', result);

        res.json(result);

    } catch (error) {
        console.error('Fix error:', error);
        res.status(500).json({
            success: false,
            error: 'Fix failed',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

export default router;
