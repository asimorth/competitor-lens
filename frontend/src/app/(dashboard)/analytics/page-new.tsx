'use client';

import { useEffect, useState } from 'react';
import { usePersona } from '@/contexts/PersonaContext';
import { api } from '@/lib/api';
import { SmartContextBar } from '@/components/SmartContextBar';
import { ExecutiveAnalytics } from '@/components/analytics/ExecutiveAnalytics';
import { PMAnalytics } from '@/components/analytics/PMAnalytics';
import { DesignerAnalytics } from '@/components/analytics/DesignerAnalytics';
import { RefreshCw } from 'lucide-react';

export default function AnalyticsPage() {
  const { activePersona } = usePersona();
  const [loading, setLoading] = useState(true);
  const [coverageData, setCoverageData] = useState<any>(null);
  const [gapAnalysis, setGapAnalysis] = useState<any[]>([]);
  const [dataQuality, setDataQuality] = useState<any>(null);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const [coverageRes, gapRes, dataQualityRes] = await Promise.all([
        api.analytics.getCoverage(),
        api.analytics.getGapAnalysis(),
        api.dataQuality.getScore()
      ]);

      setCoverageData(coverageRes.data);
      setGapAnalysis(gapRes.data || []);
      
      if (dataQualityRes.success) {
        setDataQuality(dataQualityRes.data);
      }
    } catch (error) {
      console.error('Analytics loading error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <RefreshCw className="h-12 w-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  const breadcrumbs = [
    { label: 'Analytics' }
  ];

  const quickActions = [
    { 
      label: 'Export Report', 
      onClick: () => console.log('Export') 
    },
    { 
      label: 'Refresh Data', 
      onClick: loadAnalytics 
    }
  ];

  // Mock screenshot stats (will be from API)
  const screenshotStats = {
    total: 1320,
    withFeature: 980,
    orphan: 340,
    excellent: 245,
    good: 612,
    needsUpdate: 123
  };

  return (
    <div className="space-y-6">
      {/* Smart Context Bar */}
      <SmartContextBar
        breadcrumbs={breadcrumbs}
        dataQuality={dataQuality}
        quickActions={quickActions}
      />

      {/* Persona-specific Analytics */}
      {activePersona === 'executive' && (
        <ExecutiveAnalytics 
          coverageData={coverageData} 
          gapAnalysis={gapAnalysis}
        />
      )}
      
      {activePersona === 'pm' && (
        <PMAnalytics 
          coverageData={coverageData} 
          gapAnalysis={gapAnalysis}
        />
      )}
      
      {activePersona === 'designer' && (
        <DesignerAnalytics 
          coverageData={coverageData}
          screenshotStats={screenshotStats}
        />
      )}
    </div>
  );
}

