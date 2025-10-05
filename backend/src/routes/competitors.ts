import { Router } from 'express';
import { competitorController } from '../controllers/competitorController';

const router = Router();

// GET /api/competitors - Tüm rakipleri listele
router.get('/', competitorController.getAll);

// GET /api/competitors/:id - Rakip detayını getir
router.get('/:id', competitorController.getById);

// POST /api/competitors - Yeni rakip ekle
router.post('/', competitorController.create);

// PUT /api/competitors/:id - Rakip güncelle
router.put('/:id', competitorController.update);

// DELETE /api/competitors/:id - Rakip sil
router.delete('/:id', competitorController.delete);

export default router;
