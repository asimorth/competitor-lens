import { Queue, Worker, Job } from 'bullmq';
import Redis from 'ioredis';
import { ScreenshotAnalysisService } from './screenshotAnalysisService';
import { SyncService } from './syncService';
import path from 'path';
import fs from 'fs/promises';
import { prisma } from '../lib/db';

// Redis connection (optional)
// Redis connection (optional)
let connection: Redis | null = null;

const redisUrl = process.env.REDIS_URL;
const redisHost = process.env.REDIS_HOST;
const redisPort = process.env.REDIS_PORT;

// Only attempt connection if configuration is present
if (redisUrl || redisHost) {
  try {
    const options: any = {
      maxRetriesPerRequest: null,
      lazyConnect: true,
      retryStrategy: (times: number) => {
        if (times > 3) return null; // Stop retrying after 3 attempts
        return Math.min(times * 50, 2000);
      }
    };

    if (redisUrl) {
      connection = new Redis(redisUrl, options);
    } else {
      connection = new Redis({
        host: redisHost || 'localhost',
        port: parseInt(redisPort || '6379'),
        ...options
      });
    }

    // Handle connection errors without crashing
    connection.on('error', (err) => {
      console.warn('Redis connection error:', err.message);
      // Don't crash, just warn. QueueService handles null connection.
    });

  } catch (error) {
    console.warn('Redis initialization failed, queue features will be disabled');
    connection = null;
  }
} else {
  console.log('ℹ️ No Redis configuration found (REDIS_URL or REDIS_HOST). Queue features disabled.');
}

// Queue names
export const QUEUES = {
  SCREENSHOT_ANALYSIS: 'screenshot-analysis',
  SYNC: 'sync',
  BATCH_SCAN: 'batch-scan'
};

// Job types
export interface ScreenshotAnalysisJob {
  screenshotId: string;
  filePath: string;
  competitorId: string;
  isOnboarding?: boolean;
}

export interface SyncJob {
  type: 'full' | 'partial' | 'retry';
  screenshotIds?: string[];
}

export interface BatchScanJob {
  directoryPath: string;
  competitorName?: string;
}

export class QueueService {
  private queues: Map<string, Queue>;
  private workers: Map<string, Worker>;
  private analysisService: ScreenshotAnalysisService;
  private syncService: SyncService;

  constructor() {
    this.queues = new Map();
    this.workers = new Map();
    this.analysisService = new ScreenshotAnalysisService();
    this.syncService = new SyncService();

    // Only initialize if Redis is available
    if (connection) {
      this.initializeQueues();
      this.initializeWorkers();
    } else {
      console.warn('QueueService initialized without Redis - queue features disabled');
    }
  }

  /**
   * Queue'ları başlat
   */
  private initializeQueues() {
    if (!connection) return;

    // Screenshot Analysis Queue
    this.queues.set(
      QUEUES.SCREENSHOT_ANALYSIS,
      new Queue(QUEUES.SCREENSHOT_ANALYSIS, { connection })
    );

    // Sync Queue
    this.queues.set(
      QUEUES.SYNC,
      new Queue(QUEUES.SYNC, { connection })
    );

    // Batch Scan Queue
    this.queues.set(
      QUEUES.BATCH_SCAN,
      new Queue(QUEUES.BATCH_SCAN, { connection })
    );
  }

  /**
   * Worker'ları başlat
   */
  private initializeWorkers() {
    if (!connection) return;

    // Screenshot Analysis Worker
    const analysisWorker = new Worker<ScreenshotAnalysisJob>(
      QUEUES.SCREENSHOT_ANALYSIS,
      async (job) => {
        return await this.processScreenshotAnalysis(job);
      },
      {
        connection,
        concurrency: 5,
        removeOnComplete: { count: 100 },
        removeOnFail: { count: 50 }
      }
    );

    // Sync Worker
    const syncWorker = new Worker<SyncJob>(
      QUEUES.SYNC,
      async (job) => {
        return await this.processSync(job);
      },
      {
        connection,
        concurrency: 1,
        removeOnComplete: { count: 50 },
        removeOnFail: { count: 25 }
      }
    );

    // Batch Scan Worker
    const batchScanWorker = new Worker<BatchScanJob>(
      QUEUES.BATCH_SCAN,
      async (job) => {
        return await this.processBatchScan(job);
      },
      {
        connection,
        concurrency: 1,
        removeOnComplete: { count: 10 },
        removeOnFail: { count: 5 }
      }
    );

    // Worker event handlers
    analysisWorker.on('completed', (job) => {
      console.log(`Analysis completed: ${job.id}`);
    });

    analysisWorker.on('failed', (job, err) => {
      console.error(`Analysis failed: ${job?.id}`, err);
    });

    syncWorker.on('completed', (job) => {
      console.log(`Sync completed: ${job.id}`);
    });

    syncWorker.on('failed', (job, err) => {
      console.error(`Sync failed: ${job?.id}`, err);
    });

    this.workers.set(QUEUES.SCREENSHOT_ANALYSIS, analysisWorker);
    this.workers.set(QUEUES.SYNC, syncWorker);
    this.workers.set(QUEUES.BATCH_SCAN, batchScanWorker);
  }

  /**
   * Screenshot analiz job'ını işle
   */
  private async processScreenshotAnalysis(job: Job<ScreenshotAnalysisJob>) {
    const { screenshotId, filePath, competitorId, isOnboarding } = job.data;

    try {
      // Analiz servisini başlat
      await this.analysisService.initialize();

      // Screenshot'ı analiz et
      const analysis = await this.analysisService.analyzeScreenshot(filePath);

      // Sonucu veritabanına kaydet
      await this.analysisService.saveAnalysisResult(
        screenshotId,
        analysis,
        process.env.OPENAI_API_KEY ? 'openai+tesseract' : 'tesseract'
      );

      // Feature tahminini screenshot'a ata
      if (analysis.featureName && analysis.confidence > 0.7) {
        // Feature'ı bul veya oluştur
        const feature = await prisma.feature.findFirst({
          where: { name: analysis.featureName }
        });

        if (feature) {
          await prisma.screenshot.update({
            where: { id: screenshotId },
            data: { featureId: feature.id }
          });
        }
      }

      // Başarılı analizi logla
      console.log(`Analyzed screenshot: ${filePath} -> ${analysis.featureName} (${analysis.confidence})`);

      return {
        success: true,
        screenshotId,
        feature: analysis.featureName,
        confidence: analysis.confidence
      };

    } catch (error) {
      console.error(`Failed to analyze screenshot ${filePath}:`, error);
      throw error;
    } finally {
      await this.analysisService.cleanup();
    }
  }

  /**
   * Sync job'ını işle
   */
  private async processSync(job: Job<SyncJob>) {
    const { type, screenshotIds } = job.data;

    try {
      let result;

      switch (type) {
        case 'full':
          result = await this.syncService.syncToServer();
          break;

        case 'retry':
          result = await this.syncService.retryFailedSyncs();
          break;

        case 'partial':
          if (!screenshotIds || screenshotIds.length === 0) {
            throw new Error('No screenshot IDs provided for partial sync');
          }
          // Partial sync implementation
          // TODO: Implement partial sync for specific screenshots
          result = { success: true, synced: 0, failed: 0, errors: [] };
          break;

        default:
          throw new Error(`Unknown sync type: ${type}`);
      }

      return result;

    } catch (error) {
      console.error('Sync job failed:', error);
      throw error;
    }
  }

  /**
   * Batch scan job'ını işle
   */
  private async processBatchScan(job: Job<BatchScanJob>) {
    const { directoryPath, competitorName } = job.data;

    try {
      console.log(`Starting batch scan: ${directoryPath}`);

      // Dizin var mı kontrol et
      await fs.access(directoryPath);

      // Competitor'ı bul veya oluştur
      let competitor;
      if (competitorName) {
        competitor = await prisma.competitor.findUnique({
          where: { name: competitorName }
        });

        if (!competitor) {
          competitor = await prisma.competitor.create({
            data: { name: competitorName }
          });
        }
      }

      // Dizindeki görselleri tara
      const imageFiles = await this.scanDirectory(directoryPath);
      console.log(`Found ${imageFiles.length} images to process`);

      let processed = 0;
      let failed = 0;

      // Her görsel için analiz job'ı oluştur
      for (const imagePath of imageFiles) {
        try {
          // Dosya boyutunu kontrol et
          const stats = await fs.stat(imagePath);
          const fileName = path.basename(imagePath);

          // Onboarding kontrolü
          const isOnboarding = imagePath.toLowerCase().includes('onboarding');

          // Screenshot kaydı oluştur
          const screenshot = await prisma.screenshot.create({
            data: {
              competitorId: competitor?.id || '',
              filePath: imagePath,
              fileName,
              fileSize: stats.size,
              mimeType: this.getMimeType(fileName),
              isOnboarding,
              uploadSource: 'auto-scan'
            }
          });

          // Analiz job'ı ekle
          await this.addAnalysisJob({
            screenshotId: screenshot.id,
            filePath: imagePath,
            competitorId: competitor?.id || '',
            isOnboarding
          });

          processed++;
        } catch (error) {
          console.error(`Failed to process ${imagePath}:`, error);
          failed++;
        }
      }

      // Sync job'ı tetikle
      if (processed > 0) {
        await this.addSyncJob({ type: 'full' });
      }

      return {
        success: true,
        total: imageFiles.length,
        processed,
        failed
      };

    } catch (error) {
      console.error('Batch scan failed:', error);
      throw error;
    }
  }

  /**
   * Dizini recursive olarak tara
   */
  private async scanDirectory(dirPath: string): Promise<string[]> {
    const imageFiles: string[] = [];
    const supportedFormats = ['.png', '.jpg', '.jpeg', '.webp'];

    async function scan(currentPath: string) {
      const items = await fs.readdir(currentPath);

      for (const item of items) {
        const fullPath = path.join(currentPath, item);
        const stat = await fs.stat(fullPath);

        if (stat.isDirectory()) {
          await scan(fullPath);
        } else if (supportedFormats.includes(path.extname(item).toLowerCase())) {
          imageFiles.push(fullPath);
        }
      }
    }

    await scan(dirPath);
    return imageFiles;
  }

  /**
   * MIME type'ı belirle
   */
  private getMimeType(fileName: string): string {
    const ext = path.extname(fileName).toLowerCase();
    const mimeTypes: Record<string, string> = {
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.webp': 'image/webp'
    };
    return mimeTypes[ext] || 'image/jpeg';
  }

  /**
   * Analysis job ekle
   */
  async addAnalysisJob(data: ScreenshotAnalysisJob) {
    const queue = this.queues.get(QUEUES.SCREENSHOT_ANALYSIS);
    if (!queue) throw new Error('Analysis queue not initialized');

    return await queue.add('analyze', data, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000
      }
    });
  }

  /**
   * Sync job ekle
   */
  async addSyncJob(data: SyncJob) {
    const queue = this.queues.get(QUEUES.SYNC);
    if (!queue) throw new Error('Sync queue not initialized');

    return await queue.add('sync', data, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000
      }
    });
  }

  /**
   * Batch scan job ekle
   */
  async addBatchScanJob(data: BatchScanJob) {
    const queue = this.queues.get(QUEUES.BATCH_SCAN);
    if (!queue) throw new Error('Batch scan queue not initialized');

    return await queue.add('scan', data, {
      attempts: 2,
      backoff: {
        type: 'fixed',
        delay: 10000
      }
    });
  }

  /**
   * Queue durumunu getir
   */
  async getQueueStatus(queueName: string) {
    const queue = this.queues.get(queueName);
    if (!queue) throw new Error(`Queue ${queueName} not found`);

    const [waiting, active, completed, failed] = await Promise.all([
      queue.getWaitingCount(),
      queue.getActiveCount(),
      queue.getCompletedCount(),
      queue.getFailedCount()
    ]);

    return {
      name: queueName,
      waiting,
      active,
      completed,
      failed,
      total: waiting + active + completed + failed
    };
  }

  /**
   * Tüm queue'ların durumunu getir
   */
  async getAllQueueStatus() {
    const statuses = [];

    for (const queueName of this.queues.keys()) {
      const status = await this.getQueueStatus(queueName);
      statuses.push(status);
    }

    return statuses;
  }

  /**
   * Queue'ları temizle
   */
  async cleanQueues() {
    for (const queue of this.queues.values()) {
      await queue.obliterate({ force: true });
    }
  }

  /**
   * Servisi kapat
   */
  async shutdown() {
    // Worker'ları durdur
    for (const worker of this.workers.values()) {
      await worker.close();
    }

    // Queue'ları kapat
    for (const queue of this.queues.values()) {
      await queue.close();
    }

    // Redis bağlantısını kapat
    if (connection) {
      connection.disconnect();
    }
  }
}
