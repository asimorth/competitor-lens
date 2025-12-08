import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🔧 Fixing KYC screenshot feature assignments...');

    // 1. Get User Onboarding feature ID
    const userOnboarding = await prisma.feature.findFirst({
        where: {
            OR: [
                { name: 'User Onboarding' },
                { name: { contains: 'Onboarding', mode: 'insensitive' } }
            ]
        }
    });

    if (!userOnboarding) {
        console.error('❌ User Onboarding feature not found!');
        return;
    }

    console.log(`✅ Found User Onboarding feature: ${userOnboarding.id}`);

    // 2. Find all screenshots with "KYC" in filePath
    const kycScreenshots = await prisma.screenshot.findMany({
        where: {
            filePath: {
                contains: '/KYC/',
                mode: 'insensitive'
            }
        },
        include: {
            competitor: true,
            feature: true
        }
    });

    console.log(`📊 Found ${kycScreenshots.length} KYC screenshots`);

    // 3. Update those that are NOT assigned to User Onboarding
    let updated = 0;
    for (const screenshot of kycScreenshots) {
        if (screenshot.featureId !== userOnboarding.id) {
            await prisma.screenshot.update({
                where: { id: screenshot.id },
                data: { featureId: userOnboarding.id }
            });
            console.log(`   ✓ Updated: ${screenshot.competitor.name} - ${screenshot.fileName}`);
            updated++;
        }
    }

    console.log(`\n✅ Updated ${updated} screenshots to User Onboarding feature`);
    console.log(`📌 ${kycScreenshots.length - updated} already correctly assigned`);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
