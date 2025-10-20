import { Request, Response, NextFunction } from 'express';
import { createError } from '../middleware/errorHandler';
import { prisma } from '../lib/db';

export const competitorController = {
  // GET /api/competitors
  getAll: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const competitors = await prisma.competitor.findMany({
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
          }
        },
        orderBy: {
          name: 'asc'
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
          }
        }
      });

      if (!competitor) {
        throw createError('Competitor not found', 404);
      }

      res.json({
        success: true,
        data: competitor
      });
    } catch (error) {
      next(error);
    }
  },

  // POST /api/competitors
  create: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { name, logoUrl, website, description, industry } = req.body;

      if (!name) {
        throw createError('Name is required', 400);
      }

      const competitor = await prisma.competitor.create({
        data: {
          name,
          logoUrl,
          website,
          description,
          industry
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
      const { name, logoUrl, website, description, industry } = req.body;

      const competitor = await prisma.competitor.update({
        where: { id },
        data: {
          name,
          logoUrl,
          website,
          description,
          industry
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
