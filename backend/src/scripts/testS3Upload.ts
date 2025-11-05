/**
 * Test S3 Upload
 * Quick test to verify S3 credentials and upload functionality
 */

import { S3Service } from '../services/s3Service';
import fs from 'fs/promises';
import path from 'path';

async function testS3Upload() {
  console.log('🧪 Testing S3 Upload\n');
  console.log('='.repeat(50));

  // Check environment variables
  const requiredEnvVars = [
    'AWS_ACCESS_KEY_ID',
    'AWS_SECRET_ACCESS_KEY',
    'S3_BUCKET',
    'AWS_REGION'
  ];

  console.log('\n📋 Environment Variables:');
  for (const varName of requiredEnvVars) {
    const value = process.env[varName];
    if (value) {
      console.log(`✅ ${varName}: ${varName.includes('SECRET') ? '***' : value}`);
    } else {
      console.log(`❌ ${varName}: Not set`);
      console.error(`\n❌ Missing required environment variable: ${varName}`);
      process.exit(1);
    }
  }

  // Initialize S3 service
  console.log('\n📦 Initializing S3 Service...');
  const s3Service = new S3Service();

  // Find a test image
  const uploadsDir = path.join(process.cwd(), 'uploads', 'screenshots');
  
  try {
    await fs.access(uploadsDir);
  } catch {
    console.error(`❌ Uploads directory not found: ${uploadsDir}`);
    console.log('\n💡 Tip: Create a test image or adjust the path');
    process.exit(1);
  }

  // Get first available screenshot
  console.log(`\n📁 Scanning: ${uploadsDir}`);
  const competitors = await fs.readdir(uploadsDir, { withFileTypes: true });
  
  let testFile: string | null = null;
  
  for (const competitor of competitors) {
    if (!competitor.isDirectory()) continue;
    
    const competitorDir = path.join(uploadsDir, competitor.name);
    const files = await fs.readdir(competitorDir);
    
    const imageFile = files.find(f => /\.(png|jpg|jpeg)$/i.test(f));
    if (imageFile) {
      testFile = path.join(competitorDir, imageFile);
      break;
    }
  }

  if (!testFile) {
    console.error('❌ No test image found');
    process.exit(1);
  }

  console.log(`✅ Test file: ${path.basename(testFile)}`);

  // Generate S3 key
  const s3Key = s3Service.generateS3Key('Test-Competitor', 'Test-Feature', path.basename(testFile));
  console.log(`\n📤 Uploading to S3...`);
  console.log(`   Key: ${s3Key}`);

  try {
    // Upload
    const url = await s3Service.uploadFile(testFile, s3Key, 'image/png');
    
    console.log(`\n✅ Upload successful!`);
    console.log(`   URL: ${url}`);
    
    // Test if file exists
    console.log(`\n🔍 Verifying upload...`);
    const exists = await s3Service.fileExists(s3Key);
    
    if (exists) {
      console.log(`✅ File verified in S3`);
    } else {
      console.log(`❌ File not found in S3`);
    }

    // Clean up test file
    console.log(`\n🧹 Cleaning up test file...`);
    await s3Service.deleteFile(s3Key);
    console.log(`✅ Test file deleted`);

    console.log('\n' + '='.repeat(50));
    console.log('🎉 S3 Upload Test PASSED!');
    console.log('='.repeat(50));
    console.log('\n✅ Your S3 configuration is working correctly!');
    console.log('✅ Ready to migrate all screenshots');
    console.log('\nNext step: npm run migrate:s3');

  } catch (error) {
    console.error('\n❌ Upload failed:', error);
    console.error('\nPossible causes:');
    console.error('  1. Invalid AWS credentials');
    console.error('  2. Bucket does not exist');
    console.error('  3. Insufficient permissions');
    console.error('  4. Network issue');
    process.exit(1);
  }
}

testS3Upload()
  .catch(console.error);

