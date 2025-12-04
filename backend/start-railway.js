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

// Validate DATABASE_URL format
if (process.env.DATABASE_URL) {
  const dbUrl = process.env.DATABASE_URL;
  if (dbUrl.startsWith('prisma+postgres://')) {
    console.log(`   └─ Using Prisma Accelerate ✨`);
  } else if (dbUrl.startsWith('postgresql://') || dbUrl.startsWith('postgres://')) {
    console.log(`   └─ Using Direct PostgreSQL connection`);
  } else {
    console.warn(`   └─ ⚠️  Unexpected DATABASE_URL format`);
  }
}

console.log(`   DIRECT_DATABASE_URL: ${process.env.DIRECT_DATABASE_URL ? '✅ Set' : '⚠️  Not set (optional)'}`);
console.log(`   S3_BUCKET: ${process.env.S3_BUCKET ? '✅ Set' : '⚠️  Not set (Files will be stored locally)'}`);
console.log(`   CDN_URL: ${process.env.CDN_URL ? '✅ Set' : '⚠️  Not set (S3 URLs will be direct)'}`);
console.log(`   ALLOWED_ORIGINS: ${process.env.ALLOWED_ORIGINS ? '✅ Set' : '⚠️  Not set (CORS may not work properly)'}`);

// Setup persistent storage with Railway Volume
const volumePath = '/app/data/uploads';
const uploadsPath = path.join(__dirname, 'uploads');

// Check if Railway Volume is mounted
if (fs.existsSync(volumePath)) {
  console.log('📦 Railway Volume detected:', volumePath);

  // Remove old uploads directory if it exists
  if (fs.existsSync(uploadsPath)) {
    if (fs.lstatSync(uploadsPath).isSymbolicLink()) {
      fs.unlinkSync(uploadsPath);
      console.log('   🔗 Removed old symlink');
    } else {
      fs.rmSync(uploadsPath, { recursive: true, force: true });
      console.log('   🗑️  Removed ephemeral uploads directory');
    }
  }

  // Create symlink from volume to uploads
  fs.symlinkSync(volumePath, uploadsPath);
  console.log(`   ✅ Volume mounted: ${volumePath} → ${uploadsPath}`);

  // Ensure screenshots subdirectory exists in volume
  const screenshotsDir = path.join(volumePath, 'screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
    console.log('   📁 Created screenshots directory in volume');
  }
} else {
  console.warn('   ⚠️  Railway Volume not found, using ephemeral storage');
  console.warn('   ⚠️  Screenshots will be lost on each deployment!');

  // Fallback: create ephemeral directories
  const dirs = ['uploads', 'uploads/screenshots'];
  dirs.forEach(dir => {
    const dirPath = path.join(__dirname, dir);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
      console.log(`   📁 Created ephemeral directory: ${dir}`);
    }
  });
}

// Always create logs directory
const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
  console.log('📁 Created directory: logs');
}

console.log('\n📦 Using pre-generated Prisma Client from node_modules');

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