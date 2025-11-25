import { Request, Response, NextFunction } from 'express';
import { AnalyticsService } from '../services/analyticsService';

const analyticsService = new AnalyticsService();

export const analyticsController = {
  // GET /api/analytics/coverage
  getCoverage: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const coverage = await analyticsService.getFeatureCoverage();

      res.json({
        success: true,
        data: coverage
      });
    } catch (error) {
      next(error);
    }
  },

  // GET /api/analytics/gap-analysis
  getGapAnalysis: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const gapAnalysis = await analyticsService.gapAnalysis();

      res.json({
        success: true,
        data: gapAnalysis
      });
    } catch (error) {
      next(error);
    }
  },

  // GET /api/analytics/trends
  getTrends: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { period = '30d' } = req.query;
      const trends = await analyticsService.getTrends(period as string);

      res.json({
        success: true,
        data: trends
      });
    } catch (error) {
      next(error);
    }
  },

  // GET /api/analytics/stablex - Smart Stablex feature analysis
  getStablexAnalysis: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { analyzeStablexFeatures, compareStablexVsTR } = await import('../services/stablexAnalytics');
      const mode = req.query.mode as string || 'features'; // 'features' or 'comparison'

      if (mode === 'comparison') {
        const comparison = await compareStablexVsTR();
        return res.json({
          success: true,
          data: comparison
        });
      }

      // Default: just feature analysis
      const analysis = await analyzeStablexFeatures();
      res.json({
        success: true,
        data: analysis
      });
    } catch (error) {
      next(error);
    }
  },

  // POST /api/analytics/custom-report
  createCustomReport: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { reportType, filters, config } = req.body;
      const report = await analyticsService.generateCustomReport(reportType, filters, config);

      res.json({
        success: true,
        data: report,
        message: 'Custom report generated successfully'
      });
    } catch (error) {
      next(error);
    }
  }
};
