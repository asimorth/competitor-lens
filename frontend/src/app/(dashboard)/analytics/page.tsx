'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  TrendingUp,
  BarChart3,
  Download,
  Target,
  Award,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import { api } from '@/lib/api';

export default function AnalyticsPage() {
  const [coverageData, setCoverageData] = useState<any>(null);
  const [gapAnalysis, setGapAnalysis] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const [coverageRes, gapRes] = await Promise.all([
        api.analytics.getCoverage(),
        api.analytics.getGapAnalysis()
      ]);

      setCoverageData(coverageRes.data);
      setGapAnalysis(gapRes.data || []);
    } catch (error) {
      console.error('Analytics verisi yüklenemedi:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Analytics yükleniyor...</p>
        </div>
      </div>
    );
  }

  const topPerformers = coverageData?.competitorCoverage?.slice(0, 5) || [];
  const bottomFeatures = gapAnalysis.slice(0, 10); // En düşük coverage'lar

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getOpportunityColor = (coverage: number) => {
    if (coverage < 40) return 'text-green-600 bg-green-50'; // Büyük fırsat
    if (coverage < 60) return 'text-yellow-600 bg-yellow-50'; // Orta fırsat
    return 'text-red-600 bg-red-50'; // Düşük fırsat
  };

  const getOpportunityLabel = (coverage: number) => {
    if (coverage < 40) return 'Yüksek Fırsat';
    if (coverage < 60) return 'Orta Fırsat';
    return 'Düşük Fırsat';
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gap Analizi & İçgörüler</h1>
          <p className="text-gray-600 mt-1">
            Pazar fırsatları ve stratejik öneriler
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" size="sm" onClick={loadAnalytics}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Yenile
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Rapor İndir
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Genel Coverage</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {coverageData?.overallCoverage?.toFixed(1) || 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              pazar ortalaması
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En İyi Borsa</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {topPerformers[0]?.competitorName?.slice(0, 12) || 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">
              {topPerformers[0]?.coverage?.toFixed(1) || 0}% coverage
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Büyük Fırsat</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {bottomFeatures[0]?.featureName?.slice(0, 12) || 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">
              {bottomFeatures[0]?.coverage?.toFixed(1) || 0}% coverage
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Düşük Coverage</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {bottomFeatures.filter(f => f.coverage < 40).length}
            </div>
            <p className="text-xs text-muted-foreground">
              feature &lt;40% coverage
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="gaps" className="space-y-4">
        <TabsList>
          <TabsTrigger value="gaps">Gap Analizi</TabsTrigger>
          <TabsTrigger value="competitors">Borsa Performansı</TabsTrigger>
          <TabsTrigger value="coverage">Coverage Detay</TabsTrigger>
        </TabsList>

        {/* Gap Analysis Tab */}
        <TabsContent value="gaps" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Feature Gap Analizi - Pazar Fırsatları</CardTitle>
              <CardDescription>
                En düşük coverage'a sahip feature'lar = En büyük fırsatlar
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {bottomFeatures.map((gap, index) => (
                  <div key={gap.featureId} className="p-4 border rounded-lg hover:border-blue-300 transition-colors">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                          index < 3 ? 'bg-red-500' : 'bg-orange-500'
                        }`}>
                          {index + 1}
                        </div>
                        <div>
                          <h4 className="font-medium">{gap.featureName}</h4>
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {gap.category}
                            </Badge>
                            {gap.priority && (
                              <Badge className={getPriorityColor(gap.priority)}>
                                {gap.priority}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-red-600">
                          {gap.coverage?.toFixed(1)}%
                        </div>
                        <div className={`text-xs px-2 py-1 rounded ${getOpportunityColor(gap.coverage)}`}>
                          {getOpportunityLabel(gap.coverage)}
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                      <div>
                        <span className="text-gray-600">Mevcut: </span>
                        <span className="font-medium text-green-600">{gap.implementedBy} borsa</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Eksik: </span>
                        <span className="font-medium text-red-600">{gap.missingFrom} borsa</span>
                      </div>
                    </div>
                    
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-red-500 h-2 rounded-full"
                        style={{ width: `${gap.coverage}%` }}
                      ></div>
                    </div>

                    {/* PM İçgörü */}
                    {gap.coverage < 40 && gap.priority === 'high' && (
                      <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
                        💡 <strong>PM Önerisi:</strong> Yüksek öncelikli ve düşük coverage = Quick win fırsatı!
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Competitors Performance Tab */}
        <TabsContent value="competitors" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Borsa Performans Sıralaması</CardTitle>
              <CardDescription>
                Feature coverage'a göre borsa performansları
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topPerformers.map((performer: any, index: number) => (
                  <div key={performer.competitorId} className="flex items-center justify-between p-4 border rounded-lg hover:border-blue-300 transition-colors">
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                        index === 0 ? 'bg-yellow-500' :
                        index === 1 ? 'bg-gray-400' :
                        index === 2 ? 'bg-orange-600' : 'bg-blue-500'
                      }`}>
                        {index + 1}
                      </div>
                      <div>
                        <h4 className="font-medium text-lg">{performer.competitorName}</h4>
                        <p className="text-sm text-gray-600">
                          {performer.implementedFeatures} / {performer.totalFeatures} feature
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-blue-600">
                        {performer.coverage.toFixed(1)}%
                      </div>
                      <div className="w-32 bg-gray-200 rounded-full h-2 mt-1">
                        <div 
                          className={`h-2 rounded-full ${
                            performer.coverage >= 80 ? 'bg-green-500' :
                            performer.coverage >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${performer.coverage}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* PM İçgörü */}
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="text-blue-900">PM İçgörüleri</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-blue-800">
              <div className="flex items-start space-x-2">
                <Target className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <p>
                  <strong>Lider:</strong> {topPerformers[0]?.competitorName} {topPerformers[0]?.coverage?.toFixed(1)}% coverage ile 
                  sektör lideri. Bu borsanın feature setini benchmark olarak kullanabilirsiniz.
                </p>
              </div>
              <div className="flex items-start space-x-2">
                <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <p>
                  <strong>Fırsatlar:</strong> {bottomFeatures.filter(f => f.coverage < 40).length} feature'da 
                  düşük pazar penetrasyonu var. Bu alanlarda diferansiyasyon şansı yüksek.
                </p>
              </div>
              <div className="flex items-start space-x-2">
                <Award className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <p>
                  <strong>Quick Wins:</strong> Yüksek öncelikli + düşük coverage feature'lara odaklanın. 
                  Rakiplerinizden önce implement ederek avantaj sağlayın.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Coverage Detail Tab */}
        <TabsContent value="coverage" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Detaylı Coverage İstatistikleri</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-3xl font-bold text-blue-600">
                      {coverageData?.overallCoverage?.toFixed(1) || 0}%
                    </div>
                    <p className="text-sm text-blue-800">Genel Coverage</p>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-3xl font-bold text-green-600">
                      {coverageData?.totalCompetitors || 0}
                    </div>
                    <p className="text-sm text-green-800">Toplam Borsa</p>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-3xl font-bold text-purple-600">
                      {coverageData?.totalFeatures || 0}
                    </div>
                    <p className="text-sm text-purple-800">Toplam Feature</p>
                  </div>
                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <div className="text-3xl font-bold text-orange-600">
                      {coverageData?.totalImplementations || 0}
                    </div>
                    <p className="text-sm text-orange-800">Total Implementations</p>
                  </div>
                </div>

                {/* Borsa Coverage Listesi */}
                <div>
                  <h4 className="font-medium mb-4">Tüm Borsaların Coverage Durumu</h4>
                  <div className="space-y-3">
                    {(coverageData?.competitorCoverage || []).map((comp: any, index: number) => (
                      <div key={comp.competitorId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <span className="text-sm text-gray-500 w-6">{index + 1}.</span>
                          <span className="font-medium">{comp.competitorName}</span>
                          <span className="text-sm text-gray-600">
                            {comp.implementedFeatures}/{comp.totalFeatures}
                          </span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className="w-24 bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${
                                comp.coverage >= 80 ? 'bg-green-500' :
                                comp.coverage >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${comp.coverage}%` }}
                            ></div>
                          </div>
                          <span className={`font-bold text-sm w-12 text-right ${
                            comp.coverage >= 80 ? 'text-green-600' :
                            comp.coverage >= 60 ? 'text-yellow-600' : 'text-red-600'
                          }`}>
                            {comp.coverage.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}