import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';

const router = Router();
const prisma = new PrismaClient();

// Multer configuration for onboarding uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const competitorId = req.params.competitorId;
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
      'onboarding'
    );
    
    // Dizini oluştur
    await fs.mkdir(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    cb(null, `onboarding_${timestamp}${ext}`);
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

// Validation schemas
const createOnboardingSchema = z.object({
  stepNumber: z.number().int().positive().optional(),
  stepDescription: z.string().optional(),
  displayOrder: z.number().int().min(0).optional()
});

const updateOnboardingSchema = z.object({
  stepNumber: z.number().int().positive().optional(),
  stepDescription: z.string().optional(),
  displayOrder: z.number().int().min(0).optional()
});

const reorderSchema = z.object({
  screenshots: z.array(z.object({
    id: z.string().uuid(),
    displayOrder: z.number().int().min(0)
  }))
});

/**
 * GET /api/competitors/:competitorId/onboarding
 * Competitor'ın onboarding screenshot'larını getir
 */
router.get('/:competitorId/onboarding', async (req, res) => {
  try {
    const { competitorId } = req.params;
    
    const competitor = await prisma.competitor.findUnique({
      where: { id: competitorId },
      include: {
        onboardingScreenshots: {
          orderBy: [
            { displayOrder: 'asc' },
            { stepNumber: 'asc' },
            { createdAt: 'asc' }
          ]
        }
      }
    });
    
    if (!competitor) {
      return res.status(404).json({ error: 'Competitor not found' });
    }
    
    res.json({
      competitor: {
        id: competitor.id,
        name: competitor.name
      },
      onboardingScreenshots: competitor.onboardingScreenshots,
      totalSteps: competitor.onboardingScreenshots.length
    });
    
  } catch (error) {
    console.error('Get onboarding error:', error);
    res.status(500).json({
      error: 'Failed to get onboarding screenshots'
    });
  }
});

/**
 * POST /api/competitors/:competitorId/onboarding
 * Onboarding screenshot yükle
 */
router.post('/:competitorId/onboarding', 
  upload.single('screenshot'), 
  async (req, res) => {
    try {
      const { competitorId } = req.params;
      const data = createOnboardingSchema.parse(req.body);
      
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }
      
      // Competitor'ı kontrol et
      const competitor = await prisma.competitor.findUnique({
        where: { id: competitorId }
      });
      
      if (!competitor) {
        // Yüklenen dosyayı sil
        await fs.unlink(req.file.path);
        return res.status(404).json({ error: 'Competitor not found' });
      }
      
      // Display order belirle
      let displayOrder = data.displayOrder;
      if (displayOrder === undefined) {
        const lastScreenshot = await prisma.onboardingScreenshot.findFirst({
          where: { competitorId },
          orderBy: { displayOrder: 'desc' }
        });
        displayOrder = lastScreenshot ? lastScreenshot.displayOrder + 1 : 0;
      }
      
      // Onboarding screenshot kaydı oluştur
      const onboardingScreenshot = await prisma.onboardingScreenshot.create({
        data: {
          competitorId,
          screenshotPath: req.file.path,
          stepNumber: data.stepNumber,
          stepDescription: data.stepDescription,
          displayOrder
        }
      });
      
      // Ana screenshot tablosuna da ekle (analiz için)
      await prisma.screenshot.create({
        data: {
          competitorId,
          filePath: req.file.path,
          fileName: req.file.filename,
          fileSize: req.file.size,
          mimeType: req.file.mimetype,
          isOnboarding: true,
          uploadSource: 'manual'
        }
      });
      
      res.status(201).json({
        success: true,
        onboardingScreenshot
      });
      
    } catch (error) {
      console.error('Upload onboarding error:', error);
      
      // Hata durumunda dosyayı temizle
      if (req.file) {
        try {
          await fs.unlink(req.file.path);
        } catch {}
      }
      
      res.status(500).json({
        error: 'Failed to upload onboarding screenshot',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * PUT /api/onboarding/:id
 * Onboarding screenshot bilgilerini güncelle
 */
router.put('/onboarding/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const data = updateOnboardingSchema.parse(req.body);
    
    const screenshot = await prisma.onboardingScreenshot.findUnique({
      where: { id }
    });
    
    if (!screenshot) {
      return res.status(404).json({ error: 'Onboarding screenshot not found' });
    }
    
    const updated = await prisma.onboardingScreenshot.update({
      where: { id },
      data
    });
    
    res.json({
      success: true,
      onboardingScreenshot: updated
    });
    
  } catch (error) {
    console.error('Update onboarding error:', error);
    res.status(500).json({
      error: 'Failed to update onboarding screenshot'
    });
  }
});

/**
 * DELETE /api/onboarding/:id
 * Onboarding screenshot sil
 */
router.delete('/onboarding/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const screenshot = await prisma.onboardingScreenshot.findUnique({
      where: { id }
    });
    
    if (!screenshot) {
      return res.status(404).json({ error: 'Onboarding screenshot not found' });
    }
    
    // Veritabanından sil
    await prisma.onboardingScreenshot.delete({
      where: { id }
    });
    
    // Dosyayı sil
    try {
      await fs.unlink(screenshot.screenshotPath);
    } catch (error) {
      console.error('Failed to delete file:', error);
    }
    
    // Ana screenshot tablosundan da sil
    await prisma.screenshot.deleteMany({
      where: {
        filePath: screenshot.screenshotPath
      }
    });
    
    res.json({
      success: true,
      message: 'Onboarding screenshot deleted'
    });
    
  } catch (error) {
    console.error('Delete onboarding error:', error);
    res.status(500).json({
      error: 'Failed to delete onboarding screenshot'
    });
  }
});

/**
 * PUT /api/competitors/:competitorId/onboarding/reorder
 * Onboarding screenshot'larını yeniden sırala
 */
router.put('/:competitorId/onboarding/reorder', async (req, res) => {
  try {
    const { competitorId } = req.params;
    const { screenshots } = reorderSchema.parse(req.body);
    
    // Competitor'ı kontrol et
    const competitor = await prisma.competitor.findUnique({
      where: { id: competitorId }
    });
    
    if (!competitor) {
      return res.status(404).json({ error: 'Competitor not found' });
    }
    
    // Transaction ile güncelle
    await prisma.$transaction(
      screenshots.map(({ id, displayOrder }) =>
        prisma.onboardingScreenshot.update({
          where: { id },
          data: { displayOrder }
        })
      )
    );
    
    res.json({
      success: true,
      message: 'Onboarding screenshots reordered'
    });
    
  } catch (error) {
    console.error('Reorder error:', error);
    res.status(500).json({
      error: 'Failed to reorder screenshots'
    });
  }
});

/**
 * GET /api/onboarding/stats
 * Onboarding istatistikleri
 */
router.get('/onboarding/stats', async (req, res) => {
  try {
    const stats = await prisma.competitor.findMany({
      select: {
        id: true,
        name: true,
        _count: {
          select: {
            onboardingScreenshots: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });
    
    const totalScreenshots = await prisma.onboardingScreenshot.count();
    const competitorsWithOnboarding = stats.filter(
      c => c._count.onboardingScreenshots > 0
    ).length;
    
    res.json({
      totalScreenshots,
      competitorsWithOnboarding,
      totalCompetitors: stats.length,
      competitorStats: stats.map(c => ({
        id: c.id,
        name: c.name,
        screenshotCount: c._count.onboardingScreenshots
      }))
    });
    
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({
      error: 'Failed to get onboarding stats'
    });
  }
});

export default router;
