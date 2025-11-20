'use client';

import { useState, use, useEffect } from 'react';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { getImageUrl } from '@/lib/imageUrl';
import { getScreenshotUrl } from '@/lib/screenshot-utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft,
  ExternalLink,
  Globe,
  Calendar,
  TrendingUp,
  CheckCircle,
  XCircle,
  Image as ImageIcon,
  FileText,
  Camera,
  X,
  ChevronLeft,
  ChevronRight,
  Eye,
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

interface ExchangeDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function ExchangeDetailPage({ params }: ExchangeDetailPageProps) {
  const { id } = use(params);
  const [loading, setLoading] = useState(true);
  const [competitor, setCompetitor] = useState<any>(null);
  const [screenshots, setScreenshots] = useState<any[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0);
  
  useEffect(() => {
    fetchCompetitorData();
  }, [id]);

  // Keyboard navigation for image modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedImage) return;
      
      if (e.key === 'Escape') {
        setSelectedImage(null);
      } else if (e.key === 'ArrowLeft') {
        const currentFeature = Object.entries(screenshotsByFeature).find(([_, screenshots]: [string, any]) => 
          screenshots.some((s: any) => getScreenshotUrl(s) === selectedImage)
        );
        const allImages = currentFeature ? (currentFeature[1] as any[]).map((s: any) => getScreenshotUrl(s)) : [];
        if (selectedImageIndex > 0) {
          setSelectedImageIndex(selectedImageIndex - 1);
          setSelectedImage(allImages[selectedImageIndex - 1]);
        }
      } else if (e.key === 'ArrowRight') {
        const currentFeature = Object.entries(screenshotsByFeature).find(([_, screenshots]: [string, any]) => 
          screenshots.some((s: any) => getScreenshotUrl(s) === selectedImage)
        );
        const allImages = currentFeature ? (currentFeature[1] as any[]).map((s: any) => getScreenshotUrl(s)) : [];
        if (selectedImageIndex < allImages.length - 1) {
          setSelectedImageIndex(selectedImageIndex + 1);
          setSelectedImage(allImages[selectedImageIndex + 1]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedImage, selectedImageIndex, screenshots]);
  
  const fetchCompetitorData = async () => {
    try {
      const result = await api.competitors.getById(id);
      if (result.success && result.data) {
        setCompetitor(result.data);
        
        // Yeni model: competitor.screenshots'ı kullan
        const allScreenshots: any[] = [];
        
        // 1. Yeni Screenshot tablosundan gelen veriler
        if (result.data.screenshots && Array.isArray(result.data.screenshots)) {
          result.data.screenshots.forEach((screenshot: any) => {
            allScreenshots.push({
              ...screenshot,
              featureName: screenshot.feature?.name || 'Genel',
              featureCategory: screenshot.feature?.category || 'Diğer',
              screenshotPath: screenshot.cdnUrl || screenshot.filePath,
              isNew: true // Yeni model identifier
            });
          });
        }
        
        // 2. Onboarding screenshots
        if (result.data.onboardingScreenshots && Array.isArray(result.data.onboardingScreenshots)) {
          result.data.onboardingScreenshots.forEach((screenshot: any) => {
            allScreenshots.push({
              ...screenshot,
              featureName: 'Onboarding',
              featureCategory: 'Onboarding',
              screenshotPath: screenshot.screenshotPath,
              isOnboarding: true
            });
          });
        }
        
        // 3. Eski model (geriye dönük uyumluluk)
        if (result.data.features) {
          result.data.features.forEach((cf: any) => {
            if (cf.screenshots && Array.isArray(cf.screenshots)) {
              cf.screenshots.forEach((screenshot: any) => {
                allScreenshots.push({
                  ...screenshot,
                  featureName: cf.feature?.name || 'Genel',
                  featureCategory: cf.feature?.category || 'Diğer',
                  screenshotPath: screenshot.screenshotPath || screenshot.url,
                  isOld: true // Eski model identifier
                });
              });
            }
          });
        }
        
        setScreenshots(allScreenshots);
      }
    } catch (error) {
      console.error('Error fetching competitor:', error);
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading competitor data...</p>
        </div>
      </div>
    );
  }
  
  if (!competitor) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-gray-600">Competitor not found</p>
          <Link href="/competitors">
            <Button className="mt-4">Back to Competitors</Button>
          </Link>
        </div>
      </div>
    );
  }
  
  // API'den gelen features'ı düzenle
  const features = competitor.features?.map((cf: any) => ({
    id: cf.id,
    name: cf.feature.name,
    category: cf.feature.category,
    hasFeature: cf.hasFeature,
    implementationQuality: cf.implementationQuality || 'good',
    notes: cf.notes,
    screenshots: cf.screenshots || []
  })) || [];

  // Group screenshots by feature
  const screenshotsByFeature = screenshots.reduce((acc: any, screenshot: any) => {
    const featureName = screenshot.featureName || 'Feature Atanmamış';
    if (!acc[featureName]) {
      acc[featureName] = [];
    }
    acc[featureName].push(screenshot);
    return acc;
  }, {});
  
  // Separate orphan screenshots
  const orphanScreenshots = screenshots.filter(s => !s.featureName || s.featureName === 'Genel' || s.featureName === 'Feature Atanmamış');

  // Group features by category
  const categorizedFeatures = features.reduce((acc: any, feature: any) => {
    const category = feature.category || 'Other';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(feature);
    return acc;
  }, {});

  const getQualityBadge = (quality: string) => {
    switch (quality) {
      case 'excellent':
        return 'default';
      case 'good':
        return 'secondary';
      case 'average':
        return 'outline';
      default:
        return 'destructive';
    }
  };

  // Calculate coverage percentage
  const totalFeatures = features.length;
  const implementedFeatures = features.filter((f: any) => f.hasFeature).length;
  const coveragePercentage = totalFeatures > 0 ? Math.round((implementedFeatures / totalFeatures) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <div className="flex items-center space-x-4">
        <Button asChild variant="outline" size="sm">
          <Link href="/competitors">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Borsalara Dön
          </Link>
        </Button>
      </div>

      {/* Exchange Header */}
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center text-white font-bold text-xl sm:text-2xl flex-shrink-0">
                {competitor.name.charAt(0)}
              </div>
              <div className="flex-1">
                <CardTitle className="text-xl sm:text-2xl">{competitor.name}</CardTitle>
                <div className="flex flex-wrap gap-2 mt-2">
                  <Badge variant="default" className="text-xs sm:text-sm">
                    {coveragePercentage}%
                  </Badge>
                  <Badge variant="outline" className="text-xs sm:text-sm">
                    {implementedFeatures}/{totalFeatures}
                  </Badge>
                  <Badge variant="secondary" className="text-xs sm:text-sm">
                    <Camera className="h-3 w-3 mr-1" />
                    {screenshots.length}
                  </Badge>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {competitor.website && (
                <Button variant="outline" size="sm" asChild className="text-xs sm:text-sm">
                  <a href={competitor.website} target="_blank" rel="noopener noreferrer">
                    <Globe className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Website</span>
                  <ExternalLink className="h-3 w-3 ml-1" />
                </a>
              </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <p className="text-gray-600 mb-4 text-sm sm:text-base">{competitor.description}</p>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 text-xs sm:text-sm text-gray-500">
            <div className="flex items-center space-x-1">
              <Calendar className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">Eklendi: {new Date(competitor.createdAt).toLocaleDateString('tr-TR')}</span>
            </div>
            <div className="flex items-center space-x-1">
              <TrendingUp className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">Güncellendi: {new Date(competitor.updatedAt).toLocaleDateString('tr-TR')}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="features" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 h-auto">
          <TabsTrigger value="features" className="text-xs sm:text-sm py-2">Feature'lar</TabsTrigger>
          <TabsTrigger value="screenshots" className="text-xs sm:text-sm py-2">
            <span className="hidden sm:inline">Ekran Görüntüleri</span>
            <span className="sm:hidden">Görseller</span>
            <span className="ml-1">({screenshots.length})</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="text-xs sm:text-sm py-2">Analiz</TabsTrigger>
        </TabsList>

        {/* Features Tab */}
        <TabsContent value="features" className="space-y-6">
          {Object.entries(categorizedFeatures).map(([category, categoryFeatures]: [string, any]) => (
            <Card key={category}>
              <CardHeader>
                <CardTitle className="text-lg">{category}</CardTitle>
                <CardDescription>
                  {categoryFeatures.filter((f: any) => f.hasFeature).length} / {categoryFeatures.length} feature mevcut
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {categoryFeatures.map((feature: any) => (
                    <div key={feature.id} className="flex items-start justify-between p-4 border rounded-lg">
                      <div className="flex items-start space-x-3">
                        {feature.hasFeature ? (
                          <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
                        )}
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <h4 className="font-medium">{feature.name}</h4>
                            {feature.hasFeature && (
                            <Badge variant={getQualityBadge(feature.implementationQuality)}>
                              {feature.implementationQuality}
                            </Badge>
                            )}
                          </div>
                          {feature.notes && (
                            <p className="text-sm text-gray-600 mt-1">{feature.notes}</p>
                          )}
                          {feature.screenshots.length > 0 && (
                            <div className="flex items-center space-x-1 mt-2">
                              <ImageIcon className="h-4 w-4 text-blue-600" />
                              <span className="text-sm text-blue-600">
                                {feature.screenshots.length} ekran görüntüsü
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Screenshots Tab */}
        <TabsContent value="screenshots" className="space-y-4 sm:space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <div>
              <h3 className="text-base sm:text-lg font-semibold">Ekran Görüntüleri</h3>
              <p className="text-xs sm:text-sm text-gray-600">
                {screenshots.length} görsel, {Object.keys(screenshotsByFeature).length} feature'da dağılmış
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="text-xs sm:text-sm">
                <Camera className="h-3 w-3 mr-1" />
                {screenshots.length} toplam
              </Badge>
              {orphanScreenshots.length > 0 && (
                <Badge variant="secondary" className="text-xs sm:text-sm bg-orange-100 text-orange-700">
                  ⚠️ {orphanScreenshots.length} feature'sız
                </Badge>
              )}
            </div>
          </div>
          
          {/* Orphan Screenshots Warning */}
          {orphanScreenshots.length > 0 && (
            <Card className="border-orange-300 bg-orange-50">
              <CardContent className="p-4">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <h4 className="font-semibold text-orange-900">Feature'sız Screenshot'lar</h4>
                    <p className="text-sm text-orange-800 mt-1">
                      {orphanScreenshots.length} screenshot henüz bir feature'a atanmamış. 
                      Bu görseller aşağıda "Feature Atanmamış" bölümünde görünür.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {screenshots.length === 0 ? (
            <Card>
              <CardContent className="py-16">
                <div className="text-center">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Camera className="h-10 w-10 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Henüz Görsel Yok</h3>
                  <p className="text-gray-500">Bu borsa için ekran görüntüsü eklenmemiş</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-8">
              {Object.entries(screenshotsByFeature).map(([featureName, featureScreenshots]: [string, any]) => (
                <div key={featureName} className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center text-white">
                        <Camera className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{featureName}</h3>
                        <p className="text-sm text-gray-500">{featureScreenshots.length} görsel</p>
                      </div>
                    </div>
                    <Badge 
                      variant={featureScreenshots[0]?.featureCategory === 'Platform' ? 'default' : 'secondary'}
                    >
                      {featureScreenshots[0]?.featureCategory || 'Genel'}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-3 lg:gap-4">
                    {featureScreenshots.map((screenshot: any, index: number) => (
                      <div 
                        key={screenshot.id || index}
                        className="group relative cursor-pointer transform transition-all duration-200 hover:scale-105"
                        onClick={() => {
                          const allImages = featureScreenshots.map((s: any) => getScreenshotUrl(s));
                          const currentImageUrl = getScreenshotUrl(screenshot);
                          const currentIndex = allImages.indexOf(currentImageUrl);
                          setSelectedImageIndex(currentIndex);
                          setSelectedImage(currentImageUrl);
                        }}
                      >
                        <div className="aspect-[4/3] relative overflow-hidden rounded-lg sm:rounded-xl bg-gray-100 shadow-md group-hover:shadow-xl">
                          <img
                            src={getScreenshotUrl(screenshot)}
                            alt={screenshot.caption || screenshot.fileName || `${featureName} - ${index + 1}`}
                            className="object-cover w-full h-full"
                            loading="lazy"
                            onError={(e) => {
                              e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2IiAvPgogIDx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTgiIGZpbGw9IiM5Y2EzYWYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGRvbWluYW50LWJhc2VsaW5lPSJtaWRkbGUiPkltYWdlIG5vdCBmb3VuZDwvdGV4dD4KPC9zdmc+';
                            }}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="absolute bottom-0 left-0 right-0 p-2 sm:p-3">
                              <p className="text-white text-xs sm:text-sm font-medium truncate">
                                {screenshot.caption || `Görsel ${index + 1}`}
                              </p>
                            </div>
                          </div>
                          <div className="absolute top-1 right-1 sm:top-2 sm:right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="bg-white/90 backdrop-blur-sm rounded-full p-1.5 sm:p-2 shadow-lg">
                              <Eye className="h-3 w-3 sm:h-4 sm:w-4 text-gray-700" />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
          </div>
          )}
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Coverage by Category */}
            <Card>
              <CardHeader>
                <CardTitle>Kategori Bazında Kapsama</CardTitle>
                <CardDescription>
                  Her kategoride kaç feature mevcut
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(categorizedFeatures).map(([category, categoryFeatures]: [string, any]) => {
                    const implemented = categoryFeatures.filter((f: any) => f.hasFeature).length;
                    const total = categoryFeatures.length;
                    const percentage = Math.round((implemented / total) * 100);
                    
                    return (
                      <div key={category}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">{category}</span>
                          <span className="text-sm text-gray-600">
                            {implemented}/{total} ({percentage}%)
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Implementation Quality */}
            <Card>
              <CardHeader>
                <CardTitle>Uygulama Kalitesi</CardTitle>
                <CardDescription>
                  Mevcut feature'ların kalite dağılımı
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {['excellent', 'good', 'average', 'poor'].map((quality) => {
                    const count = features.filter((f: any) => f.hasFeature && f.implementationQuality === quality).length;
                    const percentage = implementedFeatures > 0 ? Math.round((count / implementedFeatures) * 100) : 0;
                    
                    return (
                      <div key={quality} className="flex items-center space-x-3">
                        <Badge variant={getQualityBadge(quality)} className="min-w-[80px]">
                          {quality}
                        </Badge>
                        <div className="flex-1">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full transition-all duration-500"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                        <span className="text-sm text-gray-600 min-w-[40px] text-right">
                          {count}
                        </span>
                </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Missing Features */}
          <Card>
            <CardHeader>
              <CardTitle>Eksik Feature'lar</CardTitle>
              <CardDescription>
                Bu borsada bulunmayan özellikler
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2 md:grid-cols-2">
                {features
                  .filter((f: any) => !f.hasFeature)
                  .map((feature: any) => (
                    <div key={feature.id} className="flex items-center space-x-2 text-sm">
                      <XCircle className="h-4 w-4 text-red-500" />
                      <span>{feature.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {feature.category}
                      </Badge>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

        {/* Image Modal */}
        {selectedImage && (() => {
          const currentFeature = Object.entries(screenshotsByFeature).find(([_, screenshots]: [string, any]) => 
            screenshots.some((s: any) => getScreenshotUrl(s) === selectedImage)
          );
          const allImages = currentFeature ? (currentFeature[1] as any[]).map((s: any) => getScreenshotUrl(s)) : [];
          const currentFeatureName = currentFeature ? currentFeature[0] : '';
          const canGoPrev = selectedImageIndex > 0;
          const canGoNext = selectedImageIndex < allImages.length - 1;

          const goToPrevImage = () => {
            if (canGoPrev) {
              setSelectedImageIndex(selectedImageIndex - 1);
              setSelectedImage(allImages[selectedImageIndex - 1]);
            }
          };

          const goToNextImage = () => {
            if (canGoNext) {
              setSelectedImageIndex(selectedImageIndex + 1);
              setSelectedImage(allImages[selectedImageIndex + 1]);
            }
          };

          return (
            <div 
              className="fixed inset-0 z-50 bg-black flex items-center justify-center"
              onClick={() => setSelectedImage(null)}
            >
              {/* Mobile View */}
              <div className="md:hidden w-full h-full flex flex-col">
                {/* Simple mobile header */}
                <div className="flex items-center justify-between p-3 bg-black">
                  <div className="text-white text-sm">
                    {selectedImageIndex + 1} / {allImages.length}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedImage(null);
                    }}
                    className="text-white p-2"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Mobile image container */}
                <div className="flex-1 relative flex items-center justify-center p-2" onClick={(e) => e.stopPropagation()}>
                  <img
                    src={selectedImage}
                    alt={`${currentFeatureName}`}
                    className="max-w-full max-h-full object-contain"
                  />
                  
                  {/* Mobile navigation */}
                  <button
                    className={cn(
                      "absolute left-1 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full",
                      !canGoPrev && "opacity-30"
                    )}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (canGoPrev) goToPrevImage();
                    }}
                    disabled={!canGoPrev}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>

                  <button
                    className={cn(
                      "absolute right-1 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full",
                      !canGoNext && "opacity-30"
                    )}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (canGoNext) goToNextImage();
                    }}
                    disabled={!canGoNext}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Desktop View */}
              <div className="hidden md:flex relative w-full h-full max-w-7xl mx-auto flex-col">
                {/* Desktop header */}
                <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-6 bg-gradient-to-b from-black/80 to-transparent">
                  <div className="text-white">
                    <h3 className="text-lg font-semibold">{currentFeatureName}</h3>
                    <p className="text-sm text-gray-300">{competitor.name}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white hover:bg-white/20"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedImage(null);
                    }}
                  >
                    <X className="h-6 w-6" />
                  </Button>
                </div>

                {/* Desktop image container */}
                <div className="flex-1 flex items-center justify-center p-24" onClick={(e) => e.stopPropagation()}>
                  <img
                    src={selectedImage}
                    alt={`${currentFeatureName} - ${selectedImageIndex + 1}`}
                    className="max-w-full max-h-full object-contain drop-shadow-2xl"
                  />
                  
                  {/* Desktop navigation */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      "absolute left-8 top-1/2 -translate-y-1/2 text-white bg-black/50 hover:bg-black/70 w-12 h-12",
                      !canGoPrev && "opacity-30 cursor-not-allowed"
                    )}
                    onClick={(e) => {
                      e.stopPropagation();
                      goToPrevImage();
                    }}
                    disabled={!canGoPrev}
                  >
                    <ChevronLeft className="h-8 w-8" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      "absolute right-8 top-1/2 -translate-y-1/2 text-white bg-black/50 hover:bg-black/70 w-12 h-12",
                      !canGoNext && "opacity-30 cursor-not-allowed"
                    )}
                    onClick={(e) => {
                      e.stopPropagation();
                      goToNextImage();
                    }}
                    disabled={!canGoNext}
                  >
                    <ChevronRight className="h-8 w-8" />
                  </Button>
                </div>

                {/* Desktop footer */}
                <div className="absolute bottom-0 left-0 right-0 z-10 p-6 bg-gradient-to-t from-black/80 to-transparent">
                  <div className="flex items-center justify-center space-x-4">
                    <div className="bg-black/50 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-medium">
                      {selectedImageIndex + 1} / {allImages.length}
                    </div>
                    
                    {/* Desktop thumbnail strip */}
                    <div className="flex space-x-2 max-w-2xl overflow-x-auto">
                      {allImages.slice(Math.max(0, selectedImageIndex - 4), selectedImageIndex + 5).map((img, idx) => {
                        const actualIndex = Math.max(0, selectedImageIndex - 4) + idx;
                        return (
                          <button
                            key={actualIndex}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedImageIndex(actualIndex);
                              setSelectedImage(allImages[actualIndex]);
                            }}
                            className={cn(
                              "w-20 h-14 rounded-lg overflow-hidden border-2 transition-all flex-shrink-0",
                              actualIndex === selectedImageIndex 
                                ? "border-white scale-110 shadow-lg" 
                                : "border-transparent opacity-60 hover:opacity-100"
                            )}
                          >
                            <img
                              src={img}
                              alt={`Thumbnail ${actualIndex + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}
    </div>
  );
}