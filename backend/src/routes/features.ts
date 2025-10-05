import { Router } from 'express';
import { featureController } from '../controllers/featureController';

const router = Router();

// GET /api/features - Tüm feature'ları listele
router.get('/', featureController.getAll);

// GET /api/features/:id - Feature detayını getir
router.get('/:id', featureController.getById);

// POST /api/features - Yeni feature ekle
router.post('/', featureController.create);

// PUT /api/features/:id - Feature güncelle
router.put('/:id', featureController.update);

// DELETE /api/features/:id - Feature sil
router.delete('/:id', featureController.delete);

// GET /api/features/:id/competitors - Feature'a sahip rakipleri listele
router.get('/:id/competitors', featureController.getCompetitors);

export default router;
