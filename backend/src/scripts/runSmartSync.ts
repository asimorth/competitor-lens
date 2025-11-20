import { exec } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';

const execAsync = promisify(exec);

interface ScriptResult {
  name: string;
  success: boolean;
  duration: number;
  output: string;
  error?: string;
}

/**
 * Smart Sync Master Script
 * 
 * Bu script tüm senkronizasyon işlemlerini sırayla çalıştırır:
 * 1. Excel Matrix Import (düzeltilmiş var/yok kontrolü ile)
 * 2. Screenshot to Matrix Sync
 * 3. Local Files to Database Sync
 */
async function runSmartSync(dryRun: boolean = false) {
  console.log('╔' + '═'.repeat(68) + '╗');
  console.log('║' + ' '.repeat(20) + '🚀 SMART SYNC MASTER' + ' '.repeat(27) + '║');
  console.log('╚' + '═'.repeat(68) + '╝');
  console.log('');
  console.log(`Mode: ${dryRun ? '🔍 DRY RUN' : '✍️  WRITE MODE'}`);
  console.log(`Started: ${new Date().toLocaleString('tr-TR')}`);
  console.log('');
  
  const results: ScriptResult[] = [];
  const startTime = Date.now();
  
  // ============================================
  // 1. Excel Matrix Import
  // ============================================
  console.log('┌' + '─'.repeat(68) + '┐');
  console.log('│ STEP 1/3: Excel Matrix Import                                     │');
  console.log('└' + '─'.repeat(68) + '┘');
  console.log('');
  
  const step1Result = await runScript(
    'importMatrixFromExcel.ts',
    'Excel Matrix Import',
    []
  );
  results.push(step1Result);
  
  if (!step1Result.success) {
    console.error('❌ Step 1 failed. Aborting sync process.');
    printSummary(results, startTime);
    process.exit(1);
  }
  
  console.log('');
  console.log('✅ Step 1 completed successfully!');
  console.log('');
  
  // ============================================
  // 2. Screenshot to Matrix Sync
  // ============================================
  console.log('┌' + '─'.repeat(68) + '┐');
  console.log('│ STEP 2/3: Screenshot to Matrix Sync                               │');
  console.log('└' + '─'.repeat(68) + '┘');
  console.log('');
  
  const step2Result = await runScript(
    'syncScreenshotsToMatrix.ts',
    'Screenshot to Matrix Sync',
    dryRun ? ['--dry-run'] : []
  );
  results.push(step2Result);
  
  if (!step2Result.success) {
    console.error('⚠️  Step 2 failed. Continuing with step 3...');
  } else {
    console.log('');
    console.log('✅ Step 2 completed successfully!');
  }
  console.log('');
  
  // ============================================
  // 3. Local Files Sync
  // ============================================
  console.log('┌' + '─'.repeat(68) + '┐');
  console.log('│ STEP 3/3: Local Files to Database Sync                            │');
  console.log('└' + '─'.repeat(68) + '┘');
  console.log('');
  
  const step3Result = await runScript(
    'syncLocalFiles.ts',
    'Local Files Sync',
    dryRun ? ['--dry-run'] : []
  );
  results.push(step3Result);
  
  if (!step3Result.success) {
    console.error('⚠️  Step 3 failed.');
  } else {
    console.log('');
    console.log('✅ Step 3 completed successfully!');
  }
  console.log('');
  
  // ============================================
  // Final Summary
  // ============================================
  printSummary(results, startTime);
  
  // Exit with error code if any step failed
  const hasErrors = results.some(r => !r.success);
  process.exit(hasErrors ? 1 : 0);
}

async function runScript(
  scriptName: string,
  displayName: string,
  args: string[] = []
): Promise<ScriptResult> {
  const startTime = Date.now();
  
  try {
    const scriptPath = path.join(__dirname, scriptName);
    const argsStr = args.join(' ');
    const command = `tsx ${scriptPath} ${argsStr}`;
    
    console.log(`📝 Running: ${displayName}`);
    console.log(`   Command: ${command}`);
    console.log('');
    
    const { stdout, stderr } = await execAsync(command, {
      cwd: path.join(__dirname, '..', '..'),
      maxBuffer: 10 * 1024 * 1024 // 10MB buffer
    });
    
    const duration = Date.now() - startTime;
    
    // Print output
    if (stdout) {
      console.log(stdout);
    }
    if (stderr) {
      console.error(stderr);
    }
    
    return {
      name: displayName,
      success: true,
      duration,
      output: stdout
    };
    
  } catch (error: any) {
    const duration = Date.now() - startTime;
    
    console.error(`❌ Error running ${displayName}:`);
    console.error(error.message);
    
    if (error.stdout) {
      console.log('\nStdout:', error.stdout);
    }
    if (error.stderr) {
      console.error('\nStderr:', error.stderr);
    }
    
    return {
      name: displayName,
      success: false,
      duration,
      output: error.stdout || '',
      error: error.message
    };
  }
}

function printSummary(results: ScriptResult[], startTime: number) {
  const totalDuration = Date.now() - startTime;
  const successCount = results.filter(r => r.success).length;
  const failCount = results.filter(r => !r.success).length;
  
  console.log('');
  console.log('╔' + '═'.repeat(68) + '╗');
  console.log('║' + ' '.repeat(23) + '📊 SYNC SUMMARY' + ' '.repeat(30) + '║');
  console.log('╚' + '═'.repeat(68) + '╝');
  console.log('');
  console.log(`⏱️  Total Duration: ${(totalDuration / 1000).toFixed(2)}s`);
  console.log(`✅ Successful: ${successCount}/${results.length}`);
  console.log(`❌ Failed: ${failCount}/${results.length}`);
  console.log('');
  
  console.log('Step Details:');
  console.log('─'.repeat(70));
  results.forEach((result, index) => {
    const status = result.success ? '✅' : '❌';
    const duration = (result.duration / 1000).toFixed(2);
    console.log(`${index + 1}. ${status} ${result.name} (${duration}s)`);
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
  });
  console.log('─'.repeat(70));
  console.log('');
  
  if (failCount === 0) {
    console.log('🎉 All sync operations completed successfully!');
  } else {
    console.log('⚠️  Some sync operations failed. Please review the logs above.');
  }
  
  console.log('');
  console.log(`Finished: ${new Date().toLocaleString('tr-TR')}`);
  console.log('');
}

// CLI execution
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run') || args.includes('-d');

console.clear(); // Clear console for better readability
runSmartSync(dryRun).catch(error => {
  console.error('\n💥 Fatal error:', error);
  process.exit(1);
});

