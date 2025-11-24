'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp,
  Award,
  Target,
  AlertTriangle
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ExecutiveAnalyticsProps {
  coverageData: any;
  gapAnalysis: any[];
}

export function ExecutiveAnalytics({ coverageData, gapAnalysis }: ExecutiveAnalyticsProps) {
  const topPerformers = coverageData?.competitorCoverage?.slice(0, 5) || [];
  const bottomFeatures = gapAnalysis.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Market Overview Summary */}
      <Card className="border-2 border-emerald-200">
        <CardContent className="p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Market Overview
          </h2>
          <div className="grid grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-gray-600 mb-2">Overall Market Coverage</p>
              <div className="text-4xl font-bold text-emerald-600">
                {coverageData?.overallCoverage?.toFixed(1) || 0}%
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-2">Market Leader</p>
              <div className="text-xl font-semibold text-gray-900">
                {topPerformers[0]?.competitorName || 'N/A'}
              </div>
              <p className="text-sm text-gray-600">
                {topPerformers[0]?.coverage?.toFixed(1)}% coverage
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-2">Top Opportunity</p>
              <div className="text-xl font-semibold text-gray-900">
                {bottomFeatures[0]?.featureName?.slice(0, 20) || 'N/A'}
              </div>
              <p className="text-sm text-gray-600">
                {bottomFeatures[0]?.coverage?.toFixed(1)}% coverage
              </p>
            </div>
          </div>

          {/* Key Insights */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <TrendingUp className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-gray-900">
                  <strong>Market Trend:</strong> Average coverage at {coverageData?.overallCoverage?.toFixed(1)}% indicates maturing market
                </p>
              </div>
              {bottomFeatures.length > 0 && (
                <div className="flex items-start gap-2">
                  <Target className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-gray-900">
                    <strong>Strategic Priority:</strong> {bottomFeatures[0]?.featureName} shows low adoption ({bottomFeatures[0]?.coverage?.toFixed(0)}%) - differentiation opportunity
                  </p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top Performers */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-amber-600" />
            Market Leaders
          </CardTitle>
          <CardDescription>
            Top 5 exchanges by feature coverage
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {topPerformers.map((performer: any, index: number) => (
              <div 
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold",
                    index === 0 && "bg-gradient-to-br from-yellow-400 to-amber-500 text-white",
                    index === 1 && "bg-gray-300 text-gray-700",
                    index === 2 && "bg-amber-600 text-white",
                    index > 2 && "bg-blue-100 text-blue-700"
                  )}>
                    {index + 1}
                  </div>
                  <span className="font-medium text-gray-900">
                    {performer.competitorName}
                  </span>
                </div>
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                  {performer.coverage?.toFixed(1)}%
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Strategic Priorities */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            Strategic Priorities
          </CardTitle>
          <CardDescription>
            Features with low market coverage - differentiation opportunities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {bottomFeatures.map((feature: any, index: number) => (
              <div 
                key={index}
                className="p-4 bg-orange-50 rounded-lg border border-orange-200"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-orange-900">
                    {feature.featureName}
                  </span>
                  <Badge variant="outline" className="text-xs">
                    {feature.coverage?.toFixed(0)}% coverage
                  </Badge>
                </div>
                <p className="text-sm text-orange-800">
                  Only {feature.implementedBy} of {feature.totalCompetitors} exchanges have this - early mover advantage potential
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

