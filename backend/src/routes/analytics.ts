import { Router } from 'express';
import { analyticsController } from '../controllers/analyticsController';

const router = Router();

// GET /api/analytics/coverage - Feature coverage analizi
router.get('/coverage', analyticsController.getCoverage);

// GET /api/analytics/gap-analysis - Gap analizi
router.get('/gap-analysis', analyticsController.getGapAnalysis);

// GET /api/analytics/trends - Trend verileri
router.get('/trends', analyticsController.getTrends);

// POST /api/analytics/custom-report - Özel rapor oluştur
router.post('/custom-report', analyticsController.createCustomReport);

export default router;
