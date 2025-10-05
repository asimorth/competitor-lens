#!/usr/bin/env python3
"""
Excel dosyasını analiz eder ve içeriğini gösterir
"""

import pandas as pd
import sys
import os

def analyze_excel(file_path):
    """Excel dosyasını analiz eder"""
    
    if not os.path.exists(file_path):
        print(f"❌ Dosya bulunamadı: {file_path}")
        return
    
    try:
        print(f"📊 Excel dosyası analiz ediliyor: {os.path.basename(file_path)}")
        print("=" * 60)
        
        # Excel dosyasını oku
        excel_file = pd.ExcelFile(file_path)
        
        print(f"📋 Sayfa sayısı: {len(excel_file.sheet_names)}")
        print(f"📄 Sayfa adları: {', '.join(excel_file.sheet_names)}")
        print()
        
        # Her sayfayı analiz et
        for sheet_name in excel_file.sheet_names:
            print(f"📑 Sayfa: {sheet_name}")
            print("-" * 40)
            
            df = pd.read_excel(file_path, sheet_name=sheet_name)
            
            print(f"   📏 Boyut: {df.shape[0]} satır × {df.shape[1]} sütun")
            print(f"   📝 Sütunlar: {', '.join(df.columns.tolist())}")
            
            # İlk 3 satırı göster
            if len(df) > 0:
                print(f"   👀 İlk 3 satır:")
                for i, row in df.head(3).iterrows():
                    print(f"      Satır {i+1}: {dict(row)}")
            
            print()
        
        # İlk sayfayı CSV olarak kaydet
        if len(excel_file.sheet_names) > 0:
            first_sheet = excel_file.sheet_names[0]
            df_first = pd.read_excel(file_path, sheet_name=first_sheet)
            
            # CSV dosya adı oluştur
            base_name = os.path.splitext(os.path.basename(file_path))[0]
            csv_path = f"/Users/Furkan/Stablex/competitor-lens/sample-data/excel/{base_name}_converted.csv"
            
            df_first.to_csv(csv_path, index=False, encoding='utf-8')
            print(f"✅ CSV olarak kaydedildi: {csv_path}")
            
            # Platform için uygun format kontrolü
            print("\n🔍 Platform Uyumluluğu Kontrolü:")
            print("-" * 40)
            
            required_columns = [
                'competitorName', 'featureName', 'category', 'hasFeature', 
                'quality', 'implementationQuality', 'notes'
            ]
            
            missing_columns = []
            for col in required_columns:
                if col not in df_first.columns:
                    missing_columns.append(col)
            
            if missing_columns:
                print(f"⚠️  Eksik sütunlar: {', '.join(missing_columns)}")
                print("💡 Bu sütunları ekleyerek platformda kullanabilirsiniz")
            else:
                print("✅ Tüm gerekli sütunlar mevcut!")
            
            # Veri örnekleri
            print(f"\n📊 Veri Örnekleri:")
            print("-" * 40)
            
            if 'competitorName' in df_first.columns:
                unique_competitors = df_first['competitorName'].unique()
                print(f"🏢 Borsalar ({len(unique_competitors)}): {', '.join(unique_competitors[:5])}{'...' if len(unique_competitors) > 5 else ''}")
            
            if 'featureName' in df_first.columns:
                unique_features = df_first['featureName'].unique()
                print(f"⚡ Feature'lar ({len(unique_features)}): {', '.join(unique_features[:5])}{'...' if len(unique_features) > 5 else ''}")
            
            if 'category' in df_first.columns:
                unique_categories = df_first['category'].unique()
                print(f"📂 Kategoriler ({len(unique_categories)}): {', '.join(unique_categories)}")
            
    except Exception as e:
        print(f"❌ Hata: {str(e)}")
        print("💡 pandas kütüphanesi kurulu mu? pip install pandas openpyxl")

if __name__ == "__main__":
    file_path = "/Users/Furkan/Stablex/competitor-lens/sample-data/excel/feature_matrix_FINAL_v3 (2).xlsx"
    analyze_excel(file_path)
