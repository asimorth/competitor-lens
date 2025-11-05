/**
 * Migrate Local Screenshots to AWS S3
 * 
 * This script:
 * 1. Scans local uploads/screenshots/ directory
 * 2. Uploads each file to S3
 * 3. Updates database with S3 URLs
 * 4. Generates migration report
 */

import { PrismaClient } from '@prisma/client';
import { S3Service } from '../services/s3Service';
import fs from 'fs/promises';
import path from 'path';
import * as mime from 'mime-types';

const prisma = new PrismaClient();
const s3Service = new S3Service();

interface MigrationStats {
  total: number;
  uploaded: number;
  failed: number;
  skipped: number;
  errors: Array<{ file: string; error: string }>;
}

async function scanLocalScreenshots(baseDir: string): Promise<Array<{
  localPath: string;
  competitorName: string;
  featureName: string | null;
  filename: string;
}>> {
  const screenshots: Array<{
    localPath: string;
    competitorName: string;
    featureName: string | null;
    filename: string;
  }> = [];

  // Read competitors directories
  const competitors = await fs.readdir(baseDir, { withFileTypes: true });

  for (const competitor of competitors) {
    if (!competitor.isDirectory() || competitor.name === 'README.md') continue;

    const competitorPath = path.join(baseDir, competitor.name);
    const items = await fs.readdir(competitorPath, { withFileTypes: true });

    for (const item of items) {
      if (item.isFile()) {
        // File directly under competitor (no feature)
        screenshots.push({
          localPath: path.join(competitorPath, item.name),
          competitorName: competitor.name,
          featureName: null,
          filename: item.name
        });
      } else if (item.isDirectory()) {
        // Feature directory
        const featurePath = path.join(competitorPath, item.name);
        const files = await fs.readdir(featurePath);

        for (const file of files) {
          const filePath = path.join(featurePath, file);
          const stat = await fs.stat(filePath);
          
          if (stat.isFile()) {
            screenshots.push({
              localPath: filePath,
              competitorName: competitor.name,
              featureName: item.name,
              filename: file
            });
          }
        }
      }
    }
  }

  return screenshots;
}

async function migrateScreenshot(
  localPath: string,
  competitorName: string,
  featureName: string | null,
  filename: string,
  stats: MigrationStats
): Promise<void> {
  try {
    // Find competitor in database
    const competitor = await prisma.competitor.findFirst({
      where: {
        name: {
          contains: competitorName,
          mode: 'insensitive'
        }
      }
    });

    if (!competitor) {
      console.log(`⚠️  Competitor not found: ${competitorName}`);
      stats.skipped++;
      return;
    }

    // Find feature if specified
    let feature = null;
    if (featureName && featureName !== 'Onboarding') {
      feature = await prisma.feature.findFirst({
        where: {
          name: {
            contains: featureName,
            mode: 'insensitive'
          }
        }
      });
    }

    // Check if already in database
    const existingScreenshot = await prisma.screenshot.findFirst({
      where: {
        competitorId: competitor.id,
        fileName: filename
      }
    });

    // Determine content type
    const contentType = mime.lookup(localPath) || 'image/png';

    // Generate S3 key
    const s3Key = s3Service.generateS3Key(
      competitor.name,
      feature?.name || featureName || 'general',
      filename
    );

    // Upload to S3
    console.log(`📤 Uploading: ${filename} → ${s3Key}`);
    const cdnUrl = await s3Service.uploadFile(localPath, s3Key, contentType);

    // Get file stats
    const fileStats = await fs.stat(localPath);

    if (existingScreenshot) {
      // Update existing record
      await prisma.screenshot.update({
        where: { id: existingScreenshot.id },
        data: {
          cdnUrl,
          filePath: s3Key,
          uploadSource: 's3-migration'
        }
      });
      console.log(`✅ Updated: ${filename}`);
    } else {
      // Create new record
      await prisma.screenshot.create({
        data: {
          competitorId: competitor.id,
          featureId: feature?.id || null,
          filePath: s3Key,
          fileName: filename,
          fileSize: BigInt(fileStats.size),
          mimeType: contentType,
          cdnUrl,
          isOnboarding: featureName === 'Onboarding',
          uploadSource: 's3-migration'
        }
      });
      console.log(`✅ Created: ${filename}`);
    }

    stats.uploaded++;
  } catch (error) {
    console.error(`❌ Failed: ${filename}`, error);
    stats.failed++;
    stats.errors.push({
      file: localPath,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

async function main() {
  console.log('🚀 Starting S3 Migration\n');
  console.log('='.repeat(50));

  const stats: MigrationStats = {
    total: 0,
    uploaded: 0,
    failed: 0,
    skipped: 0,
    errors: []
  };

  // Check environment variables
  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    console.error('❌ AWS credentials not found in environment variables');
    console.error('Please set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY');
    process.exit(1);
  }

  const uploadsDir = path.join(process.cwd(), 'uploads', 'screenshots');

  // Check if uploads directory exists
  try {
    await fs.access(uploadsDir);
  } catch {
    console.error(`❌ Directory not found: ${uploadsDir}`);
    process.exit(1);
  }

  // Scan local screenshots
  console.log(`\n📁 Scanning: ${uploadsDir}\n`);
  const screenshots = await scanLocalScreenshots(uploadsDir);
  stats.total = screenshots.length;

  console.log(`✅ Found ${stats.total} screenshots\n`);
  console.log('='.repeat(50));
  console.log('\n📤 Starting upload to S3...\n');

  // Migrate each screenshot
  for (const screenshot of screenshots) {
    await migrateScreenshot(
      screenshot.localPath,
      screenshot.competitorName,
      screenshot.featureName,
      screenshot.filename,
      stats
    );
  }

  // Generate report
  console.log('\n' + '='.repeat(50));
  console.log('📊 MIGRATION REPORT');
  console.log('='.repeat(50));
  console.log(`Total screenshots: ${stats.total}`);
  console.log(`✅ Uploaded: ${stats.uploaded}`);
  console.log(`⚠️  Skipped: ${stats.skipped}`);
  console.log(`❌ Failed: ${stats.failed}`);
  console.log('='.repeat(50));

  if (stats.errors.length > 0) {
    console.log('\n❌ Errors:');
    stats.errors.forEach(error => {
      console.log(`  - ${error.file}: ${error.error}`);
    });
  }

  console.log('\n✅ Migration complete!');
  
  // Save report
  const report = {
    timestamp: new Date().toISOString(),
    stats,
    errors: stats.errors
  };

  const reportPath = path.join(process.cwd(), 'logs', `s3-migration-${Date.now()}.json`);
  await fs.mkdir(path.dirname(reportPath), { recursive: true });
  await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n📝 Report saved: ${reportPath}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

