'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp,
  BarChart3,
  Target,
  Lightbulb,
  CheckCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface PMAnalyticsProps {
  coverageData: any;
  gapAnalysis: any[];
}

export function PMAnalytics({ coverageData, gapAnalysis }: PMAnalyticsProps) {
  const topPerformers = coverageData?.competitorCoverage || [];
  const opportunities = gapAnalysis.filter(f => f.coverage < 50);
  const mustHaves = gapAnalysis.filter(f => f.coverage >= 80);

  return (
    <div className="space-y-6">
      {/* Market Coverage Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-blue-600" />
            Market Coverage Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">
                  Overall Market Maturity
                </span>
                <span className="text-lg font-bold text-blue-600">
                  {coverageData?.overallCoverage?.toFixed(1)}%
                </span>
              </div>
              <Progress value={coverageData?.overallCoverage || 0} className="h-2" />
            </div>

            <div className="grid grid-cols-3 gap-4 pt-4 border-t">
              <div>
                <p className="text-xs text-gray-600 mb-1">Total Competitors</p>
                <p className="text-2xl font-bold">{coverageData?.totalCompetitors || 0}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-1">Total Features</p>
                <p className="text-2xl font-bold">{coverageData?.totalFeatures || 0}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-1">Total Implementations</p>
                <p className="text-2xl font-bold">{coverageData?.totalImplementations || 0}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Opportunity Heatmap */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-emerald-600" />
            Feature Opportunities
          </CardTitle>
          <CardDescription>
            Low coverage = High differentiation potential
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {opportunities.slice(0, 10).map((feature: any, index: number) => {
              const opportunityLevel = 
                feature.coverage < 30 ? 'high' : 
                feature.coverage < 50 ? 'medium' : 'low';

              return (
                <div 
                  key={index}
                  className={cn(
                    "p-4 rounded-lg border-2",
                    opportunityLevel === 'high' && "bg-green-50 border-green-200",
                    opportunityLevel === 'medium' && "bg-yellow-50 border-yellow-200",
                    opportunityLevel === 'low' && "bg-blue-50 border-blue-200"
                  )}
                >
                  <div className="flex items-start justify-between mb-2">
                    <Link 
                      href={`/features/${feature.featureId}`}
                      className="font-medium text-gray-900 hover:underline"
                    >
                      {feature.featureName}
                    </Link>
                    <Badge 
                      variant="outline"
                      className={cn(
                        "text-xs",
                        opportunityLevel === 'high' && "bg-green-100 text-green-800",
                        opportunityLevel === 'medium' && "bg-yellow-100 text-yellow-800",
                        opportunityLevel === 'low' && "bg-blue-100 text-blue-800"
                      )}
                    >
                      {opportunityLevel.toUpperCase()} OPPORTUNITY
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span>Coverage: {feature.coverage?.toFixed(0)}%</span>
                    <span>•</span>
                    <span>{feature.implementedBy} of {feature.totalCompetitors} exchanges</span>
                  </div>
                  {feature.category && (
                    <Badge variant="outline" className="mt-2 text-xs">
                      {feature.category}
                    </Badge>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Must-Have Features */}
      {mustHaves.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-red-600" />
              Industry Standards (Must-Have)
            </CardTitle>
            <CardDescription>
              Features with high market coverage - critical to have
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {mustHaves.slice(0, 10).map((feature: any, index: number) => (
                <div 
                  key={index}
                  className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200"
                >
                  <Link 
                    href={`/features/${feature.featureId}`}
                    className="font-medium text-red-900 hover:underline"
                  >
                    {feature.featureName}
                  </Link>
                  <Badge variant="outline" className="text-xs bg-red-100 text-red-800">
                    {feature.coverage?.toFixed(0)}% coverage
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Competitive Landscape */}
      <Card>
        <CardHeader>
          <CardTitle>Competitive Landscape</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {topPerformers.slice(0, 10).map((comp: any, index: number) => (
              <div 
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold",
                    index < 3 && "bg-gradient-to-br from-yellow-400 to-amber-500 text-white",
                    index >= 3 && index < 7 && "bg-blue-500 text-white",
                    index >= 7 && "bg-gray-400 text-white"
                  )}>
                    {index + 1}
                  </div>
                  <Link 
                    href={`/competitors/${comp.competitorId}`}
                    className="font-medium text-gray-900 hover:underline"
                  >
                    {comp.competitorName}
                  </Link>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-600">
                    {comp.implementedFeatures}/{comp.totalFeatures}
                  </span>
                  <Badge 
                    variant="outline"
                    className={cn(
                      "text-xs",
                      comp.coverage > 75 && "bg-green-100 text-green-800",
                      comp.coverage > 50 && comp.coverage <= 75 && "bg-blue-100 text-blue-800",
                      comp.coverage <= 50 && "bg-gray-100 text-gray-800"
                    )}
                  >
                    {comp.coverage?.toFixed(0)}%
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

