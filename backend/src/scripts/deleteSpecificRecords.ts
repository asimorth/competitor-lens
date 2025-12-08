import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🗑️  Deleting specific broken records...');

    const idsToDelete = [
        'cc9f3211-6923-4867-8b82-e45a655c2343',
        '1952b800-9d48-4d6a-8f84-f4ed9788c111',
        '91cfb47d-17ba-482c-b200-b940ba09d573',
        '8b59dc6a-1912-4b03-ad3c-69c8f0f93046'
    ];

    console.log('🔍 Checking for record: cc9f3211-6923-4867-8b82-e45a655c2343');

    const record = await prisma.screenshot.findUnique({
        where: { id: 'cc9f3211-6923-4867-8b82-e45a655c2343' }
    });

    if (record) {
        console.log('✅ Record FOUND:', record.fileName);
    } else {
        console.log('❌ Record NOT FOUND in this DB connection');
    }

    const result = await prisma.screenshot.deleteMany({
        where: {
            id: {
                in: idsToDelete
            }
        }
    });

    console.log(`✅ Deleted ${result.count} records.`);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
