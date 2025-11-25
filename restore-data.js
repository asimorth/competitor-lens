const { spawn } = require('child_process');
const fs = require('fs');

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
    console.error('DATABASE_URL is not set');
    process.exit(1);
}

console.log('Restoring data to:', databaseUrl.split('@')[1]); // Log host only for safety

const psql = spawn('psql', [databaseUrl, '-f', 'backend/data_dump.sql'], {
    stdio: 'inherit',
    env: process.env
});

psql.on('close', (code) => {
    if (code === 0) {
        console.log('Data restore completed successfully');
    } else {
        console.error(`Data restore failed with code ${code}`);
        process.exit(code);
    }
});
