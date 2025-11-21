import { Request, Response, NextFunction } from 'express';
import { createError } from '../middleware/errorHandler';
import { prisma } from '../lib/db';

export const competitorController = {
  // GET /api/competitors
  getAll: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { region } = req.query;

      // Build where clause
      const where: any = {};
      if (region && typeof region === 'string') {
        where.region = region;
      }

      const competitors = await prisma.competitor.findMany({
        where,
        include: {
          features: {
            include: {
              feature: true,
              screenshots: {
                orderBy: {
                  displayOrder: 'asc'
                }
              }
            }
          },
          _count: {
            select: {
              screenshots: true,
              onboardingScreenshots: true,
              features: {
                where: {
                  hasFeature: true
                }
              }
            }
          }
        },
        orderBy: {
          name: 'asc'
        }
      });

      // Group competitors by region for summary
      const byRegion = competitors.reduce((acc, c) => {
        const reg = c.region || 'Unknown';
        if (!acc[reg]) acc[reg] = [];
        acc[reg].push(c);
        return acc;
      }, {} as Record<string, typeof competitors>);

      res.json({
        success: true,
        data: competitors,
        count: competitors.length,
        meta: {
          byRegion: Object.keys(byRegion).reduce((acc, key) => {
            acc[key] = byRegion[key].length;
            return acc;
          }, {} as Record<string, number>),
          filter: region ? { region } : null
        }
      });
    } catch (error) {
      next(error);
    }
  },

  // GET /api/competitors/:id
  getById: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      const competitor = await prisma.competitor.findUnique({
        where: { id },
        include: {
          features: {
            include: {
              feature: true,
              screenshots: {
                orderBy: {
                  displayOrder: 'asc'
                }
              }
            }
          },
          screenshots: {
            include: {
              feature: {
                select: {
                  id: true,
                  name: true,
                  category: true
                }
              }
            },
            orderBy: [
              { isOnboarding: 'desc' },
              { createdAt: 'desc' }
            ]
          },
          onboardingScreenshots: {
            orderBy: {
              displayOrder: 'asc'
            }
          }
        }
      });

      if (!competitor) {
        throw createError('Competitor not found', 404);
      }

      // Screenshot sayılarını hesapla
      const screenshotStats = {
        total: competitor.screenshots.length,
        byFeature: competitor.screenshots.filter(s => s.featureId !== null).length,
        onboarding: competitor.screenshots.filter(s => s.isOnboarding).length,
        orphan: competitor.screenshots.filter(s => s.featureId === null && !s.isOnboarding).length,
        uncategorized: competitor.screenshots.filter(s => s.featureId === null && !s.isOnboarding).length
      };

      // Feature'larla screenshot ilişkisini kontrol et
      const featuresWithScreenshots = competitor.features.filter(f =>
        f.screenshots.length > 0 ||
        competitor.screenshots.some(s => s.featureId === f.featureId)
      ).length;

      const featuresWithoutScreenshots = competitor.features.filter(f =>
        f.hasFeature &&
        f.screenshots.length === 0 &&
        !competitor.screenshots.some(s => s.featureId === f.featureId)
      ).length;

      res.json({
        success: true,
        data: {
          ...competitor,
          screenshotStats
        },
        meta: {
          featureStats: {
            total: competitor.features.length,
            withScreenshots: featuresWithScreenshots,
            withoutScreenshots: featuresWithoutScreenshots,
            hasFeature: competitor.features.filter(f => f.hasFeature).length
          }
        }
      });
    } catch (error) {
      next(error);
    }
  },

  // POST /api/competitors
  create: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { name, logoUrl, website, description, industry, region } = req.body;

      if (!name) {
        throw createError('Name is required', 400);
      }

      const competitor = await prisma.competitor.create({
        data: {
          name,
          logoUrl,
          website,
          description,
          industry,
          region
        }
      });

      res.status(201).json({
        success: true,
        data: competitor,
        message: 'Competitor created successfully'
      });
    } catch (error) {
      next(error);
    }
  },

  // PUT /api/competitors/:id
  update: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { name, logoUrl, website, description, industry, region } = req.body;

      const competitor = await prisma.competitor.update({
        where: { id },
        data: {
          name,
          logoUrl,
          website,
          description,
          industry,
          region
        }
      });

      res.json({
        success: true,
        data: competitor,
        message: 'Competitor updated successfully'
      });
    } catch (error) {
      if (error.code === 'P2025') {
        next(createError('Competitor not found', 404));
      } else {
        next(error);
      }
    }
  },

  // DELETE /api/competitors/:id
  delete: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      await prisma.competitor.delete({
        where: { id }
      });

      res.json({
        success: true,
        message: 'Competitor deleted successfully'
      });
    } catch (error) {
      if (error.code === 'P2025') {
        next(createError('Competitor not found', 404));
      } else {
        next(error);
      }
    }
  }
};
