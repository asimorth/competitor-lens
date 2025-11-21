#!/usr/bin/env tsx

/**
 * Sync Matrix Excel to Database
 * 
 * Reads feature_matrix_FINAL_v3.xlsx and syncs to production database:
 * - Adds missing competitors (TR exchanges)
 * - Adds missing features
 * - Updates all competitor-feature relationships
 * - Sets region field for each competitor
 */

import { PrismaClient } from '@prisma/client';
import * as XLSX from 'xlsx';
import * as path from 'path';

const prisma = new PrismaClient();

const MATRIX_FILE = path.join(__dirname, '../../Matrix/feature_matrix_FINAL_v3.xlsx');

// TR Exchange names (from Excel)
const TR_EXCHANGES = new Set([
    'BinanceTR',
    'Binance TR',
    'Paribu',
    'BTCTurk',
    'BTC Turk',
    'Bitexen',
    'Icrypex',
    'CoinTR',
    'Coin TR',
    'KucoinTR',
    'Kucoin TR',
    'OKX TR',
    'BiLira',
    'Ortak App',
    'Garanti Kripto',
    'GateTR',
    'Gate TR',
    'Midas Kripto',
    'BybitTR',
    'Bybit TR',
    'Kuantist'
]);

function getRegion(competitorName: string): string {
    if (TR_EXCHANGES.has(competitorName)) {
        return 'TR';
    }
    if (competitorName.toLowerCase().includes('tr') || competitorName.toLowerCase().includes('turk')) {
        return 'TR';
    }
    return 'Global';
}

async function syncMatrixToDatabase() {
    console.log('📊 Syncing Matrix Excel to Database...\n');
    console.log(`Reading: ${MATRIX_FILE}\n`);

    // Read Excel file
    const workbook = XLSX.readFile(MATRIX_FILE);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');

    console.log(`📋 Matrix size: ${range.e.r} rows × ${range.e.c + 1} columns\n`);

    // Extract competitors (column A, starting from row 2)
    const competitorNames: string[] = [];
    for (let row = 1; row <= range.e.r; row++) {
        const cellAddress = XLSX.utils.encode_cell({ r: row, c: 0 });
        const cell = worksheet[cellAddress];
        if (cell && cell.v) {
            competitorNames.push(String(cell.v).trim());
        }
    }

    console.log(`Found ${competitorNames.length} competitors in Excel:`);
    competitorNames.forEach((name, i) => {
        const region = getRegion(name);
        console.log(`  ${i + 1}. ${name} [${region}]`);
    });

    // Extract features (row 1, starting from column B)
    const featureNames: string[] = [];
    for (let col = 1; col <= range.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
        const cell = worksheet[cellAddress];
        if (cell && cell.v) {
            featureNames.push(String(cell.v).trim());
        }
    }

    console.log(`\nFound ${featureNames.length} features in Excel\n`);

    // Sync competitors
    console.log('🔄 Syncing competitors...');
    const competitorMap = new Map<string, string>(); // name -> id

    for (const name of competitorNames) {
        const region = getRegion(name);

        let competitor = await prisma.competitor.findUnique({
            where: { name }
        });

        if (!competitor) {
            console.log(`  ➕ Creating: ${name} [${region}]`);
            competitor = await prisma.competitor.create({
                data: {
                    name,
                    region
                }
            });
        } else {
            console.log(`  ✓ Exists: ${name} [${region}]`);
            // Update region if not set
            if (!competitor.region) {
                await prisma.competitor.update({
                    where: { id: competitor.id },
                    data: { region }
                });
            }
        }

        competitorMap.set(name, competitor.id);
    }

    // Sync features
    console.log('\n🔄 Syncing features...');
    const featureMap = new Map<string, string>(); // name -> id

    for (const name of featureNames) {
        let feature = await prisma.feature.findUnique({
            where: { name }
        });

        if (!feature) {
            console.log(`  ➕ Creating: ${name}`);
            feature = await prisma.feature.create({
                data: { name }
            });
        } else {
            console.log(`  ✓ Exists: ${name}`);
        }

        featureMap.set(name, feature.id);
    }

    // Sync competitor-feature relationships
    console.log('\n🔄 Syncing competitor-feature matrix...');
    let created = 0;
    let updated = 0;

    for (let row = 1; row <= range.e.r; row++) {
        const competitorCellAddress = XLSX.utils.encode_cell({ r: row, c: 0 });
        const competitorCell = worksheet[competitorCellAddress];
        if (!competitorCell || !competitorCell.v) continue;

        const competitorName = String(competitorCell.v).trim();
        const competitorId = competitorMap.get(competitorName);
        if (!competitorId) continue;

        for (let col = 1; col <= range.e.c; col++) {
            const featureCellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
            const featureCell = worksheet[featureCellAddress];
            if (!featureCell || !featureCell.v) continue;

            const featureName = String(featureCell.v).trim();
            const featureId = featureMap.get(featureName);
            if (!featureId) continue;

            // Get cell value (0 or 1, or quality rating)
            const valueCellAddress = XLSX.utils.encode_cell({ r: row, c: col });
            const valueCell = worksheet[valueCellAddress];
            const cellValue = valueCell ? String(valueCell.v).trim().toLowerCase() : '';

            // Determine hasFeature and quality
            let hasFeature = false;
            let quality = 'none';

            if (cellValue === '1' || cellValue === 'yes' || cellValue === 'true') {
                hasFeature = true;
                quality = 'basic';
            } else if (cellValue === 'excellent' || cellValue === 'good' || cellValue === 'basic') {
                hasFeature = true;
                quality = cellValue;
            }

            // Create or update
            const existing = await prisma.competitorFeature.findUnique({
                where: {
                    competitorId_featureId: {
                        competitorId,
                        featureId
                    }
                }
            });

            if (!existing) {
                await prisma.competitorFeature.create({
                    data: {
                        competitorId,
                        featureId,
                        hasFeature,
                        implementationQuality: quality
                    }
                });
                created++;
            } else {
                await prisma.competitorFeature.update({
                    where: { id: existing.id },
                    data: {
                        hasFeature,
                        implementationQuality: quality
                    }
                });
                updated++;
            }
        }
    }

    console.log(`\n✅ Matrix sync complete!`);
    console.log(`   Created ${created} new relationships`);
    console.log(`   Updated ${updated} existing relationships\n`);

    // Summary
    const totalCompetitors = await prisma.competitor.count();
    const totalFeatures = await prisma.feature.count();
    const totalRelations = await prisma.competitorFeature.count();
    const trCompetitors = await prisma.competitor.count({
        where: { region: 'TR' }
    });
    const globalCompetitors = await prisma.competitor.count({
        where: { region: 'Global' }
    });

    console.log('📊 Database Summary:');
    console.log(`   Total Competitors: ${totalCompetitors}`);
    console.log(`     - TR: ${trCompetitors}`);
    console.log(`     - Global: ${globalCompetitors}`);
    console.log(`   Total Features: ${totalFeatures}`);
    console.log(`   Total Relations: ${totalRelations}\n`);
}

syncMatrixToDatabase()
    .catch((error) => {
        console.error('❌ Error syncing matrix:', error);
        process.exit(1);
    })
    .finally(() => {
        prisma.$disconnect();
    });
