import { Router } from 'express';
import { z } from 'zod';
import { SyncService } from '../services/syncService';
import { QueueService } from '../services/queueService';
import { PrismaClient } from '@prisma/client';

const router = Router();
const syncService = new SyncService();
const queueService = new QueueService();
const prisma = new PrismaClient();

// Validation schemas
const triggerSyncSchema = z.object({
  type: z.enum(['full', 'partial', 'retry']).default('full'),
  screenshotIds: z.array(z.string().uuid()).optional()
});

const resolveConflictSchema = z.object({
  resolution: z.enum(['keep-local', 'keep-server', 'merge']),
  mergeStrategy: z.object({
    keepLocalPath: z.boolean().optional(),
    keepServerPath: z.boolean().optional(),
    updateHash: z.boolean().optional()
  }).optional()
});

/**
 * POST /api/sync/trigger
 * Sync işlemini tetikle
 */
router.post('/trigger', async (req, res) => {
  try {
    const data = triggerSyncSchema.parse(req.body);
    
    // Partial sync için screenshot ID'leri kontrol et
    if (data.type === 'partial' && (!data.screenshotIds || data.screenshotIds.length === 0)) {
      return res.status(400).json({
        error: 'Screenshot IDs required for partial sync'
      });
    }
    
    // Sync job'ı ekle
    const job = await queueService.addSyncJob({
      type: data.type,
      screenshotIds: data.screenshotIds
    });
    
    res.json({
      success: true,
      message: `${data.type} sync job queued`,
      jobId: job.id
    });
    
  } catch (error) {
    console.error('Trigger sync error:', error);
    res.status(500).json({
      error: 'Failed to trigger sync',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/sync/status
 * Sync durumunu getir
 */
router.get('/status', async (req, res) => {
  try {
    // Sync istatistikleri
    const stats = await syncService.getSyncStats();
    
    // Queue durumu
    const queueStatus = await queueService.getQueueStatus('sync');
    
    // Son sync zamanı
    const lastSync = await prisma.syncStatus.findFirst({
      where: { syncStatus: 'synced' },
      orderBy: { lastSyncedAt: 'desc' },
      select: { lastSyncedAt: true }
    });
    
    // Başarısız sync'ler
    const failedSyncs = await prisma.syncStatus.findMany({
      where: { syncStatus: 'failed' },
      select: {
        id: true,
        screenshotId: true,
        localPath: true,
        errorMessage: true,
        retryCount: true,
        updatedAt: true
      },
      orderBy: { updatedAt: 'desc' },
      take: 10
    });
    
    res.json({
      stats,
      queue: queueStatus,
      lastSyncTime: lastSync?.lastSyncedAt || null,
      failedSyncs,
      isHealthy: stats.failed < stats.total * 0.05 // %5'ten az fail varsa healthy
    });
    
  } catch (error) {
    console.error('Get sync status error:', error);
    res.status(500).json({
      error: 'Failed to get sync status'
    });
  }
});

/**
 * POST /api/sync/resolve-conflict/:id
 * Sync çakışmasını çöz
 */
router.post('/resolve-conflict/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { resolution, mergeStrategy } = resolveConflictSchema.parse(req.body);
    
    // Sync status'u bul
    const syncStatus = await prisma.syncStatus.findUnique({
      where: { id },
      include: { screenshot: true }
    });
    
    if (!syncStatus) {
      return res.status(404).json({ error: 'Sync status not found' });
    }
    
    let result;
    
    switch (resolution) {
      case 'keep-local':
        // Local versiyonu server'a yükle
        await prisma.syncStatus.update({
          where: { id },
          data: { syncStatus: 'pending' }
        });
        
        const syncJob = await queueService.addSyncJob({
          type: 'partial',
          screenshotIds: [syncStatus.screenshotId]
        });
        
        result = {
          action: 'keep-local',
          message: 'Local version will be uploaded to server',
          jobId: syncJob.id
        };
        break;
        
      case 'keep-server':
        // Server versiyonunu kullan (CDN URL'i güncelle)
        if (syncStatus.serverPath) {
          await prisma.screenshot.update({
            where: { id: syncStatus.screenshotId },
            data: {
              cdnUrl: `${process.env.CDN_URL}/${syncStatus.serverPath}`
            }
          });
          
          await prisma.syncStatus.update({
            where: { id },
            data: {
              syncStatus: 'synced',
              lastSyncedAt: new Date()
            }
          });
        }
        
        result = {
          action: 'keep-server',
          message: 'Using server version'
        };
        break;
        
      case 'merge':
        // Merge stratejisine göre işle
        if (mergeStrategy) {
          const updates: any = {};
          
          if (mergeStrategy.updateHash) {
            // Hash'i yeniden hesapla
            const newHash = await syncService.calculateFileHash(syncStatus.localPath);
            updates.fileHash = newHash;
          }
          
          await prisma.syncStatus.update({
            where: { id },
            data: {
              ...updates,
              syncStatus: 'pending'
            }
          });
        }
        
        result = {
          action: 'merge',
          message: 'Merge strategy applied'
        };
        break;
    }
    
    res.json({
      success: true,
      ...result
    });
    
  } catch (error) {
    console.error('Resolve conflict error:', error);
    res.status(500).json({
      error: 'Failed to resolve conflict',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/sync/pending
 * Bekleyen sync'leri listele
 */
router.get('/pending', async (req, res) => {
  try {
    const pendingSyncs = await prisma.syncStatus.findMany({
      where: { syncStatus: 'pending' },
      include: {
        screenshot: {
          include: {
            competitor: true,
            feature: true
          }
        }
      },
      orderBy: { createdAt: 'asc' },
      take: 50
    });
    
    res.json({
      count: pendingSyncs.length,
      screenshots: pendingSyncs.map(sync => ({
        syncId: sync.id,
        screenshotId: sync.screenshotId,
        localPath: sync.localPath,
        competitor: sync.screenshot.competitor.name,
        feature: sync.screenshot.feature?.name || 'Uncategorized',
        createdAt: sync.createdAt
      }))
    });
    
  } catch (error) {
    console.error('Get pending syncs error:', error);
    res.status(500).json({
      error: 'Failed to get pending syncs'
    });
  }
});

/**
 * POST /api/sync/retry-failed
 * Başarısız sync'leri yeniden dene
 */
router.post('/retry-failed', async (req, res) => {
  try {
    const job = await queueService.addSyncJob({
      type: 'retry'
    });
    
    res.json({
      success: true,
      message: 'Retry job queued for failed syncs',
      jobId: job.id
    });
    
  } catch (error) {
    console.error('Retry failed syncs error:', error);
    res.status(500).json({
      error: 'Failed to retry failed syncs'
    });
  }
});

/**
 * GET /api/sync/history
 * Sync geçmişi
 */
router.get('/history', async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;
    
    const [total, syncs] = await Promise.all([
      prisma.syncStatus.count({
        where: { syncStatus: 'synced' }
      }),
      prisma.syncStatus.findMany({
        where: { syncStatus: 'synced' },
        include: {
          screenshot: {
            include: {
              competitor: true,
              feature: true
            }
          }
        },
        orderBy: { lastSyncedAt: 'desc' },
        skip,
        take: limit
      })
    ]);
    
    res.json({
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      syncs: syncs.map(sync => ({
        id: sync.id,
        screenshotId: sync.screenshotId,
        competitor: sync.screenshot.competitor.name,
        feature: sync.screenshot.feature?.name || 'Uncategorized',
        localPath: sync.localPath,
        serverPath: sync.serverPath,
        fileHash: sync.fileHash,
        lastSyncedAt: sync.lastSyncedAt,
        cdnUrl: sync.screenshot.cdnUrl
      }))
    });
    
  } catch (error) {
    console.error('Get sync history error:', error);
    res.status(500).json({
      error: 'Failed to get sync history'
    });
  }
});

/**
 * DELETE /api/sync/cache
 * Sync cache'i temizle
 */
router.delete('/cache', async (req, res) => {
  try {
    // Başarılı sync'lerin eski kayıtlarını temizle (30 günden eski)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const deleted = await prisma.syncStatus.deleteMany({
      where: {
        syncStatus: 'synced',
        lastSyncedAt: {
          lt: thirtyDaysAgo
        }
      }
    });
    
    res.json({
      success: true,
      message: `Deleted ${deleted.count} old sync records`
    });
    
  } catch (error) {
    console.error('Clear cache error:', error);
    res.status(500).json({
      error: 'Failed to clear sync cache'
    });
  }
});

export default router;
