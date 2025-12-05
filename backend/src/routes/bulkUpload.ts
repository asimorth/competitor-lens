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

/**
 * POST /api/bulk-upload/fix-paths
 * Updates database paths to match volume structure (removes subdirectories)
 */
router.post('/fix-paths', async (req, res) => {
    try {
        const uploadsDir = path.join(process.cwd(), 'uploads', 'screenshots');

        // Build map: fileName -> actualPath
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
                    fileMap.set(item, path.join('/app/uploads/screenshots', relPath));
                }
            }
        }

        await scanDir(uploadsDir);

        // Update all screenshot paths
        let updated = 0;
        let alreadyCorrect = 0;
        let notFoundInVolume = 0;

        const allScreenshots = await prisma.screenshot.findMany({
            select: { id: true, fileName: true, filePath: true }
        });

        for (const screenshot of allScreenshots) {
            if (!screenshot.fileName) continue;

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
