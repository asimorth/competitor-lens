import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

export interface ValidationReport {
  totalScreenshots: number;
  validAssignments: number;
  orphans: number;
  lowConfidence: number;
  missingFiles: number;
  qualityDistribution: Record<string, number>;
}

export interface MatrixReport {
  totalRelationships: number;
  inconsistentFlags: number;
  missingScreenshots: Array<{
    competitorId: string;
    competitorName: string;
    featureId: string;
    featureName: string;
  }>;
  screenshotMismatches: Array<{
    screenshotId: string;
    issue: string;
    details: string;
  }>;
}

export interface QualityScore {
  overall: number; // 0-100
  screenshots: number;
  assignments: number;
  metadata: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
}

export class DataValidationService {
  /**
   * Validate all screenshots in database
   */
  async validateScreenshots(): Promise<ValidationReport> {
    const screenshots = await prisma.screenshot.findMany({
      include: {
        feature: true,
        competitor: true
      }
    });

    let validAssignments = 0;
    let orphans = 0;
    let lowConfidence = 0;
    let missingFiles = 0;
    const qualityDistribution: Record<string, number> = {
      excellent: 0,
      good: 0,
      acceptable: 0,
      poor: 0,
      unknown: 0
    };

    for (const screenshot of screenshots) {
      // Check if file exists
      const filePath = path.join(process.cwd(), screenshot.filePath.replace(/^\//, ''));
      if (!fs.existsSync(filePath)) {
        missingFiles++;
      }

      // Check assignment quality
      if (screenshot.featureId) {
        validAssignments++;
        
        // Check confidence
        if (screenshot.assignmentConfidence && screenshot.assignmentConfidence < 0.7) {
          lowConfidence++;
        }
      } else {
        orphans++;
      }

      // Quality distribution
      const quality = screenshot.quality || 'unknown';
      qualityDistribution[quality] = (qualityDistribution[quality] || 0) + 1;
    }

    return {
      totalScreenshots: screenshots.length,
      validAssignments,
      orphans,
      lowConfidence,
      missingFiles,
      qualityDistribution
    };
  }

  /**
   * Validate competitor-feature matrix relationships
   */
  async validateMatrix(): Promise<MatrixReport> {
    const competitorFeatures = await prisma.competitorFeature.findMany({
      include: {
        competitor: true,
        feature: true,
        screenshots: true
      }
    });

    let inconsistentFlags = 0;
    const missingScreenshots: MatrixReport['missingScreenshots'] = [];
    const screenshotMismatches: MatrixReport['screenshotMismatches'] = [];

    for (const cf of competitorFeatures) {
      // Check for inconsistent hasFeature flags
      if (cf.hasFeature && cf.screenshots.length === 0) {
        // Has feature but no screenshots - might be intentional but worth flagging
        missingScreenshots.push({
          competitorId: cf.competitorId,
          competitorName: cf.competitor.name,
          featureId: cf.featureId,
          featureName: cf.feature.name
        });
      }

      if (!cf.hasFeature && cf.screenshots.length > 0) {
        // Has screenshots but hasFeature is false - inconsistent
        inconsistentFlags++;
      }
    }

    // Check for screenshot-feature mismatches in new Screenshot model
    const newScreenshots = await prisma.screenshot.findMany({
      where: {
        featureId: { not: null }
      },
      include: {
        competitor: true,
        feature: true
      }
    });

    for (const screenshot of newScreenshots) {
      if (!screenshot.feature) continue;

      // Check if CompetitorFeature relationship exists
      const cf = await prisma.competitorFeature.findFirst({
        where: {
          competitorId: screenshot.competitorId,
          featureId: screenshot.featureId
        }
      });

      if (!cf) {
        screenshotMismatches.push({
          screenshotId: screenshot.id,
          issue: 'missing_relationship',
          details: `Screenshot assigned to ${screenshot.feature.name} but no CompetitorFeature relationship exists`
        });
      } else if (!cf.hasFeature) {
        screenshotMismatches.push({
          screenshotId: screenshot.id,
          issue: 'inconsistent_flag',
          details: `Screenshot exists but hasFeature=false for ${screenshot.competitor.name} - ${screenshot.feature.name}`
        });
      }
    }

    return {
      totalRelationships: competitorFeatures.length,
      inconsistentFlags,
      missingScreenshots,
      screenshotMismatches
    };
  }

  /**
   * Generate overall data quality score
   */
  async generateDataQualityScore(): Promise<QualityScore> {
    const screenshotReport = await this.validateScreenshots();
    const matrixReport = await this.validateMatrix();

    // Calculate screenshot quality score (0-100)
    const screenshotScore = this.calculateScreenshotScore(screenshotReport);

    // Calculate assignment quality score (0-100)
    const assignmentScore = this.calculateAssignmentScore(screenshotReport, matrixReport);

    // Calculate metadata completeness score (0-100)
    const metadataScore = await this.calculateMetadataScore();

    // Overall score (weighted average)
    const overall = Math.round(
      screenshotScore * 0.3 +
      assignmentScore * 0.4 +
      metadataScore * 0.3
    );

    // Determine grade
    let grade: QualityScore['grade'];
    if (overall >= 90) grade = 'A';
    else if (overall >= 80) grade = 'B';
    else if (overall >= 70) grade = 'C';
    else if (overall >= 60) grade = 'D';
    else grade = 'F';

    return {
      overall,
      screenshots: screenshotScore,
      assignments: assignmentScore,
      metadata: metadataScore,
      grade
    };
  }

  /**
   * Calculate screenshot quality score
   */
  private calculateScreenshotScore(report: ValidationReport): number {
    const { totalScreenshots, missingFiles } = report;
    
    if (totalScreenshots === 0) return 0;

    // Penalize missing files heavily
    const fileExistenceScore = ((totalScreenshots - missingFiles) / totalScreenshots) * 100;

    return Math.round(fileExistenceScore);
  }

  /**
   * Calculate assignment quality score
   */
  private calculateAssignmentScore(
    screenshotReport: ValidationReport,
    matrixReport: MatrixReport
  ): number {
    const { totalScreenshots, validAssignments, lowConfidence, orphans } = screenshotReport;
    const { inconsistentFlags } = matrixReport;

    if (totalScreenshots === 0) return 0;

    // Assignment coverage
    const assignmentCoverage = (validAssignments / totalScreenshots) * 100;

    // Confidence penalty
    const confidencePenalty = (lowConfidence / totalScreenshots) * 20;

    // Orphan penalty
    const orphanPenalty = (orphans / totalScreenshots) * 30;

    // Inconsistency penalty
    const inconsistencyPenalty = Math.min((inconsistentFlags / totalScreenshots) * 50, 30);

    const score = Math.max(0, assignmentCoverage - confidencePenalty - orphanPenalty - inconsistencyPenalty);

    return Math.round(score);
  }

  /**
   * Calculate metadata completeness score
   */
  private async calculateMetadataScore(): Promise<number> {
    const screenshots = await prisma.screenshot.findMany();

    if (screenshots.length === 0) return 0;

    let totalFields = 0;
    let filledFields = 0;

    for (const screenshot of screenshots) {
      // Check metadata fields
      const fields = [
        'quality',
        'context',
        'visualComplexity',
        'uiPattern',
        'assignmentConfidence'
      ];

      totalFields += fields.length;

      for (const field of fields) {
        if (screenshot[field as keyof typeof screenshot] !== null && 
            screenshot[field as keyof typeof screenshot] !== undefined &&
            screenshot[field as keyof typeof screenshot] !== 'unknown') {
          filledFields++;
        }
      }
    }

    const completeness = (filledFields / totalFields) * 100;
    return Math.round(completeness);
  }

  /**
   * Get detailed validation summary
   */
  async getValidationSummary() {
    const [screenshotReport, matrixReport, qualityScore] = await Promise.all([
      this.validateScreenshots(),
      this.validateMatrix(),
      this.generateDataQualityScore()
    ]);

    return {
      qualityScore,
      screenshots: screenshotReport,
      matrix: matrixReport,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Get validation issues that need attention
   */
  async getIssues() {
    const [screenshotReport, matrixReport] = await Promise.all([
      this.validateScreenshots(),
      this.validateMatrix()
    ]);

    const issues: Array<{
      severity: 'critical' | 'warning' | 'info';
      category: string;
      message: string;
      count?: number;
    }> = [];

    // Critical: Missing files
    if (screenshotReport.missingFiles > 0) {
      issues.push({
        severity: 'critical',
        category: 'files',
        message: `${screenshotReport.missingFiles} screenshot files are missing from filesystem`,
        count: screenshotReport.missingFiles
      });
    }

    // Warning: Orphan screenshots
    if (screenshotReport.orphans > 0) {
      issues.push({
        severity: 'warning',
        category: 'assignments',
        message: `${screenshotReport.orphans} screenshots are not assigned to any feature`,
        count: screenshotReport.orphans
      });
    }

    // Warning: Low confidence assignments
    if (screenshotReport.lowConfidence > 0) {
      issues.push({
        severity: 'warning',
        category: 'confidence',
        message: `${screenshotReport.lowConfidence} screenshots have low assignment confidence (<0.7)`,
        count: screenshotReport.lowConfidence
      });
    }

    // Warning: Inconsistent flags
    if (matrixReport.inconsistentFlags > 0) {
      issues.push({
        severity: 'warning',
        category: 'consistency',
        message: `${matrixReport.inconsistentFlags} competitor-feature relationships have inconsistent flags`,
        count: matrixReport.inconsistentFlags
      });
    }

    // Info: Missing screenshots for features
    if (matrixReport.missingScreenshots.length > 0) {
      issues.push({
        severity: 'info',
        category: 'coverage',
        message: `${matrixReport.missingScreenshots.length} feature implementations lack screenshots`,
        count: matrixReport.missingScreenshots.length
      });
    }

    return issues;
  }
}

// Singleton instance
let dataValidationServiceInstance: DataValidationService | null = null;

export function getDataValidationService(): DataValidationService {
  if (!dataValidationServiceInstance) {
    dataValidationServiceInstance = new DataValidationService();
  }
  return dataValidationServiceInstance;
}

