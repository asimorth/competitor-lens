#!/usr/bin/env node

/**
 * Sync Filesystem to Database
 * Scans /app/uploads/screenshots and updates database filePath to match actual files
 */

const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function syncFilesystemToDatabase() {
    console.log('🔄 Syncing filesystem to database...\n');

    const uploadsDir = path.join(process.cwd(), 'uploads', 'screenshots');

    if (!fs.existsSync(uploadsDir)) {
        console.error('❌ Uploads directory not found:', uploadsDir);
        process.exit(1);
    }

    // Scan all files in volume
    const filesInVolume = [];

    function scanDir(dir, relativePath = '') {
        const items = fs.readdirSync(dir);
        for (const item of items) {
            const fullPath = path.join(dir, item);
            const relPath = relativePath ? path.join(relativePath, item) : item;
            const stat = fs.statSync(fullPath);

            if (stat.isDirectory()) {
                scanDir(fullPath, relPath);
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

    scanDir(uploadsDir);

    console.log(`📁 Found ${filesInVolume.length} files in volume\n`);

    // Update database records
    let updated = 0;
    let notFound = 0;

    for (const file of filesInVolume) {
        try {
            // Find screenshot by fileName
            const screenshot = await prisma.screenshot.findFirst({
                where: { fileName: file.fileName }
            });

            if (screenshot) {
                // Update path to match filesystem
                await prisma.screenshot.update({
                    where: { id: screenshot.id },
                    data: {
                        filePath: file.fullPath,
                        fileSize: file.size
                    }
                });
                updated++;
                console.log(`✅ Updated: ${file.fileName}`);
            } else {
                notFound++;
                console.log(`⚠️  No DB record: ${file.fileName}`);
            }
        } catch (error) {
            console.error(`❌ Error updating ${file.fileName}:`, error.message);
        }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 Sync Complete');
    console.log(`✅ Updated: ${updated}`);
    console.log(`⚠️  Not found in DB: ${notFound}`);
    console.log('='.repeat(60));

    await prisma.$disconnect();
}

syncFilesystemToDatabase().catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
});
