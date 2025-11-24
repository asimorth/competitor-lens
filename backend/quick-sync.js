const { execSync } = require('child_process');

console.log('🔄 Quick Sync Starting...\n');

try {
  console.log('📝 Step 1: Excel Matrix Import');
  console.log('═'.repeat(50));
  execSync('npx tsx src/scripts/importMatrixFromExcel.ts', { 
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL }
  });
  console.log('\n✅ Excel import completed!\n');
  
  console.log('📸 Step 2: Screenshot to Matrix Sync');
  console.log('═'.repeat(50));
  execSync('npx tsx src/scripts/syncScreenshotsToMatrix.ts', { 
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL }
  });
  console.log('\n✅ Screenshot sync completed!\n');
  
  console.log('📁 Step 3: Local Files Sync');
  console.log('═'.repeat(50));
  execSync('npx tsx src/scripts/syncLocalFiles.ts', { 
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL }
  });
  console.log('\n✅ Local files sync completed!\n');
  
  console.log('🎉 All sync operations completed successfully!');
  
} catch (error) {
  console.error('\n❌ Error during sync:', error.message);
  process.exit(1);
}

