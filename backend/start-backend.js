#!/usr/bin/env node
const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting CompetitorLens Backend...');

// Start the server with tsx
const serverPath = path.join(__dirname, 'src', 'server.ts');
const child = spawn('npx', ['tsx', serverPath], {
  env: {
    ...process.env,
    NODE_ENV: 'production',
    PORT: '3001'
  },
  stdio: 'inherit'
});

child.on('error', (error) => {
  console.error('Failed to start backend:', error);
  process.exit(1);
});

child.on('exit', (code) => {
  console.log(`Backend exited with code ${code}`);
  process.exit(code || 0);
});
