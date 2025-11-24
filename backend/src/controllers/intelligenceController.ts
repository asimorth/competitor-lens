import { Request, Response, NextFunction } from 'express';
import { getMultiPersonaAnalyticsService } from '../services/multiPersonaAnalytics';
import { getFeatureIntelligenceService } from '../services/featureIntelligence';
import { getCompetitorIntelligenceService } from '../services/competitorIntelligence';

const multiPersonaService = getMultiPersonaAnalyticsService();
const featureIntelligence = getFeatureIntelligenceService();
const competitorIntelligence = getCompetitorIntelligenceService();

export const intelligenceController = {
  /**
   * GET /api/intelligence/feature/:id/pm
   * Get PM-specific insights for a feature
   */
  getFeaturePMInsights: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const insights = await multiPersonaService.getFeaturePMInsights(id);
      
      res.json({
        success: true,
        data: insights
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/intelligence/feature/:id/designer
   * Get Designer-specific insights for a feature
   */
  getFeatureDesignerInsights: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const insights = await multiPersonaService.getFeatureDesignerInsights(id);
      
      res.json({
        success: true,
        data: insights
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/intelligence/feature/:id/executive
   * Get Executive-specific insights for a feature
   */
  getFeatureExecutiveInsights: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const insights = await multiPersonaService.getFeatureExecutiveInsights(id);
      
      res.json({
        success: true,
        data: insights
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/intelligence/competitor/:id/pm
   * Get PM-specific insights for a competitor
   */
  getCompetitorPMInsights: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const insights = await multiPersonaService.getCompetitorPMInsights(id);
      
      res.json({
        success: true,
        data: insights
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/intelligence/competitor/:id/designer
   * Get Designer-specific insights for a competitor
   */
  getCompetitorDesignerInsights: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const insights = await multiPersonaService.getCompetitorDesignerInsights(id);
      
      res.json({
        success: true,
        data: insights
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/intelligence/competitor/:id/executive
   * Get Executive-specific insights for a competitor
   */
  getCompetitorExecutiveInsights: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const insights = await multiPersonaService.getCompetitorExecutiveInsights(id);
      
      res.json({
        success: true,
        data: insights
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/intelligence/feature/:id/analyze
   * Get comprehensive feature analysis (all personas)
   */
  analyzeFeature: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const analysis = await featureIntelligence.analyzeFeature(id);
      
      res.json({
        success: true,
        data: analysis
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/intelligence/feature/:id/positioning
   * Get market positioning visualization data
   */
  getFeaturePositioning: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const positioning = await featureIntelligence.getMarketPositioning(id);
      
      res.json({
        success: true,
        data: positioning
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/intelligence/feature/:id/opportunity
   * Get opportunity score and analysis
   */
  getFeatureOpportunity: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const opportunity = await featureIntelligence.calculateOpportunityScore(id);
      
      res.json({
        success: true,
        data: opportunity
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/intelligence/competitor/:id/analyze
   * Get comprehensive competitor analysis (all personas)
   */
  analyzeCompetitor: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const analysis = await competitorIntelligence.analyzeCompetitor(id);
      
      res.json({
        success: true,
        data: analysis
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/intelligence/competitor/:id/benchmark
   * Get competitor benchmark vs market leader
   */
  getCompetitorBenchmark: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const benchmark = await competitorIntelligence.getBenchmark(id);
      
      res.json({
        success: true,
        data: benchmark
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/intelligence/compare/:id1/:id2
   * Compare two competitors
   */
  compareCompetitors: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id1, id2 } = req.params;
      const comparison = await competitorIntelligence.compareCompetitors(id1, id2);
      
      res.json({
        success: true,
        data: comparison
      });
    } catch (error) {
      next(error);
    }
  }
};

