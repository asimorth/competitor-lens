import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

/**
 * GET /api/stablex/positioning
 * Stablex'in rekabet konumlandırması
 */
router.get('/positioning', async (req, res) => {
    try {
        // Get all competitors and features
        const [competitors, features, stablexData] = await Promise.all([
            prisma.competitor.findMany({
                include: {
                    features: {
                        include: {
                            feature: true
                        }
                    }
                }
            }),
            prisma.feature.findMany(),
            // Stablex data from stablexAnalytics service
            import('../services/stablexAnalytics').then(m => m.analyzeStablexFeatures())
        ]);

        // TR competitors (name-based detection)
        const trNames = ['BTCTurk', 'BinanceTR', 'OKX TR', 'Garanti Kripto', 'Paribu',
            'Bitexen', 'GateTR', 'BiLira', 'Kuantist', 'BTC Türk', 'BybitTR'];
        const trCompetitors = competitors.filter(c =>
            trNames.some(name => c.name.includes(name))
        );

        // Calculate Stablex coverage
        const stablexFeatures = stablexData.filter((f: any) =>
            f.status === 'HAS' || f.status === 'EVIDENCE' || f.status === 'ASSUMED'
        );
        const stablexCoverage = (stablexFeatures.length / features.length) * 100;

        // Calculate TR average
        const trCoverages = trCompetitors.map(c => {
            const hasFeature = c.features?.filter(cf => cf.hasFeature).length || 0;
            return (hasFeature / features.length) * 100;
        });
        const trAverage = trCoverages.reduce((sum, cov) => sum + cov, 0) / trCoverages.length;

        // Calculate rank
        const allCoverages = [
            { name: 'Stablex', coverage: stablexCoverage },
            ...trCompetitors.map(c => ({
                name: c.name,
                coverage: ((c.features?.filter(cf => cf.hasFeature).length || 0) / features.length) * 100
            }))
        ].sort((a, b) => b.coverage - a.coverage);

        const stablexRank = allCoverages.findIndex(c => c.name === 'Stablex') + 1;
        const topCompetitors = allCoverages.slice(0, 5);

        // Unique features (only Stablex has)
        const uniqueFeatures = stablexData.filter((f: any) => {
            if (f.status !== 'HAS') return false;

            // Check if any TR competitor has this feature
            const competitorHas = trCompetitors.some(c =>
                c.features?.some(cf =>
                    cf.feature.name === f.name && cf.hasFeature
                )
            );

            return !competitorHas;
        });

        // Differentiators (Stablex has, but few others have)
        const differentiators = stablexData.filter((f: any) => {
            if (f.status !== 'HAS') return false;

            const competitorsWithFeature = trCompetitors.filter(c =>
                c.features?.some(cf =>
                    cf.feature.name === f.name && cf.hasFeature
                )
            ).length;

            // Feature exists in <25% of competitors
            return competitorsWithFeature > 0 && competitorsWithFeature < trCompetitors.length * 0.25;
        });

        res.json({
            success: true,
            data: {
                coverage: parseFloat(stablexCoverage.toFixed(1)),
                rank: stablexRank,
                totalCompetitors: trCompetitors.length,
                trAverage: parseFloat(trAverage.toFixed(1)),
                globalLeaders: 45, // Estimated from Binance/Coinbase/Kraken
                differenceFromAverage: parseFloat((stablexCoverage - trAverage).toFixed(1)),
                differenceFromLeaders: parseFloat((stablexCoverage - 45).toFixed(1)),
                topCompetitors: topCompetitors.map((c, idx) => ({
                    name: c.name,
                    coverage: parseFloat(c.coverage.toFixed(1)),
                    rank: idx + 1
                })),
                uniqueFeatures: uniqueFeatures.map((f: any) => ({
                    name: f.name,
                    reason: f.reason || 'Sadece Stablex\'te mevcut'
                })),
                differentiators: differentiators.map((f: any) => ({
                    name: f.name,
                    rarity: 'Yüksek',
                    competitorCount: trCompetitors.filter(c =>
                        c.features?.some(cf => cf.feature.name === f.name && cf.hasFeature)
                    ).length
                })),
                positioning: {
                    tag: 'Banka destekli, mobil-öncelikli, uyumluluk odaklı',
                    strengths: [
                        'Akbank entegrasyonu ile bankacılık ekosisteminde',
                        'Mobil-first kullanıcı deneyimi',
                        'Regülasyona hazır altyapı'
                    ],
                    opportunities: [
                        'TRY Nemalandırma ile OKX TR\'nin tek rakibi',
                        'Banka güvenilirliği leverage',
                        'Pre-regulation pozisyon avantajı'
                    ]
                }
            }
        });

    } catch (error) {
        console.error('Positioning analysis error:', error);
        res.status(500).json({
            success: false,
            error: 'Konum analizi başarısız',
            message: error instanceof Error ? error.message : 'Bilinmeyen hata'
        });
    }
});

/**
 * GET /api/stablex/gaps
 * Stablex'teki boşluklar ve öncelikler
 */
router.get('/gaps', async (req, res) => {
    try {
        const [competitors, features, stablexData] = await Promise.all([
            prisma.competitor.findMany({
                include: {
                    features: {
                        include: {
                            feature: true
                        }
                    }
                }
            }),
            prisma.feature.findMany(),
            import('../services/stablexAnalytics').then(m => m.analyzeStablexFeatures())
        ]);

        const trNames = ['BTCTurk', 'BinanceTR', 'OKX TR', 'Garanti Kripto', 'Paribu',
            'Bitexen', 'GateTR', 'BiLira', 'Kuantist', 'BTC Türk', 'BybitTR'];
        const trCompetitors = competitors.filter(c =>
            trNames.some(name => c.name.includes(name))
        );

        // Find missing features
        const missingFeatures = stablexData.filter((f: any) => f.status === 'NO');

        // Categorize by priority
        const gaps = missingFeatures.map((f: any) => {
            const feature = features.find(feat => feat.name === f.name);
            if (!feature) return null;

            // Count how many TR competitors have this
            const trCompetitorsWithFeature = trCompetitors.filter(c =>
                c.features?.some(cf => cf.feature.name === f.name && cf.hasFeature)
            );
            const trPenetration = (trCompetitorsWithFeature.length / trCompetitors.length) * 100;

            // Determine priority based on penetration and feature priority
            let urgency: 'critical' | 'high' | 'medium' | 'low' = 'low';
            let impact: 'high' | 'medium' | 'low' = 'low';

            if (trPenetration > 60) {
                urgency = 'critical'; // Most TR competitors have it
            } else if (trPenetration > 40) {
                urgency = 'high';
            } else if (trPenetration > 20) {
                urgency = 'medium';
            }

            if (feature.priority === 'critical') {
                impact = 'high';
            } else if (feature.priority === 'high') {
                impact = 'medium';
            }

            return {
                featureId: feature.id,
                name: f.name,
                category: feature.category,
                description: feature.description,
                urgency,
                impact,
                trPenetration: parseFloat(trPenetration.toFixed(1)),
                competitorsWithFeature: trCompetitorsWithFeature.length,
                estimatedDevWeeks: getDevEstimate(f.name),
                businessImpact: getBusinessImpact(f.name),
                roadmapQuarter: getQuarter(urgency, impact)
            };
        }).filter(Boolean);

        // Group by quarters
        const roadmap = {
            q1: gaps.filter(g => g!.roadmapQuarter === 'Q1').slice(0, 6),
            q2: gaps.filter(g => g!.roadmapQuarter === 'Q2').slice(0, 6),
            q3: gaps.filter(g => g!.roadmapQuarter === 'Q3').slice(0, 6)
        };

        res.json({
            success: true,
            data: {
                critical: gaps.filter(g => g!.urgency === 'critical' && g!.impact === 'high'),
                highPriority: gaps.filter(g => g!.urgency === 'high' || g!.impact === 'high'),
                quickWins: gaps.filter(g =>
                    (g!.urgency === 'critical' || g!.urgency === 'high') &&
                    g!.estimatedDevWeeks <= 2
                ),
                roadmap
            }
        });

    } catch (error) {
        console.error('Gap analysis error:', error);
        res.status(500).json({
            success: false,
            error: 'Boşluk analizi başarısız',
            message: error instanceof Error ? error.message : 'Bilinmeyen hata'
        });
    }
});

// Helper functions
function getDevEstimate(featureName: string): number {
    const estimates: Record<string, number> = {
        'Web App': 6,
        'Public API': 4,
        'TRY Nemalandırma': 8,
        'Sign in with Gmail': 1,
        'Sign in with Apple': 1,
        'Convert Small Assets': 1,
        'Corporate Registration': 3,
        'Logged-in Academy': 4,
        'Gamification': 6,
        'Launchpad': 12,
        'Copy Trading': 8,
        'AI Sentiment': 6
    };

    return estimates[featureName] || 4;
}

function getBusinessImpact(featureName: string): string {
    const impacts: Record<string, string> = {
        'Web App': 'Gelir: +15-25%, Pro trader segmenti',
        'Public API': 'Kurumsal müşteri: +10%, Likidite artışı',
        'TRY Nemalandırma': 'Gelir: +20-30%, Retention: +15%',
        'Sign in with Gmail': 'Onboarding: +30%, Sürtünme azalması',
        'Convert Small Assets': 'UX iyileştirme, Müşteri memnuniyeti +5%',
        'Launchpad': 'Gelir: +25%, Yeni token listeleme',
        'Copy Trading': 'Retail kullanıcı: +20%, Gelir: +10%'
    };

    return impacts[featureName] || 'UX iyileştirme';
}

function getQuarter(
    urgency: 'critical' | 'high' | 'medium' | 'low',
    impact: 'high' | 'medium' | 'low'
): 'Q1' | 'Q2' | 'Q3' {
    // Q1: Critical urgency + High impact
    if (urgency === 'critical' && impact === 'high') return 'Q1';

    // Q1/Q2: High urgency or high impact
    if (urgency === 'high' || urgency === 'critical') return 'Q1';
    if (impact === 'high') return 'Q2';

    // Q2/Q3: Medium priority
    if (urgency === 'medium' || impact === 'medium') return 'Q2';

    // Q3: Everything else
    return 'Q3';
}

export default router;
