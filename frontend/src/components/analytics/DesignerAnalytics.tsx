'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Palette,
  Image as ImageIcon,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface DesignerAnalyticsProps {
  coverageData: any;
  screenshotStats: any;
}

export function DesignerAnalytics({ coverageData, screenshotStats }: DesignerAnalyticsProps) {
  // Mock screenshot stats (will be replaced with real data)
  const stats = screenshotStats || {
    total: 0,
    withFeature: 0,
    orphan: 0,
    excellent: 0,
    good: 0,
    needsUpdate: 0
  };

  const coveragePercent = stats.total > 0 ? Math.round((stats.withFeature / stats.total) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Screenshot Coverage Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5 text-purple-600" />
            Screenshot Coverage Report
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="p-4 bg-gray-100 rounded-lg">
              <p className="text-xs text-gray-600 mb-1">Total Screenshots</p>
              <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <div className="p-4 bg-green-100 rounded-lg">
              <p className="text-xs text-green-700 mb-1">Excellent</p>
              <p className="text-3xl font-bold text-green-900">{stats.excellent || 0}</p>
            </div>
            <div className="p-4 bg-blue-100 rounded-lg">
              <p className="text-xs text-blue-700 mb-1">Good</p>
              <p className="text-3xl font-bold text-blue-900">{stats.good || 0}</p>
            </div>
            <div className="p-4 bg-orange-100 rounded-lg">
              <p className="text-xs text-orange-700 mb-1">Needs Update</p>
              <p className="text-3xl font-bold text-orange-900">{stats.needsUpdate || 0}</p>
            </div>
          </div>

          {/* Feature Assignment Progress */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">
                Feature Assignment Coverage
              </span>
              <span className="text-lg font-bold text-purple-600">
                {coveragePercent}%
              </span>
            </div>
            <Progress value={coveragePercent} className="h-2" />
            <div className="flex justify-between text-xs text-gray-600 mt-2">
              <span>{stats.withFeature} assigned</span>
              <span>{stats.orphan} unassigned</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Visual Quality Benchmark */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-purple-600" />
            Visual Quality Benchmarks
          </CardTitle>
          <CardDescription>
            Screenshot quality distribution across competitors
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {coverageData?.competitorCoverage?.slice(0, 10).map((comp: any, index: number) => {
              // Mock quality score (will be replaced with real data)
              const qualityScore = Math.floor(Math.random() * 30) + 70;
              
              return (
                <div 
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <Link 
                    href={`/competitors/${comp.competitorId}`}
                    className="font-medium text-gray-900 hover:underline"
                  >
                    {comp.competitorName}
                  </Link>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-600">
                      Quality: {qualityScore}/100
                    </span>
                    <Badge 
                      variant="outline"
                      className={cn(
                        "text-xs",
                        qualityScore >= 85 && "bg-green-100 text-green-800",
                        qualityScore >= 70 && qualityScore < 85 && "bg-blue-100 text-blue-800",
                        qualityScore < 70 && "bg-yellow-100 text-yellow-800"
                      )}
                    >
                      {qualityScore >= 85 ? 'Excellent' : qualityScore >= 70 ? 'Good' : 'Fair'}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Design System Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Design System Maturity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="font-medium text-green-900">High Maturity</span>
              </div>
              <p className="text-sm text-green-800">
                Top 5 competitors show consistent design systems across features
              </p>
            </div>

            <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="h-5 w-5 text-yellow-600" />
                <span className="font-medium text-yellow-900">Medium Maturity</span>
              </div>
              <p className="text-sm text-yellow-800">
                Mid-tier competitors have inconsistent visual language
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Screenshot Gaps */}
      <Card>
        <CardHeader>
          <CardTitle>Documentation Gaps</CardTitle>
          <CardDescription>
            Features missing visual documentation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-sm text-gray-600">
              {stats.orphan} screenshots need feature assignment
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

