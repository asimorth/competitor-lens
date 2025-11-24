/**
 * Data Foundation Migration Script
 * Phase 0: Enhance data quality and prepare for multi-persona frontend
 * 
 * Steps:
 * 1. Merge old CompetitorFeatureScreenshot and new Screenshot models
 * 2. Run AI analysis on unassigned/low-confidence screenshots
 * 3. Generate metadata for all screenshots
 * 4. Validate and fix relationships
 * 5. Generate quality report
 */

import { PrismaClient } from '@prisma/client';
import { IntelligentScreenshotAssignmentService } from '../services/intelligentScreenshotAssignment';
import { DataValidationService } from '../services/dataValidation';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();
const assignmentService = new IntelligentScreenshotAssignmentService();
const validationService = new DataValidationService();

interface MigrationStats {
  merged: number;
  analyzed: number;
  metadataGenerated: number;
  relationshipsFixed: number;
  errors: string[];
}

async function main() {
  console.log('🚀 Starting Data Foundation Migration\n');
  console.log('='.repeat(60));

  const stats: MigrationStats = {
    merged: 0,
    analyzed: 0,
    metadataGenerated: 0,
    relationshipsFixed: 0,
    errors: []
  };

  try {
    // Step 1: Merge old and new screenshot models
    console.log('\n📊 Step 1: Merging screenshot models...');
    await mergeScreenshotModels(stats);

    // Step 2: Run AI analysis on unassigned screenshots
    console.log('\n🤖 Step 2: Running AI analysis on unassigned screenshots...');
    await batchAnalyzeScreenshots(stats);

    // Step 3: Generate metadata for all screenshots
    console.log('\n📝 Step 3: Generating metadata for screenshots...');
    await generateScreenshotMetadata(stats);

    // Step 4: Validate and fix relationships
    console.log('\n🔧 Step 4: Validating and fixing relationships...');
    await validateAndFixRelationships(stats);

    // Step 5: Generate quality report
    console.log('\n📈 Step 5: Generating data quality report...');
    const report = await generateQualityReport();

    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('✅ Migration Complete!\n');
    console.log('Summary:');
    console.log(`  Merged screenshots: ${stats.merged}`);
    console.log(`  Analyzed screenshots: ${stats.analyzed}`);
    console.log(`  Metadata generated: ${stats.metadataGenerated}`);
    console.log(`  Relationships fixed: ${stats.relationshipsFixed}`);
    console.log(`  Errors: ${stats.errors.length}`);
    console.log('\n' + '='.repeat(60));
    console.log('\nData Quality Score:');
    console.log(`  Overall: ${report.overall}/100 (Grade: ${report.grade})`);
    console.log(`  Screenshots: ${report.screenshots}/100`);
    console.log(`  Assignments: ${report.assignments}/100`);
    console.log(`  Metadata: ${report.metadata}/100`);
    console.log('='.repeat(60));

    if (stats.errors.length > 0) {
      console.log('\n⚠️  Errors encountered:');
      stats.errors.forEach((error, i) => {
        console.log(`  ${i + 1}. ${error}`);
      });
    }

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Step 1: Merge old CompetitorFeatureScreenshot into new Screenshot model
 */
async function mergeScreenshotModels(stats: MigrationStats) {
  // Get all CompetitorFeatureScreenshots that don't exist in Screenshot table
  const oldScreenshots = await prisma.competitorFeatureScreenshot.findMany({
    include: {
      competitorFeature: {
        include: {
          competitor: true,
          feature: true
        }
      }
    }
  });

  console.log(`  Found ${oldScreenshots.length} old screenshots to check`);

  for (const oldScreenshot of oldScreenshots) {
    try {
      // Check if already exists in new model
      const existing = await prisma.screenshot.findFirst({
        where: {
          fileName: path.basename(oldScreenshot.screenshotPath),
          competitorId: oldScreenshot.competitorFeature.competitorId
        }
      });

      if (existing) {
        // Update with missing info if needed
        if (!existing.featureId && oldScreenshot.competitorFeature.featureId) {
          await prisma.screenshot.update({
            where: { id: existing.id },
            data: {
              featureId: oldScreenshot.competitorFeature.featureId,
              assignmentMethod: 'migrated',
              assignmentConfidence: 0.8
            }
          });
          stats.merged++;
        }
      } else {
        // Create new screenshot from old model
        const filePath = oldScreenshot.screenshotPath;
        const fullPath = path.join(process.cwd(), filePath.replace(/^\//, ''));
        
        let fileSize = BigInt(0);
        if (fs.existsSync(fullPath)) {
          const stat = fs.statSync(fullPath);
          fileSize = BigInt(stat.size);
        }

        await prisma.screenshot.create({
          data: {
            competitorId: oldScreenshot.competitorFeature.competitorId,
            featureId: oldScreenshot.competitorFeature.featureId,
            filePath: filePath,
            fileName: path.basename(filePath),
            fileSize: fileSize,
            mimeType: getMimeType(filePath),
            uploadSource: 'migrated',
            assignmentMethod: 'migrated',
            assignmentConfidence: 0.8,
            displayOrder: oldScreenshot.displayOrder
          }
        });

        stats.merged++;
      }

      if (stats.merged % 50 === 0) {
        console.log(`  Progress: ${stats.merged} screenshots merged`);
      }
    } catch (error) {
      stats.errors.push(`Failed to merge screenshot ${oldScreenshot.id}: ${error}`);
    }
  }

  console.log(`  ✅ Merged ${stats.merged} screenshots`);
}

/**
 * Step 2: Run AI analysis on unassigned screenshots
 */
async function batchAnalyzeScreenshots(stats: MigrationStats) {
  // Get screenshots that need assignment
  const unassignedScreenshots = await prisma.screenshot.findMany({
    where: {
      OR: [
        { featureId: null },
        { assignmentConfidence: { lt: 0.7 } }
      ]
    },
    take: 100 // Limit to avoid overwhelming
  });

  console.log(`  Found ${unassignedScreenshots.length} screenshots to analyze`);

  if (unassignedScreenshots.length === 0) {
    console.log(`  ✅ No screenshots need analysis`);
    return;
  }

  const screenshotIds = unassignedScreenshots.map(s => s.id);
  
  const result = await assignmentService.batchAnalyzeAndAssign(screenshotIds, (progress) => {
    if (progress % 20 === 0) {
      console.log(`  Progress: ${progress}%`);
    }
  });

  stats.analyzed = result.assigned + result.needsReview;
  console.log(`  ✅ Analyzed ${stats.analyzed} screenshots`);
  console.log(`     - Assigned: ${result.assigned}`);
  console.log(`     - Needs review: ${result.needsReview}`);
  console.log(`     - Failed: ${result.failed}`);
}

/**
 * Step 3: Generate metadata for all screenshots
 */
async function generateScreenshotMetadata(stats: MigrationStats) {
  const screenshots = await prisma.screenshot.findMany({
    where: {
      quality: 'unknown'
    },
    include: {
      analyses: {
        orderBy: { analyzedAt: 'desc' },
        take: 1
      }
    }
  });

  console.log(`  Found ${screenshots.length} screenshots needing metadata`);

  for (const screenshot of screenshots) {
    try {
      const metadata = await generateMetadataForScreenshot(screenshot);

      await prisma.screenshot.update({
        where: { id: screenshot.id },
        data: metadata
      });

      stats.metadataGenerated++;

      if (stats.metadataGenerated % 100 === 0) {
        console.log(`  Progress: ${stats.metadataGenerated} screenshots processed`);
      }
    } catch (error) {
      stats.errors.push(`Failed to generate metadata for ${screenshot.id}: ${error}`);
    }
  }

  console.log(`  ✅ Generated metadata for ${stats.metadataGenerated} screenshots`);
}

/**
 * Step 4: Validate and fix relationships
 */
async function validateAndFixRelationships(stats: MigrationStats) {
  // Get screenshots with features but no CompetitorFeature relationship
  const screenshots = await prisma.screenshot.findMany({
    where: {
      featureId: { not: null }
    },
    include: {
      competitor: true,
      feature: true
    }
  });

  console.log(`  Checking ${screenshots.length} screenshot relationships`);

  for (const screenshot of screenshots) {
    try {
      if (!screenshot.featureId) continue;

      // Check if CompetitorFeature exists
      const cf = await prisma.competitorFeature.findFirst({
        where: {
          competitorId: screenshot.competitorId,
          featureId: screenshot.featureId
        }
      });

      if (!cf) {
        // Create missing relationship
        await prisma.competitorFeature.create({
          data: {
            competitorId: screenshot.competitorId,
            featureId: screenshot.featureId,
            hasFeature: true,
            notes: 'Auto-created from screenshot'
          }
        });
        stats.relationshipsFixed++;
      } else if (!cf.hasFeature) {
        // Fix inconsistent flag
        await prisma.competitorFeature.update({
          where: { id: cf.id },
          data: { hasFeature: true }
        });
        stats.relationshipsFixed++;
      }
    } catch (error) {
      stats.errors.push(`Failed to fix relationship for ${screenshot.id}: ${error}`);
    }
  }

  console.log(`  ✅ Fixed ${stats.relationshipsFixed} relationships`);
}

/**
 * Step 5: Generate quality report
 */
async function generateQualityReport() {
  const qualityScore = await validationService.generateDataQualityScore();
  return qualityScore;
}

/**
 * Helper: Generate metadata for a screenshot
 */
async function generateMetadataForScreenshot(screenshot: any) {
  const metadata: any = {};

  // Determine quality based on file existence and size
  const filePath = path.join(process.cwd(), screenshot.filePath.replace(/^\//, ''));
  if (fs.existsSync(filePath)) {
    const stat = fs.statSync(filePath);
    if (stat.size > 500000) {
      metadata.quality = 'good';
    } else if (stat.size > 100000) {
      metadata.quality = 'acceptable';
    } else {
      metadata.quality = 'poor';
    }
  } else {
    metadata.quality = 'unknown';
  }

  // Determine context from path
  const pathLower = screenshot.filePath.toLowerCase();
  if (pathLower.includes('login') || pathLower.includes('sign')) {
    metadata.context = 'login';
  } else if (pathLower.includes('dashboard')) {
    metadata.context = 'dashboard';
  } else if (pathLower.includes('onboarding')) {
    metadata.context = 'onboarding';
  } else if (pathLower.includes('settings')) {
    metadata.context = 'settings';
  } else {
    metadata.context = 'feature-detail';
  }

  // Use analysis data if available
  if (screenshot.analyses && screenshot.analyses.length > 0) {
    const analysis = screenshot.analyses[0];
    
    if (analysis.extractedText) {
      metadata.hasText = analysis.extractedText.length > 20;
    }

    if (analysis.detectedElements) {
      const elements = analysis.detectedElements as any;
      metadata.hasUI = !!(elements.buttons || elements.forms || elements.navigation);
      metadata.hasData = !!(elements.tables || elements.charts);
    }

    // Determine visual complexity
    metadata.visualComplexity = 'moderate';
    if (analysis.extractedText && analysis.extractedText.length > 500) {
      metadata.visualComplexity = 'complex';
    } else if (analysis.extractedText && analysis.extractedText.length < 100) {
      metadata.visualComplexity = 'simple';
    }
  }

  return metadata;
}

/**
 * Helper: Get MIME type from file path
 */
function getMimeType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  const mimeTypes: Record<string, string> = {
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.webp': 'image/webp',
    '.gif': 'image/gif'
  };
  return mimeTypes[ext] || 'image/png';
}

// Run migration
main()
  .catch(console.error)
  .finally(() => process.exit());

