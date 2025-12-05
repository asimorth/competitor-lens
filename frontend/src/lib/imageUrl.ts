import { getApiUrl } from './config';

// Utility function to get full image URL
export function getImageUrl(path: string | undefined | null): string {
  if (!path) return '/placeholder-image.png';

  // If it's already a full S3 URL, encode the path components
  if (path.startsWith('http://') || path.startsWith('https://')) {
    try {
      const url = new URL(path);
      // Encode each path segment to handle spaces (OKX TR → OKX%20TR)
      const encodedPath = url.pathname.split('/').map(segment =>
        segment ? encodeURIComponent(decodeURIComponent(segment)) : segment
      ).join('/');
      return `${url.protocol}//${url.host}${encodedPath}`;
    } catch {
      return path; // Fallback if URL parsing fails
    }
  }

  // Normalize absolute paths from backend (e.g. /app/uploads/...)
  let cleanPath = path;
  if (cleanPath.includes('uploads/')) {
    cleanPath = 'uploads/' + cleanPath.split('uploads/')[1];
  }

  // Encode path components to handle spaces and special characters
  // We split by '/' to avoid encoding the directory separators
  const encodedPath = cleanPath.split('/').map(part => encodeURIComponent(part)).join('/');

  // Ensure path starts with /
  const normalizedPath = encodedPath.startsWith('/') ? encodedPath : `/${encodedPath}`;

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
