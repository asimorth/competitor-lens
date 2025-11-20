import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

interface FileInfo {
  path: string;
  relativePath: string;
  fileName: string;
  size: number;
  competitor: string;
  feature?: string;
}

interface SyncReport {
  localFiles: FileInfo[];
  dbRecordsV2: any[];
  dbRecordsV1: any[];
  missingInLocal: any[];
  missingInDb: FileInfo[];
  synced: number;
  newImports: number;
  errors: string[];
}

/**
 * Local File - Database Bi-directional Sync
 * 
 * Bu script local uploads/screenshots/ klasörünü database ile senkronize eder:
 * 1. DB'de var ama local'de yok → WARNING (silinen dosyalar)
 * 2. Local'de var ama DB'de yok → AUTO-IMPORT (yeni dosyalar)
 */
async function syncLocalFiles(dryRun: boolean = false) {
  console.log('🔄 Starting Local Files ↔ Database Sync...');
  console.log(`   Mode: ${dryRun ? '🔍 DRY RUN (no changes)' : '✍️  WRITE MODE'}\n`);
  
  const report: SyncReport = {
    localFiles: [],
    dbRecordsV2: [],
    dbRecordsV1: [],
    missingInLocal: [],
    missingInDb: [],
    synced: 0,
    newImports: 0,
    errors: []
  };

  const uploadsDir = path.join(process.cwd(), 'uploads', 'screenshots');
  
  try {
    // ============================================
    // 1. Scan local files
    // ============================================
    console.log('📁 Scanning local files...');
    
    if (!fs.existsSync(uploadsDir)) {
      throw new Error(`Uploads directory not found: ${uploadsDir}`);
    }
    
    report.localFiles = scanDirectory(uploadsDir, uploadsDir);
    console.log(`   Found ${report.localFiles.length} local files\n`);
    
    // ============================================
    // 2. Get database records
    // ============================================
    console.log('💾 Loading database records...');
    
    // V2 - Screenshot model
    report.dbRecordsV2 = await prisma.screenshot.findMany({
      include: {
        competitor: true,
        feature: true
      }
    });
    console.log(`   - Screenshot v2: ${report.dbRecordsV2.length} records`);
    
    // V1 - CompetitorFeatureScreenshot model
    report.dbRecordsV1 = await prisma.competitorFeatureScreenshot.findMany({
      include: {
        competitorFeature: {
          include: {
            competitor: true,
            feature: true
          }
        }
      }
    });
    console.log(`   - Screenshot v1: ${report.dbRecordsV1.length} records`);
    console.log(`   - Total DB records: ${report.dbRecordsV2.length + report.dbRecordsV1.length}\n`);
    
    // ============================================
    // 3. Check DB → Local (missing files)
    // ============================================
    console.log('🔍 Checking for missing files in local filesystem...');
    
    // Check V2 screenshots
    for (const dbRecord of report.dbRecordsV2) {
      const normalizedDbPath = normalizePath(dbRecord.filePath);
      const exists = report.localFiles.some(f => 
        normalizePath(f.path) === normalizedDbPath ||
        normalizePath(f.relativePath) === normalizedDbPath ||
        f.fileName === dbRecord.fileName
      );
      
      if (!exists) {
        report.missingInLocal.push({
          model: 'v2',
          id: dbRecord.id,
          path: dbRecord.filePath,
          fileName: dbRecord.fileName,
          competitor: dbRecord.competitor.name,
          feature: dbRecord.feature?.name
        });
      } else {
        report.synced++;
      }
    }
    
    // Check V1 screenshots
    for (const dbRecord of report.dbRecordsV1) {
      const normalizedDbPath = normalizePath(dbRecord.screenshotPath);
      const fileName = path.basename(dbRecord.screenshotPath);
      
      const exists = report.localFiles.some(f => 
        normalizePath(f.path) === normalizedDbPath ||
        normalizePath(f.relativePath) === normalizedDbPath ||
        f.fileName === fileName
      );
      
      if (!exists) {
        report.missingInLocal.push({
          model: 'v1',
          id: dbRecord.id,
          path: dbRecord.screenshotPath,
          fileName: fileName,
          competitor: dbRecord.competitorFeature.competitor.name,
          feature: dbRecord.competitorFeature.feature.name
        });
      } else {
        report.synced++;
      }
    }
    
    console.log(`   ✅ Synced files: ${report.synced}`);
    console.log(`   ⚠️  Missing in local: ${report.missingInLocal.length}\n`);
    
    // ============================================
    // 4. Check Local → DB (new files)
    // ============================================
    console.log('🔍 Checking for new files not in database...');
    
    for (const localFile of report.localFiles) {
      // Check if exists in V2
      const existsInV2 = report.dbRecordsV2.some(db => 
        normalizePath(db.filePath) === normalizePath(localFile.path) ||
        normalizePath(db.filePath) === normalizePath(localFile.relativePath) ||
        db.fileName === localFile.fileName
      );
      
      // Check if exists in V1
      const existsInV1 = report.dbRecordsV1.some(db => {
        const dbFileName = path.basename(db.screenshotPath);
        return normalizePath(db.screenshotPath) === normalizePath(localFile.path) ||
               normalizePath(db.screenshotPath) === normalizePath(localFile.relativePath) ||
               dbFileName === localFile.fileName;
      });
      
      if (!existsInV2 && !existsInV1) {
        report.missingInDb.push(localFile);
      }
    }
    
    console.log(`   📤 New files to import: ${report.missingInDb.length}\n`);
    
    // ============================================
    // 5. Import new files (if not dry run)
    // ============================================
    if (report.missingInDb.length > 0 && !dryRun) {
      console.log('📥 Importing new files to database...');
      
      for (const file of report.missingInDb) {
        try {
          // Find or create competitor
          let competitor = await prisma.competitor.findFirst({
            where: {
              OR: [
                { name: file.competitor },
                { name: { contains: file.competitor, mode: 'insensitive' } }
              ]
            }
          });
          
          if (!competitor) {
            console.log(`   ℹ️  Creating new competitor: ${file.competitor}`);
            competitor = await prisma.competitor.create({
              data: {
                name: file.competitor,
                industry: 'Crypto Exchange'
              }
            });
          }
          
          // Try to detect feature from path/filename
          const detectedFeature = await detectFeatureFromPath(file.path);
          let featureId = null;
          
          if (detectedFeature) {
            const feature = await prisma.feature.findUnique({
              where: { name: detectedFeature }
            });
            featureId = feature?.id || null;
          }
          
          // Create screenshot record (V2)
          await prisma.screenshot.create({
            data: {
              competitorId: competitor.id,
              featureId: featureId,
              filePath: file.relativePath,
              fileName: file.fileName,
              fileSize: BigInt(file.size),
              mimeType: getMimeType(file.fileName),
              uploadSource: 'auto-scan',
              isOnboarding: file.path.toLowerCase().includes('onboarding')
            }
          });
          
          report.newImports++;
          console.log(`   ✅ Imported: ${file.fileName} → ${competitor.name}${featureId ? ` (${detectedFeature})` : ''}`);
          
        } catch (error) {
          report.errors.push(`Failed to import ${file.fileName}: ${error}`);
          console.error(`   ❌ Error importing ${file.fileName}:`, error);
        }
      }
    }
    
    // ============================================
    // 6. Summary Report
    // ============================================
    console.log('\n' + '='.repeat(70));
    console.log('📊 SYNC REPORT');
    console.log('='.repeat(70));
    console.log(`Mode: ${dryRun ? 'DRY RUN (no changes made)' : 'WRITE MODE (changes committed)'}`);
    console.log('');
    console.log('📁 Local Files:');
    console.log(`   Total files scanned: ${report.localFiles.length}`);
    console.log('');
    console.log('💾 Database Records:');
    console.log(`   Screenshot v2: ${report.dbRecordsV2.length}`);
    console.log(`   Screenshot v1: ${report.dbRecordsV1.length}`);
    console.log(`   Total: ${report.dbRecordsV2.length + report.dbRecordsV1.length}`);
    console.log('');
    console.log('✅ Synchronization Status:');
    console.log(`   Synced (both in DB and local): ${report.synced}`);
    console.log('');
    console.log('🔴 Missing in Local Filesystem:');
    console.log(`   Files in DB but not found locally: ${report.missingInLocal.length}`);
    
    if (report.missingInLocal.length > 0) {
      console.log('   ⚠️  WARNING: These files are referenced in DB but don\'t exist:');
      report.missingInLocal.slice(0, 10).forEach(item => {
        console.log(`      - ${item.fileName} (${item.competitor} / ${item.feature || 'N/A'})`);
      });
      if (report.missingInLocal.length > 10) {
        console.log(`      ... and ${report.missingInLocal.length - 10} more`);
      }
    }
    
    console.log('');
    console.log('🟡 New Files (not in DB):');
    console.log(`   Files in local but not in DB: ${report.missingInDb.length}`);
    
    if (report.missingInDb.length > 0 && dryRun) {
      console.log('   📤 These files would be imported:');
      report.missingInDb.slice(0, 10).forEach(file => {
        console.log(`      - ${file.fileName} (${file.competitor})`);
      });
      if (report.missingInDb.length > 10) {
        console.log(`      ... and ${report.missingInDb.length - 10} more`);
      }
    } else if (report.newImports > 0) {
      console.log(`   ✅ Successfully imported: ${report.newImports} files`);
    }
    
    if (report.errors.length > 0) {
      console.log('');
      console.log('❌ Errors:');
      report.errors.forEach(err => console.log(`   - ${err}`));
    }
    
    console.log('');
    if (dryRun) {
      console.log('🔍 This was a DRY RUN. No changes were made.');
      console.log('   Run without --dry-run flag to apply changes.');
    } else {
      console.log('✅ Sync completed!');
    }
    console.log('='.repeat(70));
    
  } catch (error) {
    console.error('\n❌ Sync failed with error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Helper functions
function scanDirectory(dirPath: string, basePath: string): FileInfo[] {
  const files: FileInfo[] = [];
  
  try {
    const items = fs.readdirSync(dirPath);
    
    for (const item of items) {
      const fullPath = path.join(dirPath, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        // Recursive scan
        files.push(...scanDirectory(fullPath, basePath));
      } else if (stat.isFile() && isImageFile(item)) {
        const relativePath = path.relative(basePath, fullPath);
        const pathParts = relativePath.split(path.sep);
        const competitor = pathParts[0] || 'Unknown';
        const feature = pathParts.length > 2 ? pathParts[1] : undefined;
        
        files.push({
          path: fullPath,
          relativePath: relativePath,
          fileName: item,
          size: stat.size,
          competitor,
          feature
        });
      }
    }
  } catch (error) {
    console.error(`Error scanning directory ${dirPath}:`, error);
  }
  
  return files;
}

function isImageFile(fileName: string): boolean {
  const ext = path.extname(fileName).toLowerCase();
  return ['.png', '.jpg', '.jpeg', '.webp', '.gif'].includes(ext);
}

function normalizePath(filePath: string): string {
  return filePath.replace(/\\/g, '/').toLowerCase();
}

function getMimeType(fileName: string): string {
  const ext = path.extname(fileName).toLowerCase();
  const mimeTypes: Record<string, string> = {
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.webp': 'image/webp',
    '.gif': 'image/gif'
  };
  return mimeTypes[ext] || 'image/jpeg';
}

async function detectFeatureFromPath(filePath: string): Promise<string | null> {
  const pathLower = filePath.toLowerCase();
  
  // Feature patterns (same as in smartScreenshotImport.ts)
  const patterns: Record<string, string> = {
    'kyc': 'Sign up with Bank',
    'onboarding': 'Sign up with Bank',
    'mobile': 'Mobile App',
    'app': 'Mobile App',
    'web': 'Web App',
    'staking': 'Flexible Staking',
    'stake': 'Flexible Staking',
    'ai': 'AI Sentimentals',
    'wallet': 'Sign in with Wallet',
    'payment': 'Pay (Payments)',
    'pay': 'Pay (Payments)'
  };
  
  for (const [pattern, featureName] of Object.entries(patterns)) {
    if (pathLower.includes(pattern)) {
      return featureName;
    }
  }
  
  return null;
}

// CLI execution
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run') || args.includes('-d');

syncLocalFiles(dryRun).catch(console.error);

