import { getApiUrl } from './config';

// Utility function to get full image URL
export function getImageUrl(path: string | undefined | null): string {
  if (!path) return '/placeholder-image.png';
  
  // If it's already a full URL, return as is
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  
  // Ensure path starts with /
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  
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
