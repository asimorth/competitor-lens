import { Request, Response, NextFunction } from 'express';
import { getDataValidationService } from '../services/dataValidation';
import { getIntelligentScreenshotAssignmentService } from '../services/intelligentScreenshotAssignment';

const validationService = getDataValidationService();
const assignmentService = getIntelligentScreenshotAssignmentService();

export const dataQualityController = {
  /**
   * GET /api/data-quality/overview
   * Get overall data quality overview
   */
  getOverview: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const summary = await validationService.getValidationSummary();
      
      res.json({
        success: true,
        data: summary
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/data-quality/score
   * Get data quality score
   */
  getScore: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const score = await validationService.generateDataQualityScore();
      
      res.json({
        success: true,
        data: score
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/data-quality/screenshots
   * Get screenshot quality report
   */
  getScreenshotQuality: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const report = await validationService.validateScreenshots();
      
      res.json({
        success: true,
        data: report
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/data-quality/matrix
   * Get matrix relationships quality
   */
  getMatrixQuality: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const report = await validationService.validateMatrix();
      
      res.json({
        success: true,
        data: report
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/data-quality/issues
   * Get all quality issues that need attention
   */
  getIssues: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const issues = await validationService.getIssues();
      
      res.json({
        success: true,
        data: issues,
        count: issues.length
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/data-quality/assignment-stats
   * Get screenshot assignment statistics
   */
  getAssignmentStats: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const stats = await assignmentService.getAssignmentStats();
      
      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/data-quality/needs-review
   * Get screenshots that need manual review
   */
  getNeedsReview: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const screenshots = await assignmentService.getScreenshotsNeedingReview(limit);
      
      res.json({
        success: true,
        data: screenshots,
        count: screenshots.length
      });
    } catch (error) {
      next(error);
    }
  }
};

