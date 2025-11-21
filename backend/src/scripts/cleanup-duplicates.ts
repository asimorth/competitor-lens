#!/usr/bin/env tsx

/**
 * Cleanup Duplicate Competitors Script
 * 
 * Purpose: Merge duplicate competitors in the database
 * - Binance + Binance Global → Binance Global
 * - BinanceTR + Binance TR → Binance TR
 * 
 * Safe: Preserves all relationships and data
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface DuplicateSet {
    keep: string;
    remove: string[];
    reason: string;
}

const DUPLICATES: DuplicateSet[] = [
    {
        keep: 'Binance Global',
        remove: ['Binance'],
        reason: 'Global version is more complete'
    },
    {
        keep: 'Binance TR',
        remove: ['BinanceTR'],
        reason: 'Standardize naming with space'
    }
];

async function cleanupDuplicates() {
    console.log('🧹 Cleaning up duplicate competitors...\n');

    for (const duplicateSet of DUPLICATES) {
        console.log(`\n📦 Processing: ${duplicateSet.keep}`);
        console.log(`   Reason: ${duplicateSet.reason}`);

        // Find the competitor to keep
        const keepCompetitor = await prisma.competitor.findUnique({
            where: { name: duplicateSet.keep },
            include: {
                features: true,
                screenshots: true,
                onboardingScreenshots: true
            }
        });

        if (!keepCompetitor) {
            console.log(`   ⚠️  Keeper "${duplicateSet.keep}" not found, skipping`);
            continue;
        }

        console.log(`   ✅ Found keeper: ${keepCompetitor.name} (${keepCompetitor.id})`);

        for (const removeName of duplicateSet.remove) {
            const removeCompetitor = await prisma.competitor.findUnique({
                where: { name: removeName },
                include: {
                    features: true,
                    screenshots: true,
                    onboardingScreenshots: true
                }
            });

            if (!removeCompetitor) {
                console.log(`   ℹ️  Duplicate "${removeName}" not found, already clean`);
                continue;
            }

            console.log(`   ⚙️  Merging "${removeName}" into "${duplicateSet.keep}"...`);

            // Migrate competitor features
            if (removeCompetitor.features.length > 0) {
                console.log(`      - Moving ${removeCompetitor.features.length} feature relations...`);
                for (const feature of removeCompetitor.features) {
                    // Check if keeper already has this feature
                    const existing = await prisma.competitorFeature.findUnique({
                        where: {
                            competitorId_featureId: {
                                competitorId: keepCompetitor.id,
                                featureId: feature.featureId
                            }
                        }
                    });

                    if (!existing) {
                        // Update to point to keeper
                        await prisma.competitorFeature.update({
                            where: { id: feature.id },
                            data: { competitorId: keepCompetitor.id }
                        });
                    } else {
                        // Delete duplicate relation
                        await prisma.competitorFeature.delete({
                            where: { id: feature.id }
                        });
                    }
                }
            }

            // Migrate screenshots
            if (removeCompetitor.screenshots.length > 0) {
                console.log(`      - Moving ${removeCompetitor.screenshots.length} screenshots...`);
                await prisma.screenshot.updateMany({
                    where: { competitorId: removeCompetitor.id },
                    data: { competitorId: keepCompetitor.id }
                });
            }

            // Migrate onboarding screenshots
            if (removeCompetitor.onboardingScreenshots.length > 0) {
                console.log(`      - Moving ${removeCompetitor.onboardingScreenshots.length} onboarding screenshots...`);
                await prisma.onboardingScreenshot.updateMany({
                    where: { competitorId: removeCompetitor.id },
                    data: { competitorId: keepCompetitor.id }
                });
            }

            // Delete the duplicate competitor
            console.log(`      - Deleting duplicate "${removeName}"...`);
            await prisma.competitor.delete({
                where: { id: removeCompetitor.id }
            });

            console.log(`   ✅ Successfully merged "${removeName}"`);
        }
    }

    console.log('\n✅ Duplicate cleanup complete!\n');

    // Show final competitor list
    const competitors = await prisma.competitor.findMany({
        orderBy: { name: 'asc' }
    });

    console.log(`📊 Total competitors after cleanup: ${competitors.length}\n`);
    console.log('Competitors:');
    competitors.forEach((c, i) => {
        console.log(`  ${i + 1}. ${c.name}`);
    });
}

cleanupDuplicates()
    .catch((error) => {
        console.error('❌ Error during cleanup:', error);
        process.exit(1);
    })
    .finally(() => {
        prisma.$disconnect();
    });
