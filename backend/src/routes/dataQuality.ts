import { Router } from 'express';
import { dataQualityController } from '../controllers/dataQualityController';

const router = Router();

/**
 * Data Quality Routes
 * Provides insights into data quality, validation, and issues
 */

// Overview and scores
router.get('/overview', dataQualityController.getOverview);
router.get('/score', dataQualityController.getScore);

// Specific quality reports
router.get('/screenshots', dataQualityController.getScreenshotQuality);
router.get('/matrix', dataQualityController.getMatrixQuality);
router.get('/issues', dataQualityController.getIssues);

// Assignment quality
router.get('/assignment-stats', dataQualityController.getAssignmentStats);
router.get('/needs-review', dataQualityController.getNeedsReview);

export default router;

