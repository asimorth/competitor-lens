'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Users,
  Search,
  ExternalLink,
  TrendingUp,
  Globe,
  Grid3X3,
  RefreshCw,
  Image as ImageIcon,
  Eye
} from 'lucide-react';
import Link from 'next/link';
import { api } from '@/lib/api';
import RegionFilter from '@/components/RegionFilter';

export default function CompetitorsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [exchanges, setExchanges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [regionStats, setRegionStats] = useState<Record<string, number>>({});

  useEffect(() => {
    loadCompetitors();
  }, [selectedRegion]);

  const loadCompetitors = async () => {
    setLoading(true);
    try {
      const res = await api.competitors.getAll(selectedRegion);
      const competitors = res.data || [];

      // Her borsa için coverage hesapla
      const enrichedCompetitors = competitors.map((comp: any) => {
        const totalFeatures = comp.features?.length || 0;
        const implementedFeatures = comp.features?.filter((f: any) => f.hasFeature).length || 0;
        const coverage = totalFeatures > 0 ? Math.round((implementedFeatures / totalFeatures) * 100) : 0;
        const screenshotCount = comp._count?.screenshots || 0;
        const onboardingCount = comp._count?.onboardingScreenshots || 0;

        return {
          ...comp,
          totalFeatures,
          implementedFeatures,
          coverage,
          screenshotCount,
          onboardingCount,
          hasKYC: onboardingCount > 0
        };
      });

      setExchanges(enrichedCompetitors);

      // Set region stats
      if (res.meta?.byRegion) {
        setRegionStats(res.meta.byRegion);
      }
    } catch (error) {
      console.error('Borsalar yüklenemedi:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredExchanges = exchanges.filter(exchange =>
    exchange.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (exchange.description && exchange.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getCoverageBadge = (coverage: number) => {
    if (coverage >= 80) return 'default';
    if (coverage >= 60) return 'secondary';
    return 'outline';
  };

  const regionFilterOptions = [
    { label: 'All Exchanges', value: null, count: Object.values(regionStats).reduce((a, b) => a + b, 0) },
    { label: 'Turkey (TR)', value: 'TR', count: regionStats['TR'] || 0 },
    { label: 'Global', value: 'Global', count: regionStats['Global'] || 0 }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Borsalar yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Borsa Monitoring</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {exchanges.length} kripto borsasının detaylı analizi
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" size="sm" onClick={loadCompetitors}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Yenile
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/matrix">
              <Grid3X3 className="h-4 w-4 mr-2" />
              Matrix Görünümü
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/onboarding">
              <Eye className="h-4 w-4 mr-2" />
              KYC Flows
            </Link>
          </Button>
        </div>
      </div>

      {/* Region Filter */}
      <RegionFilter
        currentRegion={selectedRegion}
        onChange={setSelectedRegion}
        regions={regionFilterOptions}
      />

      {/* Search and Stats */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Search className="h-4 w-4 text-gray-400" />
          <Input
            placeholder="Borsa ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-64"
          />
        </div>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {filteredExchanges.length} / {exchanges.length} borsa
        </div>
      </div>

      {/* Exchanges Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredExchanges.map((exchange) => (
          <Card key={exchange.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
                    {exchange.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <CardTitle className="text-lg">{exchange.name}</CardTitle>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge variant={getCoverageBadge(exchange.coverage)}>
                        {exchange.coverage}% coverage
                      </Badge>
                      {exchange.region && (
                        <Badge variant="outline" className="text-xs">
                          {exchange.region}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                {exchange.description || 'Açıklama yok'}
              </p>

              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-1">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <span>{exchange.implementedFeatures} / {exchange.totalFeatures} feature</span>
                </div>
                <div className="flex items-center space-x-1 text-blue-600">
                  <ImageIcon className="h-4 w-4" />
                  <span>{exchange.screenshotCount} screenshots</span>
                </div>
              </div>

              {exchange.hasKYC && (
                <div className="flex items-center space-x-2 text-xs text-purple-600 bg-purple-50 dark:bg-purple-900/20 px-2 py-1 rounded">
                  <Eye className="h-3 w-3" />
                  <span>{exchange.onboardingCount} KYC screenshots</span>
                </div>
              )}

              {exchange.website && (
                <div className="flex items-center space-x-1">
                  <Globe className="h-4 w-4 text-blue-600" />
                  <a
                    href={exchange.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline text-xs"
                  >
                    Web
                    <ExternalLink className="h-3 w-3 ml-1 inline" />
                  </a>
                </div>
              )}

              <div className="pt-2 border-t flex items-center justify-between">
                <Button asChild variant="outline" size="sm">
                  <Link href={`/competitors/${exchange.id}`}>
                    Detay Görüntüle
                  </Link>
                </Button>
                {exchange.hasKYC && (
                  <Button asChild variant="ghost" size="sm">
                    <Link href={`/competitors/${exchange.id}/onboarding`}>
                      <Eye className="h-4 w-4 mr-1" />
                      KYC Flow
                    </Link>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredExchanges.length === 0 && !loading && (
        <Card className="text-center py-12">
          <CardContent>
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Borsa bulunamadı
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Arama kriterlerinize uygun borsa bulunamadı.
            </p>
            <Button onClick={() => setSearchTerm('')}>
              Filtreyi Temizle
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}