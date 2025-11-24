#!/usr/bin/env node

/**
 * Railway Production Startup Script - FLEXIBLE VERSION
 * Works with compiled JS or source TS files
 */

const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

console.log('🚀 CompetitorLens Backend - Railway Startup');
console.log('='.repeat(50));

// Environment validation
const requiredEnvVars = ['DATABASE_URL'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  console.error('❌ Missing required environment variables:');
  missingEnvVars.forEach(varName => console.error(`   - ${varName}`));
  console.error('\nPlease set these in Railway dashboard: Settings → Variables');
  process.exit(1);
}

// Log environment info
console.log('\n📊 Environment Info:');
console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'not set'}`);
console.log(`   PORT: ${process.env.PORT || '3001'}`);
console.log(`   DATABASE_URL: ${process.env.DATABASE_URL ? '✅ Set' : '❌ Not set'}`);
console.log(`   DIRECT_DATABASE_URL: ${process.env.DIRECT_DATABASE_URL ? '✅ Set' : '⚠️  Not set (optional)'}`);
console.log(`   S3_BUCKET: ${process.env.S3_BUCKET ? '✅ Set' : '⚠️  Not set (Files will be stored locally)'}`);
console.log(`   CDN_URL: ${process.env.CDN_URL ? '✅ Set' : '⚠️  Not set (S3 URLs will be direct)'}`);

// Create necessary directories
const dirs = ['uploads', 'uploads/screenshots', 'logs'];
dirs.forEach(dir => {
  const dirPath = path.join(__dirname, dir);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`📁 Created directory: ${dir}`);
  }
});

console.log('\n📦 Using pre-generated Prisma Client from node_modules');
console.log('ℹ️  Skipping runtime generation to avoid migration triggers');

// Apply database schema if needed
console.log('\n🔄 Applying database schema...');
const { execSync } = require('child_process');
try {
  execSync('npx prisma db push --skip-generate --accept-data-loss', { 
    stdio: 'inherit',
    cwd: __dirname 
  });
  console.log('✅ Database schema applied');
} catch (error) {
  console.warn('⚠️  DB push failed or skipped:', error.message);
  console.log('   Continuing with server startup...');
}

console.log('\n✅ All checks passed! Starting server...\n');
console.log('='.repeat(50));

// Check what files we have
const distServerPath = path.join(__dirname, 'dist', 'server.js');
const srcServerPath = path.join(__dirname, 'src', 'server.ts');
const hasDistServer = fs.existsSync(distServerPath);
const hasSrcServer = fs.existsSync(srcServerPath);

console.log(`📂 File check:`);
console.log(`   dist/server.js: ${hasDistServer ? '✅ Found' : '❌ Not found'}`);
console.log(`   src/server.ts: ${hasSrcServer ? '✅ Found' : '❌ Not found'}`);

// Start the server with appropriate method
let serverProcess;

if (hasDistServer) {
  console.log('\n🏃 Starting from compiled JavaScript (dist/server.js)...');
  require(distServerPath);
} else if (hasSrcServer) {
  console.log('\n🏃 Starting from TypeScript source (src/server.ts)...');
  console.log('   Using tsx to run TypeScript directly');

  // Check if tsx is available
  const tsxPath = path.join(__dirname, 'node_modules', '.bin', 'tsx');
  if (fs.existsSync(tsxPath)) {
    serverProcess = spawn(tsxPath, ['src/server.ts'], {
      cwd: __dirname,
      stdio: 'inherit',
      env: process.env
    });
  } else {
    // Fallback to npx tsx
    console.log('   tsx not found in node_modules, using npx...');
    serverProcess = spawn('npx', ['tsx', 'src/server.ts'], {
      cwd: __dirname,
      stdio: 'inherit',
      env: process.env
    });
  }

  serverProcess.on('error', (err) => {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  });

  serverProcess.on('exit', (code) => {
    if (code !== 0) {
      console.error(`❌ Server exited with code ${code}`);
      process.exit(code);
    }
  });
} else {
  console.error('❌ No server file found! Neither dist/server.js nor src/server.ts exists.');
  console.error('   Please check the build process.');
  process.exit(1);
}

// Handle process termination
process.on('SIGTERM', () => {
  console.log('📥 SIGTERM signal received');
  if (serverProcess) {
    serverProcess.kill('SIGTERM');
  }
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('📥 SIGINT signal received');
  if (serverProcess) {
    serverProcess.kill('SIGINT');
  }
  process.exit(0);
});