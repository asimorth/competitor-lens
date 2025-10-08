'use client';

import { useState, useEffect, use, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft,
  CheckCircle,
  XCircle,
  Image as ImageIcon,
  Users,
  TrendingUp,
  Calendar,
  Star,
  Download,
  Upload,
  RefreshCw,
  Lightbulb,
  Target,
  AlertCircle,
  Eye
} from 'lucide-react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { getImageUrl } from '@/lib/imageUrl';

interface FeatureDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function FeatureDetailPage({ params }: FeatureDetailPageProps) {
  const { id } = use(params);
  
  const [feature, setFeature] = useState<any>(null);
  const [exchanges, setExchanges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Screenshot'ları topla - feature.competitors'dan gelecek
  const allScreenshots = useMemo(() => {
    const screenshots: any[] = [];
    if (feature?.competitors) {
      feature.competitors.forEach((comp: any) => {
        if (comp.hasFeature && comp.screenshots && Array.isArray(comp.screenshots)) {
          comp.screenshots.forEach((screenshot: any) => {
            // Exchange bilgisini bul
            const exchange = exchanges.find(e => e.id === comp.competitorId);
            const screenshotUrl = screenshot.screenshotPath || screenshot.url;
            // URL helper function - tutarlı format için
            const fullUrl = getImageUrl(screenshotUrl);
            
            screenshots.push({
              url: screenshotUrl, // Yeni model: screenshotPath, Eski model: url
              fullUrl: fullUrl, // Tam URL'i önceden hesapla
              caption: screenshot.caption,
              exchangeName: comp.competitor?.name || exchange?.name || 'Unknown',
              exchangeId: comp.competitorId
            });
          });
        }
      });
    }
    return screenshots;
  }, [feature?.competitors, exchanges]);

  useEffect(() => {
    loadFeatureDetail();
  }, [id]);

  // Keyboard navigation for lightbox
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedImage) return;
      
      switch (e.key) {
        case 'Escape':
          setSelectedImage(null);
          break;
        case 'ArrowLeft':
          e.preventDefault();
          setSelectedImage(prevImage => {
            if (!prevImage) return null;
            const currentIndex = allScreenshots.findIndex(s => s.fullUrl === prevImage);
            const prevIndex = currentIndex > 0 ? currentIndex - 1 : allScreenshots.length - 1;
            return allScreenshots[prevIndex]?.fullUrl || null;
          });
          break;
        case 'ArrowRight':
          e.preventDefault();
          setSelectedImage(prevImage => {
            if (!prevImage) return null;
            const currentIndex = allScreenshots.findIndex(s => s.fullUrl === prevImage);
            const nextIndex = currentIndex < allScreenshots.length - 1 ? currentIndex + 1 : 0;
            return allScreenshots[nextIndex]?.fullUrl || null;
          });
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedImage, allScreenshots]);

  const loadFeatureDetail = async () => {
    setLoading(true);
    try {
      const [featureRes, competitorsRes] = await Promise.all([
        api.features.getById(id),
        api.features.getCompetitors(id)
      ]);

      const featureData = featureRes.data;
      const implementingExchanges = competitorsRes.data || [];

      // Coverage hesapla
      const totalExchanges = 19; // Bilinen toplam borsa sayısı
      const implementedBy = implementingExchanges.length;
      const coverage = Math.round((implementedBy / totalExchanges) * 100);

      setFeature({
        ...featureData,
        implementedBy,
        totalExchanges,
        coverage
      });

      // Tüm borsaları çek ve bu feature için durumlarını belirle
      const allCompetitorsRes = await api.competitors.getAll();
      const allCompetitors = allCompetitorsRes.data || [];

      const enrichedExchanges = allCompetitors.map((comp: any) => {
        const featureRelation = comp.features?.find((f: any) => f.featureId === id);
        
        return {
          id: comp.id,
          name: comp.name,
          hasFeature: featureRelation?.hasFeature || false,
          implementationQuality: featureRelation?.implementationQuality || 'none',
          notes: featureRelation?.notes || 'Bu feature mevcut değil',
          screenshots: featureRelation?.screenshots || []
        };
      });

      setExchanges(enrichedExchanges);
    } catch (error) {
      console.error('Feature detayı yüklenemedi:', error);
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

  if (!feature) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Feature bulunamadı</h3>
        <Button asChild>
          <Link href="/features">Feature'lara Dön</Link>
        </Button>
      </div>
    );
  }

  const implementingExchanges = exchanges.filter(e => e.hasFeature);

  const getQualityColor = (quality: string) => {
    switch (quality) {
      case 'excellent': return 'text-green-600 bg-green-50 border-green-200';
      case 'good': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'basic': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'none': return 'text-gray-600 bg-gray-50 border-gray-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getQualityBadge = (quality: string) => {
    const variants = {
      'excellent': 'default',
      'good': 'secondary',
      'basic': 'outline',
      'none': 'destructive'
    } as const;
    
    return variants[quality as keyof typeof variants] || 'outline';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // PM Insights oluştur
  const getPMInsights = () => {
    const insights: string[] = [];
    
    if (feature.coverage < 30) {
      insights.push(`🎯 **Büyük Fırsat**: Sadece ${feature.implementedBy} borsa implement etmiş (${feature.coverage}%). Early mover advantage potansiyeli yüksek!`);
    } else if (feature.coverage < 50) {
      insights.push(`⚡ **Orta Fırsat**: ${feature.implementedBy}/${feature.totalExchanges} borsa. Hala diferansiyasyon şansı var.`);
    } else if (feature.coverage >= 80) {
      insights.push(`⚠️ **Industry Standard**: ${feature.coverage}% coverage. Bu feature olmadan rekabet etmek zor!`);
    }
    
    if (feature.priority === 'high' && feature.coverage < 50) {
      insights.push(`🔴 **Quick Win Potansiyeli**: Yüksek öncelikli ama düşük pazar penetrasyonu. Implement ederek avantaj sağlayabilirsiniz!`);
    }
    
    const excellentImplementations = implementingExchanges.filter(e => e.implementationQuality === 'excellent');
    if (excellentImplementations.length > 0) {
      insights.push(`⭐ **Best Practice**: ${excellentImplementations.map(e => e.name).join(', ')} mükemmel implementasyon yapmış. Benchmark için inceleyebilirsiniz.`);
    }

    return insights;
  };

  const pmInsights = getPMInsights();

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <div className="flex items-center space-x-4">
        <Button asChild variant="outline" size="sm">
          <Link href="/features">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Feature'lara Dön
          </Link>
        </Button>
      </div>

      {/* Feature Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <CardTitle className="text-2xl">{feature.name}</CardTitle>
                {feature.priority && (
                  <Badge className={getPriorityColor(feature.priority)}>
                    {feature.priority} priority
                  </Badge>
                )}
              </div>
              <div className="flex items-center space-x-3 mb-4">
                <Badge variant="outline">{feature.category}</Badge>
                <Badge variant={feature.coverage >= 80 ? 'default' : feature.coverage >= 60 ? 'secondary' : 'destructive'}>
                  {feature.coverage}% Coverage
                </Badge>
              </div>
              <p className="text-gray-600 max-w-3xl">{feature.description}</p>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={loadFeatureDetail}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Yenile
              </Button>
              <Button variant="outline" size="sm">
                <Upload className="h-4 w-4 mr-2" />
                Görsel Yükle
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-6 text-sm text-gray-500">
            <div className="flex items-center space-x-1">
              <Calendar className="h-4 w-4" />
              <span>Eklendi: {new Date(feature.createdAt).toLocaleDateString('tr-TR')}</span>
            </div>
            <div className="flex items-center space-x-1">
              <TrendingUp className="h-4 w-4" />
              <span>Güncellendi: {new Date(feature.updatedAt).toLocaleDateString('tr-TR')}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Users className="h-4 w-4" />
              <span>{implementingExchanges.length}/{exchanges.length} borsa</span>
            </div>
            <div className="flex items-center space-x-1">
              <ImageIcon className="h-4 w-4" />
              <span>{allScreenshots.length} görsel</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* PM Insights */}
      {pmInsights.length > 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Lightbulb className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-blue-900">PM İçgörüleri</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {pmInsights.map((insight, index) => (
              <div key={index} className="text-sm text-blue-800 leading-relaxed">
                {insight}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs defaultValue="exchanges" className="space-y-4">
        <TabsList>
          <TabsTrigger value="exchanges">
            Borsalar ({exchanges.length})
          </TabsTrigger>
          <TabsTrigger value="screenshots">
            Ekran Görüntüleri ({allScreenshots.length})
          </TabsTrigger>
          <TabsTrigger value="analytics">Analiz</TabsTrigger>
          <TabsTrigger value="insights">Detaylı İçgörü</TabsTrigger>
        </TabsList>

        {/* Exchanges Tab */}
        <TabsContent value="exchanges" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {exchanges.map((exchange) => (
              <Card key={exchange.id} className={`border-2 ${getQualityColor(exchange.implementationQuality)}`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      {exchange.hasFeature ? (
                        <CheckCircle className="h-6 w-6 text-green-600" />
                      ) : (
                        <XCircle className="h-6 w-6 text-red-600" />
                      )}
                      <div>
                        <CardTitle className="text-lg">{exchange.name}</CardTitle>
                        <Badge variant={getQualityBadge(exchange.implementationQuality)} className="mt-1">
                          {exchange.implementationQuality}
                        </Badge>
                      </div>
                    </div>
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/competitors/${exchange.id}`}>
                        Detay
                      </Link>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-gray-600">{exchange.notes}</p>
                  
                  {Array.isArray(exchange.screenshots) && exchange.screenshots.length > 0 && (
                    <div className="flex items-center space-x-2">
                      <ImageIcon className="h-4 w-4 text-blue-600" />
                      <span className="text-sm text-blue-600">
                        {exchange.screenshots.length} ekran görüntüsü mevcut
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Screenshots Tab */}
        <TabsContent value="screenshots" className="space-y-6">
          {allScreenshots.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {allScreenshots.map((screenshot: any, index: number) => {
                  return (
                    <Card key={index} className="overflow-hidden hover:shadow-xl transition-shadow">
                      {/* Mobile-optimized aspect ratio */}
                      <div className="aspect-[4/3] bg-gray-100 relative overflow-hidden group cursor-pointer"
                           onClick={() => setSelectedImage(screenshot.fullUrl)}>
                        {screenshot.url ? (
                          <>
                            <img 
                              src={screenshot.fullUrl}
                              alt={screenshot.caption || 'Screenshot'}
                              className="w-full h-full object-cover"
                              loading="lazy"
                              onError={(e) => {
                                e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2IiAvPgogIDx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTgiIGZpbGw9IiM5Y2EzYWYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGRvbWluYW50LWJhc2VsaW5lPSJtaWRkbGUiPkltYWdlIG5vdCBmb3VuZDwvdGV4dD4KPC9zdmc+';
                              }}
                            />
                            {/* Hover overlay - mobile'da touch için daha belirgin */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 md:transition-opacity">
                              <div className="absolute bottom-3 left-3 right-3">
                                <p className="text-white text-sm font-medium line-clamp-2 drop-shadow">
                                  {screenshot.caption || 'Görüntüle'}
                                </p>
                              </div>
                              <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-full p-2 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
                                <Eye className="h-4 w-4 text-gray-700" />
                              </div>
                            </div>
                          </>
                        ) : (
                          <div className="flex items-center justify-center h-full bg-gray-50">
                            <ImageIcon className="h-10 w-10 text-gray-300" />
                          </div>
                        )}
                      </div>
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <Badge variant="outline" className="text-xs">
                            {screenshot.exchangeName}
                          </Badge>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="text-xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedImage(screenshot.fullUrl);
                            }}
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            <span className="hidden sm:inline">Büyüt</span>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* Lightbox Modal */}
              {selectedImage && (
                <div 
                  className="fixed inset-0 bg-black bg-opacity-95 z-50 flex items-center justify-center p-4"
                  onClick={() => setSelectedImage(null)}
                >
                  <div className="relative max-w-7xl max-h-[90vh] w-full h-full flex items-center justify-center">
                    {/* Close Button */}
                    <Button
                      variant="secondary"
                      size="sm"
                      className="absolute top-4 right-4 z-10"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedImage(null);
                      }}
                    >
                      ✕ Kapat
                    </Button>

                    {/* Previous Button */}
                    {allScreenshots.length > 1 && (
                      <Button
                        variant="secondary"
                        size="sm"
                        className="absolute left-4 top-1/2 -translate-y-1/2 z-10"
                        onClick={(e) => {
                          e.stopPropagation();
                          const currentIndex = allScreenshots.findIndex(s => s.fullUrl === selectedImage);
                          const prevIndex = currentIndex > 0 ? currentIndex - 1 : allScreenshots.length - 1;
                          setSelectedImage(allScreenshots[prevIndex].fullUrl);
                        }}
                      >
                        ←
                      </Button>
                    )}

                    {/* Next Button */}
                    {allScreenshots.length > 1 && (
                      <Button
                        variant="secondary"
                        size="sm"
                        className="absolute right-4 top-1/2 -translate-y-1/2 z-10"
                        onClick={(e) => {
                          e.stopPropagation();
                          const currentIndex = allScreenshots.findIndex(s => s.fullUrl === selectedImage);
                          const nextIndex = currentIndex < allScreenshots.length - 1 ? currentIndex + 1 : 0;
                          setSelectedImage(allScreenshots[nextIndex].fullUrl);
                        }}
                      >
                        →
                      </Button>
                    )}

                    {/* Image */}
                    <div className="flex flex-col items-center space-y-4 max-w-full">
                      <img 
                        src={selectedImage}
                        alt="Full size screenshot"
                        className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                      />
                      {/* Caption */}
                      <div className="text-white text-center bg-black bg-opacity-60 px-4 py-2 rounded-lg max-w-2xl">
                        <p className="text-sm">
                          {allScreenshots.find(s => s.fullUrl === selectedImage)?.caption || 'Screenshot'}
                        </p>
                        <p className="text-xs text-gray-300 mt-1">
                          {allScreenshots.findIndex(s => s.fullUrl === selectedImage) + 1} / {allScreenshots.length}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <Card className="text-center py-12">
              <CardContent>
                <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Henüz ekran görüntüsü yok
                </h3>
                <p className="text-gray-600 mb-4">
                  Bu feature için henüz ekran görüntüsü yüklenmemiş.
                </p>
                <Button>
                  <Upload className="h-4 w-4 mr-2" />
                  İlk Görseli Yükle
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Toplam Coverage</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{feature.coverage}%</div>
                <p className="text-xs text-gray-600">
                  {implementingExchanges.length}/{exchanges.length} borsa
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Mükemmel Uygulama</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {exchanges.filter(e => e.implementationQuality === 'excellent').length}
                </div>
                <p className="text-xs text-gray-600">borsa</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">İyi Uygulama</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {exchanges.filter(e => e.implementationQuality === 'good').length}
                </div>
                <p className="text-xs text-gray-600">borsa</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Eksik</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {exchanges.filter(e => !e.hasFeature).length}
                </div>
                <p className="text-xs text-gray-600">borsa</p>
              </CardContent>
            </Card>
          </div>

          {/* Implementation Quality Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Uygulama Kalitesi Dağılımı</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {['excellent', 'good', 'basic', 'none'].map(quality => {
                  const count = exchanges.filter(e => e.implementationQuality === quality).length;
                  const percentage = Math.round((count / exchanges.length) * 100);
                  
                  return (
                    <div key={quality} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Badge variant={getQualityBadge(quality)} className="w-20 justify-center">
                            {quality}
                          </Badge>
                          <span className="text-sm">{count} borsa</span>
                        </div>
                        <span className="text-sm text-gray-600">{percentage}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            quality === 'excellent' ? 'bg-green-500' :
                            quality === 'good' ? 'bg-blue-500' :
                            quality === 'basic' ? 'bg-yellow-500' : 'bg-gray-500'
                          }`}
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Top Performers */}
          {implementingExchanges.filter(e => e.implementationQuality === 'excellent').length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>En İyi Uygulamalar</CardTitle>
                <CardDescription>
                  Bu feature'ı en iyi uygulayan borsalar - Benchmark için inceleyin
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {exchanges
                    .filter(e => e.hasFeature && e.implementationQuality === 'excellent')
                    .map((exchange, index) => (
                      <div key={exchange.id} className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                        <div className="flex items-center justify-center w-6 h-6 bg-green-600 text-white rounded-full text-sm font-bold">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium">{exchange.name}</h4>
                          <p className="text-sm text-gray-600">{exchange.notes}</p>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Star className="h-4 w-4 text-yellow-500" />
                          <span className="text-sm font-medium">Mükemmel</span>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Detailed Insights Tab */}
        <TabsContent value="insights" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Target className="h-5 w-5 text-purple-600" />
                <CardTitle>Feature Detaylı Analizi</CardTitle>
              </div>
              <CardDescription>
                LLM destekli derinlemesine feature analizi
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="prose prose-sm max-w-none">
                <h4 className="font-semibold text-gray-900 mb-2">📋 Feature Açıklaması</h4>
                <p className="text-gray-700 leading-relaxed">
                  {feature.description || 'Bu feature için detaylı açıklama henüz eklenmemiş.'}
                </p>

                <h4 className="font-semibold text-gray-900 mb-2 mt-6">💼 İş Değeri</h4>
                <p className="text-gray-700 leading-relaxed">
                  Kategori: <strong>{feature.category}</strong> | 
                  Öncelik: <strong>{feature.priority}</strong>
                </p>
                <p className="text-gray-700 leading-relaxed">
                  Market penetrasyonu {feature.coverage}% seviyesinde. 
                  {feature.coverage >= 80 && " Bu, industry standard bir feature olduğunu gösteriyor."}
                  {feature.coverage < 40 && " Düşük penetrasyon, implementation fırsatı anlamına geliyor."}
                </p>

                <h4 className="font-semibold text-gray-900 mb-2 mt-6">🎯 Stratejik Öneri</h4>
                <div className="space-y-2">
                  {pmInsights.map((insight, i) => (
                    <p key={i} className="text-gray-700 leading-relaxed bg-white p-3 rounded border-l-4 border-blue-500">
                      {insight}
                    </p>
                  ))}
                </div>

                <h4 className="font-semibold text-gray-900 mb-2 mt-6">📊 Pazar Durumu</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="bg-white p-3 rounded">
                    <div className="text-gray-600">Implement Eden</div>
                    <div className="text-2xl font-bold text-green-600">{implementingExchanges.length}</div>
                  </div>
                  <div className="bg-white p-3 rounded">
                    <div className="text-gray-600">Eksik Olan</div>
                    <div className="text-2xl font-bold text-red-600">
                      {exchanges.length - implementingExchanges.length}
                    </div>
                  </div>
                  <div className="bg-white p-3 rounded">
                    <div className="text-gray-600">Mükemmel Implementasyon</div>
                    <div className="text-2xl font-bold text-green-600">
                      {exchanges.filter(e => e.implementationQuality === 'excellent').length}
                    </div>
                  </div>
                  <div className="bg-white p-3 rounded">
                    <div className="text-gray-600">Temel Implementasyon</div>
                    <div className="text-2xl font-bold text-yellow-600">
                      {exchanges.filter(e => e.implementationQuality === 'basic').length}
                    </div>
                  </div>
                </div>

                <h4 className="font-semibold text-gray-900 mb-2 mt-6">💡 Sonraki Adımlar</h4>
                <ul className="list-disc list-inside space-y-1 text-gray-700">
                  {feature.coverage < 50 && (
                    <li>Bu feature için market research yapın - düşük penetrasyon fırsat işareti</li>
                  )}
                  {implementingExchanges.filter(e => e.implementationQuality === 'excellent').length > 0 && (
                    <li>
                      Mükemmel implementasyon yapan borsaları inceleyin: {' '}
                      {implementingExchanges
                        .filter(e => e.implementationQuality === 'excellent')
                        .map(e => e.name)
                        .slice(0, 3)
                        .join(', ')}
                    </li>
                  )}
                  <li>Ekran görüntüleri ekleyerek UI/UX benchmark yapın</li>
                  <li>Implementation notlarını zenginleştirin</li>
                  {feature.priority === 'high' && (
                    <li className="text-red-600 font-medium">
                      Yüksek öncelikli feature - roadmap'te prioritize edin
                    </li>
                  )}
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}