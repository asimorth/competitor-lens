'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Trophy,
  TrendingUp,
  Eye,
  Building2,
  CheckCircle,
  XCircle,
  Sparkles,
  ChevronRight,
  Flag,
  Camera,
  BarChart3,
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { API_URL } from '@/lib/config';

export default function StablexVsTRPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCompetitor, setSelectedCompetitor] = useState<string | null>(null);
  const [stablexAnalysis, setStablexAnalysis] = useState<any[]>([]);

  useEffect(() => {
    fetchComparisonData();
  }, []);

  const fetchComparisonData = async () => {
    try {
      const [competitorsRes, featuresRes, stablexRes] = await Promise.all([
        api.competitors.getAll(),
        api.features.getAll(),
        fetch(`${API_URL}/api/analytics/stablex`).then(r => r.json()).catch(() => ({ data: [] }))
      ]);

      // TR borsalarını filtrele (name-based detection)
      const trNames = ['BTCTurk', 'BinanceTR', 'OKX TR', 'Garanti Kripto', 'Paribu', 'Bitexen', 'GateTR', 'Bilira', 'Kuantist', 'BTC Türk', 'BTC Turk'];
      const trCompetitors = competitorsRes.data?.filter((c: any) =>
        trNames.includes(c.name)
      ) || [];

      // ✅ Get Stablex smart analysis from backend
      const stablexData = stablexRes.data || [];
      setStablexAnalysis(stablexData);

      setData({
        stablex: {
          id: 'stablex',
          name: 'Stablex',
          description: 'Yeni nesil kripto borsası',
          features: stablexData // Smart analysis data
        },
        trCompetitors,
        features: featuresRes.data || [],
      });
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Veriler yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { stablex, trCompetitors, features } = data;

  // Feature kategorilerini grupla
  const categorizedFeatures = features.reduce((acc: any, feature: any) => {
    const category = feature.category || 'Diğer';
    if (!acc[category]) acc[category] = [];
    acc[category].push(feature);
    return acc;
  }, {});

  // En kritik eksik özellikleri bul
  const criticalMissingFeatures = features.filter((f: any) =>
    f.priority === 'critical' &&
    trCompetitors.some((c: any) =>
      c.features?.some((cf: any) => cf.featureId === f.id && cf.hasFeature)
    )
  );

  return (
    <div className="space-y-8">
      {/* Hero Section - Mobile Optimized */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl md:rounded-2xl p-4 md:p-8 text-white">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="text-center md:text-left">
            <h1 className="text-2xl md:text-3xl font-bold mb-2">Stablex vs TR Borsaları</h1>
            <p className="text-blue-100 text-sm md:text-lg">
              Rakip analizi ve özellik karşılaştırması
            </p>
          </div>
          <div className="flex items-center justify-center md:justify-start space-x-3 md:space-x-4">
            <Flag className="h-10 w-10 md:h-12 md:w-12 text-white/80" />
            <div className="text-center md:text-right">
              <p className="text-2xl md:text-3xl font-bold">{trCompetitors.length}</p>
              <p className="text-xs md:text-sm text-blue-100">TR Borsası</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats - Mobile 2x2 Grid */}
      <div className="grid grid-cols-2 gap-3 md:gap-6 md:grid-cols-4">
        <Card className="border-blue-200 bg-blue-50/50">
          <CardHeader className="pb-2 md:pb-3">
            <Trophy className="h-6 w-6 md:h-8 md:w-8 text-blue-600 mb-1 md:mb-2" />
            <CardTitle className="text-sm md:text-lg">Rakip Sayısı</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-2xl md:text-3xl font-bold text-blue-600">{trCompetitors.length}</p>
            <p className="text-xs md:text-sm text-gray-600 mt-1">Türkiye pazarında</p>
          </CardContent>
        </Card>

        <Card className="border-purple-200 bg-purple-50/50">
          <CardHeader className="pb-2 md:pb-3">
            <Sparkles className="h-6 w-6 md:h-8 md:w-8 text-purple-600 mb-1 md:mb-2" />
            <CardTitle className="text-sm md:text-lg">Toplam Özellik</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-2xl md:text-3xl font-bold text-purple-600">{features.length}</p>
            <p className="text-xs md:text-sm text-gray-600 mt-1">Analiz edilen</p>
          </CardContent>
        </Card>

        <Card className="border-orange-200 bg-orange-50/50">
          <CardHeader className="pb-2 md:pb-3">
            <AlertCircle className="h-6 w-6 md:h-8 md:w-8 text-orange-600 mb-1 md:mb-2" />
            <CardTitle className="text-sm md:text-lg">Kritik Eksikler</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-2xl md:text-3xl font-bold text-orange-600">{criticalMissingFeatures.length}</p>
            <p className="text-xs md:text-sm text-gray-600 mt-1">Stablex için öncelikli</p>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50/50">
          <CardHeader className="pb-2 md:pb-3">
            <Camera className="h-6 w-6 md:h-8 md:w-8 text-green-600 mb-1 md:mb-2" />
            <CardTitle className="text-sm md:text-lg">Ekran Görüntüsü</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-2xl md:text-3xl font-bold text-green-600">
              {trCompetitors.reduce((sum: number, c: any) =>
                sum + (c.features?.reduce((s: number, f: any) =>
                  s + (f.screenshots?.length || 0), 0) || 0), 0
              )}
            </p>
            <p className="text-xs md:text-sm text-gray-600 mt-1">Kanıt görsel</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Comparison Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto">
          <TabsTrigger value="overview" className="text-xs sm:text-sm py-2.5">
            <span className="hidden sm:inline">Genel Bakış</span>
            <span className="sm:hidden">Genel</span>
          </TabsTrigger>
          <TabsTrigger value="features" className="text-xs sm:text-sm py-2.5">
            <span className="hidden sm:inline">Özellik Karşılaştırma</span>
            <span className="sm:hidden">Özellikler</span>
          </TabsTrigger>
          <TabsTrigger value="screenshots" className="text-xs sm:text-sm py-2.5">
            <span className="hidden sm:inline">Görsel Kanıtlar</span>
            <span className="sm:hidden">Görseller</span>
          </TabsTrigger>
          <TabsTrigger value="gaps" className="text-xs sm:text-sm py-2.5">
            <span className="hidden sm:inline">Boşluk Analizi</span>
            <span className="sm:hidden">Boşluklar</span>
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>TR Borsaları Kapsama Analizi</CardTitle>
              <CardDescription>
                Her borsanın sahip olduğu özellik yüzdesi
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {trCompetitors
                  .sort((a: any, b: any) => {
                    const aCount = a.features?.filter((f: any) => f.hasFeature).length || 0;
                    const bCount = b.features?.filter((f: any) => f.hasFeature).length || 0;
                    return bCount - aCount;
                  })
                  .map((competitor: any) => {
                    const implementedCount = competitor.features?.filter((f: any) => f.hasFeature).length || 0;
                    const percentage = features.length > 0 ? Math.round((implementedCount / features.length) * 100) : 0;

                    return (
                      <div key={competitor.id} className="space-y-2">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center text-white font-bold flex-shrink-0">
                              {competitor.name.charAt(0)}
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900 text-sm sm:text-base">{competitor.name}</p>
                              <p className="text-xs sm:text-sm text-gray-500">
                                {implementedCount} / {features.length} özellik
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4">
                            <span className="text-xl sm:text-2xl font-bold">{percentage}%</span>
                            <Link href={`/competitors/${competitor.id}`}>
                              <Button variant="outline" size="sm" className="text-xs sm:text-sm">
                                <Eye className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                                <span className="hidden sm:inline">Detaylar</span>
                                <span className="sm:hidden">Detay</span>
                              </Button>
                            </Link>
                          </div>
                        </div>
                        <Progress value={percentage} className="h-2 sm:h-3" />
                      </div>
                    );
                  })}
              </div>
            </CardContent>
          </Card>

          {/* Kategori Bazlı Özet */}
          <Card>
            <CardHeader>
              <CardTitle>Kategori Bazında TR Pazarı Ortalaması</CardTitle>
              <CardDescription>
                Her kategoride TR borsalarının ortalama kapsama oranı
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {Object.entries(categorizedFeatures).map(([category, categoryFeatures]: [string, any]) => {
                  const avgCoverage = trCompetitors.reduce((sum: number, competitor: any) => {
                    const covered = categoryFeatures.filter((f: any) =>
                      competitor.features?.some((cf: any) =>
                        cf.featureId === f.id && cf.hasFeature
                      )
                    ).length;
                    return sum + (covered / categoryFeatures.length) * 100;
                  }, 0) / trCompetitors.length;

                  return (
                    <div key={category} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{category}</span>
                        <span className="text-sm text-gray-500">
                          {categoryFeatures.length} özellik
                        </span>
                      </div>
                      <Progress value={avgCoverage} className="h-2" />
                      <p className="text-sm text-gray-600 mt-1">
                        Ortalama: {Math.round(avgCoverage)}%
                      </p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Features Tab */}
        <TabsContent value="features" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Detaylı Özellik Karşılaştırması</CardTitle>
              <CardDescription>
                Stablex'in sahip olması gereken özellikler
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-4">Özellik</th>
                      {trCompetitors.map((c: any) => (
                        <th key={c.id} className="text-center p-4 min-w-[100px]">
                          <div className="font-medium">{c.name}</div>
                        </th>
                      ))}
                      <th className="text-center p-4 min-w-[100px] bg-blue-50">
                        <div className="font-medium text-blue-600">Stablex</div>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {features
                      .filter((f: any) => f.priority === 'critical' || f.priority === 'high')
                      .slice(0, 15)
                      .map((feature: any) => (
                        <tr key={feature.id} className="border-b hover:bg-gray-50">
                          <td className="p-4">
                            <div className="flex items-center space-x-2">
                              <div className={cn(
                                "w-2 h-2 rounded-full",
                                feature.priority === 'critical' ? 'bg-red-500' :
                                  feature.priority === 'high' ? 'bg-orange-500' :
                                    'bg-yellow-500'
                              )} />
                              <span className="font-medium">{feature.name}</span>
                            </div>
                          </td>
                          {trCompetitors.map((competitor: any) => {
                            const hasFeature = competitor.features?.some((cf: any) =>
                              cf.featureId === feature.id && cf.hasFeature
                            );
                            return (
                              <td key={competitor.id} className="text-center p-4">
                                {hasFeature ? (
                                  <CheckCircle className="h-5 w-5 text-green-500 mx-auto" />
                                ) : (
                                  <XCircle className="h-5 w-5 text-gray-300 mx-auto" />
                                )}
                              </td>
                            );
                          })}
                          <td className="text-center p-4 bg-blue-50">
                            {(() => {
                              const featureAnalysis = stablexAnalysis.find((a: any) => a.name === feature.name);
                              if (!featureAnalysis) return <div className="w-5 h-5 border-2 border-gray-300 rounded-full mx-auto" />;

                              // HAS (green check) - from Excel
                              if (featureAnalysis.status === 'HAS') {
                                return (
                                  <div title={featureAnalysis.reason}>
                                    <CheckCircle className="h-5 w-5 text-green-500 mx-auto" />
                                  </div>
                                );
                              }

                              // EVIDENCE (blue badge) - from screenshots
                              if (featureAnalysis.status === 'EVIDENCE') {
                                return (
                                  <div className="flex items-center justify-center" title={featureAnalysis.reason}>
                                    <Badge variant="outline" className="text-xs bg-blue-50 text-blue-600 border-blue-300">
                                      <Camera className="h-3 w-3 mr-1" />
                                      {featureAnalysis.screenshotCount}
                                    </Badge>
                                  </div>
                                );
                              }

                              // ASSUMED (gray) - universal feature
                              if (featureAnalysis.status === 'ASSUMED') {
                                return (
                                  <div className="flex items-center justify-center" title={featureAnalysis.reason}>
                                    <Badge variant="secondary" className="text-xs">Beklenen</Badge>
                                  </div>
                                );
                              }

                              // NO (empty)
                              return <XCircle className="h-5 w-5 text-gray-300 mx-auto" />;
                            })()}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Screenshots Tab */}
        <TabsContent value="screenshots" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {trCompetitors.map((competitor: any) => {
              const screenshotCount = competitor.features?.reduce((sum: number, f: any) =>
                sum + (f.screenshots?.length || 0), 0
              ) || 0;

              return (
                <Card key={competitor.id} className="overflow-hidden">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>{competitor.name}</CardTitle>
                      <Badge variant="secondary">
                        <Camera className="h-3 w-3 mr-1" />
                        {screenshotCount} görsel
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-2">
                      {competitor.features?.slice(0, 6).map((cf: any, idx: number) =>
                        cf.screenshots?.slice(0, 1).map((screenshot: any) => (
                          <div key={idx} className="aspect-video bg-gray-100 rounded overflow-hidden">
                            <img
                              src={`http://localhost:3001${screenshot.screenshotPath.startsWith('/') ? screenshot.screenshotPath : '/' + screenshot.screenshotPath}`}
                              alt={cf.feature?.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ))
                      )}
                    </div>
                    <Link href={`/competitors/${competitor.id}?tab=screenshots`}>
                      <Button variant="outline" className="w-full mt-4">
                        Tüm Görselleri Gör
                        <ChevronRight className="h-4 w-4 ml-2" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Gaps Tab */}
        <TabsContent value="gaps" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <AlertCircle className="h-5 w-5 text-orange-500" />
                <span>Stablex İçin Kritik Eksikler</span>
              </CardTitle>
              <CardDescription>
                Rakiplerde olan ancak Stablex'te bulunması gereken özellikler
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {criticalMissingFeatures.slice(0, 10).map((feature: any) => {
                  const competitorsWithFeature = trCompetitors.filter((c: any) =>
                    c.features?.some((cf: any) => cf.featureId === feature.id && cf.hasFeature)
                  );

                  return (
                    <div key={feature.id} className="p-4 border rounded-lg hover:border-orange-300 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold flex items-center space-x-2">
                            <span>{feature.name}</span>
                            <Badge variant="destructive" className="text-xs">Kritik</Badge>
                          </h4>
                          {feature.description && (
                            <p className="text-sm text-gray-600 mt-1">{feature.description}</p>
                          )}
                          <div className="flex items-center space-x-4 mt-2">
                            <span className="text-sm text-gray-500">
                              Kategori: {feature.category}
                            </span>
                            <span className="text-sm text-gray-500">
                              {competitorsWithFeature.length} borsada mevcut
                            </span>
                          </div>
                        </div>
                        <div className="flex -space-x-2">
                          {competitorsWithFeature.slice(0, 3).map((c: any) => (
                            <div
                              key={c.id}
                              className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white text-xs font-bold border-2 border-white"
                              title={c.name}
                            >
                              {c.name.charAt(0)}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
