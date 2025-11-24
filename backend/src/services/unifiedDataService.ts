import { PrismaClient } from '@prisma/client';
import { getScreenshotFeatureMapper } from './screenshotFeatureMapper';

const prisma = new PrismaClient();
const mapper = getScreenshotFeatureMapper();

/**
 * Unified Data Service
 * Merges Excel feature matrix data with screenshot data
 * Provides clean, simple API for frontend
 */
export class UnifiedDataService {
  /**
   * Get competitor with features and screenshots merged
   * Simple response for Stablex use case
   */
  async getCompetitorUnified(id: string) {
    const competitor = await prisma.competitor.findUnique({
      where: { id },
      include: {
        features: {
          include: {
            feature: true
          }
        },
        screenshots: {
          include: {
            feature: true
          }
        }
      }
    });

    if (!competitor) {
      throw new Error('Competitor not found');
    }

    // Group screenshots by feature
    const featureGroups = this.groupScreenshotsByFeature(
      competitor.features,
      competitor.screenshots
    );

    // Separate by has/missing
    const hasFeatures = featureGroups.filter(f => f.hasFeature);
    const missingFeatures = featureGroups.filter(f => !f.hasFeature);

    return {
      competitor: {
        id: competitor.id,
        name: competitor.name,
        region: competitor.region,
        website: competitor.website
      },
      stats: {
        totalFeatures: competitor.features.length,
        hasFeatures: hasFeatures.length,
        missingFeatures: missingFeatures.length,
        totalScreenshots: competitor.screenshots.length,
        featuresWithScreenshots: hasFeatures.filter(f => f.screenshots.length > 0).length
      },
      hasFeatures,
      missingFeatures
    };
  }

  /**
   * Get feature with all competitor implementations and screenshots
   */
  async getFeatureUnified(id: string) {
    const feature = await prisma.feature.findUnique({
      where: { id },
      include: {
        competitors: {
          include: {
            competitor: true
          }
        },
        screenshots: {
          include: {
            competitor: true
          }
        }
      }
    });

    if (!feature) {
      throw new Error('Feature not found');
    }

    // Get all competitors
    const allCompetitors = await prisma.competitor.findMany();
    const totalCompetitors = allCompetitors.length;
    const implementedBy = feature.competitors.filter(cf => cf.hasFeature).length;
    const coverage = Math.round((implementedBy / totalCompetitors) * 100);

    // TR competitors specifically
    const trCompetitors = allCompetitors.filter(c => 
      c.region === 'TR' || 
      ['OKX TR', 'Paribu', 'BTCTurk', 'BinanceTR', 'Garanti Kripto', 'BybitTR', 'BiLira', 'GateTR'].includes(c.name)
    );
    const trImplemented = feature.competitors.filter(cf => 
      cf.hasFeature && trCompetitors.find(tc => tc.id === cf.competitorId)
    ).length;
    const trCoverage = Math.round((trImplemented / trCompetitors.length) * 100);

    // Group screenshots by competitor
    const implementationsByCompetitor = this.groupScreenshotsByCompetitor(
      feature.screenshots,
      feature.competitors
    );

    return {
      feature: {
        id: feature.id,
        name: feature.name,
        category: feature.category,
        priority: feature.priority
      },
      coverage: {
        overall: coverage,
        implemented: implementedBy,
        total: totalCompetitors,
        tr: {
          coverage: trCoverage,
          implemented: trImplemented,
          total: trCompetitors.length
        }
      },
      implementations: implementationsByCompetitor,
      totalScreenshots: feature.screenshots.length
    };
  }

  /**
   * Group screenshots by feature for competitor view
   */
  private groupScreenshotsByFeature(competitorFeatures: any[], screenshots: any[]) {
    return competitorFeatures.map(cf => {
      // Find screenshots for this feature
      const featureScreenshots = screenshots.filter(s => 
        s.featureId === cf.featureId
      );

      return {
        feature: cf.feature,
        hasFeature: cf.hasFeature,
        implementationQuality: cf.implementationQuality,
        notes: cf.notes,
        screenshots: featureScreenshots,
        screenshotCount: featureScreenshots.length
      };
    }).sort((a, b) => {
      // Sort: has features with screenshots first
      if (a.hasFeature && !b.hasFeature) return -1;
      if (!a.hasFeature && b.hasFeature) return 1;
      if (a.screenshotCount > 0 && b.screenshotCount === 0) return -1;
      if (a.screenshotCount === 0 && b.screenshotCount > 0) return 1;
      return 0;
    });
  }

  /**
   * Group screenshots by competitor for feature view
   */
  private groupScreenshotsByCompetitor(screenshots: any[], competitorFeatures: any[]) {
    const grouped = new Map<string, any>();

    screenshots.forEach(screenshot => {
      const compId = screenshot.competitorId;
      const compName = screenshot.competitor.name;

      if (!grouped.has(compId)) {
        const cf = competitorFeatures.find(cf => cf.competitorId === compId);
        
        grouped.set(compId, {
          competitor: {
            id: compId,
            name: compName
          },
          hasFeature: cf?.hasFeature || false,
          implementationQuality: cf?.implementationQuality,
          screenshots: [],
          screenshotCount: 0
        });
      }

      grouped.get(compId)!.screenshots.push(screenshot);
      grouped.get(compId)!.screenshotCount++;
    });

    return Array.from(grouped.values()).sort((a, b) => {
      // TR competitors first, then by screenshot count
      const aTR = ['OKX TR', 'Paribu', 'BTCTurk', 'Garanti Kripto'].includes(a.competitor.name);
      const bTR = ['OKX TR', 'Paribu', 'BTCTurk', 'Garanti Kripto'].includes(b.competitor.name);
      
      if (aTR && !bTR) return -1;
      if (!aTR && bTR) return 1;
      return b.screenshotCount - a.screenshotCount;
    });
  }

  /**
   * Get simple dashboard data for Stablex
   */
  async getDashboardData() {
    // TR Competitors
    const trCompetitors = await prisma.competitor.findMany({
      where: {
        OR: [
          { region: 'TR' },
          { name: { in: ['OKX TR', 'Paribu', 'BTCTurk', 'BinanceTR', 'Garanti Kripto', 'BybitTR', 'BiLira', 'GateTR'] } }
        ]
      },
      include: {
        _count: {
          select: {
            features: { where: { hasFeature: true } },
            screenshots: true
          }
        }
      },
      orderBy: {
        features: {
          _count: 'desc'
        }
      }
    });

    // Global Competitors
    const globalCompetitors = await prisma.competitor.findMany({
      where: {
        name: { in: ['Coinbase', 'Kraken', 'Binance Global', 'Revolut'] }
      },
      include: {
        _count: {
          select: {
            features: { where: { hasFeature: true } },
            screenshots: true
          }
        }
      }
    });

    // Top features (by TR coverage)
    const features = await prisma.feature.findMany({
      include: {
        _count: {
          select: {
            competitors: { where: { hasFeature: true } }
          }
        },
        screenshots: true
      }
    });

    const totalCompetitors = trCompetitors.length;
    const topFeatures = features
      .map(f => ({
        id: f.id,
        name: f.name,
        category: f.category,
        trCoverage: Math.round((f._count.competitors / totalCompetitors) * 100),
        screenshotCount: f.screenshots.length
      }))
      .sort((a, b) => b.trCoverage - a.trCoverage)
      .slice(0, 10);

    return {
      trCompetitors: trCompetitors.map(c => ({
        id: c.id,
        name: c.name,
        featureCount: c._count.features,
        screenshotCount: c._count.screenshots
      })),
      globalCompetitors: globalCompetitors.map(c => ({
        id: c.id,
        name: c.name,
        featureCount: c._count.features,
        screenshotCount: c._count.screenshots
      })),
      topFeatures,
      stats: {
        totalTRCompetitors: trCompetitors.length,
        totalGlobalCompetitors: globalCompetitors.length,
        totalFeatures: features.length,
        totalScreenshots: await prisma.screenshot.count()
      }
    };
  }
}

// Singleton
let unifiedServiceInstance: UnifiedDataService | null = null;

export function getUnifiedDataService(): UnifiedDataService {
  if (!unifiedServiceInstance) {
    unifiedServiceInstance = new UnifiedDataService();
  }
  return unifiedServiceInstance;
}

// Run sync
async function sync() {
  console.log('Starting Excel-Screenshot sync...\n');
  
  const trComps = ["OKX TR", "Garanti Kripto", "Paribu", "BTCTurk", "BinanceTR", "BybitTR", "BiLira", "GateTR"];
  const globalComps = ["Coinbase", "Kraken"];
  
  let total = { mapped: 0, skipped: 0 };
  
  for (const comp of [...trComps, ...globalComps]) {
    const result = await mapper.mapCompetitorScreenshots(comp);
    total.mapped += result.mapped;
    total.skipped += result.skipped;
  }
  
  const report = await mapper.getMappingReport();
  
  console.log('\n📊 Final Report:');
  console.log(`  Mapped: ${total.mapped}`);
  console.log(`  Skipped: ${total.skipped}`);
  console.log(`  Mapping Rate: ${report.mappingRate}%`);
  
  await prisma.$disconnect();
}

sync().catch(console.error);

