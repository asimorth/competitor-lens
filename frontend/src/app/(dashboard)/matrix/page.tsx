'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Grid3X3, 
  Filter,
  Download,
  Eye,
  EyeOff,
  Search,
  X,
  Check,
  ChevronDown,
  ChevronRight,
  Maximize2,
  Minimize2,
  Flag,
  AlertCircle,
  TrendingUp,
  Sparkles,
  Camera,
  Building2,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export default function MatrixPage() {
  const [matrixData, setMatrixData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [viewMode, setViewMode] = useState<'compact' | 'detailed'>('compact');
  const [showOnlyAvailable, setShowOnlyAvailable] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [fullScreen, setFullScreen] = useState(false);
  const [showOnlyTR, setShowOnlyTR] = useState(false);
  const [screenshotFilter, setScreenshotFilter] = useState<'all' | 'with' | 'without'>('all');

  useEffect(() => {
    fetchMatrixData();
    // Başlangıçta önemli kategorileri aç
    setExpandedCategories(new Set(['Authentication', 'Platform', 'Trading']));
  }, []);

  const fetchMatrixData = async () => {
    setLoading(true);
    try {
      const result = await api.matrix.get();
      if (result.success && result.data) {
        setMatrixData(result.data);
      } else {
        // Set default data if API fails
        setMatrixData({
          competitors: [],
          features: [],
          matrix: []
        });
      }
    } catch (error) {
      console.error('Error fetching matrix data:', error);
      // Set default data on error
      setMatrixData({
        competitors: [],
        features: [],
        matrix: []
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading || !matrixData) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Matrix veriler yükleniyor...</p>
        </div>
      </div>
    );
  }

  const { competitors = [], features = [], meta } = matrixData;
  const screenshotStats = meta?.screenshotStats || { total: 0, withFeature: 0, orphan: 0, missingFiles: 0 };
  
  // TR borsalarını filtrele
  const trCompetitorNames = ['BTCTurk', 'BinanceTR', 'OKX TR', 'Garanti Kripto'];
  const displayCompetitors = showOnlyTR 
    ? competitors.filter((c: any) => trCompetitorNames.includes(c.name))
    : competitors;

  // Group features by category
  const categorizedFeatures = features.reduce((acc: any, feature: any) => {
    const category = feature.category || 'Other';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(feature);
    return acc;
  }, {});

  // Filter features
  const filteredCategories = Object.entries(categorizedFeatures).reduce((acc: any, [category, categoryFeatures]: [string, any]) => {
    const filtered = categoryFeatures.filter((feature: any) => {
      const matchesSearch = feature.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || category === selectedCategory;
      const matchesAvailability = !showOnlyAvailable || displayCompetitors.some((c: any) => 
        (c.features || []).some((f: any) => f.featureId === feature.id && f.hasFeature)
      );
      
      // Screenshot filter
      const totalScreenshots = displayCompetitors.reduce((sum: number, c: any) => {
        const cf = (c.features || []).find((f: any) => f.featureId === feature.id);
        return sum + (cf?.screenshots?.length || 0);
      }, 0);
      
      const matchesScreenshotFilter = 
        screenshotFilter === 'all' ||
        (screenshotFilter === 'with' && totalScreenshots > 0) ||
        (screenshotFilter === 'without' && totalScreenshots === 0);
      
      return matchesSearch && matchesCategory && matchesAvailability && matchesScreenshotFilter;
    });
    
    if (filtered.length > 0) {
      acc[category] = filtered;
    }
    return acc;
  }, {});

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  const exportMatrix = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002'}/api/matrix/export`);
      if (!response.ok) throw new Error('Export failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `feature-matrix-${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Export error:', error);
    }
  };

  // Matrix özet istatistikleri
  const totalImplemented = displayCompetitors.reduce((sum: number, c: any) => 
    sum + ((c.features || []).filter((f: any) => f.hasFeature).length), 0
  );
  const avgCoverage = displayCompetitors.length > 0 
    ? Math.round((totalImplemented / (features.length * displayCompetitors.length)) * 100)
    : 0;

  return (
    <div className={cn("space-y-6", fullScreen && "fixed inset-0 z-50 bg-white p-6 overflow-auto")}>
      {/* Header with Statistics - Mobile Optimized */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-xl md:rounded-2xl p-4 md:p-8 text-white">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 md:gap-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold mb-1 md:mb-2">Feature Matrix</h1>
            <p className="text-blue-100 text-sm md:text-lg">
              {displayCompetitors.length} borsa ve {features.length} özellik karşılaştırması
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 md:gap-4 lg:grid-cols-4">
            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3 md:p-4">
              <div className="flex items-center space-x-1 md:space-x-2 mb-1">
                <Building2 className="h-4 w-4 md:h-5 md:w-5" />
                <span className="text-xs md:text-sm">Borsalar</span>
              </div>
              <p className="text-xl md:text-2xl font-bold">{displayCompetitors.length}</p>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3 md:p-4">
              <div className="flex items-center space-x-1 md:space-x-2 mb-1">
                <Sparkles className="h-4 w-4 md:h-5 md:w-5" />
                <span className="text-xs md:text-sm">Özellikler</span>
              </div>
              <p className="text-xl md:text-2xl font-bold">{features.length}</p>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3 md:p-4">
              <div className="flex items-center space-x-1 md:space-x-2 mb-1">
                <TrendingUp className="h-4 w-4 md:h-5 md:w-5" />
                <span className="text-xs md:text-sm">Ortalama</span>
              </div>
              <p className="text-xl md:text-2xl font-bold">{avgCoverage}%</p>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3 md:p-4">
              <div className="flex items-center space-x-1 md:space-x-2 mb-1">
                <Camera className="h-4 w-4 md:h-5 md:w-5" />
                <span className="text-xs md:text-sm">Görseller</span>
              </div>
              <p className="text-xl md:text-2xl font-bold">
                {displayCompetitors.reduce((sum: number, c: any) => 
                  sum + ((c.features || []).reduce((s: number, f: any) => 
                    s + (f.screenshots?.length || 0), 0)), 0
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 sm:gap-3">
        <Link href="/stablex-vs-tr" className="col-span-2 sm:col-auto">
          <Button variant="default" className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-purple-600">
            <Flag className="h-4 w-4 mr-2" />
            <span className="truncate">Stablex vs TR</span>
          </Button>
        </Link>
        <Button
          variant={showOnlyTR ? "default" : "outline"}
          onClick={() => setShowOnlyTR(!showOnlyTR)}
          className="w-full sm:w-auto"
        >
          <Flag className="h-4 w-4 mr-1 sm:mr-2" />
          <span className="truncate text-xs sm:text-sm">{showOnlyTR ? 'Tüm' : 'TR'}</span>
        </Button>
        <Button
          variant="outline"
          onClick={() => setFullScreen(!fullScreen)}
          className="w-full sm:w-auto"
        >
          {fullScreen ? <Minimize2 className="h-4 w-4 mr-1 sm:mr-2" /> : <Maximize2 className="h-4 w-4 mr-1 sm:mr-2" />}
          <span className="truncate text-xs sm:text-sm">{fullScreen ? 'Normal' : 'Tam Ekran'}</span>
        </Button>
        <Button variant="outline" onClick={exportMatrix} className="col-span-2 sm:col-auto sm:w-auto">
          <Download className="h-4 w-4 mr-2" />
          <span className="truncate">Excel İndir</span>
        </Button>
      </div>

      {/* Orphan Screenshot Warning */}
      {screenshotStats.orphan > 0 && (
        <Card className="border-orange-300 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="font-semibold text-orange-900">Feature'sız Screenshot'lar Bulundu</h3>
                <p className="text-sm text-orange-800 mt-1">
                  {screenshotStats.orphan} screenshot henüz bir feature'a atanmamış. 
                  Bu screenshot'lar competitor detay sayfalarında görünebilir ama matrix'te gösterilmez.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-3 sm:p-4">
          <div className="flex flex-col gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Feature ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-10 h-10"
              />
              {searchTerm && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8"
                  onClick={() => setSearchTerm('')}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            
            <div className="flex flex-wrap gap-2">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="flex-1 sm:flex-initial px-3 py-2 border rounded-md text-sm"
              >
                <option value="all">Tüm Kategoriler</option>
                {Object.entries(categorizedFeatures).map(([category, features]: [string, any]) => (
                  <option key={category} value={category}>
                    {category} ({features.length})
                  </option>
                ))}
              </select>

              <div className="flex gap-2">
                <Button
                  variant={showOnlyAvailable ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShowOnlyAvailable(!showOnlyAvailable)}
                >
                  <Filter className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Mevcut</span>
                </Button>

                <Button
                  variant={viewMode === 'detailed' ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode(viewMode === 'compact' ? 'detailed' : 'compact')}
                >
                  {viewMode === 'compact' ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            
            {/* Screenshot Filter */}
            <div className="flex items-center gap-2 pt-2 border-t">
              <Camera className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-600">Screenshot:</span>
              <div className="flex gap-2">
                <Button
                  variant={screenshotFilter === 'all' ? "default" : "outline"}
                  size="sm"
                  onClick={() => setScreenshotFilter('all')}
                  className="text-xs"
                >
                  Tümü
                </Button>
                <Button
                  variant={screenshotFilter === 'with' ? "default" : "outline"}
                  size="sm"
                  onClick={() => setScreenshotFilter('with')}
                  className="text-xs"
                >
                  📸 Var
                </Button>
                <Button
                  variant={screenshotFilter === 'without' ? "default" : "outline"}
                  size="sm"
                  onClick={() => setScreenshotFilter('without')}
                  className="text-xs"
                >
                  Yok
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Matrix Table - Mobile Optimized */}
      <div className="relative">
        {/* Mobile View */}
        <div className="md:hidden">
          <Card>
            <CardContent className="p-0">
              {Object.entries(filteredCategories).map(([category, categoryFeatures]: [string, any]) => (
                <div key={category} className="border-b last:border-0">
                  <div className="bg-gray-50 px-4 py-3">
                    <h3 className="font-semibold text-gray-900">{category}</h3>
                    <p className="text-xs text-gray-500 mt-1">
                      {categoryFeatures.length} özellik
                    </p>
                  </div>
                  {categoryFeatures.map((feature: any) => (
                    <div key={feature.id} className="border-b last:border-0">
                      <div className="px-4 py-3">
                        <Link href={`/features/${feature.id}`}>
                          <h4 className="font-medium text-gray-900 text-sm">{feature.name}</h4>
                        </Link>
                        <div className="grid grid-cols-2 gap-2 mt-3">
                          {displayCompetitors.slice(0, 4).map((competitor: any) => {
                            const relation = competitor.features?.find((f: any) => f.featureId === feature.id);
                            const hasFeature = relation?.hasFeature || false;
                            return (
                              <div key={competitor.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                <span className="text-xs text-gray-600 truncate mr-2">{competitor.name}</span>
                                {hasFeature ? (
                                  <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                                ) : (
                                  <XCircle className="h-4 w-4 text-gray-300 flex-shrink-0" />
                                )}
                              </div>
                            );
                          })}
                        </div>
                        {displayCompetitors.length > 4 && (
                          <Link href={`/features/${feature.id}`}>
                            <p className="text-xs text-blue-600 mt-2">+{displayCompetitors.length - 4} daha</p>
                          </Link>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Desktop View */}
        <div className="hidden md:block overflow-x-auto bg-white rounded-xl shadow-lg">
          <table className="w-full border-collapse">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="sticky left-0 z-10 bg-gray-50 p-4 text-left min-w-[250px]">
                <div className="flex items-center space-x-2">
                  <Grid3X3 className="h-5 w-5 text-gray-600" />
                  <span className="font-semibold text-gray-900">Feature / Borsa</span>
                </div>
              </th>
              {displayCompetitors.map((competitor: any) => (
                <th key={competitor.id} className="p-4 text-center min-w-[140px] border-l">
                  <Link href={`/competitors/${competitor.id}`} className="group">
                    <div className="flex flex-col items-center space-y-2 cursor-pointer">
                      <div className={cn(
                        "w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold shadow-md transition-transform group-hover:scale-110",
                        trCompetitorNames.includes(competitor.name) 
                          ? "bg-gradient-to-br from-red-500 to-pink-500" 
                          : "bg-gradient-to-br from-blue-500 to-purple-500"
                      )}>
                        {competitor.name.charAt(0)}
                      </div>
                      <span className="text-sm font-medium text-gray-900">{competitor.name}</span>
                      <div className="flex items-center space-x-1">
                        <Badge variant="secondary" className="text-xs">
                          {(competitor.features || []).filter((f: any) => f.hasFeature).length}
                        </Badge>
                        {trCompetitorNames.includes(competitor.name) && (
                          <Flag className="h-3 w-3 text-red-500" />
                        )}
                      </div>
                    </div>
                  </Link>
                </th>
              ))}
              {/* Stablex Sütunu */}
              <th className="p-4 text-center min-w-[140px] border-l bg-blue-50">
                <div className="flex flex-col items-center space-y-2">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold shadow-md">
                    S
                  </div>
                  <span className="text-sm font-bold text-blue-700">Stablex</span>
                  <Badge variant="default" className="text-xs bg-blue-600">
                    Hedef
                  </Badge>
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(filteredCategories).map(([category, categoryFeatures]: [string, any]) => (
              <React.Fragment key={category}>
                <tr className="bg-gray-50 border-y sticky top-0 z-20">
                  <td 
                    colSpan={displayCompetitors.length + 2} 
                    className="p-3 cursor-pointer hover:bg-gray-100"
                    onClick={() => toggleCategory(category)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {expandedCategories.has(category) ? 
                          <ChevronDown className="h-4 w-4 text-gray-600" /> : 
                          <ChevronRight className="h-4 w-4 text-gray-600" />
                        }
                        <span className="font-semibold text-gray-900">{category}</span>
                        <Badge variant="outline" className="ml-2">
                          {categoryFeatures.length} özellik
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-sm text-gray-500">
                          {Math.round(
                            (categoryFeatures.reduce((sum: number, f: any) => 
                              sum + displayCompetitors.filter((c: any) => 
                                (c.features || []).some((cf: any) => cf.featureId === f.id && cf.hasFeature)
                              ).length, 0
                            ) / (categoryFeatures.length * displayCompetitors.length)) * 100
                          )}% kapsama
                        </div>
                        {category === 'Authentication' && (
                          <Badge variant="destructive" className="text-xs">Kritik</Badge>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
                {expandedCategories.has(category) && categoryFeatures.map((feature: any) => {
                  // Calculate total screenshots for this feature
                  const totalScreenshots = displayCompetitors.reduce((sum: number, c: any) => {
                    const cf = (c.features || []).find((f: any) => f.featureId === feature.id);
                    return sum + (cf?.screenshots?.length || 0);
                  }, 0);
                  
                  // Check if feature has implementations
                  const hasImplementations = displayCompetitors.some((c: any) =>
                    (c.features || []).some((f: any) => f.featureId === feature.id && f.hasFeature)
                  );
                  
                  return (
                  <tr key={feature.id} className="border-b hover:bg-gray-50 transition-colors">
                    <td className="sticky left-0 z-10 bg-white p-4 border-r">
                      <div className="flex items-center space-x-3">
                        <div className={cn(
                          "w-2 h-2 rounded-full flex-shrink-0",
                          feature.priority === 'critical' ? 'bg-red-500' :
                          feature.priority === 'high' ? 'bg-orange-500' :
                          feature.priority === 'medium' ? 'bg-yellow-500' :
                          'bg-gray-400'
                        )} />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium text-gray-900 truncate">{feature.name}</span>
                            {totalScreenshots > 0 ? (
                              <Badge variant="secondary" className="text-xs flex items-center space-x-1">
                                <Camera className="h-3 w-3" />
                                <span>{totalScreenshots}</span>
                              </Badge>
                            ) : hasImplementations ? (
                              <Badge variant="outline" className="text-xs text-orange-600 border-orange-300">
                                ⚠️ Screenshot Yok
                              </Badge>
                            ) : null}
                          </div>
                          {viewMode === 'detailed' && feature.description && (
                            <div className="text-sm text-gray-500 mt-1 line-clamp-2">{feature.description}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    {displayCompetitors.map((competitor: any) => {
                      const competitorFeature = (competitor.features || []).find((f: any) => f.featureId === feature.id);
                      const hasFeature = competitorFeature?.hasFeature || false;
                      const quality = competitorFeature?.implementationQuality;
                      const hasScreenshots = (competitorFeature?.screenshots?.length || 0) > 0;
                      
                      return (
                        <td key={competitor.id} className="p-4 text-center border-l">
                          <div className="flex flex-col items-center space-y-1">
                            {hasFeature ? (
                              <div className="relative group">
                                <div className={cn(
                                  "w-10 h-10 rounded-lg flex items-center justify-center transition-all shadow-sm",
                                  quality === 'excellent' ? 'bg-green-500 text-white' :
                                  quality === 'good' ? 'bg-blue-500 text-white' :
                                  quality === 'average' ? 'bg-yellow-500 text-white' :
                                  'bg-gray-400 text-white'
                                )}>
                                  <Check className="h-5 w-5" />
                                </div>
                                {hasScreenshots && (
                                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                                    <Camera className="h-3 w-3 text-white" />
                                  </div>
                                )}
                                {viewMode === 'detailed' && competitorFeature?.notes && (
                                  <div className="absolute z-30 bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap max-w-xs">
                                    {competitorFeature.notes}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                                <X className="h-4 w-4 text-gray-400" />
                              </div>
                            )}
                            {viewMode === 'detailed' && hasFeature && (
                              <Badge variant="outline" className="text-xs">
                                {quality || 'var'}
                              </Badge>
                            )}
                          </div>
                        </td>
                      );
                    })}
                    {/* Stablex Sütunu */}
                    <td className="p-4 text-center border-l bg-blue-50/50">
                      <div className="flex items-center justify-center">
                        <div className="w-10 h-10 rounded-lg border-2 border-dashed border-blue-300 flex items-center justify-center">
                          <span className="text-blue-400 text-lg">?</span>
                        </div>
                      </div>
                    </td>
                  </tr>
                  );
                })}
              </React.Fragment>
            ))}
          </tbody>
        </table>
        </div>
      </div>

      {/* Legend & Actions */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Kalite Göstergeleri</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-center gap-6 text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 rounded bg-green-500" />
                <span>Mükemmel</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 rounded bg-blue-500" />
                <span>İyi</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 rounded bg-yellow-500" />
                <span>Orta</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 rounded bg-gray-400" />
                <span>Zayıf</span>
              </div>
              <div className="flex items-center space-x-2">
                <Camera className="h-4 w-4 text-blue-600" />
                <span>Görsel mevcut</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Öncelik Seviyeleri</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-center gap-6 text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-red-500" />
                <span>Kritik</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-orange-500" />
                <span>Yüksek</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-yellow-500" />
                <span>Orta</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-gray-400" />
                <span>Düşük</span>
              </div>
              <div className="flex items-center space-x-2">
                <Flag className="h-4 w-4 text-red-500" />
                <span>TR Borsası</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}