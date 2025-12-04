import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import fs from 'fs/promises';
import path from 'path';
import multer from 'multer';

const router = Router();
const prisma = new PrismaClient();

// Simple memory storage for bulk upload
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

/**
 * POST /api/bulk-upload/screenshot
 * Simplified bulk upload endpoint without strict validation
 * Accepts: screenshot file + competitorId
 */
router.post('/screenshot', upload.single('file'), async (req, res) => {
    try {
        const { competitorId } = req.body;

        if (!req.file) {
            return res.status(400).json({ error: 'No file provided' });
        }

        if (!competitorId) {
            return res.status(400).json({ error: 'Competitor ID required' });
        }

        // Get competitor info
        const competitor = await prisma.competitor.findUnique({
            where: { id: competitorId }
        });

        if (!competitor) {
            return res.status(404).json({ error: 'Competitor not found' });
        }

        // Determine save path based on original file path if provided
        const originalPath = req.body.originalPath || '';
        let savePath;

        if (originalPath) {
            // Extract relative path from original (e.g., "Binance Global/AI Tool/file.png")
            const relativePath = originalPath.replace(/.*uploads\/screenshots\//, '');
            savePath = path.join(process.cwd(), 'uploads', 'screenshots', relativePath);
        } else {
            // Fallback: save in competitor root
            savePath = path.join(
                process.cwd(),
                'uploads',
                'screenshots',
                competitor.name,
                req.file.originalname
            );
        }

        // Ensure directory exists
        await fs.mkdir(path.dirname(savePath), { recursive: true });

        // Write file
        await fs.writeFile(savePath, req.file.buffer);

        // Optional: Create/update DB record if file matches existing screenshot
        let dbRecord = null;
        try {
            const existingScreenshot = await prisma.screenshot.findFirst({
                where: {
                    competitorId,
                    fileName: req.file.originalname
                }
            });

            if (existingScreenshot) {
                await prisma.screenshot.update({
                    where: { id: existingScreenshot.id },
                    data: {
                        filePath: savePath,
                        fileSize: req.file.size,
                        updatedAt: new Date()
                    }
                });
                dbRecord = existingScreenshot.id;
            }
        } catch (dbError) {
            // DB update not critical for bulk upload
            console.warn('DB update skipped:', dbError);
        }

        res.json({
            success: true,
            path: savePath,
            size: req.file.size,
            dbRecord
        });

    } catch (error) {
        console.error('Bulk upload error:', error);
        res.status(500).json({
            error: 'Upload failed',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

/**
 * GET /api/bulk-upload/stats
 * Get upload statistics
 */
router.get('/stats', async (req, res) => {
    try {
        const uploadsDir = path.join(process.cwd(), 'uploads', 'screenshots');

        // Count files recursively
        let fileCount = 0;
        async function countFiles(dir: string) {
            const items = await fs.readdir(dir, { withFileTypes: true });
            for (const item of items) {
                const fullPath = path.join(dir, item.name);
                if (item.isDirectory()) {
                    await countFiles(fullPath);
                } else if (/\.(png|jpg|jpeg|webp)$/i.test(item.name)) {
                    fileCount++;
                }
            }
        }

        try {
            await countFiles(uploadsDir);
        } catch (error) {
            // Directory might not exist yet
        }

        res.json({
            filesInVolume: fileCount,
            volumePath: uploadsDir
        });

    } catch (error) {
        res.status(500).json({ error: 'Failed to get stats' });
    }
});

export default router;
