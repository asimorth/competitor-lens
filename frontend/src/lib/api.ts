import { getApiUrl } from './config';

const API_BASE_URL = getApiUrl();

export const api = {
  // Competitors
  competitors: {
    getAll: async (region?: string | null) => {
      console.log('API_BASE_URL:', API_BASE_URL);
      try {
        const url = region
          ? `${API_BASE_URL}/api/competitors?region=${region}`
          : `${API_BASE_URL}/api/competitors`;
        const res = await fetch(url);
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      } catch (error) {
        console.error('Competitors API error:', error);
        return { success: false, data: [], meta: { byRegion: {} } };
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
    getAll: async (filters?: { featureId?: string; competitorId?: string; isOnboarding?: boolean }) => {
      try {
        const params = new URLSearchParams();
        if (filters?.featureId) params.append('featureId', filters.featureId);
        if (filters?.competitorId) params.append('competitorId', filters.competitorId);
        if (filters?.isOnboarding !== undefined) params.append('isOnboarding', String(filters.isOnboarding));

        const url = params.toString()
          ? `${API_BASE_URL}/api/screenshots?${params}`
          : `${API_BASE_URL}/api/screenshots`;

        const res = await fetch(url);
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      } catch (error) {
        console.error('Screenshots API error:', error);
        return { success: false, data: [] };
      }
    },
    getById: async (id: string) => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/screenshots/${id}`);
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      } catch (error) {
        console.error('Screenshot detail API error:', error);
        return { success: false, data: null };
      }
    },
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
    },
    updateFeature: async (id: string, featureId: string | null) => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/screenshots/${id}/feature`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ featureId })
        });
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      } catch (error) {
        console.error('Update screenshot feature error:', error);
        return { success: false, message: 'Failed to update screenshot feature' };
      }
    },
    delete: async (id: string) => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/screenshots/${id}`, {
          method: 'DELETE'
        });
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      } catch (error) {
        console.error('Delete screenshot error:', error);
        return { success: false, message: 'Failed to delete screenshot' };
      }
    }
  },

  // Intelligence (Phase 1)
  intelligence: {
    // Feature Intelligence
    feature: {
      getPMInsights: async (id: string) => {
        try {
          const res = await fetch(`${API_BASE_URL}/api/intelligence/feature/${id}/pm`);
          return res.ok ? res.json() : { success: false, data: null };
        } catch (error) {
          console.error('Feature PM insights error:', error);
          return { success: false, data: null };
        }
      },
      getDesignerInsights: async (id: string) => {
        try {
          const res = await fetch(`${API_BASE_URL}/api/intelligence/feature/${id}/designer`);
          return res.ok ? res.json() : { success: false, data: null };
        } catch (error) {
          console.error('Feature designer insights error:', error);
          return { success: false, data: null };
        }
      },
      getExecutiveInsights: async (id: string) => {
        try {
          const res = await fetch(`${API_BASE_URL}/api/intelligence/feature/${id}/executive`);
          return res.ok ? res.json() : { success: false, data: null };
        } catch (error) {
          console.error('Feature executive insights error:', error);
          return { success: false, data: null };
        }
      },
      analyze: async (id: string) => {
        try {
          const res = await fetch(`${API_BASE_URL}/api/intelligence/feature/${id}/analyze`);
          return res.ok ? res.json() : { success: false, data: null };
        } catch (error) {
          console.error('Feature analyze error:', error);
          return { success: false, data: null };
        }
      },
      getPositioning: async (id: string) => {
        try {
          const res = await fetch(`${API_BASE_URL}/api/intelligence/feature/${id}/positioning`);
          return res.ok ? res.json() : { success: false, data: null };
        } catch (error) {
          console.error('Feature positioning error:', error);
          return { success: false, data: null };
        }
      },
      getOpportunity: async (id: string) => {
        try {
          const res = await fetch(`${API_BASE_URL}/api/intelligence/feature/${id}/opportunity`);
          return res.ok ? res.json() : { success: false, data: null };
        } catch (error) {
          console.error('Feature opportunity error:', error);
          return { success: false, data: null };
        }
      }
    },

    // Competitor Intelligence
    competitor: {
      getPMInsights: async (id: string) => {
        try {
          const res = await fetch(`${API_BASE_URL}/api/intelligence/competitor/${id}/pm`);
          return res.ok ? res.json() : { success: false, data: null };
        } catch (error) {
          console.error('Competitor PM insights error:', error);
          return { success: false, data: null };
        }
      },
      getDesignerInsights: async (id: string) => {
        try {
          const res = await fetch(`${API_BASE_URL}/api/intelligence/competitor/${id}/designer`);
          return res.ok ? res.json() : { success: false, data: null };
        } catch (error) {
          console.error('Competitor designer insights error:', error);
          return { success: false, data: null };
        }
      },
      getExecutiveInsights: async (id: string) => {
        try {
          const res = await fetch(`${API_BASE_URL}/api/intelligence/competitor/${id}/executive`);
          return res.ok ? res.json() : { success: false, data: null };
        } catch (error) {
          console.error('Competitor executive insights error:', error);
          return { success: false, data: null };
        }
      },
      analyze: async (id: string) => {
        try {
          const res = await fetch(`${API_BASE_URL}/api/intelligence/competitor/${id}/analyze`);
          return res.ok ? res.json() : { success: false, data: null };
        } catch (error) {
          console.error('Competitor analyze error:', error);
          return { success: false, data: null };
        }
      },
      getBenchmark: async (id: string) => {
        try {
          const res = await fetch(`${API_BASE_URL}/api/intelligence/competitor/${id}/benchmark`);
          return res.ok ? res.json() : { success: false, data: null };
        } catch (error) {
          console.error('Competitor benchmark error:', error);
          return { success: false, data: null };
        }
      }
    },

    // Comparison
    compare: async (id1: string, id2: string) => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/intelligence/compare/${id1}/${id2}`);
        return res.ok ? res.json() : { success: false, data: null };
      } catch (error) {
        console.error('Compare error:', error);
        return { success: false, data: null };
      }
    }
  },

  // Data Quality (Phase 0)
  dataQuality: {
    getOverview: async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/data-quality/overview`);
        return res.ok ? res.json() : { success: false, data: null };
      } catch (error) {
        console.error('Data quality overview error:', error);
        return { success: false, data: null };
      }
    },
    getScore: async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/data-quality/score`);
        return res.ok ? res.json() : { success: false, data: null };
      } catch (error) {
        console.error('Data quality score error:', error);
        return { success: false, data: null };
      }
    }
  }
};
