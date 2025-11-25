import { PrismaClient } from '@prisma/client';
import * as XLSX from 'xlsx';
import * as path from 'path';

const prisma = new PrismaClient();

// Universal features - all exchanges should have these
const UNIVERSAL_FEATURES = [
    'KYC & Identity Verification',
    'User Onboarding',
    'Mobile App',
    'Web App',
    'Spot Trading',
    'Convert'
];

export interface StablexFeatureStatus {
    name: string;
    category?: string;
    status: 'HAS' | 'NO' | 'EVIDENCE' | 'ASSUMED';
    confidence: 'high' | 'medium' | 'low';
    source: 'excel' | 'screenshot' | 'assumption';
    screenshotCount: number;
    reason?: string;
}

/**
 * Read Stablex feature data from Excel matrix
 */
function getStablexDataFromExcel(): Record<string, boolean> {
    try {
        const excelPath = path.join(process.cwd(), 'Matrix', 'feature_matrix_FINAL_v3.xlsx');
        const workbook = XLSX.readFile(excelPath);
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as unknown[][];

        if (data.length < 2) {
            console.warn('Excel file has insufficient data');
            return {};
        }

        // Find Stablex row
        const headers = data[0] as string[];
        const stablexRow = data.find(row => (row as string[])[0] === 'Stablex');

        if (!stablexRow) {
            console.warn('Stablex not found in Excel');
            return {};
        }

        // Map features to boolean
        const featureMap: Record<string, boolean> = {};
        const features = headers.slice(2, -1); // Skip name, region, coverage columns

        features.forEach((featureName, index) => {
            const cellValue = (stablexRow as any[])[index + 2];
            const hasFeature = checkHasFeature(cellValue);
            featureMap[featureName] = hasFeature;
        });

        return featureMap;
    } catch (error) {
        console.error('Error reading Excel data:', error);
        return {};
    }
}

/**
 * Check if a cell value means "has feature"
 */
function checkHasFeature(value: any): boolean {
    if (!value) return false;
    const valueStr = value.toString().trim().toLowerCase();
    const yesValues = ['var', 'yes', 'true', 'x', '✓', '✔', 'v', '1'];
    return yesValues.includes(valueStr);
}

/**
 * Get comprehensive Stablex feature analysis
 */
export async function analyzeStablexFeatures(): Promise<StablexFeatureStatus[]> {
    // 1. Get all features from database
    const allFeatures = await prisma.feature.findMany({
        include: {
            _count: {
                select: {
                    screenshots: true
                }
            }
        }
    });

    // 2. Get Stablex data from Excel
    const excelData = getStablexDataFromExcel();

    // 3. Get screenshot evidence for Stablex
    const stablex = await prisma.competitor.findUnique({
        where: { name: 'Stablex' },
        include: {
            screenshots: {
                include: {
                    feature: {
                        select: { id: true, name: true }
                    }
                }
            }
        }
    });

    // Count screenshots by feature
    const screenshotsByFeature: Record<string, number> = {};
    stablex?.screenshots.forEach(s => {
        if (s.featureId) {
            const featureName = s.feature?.name || '';
            screenshotsByFeature[featureName] = (screenshotsByFeature[featureName] || 0) + 1;
        }
    });

    // 4. Analyze each feature
    const analysis: StablexFeatureStatus[] = allFeatures.map(feature => {
        const excelHasFeature = excelData[feature.name];
        const screenshotCount = screenshotsByFeature[feature.name] || 0;
        const isUniversal = UNIVERSAL_FEATURES.includes(feature.name);

        // Decision logic (priority order):

        // 1. Excel says "HAS" → definitive HAS
        if (excelHasFeature === true) {
            return {
                name: feature.name,
                category: feature.category || undefined,
                status: 'HAS',
                confidence: 'high',
                source: 'excel',
                screenshotCount,
                reason: 'Confirmed in feature matrix'
            };
        }

        // 2. Screenshot evidence exists → EVIDENCE
        if (screenshotCount > 0) {
            return {
                name: feature.name,
                category: feature.category || undefined,
                status: 'EVIDENCE',
                confidence: 'high',
                source: 'screenshot',
                screenshotCount,
                reason: `${screenshotCount} screenshot(s) found`
            };
        }

        // 3. Universal feature (expected in all exchanges) → ASSUMED
        if (isUniversal) {
            return {
                name: feature.name,
                category: feature.category || undefined,
                status: 'ASSUMED',
                confidence: 'medium',
                source: 'assumption',
                screenshotCount: 0,
                reason: 'Universal feature - expected in all exchanges'
            };
        }

        // 4. Excel says "NO" or no data → NO
        return {
            name: feature.name,
            category: feature.category || undefined,
            status: 'NO',
            confidence: excelHasFeature === false ? 'high' : 'low',
            source: 'excel',
            screenshotCount: 0,
            reason: excelHasFeature === false ? 'Not listed in feature matrix' : 'No data available'
        };
    });

    return analysis;
}

/**
 * Get smart comparison: Stablex vs TR Competitors
 */
export async function compareStablexVsTR() {
    const [stablexAnalysis, trCompetitors, allFeatures] = await Promise.all([
        analyzeStablexFeatures(),
        prisma.competitor.findMany({
            where: {
                // TR competitors - match by description or hardcode names
                OR: [
                    { name: { in: ['BTCTurk', 'BinanceTR', 'Paribu', 'Bitexen'] } }
                ]
            },
            include: {
                features: {
                    include: {
                        feature: true
                    }
                },
                _count: {
                    select: {
                        screenshots: true
                    }
                }
            }
        }),
        prisma.feature.findMany()
    ]);

    return {
        stablex: stablexAnalysis,
        trCompetitors,
        allFeatures
    };
}
