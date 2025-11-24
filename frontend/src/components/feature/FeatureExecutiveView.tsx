'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface FeatureExecutiveViewProps {
  feature: any;
  insights: any;
}

export function FeatureExecutiveView({ feature, insights }: FeatureExecutiveViewProps) {
  if (!insights) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Loading executive insights...</p>
      </div>
    );
  }

  const getImportanceColor = (importance: string) => {
    switch (importance) {
      case 'must-have': return 'bg-red-100 text-red-800 border-red-300';
      case 'competitive': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'differentiator': return 'bg-blue-100 text-blue-800 border-blue-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* Hero Card */}
      <Card className="border-2 border-emerald-200 shadow-lg">
        <CardContent className="p-6">
          {/* Metrics Grid */}
          <div className="grid grid-cols-3 gap-6 mb-6">
            <div>
              <span className="text-sm text-gray-600 block mb-2">Market Coverage</span>
              <div className="text-4xl font-bold text-emerald-600">
                {insights.coverage}%
              </div>
              <span className="text-sm text-gray-600">
                {insights.implementedBy?.length || 0}/{insights.totalEntities} exchanges
              </span>
            </div>

            <div>
              <span className="text-sm text-gray-600 block mb-2">Strategic Importance</span>
              <Badge 
                variant="outline"
                className={cn("text-sm px-3 py-1", getImportanceColor(insights.strategicImportance))}
              >
                {insights.strategicImportance?.toUpperCase()}
              </Badge>
            </div>

            <div>
              <span className="text-sm text-gray-600 block mb-2">Market Position</span>
              <div className="text-xl font-semibold text-gray-900">
                {insights.positioning || 'Standard'}
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-200 my-6" />

          {/* Key Insight */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <p className="text-blue-900 font-medium text-center">
              {insights.oneLiner || insights.keyTakeaway}
            </p>
          </div>

          {/* Critical Insight */}
          {insights.criticalInsight && (
            <div className="mt-4 bg-orange-50 p-4 rounded-lg border border-orange-200">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
                <p className="text-orange-900 font-medium">
                  {insights.criticalInsight}
                </p>
              </div>
            </div>
          )}

          {/* Critical Action */}
          {insights.criticalAction && (
            <div className="mt-4 bg-amber-50 p-4 rounded-lg border-2 border-amber-300">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="h-5 w-5 text-amber-700" />
                <span className="font-semibold text-amber-900">Recommended Action:</span>
              </div>
              <p className="text-amber-800">
                {insights.criticalAction}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Opportunities */}
      {insights.opportunities && insights.opportunities.length > 0 && (
        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold text-gray-900 mb-4">
              Strategic Opportunities
            </h3>
            <div className="space-y-3">
              {insights.opportunities.map((opp: any, index: number) => (
                <div 
                  key={index}
                  className="p-4 bg-emerald-50 rounded-lg border border-emerald-200"
                >
                  <p className="font-medium text-emerald-900">{opp.name}</p>
                  <div className="flex items-center gap-4 mt-2 text-sm text-emerald-700">
                    <span>Impact: {opp.impact}</span>
                    <span>•</span>
                    <span>Effort: {opp.effort}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

