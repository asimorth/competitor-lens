import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';

const router = Router();
const prisma = new PrismaClient();

const S3_BUCKET = process.env.S3_BUCKET || 'competitor-lens-screenshots';
const AWS_REGION = process.env.AWS_REGION || 'eu-central-1';
const CDN_URL = `https://${S3_BUCKET}.s3.${AWS_REGION}.amazonaws.com`;

/**
 * POST /api/screenshots/rebuild-from-s3
 * DANGER: Deletes all screenshots and rebuilds from S3 bucket
 */
router.post('/rebuild-from-s3', async (req, res) => {
    try {
        console.log('🔥 Starting database rebuild from S3...');

        // Initialize S3 client
        const s3Client = new S3Client({
            region: AWS_REGION,
            credentials: {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
            }
        });

        // Step 1: List ALL files in S3
        console.log('📂 Scanning S3 bucket...');
        const s3Files: Array<{ key: string; size: number }> = [];
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
                    if (obj.Key && !obj.Key.endsWith('/') && /\.(png|jpg|jpeg|webp)$/i.test(obj.Key)) {
                        s3Files.push({
                            key: obj.Key,
                            size: obj.Size || 0
                        });
                    }
                }
            }

            continuationToken = response.IsTruncated ? response.NextContinuationToken : undefined;
        } while (continuationToken);

        console.log(`✅ Found ${s3Files.length} files in S3`);

        // Step 2: Get competitor map
        const competitors = await prisma.competitor.findMany({
            select: { id: true, name: true }
        });
        const competitorMap = new Map(competitors.map(c => [c.name, c.id]));
        console.log(`📊 Found ${competitors.length} competitors`);

        // Step 3: DELETE all existing screenshots
        console.log('🗑️  Deleting existing screenshots...');
        const deleteResult = await prisma.screenshot.deleteMany({});
        console.log(`🗑️  Deleted ${deleteResult.count} old records`);

        // Step 4: CREATE new records from S3
        console.log('📝 Creating new records from S3...');
        let created = 0;
        let skipped = 0;

        for (const file of s3Files) {
            try {
                // Extract competitor name from path: screenshots/Kuantist/file.png
                const parts = file.key.split('/');
                if (parts.length < 3) {
                    skipped++;
                    continue;
                }

                const competitorName = parts[1];
                const fileName = parts[parts.length - 1];

                const competitorId = competitorMap.get(competitorName);
                if (!competitorId) {
                    console.log(`⚠️  Unknown competitor: ${competitorName}`);
                    skipped++;
                    continue;
                }

                // Create screenshot record
                await prisma.screenshot.create({
                    data: {
                        competitorId,
                        featureId: null,
                        filePath: file.key,
                        fileName,
                        fileSize: BigInt(file.size),
                        mimeType: fileName.endsWith('.png') ? 'image/png' :
                            fileName.endsWith('.jpg') || fileName.endsWith('.jpeg') ? 'image/jpeg' :
                                fileName.endsWith('.webp') ? 'image/webp' : 'image/png',
                        cdnUrl: `${CDN_URL}/${file.key}`,
                        isOnboarding: false,
                        uploadSource: 's3-rebuild'
                    }
                });

                created++;
                if (created % 100 === 0) {
                    console.log(`✅ Created ${created}/${s3Files.length}...`);
                }
            } catch (error) {
                console.error(`Error creating record for ${file.key}:`, error);
                skipped++;
            }
        }

        const finalCount = await prisma.screenshot.count();

        const result = {
            success: true,
            s3Files: s3Files.length,
            deleted: deleteResult.count,
            created,
            skipped,
            finalCount,
            match: created === s3Files.length - skipped
        };

        console.log('🎉 Rebuild complete:', result);

        res.json(result);

    } catch (error) {
        console.error('Rebuild error:', error);
        res.status(500).json({
            success: false,
            error: 'Rebuild failed',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

export default router;
