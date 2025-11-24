import { PrismaClient } from '@prisma/client';
import { getMultiPersonaAnalyticsService } from './multiPersonaAnalytics';

const prisma = new PrismaClient();
const multiPersonaService = getMultiPersonaAnalyticsService();

export interface CompetitorAnalysis {
  // Universal data
  id: string;
  name: string;
  logoUrl: string | null;
  website: string | null;
  description: string | null;
  industry: string | null;
  region: string | null;
  featureCoverage: number;
  screenshotCount: number;
  
  // Persona-specific insights
  pm: any;
  designer: any;
  executive: any;
}

export interface CompetitorBenchmark {
  competitor: {
    id: string;
    name: string;
    coverage: number;
  };
  vsMarketLeader: {
    leaderName: string;
    leaderCoverage: number;
    gap: number;
    gapFeatures: string[];
  };
  categoryBreakdown: Array<{
    category: string;
    coverage: number;
    vsLeader: number;
  }>;
  ranking: number;
  totalCompetitors: number;
}

export class CompetitorIntelligenceService {
  /**
   * Comprehensive competitor analysis for all personas
   */
  async analyzeCompetitor(competitorId: string): Promise<CompetitorAnalysis> {
    const competitor = await prisma.competitor.findUnique({
      where: { id: competitorId },
      include: {
        features: {
          include: {
            feature: true,
            screenshots: true
          }
        },
        screenshots: true
      }
    });

    if (!competitor) {
      throw new Error('Competitor not found');
    }

    const totalFeatures = await prisma.feature.count();
    const implementedFeatures = competitor.features.filter(f => f.hasFeature).length;
    const coverage = Math.round((implementedFeatures / totalFeatures) * 100);

    // Get persona-specific insights
    const [pm, designer, executive] = await Promise.all([
      multiPersonaService.getCompetitorPMInsights(competitorId),
      multiPersonaService.getCompetitorDesignerInsights(competitorId),
      multiPersonaService.getCompetitorExecutiveInsights(competitorId)
    ]);

    return {
      id: competitor.id,
      name: competitor.name,
      logoUrl: competitor.logoUrl,
      website: competitor.website,
      description: competitor.description,
      industry: competitor.industry,
      region: competitor.region,
      featureCoverage: coverage,
      screenshotCount: competitor.screenshots.length,
      pm,
      designer,
      executive
    };
  }

  /**
   * Get competitor benchmark vs market leader
   */
  async getBenchmark(competitorId: string): Promise<CompetitorBenchmark> {
    const competitor = await prisma.competitor.findUnique({
      where: { id: competitorId },
      include: {
        features: {
          include: {
            feature: true
          }
        }
      }
    });

    if (!competitor) {
      throw new Error('Competitor not found');
    }

    const totalFeatures = await prisma.feature.count();
    const implementedFeatures = competitor.features.filter(f => f.hasFeature).length;
    const coverage = Math.round((implementedFeatures / totalFeatures) * 100);

    // Find market leader
    const allCompetitors = await prisma.competitor.findMany({
      include: {
        features: {
          include: {
            feature: true
          }
        }
      }
    });

    const rankings = allCompetitors
      .map(c => ({
        id: c.id,
        name: c.name,
        score: c.features.filter(f => f.hasFeature).length,
        features: c.features
      }))
      .sort((a, b) => b.score - a.score);

    const leader = rankings[0];
    const currentRanking = rankings.findIndex(r => r.id === competitorId) + 1;

    // Calculate gap vs leader
    const leaderCoverage = Math.round((leader.score / totalFeatures) * 100);
    const gap = leaderCoverage - coverage;

    // Find missing features vs leader
    const leaderFeatureIds = new Set(
      leader.features.filter(f => f.hasFeature).map(f => f.featureId)
    );
    const competitorFeatureIds = new Set(
      competitor.features.filter(f => f.hasFeature).map(f => f.featureId)
    );

    const gapFeatures = Array.from(leaderFeatureIds)
      .filter(fid => !competitorFeatureIds.has(fid))
      .map(fid => {
        const feature = leader.features.find(f => f.featureId === fid);
        return feature?.feature.name || 'Unknown';
      });

    // Category breakdown
    const categories = await this.getCategoryBreakdown(competitorId, leader.id);

    return {
      competitor: {
        id: competitor.id,
        name: competitor.name,
        coverage
      },
      vsMarketLeader: {
        leaderName: leader.name,
        leaderCoverage,
        gap,
        gapFeatures: gapFeatures.slice(0, 10)
      },
      categoryBreakdown: categories,
      ranking: currentRanking,
      totalCompetitors: allCompetitors.length
    };
  }

  /**
   * Compare two competitors
   */
  async compareCompetitors(competitorId1: string, competitorId2: string) {
    const [comp1, comp2] = await Promise.all([
      prisma.competitor.findUnique({
        where: { id: competitorId1 },
        include: {
          features: {
            include: {
              feature: true
            }
          }
        }
      }),
      prisma.competitor.findUnique({
        where: { id: competitorId2 },
        include: {
          features: {
            include: {
              feature: true
            }
          }
        }
      })
    ]);

    if (!comp1 || !comp2) {
      throw new Error('One or both competitors not found');
    }

    const totalFeatures = await prisma.feature.count();

    const comp1Features = new Set(comp1.features.filter(f => f.hasFeature).map(f => f.featureId));
    const comp2Features = new Set(comp2.features.filter(f => f.hasFeature).map(f => f.featureId));

    // Find unique features
    const comp1Only = Array.from(comp1Features).filter(f => !comp2Features.has(f));
    const comp2Only = Array.from(comp2Features).filter(f => !comp1Features.has(f));
    const both = Array.from(comp1Features).filter(f => comp2Features.has(f));

    return {
      competitor1: {
        id: comp1.id,
        name: comp1.name,
        coverage: Math.round((comp1Features.size / totalFeatures) * 100),
        uniqueFeatures: comp1Only.length,
        uniqueFeatureNames: comp1Only.map(fid => 
          comp1.features.find(f => f.featureId === fid)?.feature.name || 'Unknown'
        )
      },
      competitor2: {
        id: comp2.id,
        name: comp2.name,
        coverage: Math.round((comp2Features.size / totalFeatures) * 100),
        uniqueFeatures: comp2Only.length,
        uniqueFeatureNames: comp2Only.map(fid => 
          comp2.features.find(f => f.featureId === fid)?.feature.name || 'Unknown'
        )
      },
      commonFeatures: both.length,
      differentiationOpportunity: Math.max(comp1Only.length, comp2Only.length)
    };
  }

  /**
   * Calculate category breakdown vs leader
   */
  private async getCategoryBreakdown(competitorId: string, leaderId: string) {
    const features = await prisma.feature.findMany({
      include: {
        competitors: {
          where: {
            OR: [
              { competitorId },
              { competitorId: leaderId }
            ]
          }
        }
      }
    });

    const categoryMap = new Map<string, { total: number; competitor: number; leader: number }>();

    features.forEach(f => {
      const category = f.category || 'Other';
      if (!categoryMap.has(category)) {
        categoryMap.set(category, { total: 0, competitor: 0, leader: 0 });
      }

      const stats = categoryMap.get(category)!;
      stats.total++;

      const compFeature = f.competitors.find(c => c.competitorId === competitorId && c.hasFeature);
      const leaderFeature = f.competitors.find(c => c.competitorId === leaderId && c.hasFeature);

      if (compFeature) stats.competitor++;
      if (leaderFeature) stats.leader++;
    });

    return Array.from(categoryMap.entries()).map(([category, stats]) => ({
      category,
      coverage: Math.round((stats.competitor / stats.total) * 100),
      vsLeader: Math.round((stats.leader / stats.total) * 100)
    }));
  }

  /**
   * Get competitor ranking and positioning
   */
  async getRanking(competitorId: string) {
    const allCompetitors = await prisma.competitor.findMany({
      include: {
        _count: {
          select: {
            features: {
              where: { hasFeature: true }
            }
          }
        }
      }
    });

    const rankings = allCompetitors
      .map(c => ({
        id: c.id,
        name: c.name,
        featureCount: c._count.features
      }))
      .sort((a, b) => b.featureCount - a.featureCount);

    const ranking = rankings.findIndex(r => r.id === competitorId) + 1;
    const percentile = Math.round((1 - ranking / rankings.length) * 100);

    return {
      ranking,
      total: rankings.length,
      percentile,
      tier: ranking <= 3 ? 'leader' : ranking <= rankings.length / 2 ? 'mid-tier' : 'laggard'
    };
  }
}

// Singleton instance
let competitorIntelligenceServiceInstance: CompetitorIntelligenceService | null = null;

export function getCompetitorIntelligenceService(): CompetitorIntelligenceService {
  if (!competitorIntelligenceServiceInstance) {
    competitorIntelligenceServiceInstance = new CompetitorIntelligenceService();
  }
  return competitorIntelligenceServiceInstance;
}

