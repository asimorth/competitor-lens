import { Router } from 'express';
import { matrixController } from '../controllers/matrixController';

const router = Router();

// GET /api/matrix - Feature matrisini getir
router.get('/', matrixController.getMatrix);

// GET /api/matrix/heatmap - Heatmap verisi
router.get('/heatmap', matrixController.getHeatmap);

// GET /api/matrix/export - Excel export
router.get('/export', matrixController.exportMatrix);

// POST /api/matrix/bulk-update - Toplu güncelleme
router.post('/bulk-update', matrixController.bulkUpdate);

// PUT /api/matrix/:competitorId/:featureId - Tek hücre güncelleme
router.put('/:competitorId/:featureId', matrixController.updateCell);

export default router;
