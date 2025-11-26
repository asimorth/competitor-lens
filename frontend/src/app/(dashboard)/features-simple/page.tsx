'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Search,
  RefreshCw,
  Sparkles,
  Filter as FilterIcon
} from 'lucide-react';
import { api } from '@/lib/api';
import { FeatureCard, FeatureCardData } from '@/components/FeatureCard';
import { cn } from '@/lib/utils';

type RegionFilter = 'all' | 'tr' | 'global';

export default function FeaturesSimplePage() {
  const [features, setFeatures] = useState<FeatureCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [regionFilter, setRegionFilter] = useState<RegionFilter>('tr');

  useEffect(() => {
    loadFeatures();
  }, []);

  const loadFeatures = async () => {
    setLoading(true);
    try {
      // Fetch from getAll() which returns DB-based data with relations
      const [featuresRes, competitorsRes] = await Promise.all([
        api.features.getAll(),
        api.competitors.getAll()
      ]);

      const allFeatures = featuresRes.data || [];
      const totalExchanges = competitorsRes.count || competitorsRes.data?.length || 0;

      // Enrich features using DB data
      const enrichedFeatures = allFeatures.map((feature: any) => {
        const implementedBy = feature.competitors?.filter((c: any) => c.hasFeature).length || 0;
        const coverage = totalExchanges > 0 ? Math.round((implementedBy / totalExchanges) * 100) : 0;

        // Calculate screenshots from DB relations
        // This is more reliable than file scanning for now
        let screenshotCount = feature._count?.screenshots || 0;

        // Fallback to iterating competitors if _count is missing
        if (screenshotCount === 0 && feature.competitors) {
          screenshotCount = feature.competitors.reduce((sum: number, c: any) => {
            // Check both direct screenshots and nested feature screenshots
            const directCount = c.screenshots ? (Array.isArray(c.screenshots) ? c.screenshots.length : 0) : 0;
            // Note: api.features.getAll might return different structure, need to be careful
            // But usually it returns features with competitors
            return sum + directCount;
          }, 0);
        }

        // Also check if we need to sum up from the 'competitors' array in the feature response
        // The getAll response structure: feature -> competitors (CompetitorFeature) -> competitor -> screenshots
        if (screenshotCount === 0 && feature.competitors) {
          screenshotCount = feature.competitors.reduce((sum: number, cf: any) => {
            // cf is CompetitorFeature. Does it have screenshots?
            // The controller includes: competitors: { include: { competitor: { include: { screenshots: ... } } } }
            // Let's assume the standard structure.
            // If not available, we might need to rely on what we have.
            // Actually, let's look at how features/page.tsx did it.
            return sum;
          }, 0);

          // Re-implementing logic from features/page.tsx (Step 2336)
          screenshotCount = feature._count?.screenshots || 0;
          if (screenshotCount === 0 && feature.competitors) {
            screenshotCount = feature.competitors.reduce((sum: number, c: any) => {
              // c is CompetitorFeature
              // Does it have screenshots?
              // The backend getAll includes: competitors: { include: { competitor: ... } }
              // It does NOT include screenshots deep inside usually.
              // BUT, we can use a simpler heuristic:
              // If we want to show "TRY Nemalandırma", we know we just uploaded it.
              // Let's trust feature._count.screenshots if available.
              return sum;
            }, 0);
          }
        }

        // FORCE FIX for TRY Nemalandırma if count is 0 but we know we uploaded
        if (feature.name === 'TRY Nemalandırma' && screenshotCount === 0) {
          // We know we uploaded 7
          // But better to use the data if possible.
          // Let's rely on the fact that we uploaded to DB.
          // If getAll() returns _count, it should be there.
        }

        // Calculate TR coverage
        const trCompetitors = feature.competitors?.filter((c: any) =>
          ['OKX TR', 'BinanceTR', 'BTCTurk', 'Paribu'].includes(c.competitor?.name) ||
          c.competitor?.region === 'TR'
        ).length || 0;

        return {
          id: feature.id,
          name: feature.name,
          category: feature.category,
          description: feature.description,
          trCoverage: trCompetitors, // Approximate
          globalCoverage: implementedBy - trCompetitors,
          screenshotCount: screenshotCount,
          hasScreenshots: screenshotCount > 0
        };
      });

      setFeatures(enrichedFeatures);
    } catch (error) {
      console.error('Failed to load features:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter features
  const filteredFeatures = features.filter(feature => {
    // Search filter
    const matchesSearch =
      feature.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (feature.category && feature.category.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (feature.description && feature.description.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!matchesSearch) return false;

    // Region filter
    if (regionFilter === 'tr') {
      // Show features that exist in TR AND have screenshots
      return feature.trCoverage > 0 && feature.hasScreenshots;
    } else if (regionFilter === 'global') {
      return feature.globalCoverage > 0;
    }

    return true; // 'all'
  });

  // Stats
  const stats = {
    total: features.length,
    withScreenshots: features.filter(f => f.hasScreenshots).length,
    highTRCoverage: features.filter(f => (f.trCoverage / 15) >= 0.6).length,
    totalScreenshots: features.reduce((sum, f) => sum + f.screenshotCount, 0)
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Feature'lar yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header - Ultra Compact Mobile */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-500/90 via-violet-500/90 to-purple-500/90 rounded-xl md:rounded-2xl p-4 md:p-6 text-white shadow-glow-blue">
        {/* Subtle pattern overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,_rgba(255,255,255,0.15)_1px,_transparent_0)] bg-[size:24px_24px] opacity-20" />

        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Sparkles className="h-4 w-4 md:h-5 md:w-5" />
            </div>
            <h1 className="text-lg md:text-2xl lg:text-3xl font-bold">
              Feature Gallery
            </h1>
          </div>
          <p className="text-sm md:text-base text-white/90">
            Screenshot bazlı feature analizi - TR borsaları odaklı
          </p>
        </div>
      </div>

      {/* Stats Cards - Compact with Glow */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4 fade-in">
        <Card className="border-blue-100 hover:shadow-glow-blue">
          <CardContent className="p-3 md:p-4">
            <div className="text-xl md:text-2xl font-bold bg-gradient-to-br from-blue-600 to-blue-500 bg-clip-text text-transparent">
              {stats.total}
            </div>
            <p className="text-xs md:text-sm text-gray-600">Feature</p>
          </CardContent>
        </Card>
        <Card className="border-emerald-100 hover:shadow-glow-emerald">
          <CardContent className="p-3 md:p-4">
            <div className="text-xl md:text-2xl font-bold bg-gradient-to-br from-emerald-600 to-emerald-500 bg-clip-text text-transparent">
              {stats.withScreenshots}
            </div>
            <p className="text-xs md:text-sm text-gray-600">Screenshot var</p>
          </CardContent>
        </Card>
        <Card className="border-purple-100 hover:shadow-glow-purple">
          <CardContent className="p-3 md:p-4">
            <div className="text-xl md:text-2xl font-bold bg-gradient-to-br from-purple-600 to-purple-500 bg-clip-text text-transparent">
              {stats.highTRCoverage}
            </div>
            <p className="text-xs md:text-sm text-gray-600">Yüksek TR (&gt;60%)</p>
          </CardContent>
        </Card>
        <Card className="border-amber-100">
          <CardContent className="p-3 md:p-4">
            <div className="text-xl md:text-2xl font-bold bg-gradient-to-br from-amber-600 to-amber-500 bg-clip-text text-transparent">
              {stats.totalScreenshots}
            </div>
            <p className="text-xs md:text-sm text-gray-600">Toplam Görsel</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters - Mobile Optimized */}
      <div className="space-y-3">
        {/* Region Filter - Touch Friendly */}
        <div className="flex gap-2">
          <Button
            variant={regionFilter === 'tr' ? 'default' : 'outline'}
            onClick={() => setRegionFilter('tr')}
            className="flex-1 touch-target text-sm md:text-base"
          >
            🇹🇷 TR Borsalar
          </Button>
          <Button
            variant={regionFilter === 'global' ? 'default' : 'outline'}
            onClick={() => setRegionFilter('global')}
            className="flex-1 touch-target text-sm md:text-base"
          >
            🌍 Global
          </Button>
          <Button
            variant={regionFilter === 'all' ? 'default' : 'outline'}
            onClick={() => setRegionFilter('all')}
            className="flex-1 touch-target text-sm md:text-base"
          >
            Tümü
          </Button>
        </div>

        {/* Search + Refresh */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Feature ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 touch-target"
            />
          </div>
          <Button
            variant="outline"
            onClick={loadFeatures}
            className="touch-target flex-shrink-0"
            size="icon"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>

        {/* Filter Info */}
        <div className="flex items-center justify-between text-xs md:text-sm text-gray-600">
          <span>
            {filteredFeatures.length} / {features.length} feature
          </span>
          {searchTerm && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSearchTerm('')}
              className="h-6 text-xs"
            >
              Temizle
            </Button>
          )}
        </div>
      </div>

      {/* Feature Cards Grid - Responsive */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
        {filteredFeatures.map((feature) => (
          <FeatureCard key={feature.id} feature={feature} />
        ))}
      </div>

      {/* Empty State */}
      {filteredFeatures.length === 0 && !loading && (
        <Card className="text-center py-12">
          <CardContent>
            <FilterIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Feature bulunamadı
            </h3>
            <p className="text-gray-600 mb-4">
              Arama veya filtre kriterlerinize uygun feature bulunamadı.
            </p>
            <Button
              onClick={() => {
                setSearchTerm('');
                setRegionFilter('tr');
              }}
            >
              Filtreleri Sıfırla
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

