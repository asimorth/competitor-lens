import winston from 'winston';
import { Request, Response, NextFunction } from 'express';

// Winston logger configuration
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),
  defaultMeta: { service: 'competitorlens-backend' },
  transports: [
    // Console transport for development
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

// Add file transport in production
if (process.env.NODE_ENV === 'production') {
  logger.add(new winston.transports.File({ 
    filename: 'logs/error.log', 
    level: 'error' 
  }));
  
  logger.add(new winston.transports.File({ 
    filename: 'logs/combined.log' 
  }));
}

// Request logging middleware
export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  
  // Log request
  logger.info({
    type: 'request',
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('user-agent')
  });

  // Log response
  res.on('finish', () => {
    const duration = Date.now() - start;
    
    logger.info({
      type: 'response',
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
      contentLength: res.get('content-length')
    });
    
    // Log slow requests
    if (duration > 1000) {
      logger.warn({
        type: 'slow-request',
        method: req.method,
        url: req.url,
        duration: `${duration}ms`
      });
    }
  });

  next();
}

// Error logging
export function logError(error: Error, req?: Request) {
  logger.error({
    type: 'error',
    message: error.message,
    stack: error.stack,
    ...(req && {
      method: req.method,
      url: req.url,
      ip: req.ip,
      body: req.body,
      params: req.params,
      query: req.query
    })
  });
}

// Performance monitoring
export class PerformanceMonitor {
  private metrics: Map<string, number[]> = new Map();

  recordMetric(name: string, value: number) {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    
    const values = this.metrics.get(name)!;
    values.push(value);
    
    // Keep only last 1000 values
    if (values.length > 1000) {
      values.shift();
    }
  }

  getMetrics(name: string) {
    const values = this.metrics.get(name) || [];
    if (values.length === 0) return null;
    
    const sorted = [...values].sort((a, b) => a - b);
    const sum = values.reduce((a, b) => a + b, 0);
    
    return {
      count: values.length,
      mean: sum / values.length,
      median: sorted[Math.floor(sorted.length / 2)],
      p95: sorted[Math.floor(sorted.length * 0.95)],
      p99: sorted[Math.floor(sorted.length * 0.99)],
      min: sorted[0],
      max: sorted[sorted.length - 1]
    };
  }

  getAllMetrics() {
    const result: Record<string, any> = {};
    
    for (const [name, _] of this.metrics) {
      result[name] = this.getMetrics(name);
    }
    
    return result;
  }
}

export const performanceMonitor = new PerformanceMonitor();

// Database query monitoring
export function monitorDatabaseQuery(queryName: string) {
  return (target: any, propertyName: string, descriptor: PropertyDescriptor) => {
    const method = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
      const start = Date.now();
      
      try {
        const result = await method.apply(this, args);
        const duration = Date.now() - start;
        
        performanceMonitor.recordMetric(`db.${queryName}`, duration);
        
        if (duration > 100) {
          logger.warn({
            type: 'slow-query',
            query: queryName,
            duration: `${duration}ms`
          });
        }
        
        return result;
      } catch (error) {
        const duration = Date.now() - start;
        
        logger.error({
          type: 'query-error',
          query: queryName,
          duration: `${duration}ms`,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        
        throw error;
      }
    };
    
    return descriptor;
  };
}

// Health check data
export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: Date;
  uptime: number;
  version: string;
  checks: {
    database: boolean;
    redis: boolean;
    storage: boolean;
  };
  metrics?: Record<string, any>;
}

// System health monitoring
export async function getHealthStatus(
  checkDatabase: () => Promise<boolean>,
  checkRedis: () => Promise<boolean>,
  checkStorage: () => Promise<boolean>
): Promise<HealthStatus> {
  const [dbHealthy, redisHealthy, storageHealthy] = await Promise.all([
    checkDatabase().catch(() => false),
    checkRedis().catch(() => false),
    checkStorage().catch(() => false)
  ]);

  const allHealthy = dbHealthy && redisHealthy && storageHealthy;
  const anyUnhealthy = !dbHealthy || !redisHealthy || !storageHealthy;

  return {
    status: allHealthy ? 'healthy' : anyUnhealthy ? 'unhealthy' : 'degraded',
    timestamp: new Date(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '2.0.0',
    checks: {
      database: dbHealthy,
      redis: redisHealthy,
      storage: storageHealthy
    },
    metrics: performanceMonitor.getAllMetrics()
  };
}
