import { Request, Response, NextFunction } from 'express';
import { createError } from '../middleware/errorHandler';
import { ExcelService } from '../services/excelService';
import { prisma } from '../lib/db';
const excelService = new ExcelService();

export const matrixController = {
  // GET /api/matrix
  getMatrix: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const competitors = await prisma.competitor.findMany({
        orderBy: { name: 'asc' },
        include: {
          features: {
            include: {
              feature: true
            }
          }
        }
      });
      
      const features = await prisma.feature.findMany({
        orderBy: { name: 'asc' }
      });
      
      const matrix = await prisma.competitorFeature.findMany({
        include: {
          competitor: true,
          feature: true,
          screenshots: true
        }
      });

      // Create matrix structure
      const matrixData = features.map(feature => {
        const row: any = {
          featureId: feature.id,
          featureName: feature.name,
          category: feature.category,
          priority: feature.priority
        };

        competitors.forEach(competitor => {
          const relation = matrix.find(
            m => m.featureId === feature.id && m.competitorId === competitor.id
          );
          
          row[competitor.id] = {
            hasFeature: relation?.hasFeature || false,
            implementationQuality: relation?.implementationQuality || 'none',
            notes: relation?.notes || '',
            screenshots: relation?.screenshots || []
          };
        });

        return row;
      });

      // Transform competitors to include features array for frontend compatibility
      const competitorsWithFeatures = competitors.map(competitor => ({
        ...competitor,
        features: competitor.features.map(cf => ({
          featureId: cf.featureId,
          hasFeature: cf.hasFeature,
          implementationQuality: cf.implementationQuality,
          notes: cf.notes,
          feature: cf.feature
        }))
      }));

      // Calculate screenshot statistics
      const screenshotsV2 = await prisma.screenshot.findMany({
        where: { isOnboarding: false }
      });
      
      const screenshotsV1 = await prisma.competitorFeatureScreenshot.count();
      
      const orphanScreenshots = screenshotsV2.filter(s => !s.featureId).length;
      
      const totalScreenshots = screenshotsV2.length + screenshotsV1;
      const withFeature = screenshotsV2.filter(s => s.featureId).length + screenshotsV1;

      res.json({
        success: true,
        data: {
          competitors: competitorsWithFeatures,
          features,
          matrix: matrixData
        },
        meta: {
          screenshotStats: {
            total: totalScreenshots,
            withFeature: withFeature,
            orphan: orphanScreenshots,
            missingFiles: 0 // Bu değer sync script tarafından güncellenecek
          },
          syncStatus: {
            lastSync: new Date().toISOString(),
            status: 'synced' as const
          }
        }
      });
    } catch (error) {
      next(error);
    }
  },

  // GET /api/matrix/heatmap
  getHeatmap: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const competitors = await prisma.competitor.findMany();
      const features = await prisma.feature.findMany();
      const matrix = await prisma.competitorFeature.findMany();

      // Quality scoring
      const qualityScore = {
        'excellent': 4,
        'good': 3,
        'basic': 2,
        'none': 1
      };

      const heatmapData = features.map(feature => {
        const row: any = {
          featureId: feature.id,
          featureName: feature.name,
          category: feature.category
        };

        competitors.forEach(competitor => {
          const relation = matrix.find(
            m => m.featureId === feature.id && m.competitorId === competitor.id
          );

          row[competitor.id] = relation?.hasFeature
            ? qualityScore[relation.implementationQuality as keyof typeof qualityScore] || 1
            : 0;
        });

        return row;
      });

      res.json({
        success: true,
        data: {
          competitors,
          features,
          heatmapData
        }
      });
    } catch (error) {
      next(error);
    }
  },

  // PUT /api/matrix/:competitorId/:featureId
  updateCell: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { competitorId, featureId } = req.params;
      const { hasFeature, implementationQuality, notes, screenshots } = req.body;

      const competitorFeature = await prisma.competitorFeature.upsert({
        where: {
          competitorId_featureId: {
            competitorId,
            featureId
          }
        },
        update: {
          hasFeature,
          implementationQuality,
          notes,
          screenshots
        },
        create: {
          competitorId,
          featureId,
          hasFeature,
          implementationQuality,
          notes,
          screenshots
        }
      });

      res.json({
        success: true,
        data: competitorFeature,
        message: 'Matrix cell updated successfully'
      });
    } catch (error) {
      next(error);
    }
  },

  // POST /api/matrix/bulk-update
  bulkUpdate: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { updates } = req.body;

      if (!Array.isArray(updates)) {
        throw createError('Updates must be an array', 400);
      }

      const results = await Promise.all(
        updates.map(async (update: any) => {
          const { competitorId, featureId, hasFeature, implementationQuality, notes } = update;
          
          return prisma.competitorFeature.upsert({
            where: {
              competitorId_featureId: {
                competitorId,
                featureId
              }
            },
            update: {
              hasFeature,
              implementationQuality,
              notes
            },
            create: {
              competitorId,
              featureId,
              hasFeature,
              implementationQuality,
              notes
            }
          });
        })
      );

      res.json({
        success: true,
        data: results,
        message: `${results.length} matrix cells updated successfully`
      });
    } catch (error) {
      next(error);
    }
  },
  
  // GET /api/matrix/export
  exportMatrix: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const competitors = await prisma.competitor.findMany({
        orderBy: { name: 'asc' }
      });
      
      const features = await prisma.feature.findMany({
        orderBy: [
          { category: 'asc' },
          { name: 'asc' }
        ]
      });
      
      const matrix = await prisma.competitorFeature.findMany({
        include: {
          competitor: true,
          feature: true,
          screenshots: true
        }
      });

      // Excel için veri yapısını oluştur
      const excelData: any[] = [];
      
      // Başlık satırı
      const headers = ['Feature', 'Category', 'Priority'];
      competitors.forEach(comp => {
        headers.push(comp.name);
      });
      headers.push('Total Coverage');
      
      // Feature satırları
      features.forEach(feature => {
        const row: any = {
          'Feature': feature.name,
          'Category': feature.category || '',
          'Priority': feature.priority || ''
        };
        
        let hasFeatureCount = 0;
        competitors.forEach(competitor => {
          const relation = matrix.find(
            m => m.featureId === feature.id && m.competitorId === competitor.id
          );
          row[competitor.name] = relation?.hasFeature ? 'Var' : 'Yok';
          if (relation?.hasFeature) hasFeatureCount++;
        });
        
        // Coverage yüzdesi
        row['Total Coverage'] = `${Math.round((hasFeatureCount / competitors.length) * 100)}%`;
        
        excelData.push(row);
      });
      
      // Coverage özet satırı
      const summaryRow: any = {
        'Feature': 'TOTAL COVERAGE',
        'Category': '',
        'Priority': ''
      };
      
      competitors.forEach(competitor => {
        const competitorFeatures = matrix.filter(
          m => m.competitorId === competitor.id && m.hasFeature
        ).length;
        const percentage = Math.round((competitorFeatures / features.length) * 100);
        summaryRow[competitor.name] = `${percentage}%`;
      });
      
      summaryRow['Total Coverage'] = '';
      excelData.push(summaryRow);

      // Excel oluştur
      const result = await excelService.exportToExcel(
        excelData, 
        `feature_matrix_export_${new Date().toISOString().split('T')[0]}.xlsx`
      );

      res.setHeader('Content-Type', result.contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
      res.send(result.buffer);

    } catch (error) {
      next(error);
    }
  }
};
