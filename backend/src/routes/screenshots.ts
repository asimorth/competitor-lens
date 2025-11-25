import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { getS3Service } from '../services/s3Service';

const router = Router();
const prisma = new PrismaClient();

// Multer configuration
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    try {
      const competitorId = req.body.competitorId;
      if (!competitorId) {
        return cb(new Error('Competitor ID is required'), '');
      }

      const competitor = await prisma.competitor.findUnique({
        where: { id: competitorId }
      });

      if (!competitor) {
        return cb(new Error('Competitor not found'), '');
      }

      const uploadPath = path.join(
        process.cwd(),
        'uploads/screenshots',
        competitor.name,
        'features'
      );

      await fs.mkdir(uploadPath, { recursive: true });
      cb(null, uploadPath);
    } catch (error) {
      cb(error as Error, '');
    }
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    cb(null, `feature_${timestamp}${ext}`);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  }
});

/**
 * POST /api/screenshots
 * Feature screenshot yükle
 */
router.post('/', upload.single('screenshot'), async (req, res) => {
  try {
    const { competitorId, featureId } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    if (!competitorId) {
      await fs.unlink(req.file.path);
      return res.status(400).json({ error: 'Competitor ID is required' });
    }

    // Competitor var mı kontrol et
    const competitor = await prisma.competitor.findUnique({
      where: { id: competitorId }
    });

    if (!competitor) {
      await fs.unlink(req.file.path);
      return res.status(404).json({ error: 'Competitor not found' });
    }

    // S3 Upload logic
    let cdnUrl: string | null = null;
    const s3Service = getS3Service();

    if (process.env.S3_BUCKET) {
      try {
        const s3Key = s3Service.generateS3Key(competitor.name, 'features', req.file.originalname);
        cdnUrl = await s3Service.uploadFile(req.file.path, s3Key, req.file.mimetype);
      } catch (error) {
        console.error('S3 upload failed:', error);
      }
    }

    // Screenshot kaydı oluştur
    const screenshot = await prisma.screenshot.create({
      data: {
        competitorId,
        featureId: featureId || null,
        filePath: req.file.path,
        fileName: req.file.filename,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        isOnboarding: false,
        uploadSource: 'manual',
        cdnUrl: cdnUrl
      },
      include: {
        competitor: true,
        feature: true
      }
    });

    res.status(201).json({
      success: true,
      data: screenshot
    });

  } catch (error) {
    console.error('Upload screenshot error:', error);
    if (req.file) {
      try { await fs.unlink(req.file.path); } catch { }
    }
    res.status(500).json({
      error: 'Failed to upload screenshot',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/screenshots/restore
 * Dosyaları DB kaydı oluşturmadan diske geri yükle (Recovery)
 */
router.post('/restore', upload.single('screenshot'), async (req, res) => {
  try {
    const { competitorId } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Competitor check
    const competitor = await prisma.competitor.findUnique({
      where: { id: competitorId }
    });

    if (!competitor) {
      await fs.unlink(req.file.path);
      return res.status(404).json({ error: 'Competitor not found' });
    }

    // File is already saved by multer to the correct path based on competitorId
    // We just need to confirm success.
    // Multer storage engine uses competitorId from body to determine path.

    // Optional: Update existing record's fileSize/updatedAt if needed
    // But for pure file restoration, we can skip DB ops or just touch it.

    res.json({ success: true, message: 'File restored', path: req.file.path });

  } catch (error) {
    console.error('Restore error:', error);
    if (req.file) {
      try { await fs.unlink(req.file.path); } catch { }
    }
    res.status(500).json({ error: 'Failed to restore file' });
  }
});

// Validation schemas
const querySchema = z.object({
  featureId: z.string().uuid().optional(),
  competitorId: z.string().uuid().optional(),
  isOnboarding: z.string().optional().transform(val => val === 'true'),
  region: z.string().optional() // YENİ: TR, Global filter
});

/**
 * GET /api/screenshots
 * Tüm screenshot'ları listele (filtrelerle)
 */
router.get('/', async (req, res) => {
  try {
    const { featureId, competitorId, isOnboarding, region } = querySchema.parse(req.query);

    const where: any = {};

    if (featureId) {
      where.featureId = featureId;
    }

    if (competitorId) {
      where.competitorId = competitorId;
    }

    if (isOnboarding !== undefined) {
      where.isOnboarding = isOnboarding;
    }

    // YENİ: Region filter
    if (region) {
      where.competitor = {
        region: region
      };
    }

    const screenshots = await prisma.screenshot.findMany({
      where,
      include: {
        competitor: {
          select: {
            id: true,
            name: true,
            logoUrl: true,
            region: true // YENİ: Region bilgisi ekle
          }
        },
        feature: {
          select: {
            id: true,
            name: true,
            category: true
          }
        },
        analyses: {
          take: 1,
          orderBy: {
            analyzedAt: 'desc'
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({
      success: true,
      data: screenshots,
      count: screenshots.length
    });

  } catch (error) {
    console.error('Screenshots error:', error);
    res.status(500).json({
      error: 'Failed to get screenshots',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/screenshots/competitor/:competitorId
 * Belirli bir competitor'ın tüm screenshot'larını getir
 */
router.get('/competitor/:competitorId', async (req, res) => {
  try {
    const { competitorId } = req.params;

    // Competitor var mı kontrol et
    const competitor = await prisma.competitor.findUnique({
      where: { id: competitorId }
    });

    if (!competitor) {
      return res.status(404).json({
        error: 'Competitor not found'
      });
    }

    // Screenshot'ları getir
    const screenshots = await prisma.screenshot.findMany({
      where: {
        competitorId
      },
      include: {
        feature: {
          select: {
            id: true,
            name: true,
            category: true
          }
        },
        analyses: {
          take: 1,
          orderBy: {
            analyzedAt: 'desc'
          },
          select: {
            featurePrediction: true,
            confidenceScore: true
          }
        }
      },
      orderBy: [
        { isOnboarding: 'desc' }, // Onboarding'ler önce
        { createdAt: 'desc' }
      ]
    });

    // Feature bazında grupla
    const groupedByFeature = screenshots.reduce((acc: any, screenshot: any) => {
      const featureKey = screenshot.featureId || 'uncategorized';
      const featureName = screenshot.feature?.name || 'Kategorisiz';

      if (!acc[featureKey]) {
        acc[featureKey] = {
          featureId: screenshot.featureId,
          featureName: featureName,
          category: screenshot.feature?.category || null,
          screenshots: []
        };
      }

      acc[featureKey].screenshots.push(screenshot);
      return acc;
    }, {});

    res.json({
      success: true,
      data: screenshots,
      grouped: Object.values(groupedByFeature),
      count: screenshots.length,
      competitor: {
        id: competitor.id,
        name: competitor.name,
        logoUrl: competitor.logoUrl
      }
    });

  } catch (error) {
    console.error('Competitor screenshots error:', error);
    res.status(500).json({
      error: 'Failed to get competitor screenshots',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/screenshots/feature/:featureId
 * Belirli bir feature'ın tüm screenshot'larını getir
 */
router.get('/feature/:featureId', async (req, res) => {
  try {
    const { featureId } = req.params;
    const { region } = req.query; // YENİ: Region filter

    // Feature var mı kontrol et
    const feature = await prisma.feature.findUnique({
      where: { id: featureId }
    });

    if (!feature) {
      return res.status(404).json({
        error: 'Feature not found'
      });
    }

    // Screenshot'ları getir
    const where: any = { featureId };

    // YENİ: Region filter
    if (region && typeof region === 'string') {
      where.competitor = {
        region: region
      };
    }

    const screenshots = await prisma.screenshot.findMany({
      where,
      include: {
        competitor: {
          select: {
            id: true,
            name: true,
            logoUrl: true,
            region: true // YENİ: Region bilgisi ekle
          }
        },
        analyses: {
          take: 1,
          orderBy: {
            analyzedAt: 'desc'
          },
          select: {
            confidenceScore: true,
            extractedText: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Competitor bazında grupla
    const groupedByCompetitor = screenshots.reduce((acc: any, screenshot: any) => {
      const competitorKey = screenshot.competitorId;
      const competitorName = screenshot.competitor?.name || 'Unknown';

      if (!acc[competitorKey]) {
        acc[competitorKey] = {
          competitorId: screenshot.competitorId,
          competitorName: competitorName,
          logoUrl: screenshot.competitor?.logoUrl || null,
          screenshots: []
        };
      }

      acc[competitorKey].screenshots.push(screenshot);
      return acc;
    }, {});

    res.json({
      success: true,
      data: screenshots,
      grouped: Object.values(groupedByCompetitor),
      count: screenshots.length,
      feature: {
        id: feature.id,
        name: feature.name,
        category: feature.category,
        description: feature.description
      }
    });

  } catch (error) {
    console.error('Feature screenshots error:', error);
    res.status(500).json({
      error: 'Failed to get feature screenshots',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/screenshots/:id
 * Tek bir screenshot'ın detayını getir
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const screenshot = await prisma.screenshot.findUnique({
      where: { id },
      include: {
        competitor: true,
        feature: true,
        analyses: {
          orderBy: {
            analyzedAt: 'desc'
          }
        },
        syncStatus: true
      }
    });

    if (!screenshot) {
      return res.status(404).json({
        error: 'Screenshot not found'
      });
    }

    res.json({
      success: true,
      data: screenshot
    });

  } catch (error) {
    console.error('Screenshot detail error:', error);
    res.status(500).json({
      error: 'Failed to get screenshot',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * PUT /api/screenshots/:id/feature
 * Screenshot'ın feature ilişkisini güncelle
 */
router.put('/:id/feature', async (req, res) => {
  try {
    const { id } = req.params;
    const { featureId } = req.body;

    // Screenshot var mı kontrol et
    const screenshot = await prisma.screenshot.findUnique({
      where: { id }
    });

    if (!screenshot) {
      return res.status(404).json({
        error: 'Screenshot not found'
      });
    }

    // Feature varsa kontrol et
    if (featureId) {
      const feature = await prisma.feature.findUnique({
        where: { id: featureId }
      });

      if (!feature) {
        return res.status(404).json({
          error: 'Feature not found'
        });
      }
    }

    // Screenshot'ı güncelle
    const updatedScreenshot = await prisma.screenshot.update({
      where: { id },
      data: {
        featureId: featureId || null
      },
      include: {
        competitor: true,
        feature: true
      }
    });

    res.json({
      success: true,
      data: updatedScreenshot,
      message: 'Screenshot feature updated successfully'
    });

  } catch (error) {
    console.error('Update screenshot feature error:', error);
    res.status(500).json({
      error: 'Failed to update screenshot feature',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * DELETE /api/screenshots/:id
 * Screenshot'ı sil
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Screenshot var mı kontrol et
    const screenshot = await prisma.screenshot.findUnique({
      where: { id }
    });

    if (!screenshot) {
      return res.status(404).json({
        error: 'Screenshot not found'
      });
    }

    // Screenshot'ı sil (cascade delete ile ilişkiler de silinir)
    await prisma.screenshot.delete({
      where: { id }
    });

    // TODO: Fiziksel dosyayı da silmek gerekirse buraya eklenebilir
    // import fs from 'fs/promises';
    // try {
    //   await fs.unlink(screenshot.filePath);
    // } catch (err) {
    //   console.error('Failed to delete physical file:', err);
    // }

    res.json({
      success: true,
      message: 'Screenshot deleted successfully'
    });

  } catch (error) {
    console.error('Delete screenshot error:', error);
    res.status(500).json({
      error: 'Failed to delete screenshot',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;

