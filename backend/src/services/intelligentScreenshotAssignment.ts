import { PrismaClient } from '@prisma/client';
import { ScreenshotAnalysisService } from './screenshotAnalysisService';

const prisma = new PrismaClient();
const screenshotAnalysisService = new ScreenshotAnalysisService();

export interface AssignmentResult {
  screenshotId: string;
  featureId: string | null;
  featureName: string | null;
  confidence: number;
  needsReview: boolean;
  method: 'ai' | 'pattern' | 'path-based';
  reasoning?: string;
}

export interface BatchResult {
  total: number;
  assigned: number;
  needsReview: number;
  failed: number;
  results: AssignmentResult[];
}

export interface CompetitorPattern {
  competitorId: string;
  patterns: Array<{
    featureId: string;
    featureName: string;
    keywords: string[];
    visualSignatures: string[];
    confidence: number;
  }>;
}

export class IntelligentScreenshotAssignmentService {
  /**
   * Analyze and assign a screenshot to a feature
   */
  async analyzeAndAssign(screenshotId: string): Promise<AssignmentResult> {
    try {
      const screenshot = await prisma.screenshot.findUnique({
        where: { id: screenshotId },
        include: {
          competitor: true,
          feature: true
        }
      });

      if (!screenshot) {
        throw new Error(`Screenshot not found: ${screenshotId}`);
      }

      // If already assigned with high confidence, skip
      if (screenshot.featureId && screenshot.assignmentConfidence && screenshot.assignmentConfidence >= 0.8) {
        return {
          screenshotId,
          featureId: screenshot.featureId,
          featureName: screenshot.feature?.name || null,
          confidence: screenshot.assignmentConfidence,
          needsReview: false,
          method: (screenshot.assignmentMethod as any) || 'ai'
        };
      }

      // Step 1: Use existing AI analysis service (OCR + keywords)
      const analysis = await screenshotAnalysisService.analyzeScreenshot(screenshot.id);

      // Step 2: Detect visual patterns
      const visualPatterns = await this.detectVisualPatterns(screenshot);

      // Step 3: Get competitor-specific patterns
      const competitorPatterns = await this.getCompetitorPatterns(screenshot.competitorId);

      // Step 4: Path-based guessing as fallback
      const pathGuess = this.guessFromPath(screenshot.filePath);

      // Step 5: Calculate confidence and pick best prediction
      const prediction = await this.selectBestPrediction({
        analysis,
        visualPatterns,
        competitorPatterns,
        pathGuess,
        screenshot
      });

      // Step 6: Auto-assign if confidence >= 0.7, flag for review if < 0.7
      if (prediction.confidence >= 0.7 && prediction.featureId) {
        await this.assignFeature(
          screenshotId,
          prediction.featureId,
          prediction.confidence,
          prediction.method
        );
      } else {
        await this.flagForReview(screenshotId, prediction.confidence);
      }

      return {
        screenshotId,
        featureId: prediction.featureId,
        featureName: prediction.featureName,
        confidence: prediction.confidence,
        needsReview: prediction.confidence < 0.7,
        method: prediction.method,
        reasoning: prediction.reasoning
      };
    } catch (error) {
      console.error(`Error analyzing screenshot ${screenshotId}:`, error);
      return {
        screenshotId,
        featureId: null,
        featureName: null,
        confidence: 0,
        needsReview: true,
        method: 'ai',
        reasoning: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Batch analyze and assign multiple screenshots
   */
  async batchAnalyzeAndAssign(screenshotIds: string[], onProgress?: (progress: number) => void): Promise<BatchResult> {
    const results: AssignmentResult[] = [];
    let assigned = 0;
    let needsReview = 0;
    let failed = 0;

    for (let i = 0; i < screenshotIds.length; i++) {
      try {
        const result = await this.analyzeAndAssign(screenshotIds[i]);
        results.push(result);

        if (result.featureId && !result.needsReview) {
          assigned++;
        } else if (result.needsReview) {
          needsReview++;
        }

        // Report progress
        if (onProgress) {
          const progress = Math.round(((i + 1) / screenshotIds.length) * 100);
          onProgress(progress);
        }

        // Add small delay to avoid overwhelming the system
        if (i % 10 === 0 && i > 0) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      } catch (error) {
        console.error(`Failed to process screenshot ${screenshotIds[i]}:`, error);
        failed++;
      }
    }

    return {
      total: screenshotIds.length,
      assigned,
      needsReview,
      failed,
      results
    };
  }

  /**
   * Confirm manual assignment and create learning feedback
   */
  async confirmAssignment(screenshotId: string, featureId: string): Promise<void> {
    const screenshot = await prisma.screenshot.findUnique({
      where: { id: screenshotId },
      include: { feature: true }
    });

    if (!screenshot) {
      throw new Error(`Screenshot not found: ${screenshotId}`);
    }

    // Update screenshot with manual assignment
    await prisma.screenshot.update({
      where: { id: screenshotId },
      data: {
        featureId,
        assignmentConfidence: 1.0, // Manual assignment is 100% confident
        assignmentMethod: 'manual',
        needsReview: false,
        reviewedAt: new Date()
      }
    });

    // Update analysis if exists
    const analysis = await prisma.screenshotAnalysis.findFirst({
      where: { screenshotId },
      orderBy: { analyzedAt: 'desc' }
    });

    if (analysis) {
      const feature = await prisma.feature.findUnique({ where: { id: featureId } });
      
      await prisma.screenshotAnalysis.update({
        where: { id: analysis.id },
        data: {
          manualOverride: true,
          featurePrediction: feature?.name || null
        }
      });
    }

    // TODO: Log pattern for ML improvement (future enhancement)
    console.log(`Manual assignment confirmed: Screenshot ${screenshotId} → Feature ${featureId}`);
  }

  /**
   * Detect visual patterns in screenshot
   */
  private async detectVisualPatterns(screenshot: any): Promise<{ patterns: string[]; confidence: number }> {
    // Extract visual cues from existing analysis
    const analysis = await prisma.screenshotAnalysis.findFirst({
      where: { screenshotId: screenshot.id },
      orderBy: { analyzedAt: 'desc' }
    });

    const patterns: string[] = [];
    let confidence = 0.3; // Base confidence for visual detection

    if (analysis) {
      // Check detected elements
      if (analysis.detectedElements) {
        const elements = analysis.detectedElements as any;
        if (elements.buttons) patterns.push('interactive-ui');
        if (elements.forms) patterns.push('form-input');
        if (elements.charts) patterns.push('data-visualization');
        if (elements.navigation) patterns.push('navigation');
      }

      // Boost confidence if we found patterns
      if (patterns.length > 0) {
        confidence = 0.5;
      }
    }

    return { patterns, confidence };
  }

  /**
   * Get learned patterns for a competitor
   */
  private async getCompetitorPatterns(competitorId: string): Promise<CompetitorPattern> {
    // Get all confirmed assignments for this competitor
    const screenshots = await prisma.screenshot.findMany({
      where: {
        competitorId,
        featureId: { not: null },
        assignmentConfidence: { gte: 0.8 }
      },
      include: {
        feature: true,
        analyses: {
          orderBy: { analyzedAt: 'desc' },
          take: 1
        }
      }
    });

    // Group by feature to build patterns
    const featurePatterns = new Map<string, {
      featureId: string;
      featureName: string;
      keywords: Set<string>;
      count: number;
    }>();

    for (const screenshot of screenshots) {
      if (!screenshot.feature) continue;

      if (!featurePatterns.has(screenshot.featureId!)) {
        featurePatterns.set(screenshot.featureId!, {
          featureId: screenshot.featureId!,
          featureName: screenshot.feature.name,
          keywords: new Set(),
          count: 0
        });
      }

      const pattern = featurePatterns.get(screenshot.featureId!)!;
      pattern.count++;

      // Extract keywords from analysis
      if (screenshot.analyses[0]?.extractedText) {
        const text = screenshot.analyses[0].extractedText.toLowerCase();
        const words = text.split(/\s+/).filter(w => w.length > 3);
        words.slice(0, 10).forEach(w => pattern.keywords.add(w));
      }
    }

    // Convert to array and calculate confidence based on sample size
    const patterns = Array.from(featurePatterns.values()).map(p => ({
      featureId: p.featureId,
      featureName: p.featureName,
      keywords: Array.from(p.keywords),
      visualSignatures: [],
      confidence: Math.min(0.3 + (p.count * 0.05), 0.8) // More samples = higher confidence
    }));

    return {
      competitorId,
      patterns
    };
  }

  /**
   * Guess feature from file path
   */
  private guessFromPath(filePath: string): { featureName: string | null; confidence: number } {
    const pathLower = filePath.toLowerCase();

    const pathPatterns: Record<string, string[]> = {
      'KYC': ['kyc', 'kimlik', 'verification', 'identity'],
      'Onboarding': ['onboarding', 'welcome', 'intro'],
      'Trading': ['trade', 'trading', 'al-sat', 'buy-sell'],
      'Staking': ['staking', 'stake', 'earn'],
      'Wallet': ['wallet', 'cüzdan', 'balance', 'bakiye'],
      'Convert': ['convert', 'swap', 'dönüştür'],
      'P2P Trading': ['p2p', 'peer-to-peer'],
      'Mobile App': ['mobile', 'app'],
      'AI Sentimentals': ['ai', 'sentiment', 'analysis']
    };

    for (const [featureName, keywords] of Object.entries(pathPatterns)) {
      for (const keyword of keywords) {
        if (pathLower.includes(keyword)) {
          return { featureName, confidence: 0.6 };
        }
      }
    }

    return { featureName: null, confidence: 0 };
  }

  /**
   * Select best prediction from all sources
   */
  private async selectBestPrediction(data: {
    analysis: any;
    visualPatterns: { patterns: string[]; confidence: number };
    competitorPatterns: CompetitorPattern;
    pathGuess: { featureName: string | null; confidence: number };
    screenshot: any;
  }): Promise<{
    featureId: string | null;
    featureName: string | null;
    confidence: number;
    method: 'ai' | 'pattern' | 'path-based';
    reasoning: string;
  }> {
    const candidates: Array<{
      featureId: string | null;
      featureName: string | null;
      confidence: number;
      method: 'ai' | 'pattern' | 'path-based';
      reasoning: string;
    }> = [];

    // 1. AI Analysis prediction
    if (data.analysis && data.analysis.featurePrediction) {
      const feature = await prisma.feature.findFirst({
        where: { name: { contains: data.analysis.featurePrediction, mode: 'insensitive' } }
      });

      if (feature) {
        candidates.push({
          featureId: feature.id,
          featureName: feature.name,
          confidence: data.analysis.confidenceScore || 0.5,
          method: 'ai',
          reasoning: 'AI analysis from OCR and keyword extraction'
        });
      }
    }

    // 2. Competitor pattern matching
    if (data.analysis?.extractedText) {
      const text = data.analysis.extractedText.toLowerCase();
      
      for (const pattern of data.competitorPatterns.patterns) {
        let matchCount = 0;
        for (const keyword of pattern.keywords) {
          if (text.includes(keyword.toLowerCase())) {
            matchCount++;
          }
        }

        if (matchCount > 0) {
          const matchRatio = matchCount / Math.max(pattern.keywords.length, 1);
          const confidence = Math.min(pattern.confidence + (matchRatio * 0.2), 0.85);

          candidates.push({
            featureId: pattern.featureId,
            featureName: pattern.featureName,
            confidence,
            method: 'pattern',
            reasoning: `Matched ${matchCount} keywords from competitor patterns`
          });
        }
      }
    }

    // 3. Path-based guess
    if (data.pathGuess.featureName) {
      const feature = await prisma.feature.findFirst({
        where: { name: { contains: data.pathGuess.featureName, mode: 'insensitive' } }
      });

      if (feature) {
        candidates.push({
          featureId: feature.id,
          featureName: feature.name,
          confidence: data.pathGuess.confidence,
          method: 'path-based',
          reasoning: 'Inferred from file path structure'
        });
      }
    }

    // Select best candidate
    if (candidates.length === 0) {
      return {
        featureId: null,
        featureName: null,
        confidence: 0,
        method: 'ai',
        reasoning: 'No predictions available'
      };
    }

    // Sort by confidence and return best
    candidates.sort((a, b) => b.confidence - a.confidence);
    return candidates[0];
  }

  /**
   * Assign feature to screenshot
   */
  private async assignFeature(
    screenshotId: string,
    featureId: string,
    confidence: number,
    method: 'ai' | 'pattern' | 'path-based'
  ): Promise<void> {
    await prisma.screenshot.update({
      where: { id: screenshotId },
      data: {
        featureId,
        assignmentConfidence: confidence,
        assignmentMethod: method,
        needsReview: false
      }
    });
  }

  /**
   * Flag screenshot for manual review
   */
  private async flagForReview(screenshotId: string, confidence: number): Promise<void> {
    await prisma.screenshot.update({
      where: { id: screenshotId },
      data: {
        needsReview: true,
        assignmentConfidence: confidence
      }
    });
  }

  /**
   * Get all screenshots that need review
   */
  async getScreenshotsNeedingReview(limit: number = 50) {
    return await prisma.screenshot.findMany({
      where: {
        needsReview: true
      },
      include: {
        competitor: true,
        feature: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit
    });
  }

  /**
   * Get assignment statistics
   */
  async getAssignmentStats() {
    const total = await prisma.screenshot.count();
    const assigned = await prisma.screenshot.count({
      where: { featureId: { not: null } }
    });
    const needsReview = await prisma.screenshot.count({
      where: { needsReview: true }
    });
    const highConfidence = await prisma.screenshot.count({
      where: {
        assignmentConfidence: { gte: 0.8 }
      }
    });
    const lowConfidence = await prisma.screenshot.count({
      where: {
        assignmentConfidence: { lt: 0.7, gt: 0 }
      }
    });

    return {
      total,
      assigned,
      unassigned: total - assigned,
      needsReview,
      highConfidence,
      lowConfidence,
      assignmentRate: total > 0 ? Math.round((assigned / total) * 100) : 0
    };
  }
}

// Singleton instance
let intelligentAssignmentServiceInstance: IntelligentScreenshotAssignmentService | null = null;

export function getIntelligentScreenshotAssignmentService(): IntelligentScreenshotAssignmentService {
  if (!intelligentAssignmentServiceInstance) {
    intelligentAssignmentServiceInstance = new IntelligentScreenshotAssignmentService();
  }
  return intelligentAssignmentServiceInstance;
}

