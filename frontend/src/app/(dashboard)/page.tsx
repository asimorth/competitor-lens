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
  RefreshCw,
  Building2
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
    <div className="space-y-3 md:space-y-6">
      {/* Ultra Compact Mobile Header */}
      <div className="relative overflow-hidden rounded-lg md:rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 p-3 md:p-8 shadow-md">
        <div className="relative z-10">
          {/* Mobile: Minimal */}
          <div className="md:hidden flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                <Activity className="h-4 w-4 text-white" />
              </div>
              <div>
                <h1 className="text-base font-bold text-white">Dashboard</h1>
                <p className="text-blue-100 text-xs">{stats.totalCompetitors} borsa</p>
              </div>
            </div>
            <Button 
              size="sm" 
              onClick={loadDashboardData}
              className="bg-white/10 text-white border-white/20 h-7 w-7 p-0"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
          </div>

          {/* Desktop */}
          <div className="hidden md:flex md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                <Activity className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">Dashboard</h1>
                <p className="text-blue-100 mt-1">{stats.totalCompetitors} borsa · {stats.totalFeatures} özellik</p>
              </div>
            </div>
            <Button 
              size="sm" 
              onClick={loadDashboardData}
              className="bg-white/10 hover:bg-white/20 text-white border-white/20"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Yenile
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile: Compact Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <Card className="border-blue-100 bg-gradient-to-br from-blue-50 to-white dark:from-blue-950 dark:to-gray-900 shadow-sm">
          <CardHeader className="p-3 md:p-4 pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs md:text-sm font-medium text-gray-600 dark:text-gray-400">Borsalar</CardTitle>
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                <Users className="h-4 w-4 md:h-5 md:w-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-3 md:p-4 pt-0">
            <div className="text-2xl md:text-3xl font-bold text-blue-600 dark:text-blue-400">{stats.totalCompetitors}</div>
          </CardContent>
        </Card>

        <Card className="border-purple-100 bg-gradient-to-br from-purple-50 to-white dark:from-purple-950 dark:to-gray-900 shadow-sm">
          <CardHeader className="p-3 md:p-4 pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs md:text-sm font-medium text-gray-600 dark:text-gray-400">Özellikler</CardTitle>
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center">
                <FileText className="h-4 w-4 md:h-5 md:w-5 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-3 md:p-4 pt-0">
            <div className="text-2xl md:text-3xl font-bold text-purple-600 dark:text-purple-400">{stats.totalFeatures}</div>
          </CardContent>
        </Card>

        <Card className="border-emerald-100 bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-950 dark:to-gray-900 shadow-sm">
          <CardHeader className="p-3 md:p-4 pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs md:text-sm font-medium text-gray-600 dark:text-gray-400">Coverage</CardTitle>
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center">
                <TrendingUp className="h-4 w-4 md:h-5 md:w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-3 md:p-4 pt-0">
            <div className="text-2xl md:text-3xl font-bold text-emerald-600 dark:text-emerald-400">{stats.matrixCoverage}%</div>
          </CardContent>
        </Card>

        <Card className="border-green-100 bg-gradient-to-br from-green-50 to-white dark:from-green-950 dark:to-gray-900 shadow-sm">
          <CardHeader className="p-3 md:p-4 pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs md:text-sm font-medium text-gray-600 dark:text-gray-400">Status</CardTitle>
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-green-100 dark:bg-green-900/50 flex items-center justify-center">
                <Activity className="h-4 w-4 md:h-5 md:w-5 text-green-600 dark:text-green-400 animate-pulse" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-3 md:p-4 pt-0">
            <div className="text-2xl md:text-3xl font-bold text-green-600 dark:text-green-400">Live</div>
          </CardContent>
        </Card>
      </div>

      {/* Mobile: Single Column, Desktop: Two Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Quick Actions - Simplified for Mobile */}
        <Card className="shadow-sm border-gray-200">
          <CardHeader className="p-4 md:p-6 pb-3 bg-gradient-to-r from-blue-50 to-white dark:from-gray-800 dark:to-gray-900">
            <CardTitle className="text-base md:text-lg flex items-center gap-2">
              <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
                <Plus className="h-3.5 w-3.5 md:h-4 md:w-4 text-white" />
              </div>
              Hızlı Erişim
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 md:p-6 pt-3">
            {/* Mobile: Simple List, Desktop: Grid */}
            <div className="space-y-2 md:space-y-0 md:grid md:grid-cols-2 md:gap-3">
              <Link href="/matrix" className="group block">
                <div className="flex md:flex-col items-center md:justify-center gap-3 md:gap-2 p-3 md:p-4 md:h-20 rounded-lg border border-gray-200 hover:border-emerald-400 dark:border-gray-700 transition-all bg-white dark:bg-gray-800 active:scale-95 md:hover:scale-105">
                  <div className="w-9 h-9 md:w-10 md:h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center flex-shrink-0">
                    <Eye className="h-4.5 w-4.5 md:h-5 md:w-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <span className="text-sm md:text-base font-medium text-gray-900 dark:text-gray-100 flex-1 md:flex-none">Matrix Görüntüle</span>
                </div>
              </Link>
              <Link href="/features" className="group block">
                <div className="flex md:flex-col items-center md:justify-center gap-3 md:gap-2 p-3 md:p-4 md:h-20 rounded-lg border border-gray-200 hover:border-purple-400 dark:border-gray-700 transition-all bg-white dark:bg-gray-800 active:scale-95 md:hover:scale-105">
                  <div className="w-9 h-9 md:w-10 md:h-10 rounded-lg bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center flex-shrink-0">
                    <FileText className="h-4.5 w-4.5 md:h-5 md:w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <span className="text-sm md:text-base font-medium text-gray-900 dark:text-gray-100 flex-1 md:flex-none">Özellikler</span>
                </div>
              </Link>
              <Link href="/analytics" className="group block">
                <div className="flex md:flex-col items-center md:justify-center gap-3 md:gap-2 p-3 md:p-4 md:h-20 rounded-lg border border-gray-200 hover:border-amber-400 dark:border-gray-700 transition-all bg-white dark:bg-gray-800 active:scale-95 md:hover:scale-105">
                  <div className="w-9 h-9 md:w-10 md:h-10 rounded-lg bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="h-4.5 w-4.5 md:h-5 md:w-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <span className="text-sm md:text-base font-medium text-gray-900 dark:text-gray-100 flex-1 md:flex-none">Gap Analizi</span>
                </div>
              </Link>
              <Link href="/competitors" className="group block">
                <div className="flex md:flex-col items-center md:justify-center gap-3 md:gap-2 p-3 md:p-4 md:h-20 rounded-lg border border-gray-200 hover:border-blue-400 dark:border-gray-700 transition-all bg-white dark:bg-gray-800 active:scale-95 md:hover:scale-105">
                  <div className="w-9 h-9 md:w-10 md:h-10 rounded-lg bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center flex-shrink-0">
                    <Building2 className="h-4.5 w-4.5 md:h-5 md:w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <span className="text-sm md:text-base font-medium text-gray-900 dark:text-gray-100 flex-1 md:flex-none">Rakipler</span>
                </div>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Top Competitors - Clean Mobile Design */}
        <Card className="shadow-sm border-gray-200">
          <CardHeader className="p-4 md:p-6 pb-3 bg-gradient-to-r from-amber-50 to-white dark:from-gray-800 dark:to-gray-900">
            <CardTitle className="text-base md:text-lg flex items-center gap-2">
              <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                <TrendingUp className="h-3.5 w-3.5 md:h-4 md:w-4 text-white" />
              </div>
              Top 5 Borsa
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 md:p-6 pt-3">
            {topCompetitors.length > 0 ? (
              <div className="space-y-2 md:space-y-3">
                {topCompetitors.map((competitor, index) => (
                  <div key={index} className="group p-2.5 md:p-3 rounded-lg md:rounded-xl border border-gray-200 dark:border-gray-700 hover:border-blue-300 transition-all bg-white dark:bg-gray-800 active:scale-95">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
                        <div className={cn(
                          "w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl flex items-center justify-center text-xs md:text-sm font-bold flex-shrink-0",
                          index === 0 ? "bg-gradient-to-br from-yellow-400 to-amber-500 text-white" :
                          index === 1 ? "bg-gradient-to-br from-gray-300 to-gray-400 text-white" :
                          index === 2 ? "bg-gradient-to-br from-amber-600 to-amber-700 text-white" :
                          "bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400"
                        )}>
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm md:text-base text-gray-900 dark:text-white truncate">
                            {competitor.competitorName}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {competitor.implementedFeatures} özellik
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-0.5 md:gap-1 flex-shrink-0">
                        <span className={cn(
                          "text-xs md:text-sm font-bold px-2 py-0.5 rounded",
                          competitor.coverage > 80 ? 'text-emerald-700 bg-emerald-100' : 
                          competitor.coverage > 60 ? 'text-blue-700 bg-blue-100' : 
                          'text-gray-700 bg-gray-100'
                        )}>
                          {competitor.coverage.toFixed(0)}%
                        </span>
                        <div className="w-12 md:w-16 h-1 md:h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"
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

      {/* Data Overview - Clean Mobile Grid */}
      <div className="hidden md:block">
        <Card className="shadow-sm border-gray-200 overflow-hidden">
          <CardHeader className="p-4 md:p-6 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Activity className="h-4 w-4 text-white" />
              </div>
              <CardTitle className="text-white text-base md:text-lg">Platform Özeti</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-4 md:p-6 bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
            <div className="grid grid-cols-4 gap-3 md:gap-4">
              <div className="text-center p-3 md:p-4 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/30">
                <div className="text-2xl md:text-3xl font-bold text-blue-600 dark:text-blue-400 mb-1">{stats.totalCompetitors}</div>
                <p className="text-xs font-medium text-blue-700 dark:text-blue-300">Borsa</p>
              </div>
              <div className="text-center p-3 md:p-4 rounded-lg border border-purple-200 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-950/30">
                <div className="text-2xl md:text-3xl font-bold text-purple-600 dark:text-purple-400 mb-1">{stats.totalFeatures}</div>
                <p className="text-xs font-medium text-purple-700 dark:text-purple-300">Feature</p>
              </div>
              <div className="text-center p-3 md:p-4 rounded-lg border border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/30">
                <div className="text-2xl md:text-3xl font-bold text-green-600 dark:text-green-400 mb-1">
                  {stats.totalCompetitors * stats.totalFeatures}
                </div>
                <p className="text-xs font-medium text-green-700 dark:text-green-300">Veri</p>
              </div>
              <div className="text-center p-3 md:p-4 rounded-lg border border-orange-200 dark:border-orange-800 bg-orange-50/50 dark:bg-orange-950/30">
                <div className="text-2xl md:text-3xl font-bold text-orange-600 dark:text-orange-400 mb-1">{stats.matrixCoverage}%</div>
                <p className="text-xs font-medium text-orange-700 dark:text-orange-300">Coverage</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}