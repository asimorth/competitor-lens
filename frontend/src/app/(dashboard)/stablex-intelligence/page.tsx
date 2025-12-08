'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
    Trophy,
    TrendingUp,
    TrendingDown,
    Building2,
    Sparkles,
    Target,
    Zap,
    AlertCircle,
    CheckCircle,
    ArrowUp,
    ArrowDown,
    Minus
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { API_URL } from '@/lib/config';

interface PositioningData {
    coverage: number;
    rank: number;
    totalCompetitors: number;
    trAverage: number;
    globalLeaders: number;
    differenceFromAverage: number;
    differenceFromLeaders: number;
    topCompetitors: Array<{
        name: string;
        coverage: number;
        rank: number;
    }>;
    uniqueFeatures: Array<{
        name: string;
        reason: string;
    }>;
    differentiators: Array<{
        name: string;
        rarity: string;
        competitorCount: number;
    }>;
    positioning: {
        tag: string;
        strengths: string[];
        opportunities: string[];
    };
}

interface GapsData {
    critical: any[];
    highPriority: any[];
    quickWins: any[];
    roadmap: {
        q1: any[];
        q2: any[];
        q3: any[];
    };
}

export default function StablexIntelligencePage() {
    const [positioning, setPositioning] = useState<PositioningData | null>(null);
    const [gaps, setGaps] = useState<GapsData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [posRes, gapsRes] = await Promise.all([
                fetch(`${API_URL}/api/stablex/positioning`).then(r => r.json()),
                fetch(`${API_URL}/api/stablex/gaps`).then(r => r.json())
            ]);

            if (posRes.success) setPositioning(posRes.data);
            if (gapsRes.success) setGaps(gapsRes.data);
        } catch (error) {
            console.error('Veri yükleme hatası:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[600px]">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Yükleniyor...</p>
                </div>
            </div>
        );
    }

    if (!positioning || !gaps) {
        return (
            <div className="text-center py-12">
                <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Veri yüklenemedi</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 md:space-y-8">
            {/* Hero Section - Competitive Positioning */}
            <div className="  bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 rounded-xl md:rounded-2xl p-6 md:p-8 text-white shadow-xl">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                                <Trophy className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl md:text-3xl font-bold">Stablex Rekabet Konumu</h1>
                                <p className="text-blue-100 text-sm md:text-base">{positioning.positioning.tag}</p>
                            </div>
                        </div>
                    </div>

                    {/* Key Metrics Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 md:p-4">
                            <div className="text-3xl md:text-4xl font-bold mb-1">{positioning.coverage}%</div>
                            <div className="text-xs md:text-sm text-blue-100">Kapsama</div>
                        </div>
                        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 md:p-4">
                            <div className="text-3xl md:text-4xl font-bold mb-1">#{positioning.rank}</div>
                            <div className="text-xs md:text-sm text-blue-100">TR Sıralaması</div>
                        </div>
                        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 md:p-4">
                            <div className="text-3xl md:text-4xl font-bold mb-1">{positioning.uniqueFeatures.length}</div>
                            <div className="text-xs md:text-sm text-blue-100">Benzersiz</div>
                        </div>
                        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 md:p-4">
                            <div className="text-3xl md:text-4xl font-bold mb-1">Banka</div>
                            <div className="text-xs md:text-sm text-blue-100">Destekli</div>
                        </div>
                    </div>
                </div>

                {/* Progress Bars */}
                <div className="mt-6 space-y-3">
                    <div>
                        <div className="flex items-center justify-between text-sm mb-1">
                            <span>İlerleme</span>
                            <span className="font-semibold">{positioning.coverage}%</span>
                        </div>
                        <Progress value={positioning.coverage} className="h-2 bg-white/20" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                        <div className="flex items-center justify-between bg-white/10 rounded-lg p-2">
                            <span>TR Ortalaması: {positioning.trAverage}%</span>
                            <Badge className={cn(
                                "ml-2",
                                positioning.differenceFromAverage > 0 ? "bg-green-500" : "bg-red-500"
                            )}>
                                {positioning.differenceFromAverage > 0 ? <ArrowUp className="h-3 w-3 mr-1" /> : <ArrowDown className="h-3 w-3 mr-1" />}
                                {Math.abs(positioning.differenceFromAverage)}pp
                            </Badge>
                        </div>
                        <div className="flex items-center justify-between bg-white/10 rounded-lg p-2">
                            <span>Global Liderler: {positioning.globalLeaders}%</span>
                            <Badge className="ml-2 bg-orange-500">
                                <Minus className="h-3 w-3 mr-1" />
                                {Math.abs(positioning.differenceFromLeaders)}pp açık
                            </Badge>
                        </div>
                    </div>
                </div>
            </div>

            {/* Top Competitors Comparison */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Building2 className="h-5 w-5" />
                        TR Pazarı Top 5 Karşılaştırması
                    </CardTitle>
                    <CardDescription>
                        Stablex'in pazar liderleriyle kıyaslaması
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {positioning.topCompetitors.map((competitor, idx) => {
                            const isStablex = competitor.name === 'Stablex';
                            return (
                                <div key={idx} className={cn(
                                    "p-4 rounded-lg border-2 transition-all",
                                    isStablex ? "border-blue-500 bg-blue-50" : "border-gray-200"
                                )}>
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-3">
                                            <div className={cn(
                                                "w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm",
                                                idx === 0 ? "bg-yellow-400 text-white" :
                                                    idx === 1 ? "bg-gray-300 text-white" :
                                                        idx === 2 ? "bg-amber-600 text-white" :
                                                            "bg-blue-100 text-blue-600"
                                            )}>
                                                {competitor.rank}
                                            </div>
                                            <div>
                                                <p className="font-semibold">{competitor.name}</p>
                                                {isStablex && <Badge className="mt-1 text-xs">Siz</Badge>}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-2xl font-bold text-blue-600">{competitor.coverage}%</p>
                                        </div>
                                    </div>
                                    <Progress value={competitor.coverage} className="h-2" />
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>

            {/* Unique Features & Differentiators */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Unique Features */}
                <Card className="border-green-200 bg-green-50/50">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-green-700">
                            <Sparkles className="h-5 w-5" />
                            Benzersiz Özellikler
                        </CardTitle>
                        <CardDescription>
                            Sadece Stablex'te olan özellikler
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {positioning.uniqueFeatures.length > 0 ? (
                                positioning.uniqueFeatures.map((feature, idx) => (
                                    <div key={idx} className="flex items-start gap-3 p-3 bg-white rounded-lg border border-green-200">
                                        <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                                        <div>
                                            <p className="font-medium text-gray-900">{feature.name}</p>
                                            <p className="text-sm text-gray-600 mt-1">{feature.reason}</p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-gray-600 text-center py-4">
                                    Henüz benzersiz özellik yok
                                </p>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Differentiators */}
                <Card className="border-purple-200 bg-purple-50/50">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-purple-700">
                            <Target className="h-5 w-5" />
                            Farklılaştırıcılar
                        </CardTitle>
                        <CardDescription>
                            Rakiplerde nadir olan özellikler
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {positioning.differentiators.length > 0 ? (
                                positioning.differentiators.map((diff, idx) => (
                                    <div key={idx} className="flex items-start gap-3 p-3 bg-white rounded-lg border border-purple-200">
                                        <Zap className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between">
                                                <p className="font-medium text-gray-900">{diff.name}</p>
                                                <Badge variant="outline" className="text-xs">
                                                    {diff.competitorCount}/{positioning.totalCompetitors} rakipte
                                                </Badge>
                                            </div>
                                            <p className="text-sm text-gray-600 mt-1">
                                                Nadir özellik - rekabet avantajı
                                            </p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-gray-600 text-center py-4">
                                    Henüz farklılaştırıcı yok
                                </p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Strategic Insights */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Strengths */}
                <Card className="border-blue-200 bg-blue-50/50">
                    <CardHeader>
                        <CardTitle className="text-blue-700">✅ Güçlü Yönler</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-2">
                            {positioning.positioning.strengths.map((strength, idx) => (
                                <li key={idx} className="flex items-start gap-2 text-sm">
                                    <CheckCircle className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                                    <span>{strength}</span>
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                </Card>

                {/* Opportunities */}
                <Card className="border-orange-200 bg-orange-50/50">
                    <CardHeader>
                        <CardTitle className="text-orange-700">🎯 Fırsatlar</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-2">
                            {positioning.positioning.opportunities.map((opp, idx) => (
                                <li key={idx} className="flex items-start gap-2 text-sm">
                                    <Target className="h-4 w-4 text-orange-600 flex-shrink-0 mt-0.5" />
                                    <span>{opp}</span>
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                </Card>
            </div>

            {/* Critical Gaps & Quick Wins */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Critical Gaps */}
                <Card className="border-red-200 bg-red-50/50">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-red-700">
                            <AlertCircle className="h-5 w-5" />
                            Kritik Boşluklar ({gaps.critical.length})
                        </CardTitle>
                        <CardDescription>
                            Acil kapatılması gereken özellikler
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {gaps.critical.slice(0, 5).map((gap, idx) => (
                                <div key={idx} className="flex items-center justify-between p-2 bg-white rounded border border-red-200">
                                    <span className="text-sm font-medium">{gap.name}</span>
                                    <Badge variant="destructive" className="text-xs">
                                        {gap.trPenetration}% TR'de
                                    </Badge>
                                </div>
                            ))}
                            {gaps.critical.length === 0 && (
                                <p className="text-sm text-gray-600 text-center py-4">
                                    Kritik boşluk yok 🎉
                                </p>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Quick Wins */}
                <Card className="border-green-200 bg-green-50/50">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-green-700">
                            <Zap className="h-5 w-5" />
                            Hızlı Kazançlar ({gaps.quickWins.length})
                        </CardTitle>
                        <CardDescription>
                            2 hafta içinde eklenebilir
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {gaps.quickWins.slice(0, 5).map((win, idx) => (
                                <div key={idx} className="flex items-center justify-between p-2 bg-white rounded border border-green-200">
                                    <span className="text-sm font-medium">{win.name}</span>
                                    <Badge className="bg-green-600 text-xs">
                                        {win.estimatedDevWeeks} hafta
                                    </Badge>
                                </div>
                            ))}
                            {gaps.quickWins.length === 0 && (
                                <p className="text-sm text-gray-600 text-center py-4">
                                    Hızlı kazanç yok
                                </p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Roadmap */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5" />
                        Önceliklendirilmiş Roadmap
                    </CardTitle>
                    <CardDescription>
                        Çeyreklik hedefler ve beklenen ilerleme
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Q1 */}
                        <div className="border-2 border-blue-300 rounded-lg p-4 bg-blue-50/50">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="font-bold text-blue-700">Q1 2025 (Şimdi)</h3>
                                <Badge className="bg-blue-600">Acil</Badge>
                            </div>
                            <div className="space-y-2">
                                {gaps.roadmap.q1.slice(0, 4).map((item, idx) => (
                                    <div key={idx} className="text-sm p-2 bg-white rounded border border-blue-200">
                                        •{item.name}
                                    </div>
                                ))}
                            </div>
                            <div className="mt-3 pt-3 border-t border-blue-200">
                                <p className="text-sm text-blue-700 font-medium">
                                    Hedef: 20% kapsama 🎯
                                </p>
                            </div>
                        </div>

                        {/* Q2 */}
                        <div className="border-2 border-purple-300 rounded-lg p-4 bg-purple-50/50">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="font-bold text-purple-700">Q2 2025</h3>
                                <Badge className="bg-purple-600">Çekirdek</Badge>
                            </div>
                            <div className="space-y-2">
                                {gaps.roadmap.q2.slice(0, 4).map((item, idx) => (
                                    <div key={idx} className="text-sm p-2 bg-white rounded border border-purple-200">
                                        • {item.name}
                                    </div>
                                ))}
                            </div>
                            <div className="mt-3 pt-3 border-t border-purple-200">
                                <p className="text-sm text-purple-700 font-medium">
                                    Hedef: 30% kapsama 🎯
                                </p>
                            </div>
                        </div>

                        {/* Q3 */}
                        <div className="border-2 border-indigo-300 rounded-lg p-4 bg-indigo-50/50">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="font-bold text-indigo-700">Q3 2025</h3>
                                <Badge className="bg-indigo-600">Ekosistem</Badge>
                            </div>
                            <div className="space-y-2">
                                {gaps.roadmap.q3.slice(0, 4).map((item, idx) => (
                                    <div key={idx} className="text-sm p-2 bg-white rounded border border-indigo-200">
                                        • {item.name}
                                    </div>
                                ))}
                            </div>
                            <div className="mt-3 pt-3 border-t border-indigo-200">
                                <p className="text-sm text-indigo-700 font-medium">
                                    Hedef: 40% kapsama 🎯
                                </p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
