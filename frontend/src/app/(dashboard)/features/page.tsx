'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  FileText, 
  Search,
  TrendingUp,
  Users,
  Image as ImageIcon,
  Eye,
  RefreshCw
} from 'lucide-react';
import Link from 'next/link';
import { api } from '@/lib/api';

export default function FeaturesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [features, setFeatures] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFeatures();
  }, []);

  const loadFeatures = async () => {
    setLoading(true);
    try {
      const res = await api.features.getAll();
      const allFeatures = res.data || [];
      
      // Her feature için istatistikleri hesapla
      const enrichedFeatures = allFeatures.map((feature: any) => {
        const totalExchanges = 19; // Bilinen borsa sayısı
        const implementedBy = feature.competitors?.filter((c: any) => c.hasFeature).length || 0;
        const coverage = Math.round((implementedBy / totalExchanges) * 100);
        const screenshotCount = feature.competitors?.reduce((sum: number, c: any) => {
          return sum + (c.screenshots ? (Array.isArray(c.screenshots) ? c.screenshots.length : 0) : 0);
        }, 0) || 0;
        
        return {
          ...feature,
          implementedBy,
          totalExchanges,
          coverage,
          screenshotCount
        };
      });
      
      setFeatures(enrichedFeatures);
    } catch (error) {
      console.error('Feature\'lar yüklenemedi:', error);
    } finally {
      setLoading(false);
    }
  };

  const categories = ['all', ...Array.from(new Set(features.map(f => f.category).filter(Boolean)))];

  const filteredFeatures = features.filter(feature => {
    const matchesSearch = feature.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (feature.description && feature.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = categoryFilter === 'all' || feature.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCoverageColor = (coverage: number) => {
    if (coverage >= 80) return 'text-green-600';
    if (coverage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Feature'lar yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Feature Monitoring</h1>
          <p className="text-gray-600 mt-1">
            {features.length} feature'ın {features[0]?.totalExchanges || 19} borsa genelindeki durumu
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" size="sm" onClick={loadFeatures}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Yenile
          </Button>
          <Button asChild size="sm">
            <Link href="/matrix">
              <Eye className="h-4 w-4 mr-2" />
              Matrix'te Görüntüle
            </Link>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-gray-400" />
            <Input
              placeholder="Feature ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-64"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Kategori seç" />
            </SelectTrigger>
            <SelectContent>
              {categories.map(category => (
                <SelectItem key={category} value={category}>
                  {category === 'all' ? 'Tüm Kategoriler' : category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="text-sm text-gray-600">
          {filteredFeatures.length} / {features.length} feature
        </div>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredFeatures.map((feature) => (
          <Card key={feature.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <CardTitle className="text-lg">{feature.name}</CardTitle>
                    {feature.priority && (
                      <Badge className={getPriorityColor(feature.priority)}>
                        {feature.priority}
                      </Badge>
                    )}
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {feature.category}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600 line-clamp-2">
                {feature.description || 'Açıklama yok'}
              </p>
              
              {/* Coverage Stats */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span>Coverage:</span>
                  <span className={`font-medium ${getCoverageColor(feature.coverage)}`}>
                    {feature.coverage}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${
                      feature.coverage >= 80 ? 'bg-green-500' :
                      feature.coverage >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${feature.coverage}%` }}
                  ></div>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center space-x-1">
                    <Users className="h-3 w-3" />
                    <span>{feature.implementedBy}/{feature.totalExchanges} borsa</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <ImageIcon className="h-3 w-3" />
                    <span>{feature.screenshotCount} görsel</span>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">
                    {new Date(feature.createdAt).toLocaleDateString('tr-TR')}
                  </span>
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/features/${feature.id}`}>
                      Detay Görüntüle
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredFeatures.length === 0 && !loading && (
        <Card className="text-center py-12">
          <CardContent>
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Feature bulunamadı
            </h3>
            <p className="text-gray-600 mb-4">
              Arama kriterlerinize uygun feature bulunamadı.
            </p>
            <Button onClick={() => {
              setSearchTerm('');
              setCategoryFilter('all');
            }}>
              Filtreleri Temizle
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">
              {features.length}
            </div>
            <p className="text-sm text-gray-600">Toplam Feature</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">
              {features.filter(f => f.coverage >= 80).length}
            </div>
            <p className="text-sm text-gray-600">Yüksek Coverage (&gt;80%)</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-yellow-600">
              {features.filter(f => f.priority === 'high').length}
            </div>
            <p className="text-sm text-gray-600">Yüksek Öncelik</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-purple-600">
              {features.reduce((sum, f) => sum + (f.screenshotCount || 0), 0)}
            </div>
            <p className="text-sm text-gray-600">Toplam Görsel</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}