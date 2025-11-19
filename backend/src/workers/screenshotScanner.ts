import chokidar from 'chokidar';
import path from 'path';
import { QueueService } from '../services/queueService';
import { PrismaClient } from '@prisma/client';
import fs from 'fs/promises';

const prisma = new PrismaClient();

export class ScreenshotScanner {
  private watcher: chokidar.FSWatcher | null = null;
  private queueService: QueueService;
  private watchPath: string;
  private isRunning: boolean = false;

  constructor(watchPath?: string) {
    this.watchPath = watchPath || path.join(process.cwd(), 'uploads/screenshots');
    this.queueService = new QueueService();
  }

  /**
   * Watcher'ı başlat
   */
  async start() {
    if (this.isRunning) {
      console.log('Screenshot scanner is already running');
      return;
    }

    console.log(`Starting screenshot scanner on: ${this.watchPath}`);

    // İlk tarama
    await this.initialScan();

    // File watcher'ı başlat
    this.watcher = chokidar.watch(this.watchPath, {
      ignored: /(^|[/\\])\../, // dot dosyalarını ignore et
      persistent: true,
      ignoreInitial: true, // İlk taramayı atla (zaten yaptık)
      depth: 5, // Max 5 seviye derinlik
      awaitWriteFinish: {
        stabilityThreshold: 2000,
        pollInterval: 100
      }
    });

    // Event listeners
    this.watcher
      .on('add', (filePath) => this.handleNewFile(filePath))
      .on('change', (filePath) => this.handleFileChange(filePath))
      .on('unlink', (filePath) => this.handleFileDelete(filePath))
      .on('addDir', (dirPath) => console.log(`Directory added: ${dirPath}`))
      .on('error', (error) => console.error(`Watcher error: ${error}`))
      .on('ready', () => {
        console.log('Screenshot scanner is ready and watching for changes');
        this.isRunning = true;
      });
  }

  /**
   * İlk tarama - mevcut dosyaları kontrol et
   */
  private async initialScan() {
    console.log('Running initial scan...');

    try {
      // Ana dizini kontrol et
      await fs.access(this.watchPath);

      // Competitor dizinlerini tara
      const competitors = await fs.readdir(this.watchPath);

      for (const competitorName of competitors) {
        const competitorPath = path.join(this.watchPath, competitorName);
        const stat = await fs.stat(competitorPath);

        if (stat.isDirectory()) {
          // Competitor'ı kontrol et veya oluştur
          let competitor = await prisma.competitor.findUnique({
            where: { name: competitorName }
          });

          if (!competitor) {
            console.log(`Creating new competitor: ${competitorName}`);
            competitor = await prisma.competitor.create({
              data: { name: competitorName }
            });
          }

          // Bu competitor için batch scan job'ı ekle
          await this.queueService.addBatchScanJob({
            directoryPath: competitorPath,
            competitorName: competitor.name
          });
        }
      }

      console.log('Initial scan completed');
    } catch (error) {
      console.error('Initial scan error:', error);
    }
  }

  /**
   * Yeni dosya eklenmesi
   */
  private async handleNewFile(filePath: string) {
    console.log(`New file detected: ${filePath}`);

    // Sadece görsel dosyaları işle
    if (!this.isImageFile(filePath)) {
      return;
    }

    try {
      // Dosya bilgilerini al
      const stats = await fs.stat(filePath);
      const fileName = path.basename(filePath);

      // Competitor'ı path'ten çıkar
      const relativePath = path.relative(this.watchPath, filePath);
      const pathParts = relativePath.split(path.sep);
      const competitorName = pathParts[0];

      // Onboarding kontrolü
      const isOnboarding = filePath.toLowerCase().includes('onboarding');

      // Competitor'ı bul
      let competitor = await prisma.competitor.findUnique({
        where: { name: competitorName }
      });

      if (!competitor) {
        competitor = await prisma.competitor.create({
          data: { name: competitorName }
        });
      }

      // Aynı dosya daha önce eklenmiş mi kontrol et
      const existingScreenshot = await prisma.screenshot.findFirst({
        where: {
          filePath,
          competitorId: competitor.id
        }
      });

      if (existingScreenshot) {
        console.log(`File already exists in database: ${filePath}`);
        return;
      }

      // Screenshot kaydı oluştur
      const screenshot = await prisma.screenshot.create({
        data: {
          competitorId: competitor.id,
          filePath,
          fileName,
          fileSize: stats.size,
          mimeType: this.getMimeType(fileName),
          isOnboarding,
          uploadSource: 'auto-scan'
        }
      });

      console.log(`Created screenshot record: ${screenshot.id}`);

      // Analiz job'ı ekle
      await this.queueService.addAnalysisJob({
        screenshotId: screenshot.id,
        filePath,
        competitorId: competitor.id,
        isOnboarding
      });

      // Sync job'ı ekle (debounced)
      this.scheduleSyncJob();

    } catch (error) {
      console.error(`Error processing new file ${filePath}:`, error);
    }
  }

  /**
   * Dosya değişikliği
   */
  private async handleFileChange(filePath: string) {
    console.log(`File changed: ${filePath}`);

    if (!this.isImageFile(filePath)) {
      return;
    }

    try {
      // Screenshot kaydını bul
      const screenshot = await prisma.screenshot.findFirst({
        where: { filePath }
      });

      if (!screenshot) {
        // Yeni dosya gibi işle
        await this.handleNewFile(filePath);
        return;
      }

      // Dosya bilgilerini güncelle
      const stats = await fs.stat(filePath);
      await prisma.screenshot.update({
        where: { id: screenshot.id },
        data: {
          fileSize: stats.size,
          updatedAt: new Date()
        }
      });

      // Sync durumunu pending yap
      const syncStatus = await prisma.syncStatus.findUnique({
        where: { screenshotId: screenshot.id }
      });

      if (syncStatus) {
        await prisma.syncStatus.update({
          where: { id: syncStatus.id },
          data: { syncStatus: 'pending' }
        });
      }

      // Yeniden analiz job'ı ekle
      await this.queueService.addAnalysisJob({
        screenshotId: screenshot.id,
        filePath,
        competitorId: screenshot.competitorId,
        isOnboarding: screenshot.isOnboarding
      });

      this.scheduleSyncJob();

    } catch (error) {
      console.error(`Error handling file change ${filePath}:`, error);
    }
  }

  /**
   * Dosya silinmesi
   */
  private async handleFileDelete(filePath: string) {
    console.log(`File deleted: ${filePath}`);

    try {
      // Screenshot kaydını bul
      const screenshot = await prisma.screenshot.findFirst({
        where: { filePath }
      });

      if (screenshot) {
        // Soft delete veya işaretle
        await prisma.screenshot.update({
          where: { id: screenshot.id },
          data: {
            updatedAt: new Date()
            // Opsiyonel: deletedAt alanı eklenebilir
          }
        });

        console.log(`Marked screenshot as deleted: ${screenshot.id}`);
      }
    } catch (error) {
      console.error(`Error handling file deletion ${filePath}:`, error);
    }
  }

  /**
   * Görsel dosyası mı kontrol et
   */
  private isImageFile(filePath: string): boolean {
    const supportedFormats = ['.png', '.jpg', '.jpeg', '.webp'];
    const ext = path.extname(filePath).toLowerCase();
    return supportedFormats.includes(ext);
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
   * Sync job'ı zamanla (debounced)
   */
  private syncTimer: NodeJS.Timeout | null = null;

  private scheduleSyncJob() {
    // Önceki timer'ı iptal et
    if (this.syncTimer) {
      clearTimeout(this.syncTimer);
    }

    // 30 saniye sonra sync job'ı tetikle
    this.syncTimer = setTimeout(async () => {
      console.log('Triggering sync job...');
      await this.queueService.addSyncJob({ type: 'full' });
    }, 30000);
  }

  /**
   * Scanner'ı durdur
   */
  async stop() {
    if (!this.isRunning) {
      console.log('Screenshot scanner is not running');
      return;
    }

    console.log('Stopping screenshot scanner...');

    if (this.watcher) {
      await this.watcher.close();
      this.watcher = null;
    }

    if (this.syncTimer) {
      clearTimeout(this.syncTimer);
      this.syncTimer = null;
    }

    await this.queueService.shutdown();

    this.isRunning = false;
    console.log('Screenshot scanner stopped');
  }

  /**
   * Manuel tarama tetikle
   */
  async triggerManualScan(directoryPath?: string) {
    const scanPath = directoryPath || this.watchPath;
    console.log(`Triggering manual scan on: ${scanPath}`);

    await this.queueService.addBatchScanJob({
      directoryPath: scanPath
    });
  }

  /**
   * Scanner durumunu getir
   */
  async getStatus() {
    const queueStatus = await this.queueService.getAllQueueStatus();

    return {
      isRunning: this.isRunning,
      watchPath: this.watchPath,
      queues: queueStatus
    };
  }
}

// CLI kullanımı için
if (require.main === module) {
  const scanner = new ScreenshotScanner();

  // Graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\nReceived SIGINT, shutting down gracefully...');
    await scanner.stop();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.log('\nReceived SIGTERM, shutting down gracefully...');
    await scanner.stop();
    process.exit(0);
  });

  // Scanner'ı başlat
  scanner.start().catch(console.error);
}
