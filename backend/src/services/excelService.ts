import * as XLSX from 'xlsx';
import { prisma } from '../lib/db';

export class ExcelService {
  async parseAndImport(filePath: string) {
    try {
      // Excel dosyasını oku
      const workbook = XLSX.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      
      // JSON'a çevir
      const data = XLSX.utils.sheet_to_json(worksheet);
      
      if (!data || data.length === 0) {
        throw new Error('Excel file is empty or invalid');
      }

      let importedCount = 0;
      let errorCount = 0;
      const errors: string[] = [];

      // Veritabanına kaydet
      for (const row of data) {
        try {
          const rowData = row as any;
          
          // Gerekli alanları kontrol et
          if (!rowData.competitorName || !rowData.featureName) {
            errors.push(`Row ${importedCount + errorCount + 1}: Missing competitor name or feature name`);
            errorCount++;
            continue;
          }

          // Rakip varsa getir, yoksa oluştur
          const competitor = await prisma.competitor.upsert({
            where: { name: rowData.competitorName },
            update: {
              website: rowData.website || undefined,
              description: rowData.description || undefined,
              industry: rowData.industry || undefined
            },
            create: {
              name: rowData.competitorName,
              website: rowData.website || undefined,
              description: rowData.description || undefined,
              industry: rowData.industry || undefined
            }
          });
          
          // Feature varsa getir, yoksa oluştur
          const feature = await prisma.feature.upsert({
            where: { name: rowData.featureName },
            update: {
              category: rowData.category || undefined,
              description: rowData.featureDescription || undefined,
              priority: rowData.priority || undefined
            },
            create: {
              name: rowData.featureName,
              category: rowData.category || undefined,
              description: rowData.featureDescription || undefined,
              priority: rowData.priority || undefined
            }
          });
          
          // İlişkiyi oluştur/güncelle
          await prisma.competitorFeature.upsert({
            where: {
              competitorId_featureId: {
                competitorId: competitor.id,
                featureId: feature.id
              }
            },
            update: {
              hasFeature: this.parseBoolean(rowData.hasFeature),
              implementationQuality: rowData.quality || rowData.implementationQuality || 'none',
              notes: rowData.notes || undefined
            },
            create: {
              competitorId: competitor.id,
              featureId: feature.id,
              hasFeature: this.parseBoolean(rowData.hasFeature),
              implementationQuality: rowData.quality || rowData.implementationQuality || 'none',
              notes: rowData.notes || undefined
            }
          });

          importedCount++;
        } catch (error) {
          errors.push(`Row ${importedCount + errorCount + 1}: ${error.message}`);
          errorCount++;
        }
      }
      
      return {
        success: true,
        imported: importedCount,
        errors: errorCount,
        errorDetails: errors,
        totalRows: data.length
      };
    } catch (error) {
      throw new Error(`Excel parsing failed: ${error.message}`);
    }
  }

  private parseBoolean(value: any): boolean {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') {
      const lowerValue = value.toLowerCase().trim();
      return lowerValue === 'yes' || lowerValue === 'true' || lowerValue === '1' || lowerValue === 'var';
    }
    if (typeof value === 'number') {
      return value === 1;
    }
    return false;
  }

  async exportToExcel(data: any[], filename: string = 'export.xlsx') {
    try {
      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
      
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      
      return {
        success: true,
        buffer,
        filename,
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      };
    } catch (error) {
      throw new Error(`Excel export failed: ${error.message}`);
    }
  }
}
