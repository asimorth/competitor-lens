'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { CheckCircle, XCircle, Circle, Search, Filter, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MobileFeatureMatrixProps {
  competitors: any[];
  features: any[];
  matrix: any[];
}

export function MobileFeatureMatrix({ competitors, features, matrix }: MobileFeatureMatrixProps) {
  const [selectedView, setSelectedView] = useState<'competitor' | 'feature'>('competitor');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedCompetitor, setSelectedCompetitor] = useState<any>(null);
  const [selectedFeature, setSelectedFeature] = useState<any>(null);

  const categories = ['all', ...Array.from(new Set(features.map(f => f.category).filter(Boolean)))];

  const filteredFeatures = features.filter(feature => {
    const matchesSearch = feature.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || feature.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getImplementationIcon = (quality: string | null) => {
    switch (quality) {
      case 'excellent':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'good':
        return <CheckCircle className="h-5 w-5 text-blue-500" />;
      case 'basic':
        return <Circle className="h-5 w-5 text-yellow-500" />;
      default:
        return <XCircle className="h-5 w-5 text-gray-300" />;
    }
  };

  const getCompetitorFeatureData = (competitorId: string, featureId: string) => {
    const row = matrix.find(m => m.featureId === featureId);
    return row?.[competitorId] || { hasFeature: false };
  };

  return (
    <div className="space-y-4">
      {/* View Toggle */}
      <div className="flex gap-2">
        <Button
          variant={selectedView === 'competitor' ? 'default' : 'outline'}
          onClick={() => setSelectedView('competitor')}
          className="flex-1"
        >
          Borsa Görünümü
        </Button>
        <Button
          variant={selectedView === 'feature' ? 'default' : 'outline'}
          onClick={() => setSelectedView('feature')}
          className="flex-1"
        >
          Özellik Görünümü
        </Button>
      </div>

      {/* Search and Filter */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder={selectedView === 'competitor' ? 'Borsa ara...' : 'Özellik ara...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        {selectedView === 'feature' && (
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger>
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
        )}
      </div>

      {/* Competitor View */}
      {selectedView === 'competitor' && (
        <div className="space-y-2">
          {competitors
            .filter(comp => comp.name.toLowerCase().includes(searchTerm.toLowerCase()))
            .map(competitor => {
              const implementedFeatures = competitor.features?.filter((f: any) => f.hasFeature).length || 0;
              const totalFeatures = features.length;
              const coverage = totalFeatures > 0 ? (implementedFeatures / totalFeatures * 100).toFixed(0) : 0;

              return (
                <Sheet key={competitor.id}>
                  <SheetTrigger asChild>
                    <Card className="cursor-pointer touch-manipulation">
                      <CardHeader className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-base">{competitor.name}</CardTitle>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="secondary" className="text-xs">
                                {implementedFeatures} / {totalFeatures} özellik
                              </Badge>
                              <span className="text-xs text-gray-500">
                                %{coverage} kapsama
                              </span>
                            </div>
                          </div>
                          <ChevronRight className="h-5 w-5 text-gray-400" />
                        </div>
                      </CardHeader>
                    </Card>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-full sm:max-w-md">
                    <SheetHeader>
                      <SheetTitle>{competitor.name} Özellikleri</SheetTitle>
                    </SheetHeader>
                    <div className="mt-6 space-y-4">
                      {categories.filter(cat => cat !== 'all').map(category => {
                        const categoryFeatures = features.filter(f => f.category === category);
                        const implementedInCategory = categoryFeatures.filter(f => {
                          const data = getCompetitorFeatureData(competitor.id, f.id);
                          return data.hasFeature;
                        }).length;

                        return (
                          <div key={category} className="space-y-2">
                            <div className="flex items-center justify-between">
                              <h3 className="font-medium text-sm">{category}</h3>
                              <Badge variant="outline" className="text-xs">
                                {implementedInCategory} / {categoryFeatures.length}
                              </Badge>
                            </div>
                            {categoryFeatures.map(feature => {
                              const data = getCompetitorFeatureData(competitor.id, feature.id);
                              return (
                                <div key={feature.id} className="flex items-center justify-between p-2 rounded-lg bg-gray-50">
                                  <span className="text-sm">{feature.name}</span>
                                  {getImplementationIcon(data.implementationQuality)}
                                </div>
                              );
                            })}
                          </div>
                        );
                      })}
                    </div>
                  </SheetContent>
                </Sheet>
              );
            })}
        </div>
      )}

      {/* Feature View */}
      {selectedView === 'feature' && (
        <div className="space-y-2">
          {filteredFeatures.map(feature => {
            const implementingCompetitors = competitors.filter(comp => {
              const data = getCompetitorFeatureData(comp.id, feature.id);
              return data.hasFeature;
            }).length;

            return (
              <Sheet key={feature.id}>
                <SheetTrigger asChild>
                  <Card className="cursor-pointer touch-manipulation">
                    <CardHeader className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-base">{feature.name}</CardTitle>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {feature.category}
                            </Badge>
                            <span className="text-xs text-gray-500">
                              {implementingCompetitors} / {competitors.length} borsa
                            </span>
                          </div>
                        </div>
                        <ChevronRight className="h-5 w-5 text-gray-400" />
                      </div>
                    </CardHeader>
                  </Card>
                </SheetTrigger>
                <SheetContent side="right" className="w-full sm:max-w-md">
                  <SheetHeader>
                    <SheetTitle>{feature.name}</SheetTitle>
                  </SheetHeader>
                  <div className="mt-6 space-y-2">
                    <p className="text-sm text-gray-600 mb-4">{feature.description}</p>
                    <h3 className="font-medium text-sm mb-2">Bu özelliği sunan borsalar:</h3>
                    {competitors.map(competitor => {
                      const data = getCompetitorFeatureData(competitor.id, feature.id);
                      if (!data.hasFeature) return null;

                      return (
                        <div key={competitor.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                          <div className="flex-1">
                            <span className="font-medium text-sm">{competitor.name}</span>
                            {data.notes && (
                              <p className="text-xs text-gray-600 mt-1">{data.notes}</p>
                            )}
                          </div>
                          {getImplementationIcon(data.implementationQuality)}
                        </div>
                      );
                    })}
                  </div>
                </SheetContent>
              </Sheet>
            );
          })}
        </div>
      )}
    </div>
  );
}