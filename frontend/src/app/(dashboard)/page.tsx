'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  FileText, 
  TrendingUp, 
  Upload,
  Plus,
  Eye,
  Download,
  Activity,
  RefreshCw
} from 'lucide-react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalCompetitors: 0,
    totalFeatures: 0,
    matrixCoverage: 0,
    lastUpdate: 'Yükleniyor...'
  });
  const [topCompetitors, setTopCompetitors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Paralel olarak verileri çek
      const [competitorsRes, featuresRes, coverageRes] = await Promise.all([
        api.competitors.getAll(),
        api.features.getAll(),
        api.analytics.getCoverage()
      ]);

      const competitors = competitorsRes.data || [];
      const features = featuresRes.data || [];

      setStats({
        totalCompetitors: competitors.length,
        totalFeatures: features.length,
        matrixCoverage: Math.round(coverageRes.data?.overallCoverage || 0),
        lastUpdate: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
      });

      // Coverage'a göre sırala
      const sorted = coverageRes.data?.competitorCoverage || [];
      setTopCompetitors(sorted.slice(0, 5));

    } catch (error) {
      console.error('Dashboard verisi yüklenemedi:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Dashboard yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Modern Page Header with Gradient */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 p-8 md:p-10 shadow-strong">
        <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,transparent,rgba(255,255,255,0.6))]"></div>
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm">
                  <Activity className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold text-white">Monitoring Dashboard</h1>
                  <p className="text-blue-100 mt-1 text-sm md:text-base">
                    {stats.totalCompetitors} kripto borsasının gerçek zamanlı feature monitoring'i
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                variant="secondary" 
                size="sm" 
                onClick={loadDashboardData}
                className="bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur-sm transition-smooth"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Yenile
              </Button>
              <Button asChild size="sm" className="bg-white text-blue-600 hover:bg-blue-50 shadow-soft">
                <Link href="/matrix">
                  <Eye className="h-4 w-4 mr-2" />
                  Matrix Görüntüle
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Modern Stats Cards with Gradients */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <Card className="hover-lift border-blue-100 bg-gradient-to-br from-blue-50 to-white dark:from-blue-950 dark:to-gray-900 shadow-soft">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">Toplam Borsalar</CardTitle>
            <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
              <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{stats.totalCompetitors}</div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              monitör ediliyor
            </p>
          </CardContent>
        </Card>

        <Card className="hover-lift border-purple-100 bg-gradient-to-br from-purple-50 to-white dark:from-purple-950 dark:to-gray-900 shadow-soft">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">Toplam Feature'lar</CardTitle>
            <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center">
              <FileText className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">{stats.totalFeatures}</div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              analiz ediliyor
            </p>
          </CardContent>
        </Card>

        <Card className="hover-lift border-emerald-100 bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-950 dark:to-gray-900 shadow-soft">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">Ortalama Coverage</CardTitle>
            <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">{stats.matrixCoverage}%</div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              market average
            </p>
          </CardContent>
        </Card>

        <Card className="hover-lift border-green-100 bg-gradient-to-br from-green-50 to-white dark:from-green-950 dark:to-gray-900 shadow-soft">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">Son Güncelleme</CardTitle>
            <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/50 flex items-center justify-center">
              <Activity className="h-5 w-5 text-green-600 dark:text-green-400 animate-pulse" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600 dark:text-green-400">Aktif</div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              {stats.lastUpdate}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions - Modern Design */}
        <Card className="shadow-soft border-gray-200 hover-glow transition-smooth">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-900">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
                <Plus className="h-4 w-4 text-white" />
              </div>
              <div>
                <CardTitle className="text-lg">Hızlı Erişim</CardTitle>
                <CardDescription className="text-xs">
                  PM monitoring için sık kullanılan araçlar
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 p-6">
            <div className="grid grid-cols-2 gap-3">
              <Link href="/uploads" className="group">
                <div className="h-24 rounded-xl border-2 border-gray-200 hover:border-blue-400 dark:border-gray-700 dark:hover:border-blue-500 transition-all duration-200 flex flex-col items-center justify-center gap-2 hover:shadow-md bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 hover-lift">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Upload className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Excel Yükle</span>
                </div>
              </Link>
              <Link href="/features" className="group">
                <div className="h-24 rounded-xl border-2 border-gray-200 hover:border-purple-400 dark:border-gray-700 dark:hover:border-purple-500 transition-all duration-200 flex flex-col items-center justify-center gap-2 hover:shadow-md bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 hover-lift">
                  <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <FileText className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Feature'lar</span>
                </div>
              </Link>
              <Link href="/matrix" className="group">
                <div className="h-24 rounded-xl border-2 border-gray-200 hover:border-emerald-400 dark:border-gray-700 dark:hover:border-emerald-500 transition-all duration-200 flex flex-col items-center justify-center gap-2 hover:shadow-md bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 hover-lift">
                  <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Eye className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Matrix</span>
                </div>
              </Link>
              <Link href="/analytics" className="group">
                <div className="h-24 rounded-xl border-2 border-gray-200 hover:border-amber-400 dark:border-gray-700 dark:hover:border-amber-500 transition-all duration-200 flex flex-col items-center justify-center gap-2 hover:shadow-md bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 hover-lift">
                  <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <TrendingUp className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Gap Analizi</span>
                </div>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Top Competitors - Modern Leaderboard */}
        <Card className="shadow-soft border-gray-200 hover-glow transition-smooth">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-900">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-white" />
              </div>
              <div>
                <CardTitle className="text-lg">En Kapsamlı Borsalar</CardTitle>
                <CardDescription className="text-xs">
                  Feature coverage'a göre sıralanmış
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {topCompetitors.length > 0 ? (
              <div className="space-y-3">
                {topCompetitors.map((competitor, index) => (
                  <div key={index} className="group p-3 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 transition-all hover-lift bg-gradient-to-r from-white to-gray-50/50 dark:from-gray-800 dark:to-gray-900/50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold transition-all group-hover:scale-110",
                          index === 0 ? "bg-gradient-to-br from-yellow-400 to-amber-500 text-white shadow-md" :
                          index === 1 ? "bg-gradient-to-br from-gray-300 to-gray-400 text-white" :
                          index === 2 ? "bg-gradient-to-br from-amber-600 to-amber-700 text-white" :
                          "bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400"
                        )}>
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            {competitor.competitorName}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {competitor.implementedFeatures} özellik
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <Badge 
                          className={cn(
                            "font-bold shadow-sm",
                            competitor.coverage > 80 ? 'badge-success' : 
                            competitor.coverage > 60 ? 'badge-info' : 
                            'badge-neutral'
                          )}
                        >
                          {competitor.coverage.toFixed(1)}%
                        </Badge>
                        <div className="w-16 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all"
                            style={{ width: `${competitor.coverage}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                    <Activity className="h-6 w-6 text-gray-400 animate-pulse" />
                  </div>
                  <p className="text-sm text-gray-500">Veri yükleniyor...</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Data Overview - Modern Stats Grid */}
      <Card className="shadow-soft border-gray-200 hover-glow transition-smooth overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-white text-lg">Veri Seti Özeti</CardTitle>
              <CardDescription className="text-indigo-100 text-xs">
                Platformdaki mevcut benchmark verileri
              </CardDescription>
            </div>
            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Activity className="h-6 w-6 text-white" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6 bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="group text-center p-5 rounded-2xl border-2 border-blue-200 dark:border-blue-800 bg-gradient-to-br from-blue-50 to-white dark:from-blue-950 dark:to-gray-900 hover-lift transition-all hover:shadow-md">
              <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div className="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-1">{stats.totalCompetitors}</div>
              <p className="text-xs font-medium text-blue-700 dark:text-blue-300">Borsa</p>
            </div>
            <div className="group text-center p-5 rounded-2xl border-2 border-purple-200 dark:border-purple-800 bg-gradient-to-br from-purple-50 to-white dark:from-purple-950 dark:to-gray-900 hover-lift transition-all hover:shadow-md">
              <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <div className="text-4xl font-bold text-purple-600 dark:text-purple-400 mb-1">{stats.totalFeatures}</div>
              <p className="text-xs font-medium text-purple-700 dark:text-purple-300">Feature</p>
            </div>
            <div className="group text-center p-5 rounded-2xl border-2 border-green-200 dark:border-green-800 bg-gradient-to-br from-green-50 to-white dark:from-green-950 dark:to-gray-900 hover-lift transition-all hover:shadow-md">
              <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <div className="text-4xl font-bold text-green-600 dark:text-green-400 mb-1">
                {stats.totalCompetitors * stats.totalFeatures}
              </div>
              <p className="text-xs font-medium text-green-700 dark:text-green-300">Veri Noktası</p>
            </div>
            <div className="group text-center p-5 rounded-2xl border-2 border-orange-200 dark:border-orange-800 bg-gradient-to-br from-orange-50 to-white dark:from-orange-950 dark:to-gray-900 hover-lift transition-all hover:shadow-md">
              <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Activity className="h-6 w-6 text-white" />
              </div>
              <div className="text-4xl font-bold text-orange-600 dark:text-orange-400 mb-1">{stats.matrixCoverage}%</div>
              <p className="text-xs font-medium text-orange-700 dark:text-orange-300">Avg Coverage</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}