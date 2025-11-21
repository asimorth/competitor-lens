#!/usr/bin/env tsx

/**
 * Sync Local Screenshots to Database
 * 
 * Scans uploads/screenshots directory and creates Screenshot records
 * - Detects onboarding vs feature screenshots
 * - Links to correct competitor
 * - Sets metadata (file size, dimensions, etc.)
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import * as mime from 'mime-types';

const prisma = new PrismaClient();

const SCREENSHOTS_DIR = path.join(__dirname, '../../uploads/screenshots');

interface ScreenshotFile {
    competitorName: string;
    filePath: string;
    fileName: string;
    isOnboarding: boolean;
    fullPath: string;
}

async function scanScreenshots(): Promise<ScreenshotFile[]> {
    const screenshots: ScreenshotFile[] = [];

    if (!fs.existsSync(SCREENSHOTS_DIR)) {
        console.log(`⚠️  Screenshots directory not found: ${SCREENSHOTS_DIR}`);
        return screenshots;
    }

    const competitorDirs = fs.readdirSync(SCREENSHOTS_DIR, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);

    for (const competitorName of competitorDirs) {
        const competitorDir = path.join(SCREENSHOTS_DIR, competitorName);

        // Scan main directory
        const files = fs.readdirSync(competitorDir, { withFileTypes: true });

        for (const file of files) {
            if (file.isFile() && isImageFile(file.name)) {
                screenshots.push({
                    competitorName,
                    filePath: path.join('uploads', 'screenshots', competitorName, file.name),
                    fileName: file.name,
                    isOnboarding: false,
                    fullPath: path.join(competitorDir, file.name)
                });
            }
        }

        // Check for onboarding subdirectory
        const onboardingDir = path.join(competitorDir, 'onboarding');
        if (fs.existsSync(onboardingDir)) {
            const onboardingFiles = fs.readdirSync(onboardingDir, { withFileTypes: true })
                .filter(file => file.isFile() && isImageFile(file.name));

            for (const file of onboardingFiles) {
                screenshots.push({
                    competitorName,
                    filePath: path.join('uploads', 'screenshots', competitorName, 'onboarding', file.name),
                    fileName: file.name,
                    isOnboarding: true,
                    fullPath: path.join(onboardingDir, file.name)
                });
            }
        }
    }

    return screenshots;
}

function isImageFile(filename: string): boolean {
    const ext = path.extname(filename).toLowerCase();
    return ['.png', '.jpg', '.jpeg', '.gif', '.webp'].includes(ext);
}

function getFileSize(filePath: string): bigint {
    try {
        const stats = fs.statSync(filePath);
        return BigInt(stats.size);
    } catch {
        return BigInt(0);
    }
}

function getMimeType(filename: string): string {
    return mime.lookup(filename) || 'image/png';
}

async function syncScreenshotsToDatabase() {
    console.log('📸 Syncing Local Screenshots to Database...\n');

    // Scan all screenshots
    const screenshots = await scanScreenshots();
    console.log(`Found ${screenshots.length} screenshots in local directory\n`);

    // Group by competitor
    const byCompetitor = new Map<string, ScreenshotFile[]>();
    screenshots.forEach(s => {
        if (!byCompetitor.has(s.competitorName)) {
            byCompetitor.set(s.competitorName, []);
        }
        byCompetitor.get(s.competitorName)!.push(s);
    });

    console.log('📊 Screenshots by competitor:');
    byCompetitor.forEach((files, name) => {
        const onboardingCount = files.filter(f => f.isOnboarding).length;
        const featureCount = files.length - onboardingCount;
        console.log(`  ${name}: ${files.length} total (${featureCount} feature, ${onboardingCount} onboarding)`);
    });

    // Get all competitors from database
    const competitors = await prisma.competitor.findMany();
    const competitorMap = new Map<string, string>(); // name -> id

    competitors.forEach(c => {
        competitorMap.set(c.name, c.id);
        // Also map common variations
        if (c.name === 'BTCTurk') {
            competitorMap.set('BTC Turk', c.id);
        }
        if (c.name === 'Binance TR') {
            competitorMap.set('Binance TR', c.id);
        }
        if (c.name === 'OKX TR') {
            competitorMap.set('OKX TR', c.id);
        }
        if (c.name === 'Garanti Kripto') {
            competitorMap.set('Garanti Kripto', c.id);
        }
    });

    console.log('\n🔄 Creating screenshot records...');
    let created = 0;
    let skipped = 0;

    for (const screenshot of screenshots) {
        const competitorId = competitorMap.get(screenshot.competitorName);

        if (!competitorId) {
            console.log(`  ⚠️  Competitor not found: ${screenshot.competitorName}, skipping screenshot`);
            skipped++;
            continue;
        }

        // Check if screenshot already exists
        const existing = await prisma.screenshot.findFirst({
            where: {
                competitorId,
                filePath: screenshot.filePath
            }
        });

        if (existing) {
            skipped++;
            continue;
        }

        // Create screenshot record
        await prisma.screenshot.create({
            data: {
                competitorId,
                filePath: screenshot.filePath,
                fileName: screenshot.fileName,
                fileSize: getFileSize(screenshot.fullPath),
                mimeType: getMimeType(screenshot.fileName),
                isOnboarding: screenshot.isOnboarding,
                uploadSource: 'auto-scan'
            }
        });

        created++;

        if (created % 50 === 0) {
            console.log(`  ... created ${created} records`);
        }
    }

    console.log(`\n✅ Screenshot sync complete!`);
    console.log(`   Created: ${created}`);
    console.log(`   Skipped (already exist): ${skipped}\n`);

    // Summary
    const totalScreenshots = await prisma.screenshot.count();
    const onboardingScreenshots = await prisma.screenshot.count({
        where: { isOnboarding: true }
    });
    const featureScreenshots = totalScreenshots - onboardingScreenshots;

    console.log('📊 Database Summary:');
    console.log(`   Total Screenshots: ${totalScreenshots}`);
    console.log(`     - Feature Screenshots: ${featureScreenshots}`);
    console.log(`     - Onboarding/KYC: ${onboardingScreenshots}\n`);

    // Show competitors with KYC flows
    const competitorsWithKYC = await prisma.competitor.findMany({
        where: {
            screenshots: {
                some: {
                    isOnboarding: true
                }
            }
        },
        include: {
            _count: {
                select: {
                    screenshots: {
                        where: { isOnboarding: true }
                    }
                }
            }
        }
    });

    if (competitorsWithKYC.length > 0) {
        console.log('🎯 Competitors with KYC Flows:');
        competitorsWithKYC.forEach(c => {
            console.log(`   ${c.name}: ${c._count.screenshots} onboarding screenshots`);
        });
        console.log();
    }
}

syncScreenshotsToDatabase()
    .catch((error) => {
        console.error('❌ Error syncing screenshots:', error);
        process.exit(1);
    })
    .finally(() => {
        prisma.$disconnect();
    });
