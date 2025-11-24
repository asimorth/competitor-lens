import { PrismaClient } from '@prisma/client';
import { featureDescriptions } from '../utils/featureDescriptions';
import { getMultiPersonaAnalyticsService } from './multiPersonaAnalytics';

const prisma = new PrismaClient();
const multiPersonaService = getMultiPersonaAnalyticsService();

export interface FeatureAnalysis {
  // Universal data
  id: string;
  name: string;
  category: string | null;
  description: string | null;
  priority: string | null;
  coverage: number;
  implementedBy: Array<{
    id: string;
    name: string;
    implementationQuality: string | null;
    screenshotCount: number;
  }>;
  notImplementedBy: Array<{
    id: string;
    name: string;
  }>;
  
  // Persona-specific insights
  pm: any;
  designer: any;
  executive: any;
}

export interface MarketPositioningData {
  xAxis: 'coverage';
  yAxis: 'businessValue';
  bubbles: Array<{
    id: string;
    name: string;
    x: number;
    y: number;
    size: number;
    hasFeature: boolean;
    color: string;
  }>;
}

export interface OpportunityAnalysis {
  score: number; // 0-100
  level: 'high' | 'medium' | 'low';
  reasoning: string[];
  businessValue: string;
  technicalComplexity: string;
  marketCoverage: number;
  recommendation: string;
}

export class FeatureIntelligenceService {
  /**
   * Comprehensive feature analysis for all personas
   */
  async analyzeFeature(featureId: string): Promise<FeatureAnalysis> {
    const feature = await prisma.feature.findUnique({
      where: { id: featureId },
      include: {
        competitors: {
          include: {
            competitor: true,
            screenshots: true
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
    const implementedBy = feature.competitors
      .filter(c => c.hasFeature)
      .map(c => ({
        id: c.competitor.id,
        name: c.competitor.name,
        implementationQuality: c.implementationQuality,
        screenshotCount: c.screenshots.length
      }));

    const allCompetitors = await prisma.competitor.findMany();
    const notImplementedBy = allCompetitors
      .filter(c => !feature.competitors.find(cf => cf.competitorId === c.id && cf.hasFeature))
      .map(c => ({
        id: c.id,
        name: c.name
      }));

    const coverage = Math.round((implementedBy.length / totalCompetitors) * 100);

    // Get persona-specific insights
    const [pm, designer, executive] = await Promise.all([
      multiPersonaService.getFeaturePMInsights(featureId),
      multiPersonaService.getFeatureDesignerInsights(featureId),
      multiPersonaService.getFeatureExecutiveInsights(featureId)
    ]);

    return {
      id: feature.id,
      name: feature.name,
      category: feature.category,
      description: feature.description,
      priority: feature.priority,
      coverage,
      implementedBy,
      notImplementedBy,
      pm,
      designer,
      executive
    };
  }

  /**
   * Get market positioning visualization data
   */
  async getMarketPositioning(featureId: string): Promise<MarketPositioningData> {
    const feature = await prisma.feature.findUnique({
      where: { id: featureId },
      include: {
        competitors: {
          include: {
            competitor: true
          }
        },
        screenshots: true
      }
    });

    if (!feature) {
      throw new Error('Feature not found');
    }

    const allCompetitors = await prisma.competitor.findMany({
      include: {
        features: true,
        screenshots: true
      }
    });

    const desc = featureDescriptions[feature.name];
    const businessValueMap: Record<string, number> = {
      'critical': 90,
      'high': 70,
      'medium': 50,
      'low': 30
    };

    const businessValueScore = desc?.businessValue 
      ? (businessValueMap[desc.businessValue.toLowerCase()] || 50)
      : 50;

    const totalFeatures = await prisma.feature.count();
    
    const bubbles = allCompetitors.map(competitor => {
      const implementedFeatures = competitor.features.filter(f => f.hasFeature).length;
      const competitorCoverage = Math.round((implementedFeatures / totalFeatures) * 100);
      
      const hasFeature = feature.competitors.some(
        cf => cf.competitorId === competitor.id && cf.hasFeature
      );

      const screenshotCount = feature.screenshots.filter(
        s => s.competitorId === competitor.id
      ).length;

      return {
        id: competitor.id,
        name: competitor.name,
        x: competitorCoverage,
        y: businessValueScore,
        size: Math.max(screenshotCount, 1) * 5,
        hasFeature,
        color: hasFeature ? '#10b981' : '#ef4444'
      };
    });

    return {
      xAxis: 'coverage',
      yAxis: 'businessValue',
      bubbles
    };
  }

  /**
   * Calculate opportunity score for a feature
   */
  async calculateOpportunityScore(featureId: string): Promise<OpportunityAnalysis> {
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
    
    // Calculate score components
    let score = 0;
    const reasoning: string[] = [];

    // Market coverage component (inverse)
    const coverageScore = 100 - coverage;
    score += coverageScore * 0.4;
    
    if (coverage < 30) {
      reasoning.push('Low market coverage (differentiation opportunity)');
    } else if (coverage > 80) {
      reasoning.push('High market coverage (must-have feature)');
    }

    // Business value component
    let businessValueScore = 50;
    if (desc?.businessValue) {
      if (desc.businessValue.toLowerCase().includes('critical')) {
        businessValueScore = 90;
        reasoning.push('Critical business value');
      } else if (desc.businessValue.toLowerCase().includes('high')) {
        businessValueScore = 70;
        reasoning.push('High business value');
      }
    }
    score += (businessValueScore / 100) * 30;

    // Technical complexity component (inverse)
    let complexityScore = 50;
    if (desc?.technicalComplexity) {
      if (desc.technicalComplexity.includes('Düşük')) {
        complexityScore = 80;
        reasoning.push('Low technical complexity (easy win)');
      } else if (desc.technicalComplexity.includes('Yüksek')) {
        complexityScore = 30;
        reasoning.push('High technical complexity (barrier to entry)');
      }
    }
    score += (complexityScore / 100) * 30;

    const finalScore = Math.round(score);
    const level: 'high' | 'medium' | 'low' = 
      finalScore >= 70 ? 'high' : finalScore >= 40 ? 'medium' : 'low';

    // Generate recommendation
    let recommendation = '';
    if (level === 'high' && coverage < 40) {
      recommendation = 'High priority: Implement for competitive advantage';
    } else if (level === 'high' && coverage > 80) {
      recommendation = 'High priority: Must-have for industry parity';
    } else if (level === 'medium') {
      recommendation = 'Medium priority: Strategic consideration';
    } else {
      recommendation = 'Low priority: Nice to have';
    }

    return {
      score: finalScore,
      level,
      reasoning,
      businessValue: desc?.businessValue || 'Unknown',
      technicalComplexity: desc?.technicalComplexity || 'Unknown',
      marketCoverage: coverage,
      recommendation
    };
  }

  /**
   * Get best screenshot examples for a feature
   */
  async getBestScreenshots(featureId: string, limit: number = 10) {
    return await prisma.screenshot.findMany({
      where: {
        featureId,
        quality: { in: ['excellent', 'good'] }
      },
      include: {
        competitor: true
      },
      orderBy: [
        { isShowcase: 'desc' },
        { quality: 'desc' },
        { viewCount: 'desc' }
      ],
      take: limit
    });
  }

  /**
   * Get UI variations for a feature across competitors
   */
  async getUIVariations(featureId: string) {
    const screenshots = await prisma.screenshot.findMany({
      where: { featureId },
      include: {
        competitor: true
      }
    });

    const variations = new Map<string, any[]>();

    screenshots.forEach(s => {
      const pattern = s.uiPattern || 'unknown';
      if (!variations.has(pattern)) {
        variations.set(pattern, []);
      }
      variations.get(pattern)!.push(s);
    });

    return Array.from(variations.entries()).map(([pattern, screenshots]) => ({
      pattern,
      count: screenshots.length,
      examples: screenshots.slice(0, 3)
    }));
  }

  /**
   * Extract design patterns from screenshots
   */
  async extractDesignPatterns(featureId: string) {
    const screenshots = await prisma.screenshot.findMany({
      where: { featureId },
      include: {
        analyses: true
      }
    });

    const patterns: Array<{ name: string; frequency: number; description: string }> = [];

    // Count UI patterns
    const uiPatternCounts = new Map<string, number>();
    screenshots.forEach(s => {
      if (s.uiPattern) {
        uiPatternCounts.set(s.uiPattern, (uiPatternCounts.get(s.uiPattern) || 0) + 1);
      }
    });

    uiPatternCounts.forEach((count, pattern) => {
      patterns.push({
        name: pattern,
        frequency: count,
        description: `${pattern} pattern used in ${count} implementations`
      });
    });

    return patterns.sort((a, b) => b.frequency - a.frequency);
  }
}

// Singleton instance
let featureIntelligenceServiceInstance: FeatureIntelligenceService | null = null;

export function getFeatureIntelligenceService(): FeatureIntelligenceService {
  if (!featureIntelligenceServiceInstance) {
    featureIntelligenceServiceInstance = new FeatureIntelligenceService();
  }
  return featureIntelligenceServiceInstance;
}

