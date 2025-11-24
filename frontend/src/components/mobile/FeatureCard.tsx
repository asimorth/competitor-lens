'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Camera } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FeatureCardProps {
  feature: {
    id: string;
    name: string;
    category?: string;
    hasFeature: boolean;
    screenshots?: number;
    trCoverage?: number;
  };
  onClick?: () => void;
  compact?: boolean;
}

export function FeatureCard({ feature, onClick, compact = false }: FeatureCardProps) {
  return (
    <Card
      className={cn(
        "cursor-pointer transition-all active:scale-[0.98]",
        "hover:shadow-md border-2",
        feature.hasFeature ? "border-green-200 bg-green-50/30" : "border-gray-200",
        compact ? "p-2" : "p-3"
      )}
      onClick={onClick}
    >
      <div className="flex items-center justify-between gap-2">
        {/* Left: Feature info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className={cn(
              "font-medium truncate",
              compact ? "text-sm" : "text-base"
            )}>
              {feature.name}
            </h3>
            {feature.hasFeature ? (
              <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
            ) : (
              <XCircle className="h-4 w-4 text-gray-300 flex-shrink-0" />
            )}
          </div>
          
          {/* Badges */}
          <div className="flex gap-1.5 mt-1 flex-wrap">
            {feature.category && !compact && (
              <Badge variant="outline" className="text-xs py-0 px-1.5">
                {feature.category}
              </Badge>
            )}
            {feature.trCoverage !== undefined && (
              <Badge 
                variant="outline" 
                className={cn(
                  "text-xs py-0 px-1.5",
                  feature.trCoverage >= 70 && "bg-green-100 text-green-700",
                  feature.trCoverage >= 40 && feature.trCoverage < 70 && "bg-yellow-100 text-yellow-700",
                  feature.trCoverage < 40 && "bg-red-100 text-red-700"
                )}
              >
                TR: {feature.trCoverage}%
              </Badge>
            )}
            {feature.screenshots !== undefined && feature.screenshots > 0 && (
              <Badge className="text-xs py-0 px-1.5 bg-blue-100 text-blue-700 border-blue-300">
                <Camera className="h-3 w-3 mr-0.5" />
                {feature.screenshots}
              </Badge>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

