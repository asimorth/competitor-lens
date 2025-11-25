import { PrismaClient } from '@prisma/client';
import { getScreenshotScanner, CompetitorScreenshotStructure } from './screenshotScanner';
import path from 'path';

const prisma = new PrismaClient();

export interface FeatureScreenshotMapping {
  excelFeatureName: string;
  screenshotFolders: string[];
  category: string;
}

export interface MappedScreenshot {
  competitorName: string;
  featureName: string;
  folderName: string;
  screenshots: string[];
  screenshotUrls: string[];
}

/**
 * Smart mapping between screenshot folder names and Excel feature names
 */
export const SMART_MAPPINGS: FeatureScreenshotMapping[] = [
  // Authentication & Identity
  {
    excelFeatureName: "KYC & Identity Verification",
    screenshotFolders: ["KYC", "kyc", "Identity", "Verification", "identity", "verification", "id-verification"],
    category: "Authentication"
  },
  
  // User Experience
  {
    excelFeatureName: "User Onboarding",
    screenshotFolders: ["Onboarding", "onboarding", "Welcome", "Getting Started", "welcome", "getting-started", "signup", "sign-up"],
    category: "User Experience"
  },
  
  // Technology
  {
    excelFeatureName: "AI Sentimentals",
    screenshotFolders: ["AI tools", "AI Tool", "AI", "Sentiment", "ai-tools", "ai-tool", "ai", "sentiment", "chatbot", "assistant"],
    category: "Technology"
  },
  
  // Earn
  {
    excelFeatureName: "TRY Nemalandırma",
    screenshotFolders: ["TRY Nemalandırma", "TRY Earn", "Nemalandırma", "try-nemalandirma", "nemalandirma", "try-earn"],
    category: "Earn"
  },
  {
    excelFeatureName: "Flexible Staking",
    screenshotFolders: ["Staking", "Flexible Staking", "Earn", "staking", "flexible-staking", "earn", "stake"],
    category: "Earn"
  },
  {
    excelFeatureName: "Locked Staking",
    screenshotFolders: ["Locked Staking", "Locked Earn", "locked-staking", "locked-earn", "locked"],
    category: "Earn"
  },
  
  // Platform - Dashboard & Wallet AYRI feature'lar olarak
  {
    excelFeatureName: "Dashboard & Wallet",
    screenshotFolders: ["Dashboard", "dashboard"],
    category: "Platform"
  },
  {
    excelFeatureName: "Dashboard & Wallet",
    screenshotFolders: ["Wallet", "wallet", "portfolio", "balance"],
    category: "Platform"
  },
  {
    excelFeatureName: "Web App",
    screenshotFolders: ["Web", "Web App", "Desktop", "web", "web-app", "desktop", "browser"],
    category: "Platform"
  },
  {
    excelFeatureName: "Mobile App",
    screenshotFolders: ["Mobile", "Mobile App", "App", "mobile", "mobile-app", "app", "ios", "android"],
    category: "Platform"
  },
  
  // Trading
  {
    excelFeatureName: "Convert",
    screenshotFolders: ["Convert", "Conversion", "Swap", "convert", "conversion", "swap", "exchange"],
    category: "Trading"
  },
  {
    excelFeatureName: "Copy Trading",
    screenshotFolders: ["Copy Trading", "Copy Trade", "Social Trading", "copy-trading", "copy-trade", "social-trading"],
    category: "Trading"
  },
  
  // Additional Features
  {
    excelFeatureName: "Referral",
    screenshotFolders: ["Referral", "referral", "refer", "invite"],
    category: "Business"
  },
  {
    excelFeatureName: "NFT / Marketplace",
    screenshotFolders: ["NFT", "nft", "Marketplace", "marketplace", "collectibles"],
    category: "Services"
  },
  {
    excelFeatureName: "Pay (Payments)",
    screenshotFolders: ["Pay", "Payment", "Payments", "pay", "payment", "payments", "deposit", "withdraw"],
    category: "Services"
  }
];

export class FeatureScreenshotMapper {
  private scanner = getScreenshotScanner();

  /**
   * Klasör ismini feature'a eşleştir (smart matching)
   */
  mapFolderToFeature(folderName: string): FeatureScreenshotMapping | null {
    const normalized = folderName.toLowerCase().trim().replace(/\s+/g, '-');
    
    for (const mapping of SMART_MAPPINGS) {
      const matchFound = mapping.screenshotFolders.some(folder => {
        const normalizedFolder = folder.toLowerCase().trim().replace(/\s+/g, '-');
        
        // Exact match
        if (normalized === normalizedFolder) {
          return true;
        }
        
        // Contains match
        if (normalized.includes(normalizedFolder) || normalizedFolder.includes(normalized)) {
          return true;
        }
        
        return false;
      });
      
      if (matchFound) {
        return mapping;
      }
    }
    
    return null;
  }

  /**
   * Belirli bir competitor ve feature için screenshot'ları getir
   */
  async getScreenshotsForFeature(
    competitorName: string,
    featureName: string
  ): Promise<string[]> {
    const mapping = SMART_MAPPINGS.find(m => m.excelFeatureName === featureName);
    
    if (!mapping) {
      console.warn(`No mapping found for feature: ${featureName}`);
      return [];
    }

    const structure = await this.scanner.scanCompetitor(competitorName);
    const screenshots: string[] = [];

    for (const folder of structure.folders) {
      const featureMapping = this.mapFolderToFeature(folder.folderName);
      
      if (featureMapping && featureMapping.excelFeatureName === featureName) {
        const folderScreenshots = folder.screenshots.map(s => 
          `/uploads/screenshots/${competitorName}/${folder.folderName}/${s}`
        );
        screenshots.push(...folderScreenshots);
      }
    }

    return screenshots;
  }

  /**
   * Tüm screenshot'ları tara ve feature'lara eşleştir
   */
  async scanAndMapAllScreenshots(): Promise<MappedScreenshot[]> {
    const structures = await this.scanner.scanAll();
    const mappedScreenshots: MappedScreenshot[] = [];

    for (const structure of structures) {
      for (const folder of structure.folders) {
        const mapping = this.mapFolderToFeature(folder.folderName);
        
        if (mapping) {
          const screenshotUrls = folder.screenshots.map(s => 
            `/uploads/screenshots/${structure.competitorName}/${folder.folderName}/${s}`
          );

          mappedScreenshots.push({
            competitorName: structure.competitorName,
            featureName: mapping.excelFeatureName,
            folderName: folder.folderName,
            screenshots: folder.screenshots,
            screenshotUrls
          });
        } else {
          console.log(`No mapping for folder: ${structure.competitorName}/${folder.folderName}`);
        }
      }
    }

    return mappedScreenshots;
  }

  /**
   * Feature için tüm competitor'ların screenshot'larını getir (coverage ile)
   */
  async getFeatureCoverage(featureName: string): Promise<{
    featureName: string;
    competitors: {
      id?: string;
      name: string;
      region?: string;
      screenshots: string[];
      screenshotCount: number;
    }[];
    totalScreenshots: number;
    coverageByRegion: {
      TR: number;
      Global: number;
    };
  }> {
    const structures = await this.scanner.scanAll();
    const competitors: any[] = [];
    let totalScreenshots = 0;
    let trCount = 0;
    let globalCount = 0;

    for (const structure of structures) {
      const screenshots = await this.getScreenshotsForFeature(structure.competitorName, featureName);
      
      if (screenshots.length > 0) {
        // Database'den competitor bilgilerini getir
        const competitor = await prisma.competitor.findFirst({
          where: { name: structure.competitorName },
          select: { id: true, name: true, region: true }
        });

        const region = competitor?.region || 'Unknown';
        
        competitors.push({
          id: competitor?.id,
          name: structure.competitorName,
          region,
          screenshots,
          screenshotCount: screenshots.length
        });

        totalScreenshots += screenshots.length;

        if (region === 'TR') {
          trCount++;
        } else if (region === 'Global') {
          globalCount++;
        }
      }
    }

    return {
      featureName,
      competitors,
      totalScreenshots,
      coverageByRegion: {
        TR: trCount,
        Global: globalCount
      }
    };
  }

  /**
   * Belirli bir competitor'ın tüm feature screenshot'larını kategorize et
   */
  async getCompetitorFeatureScreenshots(competitorName: string): Promise<{
    competitorName: string;
    features: {
      featureName: string;
      category: string;
      screenshots: string[];
      screenshotCount: number;
    }[];
  }> {
    const structure = await this.scanner.scanCompetitor(competitorName);
    const features: any[] = [];

    for (const folder of structure.folders) {
      const mapping = this.mapFolderToFeature(folder.folderName);
      
      if (mapping) {
        const screenshotUrls = folder.screenshots.map(s => 
          `/uploads/screenshots/${competitorName}/${folder.folderName}/${s}`
        );

        features.push({
          featureName: mapping.excelFeatureName,
          category: mapping.category,
          screenshots: screenshotUrls,
          screenshotCount: screenshotUrls.length
        });
      }
    }

    return {
      competitorName,
      features
    };
  }

  /**
   * Tüm feature'lar için basit özet
   */
  async getAllFeaturesWithScreenshotStats(): Promise<{
    featureName: string;
    category: string;
    totalScreenshots: number;
    competitorCount: number;
    trCount: number;
    globalCount: number;
  }[]> {
    const allMapped = await this.scanAndMapAllScreenshots();
    const featureMap = new Map<string, {
      category: string;
      screenshots: Set<string>;
      competitors: Set<string>;
      trCompetitors: Set<string>;
      globalCompetitors: Set<string>;
    }>();

    // Get all competitors with regions
    const competitors = await prisma.competitor.findMany({
      select: { name: true, region: true }
    });

    const competitorRegionMap = new Map(
      competitors.map(c => [c.name, c.region || 'Unknown'])
    );

    for (const mapped of allMapped) {
      if (!featureMap.has(mapped.featureName)) {
        const mapping = SMART_MAPPINGS.find(m => m.excelFeatureName === mapped.featureName);
        featureMap.set(mapped.featureName, {
          category: mapping?.category || 'Unknown',
          screenshots: new Set(),
          competitors: new Set(),
          trCompetitors: new Set(),
          globalCompetitors: new Set()
        });
      }

      const featureData = featureMap.get(mapped.featureName)!;
      mapped.screenshotUrls.forEach(url => featureData.screenshots.add(url));
      featureData.competitors.add(mapped.competitorName);

      const region = competitorRegionMap.get(mapped.competitorName);
      if (region === 'TR') {
        featureData.trCompetitors.add(mapped.competitorName);
      } else if (region === 'Global') {
        featureData.globalCompetitors.add(mapped.competitorName);
      }
    }

    const result: any[] = [];
    
    featureMap.forEach((data, featureName) => {
      result.push({
        featureName,
        category: data.category,
        totalScreenshots: data.screenshots.size,
        competitorCount: data.competitors.size,
        trCount: data.trCompetitors.size,
        globalCount: data.globalCompetitors.size
      });
    });

    return result.sort((a, b) => b.totalScreenshots - a.totalScreenshots);
  }
}

// Singleton instance
let mapperInstance: FeatureScreenshotMapper | null = null;

export function getFeatureScreenshotMapper(): FeatureScreenshotMapper {
  if (!mapperInstance) {
    mapperInstance = new FeatureScreenshotMapper();
  }
  return mapperInstance;
}

