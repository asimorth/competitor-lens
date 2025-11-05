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

      {/* Ultra Compact Stats - No Overflow */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-white dark:from-blue-950 dark:to-gray-900 rounded-lg border border-blue-100 p-2.5 md:p-4">
          <div className="flex items-center gap-1.5 mb-1">
            <div className="w-6 h-6 md:w-8 md:h-8 rounded bg-blue-500 flex items-center justify-center flex-shrink-0">
              <Users className="h-3.5 w-3.5 md:h-4 md:w-4 text-white" />
            </div>
            <span className="text-[10px] md:text-xs font-medium text-gray-600 dark:text-gray-400">Borsa</span>
          </div>
          <div className="text-xl md:text-3xl font-bold text-blue-600 dark:text-blue-400">{stats.totalCompetitors}</div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-white dark:from-purple-950 dark:to-gray-900 rounded-lg border border-purple-100 p-2.5 md:p-4">
          <div className="flex items-center gap-1.5 mb-1">
            <div className="w-6 h-6 md:w-8 md:h-8 rounded bg-purple-500 flex items-center justify-center flex-shrink-0">
              <FileText className="h-3.5 w-3.5 md:h-4 md:w-4 text-white" />
            </div>
            <span className="text-[10px] md:text-xs font-medium text-gray-600 dark:text-gray-400">Feature</span>
          </div>
          <div className="text-xl md:text-3xl font-bold text-purple-600 dark:text-purple-400">{stats.totalFeatures}</div>
        </div>

        <div className="bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-950 dark:to-gray-900 rounded-lg border border-emerald-100 p-2.5 md:p-4">
          <div className="flex items-center gap-1.5 mb-1">
            <div className="w-6 h-6 md:w-8 md:h-8 rounded bg-emerald-500 flex items-center justify-center flex-shrink-0">
              <TrendingUp className="h-3.5 w-3.5 md:h-4 md:w-4 text-white" />
            </div>
            <span className="text-[10px] md:text-xs font-medium text-gray-600 dark:text-gray-400">Avg</span>
          </div>
          <div className="text-xl md:text-3xl font-bold text-emerald-600 dark:text-emerald-400">{stats.matrixCoverage}%</div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-white dark:from-green-950 dark:to-gray-900 rounded-lg border border-green-100 p-2.5 md:p-4">
          <div className="flex items-center gap-1.5 mb-1">
            <div className="w-6 h-6 md:w-8 md:h-8 rounded bg-green-500 flex items-center justify-center flex-shrink-0">
              <Activity className="h-3.5 w-3.5 md:h-4 md:w-4 text-white animate-pulse" />
            </div>
            <span className="text-[10px] md:text-xs font-medium text-gray-600 dark:text-gray-400">Live</span>
          </div>
          <div className="text-xl md:text-3xl font-bold text-green-600 dark:text-green-400">ON</div>
        </div>
      </div>

      {/* Actions - Compact List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-6">
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 px-1">Hızlı Erişim</h2>
          <div className="space-y-1.5">
            <Link href="/matrix" className="flex items-center gap-2.5 p-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 active:bg-gray-50 dark:active:bg-gray-700 transition-colors">
              <div className="w-8 h-8 rounded bg-emerald-500 flex items-center justify-center flex-shrink-0">
                <Eye className="h-4 w-4 text-white" />
              </div>
              <span className="text-sm font-medium text-gray-900 dark:text-white">Matrix</span>
            </Link>
            <Link href="/features" className="flex items-center gap-2.5 p-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 active:bg-gray-50 dark:active:bg-gray-700 transition-colors">
              <div className="w-8 h-8 rounded bg-purple-500 flex items-center justify-center flex-shrink-0">
                <FileText className="h-4 w-4 text-white" />
              </div>
              <span className="text-sm font-medium text-gray-900 dark:text-white">Özellikler</span>
            </Link>
            <Link href="/analytics" className="flex items-center gap-2.5 p-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 active:bg-gray-50 dark:active:bg-gray-700 transition-colors">
              <div className="w-8 h-8 rounded bg-amber-500 flex items-center justify-center flex-shrink-0">
                <TrendingUp className="h-4 w-4 text-white" />
              </div>
              <span className="text-sm font-medium text-gray-900 dark:text-white">Gap Analizi</span>
            </Link>
            <Link href="/competitors" className="flex items-center gap-2.5 p-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 active:bg-gray-50 dark:active:bg-gray-700 transition-colors">
              <div className="w-8 h-8 rounded bg-blue-500 flex items-center justify-center flex-shrink-0">
                <Building2 className="h-4 w-4 text-white" />
              </div>
              <span className="text-sm font-medium text-gray-900 dark:text-white">Rakipler</span>
            </Link>
          </div>
        </div>

        {/* Top 5 - Ultra Compact */}
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 px-1">Top 5 Borsa</h2>
          {topCompetitors.length > 0 ? (
            <div className="space-y-1.5">
              {topCompetitors.map((competitor, index) => (
                <div key={index} className="flex items-center gap-2 p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                  <div className={cn(
                    "w-7 h-7 rounded flex items-center justify-center text-xs font-bold flex-shrink-0",
                    index === 0 ? "bg-gradient-to-br from-yellow-400 to-amber-500 text-white" :
                    index === 1 ? "bg-gray-300 text-white" :
                    index === 2 ? "bg-amber-600 text-white" :
                    "bg-blue-100 text-blue-600"
                  )}>
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-gray-900 dark:text-white truncate">
                      {competitor.competitorName}
                    </p>
                  </div>
                  <div className="text-xs font-bold px-1.5 py-0.5 rounded flex-shrink-0" style={{
                    color: competitor.coverage > 80 ? '#059669' : competitor.coverage > 60 ? '#2563eb' : '#6b7280',
                    backgroundColor: competitor.coverage > 80 ? '#d1fae5' : competitor.coverage > 60 ? '#dbeafe' : '#f3f4f6'
                  }}>
                    {competitor.coverage.toFixed(0)}%
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-6 text-center">
              <Activity className="h-6 w-6 text-gray-400 animate-pulse mx-auto mb-2" />
              <p className="text-xs text-gray-500">Yükleniyor...</p>
            </div>
          )}
        </div>
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