import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';

const router = Router();
const prisma = new PrismaClient();

// Public API rate limiting
const publicLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 dakika
  max: parseInt(process.env.RATE_LIMIT_PUBLIC || '50'),
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Tüm public endpoint'lere rate limit uygula
router.use(publicLimiter);

// Query validation schemas
const paginationSchema = z.object({
  page: z.string().optional().transform(val => parseInt(val || '1')),
  limit: z.string().optional().transform(val => Math.min(parseInt(val || '20'), 100))
});

const filterSchema = z.object({
  category: z.string().optional(),
  priority: z.string().optional(),
  search: z.string().optional()
});

/**
 * GET /api/public/competitors
 * Tüm competitor'ları listele (public)
 */
router.get('/competitors', async (req, res) => {
  try {
    const competitors = await prisma.competitor.findMany({
      select: {
        id: true,
        name: true,
        logoUrl: true,
        website: true,
        description: true,
        industry: true,
        _count: {
          select: {
            features: true,
            screenshots: true
          }
        }
      },
      orderBy: { name: 'asc' }
    });
    
    res.json({
      count: competitors.length,
      competitors: competitors.map(c => ({
        ...c,
        featureCount: c._count.features,
        screenshotCount: c._count.screenshots,
        _count: undefined
      }))
    });
    
  } catch (error) {
    console.error('Public competitors error:', error);
    res.status(500).json({
      error: 'Failed to get competitors'
    });
  }
});

/**
 * GET /api/public/features
 * Feature listesi (public)
 */
router.get('/features', async (req, res) => {
  try {
    const { category, priority, search } = filterSchema.parse(req.query);
    const { page, limit } = paginationSchema.parse(req.query);
    
    // Where koşulları
    const where: any = {};
    
    if (category) {
      where.category = category;
    }
    
    if (priority) {
      where.priority = priority;
    }
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    const [total, features] = await Promise.all([
      prisma.feature.count({ where }),
      prisma.feature.findMany({
        where,
        select: {
          id: true,
          name: true,
          category: true,
          description: true,
          priority: true,
          _count: {
            select: {
              competitors: {
                where: { hasFeature: true }
              }
            }
          }
        },
        orderBy: [
          { category: 'asc' },
          { name: 'asc' }
        ],
        skip: (page - 1) * limit,
        take: limit
      })
    ]);
    
    // Kategorileri al
    const categories = await prisma.feature.findMany({
      distinct: ['category'],
      select: { category: true },
      where: { category: { not: null } }
    });
    
    res.json({
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      features: features.map(f => ({
        ...f,
        implementedByCount: f._count.competitors,
        _count: undefined
      })),
      categories: categories
        .map(c => c.category)
        .filter(Boolean)
        .sort()
    });
    
  } catch (error) {
    console.error('Public features error:', error);
    res.status(500).json({
      error: 'Failed to get features'
    });
  }
});

/**
 * GET /api/public/matrix
 * Feature matrix (public)
 */
router.get('/matrix', async (req, res) => {
  try {
    // Tüm competitor'ları al
    const competitors = await prisma.competitor.findMany({
      select: {
        id: true,
        name: true,
        logoUrl: true
      },
      orderBy: { name: 'asc' }
    });
    
    // Tüm feature'ları al
    const features = await prisma.feature.findMany({
      select: {
        id: true,
        name: true,
        category: true,
        priority: true
      },
      orderBy: [
        { category: 'asc' },
        { priority: 'asc' },
        { name: 'asc' }
      ]
    });
    
    // CompetitorFeature ilişkilerini al
    const competitorFeatures = await prisma.competitorFeature.findMany({
      where: { hasFeature: true },
      select: {
        competitorId: true,
        featureId: true,
        implementationQuality: true
      }
    });
    
    // Matrix yapısını oluştur
    const matrix: Record<string, Record<string, any>> = {};
    
    competitors.forEach(competitor => {
      matrix[competitor.id] = {};
      features.forEach(feature => {
        const cf = competitorFeatures.find(
          cf => cf.competitorId === competitor.id && cf.featureId === feature.id
        );
        matrix[competitor.id][feature.id] = cf ? {
          hasFeature: true,
          quality: cf.implementationQuality
        } : {
          hasFeature: false,
          quality: null
        };
      });
    });
    
    // Özet istatistikler
    const stats = {
      totalCompetitors: competitors.length,
      totalFeatures: features.length,
      totalImplementations: competitorFeatures.length,
      averageImplementationRate: features.length > 0 
        ? ((competitorFeatures.length / (competitors.length * features.length)) * 100).toFixed(2) + '%'
        : '0%'
    };
    
    res.json({
      competitors,
      features,
      matrix,
      stats,
      generatedAt: new Date()
    });
    
  } catch (error) {
    console.error('Public matrix error:', error);
    res.status(500).json({
      error: 'Failed to get feature matrix'
    });
  }
});

/**
 * GET /api/public/matrix/summary
 * Feature matrix özeti (public)
 */
router.get('/matrix/summary', async (req, res) => {
  try {
    // Competitor başına feature sayısı
    const competitorStats = await prisma.competitor.findMany({
      select: {
        id: true,
        name: true,
        _count: {
          select: {
            features: {
              where: { hasFeature: true }
            }
          }
        }
      },
      orderBy: {
        features: {
          _count: 'desc'
        }
      }
    });
    
    // Feature başına competitor sayısı
    const featureStats = await prisma.feature.findMany({
      select: {
        id: true,
        name: true,
        category: true,
        _count: {
          select: {
            competitors: {
              where: { hasFeature: true }
            }
          }
        }
      },
      orderBy: {
        competitors: {
          _count: 'desc'
        }
      },
      take: 20 // Top 20 features
    });
    
    // Kategori bazlı istatistikler
    const categoryStats = await prisma.feature.groupBy({
      by: ['category'],
      _count: true,
      orderBy: {
        _count: {
          category: 'desc'
        }
      }
    });
    
    res.json({
      competitorRankings: competitorStats.map(c => ({
        id: c.id,
        name: c.name,
        featureCount: c._count.features
      })),
      topFeatures: featureStats.map(f => ({
        id: f.id,
        name: f.name,
        category: f.category,
        implementedByCount: f._count.competitors
      })),
      categoryDistribution: categoryStats.map(c => ({
        category: c.category || 'Uncategorized',
        count: c._count
      }))
    });
    
  } catch (error) {
    console.error('Public matrix summary error:', error);
    res.status(500).json({
      error: 'Failed to get matrix summary'
    });
  }
});

/**
 * GET /api/public/screenshots/:id
 * Tek bir screenshot'ı getir (public)
 */
router.get('/screenshots/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const screenshot = await prisma.screenshot.findUnique({
      where: { id },
      select: {
        id: true,
        fileName: true,
        cdnUrl: true,
        mimeType: true,
        width: true,
        height: true,
        isOnboarding: true,
        competitor: {
          select: {
            id: true,
            name: true
          }
        },
        feature: {
          select: {
            id: true,
            name: true,
            category: true
          }
        },
        createdAt: true
      }
    });
    
    if (!screenshot) {
      return res.status(404).json({ error: 'Screenshot not found' });
    }
    
    // CDN URL yoksa 404
    if (!screenshot.cdnUrl) {
      return res.status(404).json({ 
        error: 'Screenshot not available for public access' 
      });
    }
    
    res.json(screenshot);
    
  } catch (error) {
    console.error('Public screenshot error:', error);
    res.status(500).json({
      error: 'Failed to get screenshot'
    });
  }
});

/**
 * GET /api/public/stats
 * Platform istatistikleri (public)
 */
router.get('/stats', async (req, res) => {
  try {
    const [
      competitorCount,
      featureCount,
      screenshotCount,
      analyzedScreenshotCount,
      implementationCount
    ] = await Promise.all([
      prisma.competitor.count(),
      prisma.feature.count(),
      prisma.screenshot.count({ where: { cdnUrl: { not: null } } }),
      prisma.screenshotAnalysis.count(),
      prisma.competitorFeature.count({ where: { hasFeature: true } })
    ]);
    
    // Son güncelleme
    const lastUpdate = await prisma.screenshot.findFirst({
      where: { cdnUrl: { not: null } },
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true }
    });
    
    res.json({
      competitors: competitorCount,
      features: featureCount,
      screenshots: screenshotCount,
      analyzedScreenshots: analyzedScreenshotCount,
      implementations: implementationCount,
      lastUpdate: lastUpdate?.createdAt || null,
      apiVersion: '2.0.0'
    });
    
  } catch (error) {
    console.error('Public stats error:', error);
    res.status(500).json({
      error: 'Failed to get stats'
    });
  }
});

/**
 * GET /api/public/health
 * API health check (public)
 */
router.get('/health', async (req, res) => {
  try {
    // Database bağlantısını kontrol et
    await prisma.$queryRaw`SELECT 1`;
    
    res.json({
      status: 'healthy',
      timestamp: new Date(),
      version: '2.0.0'
    });
    
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date(),
      error: 'Database connection failed'
    });
  }
});

export default router;
