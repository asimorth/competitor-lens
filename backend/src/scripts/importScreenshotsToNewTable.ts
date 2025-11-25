import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

const prisma = new PrismaClient();

// Image file check
function isImageFile(filename: string): boolean {
    const ext = path.extname(filename).toLowerCase();
    return ['.png', '.jpg', '.jpeg', '.webp', '.gif'].includes(ext);
}

// Competitor name normalization
function normalizeCompetitorName(name: string): string {
    const mapping: Record<string, string> = {
        'Binance TR': 'BinanceTR',
        'Binance Global': 'Binance Global',
        'BTC Turk': 'BTCTurk',
        'Garanti Kripto': 'Garanti Kripto',
        'OKX TR': 'OKX TR',
    };

    return mapping[name] || name;
}

// Get file metadata
async function getFileMetadata(filePath: string) {
    const stats = fs.statSync(filePath);
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes: Record<string, string> = {
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.webp': 'image/webp',
        '.gif': 'image/gif'
    };

    return {
        fileSize: BigInt(stats.size),
        mimeType: mimeTypes[ext] || 'image/jpeg'
    };
}

// Smart feature detection from filename/path
function detectFeatureFromPath(filePath: string, filename: string, competitorFeatures: any[]): string | null {
    const lowercasePath = filePath.toLowerCase();
    const lowercaseFilename = filename.toLowerCase();

    // Feature keywords mapping
    const featureKeywords: Record<string, string[]> = {
        'onboarding': ['onboarding', 'kayıt', 'register', 'signup', 'sign-up'],
        'kyc': ['kyc', 'identity', 'kimlik', 'doğrulama', 'verification'],
        'mobile app': ['mobile', 'app', 'mobil'],
        'web app': ['web', 'desktop', 'browser'],
        'trading': ['trading', 'trade', 'alım', 'satım', 'spot'],
        'convert': ['convert', 'swap', 'exchange', 'çevir'],
        'staking': ['staking', 'earn', 'stake'],
        'wallet': ['wallet', 'cüzdan'],
        'dashboard': ['dashboard', 'ana', 'home', 'main'],
    };

    // Try to match keywords
    for (const [featureName, keywords] of Object.entries(featureKeywords)) {
        for (const keyword of keywords) {
            if (lowercasePath.includes(keyword) || lowercaseFilename.includes(keyword)) {
                // Find matching feature in competitor features
                const match = competitorFeatures.find(cf =>
                    cf.feature.name.toLowerCase().includes(featureName.toLowerCase())
                );
                if (match) {
                    return match.feature.id;
                }
            }
        }
    }

    return null;
}

async function importScreenshotsToDatabase(competitorPath: string, competitor: any) {
    let totalAdded = 0;

    // Get all features for this competitor
    const competitorFeatures = await prisma.competitorFeature.findMany({
        where: {
            competitorId: competitor.id,
            hasFeature: true
        },
        include: {
            feature: true
        }
    });

    if (competitorFeatures.length === 0) {
        console.log(`   ⚠️  No features found for ${competitor.name}`);
        return 0;
    }

    console.log(`   📋 Found ${competitorFeatures.length} features`);

    // Default feature (use first available)
    const defaultFeature = competitorFeatures.find(cf =>
        cf.feature.name.includes('Mobile App') || cf.feature.name.includes('Web App')
    ) || competitorFeatures[0];

    async function scanDirectory(currentPath: string, level: number = 0) {
        const entries = fs.readdirSync(currentPath, { withFileTypes: true });

        for (const entry of entries) {
            const fullPath = path.join(currentPath, entry.name);

            if (entry.isFile() && isImageFile(entry.name)) {
                try {
                    const relativePath = path.relative(process.cwd(), fullPath);

                    // Check if already exists
                    const existing = await prisma.screenshot.findFirst({
                        where: {
                            competitorId: competitor.id,
                            filePath: relativePath
                        }
                    });

                    if (!existing) {
                        const metadata = await getFileMetadata(fullPath);

                        // Smart feature detection
                        const detectedFeatureId = detectFeatureFromPath(
                            fullPath,
                            entry.name,
                            competitorFeatures
                        );

                        const featureId = detectedFeatureId || defaultFeature.feature.id;

                        // Check if this is onboarding
                        const isOnboarding = fullPath.toLowerCase().includes('onboarding') ||
                            fullPath.toLowerCase().includes('kayıt');

                        await prisma.screenshot.create({
                            data: {
                                competitorId: competitor.id,
                                featureId,
                                filePath: relativePath,
                                fileName: entry.name,
                                fileSize: metadata.fileSize,
                                mimeType: metadata.mimeType,
                                isOnboarding,
                                uploadSource: 'auto-scan'
                            }
                        });

                        totalAdded++;

                        if (totalAdded % 20 === 0) {
                            console.log(`      ✅ Imported ${totalAdded} screenshots...`);
                        }
                    }
                } catch (error: any) {
                    console.error(`      ❌ Error: ${entry.name}: ${error.message}`);
                }
            } else if (entry.isDirectory() && !entry.name.startsWith('.') && level < 3) {
                await scanDirectory(fullPath, level + 1);
            }
        }
    }

    await scanDirectory(competitorPath);
    return totalAdded;
}

async function main() {
    console.log('📸 Importing Screenshots to NEW Screenshot Table...\\n');

    try {
        const uploadsDir = path.join(process.cwd(), 'uploads', 'screenshots');

        if (!fs.existsSync(uploadsDir)) {
            console.log('❌ Screenshots directory not found!');
            return;
        }

        // Get competitor folders
        const competitorFolders = fs.readdirSync(uploadsDir, { withFileTypes: true })
            .filter(entry => entry.isDirectory() && !entry.name.startsWith('.'))
            .map(entry => entry.name);

        console.log(`📁 Found ${competitorFolders.length} competitor folders\\n`);

        let grandTotal = 0;

        for (const folderName of competitorFolders) {
            const competitorPath = path.join(uploadsDir, folderName);
            const competitorName = normalizeCompetitorName(folderName);

            console.log(`\\n🏢 Processing: ${folderName}`);

            // Find competitor
            const competitor = await prisma.competitor.findFirst({
                where: {
                    OR: [
                        { name: competitorName },
                        { name: { contains: folderName.split(' ')[0] } }
                    ]
                }
            });

            if (!competitor) {
                console.log(`   ❌ Competitor not found in database`);
                continue;
            }

            console.log(`   ✅ Found: ${competitor.name} (ID: ${competitor.id})`);

            // Import screenshots
            const count = await importScreenshotsToDatabase(competitorPath, competitor);
            console.log(`   📸 Total imported: ${count} screenshots`);
            grandTotal += count;
        }

        // Summary
        console.log('\\n' + '='.repeat(60));
        console.log('📊 Import Summary:');
        console.log(`   Total Screenshots Imported: ${grandTotal}`);

        // Database stats
        const totalInDB = await prisma.screenshot.count();
        const withFeature = await prisma.screenshot.count({
            where: { featureId: { not: null } }
        });
        const onboardingCount = await prisma.screenshot.count({
            where: { isOnboarding: true }
        });

        console.log(`\\n📈 Database Statistics:`);
        console.log(`   Total Screenshot Records: ${totalInDB}`);
        console.log(`   With Feature Mapping: ${withFeature}`);
        console.log(`   Onboarding Screenshots: ${onboardingCount}`);

        // By competitor
        const byCompetitor = await prisma.competitor.findMany({
            select: {
                name: true,
                _count: {
                    select: { screenshots: true }
                }
            },
            where: {
                screenshots: { some: {} }
            },
            orderBy: {
                name: 'asc'
            }
        });

        console.log(`\\n🏆 Screenshots by Competitor:`);
        byCompetitor.forEach(comp => {
            if (comp._count.screenshots > 0) {
                console.log(`   ${comp.name}: ${comp._count.screenshots} screenshots`);
            }
        });

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main().catch(console.error);
