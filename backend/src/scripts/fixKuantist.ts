import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const id = 'a13e8c27-586d-4a0c-b4d6-8f25ed08597b';
    console.log(`Updating Kuantist (${id})...`);

    try {
        const result = await prisma.competitor.update({
            where: { id },
            data: { region: 'TR' }
        });
        console.log('✅ Updated:', result);
    } catch (error) {
        console.error('❌ Failed:', error);
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
