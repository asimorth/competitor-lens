import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';

// Routes
import competitorRoutes from './routes/competitors';
import featureRoutes from './routes/features';
import matrixRoutes from './routes/matrix';
import uploadRoutes from './routes/uploads';
import analyticsRoutes from './routes/analytics';
import reportRoutes from './routes/reports';
// V2 Routes
import screenshotAnalysisRoutes from './routes/screenshotAnalysis';
import onboardingRoutes from './routes/onboarding';
import syncRoutes from './routes/sync';
import publicRoutes from './routes/public';

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
  
  // Vercel veya localhost ise izin ver
  if (origin && (origin.includes('.vercel.app') || origin.includes('localhost'))) {
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

// Static files - serve screenshots and uploads
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads'), {
  maxAge: '1d',
  setHeaders: (res, path) => {
    if (path.endsWith('.png') || path.endsWith('.jpg') || path.endsWith('.jpeg')) {
      res.setHeader('Cache-Control', 'public, max-age=86400'); // 1 day cache
    }
  }
}));

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    message: 'CompetitorLens Backend API is running!',
    environment: process.env.NODE_ENV 
  });
});

// API Routes
// Static files - serve screenshots and uploads
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads'), {
  maxAge: '1d',
  setHeaders: (res, path) => {
    if (path.endsWith('.png') || path.endsWith('.jpg') || path.endsWith('.jpeg')) {
      res.setHeader('Cache-Control', 'public, max-age=86400'); // 1 day cache
    }
  }
}));

app.use('/api/competitors', competitorRoutes);
app.use('/api/features', featureRoutes);
app.use('/api/matrix', matrixRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/reports', reportRoutes);

// V2 API Routes
app.use('/api/screenshots', screenshotAnalysisRoutes);
app.use('/api/competitors', onboardingRoutes); // Nested under competitors
app.use('/api/sync', syncRoutes);
app.use('/api/public', publicRoutes);

// Error handling
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Route not found',
    path: req.originalUrl 
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`🌐 Railway URL: ${process.env.RAILWAY_PUBLIC_DOMAIN || 'Not set'}`);
});
