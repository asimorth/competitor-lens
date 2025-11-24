'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp,
  TrendingDown, 
  Minus,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ExecutiveViewProps {
  competitor: any;
  insights: any;
}

export function ExecutiveView({ competitor, insights }: ExecutiveViewProps) {
  if (!insights) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Loading executive insights...</p>
      </div>
    );
  }

  const getTrendIcon = (direction: string) => {
    switch (direction) {
      case 'up': return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'down': return <TrendingDown className="h-4 w-4 text-red-600" />;
      default: return <Minus className="h-4 w-4 text-gray-600" />;
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'high': return 'bg-red-100 text-red-800 border-red-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'low': return 'bg-green-100 text-green-800 border-green-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* Hero Summary Card */}
      <Card className="border-2 border-emerald-200 shadow-lg">
        <CardContent className="p-6">
          {/* Market Position Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
            <div>
              <h3 className="text-sm text-gray-600 mb-2">Market Position</h3>
              <div className="text-4xl font-bold text-emerald-600">
                #{insights.ranking}
              </div>
              <p className="text-sm text-gray-600">
                of {insights.totalEntities} exchanges
              </p>
            </div>

            <div>
              <h3 className="text-sm text-gray-600 mb-2">Overall Score</h3>
              <div className="text-4xl font-bold text-blue-600">
                {insights.overallScore}
              </div>
              <div className="flex items-center gap-1 mt-1">
                {getTrendIcon(insights.trend?.direction)}
                <span className="text-sm text-gray-600">
                  {insights.trend?.direction || 'stable'}
                </span>
              </div>
            </div>

            <div className="col-span-2 lg:col-span-1">
              <h3 className="text-sm text-gray-600 mb-2">Risk Level</h3>
              <Badge 
                variant="outline"
                className={cn("text-sm px-3 py-1", getRiskColor(insights.riskLevel))}
              >
                {insights.riskLevel?.toUpperCase() || 'MEDIUM'}
              </Badge>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-200 my-6" />

          {/* Strategic Summary */}
          <div className="space-y-4">
            <div>
              <span className="text-sm font-semibold text-gray-700 block mb-2">
                Market Positioning:
              </span>
              <p className="text-gray-900 leading-relaxed">
                {insights.positioningSummary}
              </p>
            </div>

            <div>
              <span className="text-sm font-semibold text-gray-700 block mb-2">
                Key Takeaway:
              </span>
              <p className="text-emerald-900 font-medium leading-relaxed">
                {insights.keyTakeaway}
              </p>
            </div>

            {insights.criticalAction && (
              <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="text-sm font-semibold text-orange-900 block mb-1">
                      Critical Action Required:
                    </span>
                    <p className="text-orange-800 text-sm">
                      {insights.criticalAction}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Quick Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard
          label="Feature Coverage"
          value={`${competitor.featureCoverage || insights.coverage}%`}
          trend={insights.trend}
        />
        <MetricCard
          label="Screenshot Count"
          value={competitor.screenshotCount || 0}
        />
        <MetricCard
          label="Market Segment"
          value={insights.ranking <= 5 ? 'Leader' : insights.ranking <= 12 ? 'Mid-tier' : 'Challenger'}
        />
      </div>

      {/* Opportunities (if any) */}
      {insights.opportunities && insights.opportunities.length > 0 && (
        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-emerald-600" />
              Strategic Opportunities
            </h3>
            <div className="space-y-3">
              {insights.opportunities.map((opp: any, index: number) => (
                <div 
                  key={index}
                  className="flex items-start gap-3 p-3 bg-emerald-50 rounded-lg border border-emerald-200"
                >
                  <div className="flex-1">
                    <p className="font-medium text-emerald-900">{opp.name}</p>
                    <div className="flex items-center gap-4 mt-1 text-sm text-emerald-700">
                      <span>Impact: {opp.impact}</span>
                      <span>Effort: {opp.effort}</span>
                    </div>
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

// Metric Card Component
function MetricCard({ 
  label, 
  value, 
  trend 
}: { 
  label: string; 
  value: string | number; 
  trend?: { direction: string; change: number };
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-sm text-gray-600 mb-2">{label}</p>
        <div className="flex items-end gap-2">
          <span className="text-2xl font-bold text-gray-900">{value}</span>
          {trend && trend.change !== 0 && (
            <span className={cn(
              "text-sm font-medium",
              trend.direction === 'up' ? 'text-green-600' : 'text-red-600'
            )}>
              {trend.direction === 'up' ? '+' : ''}{trend.change}%
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

