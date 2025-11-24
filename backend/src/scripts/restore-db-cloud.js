
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function restore() {
    console.log('🚀 Starting data restoration...');

    const client = new Client({
        connectionString: process.env.DATABASE_URL,
    });

    try {
        await client.connect();
        console.log('✅ Connected to database');

        const dumpPath = path.join(__dirname, '../../..', 'data_dump.sql');
        if (!fs.existsSync(dumpPath)) {
            throw new Error(`Dump file not found at ${dumpPath}`);
        }

        const sql = fs.readFileSync(dumpPath, 'utf8');
        console.log(`📖 Read dump file (${sql.length} bytes)`);

        // Execute the SQL
        await client.query(sql);
        console.log('✅ Data restored successfully!');

    } catch (error) {
        console.error('❌ Restore failed:', error);
        process.exit(1);
    } finally {
        await client.end();
    }
}

restore();
