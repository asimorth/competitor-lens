import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';

const router = Router();
const prisma = new PrismaClient();

const S3_BUCKET = process.env.S3_BUCKET || 'competitor-lens-screenshots';
const AWS_REGION = process.env.AWS_REGION || 'eu-central-1';

/**
 * POST /api/screenshots/assign-features
 * Scans S3 paths and intelligently assigns featureIds based on folder names
 */
router.post('/assign-features', async (req, res) => {
    try {
        console.log('🔍 Starting smart feature assignment from S3 paths...');

        // Initialize S3 client
        const s3Client = new S3Client({
            region: AWS_REGION,
            credentials: {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
            }
        });

        // Step 1: Get all features from database
        const features = await prisma.feature.findMany({
            select: { id: true, name: true }
        });
        console.log(`📊 Found ${features.length} features in database`);

        // Create feature name map (case-insensitive, normalized)
        const featureMap = new Map<string, string>();
        features.forEach(f => {
            const normalized = f.name.toLowerCase().trim();
            featureMap.set(normalized, f.id);

            // Add common variations
            if (normalized.includes('kyc')) featureMap.set('kyc', f.id);
            if (normalized.includes('onboarding')) featureMap.set('onboarding', f.id);
            if (normalized.includes('user onboarding')) featureMap.set('user onboarding', f.id);
            if (normalized.includes('ai')) featureMap.set('ai', f.id);
            if (normalized.includes('ai sentiment')) featureMap.set('ai sentiment', f.id);
            if (normalized.includes('p2p')) featureMap.set('p2p', f.id);
            if (normalized.includes('staking')) featureMap.set('staking', f.id);
            if (normalized.includes('auto-invest') || normalized.includes('auto invest')) {
                featureMap.set('auto-invest', f.id);
                featureMap.set('dca', f.id);
            }
        });

        // Step 2: Scan S3 for all files and extract feature info from paths
        console.log('📂 Scanning S3 bucket...');
        const fileFeatureMap: Array<{ fileName: string; featureId: string | null; folderName: string | null }> = [];
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
                        // Parse path: screenshots/Competitor/Feature/file.png
                        const parts = obj.Key.split('/');
                        const fileName = parts[parts.length - 1];

                        // Check if there's a folder between competitor and filename
                        let featureId: string | null = null;
                        let folderName: string | null = null;

                        if (parts.length >= 4) {
                            // Has subfolder: screenshots/Competitor/Feature/file.png
                            folderName = parts[2];
                            const normalizedFolder = folderName.toLowerCase().trim();
                            featureId = featureMap.get(normalizedFolder) || null;
                        }

                        fileFeatureMap.push({ fileName, featureId, folderName });
                    }
                }
            }

            continuationToken = response.IsTruncated ? response.NextContinuationToken : undefined;
        } while (continuationToken);

        console.log(`✅ Scanned ${fileFeatureMap.length} files`);

        // Step 3: Update database
        let assigned = 0;
        let notFound = 0;
        let noFolder = 0;

        for (const file of fileFeatureMap) {
            if (file.featureId) {
                // Update screenshot with featureId
                await prisma.screenshot.updateMany({
                    where: { fileName: file.fileName },
                    data: { featureId: file.featureId }
                });
                assigned++;

                if (assigned % 100 === 0) {
                    console.log(`✅ Assigned ${assigned} features...`);
                }
            } else if (file.folderName) {
                // Has folder but no feature match
                notFound++;
            } else {
                // No subfolder (flat structure)
                noFolder++;
            }
        }

        // Summary
        const result = {
            success: true,
            totalFiles: fileFeatureMap.length,
            assigned,
            notFound,
            noFolder,
            folders: Array.from(new Set(fileFeatureMap.filter(f => f.folderName).map(f => f.folderName)))
        };

        console.log('🎉 Feature assignment complete:', result);

        res.json(result);

    } catch (error) {
        console.error('Feature assignment error:', error);
        res.status(500).json({
            success: false,
            error: 'Feature assignment failed',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

export default router;
