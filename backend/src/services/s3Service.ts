import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

interface S3Config {
  region: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
  cdnUrl?: string;
}

export class S3Service {
  private s3Client: S3Client;
  private bucket: string;
  private cdnUrl?: string;

  constructor(config?: S3Config) {
    const finalConfig = config || {
      region: process.env.AWS_REGION || 'eu-central-1',
      bucket: process.env.S3_BUCKET || 'competitor-lens-screenshots',
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
      cdnUrl: process.env.CDN_URL
    };

    this.bucket = finalConfig.bucket;
    this.cdnUrl = finalConfig.cdnUrl;

    this.s3Client = new S3Client({
      region: finalConfig.region,
      credentials: {
        accessKeyId: finalConfig.accessKeyId,
        secretAccessKey: finalConfig.secretAccessKey
      }
    });
  }

  /**
   * Upload a file to S3
   * @param localPath Local file path
   * @param s3Key S3 key (path in bucket)
   * @param contentType MIME type
   * @returns S3 URL
   */
  async uploadFile(localPath: string, s3Key: string, contentType: string): Promise<string> {
    try {
      // Read file
      const fileContent = await fs.readFile(localPath);
      
      // Upload to S3
      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: s3Key,
        Body: fileContent,
        ContentType: contentType,
        // Public read access
        ACL: 'public-read',
        // Cache for 1 year
        CacheControl: 'public, max-age=31536000',
        Metadata: {
          uploadedAt: new Date().toISOString(),
          originalPath: localPath
        }
      });

      await this.s3Client.send(command);

      // Return CDN URL or S3 URL
      return this.getPublicUrl(s3Key);
    } catch (error) {
      console.error(`Failed to upload ${localPath} to S3:`, error);
      throw error;
    }
  }

  /**
   * Upload from buffer
   */
  async uploadBuffer(buffer: Buffer, s3Key: string, contentType: string): Promise<string> {
    try {
      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: s3Key,
        Body: buffer,
        ContentType: contentType,
        ACL: 'public-read',
        CacheControl: 'public, max-age=31536000'
      });

      await this.s3Client.send(command);
      return this.getPublicUrl(s3Key);
    } catch (error) {
      console.error(`Failed to upload buffer to S3:`, error);
      throw error;
    }
  }

  /**
   * Generate S3 key from file info
   * Format: screenshots/{competitor}/{feature}/{filename}
   */
  generateS3Key(competitor: string, feature: string | null, filename: string): string {
    // Sanitize names
    const sanitizedCompetitor = this.sanitizeName(competitor);
    const sanitizedFeature = feature ? this.sanitizeName(feature) : 'general';
    
    // Generate unique filename if needed
    const ext = path.extname(filename);
    const name = path.basename(filename, ext);
    const hash = crypto.randomBytes(4).toString('hex');
    const uniqueFilename = `${name}-${hash}${ext}`;
    
    return `screenshots/${sanitizedCompetitor}/${sanitizedFeature}/${uniqueFilename}`;
  }

  /**
   * Get public URL for S3 object
   */
  getPublicUrl(s3Key: string): string {
    if (this.cdnUrl) {
      // Use CDN (CloudFront) URL
      return `${this.cdnUrl}/${s3Key}`;
    } else {
      // Use direct S3 URL
      const region = process.env.AWS_REGION || 'eu-central-1';
      return `https://${this.bucket}.s3.${region}.amazonaws.com/${s3Key}`;
    }
  }

  /**
   * Check if file exists in S3
   */
  async fileExists(s3Key: string): Promise<boolean> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucket,
        Key: s3Key
      });
      await this.s3Client.send(command);
      return true;
    } catch (error: any) {
      if (error.name === 'NotFound') {
        return false;
      }
      throw error;
    }
  }

  /**
   * Delete file from S3
   */
  async deleteFile(s3Key: string): Promise<void> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: s3Key
      });
      await this.s3Client.send(command);
    } catch (error) {
      console.error(`Failed to delete ${s3Key} from S3:`, error);
      throw error;
    }
  }

  /**
   * Get signed URL for temporary access (if needed)
   */
  async getSignedUrl(s3Key: string, expiresIn: number = 3600): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: s3Key
    });
    return await getSignedUrl(this.s3Client, command, { expiresIn });
  }

  /**
   * Batch upload multiple files
   */
  async batchUpload(files: Array<{
    localPath: string;
    s3Key: string;
    contentType: string;
  }>): Promise<Array<{ s3Key: string; url: string; success: boolean; error?: string }>> {
    const results = await Promise.allSettled(
      files.map(async (file) => {
        const url = await this.uploadFile(file.localPath, file.s3Key, file.contentType);
        return { s3Key: file.s3Key, url, success: true };
      })
    );

    return results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        return {
          s3Key: files[index].s3Key,
          url: '',
          success: false,
          error: result.reason?.message || 'Unknown error'
        };
      }
    });
  }

  /**
   * Sanitize name for S3 key
   */
  private sanitizeName(name: string): string {
    return name
      .toLowerCase()
      .replace(/\s+/g, '-')           // Spaces to hyphens
      .replace(/[^a-z0-9-]/g, '')     // Remove special chars
      .replace(/-+/g, '-')            // Multiple hyphens to single
      .replace(/^-|-$/g, '');         // Remove leading/trailing hyphens
  }
}

// Singleton instance
let s3ServiceInstance: S3Service | null = null;

export function getS3Service(): S3Service {
  if (!s3ServiceInstance) {
    s3ServiceInstance = new S3Service();
  }
  return s3ServiceInstance;
}

