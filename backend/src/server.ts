import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// BigInt serialization fix
(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

// Routes
import competitorRoutes from './routes/competitors';
import featureRoutes from './routes/features';
import matrixRoutes from './routes/matrix';
import uploadRoutes from './routes/uploads';
import analyticsRoutes from './routes/analytics';
import reportRoutes from './routes/reports';
// V2 Routes
import screenshotAnalysisRoutes from './routes/screenshotAnalysis';
import screenshotRoutes from './routes/screenshots';
import screenshotFixRoutes from './routes/screenshotFix';
import s3SyncRoutes from './routes/s3Sync';
import s3RebuildRoutes from './routes/s3Rebuild';
import featureAssignmentRoutes from './routes/featureAssignment';
import stablexIntelligenceRoutes from './routes/stablexIntelligence';
import onboardingRoutes from './routes/onboarding';
import syncRoutes from './routes/sync';
import publicRoutes from './routes/public';
// Phase 0 & 1 Routes
import dataQualityRoutes from './routes/dataQuality';
import bulkUploadRoutes from './routes/bulkUpload';

// Middleware
import { errorHandler } from './middleware/errorHandler';

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '3001', 10);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable CSP for development
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
// CORS Middleware - Manuel header ekleme
app.use((req, res, next) => {
  const origin = req.headers.origin;

  // Vercel, Railway veya localhost ise izin ver
  if (origin && (
    origin.includes('.vercel.app') ||
    origin.includes('.railway.app') ||
    origin.includes('localhost')
  )) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.setHeader('Access-Control-Expose-Headers', 'Content-Type,Content-Length');
  }

  // OPTIONS preflight request
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }

  next();
});

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Smart screenshot serving - fallback to fileName search if path doesn't exist
app.use('/uploads/screenshots', async (req, res, next) => {
  const requestedPath = path.join(process.cwd(), 'uploads', 'screenshots', req.path);

  try {
    // Try exact path first
    await fs.promises.access(requestedPath);
    next(); // File exists, let express.static handle it
  } catch {
    // File not found at exact path - search by fileName
    const fileName = path.basename(req.path);

    // Search recursively in screenshots directory
    async function findFile(dir: string): Promise<string | null> {
      const items = await fs.promises.readdir(dir, { withFileTypes: true });
      for (const item of items) {
        const fullPath = path.join(dir, item.name);
        if (item.isDirectory()) {
          const found = await findFile(fullPath);
          if (found) return found;
        } else if (item.name === fileName) {
          return fullPath;
        }
      }
      return null;
    }

    try {
      const screenshotsDir = path.join(process.cwd(), 'uploads', 'screenshots');
      const foundPath = await findFile(screenshotsDir);

      if (foundPath) {
        // File found! Serve it
        res.sendFile(foundPath);
      } else {
        next(); // Not found, continue to 404
      }
    } catch (error) {
      next(error);
    }
  }
});

// Static file serving
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads'), {
  maxAge: '1d',
  etag: true
}));

// Health check with database test
app.get('/health', async (req, res) => {
  const healthCheck = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    message: 'CompetitorLens Backend API is running!',
    environment: process.env.NODE_ENV,
    database: 'unknown' as string
  };

  // Test database connection
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    await prisma.$queryRaw`SELECT 1`;
    await prisma.$disconnect();
    healthCheck.database = 'connected';
  } catch (error) {
    healthCheck.database = 'disconnected';
    healthCheck.status = 'degraded';
  }

  const statusCode = healthCheck.status === 'ok' ? 200 : 503;
  res.status(statusCode).json(healthCheck);
});

// Debug endpoint
app.get('/debug/env', (req, res) => {
  res.json({
    env: process.env.NODE_ENV,
    cwd: process.cwd(),
    uploadsPath: path.join(process.cwd(), 'uploads')
  });
});

app.get('/debug/files', async (req, res) => {
  try {
    const fs = require('fs/promises');
    const uploadsPath = path.join(process.cwd(), 'uploads');
    const files = await fs.readdir(uploadsPath, { recursive: true });
    res.json({ path: uploadsPath, files: files.slice(0, 50) }); // Limit to 50
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// API Routes
app.use('/api/screenshots', screenshotRoutes);
app.use('/api/screenshots', screenshotFixRoutes);
app.use('/api/screenshots', s3SyncRoutes);
app.use('/api/screenshots', s3RebuildRoutes);
app.use('/api/screenshots', featureAssignmentRoutes);
app.use('/api/onboarding', onboardingRoutes);
app.use('/api/sync', syncRoutes);
app.use('/api/bulk-upload', bulkUploadRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/stablex', stablexIntelligenceRoutes);
app.use('/api/reports', reportRoutes);

// V2 API Routes
app.use('/api/competitors', competitorRoutes);
app.use('/api/features', featureRoutes);
app.use('/api/matrix', matrixRoutes);
app.use('/api/screenshots', screenshotAnalysisRoutes); // Analysis endpoints
app.use('/api/competitors', onboardingRoutes); // Nested under competitors
app.use('/api/sync', syncRoutes);
app.use('/api/public', publicRoutes);

// Phase 0: Data Quality Routes
app.use('/api/data-quality', dataQualityRoutes);

// Error handling
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl
  });
});

// Temporary Restore Endpoint
app.post('/api/admin/restore', async (req, res) => {
  const secret = req.headers['x-admin-secret'];
  if (secret !== process.env.JWT_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const mode = req.query.mode || 'data'; // 'schema' or 'data'

  console.log(`🚀 Starting restoration (${mode}) via API...`);

  try {
    if (mode === 'schema') {
      const { exec } = require('child_process');
      const util = require('util');
      const execAsync = util.promisify(exec);

      // Run prisma db push
      // We use the local node_modules binary to be safe
      const prismaCmd = './node_modules/.bin/prisma db push --schema=prisma/schema.prisma --accept-data-loss';
      console.log('Running:', prismaCmd);

      const { stdout, stderr } = await execAsync(prismaCmd, { cwd: process.cwd() });
      console.log('Schema Push Output:', stdout);
      if (stderr) console.error('Schema Push Error:', stderr);

      return res.json({ success: true, message: 'Schema pushed successfully', output: stdout });
    }

    // Data Restore Mode
    const { Client } = require('pg');
    const fs = require('fs');
    // path is already imported

    const client = new Client({
      connectionString: process.env.DATABASE_URL,
    });

    await client.connect();

    const dumpPath = path.join(process.cwd(), 'data_dump.sql');

    if (!fs.existsSync(dumpPath)) {
      throw new Error(`Dump file not found at ${dumpPath}`);
    }

    const sql = fs.readFileSync(dumpPath, 'utf8');
    await client.query(sql);
    await client.end();

    console.log('✅ Data restored successfully via API');
    res.json({ success: true, message: 'Data restored successfully' });
  } catch (error) {
    console.error('❌ Restore failed:', error);
    res.status(500).json({ error: error.message, stack: error.stack });
  }
});

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`🌐 Railway URL: ${process.env.RAILWAY_PUBLIC_DOMAIN || 'Not set'}`);
  console.log(`✅ Server ready to accept connections`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('📥 SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('✅ HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('📥 SIGINT signal received: closing HTTP server');
  server.close(() => {
    console.log('✅ HTTP server closed');
    process.exit(0);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});
