import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { createError } from '../middleware/errorHandler';

const prisma = new PrismaClient();

export const reportController = {
  // GET /api/reports
  getAll: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { reportType } = req.query;
      
      const reports = await prisma.report.findMany({
        where: reportType ? { reportType: reportType as string } : undefined,
        orderBy: { createdAt: 'desc' }
      });

      res.json({
        success: true,
        data: reports,
        count: reports.length
      });
    } catch (error) {
      next(error);
    }
  },

  // GET /api/reports/:id
  getById: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      
      const report = await prisma.report.findUnique({
        where: { id }
      });

      if (!report) {
        throw createError('Report not found', 404);
      }

      res.json({
        success: true,
        data: report
      });
    } catch (error) {
      next(error);
    }
  },

  // POST /api/reports
  create: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { title, description, reportType, config } = req.body;

      if (!title || !reportType) {
        throw createError('Title and report type are required', 400);
      }

      const report = await prisma.report.create({
        data: {
          title,
          description,
          reportType,
          config,
          createdBy: req.body.userId || null
        }
      });

      res.status(201).json({
        success: true,
        data: report,
        message: 'Report created successfully'
      });
    } catch (error) {
      next(error);
    }
  },

  // PUT /api/reports/:id
  update: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { title, description, reportType, config } = req.body;

      const report = await prisma.report.update({
        where: { id },
        data: {
          title,
          description,
          reportType,
          config
        }
      });

      res.json({
        success: true,
        data: report,
        message: 'Report updated successfully'
      });
    } catch (error) {
      if (error.code === 'P2025') {
        next(createError('Report not found', 404));
      } else {
        next(error);
      }
    }
  },

  // DELETE /api/reports/:id
  delete: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      await prisma.report.delete({
        where: { id }
      });

      res.json({
        success: true,
        message: 'Report deleted successfully'
      });
    } catch (error) {
      if (error.code === 'P2025') {
        next(createError('Report not found', 404));
      } else {
        next(error);
      }
    }
  },

  // GET /api/reports/:id/export
  export: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { format = 'pdf' } = req.query;
      
      const report = await prisma.report.findUnique({
        where: { id }
      });

      if (!report) {
        throw createError('Report not found', 404);
      }

      // TODO: Implement actual export functionality
      res.json({
        success: true,
        message: `Report export in ${format} format will be implemented`,
        data: {
          reportId: id,
          format,
          downloadUrl: `/api/reports/${id}/download?format=${format}`
        }
      });
    } catch (error) {
      next(error);
    }
  }
};
