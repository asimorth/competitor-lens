import { Request, Response, NextFunction } from 'express';
import { createError } from '../middleware/errorHandler';
import { prisma } from '../lib/db';
import { getFeatureScreenshotMapper } from '../services/featureScreenshotMapper';

export const featureController = {
  // GET /api/features
  getAll: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { category } = req.query;

      const features = await prisma.feature.findMany({
        where: category ? { category: category as string } : undefined,
        include: {
          competitors: {
            include: {
              competitor: true,
              screenshots: {
                orderBy: {
                  displayOrder: 'asc'
                }
              }
            }
          },
          _count: {
            select: {
              screenshots: true  // Count from Screenshot table (not CompetitorFeature.screenshots)
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      res.json({
        success: true,
        data: features,
        count: features.length
      });
    } catch (error) {
      next(error);
    }
  },

  // GET /api/features/:id
  getById: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      const feature = await prisma.feature.findUnique({
        where: { id },
        include: {
          competitors: {
            include: {
              competitor: true,
              screenshots: {
                orderBy: {
                  displayOrder: 'asc'
                }
              }
            }
          },
          screenshots: {
            include: {
              competitor: {
                select: {
                  id: true,
                  name: true,
                  logoUrl: true
                }
              }
            },
            orderBy: {
              createdAt: 'desc'
            }
          }
        }
      });

      if (!feature) {
        throw createError('Feature not found', 404);
      }

      // Screenshot sayılarını ve implementasyon istatistiklerini hesapla
      const implementingCompetitors = feature.competitors.filter(c => c.hasFeature);
      const screenshotStats = {
        total: feature.screenshots.length,
        byCompetitor: feature.screenshots.reduce((acc: any, s: any) => {
          const compId = s.competitorId;
          acc[compId] = (acc[compId] || 0) + 1;
          return acc;
        }, {})
      };

      const implementationStats = {
        total: feature.competitors.length,
        implemented: implementingCompetitors.length,
        notImplemented: feature.competitors.length - implementingCompetitors.length,
        coverage: feature.competitors.length > 0
          ? Math.round((implementingCompetitors.length / feature.competitors.length) * 100)
          : 0
      };

      res.json({
        success: true,
        data: {
          ...feature,
          screenshotStats,
          implementationStats
        }
      });
    } catch (error) {
      next(error);
    }
  },

  // POST /api/features
  create: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { name, category, description, priority } = req.body;

      if (!name) {
        throw createError('Name is required', 400);
      }

      const feature = await prisma.feature.create({
        data: {
          name,
          category,
          description,
          priority
        }
      });

      res.status(201).json({
        success: true,
        data: feature,
        message: 'Feature created successfully'
      });
    } catch (error) {
      next(error);
    }
  },

  // PUT /api/features/:id
  update: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { name, category, description, priority } = req.body;

      const feature = await prisma.feature.update({
        where: { id },
        data: {
          name,
          category,
          description,
          priority
        }
      });

      res.json({
        success: true,
        data: feature,
        message: 'Feature updated successfully'
      });
    } catch (error) {
      if (error.code === 'P2025') {
        next(createError('Feature not found', 404));
      } else {
        next(error);
      }
    }
  },

  // DELETE /api/features/:id
  delete: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      await prisma.feature.delete({
        where: { id }
      });

      res.json({
        success: true,
        message: 'Feature deleted successfully'
      });
    } catch (error) {
      if (error.code === 'P2025') {
        next(createError('Feature not found', 404));
      } else {
        next(error);
      }
    }
  },

  // GET /api/features/:id/competitors
  getCompetitors: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      const competitors = await prisma.competitorFeature.findMany({
        where: {
          featureId: id,
          hasFeature: true
        },
        include: {
          competitor: true
        }
      });

      res.json({
        success: true,
        data: competitors,
        count: competitors.length
      });
    } catch (error) {
      next(error);
    }
  },

  // GET /api/features/simple
  // Basit feature listesi + screenshot stats
  getSimpleList: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const mapper = getFeatureScreenshotMapper();
      const screenshotStats = await mapper.getAllFeaturesWithScreenshotStats();

      // Feature'ları database'den getir
      const features = await prisma.feature.findMany({
        include: {
          competitors: {
            include: {
              competitor: {
                select: {
                  id: true,
                  name: true,
                  region: true
                }
              }
            }
          }
        }
      });

      // Feature'ları enrich et
      const enrichedFeatures = features.map(feature => {
        const screenshotStat = screenshotStats.find(s => s.featureName === feature.name);
        const trCompetitors = feature.competitors.filter(c => c.competitor.region === 'TR' && c.hasFeature);
        const globalCompetitors = feature.competitors.filter(c => c.competitor.region === 'Global' && c.hasFeature);

        return {
          id: feature.id,
          name: feature.name,
          category: feature.category,
          description: feature.description,
          trCoverage: trCompetitors.length,
          globalCoverage: globalCompetitors.length,
          screenshotCount: screenshotStat?.totalScreenshots || 0,
          hasScreenshots: (screenshotStat?.totalScreenshots || 0) > 0
        };
      });

      res.json({
        success: true,
        data: enrichedFeatures,
        count: enrichedFeatures.length
      });
    } catch (error) {
      console.error('Simple list error:', error);
      next(error);
    }
  },

  // GET /api/features/:id/detail
  // Feature detayı + screenshot'lar + coverage (DATABASE'den)
  getDetailedById: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { region } = req.query; // Optional: TR, Global

      const feature = await prisma.feature.findUnique({
        where: { id }
      });

      if (!feature) {
        throw createError('Feature not found', 404);
      }

      // Screenshot'ları DATABASE'den getir
      const whereClause: any = {
        featureId: id
      };

      // Region filter
      if (region && typeof region === 'string') {
        whereClause.competitor = {
          region: region
        };
      }

      const screenshots = await prisma.screenshot.findMany({
        where: whereClause,
        include: {
          competitor: {
            select: {
              id: true,
              name: true,
              region: true,
              logoUrl: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      // Competitor bazında grupla
      const competitorMap = new Map<string, any>();

      for (const screenshot of screenshots) {
        const compId = screenshot.competitorId;

        if (!competitorMap.has(compId)) {
          competitorMap.set(compId, {
            id: screenshot.competitor.id,
            name: screenshot.competitor.name,
            region: screenshot.competitor.region,
            logoUrl: screenshot.competitor.logoUrl,
            screenshots: [],
            screenshotCount: 0
          });
        }

        const comp = competitorMap.get(compId);

        // Normalize path: strip /app/ prefix if present
        let cleanPath = screenshot.filePath;
        if (cleanPath.startsWith('/app/')) {
          cleanPath = cleanPath.substring(5); // Remove '/app/'
        }
        // Ensure no leading slash
        if (cleanPath.startsWith('/')) {
          cleanPath = cleanPath.substring(1);
        }

        comp.screenshots.push({
          url: `https://competitor-lens-production.up.railway.app/${cleanPath}`,
          thumbnailUrl: `https://competitor-lens-production.up.railway.app/${cleanPath}`,
          path: screenshot.filePath,
          caption: screenshot.fileName
        });
        comp.screenshotCount++;
      }

      const competitors = Array.from(competitorMap.values());

      // Coverage hesapla
      const allCompetitors = await prisma.competitor.findMany({
        select: { id: true, region: true }
      });

      const trTotal = allCompetitors.filter(c => c.region === 'TR').length;
      const globalTotal = allCompetitors.filter(c => c.region === 'Global').length;

      const trCompetitors = competitors.filter(c => c.region === 'TR').length;
      const globalCompetitors = competitors.filter(c => c.region === 'Global').length;

      const coverageStats = {
        tr: trCompetitors,
        trTotal,
        global: globalCompetitors,
        globalTotal,
        total: competitors.length
      };

      // Screenshot stats by region
      const screenshotStats = {
        total: screenshots.length,
        byRegion: {
          TR: screenshots.filter(s => s.competitor.region === 'TR').length,
          Global: screenshots.filter(s => s.competitor.region === 'Global').length
        }
      };

      res.json({
        success: true,
        data: {
          feature: {
            id: feature.id,
            name: feature.name,
            category: feature.category,
            description: feature.description
          },
          coverage: coverageStats,
          competitors,
          screenshotStats
        }
      });
    } catch (error) {
      console.error('Detailed feature error:', error);
      next(error);
    }
  }
};
