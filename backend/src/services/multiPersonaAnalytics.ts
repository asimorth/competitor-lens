import { PrismaClient } from '@prisma/client';
import { featureDescriptions, getFeaturePMInsights } from '../utils/featureDescriptions';

const prisma = new PrismaClient();

// Type definitions for insights
export interface PMInsights {
  strategicValue: 'critical' | 'high' | 'medium' | 'low';
  opportunityScore: number;
  implementationPriority: number;
  competitivePosition: 'leader' | 'challenger' | 'follower' | 'laggard';
  gaps: Array<{ name: string; coverage: number; priority: string }>;
  strengths: Array<{ name: string; score: number; reason: string }>;
  recommendations: Array<{ priority: string; action: string; reason: string }>;
  quickWins: string[];
  roadmapSuggestion: string;
  marketTrend: 'rising' | 'stable' | 'declining';
  momentum: number;
}

export interface DesignerInsights {
  screenshotQuality: {
    total: number;
    excellent: number;
    good: number;
    needsUpdate: number;
    missing: number;
  };
  detectedPatterns: Array<{ type: string; count: number; examples: string[] }>;
  visualIdentity: {
    colorScheme: string;
    complexity: string;
    consistency: number;
  };
  designSystemMaturity: 'high' | 'medium' | 'low';
  bestInClass: {
    competitorId: string;
    competitorName: string;
    screenshotCount: number;
    whyBest: string;
  } | null;
  screenflowCompleteness: number;
  missingScreenshots: string[];
  recommendations: string[];
}

export interface ExecutiveInsights {
  overallScore: number;
  ranking: number;
  totalEntities: number;
  positioningSummary: string;
  keyTakeaway: string;
  coverage: number;
  trend: {
    direction: 'up' | 'down' | 'stable';
    change: number;
  };
  criticalAction: string | null;
  riskLevel: 'high' | 'medium' | 'low';
  opportunities: Array<{ name: string; impact: string; effort: string }>;
}

export class MultiPersonaAnalyticsService {
  /**
   * Get PM Insights for Feature
   */
  async getFeaturePMInsights(featureId: string): Promise<PMInsights> {
    const feature = await prisma.feature.findUnique({
      where: { id: featureId },
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

    const totalCompetitors = await prisma.competitor.count();
    const implementedBy = feature.competitors.filter(c => c.hasFeature).length;
    const coverage = Math.round((implementedBy / totalCompetitors) * 100);

    // Get feature description
    const desc = featureDescriptions[feature.name];

    // Calculate opportunity score
    const opportunityScore = this.calculateOpportunityScore(coverage, desc);

    // Determine competitive position
    const competitivePosition = this.determinePosition(coverage);

    // Get PM insights from feature descriptions
    const pmInsightsText = getFeaturePMInsights(feature.name, coverage, implementedBy, totalCompetitors);

    // Identify gaps (competitors without this feature)
    const allCompetitors = await prisma.competitor.findMany();
    const gaps = allCompetitors
      .filter(c => !feature.competitors.find(cf => cf.competitorId === c.id && cf.hasFeature))
      .map(c => ({
        name: c.name,
        coverage: 0,
        priority: coverage < 50 ? 'high' : 'medium'
      }))
      .slice(0, 5);

    // Generate recommendations
    const recommendations = this.generatePMRecommendations(coverage, implementedBy, desc);

    return {
      strategicValue: desc?.businessValue?.includes('critical') ? 'critical' : 
                      desc?.businessValue?.includes('high') ? 'high' : 'medium',
      opportunityScore,
      implementationPriority: Math.round(opportunityScore / 10),
      competitivePosition,
      gaps,
      strengths: [],
      recommendations,
      quickWins: coverage < 40 ? ['Early mover advantage opportunity'] : [],
      roadmapSuggestion: this.generateRoadmapSuggestion(coverage, desc),
      marketTrend: 'stable',
      momentum: 0
    };
  }

  /**
   * Get PM Insights for Competitor
   */
  async getCompetitorPMInsights(competitorId: string): Promise<PMInsights> {
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

    // Get all competitors for ranking
    const allCompetitors = await prisma.competitor.findMany({
      include: {
        features: true
      }
    });

    const rankings = allCompetitors
      .map(c => ({
        id: c.id,
        name: c.name,
        score: c.features.filter(f => f.hasFeature).length
      }))
      .sort((a, b) => b.score - a.score);

    const ranking = rankings.findIndex(r => r.id === competitorId) + 1;
    const competitivePosition = this.determinePosition(coverage);

    // Identify strength and weakness categories
    const categoryStats = await this.getCategoryStats(competitorId);
    const strengths = categoryStats.filter(c => c.coverage > 70).slice(0, 3);
    const gaps = categoryStats.filter(c => c.coverage < 50).slice(0, 5);

    return {
      strategicValue: ranking <= 3 ? 'critical' : ranking <= 10 ? 'high' : 'medium',
      opportunityScore: coverage,
      implementationPriority: 10 - Math.floor(ranking / 2),
      competitivePosition,
      gaps: gaps.map(g => ({ name: g.category, coverage: g.coverage, priority: 'high' })),
      strengths: strengths.map(s => ({
        name: s.category,
        score: s.coverage,
        reason: `Strong performance in ${s.category}`
      })),
      recommendations: this.generateCompetitorRecommendations(competitor, gaps),
      quickWins: [],
      roadmapSuggestion: `Focus on ${gaps[0]?.category || 'emerging features'}`,
      marketTrend: 'stable',
      momentum: 0
    };
  }

  /**
   * Get Designer Insights for Feature
   */
  async getFeatureDesignerInsights(featureId: string): Promise<DesignerInsights> {
    const feature = await prisma.feature.findUnique({
      where: { id: featureId },
      include: {
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

    const screenshots = feature.screenshots;

    // Calculate quality distribution
    const qualityDist = {
      total: screenshots.length,
      excellent: screenshots.filter(s => s.quality === 'excellent').length,
      good: screenshots.filter(s => s.quality === 'good').length,
      needsUpdate: screenshots.filter(s => s.quality === 'poor' || s.quality === 'needs-update').length,
      missing: 0
    };

    // Detect UI patterns
    const patterns = this.detectUIPatterns(screenshots);

    // Find best-in-class implementation
    const bestInClass = await this.findBestImplementation(screenshots);

    return {
      screenshotQuality: qualityDist,
      detectedPatterns: patterns,
      visualIdentity: {
        colorScheme: 'light',
        complexity: 'moderate',
        consistency: 75
      },
      designSystemMaturity: 'medium',
      bestInClass,
      screenflowCompleteness: Math.round((screenshots.length / 10) * 100), // Assume 10 screens ideal
      missingScreenshots: this.identifyMissingScreens(feature),
      recommendations: this.generateDesignerRecommendations(qualityDist)
    };
  }

  /**
   * Get Designer Insights for Competitor
   */
  async getCompetitorDesignerInsights(competitorId: string): Promise<DesignerInsights> {
    const competitor = await prisma.competitor.findUnique({
      where: { id: competitorId },
      include: {
        screenshots: true,
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

    const screenshots = competitor.screenshots;

    const qualityDist = {
      total: screenshots.length,
      excellent: screenshots.filter(s => s.quality === 'excellent').length,
      good: screenshots.filter(s => s.quality === 'good').length,
      needsUpdate: screenshots.filter(s => s.quality === 'poor' || s.quality === 'needs-update').length,
      missing: 0 // Will be calculated based on feature-screenshot relationships
    };

    const patterns = this.detectUIPatterns(screenshots);
    const totalFeatures = competitor.features?.filter((f: any) => f.hasFeature).length || 0;
    const coverage = totalFeatures > 0 ? Math.round((screenshots.length / totalFeatures) * 100) : 0;

    return {
      screenshotQuality: qualityDist,
      detectedPatterns: patterns,
      visualIdentity: {
        colorScheme: 'light',
        complexity: 'moderate',
        consistency: 70
      },
      designSystemMaturity: coverage > 80 ? 'high' : coverage > 50 ? 'medium' : 'low',
      bestInClass: null,
      screenflowCompleteness: coverage,
      missingScreenshots: [],
      recommendations: this.generateDesignerRecommendations(qualityDist)
    };
  }

  /**
   * Get Executive Insights for Feature
   */
  async getFeatureExecutiveInsights(featureId: string): Promise<ExecutiveInsights> {
    const feature = await prisma.feature.findUnique({
      where: { id: featureId },
      include: {
        competitors: true
      }
    });

    if (!feature) {
      throw new Error('Feature not found');
    }

    const totalCompetitors = await prisma.competitor.count();
    const implementedBy = feature.competitors.filter(c => c.hasFeature).length;
    const coverage = Math.round((implementedBy / totalCompetitors) * 100);

    const desc = featureDescriptions[feature.name];
    const strategicImportance = coverage > 80 ? 'must-have' : coverage > 50 ? 'competitive' : 'differentiator';

    return {
      overallScore: coverage,
      ranking: 0,
      totalEntities: totalCompetitors,
      positioningSummary: `${implementedBy}/${totalCompetitors} exchanges have this feature (${coverage}%)`,
      keyTakeaway: this.generateExecutiveKeyTakeaway(coverage, strategicImportance),
      coverage,
      trend: { direction: 'stable', change: 0 },
      criticalAction: coverage < 30 ? 'Consider implementing for competitive advantage' : null,
      riskLevel: coverage > 80 ? 'high' : 'medium',
      opportunities: coverage < 50 ? [{ name: feature.name, impact: 'high', effort: 'medium' }] : []
    };
  }

  /**
   * Get Executive Insights for Competitor
   */
  async getCompetitorExecutiveInsights(competitorId: string): Promise<ExecutiveInsights> {
    const competitor = await prisma.competitor.findUnique({
      where: { id: competitorId },
      include: {
        features: true
      }
    });

    if (!competitor) {
      throw new Error('Competitor not found');
    }

    const totalFeatures = await prisma.feature.count();
    const implementedFeatures = competitor.features.filter(f => f.hasFeature).length;
    const coverage = Math.round((implementedFeatures / totalFeatures) * 100);

    // Get ranking
    const allCompetitors = await prisma.competitor.findMany({
      include: {
        features: true
      }
    });

    const rankings = allCompetitors
      .map(c => ({
        id: c.id,
        name: c.name,
        score: c.features.filter(f => f.hasFeature).length
      }))
      .sort((a, b) => b.score - a.score);

    const ranking = rankings.findIndex(r => r.id === competitorId) + 1;

    return {
      overallScore: coverage,
      ranking,
      totalEntities: allCompetitors.length,
      positioningSummary: this.generatePositioningSummary(ranking, coverage, allCompetitors.length),
      keyTakeaway: this.generateCompetitorKeyTakeaway(ranking, coverage),
      coverage,
      trend: { direction: 'stable', change: 0 },
      criticalAction: coverage < 50 ? 'Increase feature coverage' : null,
      riskLevel: ranking > 10 ? 'high' : ranking > 5 ? 'medium' : 'low',
      opportunities: []
    };
  }

  // Helper methods

  private calculateOpportunityScore(coverage: number, desc: any): number {
    let score = 0;
    
    // Lower coverage = higher opportunity
    score += (100 - coverage) * 0.4;
    
    // High business value = higher opportunity
    if (desc?.businessValue?.includes('critical') || desc?.businessValue?.includes('high')) {
      score += 30;
    }
    
    // Lower technical complexity = higher opportunity
    if (desc?.technicalComplexity?.includes('Düşük')) {
      score += 20;
    } else if (desc?.technicalComplexity?.includes('Orta')) {
      score += 10;
    }
    
    return Math.min(Math.round(score), 100);
  }

  private determinePosition(coverage: number): 'leader' | 'challenger' | 'follower' | 'laggard' {
    if (coverage >= 80) return 'leader';
    if (coverage >= 60) return 'challenger';
    if (coverage >= 40) return 'follower';
    return 'laggard';
  }

  private generatePMRecommendations(coverage: number, implementedBy: number, desc: any): Array<{ priority: string; action: string; reason: string }> {
    const recommendations = [];

    if (coverage < 30) {
      recommendations.push({
        priority: 'high',
        action: 'Consider early implementation',
        reason: 'Low market coverage provides differentiation opportunity'
      });
    } else if (coverage > 80) {
      recommendations.push({
        priority: 'high',
        action: 'Implement immediately if missing',
        reason: 'Industry standard - lack of this feature is competitive disadvantage'
      });
    }

    if (desc?.userBenefit) {
      recommendations.push({
        priority: 'medium',
        action: 'Focus on user experience',
        reason: desc.userBenefit
      });
    }

    return recommendations;
  }

  private generateRoadmapSuggestion(coverage: number, desc: any): string {
    if (coverage < 30) {
      return 'Q2 2024 - Early mover advantage opportunity';
    } else if (coverage > 80) {
      return 'Q1 2024 - Critical for competitive parity';
    } else {
      return 'Q3 2024 - Strategic enhancement';
    }
  }

  private async getCategoryStats(competitorId: string) {
    const features = await prisma.feature.findMany({
      include: {
        competitors: {
          where: { 
            competitorId,
            hasFeature: true
          }
        }
      }
    });

    const categoryMap = new Map<string, { total: number; implemented: number }>();

    features.forEach(f => {
      const category = f.category || 'Other';
      if (!categoryMap.has(category)) {
        categoryMap.set(category, { total: 0, implemented: 0 });
      }
      const stats = categoryMap.get(category)!;
      stats.total++;
      if (f.competitors && f.competitors.length > 0) {
        stats.implemented++;
      }
    });

    return Array.from(categoryMap.entries()).map(([category, stats]) => ({
      category,
      coverage: Math.round((stats.implemented / stats.total) * 100)
    }));
  }

  private generateCompetitorRecommendations(competitor: any, gaps: any[]): Array<{ priority: string; action: string; reason: string }> {
    const recommendations = [];

    if (gaps.length > 0) {
      recommendations.push({
        priority: 'high',
        action: `Strengthen ${gaps[0].category} capabilities`,
        reason: `Only ${gaps[0].coverage}% coverage in this critical area`
      });
    }

    return recommendations;
  }

  private detectUIPatterns(screenshots: any[]): Array<{ type: string; count: number; examples: string[] }> {
    const patterns = new Map<string, string[]>();

    screenshots.forEach(s => {
      if (s.uiPattern) {
        if (!patterns.has(s.uiPattern)) {
          patterns.set(s.uiPattern, []);
        }
        patterns.get(s.uiPattern)!.push(s.fileName);
      }
    });

    return Array.from(patterns.entries()).map(([type, examples]) => ({
      type,
      count: examples.length,
      examples: examples.slice(0, 3)
    }));
  }

  private async findBestImplementation(screenshots: any[]) {
    const excellentScreenshots = screenshots.filter(s => s.quality === 'excellent');
    if (excellentScreenshots.length === 0) return null;

    const byCompetitor: Record<string, any[]> = {};
    
    excellentScreenshots.forEach(s => {
      if (!byCompetitor[s.competitorId]) {
        byCompetitor[s.competitorId] = [];
      }
      byCompetitor[s.competitorId].push(s);
    });

    const entries = Object.entries(byCompetitor);
    if (entries.length === 0) return null;

    const best = entries.sort((a, b) => b[1].length - a[1].length)[0];
    const competitor = screenshots.find(s => s.competitorId === best[0])?.competitor;

    return {
      competitorId: best[0],
      competitorName: competitor?.name || 'Unknown',
      screenshotCount: best[1].length,
      whyBest: `Highest quality screenshots (${best[1].length} excellent)`
    };
  }

  private identifyMissingScreens(feature: any): string[] {
    const missing = [];
    const contexts = ['login', 'dashboard', 'feature-detail', 'settings'];
    
    const existingContexts = new Set(feature.screenshots.map((s: any) => s.context).filter(Boolean));
    
    contexts.forEach(ctx => {
      if (!existingContexts.has(ctx)) {
        missing.push(`${feature.name} - ${ctx} screen`);
      }
    });

    return missing;
  }

  private generateDesignerRecommendations(qualityDist: any): string[] {
    const recommendations = [];

    if (qualityDist.needsUpdate > 0) {
      recommendations.push(`Update ${qualityDist.needsUpdate} low-quality screenshots`);
    }

    if (qualityDist.missing > 0) {
      recommendations.push(`Add screenshots for ${qualityDist.missing} features`);
    }

    if (qualityDist.excellent < qualityDist.total * 0.5) {
      recommendations.push('Improve overall screenshot quality');
    }

    return recommendations;
  }

  private generateExecutiveKeyTakeaway(coverage: number, strategicImportance: string): string {
    if (coverage < 30 && strategicImportance === 'differentiator') {
      return 'High differentiation opportunity with early mover advantage';
    } else if (coverage > 80) {
      return 'Industry standard - critical to have for competitive parity';
    } else {
      return 'Strategic feature with balanced market adoption';
    }
  }

  private generatePositioningSummary(ranking: number, coverage: number, total: number): string {
    if (ranking <= 3) {
      return `Market leader (Top 3 of ${total}) with ${coverage}% feature coverage`;
    } else if (ranking <= total / 2) {
      return `Mid-tier player (#${ranking} of ${total}) with ${coverage}% coverage`;
    } else {
      return `Lagging competitor (#${ranking} of ${total}) with ${coverage}% coverage`;
    }
  }

  private generateCompetitorKeyTakeaway(ranking: number, coverage: number): string {
    if (ranking <= 3 && coverage > 75) {
      return 'Strong market position - maintain leadership through innovation';
    } else if (ranking > 10) {
      return 'Critical need to increase feature coverage and competitive positioning';
    } else {
      return 'Solid foundation - focus on strategic differentiation';
    }
  }
}

// Singleton instance
let multiPersonaServiceInstance: MultiPersonaAnalyticsService | null = null;

export function getMultiPersonaAnalyticsService(): MultiPersonaAnalyticsService {
  if (!multiPersonaServiceInstance) {
    multiPersonaServiceInstance = new MultiPersonaAnalyticsService();
  }
  return multiPersonaServiceInstance;
}

