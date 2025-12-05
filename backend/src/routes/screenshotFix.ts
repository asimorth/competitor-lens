import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import fs from 'fs/promises';
import path from 'path';

const router = Router();
const prisma = new PrismaClient();

/**
 * POST /api/screenshots/fix-paths
 * Scans volume and updates database paths to match actual file locations
 */
router.post('/fix-paths', async (req, res) => {
    try {
        const uploadsDir = path.join(process.cwd(), 'uploads', 'screenshots');

        // Build a map of fileName -> actual file path
        const fileMap = new Map<string, string>();

        async function scanDir(dir: string, relativePath = '') {
            const items = await fs.readdir(dir);
            for (const item of items) {
                const fullPath = path.join(dir, item);
                const relPath = relativePath ? path.join(relativePath, item) : item;
                const stat = await fs.stat(fullPath);

                if (stat.isDirectory()) {
                    await scanDir(fullPath, relPath);
                } else if (/\.(png|jpg|jpeg|webp)$/i.test(item)) {
                    // Store: fileName -> full path (for database)
                    fileMap.set(item, path.join('/app/uploads/screenshots', relPath));
                }
            }
        }

        await scanDir(uploadsDir);

        console.log(`Found ${fileMap.size} files in volume`);

        // Update all screenshot records
        let updated = 0;
        let notFoundInVolume = 0;
        let alreadyCorrect = 0;

        const allScreenshots = await prisma.screenshot.findMany({
            select: { id: true, fileName: true, filePath: true }
        });

        for (const screenshot of allScreenshots) {
            if (!screenshot.fileName) {
                continue;
            }

            const actualPath = fileMap.get(screenshot.fileName);

            if (actualPath) {
                if (screenshot.filePath !== actualPath) {
                    await prisma.screenshot.update({
                        where: { id: screenshot.id },
                        data: { filePath: actualPath }
                    });
                    updated++;
                } else {
                    alreadyCorrect++;
                }
            } else {
                notFoundInVolume++;
            }
        }

        res.json({
            success: true,
            filesInVolume: fileMap.size,
            totalScreenshots: allScreenshots.length,
            updated,
            alreadyCorrect,
            notFoundInVolume
        });

    } catch (error) {
        console.error('Fix paths error:', error);
        res.status(500).json({
            error: 'Fix failed',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

export default router;
