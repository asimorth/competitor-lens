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
    ],

    // ROI estimates for common features
    roiData: {
        'Web App': {
            devWeeks: 6,
            cost: 500000,
            userAcquisition: 2500,
            revenueImpact: 150000,
            paybackMonths: 3.3,
            roi12Months: 300,
            confidence: 'high',
            basis: '11 TR competitors with web app'
        },
        'TRY Nemalandırma': {
            devWeeks: 8,
            cost: 650000,
            userAcquisition: 3500,
            revenueImpact: 200000,
            paybackMonths: 3.25,
            roi12Months: 350,
            confidence: 'high',
            basis: 'OKX TR data + bank partnership leverage'
        },
        'Public API': {
            devWeeks: 4,
            cost: 350000,
            userAcquisition: 500,
            revenueImpact: 80000,
            paybackMonths: 4.4,
            roi12Months: 250,
            confidence: 'medium',
            basis: '7 TR competitors with public API'
        },
        'Sign in with Gmail': {
            devWeeks: 1,
            cost: 50000,
            userAcquisition: 2000,
            revenueImpact: 60000,
            paybackMonths: 0.8,
            roi12Months: 1400,
            confidence: 'high',
            basis: 'Industry standard, low friction onboarding'
        },
        'Launchpad': {
            devWeeks: 12,
            cost: 900000,
            userAcquisition: 5000,
            revenueImpact: 250000,
            paybackMonths: 3.6,
            roi12Months: 320,
            confidence: 'medium',
            basis: '5 TR competitors with launchpad'
        }
    }
};
