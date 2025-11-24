'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Palette,
  Image as ImageIcon,
  Eye,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getScreenshotUrl } from '@/lib/screenshot-utils';
import Image from 'next/image';
import { useState } from 'react';
import Link from 'next/link';

interface FeatureDesignerViewProps {
  feature: any;
  insights: any;
  screenshots: any[];
}

export function FeatureDesignerView({ feature, insights, screenshots }: FeatureDesignerViewProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  if (!insights) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Loading designer insights...</p>
      </div>
    );
  }

  const qualityDist = insights.screenshotQuality || {
    total: screenshots.length,
    excellent: 0,
    good: 0,
    needsUpdate: 0
  };

  // Group screenshots by competitor
  const byCompetitor = screenshots.reduce((acc: any, s: any) => {
    const compName = s.exchangeName || s.competitor?.name || 'Unknown';
    if (!acc[compName]) {
      acc[compName] = [];
    }
    acc[compName].push(s);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Quality Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-purple-600" />
            Screenshot Quality Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            <div className="p-3 bg-gray-100 rounded-lg">
              <p className="text-xs text-gray-600 mb-1">Total</p>
              <p className="text-2xl font-bold text-gray-900">{qualityDist.total}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <p className="text-xs text-green-700 mb-1">Excellent</p>
              <p className="text-2xl font-bold text-green-900">{qualityDist.excellent}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <p className="text-xs text-blue-700 mb-1">Good</p>
              <p className="text-2xl font-bold text-blue-900">{qualityDist.good}</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-lg">
              <p className="text-xs text-orange-700 mb-1">Needs Update</p>
              <p className="text-2xl font-bold text-orange-900">{qualityDist.needsUpdate}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Implementation Showcase by Competitor */}
      {Object.entries(byCompetitor).map(([compName, items]: [string, any]) => (
        <Card key={compName}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">{compName}</CardTitle>
              <Badge variant="outline" className="text-xs">
                {items.length} screenshots
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {items.map((screenshot: any) => (
                <div
                  key={screenshot.id || screenshot.url}
                  className={cn(
                    "group relative aspect-video rounded-lg overflow-hidden cursor-pointer transition-all hover:scale-105",
                    "border-2",
                    screenshot.quality === 'excellent' && "border-green-500",
                    screenshot.quality === 'good' && "border-blue-500",
                    (!screenshot.quality || screenshot.quality === 'unknown') && "border-gray-300"
                  )}
                  onClick={() => setSelectedImage(screenshot.fullUrl || getScreenshotUrl(screenshot))}
                >
                  <Image
                    src={screenshot.fullUrl || getScreenshotUrl(screenshot)}
                    alt={screenshot.caption || screenshot.fileName}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 50vw, 25vw"
                  />
                  
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                    <Eye className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>

                  {/* Quality Badge */}
                  {screenshot.quality && screenshot.quality !== 'unknown' && (
                    <div className="absolute top-2 right-2">
                      <Badge 
                        variant="outline"
                        className={cn(
                          "text-xs bg-white/90 backdrop-blur-sm",
                          screenshot.quality === 'excellent' && "border-green-500 text-green-700",
                          screenshot.quality === 'good' && "border-blue-500 text-blue-700"
                        )}
                      >
                        {screenshot.quality}
                      </Badge>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}

      {/* UI Patterns */}
      {insights.detectedPatterns && insights.detectedPatterns.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Common Design Patterns</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {insights.detectedPatterns.map((pattern: any, index: number) => (
                <div 
                  key={index}
                  className="p-3 bg-purple-50 rounded-lg border border-purple-200"
                >
                  <p className="font-medium text-purple-900 capitalize">{pattern.type}</p>
                  <p className="text-sm text-purple-700">{pattern.count} variations</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Missing Screenshots */}
      {insights.missingScreenshots && insights.missingScreenshots.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Missing Visual Documentation</CardTitle>
            <CardDescription>
              Suggested screenshots to capture
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {insights.missingScreenshots.map((missing: string, index: number) => (
                <div 
                  key={index}
                  className="flex items-center gap-2 p-2 text-sm text-gray-700 bg-gray-50 rounded"
                >
                  <ImageIcon className="h-4 w-4 text-gray-500" />
                  {missing}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recommendations */}
      {insights.recommendations && insights.recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Designer Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {insights.recommendations.map((rec: string, index: number) => (
                <div 
                  key={index}
                  className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200"
                >
                  <CheckCircle className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                  <p className="text-blue-900 text-sm">{rec}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lightbox */}
      {selectedImage && (
        <div 
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-6xl max-h-[90vh]">
            <Image
              src={selectedImage}
              alt="Screenshot"
              width={1600}
              height={1000}
              className="rounded-lg object-contain"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 p-2 bg-white/90 rounded-full hover:bg-white transition-colors"
            >
              <XCircle className="h-6 w-6 text-gray-900" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

