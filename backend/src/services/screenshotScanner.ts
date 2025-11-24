import fs from 'fs/promises';
import path from 'path';

export interface CompetitorScreenshotStructure {
  competitorName: string;
  folders: FolderInfo[];
  totalScreenshots: number;
}

export interface FolderInfo {
  folderName: string;
  normalizedName: string;
  screenshots: string[];
  count: number;
}

export class ScreenshotScanner {
  private uploadsPath: string;

  constructor(uploadsPath?: string) {
    this.uploadsPath = uploadsPath || path.join(process.cwd(), 'uploads', 'screenshots');
  }

  /**
   * Tüm competitor klasörlerini tarar ve yapıyı döndürür
   */
  async scanAll(): Promise<CompetitorScreenshotStructure[]> {
    try {
      const competitors: CompetitorScreenshotStructure[] = [];
      
      // Screenshots klasörünün var olup olmadığını kontrol et
      try {
        await fs.access(this.uploadsPath);
      } catch {
        console.warn(`Screenshots path not found: ${this.uploadsPath}`);
        return [];
      }

      const entries = await fs.readdir(this.uploadsPath, { withFileTypes: true });

      for (const entry of entries) {
        if (entry.isDirectory()) {
          const competitorPath = path.join(this.uploadsPath, entry.name);
          const structure = await this.scanCompetitor(entry.name, competitorPath);
          competitors.push(structure);
        }
      }

      return competitors;
    } catch (error) {
      console.error('Screenshot scan error:', error);
      throw new Error(`Failed to scan screenshots: ${error.message}`);
    }
  }

  /**
   * Belirli bir competitor'ın klasör yapısını tarar
   */
  async scanCompetitor(competitorName: string, competitorPath?: string): Promise<CompetitorScreenshotStructure> {
    const basePath = competitorPath || path.join(this.uploadsPath, competitorName);
    
    try {
      const folders: FolderInfo[] = [];
      let totalScreenshots = 0;

      // Competitor klasörünün içeriğini oku
      const entries = await fs.readdir(basePath, { withFileTypes: true });

      for (const entry of entries) {
        if (entry.isDirectory()) {
          // Alt klasörü tara
          const folderPath = path.join(basePath, entry.name);
          const screenshots = await this.getScreenshotsInFolder(folderPath);
          
          folders.push({
            folderName: entry.name,
            normalizedName: this.normalizeFolderName(entry.name),
            screenshots,
            count: screenshots.length
          });

          totalScreenshots += screenshots.length;
        } else if (this.isImageFile(entry.name)) {
          // Root'ta olan screenshot'lar
          const rootFolder = folders.find(f => f.folderName === '_root');
          if (!rootFolder) {
            folders.push({
              folderName: '_root',
              normalizedName: 'general',
              screenshots: [entry.name],
              count: 1
            });
          } else {
            rootFolder.screenshots.push(entry.name);
            rootFolder.count++;
          }
          totalScreenshots++;
        }
      }

      return {
        competitorName,
        folders,
        totalScreenshots
      };
    } catch (error) {
      console.error(`Error scanning competitor ${competitorName}:`, error);
      return {
        competitorName,
        folders: [],
        totalScreenshots: 0
      };
    }
  }

  /**
   * Klasördeki tüm screenshot'ları döndürür (recursive)
   */
  private async getScreenshotsInFolder(folderPath: string): Promise<string[]> {
    const screenshots: string[] = [];

    try {
      const entries = await fs.readdir(folderPath, { withFileTypes: true });

      for (const entry of entries) {
        const entryPath = path.join(folderPath, entry.name);
        
        if (entry.isDirectory()) {
          // Alt klasörleri de tara (recursive)
          const subScreenshots = await this.getScreenshotsInFolder(entryPath);
          screenshots.push(...subScreenshots.map(s => path.join(entry.name, s)));
        } else if (this.isImageFile(entry.name)) {
          screenshots.push(entry.name);
        }
      }
    } catch (error) {
      console.error(`Error reading folder ${folderPath}:`, error);
    }

    return screenshots;
  }

  /**
   * Klasör ismini normalize eder (lowercase, trim, özel karakterler)
   */
  normalizeFolderName(folderName: string): string {
    return folderName
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/gi, '');
  }

  /**
   * Dosyanın görsel dosyası olup olmadığını kontrol eder
   */
  private isImageFile(filename: string): boolean {
    const imageExtensions = ['.png', '.jpg', '.jpeg', '.webp', '.gif', '.PNG', '.JPG', '.JPEG'];
    const ext = path.extname(filename);
    return imageExtensions.includes(ext);
  }

  /**
   * Belirli bir competitor ve feature için screenshot yollarını döndürür
   */
  async getScreenshotPaths(competitorName: string, folderName?: string): Promise<string[]> {
    const competitorPath = path.join(this.uploadsPath, competitorName);
    
    if (folderName) {
      const folderPath = path.join(competitorPath, folderName);
      const screenshots = await this.getScreenshotsInFolder(folderPath);
      return screenshots.map(s => `/uploads/screenshots/${competitorName}/${folderName}/${s}`);
    } else {
      // Tüm screenshot'ları döndür
      const structure = await this.scanCompetitor(competitorName, competitorPath);
      const allPaths: string[] = [];
      
      for (const folder of structure.folders) {
        const folderScreenshots = folder.screenshots.map(s => 
          `/uploads/screenshots/${competitorName}/${folder.folderName}/${s}`
        );
        allPaths.push(...folderScreenshots);
      }
      
      return allPaths;
    }
  }

  /**
   * İstatistikleri döndürür
   */
  async getStats(): Promise<{
    totalCompetitors: number;
    totalFolders: number;
    totalScreenshots: number;
    byCompetitor: { name: string; count: number }[];
  }> {
    const structures = await this.scanAll();

    return {
      totalCompetitors: structures.length,
      totalFolders: structures.reduce((sum, s) => sum + s.folders.length, 0),
      totalScreenshots: structures.reduce((sum, s) => sum + s.totalScreenshots, 0),
      byCompetitor: structures.map(s => ({
        name: s.competitorName,
        count: s.totalScreenshots
      }))
    };
  }
}

// Singleton instance
let scannerInstance: ScreenshotScanner | null = null;

export function getScreenshotScanner(uploadsPath?: string): ScreenshotScanner {
  if (!scannerInstance) {
    scannerInstance = new ScreenshotScanner(uploadsPath);
  }
  return scannerInstance;
}

