'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, Camera, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface CompetitorCardProps {
  competitor: {
    id: string;
    name: string;
    region?: string;
    featureCount?: number;
    screenshotCount?: number;
    coverage?: number;
  };
  compact?: boolean;
}

export function CompetitorCard({ competitor, compact = false }: CompetitorCardProps) {
  const isTR = competitor.region === 'TR' || 
    ['OKX TR', 'Paribu', 'BTCTurk', 'BinanceTR', 'Garanti Kripto', 'BybitTR', 'BiLira', 'GateTR'].some(
      name => competitor.name.includes(name)
    );

  return (
    <Link href={`/competitors/${competitor.id}`}>
      <Card
        className={cn(
          "transition-all active:scale-[0.98] hover:shadow-md",
          "cursor-pointer border-2",
          isTR ? "border-blue-200" : "border-purple-200",
          compact ? "p-2" : "p-3"
        )}
      >
        {/* Header */}
        <div className="flex items-start gap-2 mb-2">
          <div className={cn(
            "rounded-lg flex items-center justify-center flex-shrink-0",
            "bg-gradient-to-br text-white font-bold",
            isTR ? "from-blue-500 to-blue-600" : "from-purple-500 to-purple-600",
            compact ? "w-10 h-10 text-lg" : "w-12 h-12 text-xl"
          )}>
            {competitor.name.charAt(0)}
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className={cn(
              "font-bold truncate",
              compact ? "text-sm" : "text-base"
            )}>
              {competitor.name}
            </h3>
            {competitor.region && (
              <Badge 
                variant="outline" 
                className={cn(
                  "text-xs mt-0.5",
                  isTR ? "bg-blue-50 text-blue-700 border-blue-300" : "bg-purple-50 text-purple-700 border-purple-300"
                )}
              >
                {isTR ? '🇹🇷 TR' : '🌍 Global'}
              </Badge>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          {competitor.featureCount !== undefined && (
            <div className="flex items-center gap-1">
              <CheckCircle className="h-3.5 w-3.5 text-green-600" />
              <span className="font-medium">{competitor.featureCount}</span>
              <span className="text-gray-600">features</span>
            </div>
          )}
          {competitor.screenshotCount !== undefined && (
            <div className="flex items-center gap-1">
              <Camera className="h-3.5 w-3.5 text-blue-600" />
              <span className="font-medium">{competitor.screenshotCount}</span>
              <span className="text-gray-600">screens</span>
            </div>
          )}
        </div>

        {/* Coverage bar */}
        {competitor.coverage !== undefined && (
          <div className="mt-2">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-gray-600">Coverage</span>
              <span className="font-semibold">{competitor.coverage}%</span>
            </div>
            <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className={cn(
                  "h-full rounded-full transition-all",
                  competitor.coverage >= 70 && "bg-green-500",
                  competitor.coverage >= 40 && competitor.coverage < 70 && "bg-yellow-500",
                  competitor.coverage < 40 && "bg-red-500"
                )}
                style={{ width: `${competitor.coverage}%` }}
              />
            </div>
          </div>
        )}
      </Card>
    </Link>
  );
}

