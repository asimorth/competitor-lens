'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle,
  XCircle,
  AlertCircle,
  TrendingUp,
  Target,
  Lightbulb
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface PMViewProps {
  competitor: any;
  insights: any;
}

export function PMView({ competitor, insights }: PMViewProps) {
  if (!insights) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Loading PM insights...</p>
      </div>
    );
  }

  const getQualityColor = (quality: string | null) => {
    switch (quality) {
      case 'excellent': return 'bg-green-100 text-green-800';
      case 'good': return 'bg-blue-100 text-blue-800';
      case 'basic': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Competitive Analysis Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-blue-600" />
            Competitive Position Analysis
          </CardTitle>
          <CardDescription>
            Strengths, weaknesses, and strategic positioning
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Strength Areas */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Strength Areas
              </h4>
              <div className="space-y-2">
                {insights.strengths && insights.strengths.length > 0 ? (
                  insights.strengths.map((strength: any, index: number) => (
                    <div key={index} className="flex items-start gap-2">
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                        {strength.name}
                      </Badge>
                      {strength.score && (
                        <span className="text-sm text-gray-600">
                          {strength.score}%
                        </span>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">No significant strengths identified</p>
                )}
              </div>
            </div>

            {/* Gap Areas */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-orange-600" />
                Gap Areas
              </h4>
              <div className="space-y-2">
                {insights.gaps && insights.gaps.length > 0 ? (
                  insights.gaps.map((gap: any, index: number) => (
                    <div key={index} className="flex items-start gap-2">
                      <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-300">
                        {gap.name}
                      </Badge>
                      {gap.coverage !== undefined && (
                        <span className="text-sm text-gray-600">
                          {gap.coverage}%
                        </span>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">No critical gaps identified</p>
                )}
              </div>
            </div>
          </div>

          {/* Competitive Position Badge */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">
                Competitive Position:
              </span>
              <Badge 
                variant="outline"
                className={cn(
                  "text-sm px-3 py-1",
                  insights.competitivePosition === 'leader' && "bg-green-100 text-green-800 border-green-300",
                  insights.competitivePosition === 'challenger' && "bg-blue-100 text-blue-800 border-blue-300",
                  insights.competitivePosition === 'follower' && "bg-yellow-100 text-yellow-800 border-yellow-300",
                  insights.competitivePosition === 'laggard' && "bg-red-100 text-red-800 border-red-300"
                )}
              >
                {insights.competitivePosition?.toUpperCase() || 'UNKNOWN'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Strategic Recommendations */}
      {insights.recommendations && insights.recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-amber-600" />
              Strategic Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {insights.recommendations.map((rec: any, index: number) => (
                <div 
                  key={index}
                  className={cn(
                    "p-4 rounded-lg border-2",
                    rec.priority === 'high' && "bg-red-50 border-red-200",
                    rec.priority === 'medium' && "bg-yellow-50 border-yellow-200",
                    rec.priority === 'low' && "bg-blue-50 border-blue-200"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <Badge 
                      variant="outline"
                      className={cn(
                        "text-xs px-2 py-0.5 mt-0.5",
                        rec.priority === 'high' && "bg-red-100 text-red-800 border-red-300",
                        rec.priority === 'medium' && "bg-yellow-100 text-yellow-800 border-yellow-300",
                        rec.priority === 'low' && "bg-blue-100 text-blue-800 border-blue-300"
                      )}
                    >
                      {rec.priority?.toUpperCase()}
                    </Badge>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 mb-1">
                        {rec.action}
                      </p>
                      <p className="text-sm text-gray-600">
                        {rec.reason}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Opportunity Score */}
      {insights.opportunityScore && (
        <Card>
          <CardHeader>
            <CardTitle>Strategic Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Opportunity Score</p>
                <div className="text-3xl font-bold text-blue-600">
                  {insights.opportunityScore}/100
                </div>
              </div>
              <Badge 
                variant="outline"
                className={cn(
                  "text-sm px-4 py-2",
                  insights.strategicValue === 'critical' && "bg-red-100 text-red-800 border-red-300",
                  insights.strategicValue === 'high' && "bg-orange-100 text-orange-800 border-orange-300",
                  insights.strategicValue === 'medium' && "bg-blue-100 text-blue-800 border-blue-300",
                  insights.strategicValue === 'low' && "bg-gray-100 text-gray-800 border-gray-300"
                )}
              >
                {insights.strategicValue?.toUpperCase() || 'MEDIUM'} VALUE
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

