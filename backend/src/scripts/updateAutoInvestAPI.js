#!/usr/bin/env node

/**
 * Update Auto-Invest (DCA) via Railway API
 * This script uses the Matrix bulk-update API endpoint
 */

const RAILWAY_API = 'https://competitor-lens-production.up.railway.app';

async function main() {
    console.log('🚀 Updating Auto-Invest (DCA) via Railway API...\n');

    try {
        // Feature ID from production API
        const featureId = '295b9b3e-4b29-43b0-b55d-0078a01fce4e';

        // Get competitors from production
        console.log('📡 Fetching competitors from production...');
        const competitorsRes = await fetch(`${RAILWAY_API}/api/competitors`);
        const competitorsData = await competitorsRes.json();
        const competitors = competitorsData.data || [];

        console.log(`✅ Found ${competitors.length} competitors\n`);

        // Find target competitors
        const revolut = competitors.find(c => c.name === 'Revolut');
        const okxTr = competitors.find(c => c.name === 'OKX TR');
        const coinTr = competitors.find(c => c.name === 'CoinTR');

        if (!revolut || !okxTr || !coinTr) {
            console.log('❌ Missing competitors:');
            console.log('   Revolut:', revolut ? '✅' : '❌');
            console.log('   OKX TR:', okxTr ? '✅' : '❌');
            console.log('   CoinTR:', coinTr ? '✅' : '❌');
            return;
        }

        console.log('🎯 Target competitors found:');
        console.log(`   Revolut: ${revolut.id}`);
        console.log(`   OKX TR: ${okxTr.id}`);
        console.log(`   CoinTR: ${coinTr.id}\n`);

        // Prepare bulk update
        const updates = [
            {
                competitorId: revolut.id,
                featureId,
                hasFeature: true,
                implementationQuality: 'good',
                notes: 'Auto-Invest (DCA) available'
            },
            {
                competitorId: okxTr.id,
                featureId,
                hasFeature: true,
                implementationQuality: 'good',
                notes: 'Auto-Invest (DCA) available'
            },
            {
                competitorId: coinTr.id,
                featureId,
                hasFeature: true,
                implementationQuality: 'good',
                notes: 'Auto-Invest (DCA) available'
            }
        ];

        // Send bulk update
        console.log('📤 Sending bulk update to Railway...');
        const updateRes = await fetch(`${RAILWAY_API}/api/matrix/bulk-update`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ updates })
        });

        const updateData = await updateRes.json();

        if (updateData.success) {
            console.log(`✅ ${updateData.message}\n`);

            // Verify
            console.log('🔍 Verifying update...');
            const featuresRes = await fetch(`${RAILWAY_API}/api/features`);
            const featuresData = await featuresRes.json();
            const autoInvest = featuresData.data?.find(f => f.id === featureId);

            if (autoInvest) {
                const withFeature = autoInvest.competitors?.filter(c => c.hasFeature) || [];
                console.log(`\n📊 Auto-Invest (DCA) now in ${withFeature.length} exchanges:`);
                withFeature.forEach(c => console.log(`   - ${c.competitor.name}`));
            }
        } else {
            console.log('❌ Update failed:', updateData);
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

main();
