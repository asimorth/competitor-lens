import { getApiUrl } from './config';

const API_BASE_URL = getApiUrl();

export const api = {
  // Competitors
  competitors: {
    getAll: async () => {
      console.log('API_BASE_URL:', API_BASE_URL);
      try {
        const res = await fetch(`${API_BASE_URL}/api/competitors`);
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      } catch (error) {
        console.error('Competitors API error:', error);
        return { success: false, data: [] };
      }
    },
    getById: async (id: string) => {
      const res = await fetch(`${API_BASE_URL}/api/competitors/${id}`);
      return res.json();
    },
    create: async (data: any) => {
      const res = await fetch(`${API_BASE_URL}/api/competitors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      return res.json();
    },
    update: async (id: string, data: any) => {
      const res = await fetch(`${API_BASE_URL}/api/competitors/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      return res.json();
    },
    delete: async (id: string) => {
      const res = await fetch(`${API_BASE_URL}/api/competitors/${id}`, {
        method: 'DELETE'
      });
      return res.json();
    }
  },

  // Features
  features: {
    getAll: async (category?: string) => {
      try {
        const url = category 
          ? `${API_BASE_URL}/api/features?category=${category}`
          : `${API_BASE_URL}/api/features`;
        const res = await fetch(url);
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      } catch (error) {
        console.error('Features API error:', error);
        return { success: false, data: [] };
      }
    },
    getById: async (id: string) => {
      const res = await fetch(`${API_BASE_URL}/api/features/${id}`);
      return res.json();
    },
    getCompetitors: async (id: string) => {
      const res = await fetch(`${API_BASE_URL}/api/features/${id}/competitors`);
      return res.json();
    }
  },

  // Matrix
  matrix: {
    get: async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/matrix`);
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      } catch (error) {
        console.error('Matrix API error:', error);
        return { success: false, data: { competitors: [], features: [], matrix: [] } };
      }
    },
    getHeatmap: async () => {
      const res = await fetch(`${API_BASE_URL}/api/matrix/heatmap`);
      return res.json();
    },
    updateCell: async (competitorId: string, featureId: string, data: any) => {
      const res = await fetch(`${API_BASE_URL}/api/matrix/${competitorId}/${featureId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      return res.json();
    },
    bulkUpdate: async (updates: any[]) => {
      const res = await fetch(`${API_BASE_URL}/api/matrix/bulk-update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates })
      });
      return res.json();
    }
  },

  // Uploads
  uploads: {
    uploadFile: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      
      const res = await fetch(`${API_BASE_URL}/api/uploads/file`, {
        method: 'POST',
        body: formData
      });
      return res.json();
    },
    uploadExcel: async (file: File) => {
      const formData = new FormData();
      formData.append('excel', file);
      
      const res = await fetch(`${API_BASE_URL}/api/uploads/excel`, {
        method: 'POST',
        body: formData
      });
      return res.json();
    },
    getAll: async () => {
      const res = await fetch(`${API_BASE_URL}/api/uploads`);
      return res.json();
    },
    delete: async (id: string) => {
      const res = await fetch(`${API_BASE_URL}/api/uploads/${id}`, {
        method: 'DELETE'
      });
      return res.json();
    }
  },

  // Analytics
  analytics: {
    getCoverage: async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/analytics/coverage`);
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      } catch (error) {
        console.error('Analytics API error:', error);
        return { success: false, data: { competitors: [] } };
      }
    },
    getGapAnalysis: async () => {
      const res = await fetch(`${API_BASE_URL}/api/analytics/gap-analysis`);
      return res.json();
    },
    getTrends: async (period: string = '30d') => {
      const res = await fetch(`${API_BASE_URL}/api/analytics/trends?period=${period}`);
      return res.json();
    }
  },

  // Screenshots
  screenshots: {
    getByCompetitor: async (competitorId: string) => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/screenshots/competitor/${competitorId}`);
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      } catch (error) {
        console.error('Screenshots API error:', error);
        return { success: false, data: [] };
      }
    },
    getByFeature: async (featureId: string) => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/screenshots/feature/${featureId}`);
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      } catch (error) {
        console.error('Screenshots API error:', error);
        return { success: false, data: [] };
      }
    }
  }
};
