import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { Express } from 'express';

export function configureSecurity(app: Express) {
  // Helmet configuration for security headers
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https:"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        imgSrc: ["'self'", "data:", "https:", "blob:"],
        connectSrc: ["'self'", "https:"],
        fontSrc: ["'self'", "https:", "data:"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: false,
  }));

  // CORS configuration
  const corsOptions = {
    origin: (origin: string | undefined, callback: Function) => {
      const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
        'http://localhost:3000',
        'http://localhost:3001'
      ];

      // Allow requests with no origin (e.g., mobile apps, Postman)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    optionsSuccessStatus: 200,
    exposedHeaders: ['Content-Type', 'Content-Length', 'X-Total-Count']
  };

  // Rate limiting configurations
  const createRateLimiter = (windowMs: number, max: number, message: string) => {
    return rateLimit({
      windowMs,
      max,
      message,
      standardHeaders: true,
      legacyHeaders: false,
      handler: (req, res) => {
        res.status(429).json({
          error: 'Too Many Requests',
          message,
          retryAfter: Math.ceil(windowMs / 1000)
        });
      }
    });
  };

  // Different rate limits for different endpoints
  const rateLimits = {
    // General API rate limit
    api: createRateLimiter(
      15 * 60 * 1000, // 15 minutes
      100, // limit each IP to 100 requests per windowMs
      'Too many requests from this IP, please try again later.'
    ),

    // Public API rate limit (more restrictive)
    public: createRateLimiter(
      15 * 60 * 1000, // 15 minutes
      parseInt(process.env.RATE_LIMIT_PUBLIC || '50'),
      'Public API rate limit exceeded. Please try again later.'
    ),

    // Auth endpoints (prevent brute force)
    auth: createRateLimiter(
      15 * 60 * 1000, // 15 minutes
      5, // limit each IP to 5 requests per windowMs
      'Too many authentication attempts, please try again later.'
    ),

    // Upload endpoints
    upload: createRateLimiter(
      60 * 60 * 1000, // 1 hour
      20, // limit each IP to 20 uploads per hour
      'Upload limit exceeded. Please try again later.'
    ),

    // Screenshot analysis endpoints
    analysis: createRateLimiter(
      60 * 60 * 1000, // 1 hour
      50, // limit each IP to 50 analysis requests per hour
      'Analysis rate limit exceeded. Please try again later.'
    )
  };

  return {
    corsOptions,
    rateLimits
  };
}

// Input validation middleware
export function validateInput(schema: any) {
  return (req: any, res: any, next: any) => {
    try {
      const validated = schema.parse(req.body);
      req.body = validated;
      next();
    } catch (error: any) {
      res.status(400).json({
        error: 'Validation Error',
        details: error.errors
      });
    }
  };
}

// SQL Injection prevention helper
export function sanitizeInput(input: string): string {
  // Basic sanitization - Prisma handles most SQL injection prevention
  return input
    .replace(/['"`;\\]/g, '') // Remove quotes and semicolons
    .trim();
}

// XSS prevention helper
export function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
