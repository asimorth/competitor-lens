#!/usr/bin/env node

/**
 * Railway Production Startup Script
 * Handles environment validation and graceful startup
 */

const path = require('path');
const fs = require('fs');

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

// Check if dist directory exists
const distPath = path.join(__dirname, 'dist');
if (!fs.existsSync(distPath)) {
  console.error('❌ dist/ directory not found!');
  console.error('Build may have failed. Check Railway build logs.');
  process.exit(1);
}

// Check if server.js exists
const serverPath = path.join(distPath, 'server.js');
if (!fs.existsSync(serverPath)) {
  console.error('❌ dist/server.js not found!');
  console.error('TypeScript compilation may have failed.');
  process.exit(1);
}

// Log environment info
console.log('\n📊 Environment Info:');
console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'not set'}`);
console.log(`   PORT: ${process.env.PORT || '3001'}`);
console.log(`   DATABASE_URL: ${process.env.DATABASE_URL ? '✅ Set' : '❌ Not set'}`);
console.log(`   DIRECT_DATABASE_URL: ${process.env.DIRECT_DATABASE_URL ? '✅ Set' : '⚠️  Not set (optional)'}`);

// Create necessary directories
const dirs = ['uploads', 'uploads/screenshots', 'logs'];
dirs.forEach(dir => {
  const dirPath = path.join(__dirname, dir);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`📁 Created directory: ${dir}`);
  }
});

// Skip Prisma Client generation - Already in node_modules from build
// Railway DATABASE_URL will be used by @prisma/client automatically
console.log('\n📦 Using pre-generated Prisma Client from node_modules');
console.log('ℹ️  Skipping runtime generation to avoid migration triggers');

console.log('\n✅ All checks passed! Starting server...\n');
console.log('='.repeat(50));

// Important: In production, we use existing database
// NO migration - database schema already exists
console.log('ℹ️  Note: Using existing database schema (no migrations run)');
console.log('');

// Start the server
try {
  require('./dist/server.js');
} catch (error) {
  console.error('\n❌ Failed to start server:');
  console.error(error);
  process.exit(1);
}

