/**
 * Scan and Import Screenshots
 * Scans local uploads/screenshots directory and imports to database
 * Works with Railway production database
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

interface Stats {
  scanned: number;
  imported: number;
  skipped: number;
  errors: number;
}

function isImageFile(filename: string): boolean {
  const ext = path.extname(filename).toLowerCase();
  return ['.png', '.jpg', '.jpeg', '.webp', '.gif', '.PNG', '.JPG', '.JPEG'].includes(ext);
}

async function scanDirectory(baseDir: string): Promise<Stats> {
  const stats: Stats = {
    scanned: 0,
    imported: 0,
    skipped: 0,
    errors: 0
  };

  console.log(`📁 Scanning directory: ${baseDir}\n`);

  // Read competitor directories
  const entries = fs.readdirSync(baseDir, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    if (entry.name === 'README.md' || entry.name.startsWith('.')) continue;

    const competitorName = entry.name;
    console.log(`\n🏢 Processing: ${competitorName}`);

    // Find competitor in database
    const competitor = await prisma.competitor.findFirst({
      where: {
        OR: [
          { name: { equals: competitorName, mode: 'insensitive' } },
          { name: { contains: competitorName, mode: 'insensitive' } }
        ]
      }
    });

    if (!competitor) {
      console.log(`   ⚠️  Competitor not found in database: ${competitorName}`);
      continue;
    }

    console.log(`   ✓ Found in DB: ${competitor.name} (${competitor.id})`);

    // Scan competitor directory
    const competitorDir = path.join(baseDir, entry.name);
    await scanCompetitorDirectory(competitorDir, competitor.id, stats);
  }

  return stats;
}

async function scanCompetitorDirectory(dirPath: string, competitorId: string, stats: Stats) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);

    if (entry.isDirectory()) {
      // Subdirectory (might be feature or onboarding)
      const isOnboarding = ['onboarding', 'kyc'].some(name => 
        entry.name.toLowerCase().includes(name)
      );

      await scanSubdirectory(fullPath, competitorId, entry.name, isOnboarding, stats);
    } else if (entry.isFile() && isImageFile(entry.name)) {
      // File directly under competitor (general screenshot)
      await importScreenshot(fullPath, competitorId, null, false, stats);
    }
  }
}

async function scanSubdirectory(
  dirPath: string, 
  competitorId: string, 
  dirName: string,
  isOnboarding: boolean,
  stats: Stats
) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.isFile() && isImageFile(entry.name)) {
      const fullPath = path.join(dirPath, entry.name);
      await importScreenshot(fullPath, competitorId, dirName, isOnboarding, stats);
    }
  }
}

async function importScreenshot(
  localPath: string,
  competitorId: string,
  featureName: string | null,
  isOnboarding: boolean,
  stats: Stats
) {
  try {
    stats.scanned++;
    
    const filename = path.basename(localPath);
    const fileStats = fs.statSync(localPath);
    
    // Create relative path for database (from project root)
    const relativePath = localPath.replace(process.cwd(), '').replace(/^\//, '');
    const webPath = `/${relativePath}`;

    // Check if already exists
    const existing = await prisma.screenshot.findFirst({
      where: {
        competitorId,
        fileName: filename
      }
    });

    if (existing) {
      stats.skipped++;
      return;
    }

    // Try to find feature
    let featureId: string | null = null;
    if (featureName && !isOnboarding) {
      const feature = await prisma.feature.findFirst({
        where: {
          name: {
            contains: featureName,
            mode: 'insensitive'
          }
        }
      });
      featureId = feature?.id || null;
    }

    // Import screenshot
    await prisma.screenshot.create({
      data: {
        competitorId,
        featureId,
        filePath: webPath,
        fileName: filename,
        fileSize: BigInt(fileStats.size),
        mimeType: getMimeType(filename),
        isOnboarding,
        uploadSource: 'auto-scan'
      }
    });

    stats.imported++;
    console.log(`      ✓ Imported: ${filename}`);

  } catch (error) {
    stats.errors++;
    console.error(`      ✗ Error importing ${path.basename(localPath)}:`, error);
  }
}

function getMimeType(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  const mimeTypes: Record<string, string> = {
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.webp': 'image/webp',
    '.gif': 'image/gif'
  };
  return mimeTypes[ext] || 'image/png';
}

async function main() {
  console.log('🚀 Screenshot Import Script');
  console.log('=' .repeat(50));
  console.log('');

  const uploadsDir = path.join(process.cwd(), 'uploads', 'screenshots');

  // Check if directory exists
  if (!fs.existsSync(uploadsDir)) {
    console.error(`❌ Directory not found: ${uploadsDir}`);
    process.exit(1);
  }

  const stats = await scanDirectory(uploadsDir);

  console.log('\n' + '='.repeat(50));
  console.log('📊 Import Summary:');
  console.log('='.repeat(50));
  console.log(`Total scanned:  ${stats.scanned}`);
  console.log(`✅ Imported:    ${stats.imported}`);
  console.log(`⚠️  Skipped:     ${stats.skipped}`);
  console.log(`❌ Errors:      ${stats.errors}`);
  console.log('='.repeat(50));
  console.log('');
  console.log('✨ Import complete!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

