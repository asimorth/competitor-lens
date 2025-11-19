import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        // 1. Screenshots (Main)
        const localScreenshots = await prisma.screenshot.count({
            where: {
                cdnUrl: null
            }
        });

        // 2. Onboarding Screenshots
        const localOnboarding = await prisma.onboardingScreenshot.count({
            where: {
                cdnUrl: null
            }
        });

        // 3. Uploads (General files)
        // Assuming S3 URLs start with http/https, local ones start with /uploads
        const localUploads = await prisma.upload.count({
            where: {
                storageUrl: {
                    startsWith: '/uploads'
                }
            }
        });

        console.log(JSON.stringify({
            screenshots: localScreenshots,
            onboarding: localOnboarding,
            uploads: localUploads,
            total: localScreenshots + localOnboarding + localUploads
        }, null, 2));

    } catch (error) {
        console.error('Error counting files:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
