// Utility function to get full image URL
export function getImageUrl(path: string | undefined | null): string {
  if (!path) return '/placeholder-image.png';
  
  // If it's already a full URL, return as is
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  
  // Ensure path starts with /
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  
  // Get API URL - Production'da Railway kullan
  const apiUrl = (typeof window !== 'undefined' && window.location.hostname !== 'localhost')
    ? 'https://competitor-lens-production.up.railway.app'
    : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001');
  
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
