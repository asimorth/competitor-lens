import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { createError } from '../middleware/errorHandler';
import { ExcelService } from '../services/excelService';
import path from 'path';
import fs from 'fs';
import { getS3Service } from '../services/s3Service';

const prisma = new PrismaClient();
const excelService = new ExcelService();

// ... imports

export const uploadController = {
  // POST /api/uploads/file
  uploadFile: async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.file) {
        throw createError('No file uploaded', 400);
      }

      let storageUrl = `/uploads/${req.file.filename}`;
      const s3Service = getS3Service();

      // Upload to S3 if configured
      if (process.env.S3_BUCKET) {
        try {
          const s3Key = `uploads/${req.file.filename}`;
          storageUrl = await s3Service.uploadFile(req.file.path, s3Key, req.file.mimetype);

          // Delete local file after S3 upload
          fs.unlink(req.file.path, () => { });
        } catch (error) {
          console.error('S3 upload failed, falling back to local:', error);
          // Keep local file as fallback
        }
      }

      const upload = await prisma.upload.create({
        data: {
          filename: req.file.filename,
          originalName: req.file.originalname,
          fileType: req.file.mimetype.includes('image') ? 'image' : 'pdf',
          fileSize: BigInt(req.file.size),
          storageUrl: storageUrl,
          uploadedBy: req.body.userId || null,
          metadata: {
            mimetype: req.file.mimetype,
            size: req.file.size,
            uploadDate: new Date().toISOString()
          }
        }
      });

      res.status(201).json({
        success: true,
        data: upload,
        message: 'File uploaded successfully'
      });
    } catch (error) {
      // Clean up file if database save fails
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlink(req.file.path, () => { });
      }
      next(error);
    }
  },

  // POST /api/uploads/excel
  uploadExcel: async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.file) {
        throw createError('No Excel file uploaded', 400);
      }

      let storageUrl = `/uploads/${req.file.filename}`;
      const s3Service = getS3Service();

      // Upload to S3 if configured
      if (process.env.S3_BUCKET) {
        try {
          const s3Key = `uploads/${req.file.filename}`;
          storageUrl = await s3Service.uploadFile(req.file.path, s3Key, req.file.mimetype);
          // Note: We don't delete the local file yet because excelService needs it
        } catch (error) {
          console.error('S3 upload failed, falling back to local:', error);
        }
      }

      // Save upload record
      const upload = await prisma.upload.create({
        data: {
          filename: req.file.filename,
          originalName: req.file.originalname,
          fileType: 'excel',
          fileSize: BigInt(req.file.size),
          storageUrl: storageUrl,
          uploadedBy: req.body.userId || null,
          metadata: {
            mimetype: req.file.mimetype,
            size: req.file.size,
            uploadDate: new Date().toISOString()
          }
        }
      });

      // Parse and import Excel data
      const importResult = await excelService.parseAndImport(req.file.path);

      // Now we can delete the local file if S3 was used
      if (process.env.S3_BUCKET) {
        fs.unlink(req.file.path, () => { });
      }

      res.status(201).json({
        success: true,
        data: {
          upload,
          importResult
        },
        message: 'Excel file uploaded and processed successfully'
      });
    } catch (error) {
      // Clean up file if processing fails
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlink(req.file.path, () => { });
      }
      next(error);
    }
  },

  // GET /api/uploads/:id
  getFile: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      const upload = await prisma.upload.findUnique({
        where: { id }
      });

      if (!upload) {
        throw createError('File not found', 404);
      }

      res.json({
        success: true,
        data: upload
      });
    } catch (error) {
      next(error);
    }
  },

  // GET /api/uploads
  getAll: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { fileType, limit = '50' } = req.query;

      const uploads = await prisma.upload.findMany({
        where: fileType ? { fileType: fileType as string } : undefined,
        orderBy: { createdAt: 'desc' },
        take: parseInt(limit as string)
      });

      res.json({
        success: true,
        data: uploads,
        count: uploads.length
      });
    } catch (error) {
      next(error);
    }
  },

  // DELETE /api/uploads/:id
  deleteFile: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      const upload = await prisma.upload.findUnique({
        where: { id }
      });

      if (!upload) {
        throw createError('File not found', 404);
      }

      // Delete file from filesystem
      const filePath = path.join(process.env.UPLOAD_DIR || './uploads', upload.filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      // Delete record from database
      await prisma.upload.delete({
        where: { id }
      });

      res.json({
        success: true,
        message: 'File deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }
};
