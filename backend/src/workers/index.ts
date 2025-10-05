import dotenv from 'dotenv';
import { ScreenshotScanner } from './screenshotScanner';
import { QueueService } from '../services/queueService';

dotenv.config();

console.log('🚀 Starting CompetitorLens v2 Workers...');

// Queue Service'i başlat
const queueService = new QueueService();

// Screenshot Scanner'ı başlat
const scanner = new ScreenshotScanner();

// Graceful shutdown
const shutdown = async (signal: string) => {
  console.log(`\n📛 Received ${signal}, shutting down gracefully...`);
  
  try {
    await scanner.stop();
    await queueService.shutdown();
    console.log('✅ Workers shut down successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

// Unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Worker'ları başlat
async function startWorkers() {
  try {
    console.log('📸 Starting Screenshot Scanner...');
    await scanner.start();
    
    console.log('✅ All workers started successfully');
    console.log('👀 Watching for changes...');
    
    // Status'u periyodik olarak logla
    setInterval(async () => {
      const status = await scanner.getStatus();
      const queueStatuses = await queueService.getAllQueueStatus();
      
      console.log('\n📊 Worker Status:');
      console.log(`Scanner: ${status.isRunning ? '✅ Running' : '❌ Stopped'}`);
      
      queueStatuses.forEach(q => {
        console.log(`Queue ${q.name}: ${q.active} active, ${q.waiting} waiting, ${q.completed} completed`);
      });
    }, 60000); // Her dakika
    
  } catch (error) {
    console.error('❌ Failed to start workers:', error);
    process.exit(1);
  }
}

// Start
startWorkers();
