import { getApiUrl } from './config';

const API_BASE_URL = getApiUrl();

/**
 * Screenshot URL'ini döndürür
 * - CDN URL varsa onu kullanır (encoded)
 * - Yoksa backend'deki static file path'ini kullanır
 */
export function getScreenshotUrl(screenshot: any): string {
  // CDN URL varsa onu kullan (with encoding for spaces)
  if (screenshot.cdnUrl) {
    try {
      const url = new URL(screenshot.cdnUrl);
      // Encode each path segment to handle spaces (e.g., "OKX TR" -> "OKX%20TR")
      url.pathname = url.pathname.split('/').map(segment => encodeURIComponent(segment)).join('/');
      return url.toString();
    } catch (error) {
      // If URL parsing fails, return the original URL as a fallback
      console.error("Failed to parse or encode CDN URL:", screenshot.cdnUrl, error);
      return screenshot.cdnUrl;
    }
  }

  // Screenshot path'i varsa
  if (screenshot.filePath) {
    let cleanPath = screenshot.filePath;

    // Normalize absolute paths (e.g. /app/uploads/... or /Users/.../uploads/...)
    if (cleanPath.includes('uploads/')) {
      cleanPath = 'uploads/' + cleanPath.split('uploads/')[1];
    }

    // Ensure clean path doesn't start with /
    if (cleanPath.startsWith('/')) {
      cleanPath = cleanPath.substring(1);
    }

    return `${API_BASE_URL}/${cleanPath}`;
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

