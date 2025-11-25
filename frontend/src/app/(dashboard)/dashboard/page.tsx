'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Building2, 
  Sparkles, 
  TrendingUp, 
  Award, 
  Camera,
  BarChart3,
  ArrowRight,
  Eye,
  LayoutGrid
} from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [competitorsRes, featuresRes, screenshotsRes, coverageRes] = await Promise.all([
        api.competitors.getAll().catch(() => ({ data: [] })),
        api.features.getAll().catch(() => ({ data: [] })),
        api.screenshots.getAll().catch(() => ({ data: [] })),
        api.analytics.getCoverage().catch(() => ({ data: { competitors: [] } }))
      ]);

      // Calculate stats
      const totalCompetitors = competitorsRes.data?.length || 0;
      const totalFeatures = featuresRes.data?.length || 0;
      
      // Screenshot count - Direkt Screenshot API'den
      const totalScreenshots = screenshotsRes.data?.length || 0;
      
      // Calculate coverage from competitors
      const competitorsWithFeatures = competitorsRes.data || [];
      let totalCoverage = 0;
      let competitorCount = 0;

      competitorsWithFeatures.forEach((comp: any) => {
        if (comp.features && comp.features.length > 0) {
          const implemented = comp.features.filter((f: any) => f.hasFeature).length;
          const coverage = (implemented / comp.features.length) * 100;
          totalCoverage += coverage;
          competitorCount++;
        }
      });

      const averageCoverage = competitorCount > 0 ? totalCoverage / competitorCount : 0;

      // Get top competitors by coverage
      const topCompetitors = competitorsWithFeatures
        .map((comp: any) => {
          const totalFeats = comp.features?.length || 0;
          const implementedFeats = comp.features?.filter((f: any) => f.hasFeature).length || 0;
          const coverage = totalFeats > 0 ? (implementedFeats / totalFeats) * 100 : 0;
          
          return {
            ...comp,
            totalFeatures: totalFeats,
            implementedFeatures: implementedFeats,
            coverage
          };
        })
        .sort((a: any, b: any) => b.coverage - a.coverage)
        .slice(0, 5);

      setStats({
        totalCompetitors,
        totalFeatures,
        totalScreenshots,
        topCompetitors,
        averageCoverage,
        categoryCoverage: coverageRes.data?.byCategory || []
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      // Set default stats on error
      setStats({
        totalCompetitors: 0,
        totalFeatures: 0,
        totalScreenshots: 0,
        topCompetitors: [],
        averageCoverage: 0,
        categoryCoverage: []
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Dashboard yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">
          Rakip analiz platformuna hoş geldiniz. Tüm verilerinize buradan ulaşabilirsiniz.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
          <Link href="/competitors">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <Building2 className="h-8 w-8 text-blue-600" />
                <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-gray-900">{stats.totalCompetitors}</p>
              <p className="text-sm text-gray-600 mt-1">Toplam Rakip</p>
              <div className="mt-4">
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Global</span>
                  <span>Türkiye</span>
                </div>
                <Progress value={35} className="mt-1 h-2" />
              </div>
            </CardContent>
          </Link>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
          <Link href="/features">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <Sparkles className="h-8 w-8 text-purple-600" />
                <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-gray-900">{stats.totalFeatures}</p>
              <p className="text-sm text-gray-600 mt-1">Toplam Özellik</p>
              <div className="mt-4">
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>12 Kategori</span>
                  <span>Aktif</span>
                </div>
                <Progress value={100} className="mt-1 h-2" />
              </div>
            </CardContent>
          </Link>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <Camera className="h-8 w-8 text-green-600" />
              <Eye className="h-4 w-4 text-gray-400" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-gray-900">{stats.totalScreenshots}</p>
            <p className="text-sm text-gray-600 mt-1">Ekran Görüntüsü</p>
            <div className="mt-4">
              <p className="text-xs text-gray-500">Son güncelleme: Bugün</p>
              <Progress value={75} className="mt-1 h-2" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
          <Link href="/matrix">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <BarChart3 className="h-8 w-8 text-orange-600" />
                <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-gray-900">{Math.round(stats.averageCoverage)}%</p>
              <p className="text-sm text-gray-600 mt-1">Ortalama Kapsama</p>
              <div className="mt-4">
                <p className="text-xs text-gray-500">Platform ortalaması</p>
                <Progress value={stats.averageCoverage} className="mt-1 h-2" />
              </div>
            </CardContent>
          </Link>
        </Card>
      </div>

      {/* Top Competitors */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>En Yüksek Kapsama</span>
              <Award className="h-5 w-5 text-yellow-600" />
            </CardTitle>
            <CardDescription>
              Feature kapsaması en yüksek rakipler
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.topCompetitors.map((competitor: any, index: number) => (
                <Link 
                  key={competitor.id} 
                  href={`/competitors/${competitor.id}`}
                  className="block hover:bg-gray-50 rounded-lg p-3 -m-3 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`
                        w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold
                        ${index === 0 ? 'bg-gradient-to-br from-yellow-400 to-orange-500' : 
                          index === 1 ? 'bg-gradient-to-br from-gray-400 to-gray-600' :
                          index === 2 ? 'bg-gradient-to-br from-orange-400 to-red-500' :
                          'bg-gradient-to-br from-blue-400 to-purple-500'}
                      `}>
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{competitor.name}</p>
                        <p className="text-sm text-gray-500">
                          {competitor.implementedFeatures} / {competitor.totalFeatures} özellik
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-gray-900">{Math.round(competitor.coverage)}%</p>
                      <Progress value={competitor.coverage} className="w-20 h-2 mt-1" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Category Coverage */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Kategori Analizi</span>
              <TrendingUp className="h-5 w-5 text-blue-600" />
            </CardTitle>
            <CardDescription>
              Kategori bazında platform kapsaması
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.categoryCoverage.slice(0, 5).map((category: any) => (
                <div key={category.category}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">{category.category}</span>
                    <span className="text-sm text-gray-500">
                      {Math.round(category.avgCoverage)}%
                    </span>
                  </div>
                  <Progress value={category.avgCoverage} className="h-2" />
                </div>
              ))}
            </div>
            <div className="mt-6 pt-4 border-t">
            <Link href="/matrix">
              <Button variant="outline" className="w-full group">
                Detaylı Analiz
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Hızlı Eylemler</CardTitle>
          <CardDescription>
            Sık kullanılan işlemler ve kısayollar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <Link href="/matrix">
              <Button variant="outline" className="w-full justify-start group">
                <LayoutGrid className="mr-2 h-4 w-4 text-blue-600" />
                Feature Matrix'i Görüntüle
                <ArrowRight className="ml-auto h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
              </Button>
            </Link>
            <Link href="/features-simple">
              <Button variant="outline" className="w-full justify-start group">
                <Camera className="mr-2 h-4 w-4 text-purple-600" />
                Screenshot Gallery
                <ArrowRight className="ml-auto h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
              </Button>
            </Link>
            <Link href="/competitors">
              <Button variant="outline" className="w-full justify-start group">
                <Building2 className="mr-2 h-4 w-4 text-green-600" />
                Yeni Rakip Ekle
                <ArrowRight className="ml-auto h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}