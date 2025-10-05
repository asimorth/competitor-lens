import { Router } from 'express';
import multer from 'multer';
import { uploadController } from '../controllers/uploadController';

const router = Router();

// Multer configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, process.env.UPLOAD_DIR || './uploads');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + '.' + file.originalname.split('.').pop());
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760') // 10MB default
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/png', 'image/jpeg', 'application/pdf', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PNG, JPEG, PDF, and Excel files are allowed.'));
    }
  }
});

// POST /api/uploads/file - Dosya yükle (PNG, PDF)
router.post('/file', upload.single('file'), uploadController.uploadFile);

// POST /api/uploads/excel - Excel dosyası yükle ve parse et
router.post('/excel', upload.single('excel'), uploadController.uploadExcel);

// GET /api/uploads/:id - Dosya bilgisini getir
router.get('/:id', uploadController.getFile);

// DELETE /api/uploads/:id - Dosyayı sil
router.delete('/:id', uploadController.deleteFile);

// GET /api/uploads - Tüm dosyaları listele
router.get('/', uploadController.getAll);

export default router;
