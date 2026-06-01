"""
Resmi Gazete PDF'ten veri çıkar ve Excel'e yaz
Tarayıcıdan indirilmiş PDF dosyasından çalışır
"""

import pdfplumber
import pandas as pd
from pathlib import Path
import re
from datetime import datetime

def extract_tables_from_pdf(pdf_path):
    """PDF'ten tabloları çıkar"""
    all_tables = []
    
    print(f"PDF açılıyor: {pdf_path}")
    with pdfplumber.open(pdf_path) as pdf:
        print(f"Toplam {len(pdf.pages)} sayfa bulundu")
        
        for page_num, page in enumerate(pdf.pages, 1):
            print(f"\nSayfa {page_num} işleniyor...")
            
            # Tabloları çıkar
            tables = page.extract_tables()
            if tables:
                print(f"  {len(tables)} tablo bulundu")
                for table_num, table in enumerate(tables, 1):
                    print(f"  Tablo {table_num}: {len(table)} satır")
                    all_tables.append({
                        'page': page_num,
                        'table_num': table_num,
                        'data': table
                    })
            
            # Metin de çıkar
            text = page.extract_text()
            if text:
                print(f"  Metin uzunluğu: {len(text)} karakter")
    
    return all_tables

def process_tables_to_dataframe(tables):
    """Tabloları DataFrame'e çevir"""
    all_records = []
    
    for table_info in tables:
        table = table_info['data']
        page_num = table_info['page']
        
        if not table or len(table) < 2:
            continue
        
        # İlk satır başlık olabilir, kontrol et
        headers = table[0] if table else []
        
        # Satırları işle
        for row_idx, row in enumerate(table[1:], 1):
            if not row or len(row) < 2:
                continue
            
            # Her satırı dictionary olarak kaydet
            record = {}
            
            # Başlık varsa kullan
            if headers:
                for i, header in enumerate(headers):
                    if i < len(row):
                        record[header or f'Column_{i}'] = row[i] or ''
            else:
                # Başlık yoksa kolon numarası kullan
                for i, value in enumerate(row):
                    record[f'Column_{i}'] = value or ''
            
            record['_page'] = page_num
            record['_row'] = row_idx
            all_records.append(record)
    
    return pd.DataFrame(all_records)

def smart_column_mapping(df):
    """Kolonları akıllıca eşleştir"""
    column_map = {}
    
    for col in df.columns:
        col_lower = str(col).lower()
        
        if 'karar' in col_lower or col == 'Column_0':
            column_map[col] = 'Karar No'
        elif 'ad' in col_lower or 'soyad' in col_lower or 'isim' in col_lower or col == 'Column_1':
            column_map[col] = 'Ad Soyad'
        elif 'tc' in col_lower or 'kimlik' in col_lower or col == 'Column_2':
            column_map[col] = 'TCKN'
        elif 'doğum' in col_lower or 'dogum' in col_lower or 'tarih' in col_lower or col == 'Column_3':
            column_map[col] = 'Doğum Tarihi'
        elif 'uyruk' in col_lower or col == 'Column_4':
            column_map[col] = 'Uyruk'
        elif 'pasaport' in col_lower or col == 'Column_5':
            column_map[col] = 'Pasaport No'
        elif 'mal' in col_lower or 'dondu' in col_lower or col == 'Column_6':
            column_map[col] = 'Dondurulan Malvarlığı'
    
    if column_map:
        df = df.rename(columns=column_map)
    
    return df

def main():
    """Ana fonksiyon"""
    # PDF yolu
    pdf_path = Path("C:/Users/sk36/Downloads/20211224-16.pdf")
    
    # İndirme klasöründe yoksa data klasöründe ara
    if not pdf_path.exists():
        pdf_path = Path(__file__).parent.parent / "data" / "resmigazete" / "20211224-16.pdf"
    
    if not pdf_path.exists():
        print("❌ PDF dosyası bulunamadı!")
        print(f"Aranan: {pdf_path}")
        return
    
    print(f"✅ PDF bulundu: {pdf_path}\n")
    
    # Tabloları çıkar
    tables = extract_tables_from_pdf(pdf_path)
    print(f"\n📊 Toplam {len(tables)} tablo çıkarıldı")
    
    if not tables:
        print("❌ Hiç tablo bulunamadı!")
        return
    
    # DataFrame'e çevir
    df = process_tables_to_dataframe(tables)
    print(f"\n✅ {len(df)} satır veri işlendi")
    
    # Kolonları düzenle
    df = smart_column_mapping(df)
    
    # Çıktı klasörü
    output_dir = Path(__file__).parent.parent / "data" / "resmigazete"
    output_dir.mkdir(parents=True, exist_ok=True)
    
    # Excel'e yaz
    excel_path = output_dir / f"resmigazete_data_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
    df.to_excel(excel_path, index=False, engine='openpyxl')
    print(f"\n💾 Excel dosyası oluşturuldu: {excel_path}")
    
    # İlk 10 satırı göster
    print("\n📋 İlk 10 kayıt:")
    print(df.head(10).to_string())
    
    # Zekeriya var mı?
    print("\n🔍 'Zekeriya' araması:")
    zekeriya_rows = df[df.apply(lambda row: row.astype(str).str.contains('Zekeriya|ZEKERİYA|ZEKERIYA', case=False, na=False).any(), axis=1)]
    if not zekeriya_rows.empty:
        print(f"✅ {len(zekeriya_rows)} kayıt bulundu!")
        print(zekeriya_rows.to_string())
    else:
        print("❌ Zekeriya bulunamadı")
    
    print(f"\n📊 Toplam özet:")
    print(f"  - Sayfa sayısı: {df['_page'].max() if '_page' in df.columns else '?'}")
    print(f"  - Toplam kayıt: {len(df)}")
    print(f"  - Kolonlar: {list(df.columns)}")

if __name__ == "__main__":
    main()
