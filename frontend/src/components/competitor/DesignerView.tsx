'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Palette,
  Image as ImageIcon,
  CheckCircle,
  AlertCircle,
  Eye
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getScreenshotUrl } from '@/lib/screenshot-utils';
import Image from 'next/image';
import { useState } from 'react';

interface DesignerViewProps {
  competitor: any;
  insights: any;
  screenshots: any[];
}

export function DesignerView({ competitor, insights, screenshots }: DesignerViewProps) {
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
    needsUpdate: 0,
    missing: 0
  };

  const groupedScreenshots = groupByCategory(screenshots);

  return (
    <div className="space-y-6">
      {/* UI Quality Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-purple-600" />
            Visual Quality Assessment
          </CardTitle>
          <CardDescription>
            Screenshot coverage and quality metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Quality Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <QualityMetric
              label="Total"
              value={qualityDist.total}
              color="gray"
            />
            <QualityMetric
              label="Excellent"
              value={qualityDist.excellent}
              color="green"
            />
            <QualityMetric
              label="Good"
              value={qualityDist.good}
              color="blue"
            />
            <QualityMetric
              label="Needs Update"
              value={qualityDist.needsUpdate}
              color="orange"
            />
          </div>

          {/* Coverage Progress */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">
                Screenshot Coverage
              </span>
              <span className="text-sm font-semibold text-gray-900">
                {insights.screenflowCompleteness || 0}%
              </span>
            </div>
            <Progress value={insights.screenflowCompleteness || 0} className="h-2" />
            <p className="text-xs text-gray-500 mt-2">
              {insights.screenflowCompleteness >= 80 
                ? 'Excellent coverage across user flows'
                : insights.screenflowCompleteness >= 50
                ? 'Good coverage, some gaps exist'
                : 'Coverage needs improvement'}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Screenshot Gallery by Category */}
      {Object.entries(groupedScreenshots).map(([category, items]: [string, any]) => (
        <Card key={category}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">{category}</CardTitle>
              <Badge variant="outline" className="text-xs">
                {items.length} screenshots
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {items.map((screenshot: any) => (
                <ScreenshotCard
                  key={screenshot.id}
                  screenshot={screenshot}
                  onClick={() => setSelectedImage(getScreenshotUrl(screenshot))}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      ))}

      {/* UI Patterns */}
      {insights.detectedPatterns && insights.detectedPatterns.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Detected UI Patterns</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {insights.detectedPatterns.map((pattern: any, index: number) => (
                <div 
                  key={index}
                  className="p-3 bg-purple-50 rounded-lg border border-purple-200"
                >
                  <p className="font-medium text-purple-900">{pattern.type}</p>
                  <p className="text-sm text-purple-700">{pattern.count} instances</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lightbox Modal */}
      {selectedImage && (
        <div 
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <Image
              src={selectedImage}
              alt="Screenshot"
              width={1200}
              height={800}
              className="rounded-lg object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// Helper Components

function QualityMetric({ label, value, color }: { label: string; value: number; color: string }) {
  const colorClasses = {
    gray: 'bg-gray-100 text-gray-900 border-gray-300',
    green: 'bg-green-100 text-green-900 border-green-300',
    blue: 'bg-blue-100 text-blue-900 border-blue-300',
    orange: 'bg-orange-100 text-orange-900 border-orange-300'
  };

  return (
    <div className={cn("p-3 rounded-lg border", colorClasses[color as keyof typeof colorClasses])}>
      <p className="text-xs font-medium mb-1">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}

function ScreenshotCard({ screenshot, onClick }: { screenshot: any; onClick: () => void }) {
  const quality = screenshot.quality || 'unknown';
  const qualityColors = {
    excellent: 'border-green-500',
    good: 'border-blue-500',
    acceptable: 'border-yellow-500',
    poor: 'border-red-500',
    unknown: 'border-gray-300'
  };

  return (
    <div 
      className={cn(
        "group relative aspect-video rounded-lg border-2 overflow-hidden cursor-pointer transition-all hover:scale-105 hover:shadow-lg",
        qualityColors[quality as keyof typeof qualityColors]
      )}
      onClick={onClick}
    >
      <Image
        src={getScreenshotUrl(screenshot)}
        alt={screenshot.fileName}
        fill
        className="object-cover"
        sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
      />
      
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
        <Eye className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>

      {/* Quality Badge */}
      {quality !== 'unknown' && (
        <div className="absolute top-2 right-2">
          <Badge 
            variant="outline"
            className={cn(
              "text-xs bg-white/90 backdrop-blur-sm",
              quality === 'excellent' && "border-green-500 text-green-700",
              quality === 'good' && "border-blue-500 text-blue-700",
              quality === 'acceptable' && "border-yellow-500 text-yellow-700",
              quality === 'poor' && "border-red-500 text-red-700"
            )}
          >
            {quality}
          </Badge>
        </div>
      )}

      {/* Context Label */}
      {screenshot.context && (
        <div className="absolute bottom-2 left-2">
          <Badge variant="outline" className="text-xs bg-white/90 backdrop-blur-sm">
            {screenshot.context}
          </Badge>
        </div>
      )}
    </div>
  );
}

function groupByCategory(screenshots: any[]) {
  const grouped: Record<string, any[]> = {};

  screenshots.forEach(screenshot => {
    const category = screenshot.featureCategory || screenshot.feature?.category || 'Uncategorized';
    if (!grouped[category]) {
      grouped[category] = [];
    }
    grouped[category].push(screenshot);
  });

  return grouped;
}

