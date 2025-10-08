import { prisma } from '../lib/db';

export class AnalyticsService {
  async generateHeatmap() {
    // Tüm rakipleri ve feature'ları getir
    const competitors = await prisma.competitor.findMany({
      orderBy: { name: 'asc' }
    });
    const features = await prisma.feature.findMany({
      orderBy: { name: 'asc' }
    });
    
    // Feature matrix verisi
    const matrix = await prisma.competitorFeature.findMany({
      include: {
        competitor: true,
        feature: true
      }
    });
    
    // Heatmap data structure
    const heatmapData = features.map(feature => {
      const row: any = {
        featureId: feature.id,
        featureName: feature.name,
        category: feature.category,
        priority: feature.priority
      };
      
      competitors.forEach(competitor => {
        const relation = matrix.find(
          m => m.featureId === feature.id && m.competitorId === competitor.id
        );
        
        // Quality'e göre score
        const qualityScore = {
          'excellent': 4,
          'good': 3,
          'basic': 2,
          'none': 1
        };
        
        row[competitor.id] = relation?.hasFeature
          ? qualityScore[relation.implementationQuality as keyof typeof qualityScore] || 1
          : 0;
      });
      
      return row;
    });
    
    return {
      competitors,
      features,
      heatmapData
    };
  }
  
  async gapAnalysis() {
    const matrix = await this.generateHeatmap();
    
    // Her feature için kaç rakipte olduğunu hesapla
    const gaps = matrix.features.map(feature => {
      const implementations = matrix.competitors.filter(comp => {
        const cellValue = matrix.heatmapData.find(
          row => row.featureId === feature.id
        )?.[comp.id];
        return cellValue && cellValue > 0;
      });
      
      return {
        featureId: feature.id,
        featureName: feature.name,
        category: feature.category,
        priority: feature.priority,
        coverage: (implementations.length / matrix.competitors.length) * 100,
        implementedBy: implementations.length,
        missingFrom: matrix.competitors.length - implementations.length,
        competitors: matrix.competitors.map(comp => ({
          id: comp.id,
          name: comp.name,
          hasFeature: matrix.heatmapData.find(
            row => row.featureId === feature.id
          )?.[comp.id] > 0 || false
        }))
      };
    }).sort((a, b) => a.coverage - b.coverage);
    
    return gaps;
  }

  async getFeatureCoverage() {
    const competitors = await prisma.competitor.findMany();
    const features = await prisma.feature.findMany();
    const matrix = await prisma.competitorFeature.findMany({
      where: { hasFeature: true }
    });

    // Her rakip için feature coverage hesapla
    const competitorCoverage = competitors.map(competitor => {
      const implementedFeatures = matrix.filter(m => m.competitorId === competitor.id);
      const coverage = (implementedFeatures.length / features.length) * 100;
      
      return {
        competitorId: competitor.id,
        competitorName: competitor.name,
        totalFeatures: features.length,
        implementedFeatures: implementedFeatures.length,
        coverage: Math.round(coverage * 100) / 100
      };
    }).sort((a, b) => b.coverage - a.coverage);

    // Genel istatistikler
    const totalPossibleImplementations = competitors.length * features.length;
    const actualImplementations = matrix.length;
    const overallCoverage = (actualImplementations / totalPossibleImplementations) * 100;

    return {
      overallCoverage: Math.round(overallCoverage * 100) / 100,
      competitorCoverage,
      totalCompetitors: competitors.length,
      totalFeatures: features.length,
      totalImplementations: actualImplementations
    };
  }

  async getTrends(period: string = '30d') {
    const days = this.parsePeriod(period);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Son X gün içinde eklenen rakipler
    const newCompetitors = await prisma.competitor.findMany({
      where: {
        createdAt: {
          gte: startDate
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Son X gün içinde eklenen feature'lar
    const newFeatures = await prisma.feature.findMany({
      where: {
        createdAt: {
          gte: startDate
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Son X gün içinde güncellenen matrix hücreleri
    const matrixUpdates = await prisma.competitorFeature.findMany({
      where: {
        updatedAt: {
          gte: startDate
        }
      },
      include: {
        competitor: true,
        feature: true
      },
      orderBy: { updatedAt: 'desc' }
    });

    return {
      period,
      startDate,
      newCompetitors: {
        count: newCompetitors.length,
        data: newCompetitors
      },
      newFeatures: {
        count: newFeatures.length,
        data: newFeatures
      },
      matrixUpdates: {
        count: matrixUpdates.length,
        data: matrixUpdates
      }
    };
  }

  async generateCustomReport(reportType: string, filters: any = {}, config: any = {}) {
    switch (reportType) {
      case 'heatmap':
        return await this.generateHeatmap();
      
      case 'gap_analysis':
        return await this.gapAnalysis();
      
      case 'coverage':
        return await this.getFeatureCoverage();
      
      case 'feature_matrix':
        return await this.getFeatureMatrix(filters);
      
      default:
        throw new Error(`Unknown report type: ${reportType}`);
    }
  }

  private async getFeatureMatrix(filters: any = {}) {
    const whereClause: any = {};
    
    if (filters.category) {
      whereClause.feature = { category: filters.category };
    }
    
    if (filters.competitorIds && filters.competitorIds.length > 0) {
      whereClause.competitorId = { in: filters.competitorIds };
    }

    const matrix = await prisma.competitorFeature.findMany({
      where: whereClause,
      include: {
        competitor: true,
        feature: true
      }
    });

    return matrix;
  }

  private parsePeriod(period: string): number {
    const match = period.match(/^(\d+)([dwmy])$/);
    if (!match) return 30; // default to 30 days

    const [, num, unit] = match;
    const value = parseInt(num);

    switch (unit) {
      case 'd': return value;
      case 'w': return value * 7;
      case 'm': return value * 30;
      case 'y': return value * 365;
      default: return 30;
    }
  }
}
