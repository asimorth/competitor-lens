/**
 * BigInt Serialization Utilities
 * Converts BigInt to string for JSON serialization
 */

export function serializeScreenshot(screenshot: any) {
  if (!screenshot) return screenshot;
  
  return {
    ...screenshot,
    fileSize: screenshot.fileSize ? screenshot.fileSize.toString() : null
  };
}

export function serializeScreenshots(screenshots: any[]) {
  if (!Array.isArray(screenshots)) return screenshots;
  return screenshots.map(serializeScreenshot);
}

export function serializeCompetitor(competitor: any) {
  if (!competitor) return competitor;
  
  return {
    ...competitor,
    screenshots: serializeScreenshots(competitor.screenshots || []),
    onboardingScreenshots: competitor.onboardingScreenshots?.map((s: any) => ({
      ...s,
      // OnboardingScreenshot doesn't have fileSize
    })) || []
  };
}

// Global BigInt serialization fix
(BigInt.prototype as any).toJSON = function() {
  return this.toString();
};

