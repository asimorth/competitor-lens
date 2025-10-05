import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { QueueService } from '../services/queueService';
import { ScreenshotAnalysisService } from '../services/screenshotAnalysisService';
import fs from 'fs/promises';

const router = Router();
const prisma = new PrismaClient();
const queueService = new QueueService();
const analysisService = new ScreenshotAnalysisService();

// Validation schemas
const scanSchema = z.object({
  directoryPath: z.string().optional(),
  competitorName: z.string().optional()
});

const analyzeSchema = z.object({
  force: z.boolean().optional().default(false)
});

const assignFeatureSchema = z.object({
  featureId: z.string().uuid(),
  confidence: z.number().min(0).max(1).optional()
});

/**
 * POST /api/screenshots/scan
 * Dizin tarama işlemini başlat
 */
router.post('/scan', async (req, res) => {
  try {
    const { directoryPath, competitorName } = scanSchema.parse(req.body);
    
    // Default path
    const scanPath = directoryPath || '/uploads/screenshots';
    
    // Dizin var mı kontrol et
    try {
      await fs.access(scanPath);
    } catch {
      return res.status(400).json({
        error: 'Directory not found',
        path: scanPath
      });
    }
    
    // Batch scan job'ı ekle
    const job = await queueService.addBatchScanJob({
      directoryPath: scanPath,
      competitorName
    });
    
    res.json({
      success: true,
      message: 'Scan job queued',
      jobId: job.id,
      scanPath
    });
    
  } catch (error) {
    console.error('Scan error:', error);
    res.status(500).json({
      error: 'Failed to start scan',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/screenshots/scan-status/:jobId
 * Tarama işleminin durumunu sorgula
 */
router.get('/scan-status/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;
    
    // Job durumunu kontrol et
    const queues = await queueService.getAllQueueStatus();
    const batchScanQueue = queues.find(q => q.name === 'batch-scan');
    
    res.json({
      jobId,
      queueStatus: batchScanQueue,
      // TODO: Specific job status implementation
    });
    
  } catch (error) {
    console.error('Status check error:', error);
    res.status(500).json({
      error: 'Failed to check scan status'
    });
  }
});

/**
 * POST /api/screenshots/analyze/:id
 * Belirli bir screenshot'ı analiz et
 */
router.post('/analyze/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { force } = analyzeSchema.parse(req.body);
    
    // Screenshot'ı bul
    const screenshot = await prisma.screenshot.findUnique({
      where: { id },
      include: {
        analyses: {
          orderBy: { analyzedAt: 'desc' },
          take: 1
        }
      }
    });
    
    if (!screenshot) {
      return res.status(404).json({ error: 'Screenshot not found' });
    }
    
    // Daha önce analiz edilmiş mi kontrol et
    if (screenshot.analyses.length > 0 && !force) {
      return res.json({
        message: 'Screenshot already analyzed',
        analysis: screenshot.analyses[0]
      });
    }
    
    // Analiz job'ı ekle
    const job = await queueService.addAnalysisJob({
      screenshotId: screenshot.id,
      filePath: screenshot.filePath,
      competitorId: screenshot.competitorId,
      isOnboarding: screenshot.isOnboarding
    });
    
    res.json({
      success: true,
      message: 'Analysis job queued',
      jobId: job.id,
      screenshotId: screenshot.id
    });
    
  } catch (error) {
    console.error('Analyze error:', error);
    res.status(500).json({
      error: 'Failed to analyze screenshot',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * PUT /api/screenshots/:id/assign-feature
 * Screenshot'a feature ata
 */
router.put('/:id/assign-feature', async (req, res) => {
  try {
    const { id } = req.params;
    const { featureId, confidence } = assignFeatureSchema.parse(req.body);
    
    // Screenshot'ı kontrol et
    const screenshot = await prisma.screenshot.findUnique({
      where: { id }
    });
    
    if (!screenshot) {
      return res.status(404).json({ error: 'Screenshot not found' });
    }
    
    // Feature'ı kontrol et
    const feature = await prisma.feature.findUnique({
      where: { id: featureId }
    });
    
    if (!feature) {
      return res.status(404).json({ error: 'Feature not found' });
    }
    
    // Screenshot'ı güncelle
    const updated = await prisma.screenshot.update({
      where: { id },
      data: { featureId }
    });
    
    // Analiz varsa manual override olarak işaretle
    const latestAnalysis = await prisma.screenshotAnalysis.findFirst({
      where: { screenshotId: id },
      orderBy: { analyzedAt: 'desc' }
    });
    
    if (latestAnalysis) {
      await prisma.screenshotAnalysis.update({
        where: { id: latestAnalysis.id },
        data: {
          manualOverride: true,
          featurePrediction: feature.name,
          confidenceScore: confidence || latestAnalysis.confidenceScore
        }
      });
    }
    
    res.json({
      success: true,
      screenshot: updated,
      feature
    });
    
  } catch (error) {
    console.error('Assign feature error:', error);
    res.status(500).json({
      error: 'Failed to assign feature',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/screenshots/analysis-summary
 * Analiz özeti
 */
router.get('/analysis-summary', async (req, res) => {
  try {
    const [
      totalScreenshots,
      analyzedScreenshots,
      assignedFeatures,
      pendingAnalysis
    ] = await Promise.all([
      prisma.screenshot.count(),
      prisma.screenshot.count({
        where: {
          analyses: { some: {} }
        }
      }),
      prisma.screenshot.count({
        where: { featureId: { not: null } }
      }),
      prisma.screenshot.count({
        where: {
          analyses: { none: {} }
        }
      })
    ]);
    
    // Feature dağılımı
    const featureDistribution = await prisma.screenshot.groupBy({
      by: ['featureId'],
      where: { featureId: { not: null } },
      _count: true
    });
    
    // Confidence dağılımı
    const confidenceRanges = await prisma.screenshotAnalysis.groupBy({
      by: ['manualOverride'],
      _avg: { confidenceScore: true },
      _count: true
    });
    
    res.json({
      summary: {
        totalScreenshots,
        analyzedScreenshots,
        assignedFeatures,
        pendingAnalysis,
        analysisRate: totalScreenshots > 0 
          ? ((analyzedScreenshots / totalScreenshots) * 100).toFixed(2) + '%'
          : '0%'
      },
      featureDistribution,
      confidenceRanges
    });
    
  } catch (error) {
    console.error('Summary error:', error);
    res.status(500).json({
      error: 'Failed to get analysis summary'
    });
  }
});

/**
 * POST /api/screenshots/batch-analyze
 * Toplu analiz başlat
 */
router.post('/batch-analyze', async (req, res) => {
  try {
    // Analiz edilmemiş screenshot'ları bul
    const unanalyzedScreenshots = await prisma.screenshot.findMany({
      where: {
        analyses: { none: {} }
      },
      take: 100 // Max 100 adet
    });
    
    if (unanalyzedScreenshots.length === 0) {
      return res.json({
        message: 'No screenshots to analyze',
        count: 0
      });
    }
    
    // Her biri için analiz job'ı ekle
    const jobs = [];
    for (const screenshot of unanalyzedScreenshots) {
      const job = await queueService.addAnalysisJob({
        screenshotId: screenshot.id,
        filePath: screenshot.filePath,
        competitorId: screenshot.competitorId,
        isOnboarding: screenshot.isOnboarding
      });
      jobs.push(job.id);
    }
    
    res.json({
      success: true,
      message: `${jobs.length} analysis jobs queued`,
      jobIds: jobs,
      count: jobs.length
    });
    
  } catch (error) {
    console.error('Batch analyze error:', error);
    res.status(500).json({
      error: 'Failed to start batch analysis'
    });
  }
});

/**
 * GET /api/screenshots/:id/analysis
 * Screenshot'ın analiz sonuçlarını getir
 */
router.get('/:id/analysis', async (req, res) => {
  try {
    const { id } = req.params;
    
    const screenshot = await prisma.screenshot.findUnique({
      where: { id },
      include: {
        analyses: {
          orderBy: { analyzedAt: 'desc' }
        },
        feature: true,
        competitor: true
      }
    });
    
    if (!screenshot) {
      return res.status(404).json({ error: 'Screenshot not found' });
    }
    
    res.json({
      screenshot,
      latestAnalysis: screenshot.analyses[0] || null,
      allAnalyses: screenshot.analyses
    });
    
  } catch (error) {
    console.error('Get analysis error:', error);
    res.status(500).json({
      error: 'Failed to get analysis results'
    });
  }
});

export default router;
