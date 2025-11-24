'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Target,
  Lightbulb,
  TrendingUp,
  CheckCircle,
  XCircle,
  Building2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface FeaturePMViewProps {
  feature: any;
  insights: any;
  exchanges: any[];
}

export function FeaturePMView({ feature, insights, exchanges }: FeaturePMViewProps) {
  if (!insights) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Loading PM insights...</p>
      </div>
    );
  }

  const getOpportunityColor = (score: number) => {
    if (score >= 70) return 'bg-green-100 text-green-800 border-green-300';
    if (score >= 40) return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    return 'bg-red-100 text-red-800 border-red-300';
  };

  const getOpportunityLevel = (score: number) => {
    if (score >= 70) return 'HIGH';
    if (score >= 40) return 'MEDIUM';
    return 'LOW';
  };

  const implementingExchanges = exchanges.filter(e => e.hasFeature);
  const missingExchanges = exchanges.filter(e => !e.hasFeature);

  return (
    <div className="space-y-6">
      {/* Opportunity Score Card */}
      <Card className="border-2 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-blue-600" />
            Opportunity Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-gray-600 mb-2">Opportunity Score</p>
              <div className="flex items-center gap-3">
                <div className="text-4xl font-bold text-blue-600">
                  {insights.opportunityScore}/100
                </div>
                <Badge 
                  variant="outline"
                  className={cn("text-sm", getOpportunityColor(insights.opportunityScore))}
                >
                  {getOpportunityLevel(insights.opportunityScore)}
                </Badge>
              </div>
            </div>

            <div>
              <p className="text-sm text-gray-600 mb-2">Business Value</p>
              <Badge variant="outline" className="text-sm px-3 py-1 bg-purple-100 text-purple-800 border-purple-300">
                {insights.strategicValue?.toUpperCase() || 'MEDIUM'}
              </Badge>
            </div>

            <div>
              <p className="text-sm text-gray-600 mb-2">Implementation Priority</p>
              <div className="text-3xl font-bold text-gray-900">
                {insights.implementationPriority}/10
              </div>
            </div>
          </div>

          {/* Roadmap Suggestion */}
          {insights.roadmapSuggestion && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-sm font-medium text-gray-700 mb-2">Roadmap Suggestion:</p>
              <p className="text-gray-900">{insights.roadmapSuggestion}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Implementation Status */}
      <Card>
        <CardHeader>
          <CardTitle>Implementation Status</CardTitle>
          <CardDescription>
            {implementingExchanges.length} have it · {missingExchanges.length} missing
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="implemented">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="implemented">
                <CheckCircle className="h-4 w-4 mr-2" />
                Has ({implementingExchanges.length})
              </TabsTrigger>
              <TabsTrigger value="missing">
                <XCircle className="h-4 w-4 mr-2" />
                Missing ({missingExchanges.length})
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="implemented" className="space-y-2 mt-4">
              {implementingExchanges.map((exchange: any) => (
                <div 
                  key={exchange.id}
                  className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200"
                >
                  <div className="flex items-center gap-3">
                    <Building2 className="h-4 w-4 text-green-700" />
                    <Link 
                      href={`/competitors/${exchange.id}`}
                      className="font-medium text-green-900 hover:underline"
                    >
                      {exchange.name}
                    </Link>
                  </div>
                  {exchange.implementationQuality && (
                    <Badge variant="outline" className="text-xs">
                      {exchange.implementationQuality}
                    </Badge>
                  )}
                </div>
              ))}
            </TabsContent>
            
            <TabsContent value="missing" className="space-y-2 mt-4">
              {missingExchanges.map((exchange: any) => (
                <div 
                  key={exchange.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <div className="flex items-center gap-3">
                    <Building2 className="h-4 w-4 text-gray-500" />
                    <Link 
                      href={`/competitors/${exchange.id}`}
                      className="font-medium text-gray-700 hover:underline"
                    >
                      {exchange.name}
                    </Link>
                  </div>
                  <Badge variant="outline" className="text-xs text-gray-600">
                    Gap
                  </Badge>
                </div>
              ))}
            </TabsContent>
          </Tabs>
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
                        "text-xs px-2 py-0.5",
                        rec.priority === 'high' && "bg-red-100 text-red-800",
                        rec.priority === 'medium' && "bg-yellow-100 text-yellow-800",
                        rec.priority === 'low' && "bg-blue-100 text-blue-800"
                      )}
                    >
                      {rec.priority?.toUpperCase()}
                    </Badge>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 mb-1">{rec.action}</p>
                      <p className="text-sm text-gray-600">{rec.reason}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Wins */}
      {insights.quickWins && insights.quickWins.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              Quick Wins
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {insights.quickWins.map((win: string, index: number) => (
                <div 
                  key={index}
                  className="flex items-center gap-2 p-3 bg-green-50 rounded-lg border border-green-200"
                >
                  <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                  <p className="text-green-900">{win}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

