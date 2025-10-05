import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';

const excelPath = path.join(process.cwd(), 'Matrix', 'feature_matrix_FINAL_v3.xlsx');

console.log('📊 Analyzing Excel File Structure...\n');
console.log(`File path: ${excelPath}`);

try {
  // Excel dosyasını oku
  const workbook = XLSX.readFile(excelPath);
  
  console.log(`\n📋 Sheets found: ${workbook.SheetNames.length}`);
  workbook.SheetNames.forEach((sheetName, index) => {
    console.log(`   ${index + 1}. ${sheetName}`);
  });

  // Her sheet'i analiz et
  workbook.SheetNames.forEach((sheetName) => {
    console.log(`\n\n=== Sheet: ${sheetName} ===`);
    
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
    
    if (data.length === 0) {
      console.log('⚠️  Empty sheet');
      return;
    }

    console.log(`Rows: ${data.length}`);
    console.log(`Columns: ${data[0]?.length || 0}`);

    // İlk 5 satırı göster (başlıklar dahil)
    console.log('\n📊 First 5 rows:');
    for (let i = 0; i < Math.min(5, data.length); i++) {
      const row = data[i];
      console.log(`\nRow ${i + 1}:`);
      if (row) {
        row.forEach((cell, cellIndex) => {
          if (cell !== undefined && cell !== null && cell !== '') {
            console.log(`   Column ${cellIndex + 1}: ${JSON.stringify(cell)}`);
          }
        });
      }
    }

    // Başlık satırını analiz et
    if (data[0]) {
      console.log('\n🏷️  Headers:');
      data[0].forEach((header, index) => {
        if (header) {
          console.log(`   Column ${index + 1}: ${header}`);
        }
      });
    }

    // Veri türlerini analiz et
    if (data.length > 1) {
      console.log('\n📈 Data Analysis:');
      const columnAnalysis: any = {};
      
      // Her sütun için analiz
      for (let col = 0; col < (data[0]?.length || 0); col++) {
        const columnName = data[0][col] || `Column ${col + 1}`;
        const values = new Set();
        let hasData = false;
        
        for (let row = 1; row < Math.min(20, data.length); row++) {
          const value = data[row]?.[col];
          if (value !== undefined && value !== null && value !== '') {
            values.add(value);
            hasData = true;
          }
        }
        
        if (hasData) {
          columnAnalysis[columnName] = {
            uniqueValues: values.size,
            sampleValues: Array.from(values).slice(0, 5)
          };
        }
      }
      
      Object.entries(columnAnalysis).forEach(([column, analysis]: [string, any]) => {
        console.log(`\n   ${column}:`);
        console.log(`     - Unique values: ${analysis.uniqueValues}`);
        console.log(`     - Sample values: ${JSON.stringify(analysis.sampleValues)}`);
      });
    }

    // Matrix yapısını kontrol et
    if (data.length > 5 && data[0]?.length > 5) {
      console.log('\n🔍 Matrix Structure Detection:');
      
      // İlk sütun feature isimleri mi?
      const firstColumnValues = [];
      for (let i = 1; i < Math.min(10, data.length); i++) {
        if (data[i]?.[0]) {
          firstColumnValues.push(data[i][0]);
        }
      }
      
      console.log(`   First column (possible features): ${JSON.stringify(firstColumnValues.slice(0, 5))}`);
      
      // İlk satır borsa isimleri mi?
      const firstRowValues = [];
      for (let j = 1; j < Math.min(10, data[0].length); j++) {
        if (data[0][j]) {
          firstRowValues.push(data[0][j]);
        }
      }
      
      console.log(`   First row (possible competitors): ${JSON.stringify(firstRowValues.slice(0, 5))}`);
      
      // Matrix değerleri
      console.log('\n   Matrix cell values (sample):');
      for (let i = 1; i < Math.min(4, data.length); i++) {
        for (let j = 1; j < Math.min(4, data[0].length); j++) {
          const value = data[i]?.[j];
          if (value !== undefined && value !== null && value !== '') {
            console.log(`     [${data[i][0]} x ${data[0][j]}] = ${value}`);
          }
        }
      }
    }
  });

  // JSON olarak da kaydet
  const jsonData: any = {};
  workbook.SheetNames.forEach((sheetName) => {
    const worksheet = workbook.Sheets[sheetName];
    jsonData[sheetName] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
  });

  fs.writeFileSync('excel_analysis.json', JSON.stringify(jsonData, null, 2));
  console.log('\n\n✅ Full data saved to excel_analysis.json');

} catch (error) {
  console.error('❌ Error analyzing Excel file:', error);
}
