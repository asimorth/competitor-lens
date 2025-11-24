'use client';

import { useState, useEffect, use } from 'react';
import { api } from '@/lib/api';
import { usePersona } from '@/contexts/PersonaContext';
import { SmartContextBar } from '@/components/SmartContextBar';
import { FeatureExecutiveView } from '@/components/feature/FeatureExecutiveView';
import { FeaturePMView } from '@/components/feature/FeaturePMView';
import { FeatureDesignerView } from '@/components/feature/FeatureDesignerView';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FeatureDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function FeatureDetailPage({ params }: FeatureDetailPageProps) {
  const { id } = use(params);
  const { activePersona } = usePersona();
  
  const [loading, setLoading] = useState(true);
  const [feature, setFeature] = useState<any>(null);
  const [exchanges, setExchanges] = useState<any[]>([]);
  const [screenshots, setScreenshots] = useState<any[]>([]);
  const [insights, setInsights] = useState<any>(null);
  const [dataQuality, setDataQuality] = useState<any>(null);

  useEffect(() => {
    loadFeatureData();
  }, [id]);

  useEffect(() => {
    if (feature) {
      loadPersonaInsights();
    }
  }, [activePersona, feature]);

  const loadFeatureData = async () => {
    setLoading(true);
    try {
      const [featureRes, competitorsRes, dataQualityRes] = await Promise.all([
        api.features.getById(id),
        api.features.getCompetitors(id),
        api.dataQuality.getScore()
      ]);

      if (featureRes.data) {
        const featureData = featureRes.data;
        const implementingExchanges = competitorsRes.data || [];

        // Get all competitors for coverage calculation
        const allCompetitorsRes = await api.competitors.getAll();
        const allCompetitors = allCompetitorsRes.data || [];

        const totalExchanges = allCompetitors.length;
        const implementedBy = implementingExchanges.length;
        const coverage = Math.round((implementedBy / totalExchanges) * 100);

        setFeature({
          ...featureData,
          implementedBy,
          totalExchanges,
          coverage
        });

        // Enrich exchanges with feature relationship
        const enrichedExchanges = allCompetitors.map((comp: any) => {
          const featureRelation = comp.features?.find((f: any) => f.featureId === id);
          
          return {
            id: comp.id,
            name: comp.name,
            hasFeature: featureRelation?.hasFeature || false,
            implementationQuality: featureRelation?.implementationQuality || 'none',
            notes: featureRelation?.notes || 'This feature is not available',
            screenshots: featureRelation?.screenshots || []
          };
        });

        setExchanges(enrichedExchanges);

        // Collect all screenshots
        const allScreenshots: any[] = [];
        
        if (featureData.screenshots) {
          featureData.screenshots.forEach((screenshot: any) => {
            allScreenshots.push({
              ...screenshot,
              fullUrl: screenshot.cdnUrl || screenshot.filePath,
              exchangeName: screenshot.competitor?.name,
              exchangeId: screenshot.competitorId
            });
          });
        }

        setScreenshots(allScreenshots);
      }

      if (dataQualityRes.success && dataQualityRes.data) {
        setDataQuality(dataQualityRes.data);
      }
    } catch (error) {
      console.error('Error loading feature:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPersonaInsights = async () => {
    try {
      let insightsRes;
      
      switch (activePersona) {
        case 'executive':
          insightsRes = await api.intelligence.feature.getExecutiveInsights(id);
          break;
        case 'pm':
          insightsRes = await api.intelligence.feature.getPMInsights(id);
          break;
        case 'designer':
          insightsRes = await api.intelligence.feature.getDesignerInsights(id);
          break;
      }

      if (insightsRes?.success && insightsRes.data) {
        setInsights(insightsRes.data);
      }
    } catch (error) {
      console.error('Error loading persona insights:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <RefreshCw className="h-12 w-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading feature data...</p>
        </div>
      </div>
    );
  }

  if (!feature) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-gray-600">Feature not found</p>
          <Button asChild className="mt-4">
            <a href="/features">Back to Features</a>
          </Button>
        </div>
      </div>
    );
  }

  const breadcrumbs = [
    { label: 'Features', href: '/features' },
    { label: feature.name }
  ];

  const quickActions = [
    { 
      label: 'Export Analysis', 
      onClick: () => console.log('Export') 
    },
    { 
      label: 'Download Screenshots', 
      onClick: () => console.log('Download') 
    }
  ];

  return (
    <div className="space-y-6">
      {/* Smart Context Bar */}
      <SmartContextBar
        breadcrumbs={breadcrumbs}
        dataQuality={dataQuality}
        quickActions={quickActions}
      />

      {/* Persona-specific Content */}
      {activePersona === 'executive' && (
        <FeatureExecutiveView 
          feature={feature} 
          insights={insights} 
        />
      )}
      
      {activePersona === 'pm' && (
        <FeaturePMView 
          feature={feature} 
          insights={insights}
          exchanges={exchanges}
        />
      )}
      
      {activePersona === 'designer' && (
        <FeatureDesignerView 
          feature={feature} 
          insights={insights}
          screenshots={screenshots}
        />
      )}
    </div>
  );
}

