// Global API Configuration
export const getApiUrl = (): string => {
  // 1. Environment variable varsa kullan (en yüksek öncelik)
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  
  // 2. Production detection (Vercel ya da production domain)
  if (typeof window !== 'undefined') {
    // Client-side: hostname kontrolü
    if (window.location.hostname.includes('vercel.app') || 
        window.location.hostname === 'competitor-lens-prod.vercel.app') {
      return 'https://competitor-lens-production.up.railway.app';
    }
  }
  
  // 3. Server-side: NODE_ENV kontrolü
  if (process.env.NODE_ENV === 'production') {
    return 'https://competitor-lens-production.up.railway.app';
  }
  
  // 4. Local development default
  return 'http://localhost:3002';
};

export const API_URL = getApiUrl();

