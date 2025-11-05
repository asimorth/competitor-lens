import { getApiUrl } from './config';

const API_BASE_URL = getApiUrl();

/**
 * Screenshot URL'ini döndürür
 * - CDN URL varsa onu kullanır
 * - Yoksa backend'deki static file path'ini kullanır
 */
export function getScreenshotUrl(screenshot: any): string {
  // CDN URL varsa onu kullan
  if (screenshot.cdnUrl) {
    return screenshot.cdnUrl;
  }
  
  // Screenshot path'i varsa
  if (screenshot.filePath) {
    // Eğer absolute path ise backend'e yönlendir
    if (screenshot.filePath.startsWith('/uploads') || screenshot.filePath.startsWith('uploads')) {
      const cleanPath = screenshot.filePath.startsWith('/') 
        ? screenshot.filePath 
        : `/${screenshot.filePath}`;
      return `${API_BASE_URL}${cleanPath}`;
    }
    
    // Relative path ise uploads prefix'i ekle
    return `${API_BASE_URL}/uploads/${screenshot.filePath}`;
  }
  
  // CompetitorFeatureScreenshot için (eski model)
  if (screenshot.screenshotPath) {
    const cleanPath = screenshot.screenshotPath.startsWith('/') 
      ? screenshot.screenshotPath 
      : `/${screenshot.screenshotPath}`;
    return `${API_BASE_URL}${cleanPath}`;
  }
  
  // Legacy: url field
  if (screenshot.url) {
    return screenshot.url;
  }
  
  // Fallback: placeholder
  return '/placeholder-image.svg';
}

/**
 * Screenshot'ları feature bazında gruplar
 */
export function groupScreenshotsByFeature(screenshots: any[]): Record<string, any> {
  return screenshots.reduce((acc: any, screenshot: any) => {
    const featureKey = screenshot.featureId || screenshot.feature?.id || 'uncategorized';
    const featureName = screenshot.feature?.name || 'Kategorisiz';
    const featureCategory = screenshot.feature?.category || null;
    
    if (!acc[featureKey]) {
      acc[featureKey] = {
        featureId: featureKey,
        featureName: featureName,
        category: featureCategory,
        screenshots: []
      };
    }
    
    acc[featureKey].screenshots.push(screenshot);
    return acc;
  }, {});
}

/**
 * Screenshot'ları competitor bazında gruplar
 */
export function groupScreenshotsByCompetitor(screenshots: any[]): Record<string, any> {
  return screenshots.reduce((acc: any, screenshot: any) => {
    const competitorKey = screenshot.competitorId || screenshot.competitor?.id || 'unknown';
    const competitorName = screenshot.competitor?.name || 'Bilinmeyen';
    const logoUrl = screenshot.competitor?.logoUrl || null;
    
    if (!acc[competitorKey]) {
      acc[competitorKey] = {
        competitorId: competitorKey,
        competitorName: competitorName,
        logoUrl: logoUrl,
        screenshots: []
      };
    }
    
    acc[competitorKey].screenshots.push(screenshot);
    return acc;
  }, {});
}

/**
 * Screenshot'ları kategori bazında gruplar
 */
export function groupScreenshotsByCategory(screenshots: any[]): Record<string, any> {
  return screenshots.reduce((acc: any, screenshot: any) => {
    const category = screenshot.feature?.category || 'Kategorisiz';
    
    if (!acc[category]) {
      acc[category] = {
        category: category,
        screenshots: []
      };
    }
    
    acc[category].screenshots.push(screenshot);
    return acc;
  }, {});
}

/**
 * Screenshot tipini belirler
 */
export function getScreenshotType(screenshot: any): 'onboarding' | 'feature' | 'uncategorized' {
  if (screenshot.isOnboarding) {
    return 'onboarding';
  }
  
  if (screenshot.featureId || screenshot.feature) {
    return 'feature';
  }
  
  return 'uncategorized';
}

/**
 * Screenshot istatistiklerini hesaplar
 */
export function calculateScreenshotStats(screenshots: any[]) {
  const total = screenshots.length;
  const byType = {
    onboarding: screenshots.filter(s => s.isOnboarding).length,
    feature: screenshots.filter(s => s.featureId && !s.isOnboarding).length,
    uncategorized: screenshots.filter(s => !s.featureId && !s.isOnboarding).length
  };
  
  const byFeature = groupScreenshotsByFeature(screenshots);
  const byCompetitor = groupScreenshotsByCompetitor(screenshots);
  
  return {
    total,
    byType,
    featureCount: Object.keys(byFeature).length,
    competitorCount: Object.keys(byCompetitor).length
  };
}

