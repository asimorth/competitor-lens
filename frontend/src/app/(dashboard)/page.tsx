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
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Monitoring Dashboard</h1>
          <p className="text-gray-600 mt-1">
            {stats.totalCompetitors} kripto borsasının feature monitoring özeti
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" size="sm" onClick={loadDashboardData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Yenile
          </Button>
          <Button asChild size="sm">
            <Link href="/matrix">
              <Eye className="h-4 w-4 mr-2" />
              Matrix Görüntüle
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Borsalar</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCompetitors}</div>
            <p className="text-xs text-muted-foreground">
              monitör ediliyor
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Feature'lar</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalFeatures}</div>
            <p className="text-xs text-muted-foreground">
              analiz ediliyor
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ortalama Coverage</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.matrixCoverage}%</div>
            <p className="text-xs text-muted-foreground">
              market average
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Son Güncelleme</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">Aktif</div>
            <p className="text-xs text-muted-foreground">
              {stats.lastUpdate}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Hızlı Erişim</CardTitle>
            <CardDescription>
              PM monitoring için sık kullanılan araçlar
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Button asChild variant="outline" className="h-20 flex-col">
                <Link href="/uploads">
                  <Upload className="h-6 w-6 mb-2" />
                  Excel Yükle
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-20 flex-col">
                <Link href="/features">
                  <FileText className="h-6 w-6 mb-2" />
                  Feature'lar
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-20 flex-col">
                <Link href="/matrix">
                  <Eye className="h-6 w-6 mb-2" />
                  Matrix Görüntüle
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-20 flex-col">
                <Link href="/analytics">
                  <TrendingUp className="h-6 w-6 mb-2" />
                  Gap Analizi
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Top Competitors */}
        <Card>
          <CardHeader>
            <CardTitle>En Kapsamlı Borsalar</CardTitle>
            <CardDescription>
              Feature coverage'a göre sıralanmış
            </CardDescription>
          </CardHeader>
          <CardContent>
            {topCompetitors.length > 0 ? (
              <div className="space-y-4">
                {topCompetitors.map((competitor, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-medium text-blue-600">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium">{competitor.competitorName}</p>
                        <p className="text-sm text-gray-500">{competitor.implementedFeatures} feature</p>
                      </div>
                    </div>
                    <Badge variant={competitor.coverage > 80 ? 'default' : 'secondary'}>
                      {competitor.coverage.toFixed(1)}%
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">Veri yükleniyor...</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Data Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Veri Seti Özeti</CardTitle>
          <CardDescription>
            Platformdaki mevcut benchmark verileri
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-3xl font-bold text-blue-600">{stats.totalCompetitors}</div>
              <p className="text-sm text-blue-800">Borsa</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-3xl font-bold text-purple-600">{stats.totalFeatures}</div>
              <p className="text-sm text-purple-800">Feature</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-3xl font-bold text-green-600">
                {stats.totalCompetitors * stats.totalFeatures}
              </div>
              <p className="text-sm text-green-800">Veri Noktası</p>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-3xl font-bold text-orange-600">{stats.matrixCoverage}%</div>
              <p className="text-sm text-orange-800">Avg Coverage</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}