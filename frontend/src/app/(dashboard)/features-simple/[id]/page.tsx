'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  RefreshCw,
  Flag,
  Globe,
  Camera
} from 'lucide-react';
import Link from 'next/link';
import { ScreenshotGrid, Screenshot } from '@/components/ScreenshotGrid';
import { Lightbox, LightboxScreenshot } from '@/components/Lightbox';
import { cn } from '@/lib/utils';

interface FeatureDetail {
  feature: {
    id: string;
    name: string;
    category: string;
    description: string;
  };
  coverage: {
    tr: number;
    trTotal: number;
    global: number;
    globalTotal: number;
    total: number;
  };
  competitors: {
    id: string;
    name: string;
    region: string;
    screenshots: Screenshot[];
    screenshotCount: number;
  }[];
  screenshotStats: {
    total: number;
    byRegion: {
      TR: number;
      Global: number;
    };
  };
}

export default function FeatureDetailPage() {
  const params = useParams();
  const featureId = params.id as string;

  const [featureDetail, setFeatureDetail] = useState<FeatureDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCompetitor, setSelectedCompetitor] = useState<string | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  useEffect(() => {
    loadFeatureDetail();
  }, [featureId]);

  const loadFeatureDetail = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/features/${featureId}/detail`
      );
      const data = await response.json();

      if (data.success && data.data) {
        setFeatureDetail(data.data);
        // Select first competitor by default
        if (data.data.competitors.length > 0) {
          setSelectedCompetitor(data.data.competitors[0].name);
        }
      }
    } catch (error) {
      console.error('Failed to load feature detail:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Feature detayı yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (!featureDetail) {
    return (
      <div>
        <Card className="text-center py-12">
          <CardContent>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Feature bulunamadı
            </h3>
            <p className="text-gray-600 mb-4">
              Bu feature henüz mevcut değil veya silinmiş olabilir.
            </p>
            <Link href="/features-simple">
              <Button>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Feature Listesine Dön
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const selectedCompetitorData = featureDetail.competitors.find(
    c => c.name === selectedCompetitor
  );

  const currentScreenshots = selectedCompetitorData?.screenshots || [];

  // Convert to lightbox format
  const lightboxScreenshots: LightboxScreenshot[] = currentScreenshots.map(s => ({
    url: s.url,
    thumbnailUrl: s.thumbnailUrl || s.url,
    caption: s.caption
  }));

  const trCoveragePercent = featureDetail.coverage.trTotal > 0
    ? Math.round((featureDetail.coverage.tr / featureDetail.coverage.trTotal) * 100)
    : 0;

  const globalCoveragePercent = featureDetail.coverage.globalTotal > 0
    ? Math.round((featureDetail.coverage.global / featureDetail.coverage.globalTotal) * 100)
    : 0;

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Back Button */}
      <Link href="/features-simple">
        <Button variant="ghost" size="sm" className="touch-target">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Feature Listesi
        </Button>
      </Link>

      {/* Feature Header */}
      <Card className="relative overflow-hidden bg-gradient-to-br from-blue-50/80 via-violet-50/80 to-purple-50/80 border-blue-100/50 shadow-glow-blue">
        {/* Subtle pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,_rgba(59,130,246,0.1)_1px,_transparent_0)] bg-[size:20px_20px]" />

        <CardContent className="relative z-10 p-4 md:p-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex-1">
              <h1 className="text-xl md:text-2xl lg:text-3xl font-bold mb-2">
                {featureDetail.feature.name}
              </h1>
              <Badge variant="outline" className="mb-3">
                {featureDetail.feature.category}
              </Badge>
              {featureDetail.feature.description && (
                <p className="text-sm md:text-base text-gray-600">
                  {featureDetail.feature.description}
                </p>
              )}
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={loadFeatureDetail}
              className="touch-target flex-shrink-0"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-3 border border-blue-100/50 hover:shadow-glow-blue transition-smooth">
              <div className="flex items-center gap-2 text-gray-600 mb-1">
                <div className="w-6 h-6 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Flag className="h-3 w-3 text-blue-600" />
                </div>
                <span className="text-xs md:text-sm font-medium">TR Coverage</span>
              </div>
              <div className="text-lg md:text-2xl font-bold bg-gradient-to-br from-blue-600 to-blue-500 bg-clip-text text-transparent">
                {featureDetail.coverage.tr}/{featureDetail.coverage.trTotal}
              </div>
              <div className="text-xs text-gray-500 font-medium">
                {trCoveragePercent}%
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-3 border border-emerald-100/50 hover:shadow-glow-emerald transition-smooth">
              <div className="flex items-center gap-2 text-gray-600 mb-1">
                <div className="w-6 h-6 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <Globe className="h-3 w-3 text-emerald-600" />
                </div>
                <span className="text-xs md:text-sm font-medium">Global</span>
              </div>
              <div className="text-lg md:text-2xl font-bold bg-gradient-to-br from-emerald-600 to-emerald-500 bg-clip-text text-transparent">
                {featureDetail.coverage.global}/{featureDetail.coverage.globalTotal}
              </div>
              <div className="text-xs text-gray-500 font-medium">
                {globalCoveragePercent}%
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-3 border border-purple-100/50 hover:shadow-glow-purple transition-smooth">
              <div className="flex items-center gap-2 text-gray-600 mb-1">
                <div className="w-6 h-6 rounded-lg bg-purple-100 flex items-center justify-center">
                  <Camera className="h-3 w-3 text-purple-600" />
                </div>
                <span className="text-xs md:text-sm font-medium">Toplam Görsel</span>
              </div>
              <div className="text-lg md:text-2xl font-bold bg-gradient-to-br from-purple-600 to-purple-500 bg-clip-text text-transparent">
                {featureDetail.screenshotStats.total}
              </div>
              <div className="text-xs text-gray-500">
                TR: {featureDetail.screenshotStats.byRegion.TR} |
                Global: {featureDetail.screenshotStats.byRegion.Global}
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-3 border border-amber-100/50 transition-smooth">
              <div className="flex items-center gap-2 text-gray-600 mb-1">
                <span className="text-xs md:text-sm font-medium">Borsalar</span>
              </div>
              <div className="text-lg md:text-2xl font-bold bg-gradient-to-br from-amber-600 to-amber-500 bg-clip-text text-transparent">
                {featureDetail.competitors.length}
              </div>
              <div className="text-xs text-gray-500">
                bu feature'da
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Competitor Tabs - Horizontal Scroll */}
      {featureDetail.competitors.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3">Borsalar</h2>
          <div className="overflow-x-auto hide-scrollbar pb-2">
            <div className="flex gap-2 min-w-min">
              {featureDetail.competitors.map(competitor => (
                <button
                  key={competitor.name}
                  onClick={() => setSelectedCompetitor(competitor.name)}
                  className={cn(
                    "touch-target px-4 py-2 rounded-lg whitespace-nowrap text-sm font-medium transition-all flex items-center gap-2",
                    selectedCompetitor === competitor.name
                      ? "bg-blue-600 text-white shadow-md"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  )}
                >
                  {competitor.name}
                  <Badge
                    variant={selectedCompetitor === competitor.name ? "secondary" : "default"}
                    className="text-xs"
                  >
                    {competitor.screenshotCount}
                  </Badge>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Screenshot Grid */}
      {selectedCompetitorData && (
        <div>
          <h2 className="text-lg font-semibold mb-3">
            Screenshots - {selectedCompetitor}
          </h2>
          <ScreenshotGrid
            screenshots={currentScreenshots}
            onImageClick={(index) => {
              setLightboxIndex(index);
              setLightboxOpen(true);
            }}
          />
        </div>
      )}

      {/* No Screenshots */}
      {(!selectedCompetitorData || currentScreenshots.length === 0) && (
        <Card className="text-center py-12">
          <CardContent>
            <Camera className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Screenshot bulunamadı
            </h3>
            <p className="text-gray-600">
              Bu borsa için henüz screenshot eklenmemiş.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Lightbox */}
      {lightboxOpen && (
        <Lightbox
          screenshots={lightboxScreenshots}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxOpen(false)}
          competitorName={selectedCompetitor || undefined}
          featureName={featureDetail.feature.name}
        />
      )}
    </div>
  );
}

