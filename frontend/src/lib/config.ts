// Global API Configuration
export const getApiUrl = (): string => {
  // Production'da Railway URL kullan (browser'da ve Vercel'de)
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
    return 'https://competitor-lens-production.up.railway.app';
  }
  
  // Environment variable varsa kullan
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  
  // Local development
  return 'http://localhost:3001';
};

export const API_URL = getApiUrl();

