import { getApiUrl } from './config';

// Utility function to get full image URL
export function getImageUrl(path: string | undefined | null): string {
  if (!path) return '/placeholder-image.png';

  // If it's already a full URL, return as is
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  // Normalize absolute paths from backend (e.g. /app/uploads/...)
  let cleanPath = path;
  if (cleanPath.includes('uploads/')) {
    cleanPath = 'uploads/' + cleanPath.split('uploads/')[1];
  }

  // Ensure path starts with /
  const normalizedPath = cleanPath.startsWith('/') ? cleanPath : `/${cleanPath}`;

  // Get API URL
  const apiUrl = getApiUrl();

  return `${apiUrl}${normalizedPath}`;
}

// Helper to check if image exists
export async function checkImageExists(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch {
    return false;
  }
}
