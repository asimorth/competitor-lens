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
  const [gapsData, setGapsData] = useState<any>(null);

  useEffect(() => {
    fetchComparisonData();
  }, []);

  const fetchComparisonData = async () => {
    try {
      const [competitorsRes, featuresRes, stablexRes, gapsRes] = await Promise.all([
        api.competitors.getAll(),
        api.features.getAll(),
        fetch(`${API_URL}/api/analytics/stablex`).then(r => r.json()).catch(() => ({ data: [] })),
        fetch(`${API_URL}/api/stablex/gaps`).then(r => r.json()).catch(() => ({ success: false }))
      ]);

      // TR borsalarını filtrele (name-based detection)
      const trNames = ['BTCTurk', 'BinanceTR', 'OKX TR', 'Garanti Kripto', 'Paribu', 'Bitexen', 'GateTR', 'Bilira', 'Kuantist', 'BTC Türk', 'BTC Turk'];
      const trCompetitors = competitorsRes.data?.filter((c: any) =>
        trNames.includes(c.name)
      ) || [];

      // ✅ Get Stablex smart analysis from backend
      const stablexData = stablexRes.data || [];
      setStablexAnalysis(stablexData);

      // Get gaps data for roadmap
      if (gapsRes.success) {
        setGapsData(gapsRes.data);
      }

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
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-5 h-auto">
          <TabsTrigger value="overview" className="text-xs sm:text-sm py-2.5">
            <span className="hidden sm:inline">Genel Bakış</span>
            <span className="sm:hidden">Genel</span>
          </TabsTrigger>
          <TabsTrigger value="features" className="text-xs sm:text-sm py-2.5">
            <span className="hidden sm:inline">Özellik Karşılaştırma</span>
            <span className="sm:hidden">Özellikler</span>
          </TabsTrigger>
          <TabsTrigger value="gaps" className="text-xs sm:text-sm py-2.5">
            <span className="hidden sm:inline">Boşluk Analizi</span>
            <span className="sm:hidden">Boşluklar</span>
          </TabsTrigger>
          <TabsTrigger value="roadmap" className="text-xs sm:text-sm py-2.5">
            <span className="hidden sm:inline">Roadmap</span>
            <span className="sm:hidden">Plan</span>
          </TabsTrigger>
          <TabsTrigger value="screenshots" className="text-xs sm:text-sm py-2.5">
            <span className="hidden sm:inline">Görseller</span>
            <span className="sm:hidden">Foto</span>
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
                      .filter((f: any) =>
                        (f.priority === 'critical' || f.priority === 'high') &&
                        !['Dashboard & Wallet', 'User Onboarding', 'KYC & Identity Verification'].includes(f.name)
                      )
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
              // ✅ Use _count from API (Screenshot table)
              const screenshotCount = competitor._count?.screenshots || 0;

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

        {/* Gaps Tab - Enhanced */}
        <TabsContent value="gaps" className="space-y-6">
          {gapsData && (
            <>
              {/* Critical Gaps */}
              {gapsData.critical && gapsData.critical.length > 0 && (
                <Card className="border-red-200 bg-red-50/30">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2 text-red-700">
                      <AlertCircle className="h-5 w-5" />
                      <span>Kritik Boşluklar ({gapsData.critical.length})</span>
                    </CardTitle>
                    <CardDescription>
                      Hem acil hem de yüksek etkili - öncelikli olarak kapatılmalı
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {gapsData.critical.map((gap: any, idx: number) => (
                        <div key={idx} className="p-4 bg-white border-2 border-red-200 rounded-lg">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <h4 className="font-semibold text-lg">{gap.name}</h4>
                              {gap.description && (
                                <p className="text-sm text-gray-600 mt-1">{gap.description}</p>
                              )}
                            </div>
                            <div className="flex gap-2">
                              <Badge variant="destructive">{gap.urgency}</Badge>
                              <Badge className="bg-purple-600">{gap.impact} etki</Badge>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 text-sm">
                            <div className="p-2 bg-blue-50 rounded">
                              <div className="text-xs text-gray-600">TR Penetrasyonu</div>
                              <div className="font-bold text-blue-700">{gap.trPenetration}%</div>
                              <div className="text-xs text-gray-500">{gap.competitorsWithFeature} borsa</div>
                            </div>
                            <div className="p-2 bg-green-50 rounded">
                              <div className="text-xs text-gray-600">Geliştirme Süresi</div>
                              <div className="font-bold text-green-700">{gap.estimatedDevWeeks} hafta</div>
                            </div>
                            <div className="p-2 bg-purple-50 rounded">
                              <div className="text-xs text-gray-600">İş Etkisi</div>
                              <div className="font-medium text-purple-700 text-xs">{gap.businessImpact}</div>
                            </div>
                            <div className="p-2 bg-orange-50 rounded">
                              <div className="text-xs text-gray-600">Roadmap</div>
                              <div className="font-bold text-orange-700">{gap.roadmapQuarter}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Quick Wins */}
              {gapsData.quickWins && gapsData.quickWins.length > 0 && (
                <Card className="border-green-200 bg-green-50/30">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2 text-green-700">
                      <Sparkles className="h-5 w-5" />
                      <span>Hızlı Kazançlar ({gapsData.quickWins.length})</span>
                    </CardTitle>
                    <CardDescription>
                      2 hafta veya daha kısa sürede eklenebilir
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {gapsData.quickWins.map((win: any, idx: number) => (
                        <div key={idx} className="p-3 bg-white border border-green-200 rounded-lg">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{win.name}</span>
                            <Badge className="bg-green-600">{win.estimatedDevWeeks}h</Badge>
                          </div>
                          <div className="text-xs text-gray-600 mt-1">{win.businessImpact}</div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}

          {/* Fallback for old data */}
          {!gapsData && criticalMissingFeatures.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <AlertCircle className="h-5 w-5 text-orange-500" />
                  <span>Stablex İçin Kritik Eksikler</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {criticalMissingFeatures.slice(0, 10).map((feature: any) => (
                    <div key={feature.id} className="p-3 border rounded-lg">
                      <span className="font-medium">{feature.name}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* NEW: Roadmap Tab */}
        <TabsContent value="roadmap" className="space-y-6">
          {gapsData?.roadmap && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Q1 */}
              <Card className="border-2 border-blue-300 bg-blue-50/50">
                <CardHeader>
                  <CardTitle className="text-blue-700 flex items-center justify-between">
                    <span>Q1 2025</span>
                    <Badge className="bg-blue-600">Acil</Badge>
                  </CardTitle>
                  <CardDescription>
                    Kısa vadeli öncelikler
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {gapsData.roadmap.q1.map((item: any, idx: number) => (
                      <div key={idx} className="p-3 bg-white rounded-lg border border-blue-200">
                        <div className="font-medium text-sm">{item.name}</div>
                        <div className="flex items-center justify-between mt-2 text-xs">
                          <span className="text-gray-600">{item.estimatedDevWeeks} hafta</span>
                          <Badge variant="outline" className="text-xs">{item.impact}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 pt-4 border-t border-blue-200">
                    <div className="text-sm font-medium text-blue-700">Hedef Kapsama</div>
                    <div className="text-2xl font-bold text-blue-700 mt-1">20% 🎯</div>
                  </div>
                </CardContent>
              </Card>

              {/* Q2 */}
              <Card className="border-2 border-purple-300 bg-purple-50/50">
                <CardHeader>
                  <CardTitle className="text-purple-700 flex items-center justify-between">
                    <span>Q2 2025</span>
                    <Badge className="bg-purple-600">Çekirdek</Badge>
                  </CardTitle>
                  <CardDescription>
                    Orta vadeli büyüme
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {gapsData.roadmap.q2.map((item: any, idx: number) => (
                      <div key={idx} className="p-3 bg-white rounded-lg border border-purple-200">
                        <div className="font-medium text-sm">{item.name}</div>
                        <div className="flex items-center justify-between mt-2 text-xs">
                          <span className="text-gray-600">{item.estimatedDevWeeks} hafta</span>
                          <Badge variant="outline" className="text-xs">{item.impact}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 pt-4 border-t border-purple-200">
                    <div className="text-sm font-medium text-purple-700">Hedef Kapsama</div>
                    <div className="text-2xl font-bold text-purple-700 mt-1">30% 🎯</div>
                  </div>
                </CardContent>
              </Card>

              {/* Q3 */}
              <Card className="border-2 border-indigo-300 bg-indigo-50/50">
                <CardHeader>
                  <CardTitle className="text-indigo-700 flex items-center justify-between">
                    <span>Q3 2025</span>
                    <Badge className="bg-indigo-600">Ekosistem</Badge>
                  </CardTitle>
                  <CardDescription>
                    Uzun vadeli vizyon
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {gapsData.roadmap.q3.map((item: any, idx: number) => (
                      <div key={idx} className="p-3 bg-white rounded-lg border border-indigo-200">
                        <div className="font-medium text-sm">{item.name}</div>
                        <div className="flex items-center justify-between mt-2 text-xs">
                          <span className="text-gray-600">{item.estimatedDevWeeks} hafta</span>
                          <Badge variant="outline" className="text-xs">{item.impact}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 pt-4 border-t border-indigo-200">
                    <div className="text-sm font-medium text-indigo-700">Hedef Kapsama</div>
                    <div className="text-2xl font-bold text-indigo-700 mt-1">40% 🎯</div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {!gapsData && (
            <Card>
              <CardContent className="py-12 text-center">
                <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Roadmap verisi yükleniyor...</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
