// Mock trend data for Phase 3
// Since we don't have historical data, we'll generate plausible trends

export const mockTrendData = {
    // 6 months of coverage data
    coverageHistory: [
        { month: 'Eyl 2024', stablex: 10.5, trAverage: 10.2, leaders: 42 },
        { month: 'Eki 2024', stablex: 11.8, trAverage: 10.5, leaders: 43 },
        { month: 'Kas 2024', stablex: 13.2, trAverage: 10.8, leaders: 43.5 },
        { month: 'Ara 2024', stablex: 14.6, trAverage: 11.2, leaders: 44 },
        { month: 'Oca 2025', stablex: 15.4, trAverage: 11.5, leaders: 44.5 },
        { month: 'Şub 2025', stablex: 16.3, trAverage: 11.7, leaders: 45 }
    ],

    // Category breakdown
    categories: [
        {
            name: 'Erişim & Onboarding',
            stablexCoverage: 60,
            trAverage: 55,
            globalLeaders: 85,
            missingCritical: ['Web App', 'Sign in with Gmail'],
            screenshotCount: 245
        },
        {
            name: 'Trading & İşlemler',
            stablexCoverage: 50,
            trAverage: 55,
            globalLeaders: 85,
            missingCritical: ['Advanced order types', 'Trading bots'],
            screenshotCount: 180
        },
        {
            name: 'Kazanç (Earn)',
            stablexCoverage: 0,
            trAverage: 30,
            globalLeaders: 70,
            missingCritical: ['TRY Nemalandırma', 'Staking', 'Dual Investment'],
            screenshotCount: 85
        },
        {
            name: 'AI & Araçlar',
            stablexCoverage: 0,
            trAverage: 20,
            globalLeaders: 60,
            missingCritical: ['AI Sentiment', 'Price Predictions'],
            screenshotCount: 42
        },
        {
            name: 'Topluluk',
            stablexCoverage: 0,
            trAverage: 25,
            globalLeaders: 55,
            missingCritical: ['Launchpad', 'NFT Marketplace', 'Social Feed'],
            screenshotCount: 68
        }
    ]
};
```
