'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Camera, Flag, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export interface FeatureCardData {
  id: string;
  name: string;
  category?: string;
  description?: string;
  trCoverage: number;
  globalCoverage: number;
  screenshotCount: number;
  hasScreenshots: boolean;
}

export interface FeatureCardProps {
  feature: FeatureCardData;
  className?: string;
}

export function FeatureCard({ feature, className }: FeatureCardProps) {
  // Calculate total coverage percentage (out of 15 TR + 4 Global = 19 total)
  const trTotal = 15;
  const globalTotal = 4;
  const totalCoverage = feature.trCoverage + feature.globalCoverage;
  const totalExchanges = trTotal + globalTotal;
  const coveragePercentage = Math.round((totalCoverage / totalExchanges) * 100);

  // TR Coverage percentage
  const trCoveragePercentage = Math.round((feature.trCoverage / trTotal) * 100);

  // Coverage color
  const getCoverageColor = (percentage: number) => {
    if (percentage >= 60) return 'text-green-600';
    if (percentage >= 30) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getCoverageBg = (percentage: number) => {
    if (percentage >= 60) return 'bg-green-500';
    if (percentage >= 30) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <Link href={`/features-simple/${feature.id}`}>
      <Card 
        className={cn(
          "cursor-pointer h-full group border-gray-100",
          "hover:border-blue-200/50 hover:shadow-glow-blue",
          className
        )}
      >
        <CardContent className="p-4 md:p-5">
          {/* Header */}
          <div className="mb-3">
            <div className="flex items-start justify-between gap-2 mb-2">
              <h3 className="font-semibold text-base md:text-lg leading-tight flex-1 group-hover:text-blue-600 transition-colors">
                {feature.name}
              </h3>
              {feature.category && (
                <Badge variant="outline" className="text-xs flex-shrink-0 border-gray-200">
                  {feature.category}
                </Badge>
              )}
            </div>
            
            {feature.description && (
              <p className="text-xs md:text-sm text-gray-600 line-clamp-2">
                {feature.description}
              </p>
            )}
          </div>

          {/* Coverage Stats */}
          <div className="space-y-3">
            {/* Coverage Badge */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 font-medium">Coverage:</span>
              <Badge 
                className={cn(
                  "font-bold shadow-xs",
                  coveragePercentage >= 60 && "bg-emerald-100 text-emerald-700 border-emerald-200",
                  coveragePercentage >= 30 && coveragePercentage < 60 && "bg-amber-100 text-amber-700 border-amber-200",
                  coveragePercentage < 30 && "bg-red-100 text-red-700 border-red-200"
                )}
              >
                {coveragePercentage}%
              </Badge>
            </div>

            {/* Progress Bar - TR Focus */}
            <div className="space-y-1">
              <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden shadow-inner">
                <div 
                  className={cn(
                    "h-full rounded-full transition-all duration-500",
                    getCoverageBg(trCoveragePercentage)
                  )}
                  style={{ 
                    width: `${trCoveragePercentage}%`,
                    boxShadow: '0 0 8px rgba(0,0,0,0.1)'
                  }}
                />
              </div>
            </div>

            {/* Stats Row */}
            <div className="flex items-center justify-between text-xs md:text-sm">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 text-gray-600">
                  <Flag className="h-3 w-3 md:h-4 md:w-4" />
                  <span>
                    <span className={cn("font-medium", getCoverageColor(trCoveragePercentage))}>
                      {feature.trCoverage}
                    </span>
                    <span className="text-gray-400">/{trTotal}</span>
                  </span>
                  <span className="text-gray-500">TR</span>
                </div>

                <div className="flex items-center gap-1 text-gray-600">
                  <Globe className="h-3 w-3 md:h-4 md:w-4" />
                  <span>
                    <span className="font-medium">
                      {feature.globalCoverage}
                    </span>
                    <span className="text-gray-400">/{globalTotal}</span>
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1 text-gray-600">
                <Camera className="h-3 w-3 md:h-4 md:w-4" />
                <span className="font-medium">{feature.screenshotCount}</span>
              </div>
            </div>
          </div>

          {/* No Screenshots Warning */}
          {!feature.hasScreenshots && (
            <div className="mt-3 text-xs text-amber-600 bg-amber-50 rounded px-2 py-1">
              No screenshots available
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}

