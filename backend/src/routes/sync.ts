import { Router } from 'express';
import { z } from 'zod';
import { SyncService } from '../services/syncService';
import { QueueService } from '../services/queueService';
import { PrismaClient } from '@prisma/client';
import * as XLSX from 'xlsx';
import * as path from 'path';
import * as fs from 'fs';
import { syncScreenshotsToDatabase } from '../scripts/syncScreenshotsToDatabase';

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
 * POST /api/sync/screenshots
 * Screenshot'ları file system'den database'e senkronize et
 * Admin only endpoint
 */
router.post('/screenshots', async (req, res) => {
  try {
    // Admin authentication
    const adminSecret = req.headers['x-admin-secret'];
    
    if (!adminSecret || adminSecret !== process.env.JWT_SECRET) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid or missing admin secret'
      });
    }

    // Dry run check
    const dryRun = req.query.dryRun === 'true';

    console.log('🚀 Starting screenshot sync via API...');
    console.log(`Mode: ${dryRun ? 'DRY RUN' : 'LIVE'}\n`);

    // Run sync
    const stats = await syncScreenshotsToDatabase(dryRun);

    res.json({
      success: true,
      message: dryRun 
        ? 'Dry run completed - no changes were made'
        : 'Screenshot sync completed successfully',
      stats,
      dryRun
    });

  } catch (error) {
    console.error('Screenshot sync error:', error);
    res.status(500).json({
      error: 'Screenshot sync failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
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
      case 'keep-local': {
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
      }

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

/**
 * POST /api/sync/matrix
 * Matrix Excel dosyasını veritabanına senkronize et
 */
router.post('/matrix', async (req, res) => {
  try {
    const MATRIX_FILE = path.join(process.cwd(), 'Matrix/feature_matrix_FINAL_v3.xlsx');

    if (!fs.existsSync(MATRIX_FILE)) {
      return res.status(404).json({ error: 'Matrix file not found' });
    }

    // TR Exchange names
    const TR_EXCHANGES = new Set([
      'BinanceTR', 'Binance TR', 'Paribu', 'BTCTurk', 'BTC Turk',
      'Bitexen', 'Icrypex', 'CoinTR', 'Coin TR', 'KucoinTR', 'Kucoin TR',
      'OKX TR', 'BiLira', 'Ortak App', 'Garanti Kripto', 'GateTR', 'Gate TR',
      'Midas Kripto', 'BybitTR', 'Bybit TR', 'Kuantist'
    ]);

    function getRegion(competitorName: string): string {
      if (TR_EXCHANGES.has(competitorName)) return 'TR';
      if (competitorName.toLowerCase().includes('tr') || competitorName.toLowerCase().includes('turk')) return 'TR';
      return 'Global';
    }

    // Read Excel
    const workbook = XLSX.readFile(MATRIX_FILE);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');

    // Extract competitors
    const competitorNames: string[] = [];
    for (let row = 1; row <= range.e.r; row++) {
      const cellAddress = XLSX.utils.encode_cell({ r: row, c: 0 });
      const cell = worksheet[cellAddress];
      if (cell && cell.v) competitorNames.push(String(cell.v).trim());
    }

    // Extract features
    const featureNames: string[] = [];
    for (let col = 1; col <= range.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
      const cell = worksheet[cellAddress];
      if (cell && cell.v) featureNames.push(String(cell.v).trim());
    }

    // Sync competitors
    const competitorMap = new Map<string, string>();
    for (const name of competitorNames) {
      let competitor = await prisma.competitor.findUnique({ where: { name } });

      if (!competitor) {
        competitor = await prisma.competitor.create({ data: { name } });
      }
      competitorMap.set(name, competitor.id);
    }

    // Sync features
    const featureMap = new Map<string, string>();
    for (const name of featureNames) {
      let feature = await prisma.feature.findUnique({ where: { name } });
      if (!feature) {
        feature = await prisma.feature.create({ data: { name } });
      }
      featureMap.set(name, feature.id);
    }

    // Sync matrix
    let created = 0;
    let updated = 0;

    for (let row = 1; row <= range.e.r; row++) {
      const competitorName = String(worksheet[XLSX.utils.encode_cell({ r: row, c: 0 })]?.v || '').trim();
      const competitorId = competitorMap.get(competitorName);
      if (!competitorId) continue;

      for (let col = 1; col <= range.e.c; col++) {
        const featureName = String(worksheet[XLSX.utils.encode_cell({ r: 0, c: col })]?.v || '').trim();
        const featureId = featureMap.get(featureName);
        if (!featureId) continue;

        const cellValue = String(worksheet[XLSX.utils.encode_cell({ r: row, c: col })]?.v || '').trim().toLowerCase();
        let hasFeature = false;
        let quality = 'none';

        if (['1', 'yes', 'true'].includes(cellValue)) {
          hasFeature = true;
          quality = 'basic';
        } else if (['excellent', 'good', 'basic'].includes(cellValue)) {
          hasFeature = true;
          quality = cellValue;
        }

        const existing = await prisma.competitorFeature.findUnique({
          where: { competitorId_featureId: { competitorId, featureId } }
        });

        if (!existing) {
          await prisma.competitorFeature.create({
            data: { competitorId, featureId, hasFeature, implementationQuality: quality }
          });
          created++;
        } else {
          await prisma.competitorFeature.update({
            where: { id: existing.id },
            data: { hasFeature, implementationQuality: quality }
          });
          updated++;
        }
      }
    }

    res.json({
      success: true,
      message: 'Matrix sync complete',
      stats: {
        competitors: competitorNames.length,
        features: featureNames.length,
        relationsCreated: created,
        relationsUpdated: updated
      }
    });

  } catch (error) {
    console.error('Matrix sync error:', error);
    res.status(500).json({
      error: 'Failed to sync matrix',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
