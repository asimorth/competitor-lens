import { Router } from 'express';
import { reportController } from '../controllers/reportController';

const router = Router();

// GET /api/reports - Tüm raporları listele
router.get('/', reportController.getAll);

// GET /api/reports/:id - Rapor detayı
router.get('/:id', reportController.getById);

// POST /api/reports - Yeni rapor oluştur
router.post('/', reportController.create);

// PUT /api/reports/:id - Rapor güncelle
router.put('/:id', reportController.update);

// DELETE /api/reports/:id - Rapor sil
router.delete('/:id', reportController.delete);

// GET /api/reports/:id/export - Raporu export et (PDF/Excel)
router.get('/:id/export', reportController.export);

export default router;
