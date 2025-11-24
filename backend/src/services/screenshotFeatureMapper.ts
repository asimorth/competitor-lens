import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

/**
 * Smart Screenshot-Feature Mapper
 * Maps screenshot folder names to Excel features intelligently
 */
export class ScreenshotFeatureMapper {
  // Smart mapping: Folder name → Excel feature names
  private folderToFeatureMapping: Record<string, string[]> = {
    // Authentication & KYC
    "KYC": ["KYC", "Sign up with Bank", "Sign in with Bank"],
    "kimlik": ["KYC"],
    "identity": ["KYC"],
    "verification": ["KYC"],
    
    // Onboarding
    "Onboarding": ["Onboarding", "User Registration"],
    "onboard": ["Onboarding"],
    "welcome": ["Onboarding"],
    
    // AI & Technology
    "AI tools": ["AI Sentimentals"],
    "AI": ["AI Sentimentals"],
    "sentiment": ["AI Sentimentals"],
    
    // Earn & Staking
    "TRY Nemalandırma": ["TRY Nemalandırma"],
    "nemalandırma": ["TRY Nemalandırma"],
    "staking": ["Flexible Staking", "Locked Staking"],
    "stake": ["Flexible Staking"],
    "earn": ["Flexible Staking", "Locked Staking", "On-chain Earn"],
    
    // Wallet & Balance
    "Wallet": ["Wallet", "Balance"],
    "balance": ["Wallet"],
    "cüzdan": ["Wallet"],
    
    // Dashboard & Platform
    "Dashboard": ["Web App", "Mobile App"],
    "dashboard": ["Web App"],
    "home": ["Web App", "Mobile App"],
    
    // Trading
    "trade": ["Trading", "Spot Trading"],
    "trading": ["Trading"],
    "convert": ["Convert"],
    "swap": ["Convert"],
    
    // P2P
    "p2p": ["P2P Trading"],
    "peer": ["P2P Trading"]
  };

  /**
   * Map all screenshots for a competitor to features
   */
  async mapCompetitorScreenshots(competitorName: string): Promise<{
    competitor: string;
    mapped: number;
    skipped: number;
    features: string[];
  }> {
    console.log(`\n🔍 Mapping screenshots for: ${competitorName}`);
    
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
      return { competitor: competitorName, mapped: 0, skipped: 0, features: [] };
    }

    // Scan screenshot folders
    const uploadsDir = path.join(process.cwd(), 'uploads', 'screenshots', competitorName);
    
    if (!fs.existsSync(uploadsDir)) {
      console.log(`   ⚠️  Screenshot folder not found: ${uploadsDir}`);
      return { competitor: competitorName, mapped: 0, skipped: 0, features: [] };
    }

    let mapped = 0;
    let skipped = 0;
    const mappedFeatures = new Set<string>();

    // Scan and map
    await this.scanAndMap(uploadsDir, competitor.id, '', (result) => {
      if (result.mapped) {
        mapped++;
        mappedFeatures.add(result.featureName!);
      } else {
        skipped++;
      }
    });

    console.log(`   ✅ Mapped: ${mapped}, Skipped: ${skipped}`);

    return {
      competitor: competitorName,
      mapped,
      skipped,
      features: Array.from(mappedFeatures)
    };
  }

  /**
   * Recursively scan and map screenshots
   */
  private async scanAndMap(
    dirPath: string,
    competitorId: string,
    relativePath: string,
    callback: (result: { mapped: boolean; featureName?: string }) => void
  ): Promise<void> {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      const currentRelativePath = relativePath ? `${relativePath}/${entry.name}` : entry.name;

      if (entry.isDirectory()) {
        // Recursive scan subdirectories
        await this.scanAndMap(fullPath, competitorId, currentRelativePath, callback);
      } else if (this.isImageFile(entry.name)) {
        // Map image file to feature
        const result = await this.mapScreenshot(fullPath, competitorId, currentRelativePath);
        callback(result);
      }
    }
  }

  /**
   * Map a single screenshot to a feature
   */
  private async mapScreenshot(
    filePath: string,
    competitorId: string,
    relativePath: string
  ): Promise<{ mapped: boolean; featureName?: string }> {
    const fileName = path.basename(filePath);
    
    // Check if already exists
    const existing = await prisma.screenshot.findFirst({
      where: {
        competitorId,
        fileName
      }
    });

    if (existing) {
      return { mapped: false }; // Already exists
    }

    // Detect feature from path
    const detectedFeatures = this.detectFeatureFromPath(relativePath);
    
    let featureId: string | null = null;
    let featureName: string | null = null;

    if (detectedFeatures.length > 0) {
      // Find first matching feature in database
      for (const fname of detectedFeatures) {
        const feature = await prisma.feature.findFirst({
          where: { 
            name: { contains: fname, mode: 'insensitive' }
          }
        });

        if (feature) {
          featureId = feature.id;
          featureName = feature.name;
          break;
        }
      }
    }

    // Get file stats
    const stats = fs.statSync(filePath);
    const webPath = `/uploads/screenshots/${relativePath}`;

    // Determine context from path
    const context = this.determineContext(relativePath);
    const isOnboarding = relativePath.toLowerCase().includes('onboarding');

    // Create screenshot record
    await prisma.screenshot.create({
      data: {
        competitorId,
        featureId,
        filePath: webPath,
        fileName,
        fileSize: BigInt(stats.size),
        mimeType: this.getMimeType(fileName),
        isOnboarding,
        uploadSource: 'smart-import',
        context,
        assignmentMethod: featureId ? 'pattern' : 'manual',
        assignmentConfidence: featureId ? 0.8 : 0
      }
    });

    return { 
      mapped: true, 
      featureName: featureName || undefined 
    };
  }

  /**
   * Detect feature from file path using smart matching
   */
  private detectFeatureFromPath(filePath: string): string[] {
    const pathLower = filePath.toLowerCase();
    const detectedFeatures: string[] = [];

    // Check each mapping
    for (const [folder, features] of Object.entries(this.folderToFeatureMapping)) {
      if (pathLower.includes(folder.toLowerCase())) {
        detectedFeatures.push(...features);
      }
    }

    return [...new Set(detectedFeatures)]; // Remove duplicates
  }

  /**
   * Determine screenshot context from path
   */
  private determineContext(filePath: string): string | null {
    const pathLower = filePath.toLowerCase();

    if (pathLower.includes('kyc') || pathLower.includes('verification')) {
      return 'kyc';
    }
    if (pathLower.includes('onboarding') || pathLower.includes('welcome')) {
      return 'onboarding';
    }
    if (pathLower.includes('dashboard') || pathLower.includes('home')) {
      return 'dashboard';
    }
    if (pathLower.includes('wallet') || pathLower.includes('balance')) {
      return 'wallet';
    }
    if (pathLower.includes('trade') || pathLower.includes('trading')) {
      return 'trading';
    }
    if (pathLower.includes('settings') || pathLower.includes('ayarlar')) {
      return 'settings';
    }

    return null;
  }

  /**
   * Check if file is an image
   */
  private isImageFile(filename: string): boolean {
    const ext = path.extname(filename).toLowerCase();
    return ['.png', '.jpg', '.jpeg', '.webp', '.gif'].includes(ext);
  }

  /**
   * Get MIME type from filename
   */
  private getMimeType(filename: string): string {
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

  /**
   * Get mapping report
   */
  async getMappingReport() {
    const screenshots = await prisma.screenshot.findMany({
      include: {
        feature: true,
        competitor: true
      }
    });

    const mapped = screenshots.filter(s => s.featureId !== null);
    const unmapped = screenshots.filter(s => s.featureId === null);

    const byCompetitor = screenshots.reduce((acc, s) => {
      const name = s.competitor.name;
      if (!acc[name]) {
        acc[name] = { total: 0, mapped: 0, unmapped: 0 };
      }
      acc[name].total++;
      if (s.featureId) acc[name].mapped++;
      else acc[name].unmapped++;
      return acc;
    }, {} as Record<string, { total: number; mapped: number; unmapped: number }>);

    return {
      total: screenshots.length,
      mapped: mapped.length,
      unmapped: unmapped.length,
      mappingRate: screenshots.length > 0 ? Math.round((mapped.length / screenshots.length) * 100) : 0,
      byCompetitor
    };
  }
}

// Singleton
let mapperInstance: ScreenshotFeatureMapper | null = null;

export function getScreenshotFeatureMapper(): ScreenshotFeatureMapper {
  if (!mapperInstance) {
    mapperInstance = new ScreenshotFeatureMapper();
  }
  return mapperInstance;
}

