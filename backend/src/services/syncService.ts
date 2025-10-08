import { S3Client, PutObjectCommand, GetObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import path from 'path';
import fs from 'fs/promises';
import crypto from 'crypto';
import PQueue from 'p-queue';
import { prisma } from '../lib/db';

interface SyncConfig {
  bucketName: string;
  region: string;
  cdnUrl?: string;
  concurrency?: number;
}

interface SyncResult {
  success: boolean;
  synced: number;
  failed: number;
  errors: Array<{ file: string; error: string }>;
}

interface LocalChange {
  screenshotId: string;
  localPath: string;
  fileHash: string;
  action: 'create' | 'update' | 'delete';
}

export class SyncService {
  private s3Client: S3Client;
  private config: SyncConfig;
  private queue: PQueue;

  constructor(config?: Partial<SyncConfig>) {
    this.config = {
      bucketName: process.env.S3_BUCKET_NAME || 'competitorlens-screenshots',
      region: process.env.AWS_REGION || 'eu-west-1',
      cdnUrl: process.env.CDN_URL,
      concurrency: 5,
      ...config
    };

    this.s3Client = new S3Client({
      region: this.config.region,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
      }
    });

    this.queue = new PQueue({ concurrency: this.config.concurrency });
  }

  /**
   * Local değişiklikleri server'a senkronize et
   */
  async syncToServer(): Promise<SyncResult> {
    const result: SyncResult = {
      success: true,
      synced: 0,
      failed: 0,
      errors: []
    };

    try {
      // Local değişiklikleri tespit et
      const changes = await this.detectLocalChanges();
      
      if (changes.length === 0) {
        console.log('No changes to sync');
        return result;
      }

      console.log(`Found ${changes.length} changes to sync`);

      // Paralel olarak yükle
      const uploadPromises = changes.map(change => 
        this.queue.add(async () => {
          try {
            await this.uploadToServer(change);
            result.synced++;
          } catch (error: any) {
            result.failed++;
            result.errors.push({
              file: change.localPath,
              error: error.message
            });
          }
        })
      );

      await Promise.all(uploadPromises);
      
      result.success = result.failed === 0;
      
    } catch (error) {
      console.error('Sync error:', error);
      result.success = false;
    }

    return result;
  }

  /**
   * Local değişiklikleri tespit et
   */
  private async detectLocalChanges(): Promise<LocalChange[]> {
    const changes: LocalChange[] = [];

    // Sync edilmemiş veya güncellenen screenshot'ları bul
    const screenshots = await prisma.screenshot.findMany({
      include: {
        syncStatus: true
      }
    });

    for (const screenshot of screenshots) {
      const localPath = screenshot.filePath;
      
      try {
        // Dosya var mı kontrol et
        await fs.access(localPath);
        
        // Hash hesapla
        const currentHash = await this.calculateFileHash(localPath);
        
        if (!screenshot.syncStatus) {
          // Henüz sync edilmemiş
          changes.push({
            screenshotId: screenshot.id,
            localPath,
            fileHash: currentHash,
            action: 'create'
          });
        } else if (screenshot.syncStatus.fileHash !== currentHash) {
          // Dosya değişmiş
          changes.push({
            screenshotId: screenshot.id,
            localPath,
            fileHash: currentHash,
            action: 'update'
          });
        }
      } catch (error) {
        // Dosya yoksa ve daha önce sync edilmişse, silme işlemi
        if (screenshot.syncStatus && screenshot.syncStatus.syncStatus === 'synced') {
          changes.push({
            screenshotId: screenshot.id,
            localPath,
            fileHash: '',
            action: 'delete'
          });
        }
      }
    }

    return changes;
  }

  /**
   * Tek bir dosyayı S3'e yükle
   */
  private async uploadToServer(change: LocalChange): Promise<void> {
    const { screenshotId, localPath, fileHash, action } = change;

    if (action === 'delete') {
      // S3'ten silme işlemi (opsiyonel)
      console.log(`File deleted locally: ${localPath}`);
      return;
    }

    try {
      // Dosyayı oku
      const fileContent = await fs.readFile(localPath);
      const fileName = path.basename(localPath);
      
      // S3 key'i oluştur (competitor/feature/filename formatında)
      const screenshot = await prisma.screenshot.findUnique({
        where: { id: screenshotId },
        include: { 
          competitor: true,
          feature: true
        }
      });

      if (!screenshot) {
        throw new Error('Screenshot not found');
      }

      const s3Key = this.generateS3Key(
        screenshot.competitor.name,
        screenshot.feature?.name || 'uncategorized',
        fileName
      );

      // S3'e yükle
      const uploadCommand = new PutObjectCommand({
        Bucket: this.config.bucketName,
        Key: s3Key,
        Body: fileContent,
        ContentType: screenshot.mimeType,
        Metadata: {
          screenshotId,
          competitorId: screenshot.competitorId,
          featureId: screenshot.featureId || '',
          fileHash
        }
      });

      await this.s3Client.send(uploadCommand);

      // CDN URL'ini oluştur
      const cdnUrl = this.config.cdnUrl 
        ? `${this.config.cdnUrl}/${s3Key}`
        : `https://${this.config.bucketName}.s3.${this.config.region}.amazonaws.com/${s3Key}`;

      // Sync durumunu güncelle
      await this.updateSyncStatus(screenshotId, {
        serverPath: s3Key,
        fileHash,
        cdnUrl,
        status: 'synced'
      });

      console.log(`Synced: ${localPath} -> ${s3Key}`);
      
    } catch (error) {
      console.error(`Failed to sync ${localPath}:`, error);
      
      // Hata durumunu kaydet
      await this.updateSyncStatus(screenshotId, {
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      throw error;
    }
  }

  /**
   * S3 key formatı oluştur
   */
  private generateS3Key(competitorName: string, featureName: string, fileName: string): string {
    // Güvenli dosya adı oluştur
    const safeCompetitor = competitorName.replace(/[^a-zA-Z0-9-_]/g, '_');
    const safeFeature = featureName.replace(/[^a-zA-Z0-9-_]/g, '_');
    const timestamp = Date.now();
    
    return `screenshots/${safeCompetitor}/${safeFeature}/${timestamp}_${fileName}`;
  }

  /**
   * Sync durumunu veritabanında güncelle
   */
  private async updateSyncStatus(
    screenshotId: string, 
    data: {
      serverPath?: string;
      fileHash?: string;
      cdnUrl?: string;
      status: 'synced' | 'failed';
      error?: string;
    }
  ): Promise<void> {
    const existingStatus = await prisma.syncStatus.findUnique({
      where: { screenshotId }
    });

    if (existingStatus) {
      // Güncelle
      await prisma.syncStatus.update({
        where: { id: existingStatus.id },
        data: {
          serverPath: data.serverPath || existingStatus.serverPath,
          fileHash: data.fileHash || existingStatus.fileHash,
          syncStatus: data.status,
          lastSyncedAt: data.status === 'synced' ? new Date() : existingStatus.lastSyncedAt,
          errorMessage: data.error,
          retryCount: data.status === 'failed' 
            ? existingStatus.retryCount + 1 
            : existingStatus.retryCount
        }
      });
    } else {
      // Yeni oluştur
      const screenshot = await prisma.screenshot.findUnique({
        where: { id: screenshotId }
      });

      if (!screenshot) return;

      await prisma.syncStatus.create({
        data: {
          screenshotId,
          localPath: screenshot.filePath,
          serverPath: data.serverPath,
          fileHash: data.fileHash,
          syncStatus: data.status,
          lastSyncedAt: data.status === 'synced' ? new Date() : null,
          errorMessage: data.error
        }
      });
    }

    // Screenshot'ın CDN URL'ini güncelle
    if (data.cdnUrl && data.status === 'synced') {
      await prisma.screenshot.update({
        where: { id: screenshotId },
        data: { cdnUrl: data.cdnUrl }
      });
    }
  }

  /**
   * Local erişilemediğinde server'dan veri çek (fallback)
   */
  async fallbackToServer(screenshotId: string): Promise<Buffer | null> {
    try {
      const syncStatus = await prisma.syncStatus.findUnique({
        where: { screenshotId }
      });

      if (!syncStatus || !syncStatus.serverPath) {
        return null;
      }

      // S3'ten dosyayı indir
      const getCommand = new GetObjectCommand({
        Bucket: this.config.bucketName,
        Key: syncStatus.serverPath
      });

      const response = await this.s3Client.send(getCommand);
      
      if (response.Body) {
        const chunks: Uint8Array[] = [];
        for await (const chunk of response.Body as any) {
          chunks.push(chunk);
        }
        return Buffer.concat(chunks);
      }

      return null;
      
    } catch (error) {
      console.error('Fallback to server failed:', error);
      return null;
    }
  }

  /**
   * S3'te dosya var mı kontrol et
   */
  async checkServerFile(s3Key: string): Promise<boolean> {
    try {
      const headCommand = new HeadObjectCommand({
        Bucket: this.config.bucketName,
        Key: s3Key
      });

      await this.s3Client.send(headCommand);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Dosya hash'i hesapla
   */
  async calculateFileHash(filePath: string): Promise<string> {
    const fileBuffer = await fs.readFile(filePath);
    const hashSum = crypto.createHash('sha256');
    hashSum.update(fileBuffer);
    return hashSum.digest('hex');
  }

  /**
   * Başarısız sync'leri yeniden dene
   */
  async retryFailedSyncs(): Promise<SyncResult> {
    const failedSyncs = await prisma.syncStatus.findMany({
      where: {
        syncStatus: 'failed',
        retryCount: { lt: 3 } // Max 3 deneme
      },
      include: {
        screenshot: true
      }
    });

    const changes: LocalChange[] = failedSyncs.map(sync => ({
      screenshotId: sync.screenshotId,
      localPath: sync.localPath,
      fileHash: '',
      action: 'update' as const
    }));

    const result: SyncResult = {
      success: true,
      synced: 0,
      failed: 0,
      errors: []
    };

    for (const change of changes) {
      try {
        const fileHash = await this.calculateFileHash(change.localPath);
        change.fileHash = fileHash;
        await this.uploadToServer(change);
        result.synced++;
      } catch (error: any) {
        result.failed++;
        result.errors.push({
          file: change.localPath,
          error: error.message
        });
      }
    }

    result.success = result.failed === 0;
    return result;
  }

  /**
   * Sync istatistiklerini getir
   */
  async getSyncStats() {
    const [total, synced, failed, pending] = await Promise.all([
      prisma.syncStatus.count(),
      prisma.syncStatus.count({ where: { syncStatus: 'synced' } }),
      prisma.syncStatus.count({ where: { syncStatus: 'failed' } }),
      prisma.syncStatus.count({ where: { syncStatus: 'pending' } })
    ]);

    return {
      total,
      synced,
      failed,
      pending,
      successRate: total > 0 ? (synced / total) * 100 : 0
    };
  }
}
