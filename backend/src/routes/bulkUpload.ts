import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import fs from 'fs/promises';
import path from 'path';

const router = Router();
const prisma = new PrismaClient();

/**
 * POST /api/bulk-upload/sync-filesystem
 * Scans filesystem and updates database paths to match reality
 */
router.post('/sync-filesystem', async (req, res) => {
    try {
        const uploadsDir = path.join(process.cwd(), 'uploads', 'screenshots');

        // Scan all files
        const filesInVolume: Array<{ fileName: string, relativePath: string, fullPath: string, size: number }> = [];

        async function scanDir(dir: string, relativePath = '') {
            const items = await fs.readdir(dir);
            for (const item of items) {
                const fullPath = path.join(dir, item);
                const relPath = relativePath ? path.join(relativePath, item) : item;
                const stat = await fs.stat(fullPath);

                if (stat.isDirectory()) {
                    await scanDir(fullPath, relPath);
                } else if (/\.(png|jpg|jpeg|webp)$/i.test(item)) {
                    filesInVolume.push({
                        fileName: item,
                        relativePath: relPath,
                        fullPath: path.join('/app/uploads/screenshots', relPath),
                        size: stat.size
                    });
                }
            }
        }

        await scanDir(uploadsDir);

        // Update database
        let updated = 0;
        let notFound = 0;

        for (const file of filesInVolume) {
            const screenshot = await prisma.screenshot.findFirst({
                where: { fileName: file.fileName }
            });

            if (screenshot) {
                await prisma.screenshot.update({
                    where: { id: screenshot.id },
                    data: {
                        filePath: file.fullPath,
                        fileSize: file.size
                    }
                });
                updated++;
            } else {
                notFound++;
            }
        }

        res.json({
            success: true,
            filesScanned: filesInVolume.length,
            updated,
            notFound
        });

    } catch (error) {
        console.error('Sync error:', error);
        res.status(500).json({
            error: 'Sync failed',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

export default router;
