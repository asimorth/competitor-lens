import { Request, Response, NextFunction } from 'express';
import { createError } from '../middleware/errorHandler';
import { prisma } from '../lib/db';

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
  }
};
