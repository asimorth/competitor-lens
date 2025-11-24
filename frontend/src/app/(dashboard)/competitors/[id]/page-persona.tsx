'use client';

import { useState, use, useEffect } from 'react';
import { api } from '@/lib/api';
import { usePersona } from '@/contexts/PersonaContext';
import { SmartContextBar } from '@/components/SmartContextBar';
import { ExecutiveView } from '@/components/competitor/ExecutiveView';
import { PMView } from '@/components/competitor/PMView';
import { DesignerView } from '@/components/competitor/DesignerView';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CompetitorDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function CompetitorDetailPage({ params }: CompetitorDetailPageProps) {
  const { id } = use(params);
  const { activePersona } = usePersona();
  
  const [loading, setLoading] = useState(true);
  const [competitor, setCompetitor] = useState<any>(null);
  const [screenshots, setScreenshots] = useState<any[]>([]);
  const [insights, setInsights] = useState<any>(null);
  const [dataQuality, setDataQuality] = useState<any>(null);

  useEffect(() => {
    loadCompetitorData();
  }, [id]);

  useEffect(() => {
    if (competitor) {
      loadPersonaInsights();
    }
  }, [activePersona, competitor]);

  const loadCompetitorData = async () => {
    setLoading(true);
    try {
      const [competitorRes, dataQualityRes] = await Promise.all([
        api.competitors.getById(id),
        api.dataQuality.getScore()
      ]);

      if (competitorRes.success && competitorRes.data) {
        setCompetitor(competitorRes.data);
        
        // Process screenshots
        const allScreenshots: any[] = [];
        
        // New Screenshot model
        if (competitorRes.data.screenshots) {
          competitorRes.data.screenshots.forEach((screenshot: any) => {
            allScreenshots.push({
              ...screenshot,
              featureName: screenshot.feature?.name || 'Genel',
              featureCategory: screenshot.feature?.category || 'Diğer'
            });
          });
        }
        
        // Onboarding screenshots
        if (competitorRes.data.onboardingScreenshots) {
          competitorRes.data.onboardingScreenshots.forEach((screenshot: any) => {
            allScreenshots.push({
              ...screenshot,
              featureName: 'Onboarding',
              featureCategory: 'Onboarding',
              isOnboarding: true
            });
          });
        }
        
        setScreenshots(allScreenshots);
      }

      if (dataQualityRes.success && dataQualityRes.data) {
        setDataQuality(dataQualityRes.data);
      }
    } catch (error) {
      console.error('Error loading competitor:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPersonaInsights = async () => {
    try {
      let insightsRes;
      
      switch (activePersona) {
        case 'executive':
          insightsRes = await api.intelligence.competitor.getExecutiveInsights(id);
          break;
        case 'pm':
          insightsRes = await api.intelligence.competitor.getPMInsights(id);
          break;
        case 'designer':
          insightsRes = await api.intelligence.competitor.getDesignerInsights(id);
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
          <p className="text-gray-600">Loading competitor data...</p>
        </div>
      </div>
    );
  }

  if (!competitor) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-gray-600">Competitor not found</p>
          <Button asChild className="mt-4">
            <a href="/competitors">Back to Competitors</a>
          </Button>
        </div>
      </div>
    );
  }

  const breadcrumbs = [
    { label: 'Competitors', href: '/competitors' },
    { label: competitor.name }
  ];

  const quickActions = [
    { 
      label: 'Export Report', 
      onClick: () => console.log('Export') 
    },
    { 
      label: 'Compare', 
      onClick: () => console.log('Compare') 
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
        <ExecutiveView competitor={competitor} insights={insights} />
      )}
      
      {activePersona === 'pm' && (
        <PMView competitor={competitor} insights={insights} />
      )}
      
      {activePersona === 'designer' && (
        <DesignerView 
          competitor={competitor} 
          insights={insights}
          screenshots={screenshots}
        />
      )}
    </div>
  );
}

