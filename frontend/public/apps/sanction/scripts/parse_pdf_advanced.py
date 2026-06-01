# -*- coding: utf-8 -*-
import pdfplumber
import pandas as pd
import re
import sys

# UTF-8 encoding için
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding='utf-8')

def parse_pdf_to_excel():
    """PDF'den malvarlığı dondurulanların listesini çıkar"""
    
    pdf_path = r"C:\Users\sk36\.gemini\antigravity\scratch\sanction_scanner\downloads\20211224-16.pdf"
    
    print("=" * 60)
    print("PDF PARSING - MALVARLIGI DONDURULANLAR")
    print("=" * 60)
    
    all_text = ""
    all_tables = []
    
    print(f"\n>> PDF aciliyor: {pdf_path}")
    
    with pdfplumber.open(pdf_path) as pdf:
        total_pages = len(pdf.pages)
        print(f">> Toplam {total_pages} sayfa bulundu\n")
        
        for i, page in enumerate(pdf.pages, 1):
            print(f"  - Sayfa {i}/{total_pages} isleniyor...")
            
            # Metni çıkar
            text = page.extract_text()
            if text:
                all_text += text + "\n\n"
            
            # Tabloları çıkar
            tables = page.extract_tables()
            if tables:
                for table in tables:
                    all_tables.append(table)
                print(f"    -> {len(tables)} tablo bulundu")
    
    # Tam metni kaydet
    text_file = r"C:\Users\sk36\.gemini\antigravity\scratch\sanction_scanner\pdf_full_content.txt"
    with open(text_file, 'w', encoding='utf-8') as f:
        f.write(all_text)
    print(f"\n[OK] Tam metin kaydedildi: {text_file}")
    print(f"[OK] Toplam {len(all_tables)} tablo bulundu")
    
    # Metni analiz et
    print("\n>> Malvarligi dondurulanlar aranıyor...")
    
    # Kişi ve kuruluş kayıtlarını bul
    records = []
    
    # Pattern 1: Tablo formatındaysa
    if all_tables:
        print(f"\n>> Tablolar analiz ediliyor ({len(all_tables)} tablo)...")
        for table_idx, table in enumerate(all_tables):
            for row_idx, row in enumerate(table):
                if row and any(cell for cell in row if cell):  # Boş satırları atla
                    record = {
                        'Tablo_No': table_idx + 1,
                        'Satir_No': row_idx + 1,
                        'Veriler': ' | '.join([str(cell) if cell else '' for cell in row])
                    }
                    records.append(record)
    
    # Pattern 2: Metin içinde isme benzer yapılar
    lines = all_text.split('\n')
    person_records = []
    
    for line_idx, line in enumerate(lines):
        line = line.strip()
        if not line or len(line) < 10:
            continue
        
        # Kişi bilgileri pattern'leri (isim, TC, pasaport no, doğum tarihi)
        # Örnek: "Ahmet YILMAZ" veya "John DOE" gibi
        if re.search(r'[A-ZÇĞİÖŞÜ][a-zçğıöşü]+\s+[A-ZÇĞİÖŞÜ]+', line):
            # TC Kimlik No varsa
            tc_match = re.search(r'\b\d{11}\b', line)
            # Pasaport No varsa
            passport_match = re.search(r'\b[A-Z]\d{7,9}\b', line)
            # Doğum tarihi varsa (DD/MM/YYYY veya DD.MM.YYYY)
            date_match = re.search(r'\b\d{2}[/\.]\d{2}[/\.]\d{4}\b', line)
            
            if tc_match or passport_match or date_match:
                person_records.append({
                    'Satir_No': line_idx + 1,
                    'Icerik': line,
                    'TC': tc_match.group() if tc_match else '',
                    'Pasaport': passport_match.group() if passport_match else '',
                    'Dogum_Tarihi': date_match.group() if date_match else ''
                })
    
    print(f"\n[SONUC] {len(records)} tablo satiri bulundu")
    print(f"[SONUC] {len(person_records)} kisi kaydi bulundu")
    
    # Excel'e kaydet - Tablolar
    if records:
        df_tables = pd.DataFrame(records)
        excel_tables = r"C:\Users\sk36\.gemini\antigravity\scratch\sanction_scanner\malvarligi_tablolar.xlsx"
        df_tables.to_excel(excel_tables, index=False, engine='openpyxl')
        print(f"\n[OK] Tablo verileri kaydedildi: {excel_tables}")
        print(f"     Toplam {len(df_tables)} satir")
        
        # İlk 5 satırı göster
        print("\n=== Tablo Verileri - Ilk 5 Satir ===")
        for idx, row in df_tables.head(5).iterrows():
            print(f"{idx+1}. {row['Veriler'][:100]}...")
    
    # Excel'e kaydet - Kişiler
    if person_records:
        df_persons = pd.DataFrame(person_records)
        excel_persons = r"C:\Users\sk36\.gemini\antigravity\scratch\sanction_scanner\malvarligi_kisiler.xlsx"
        df_persons.to_excel(excel_persons, index=False, engine='openpyxl')
        print(f"\n[OK] Kisi verileri kaydedildi: {excel_persons}")
        print(f"     Toplam {len(df_persons)} satir")
        
        # İlk 5 satırı göster
        print("\n=== Kisi Verileri - Ilk 5 Satir ===")
        for idx, row in df_persons.head(5).iterrows():
            print(f"{idx+1}. {row['Icerik'][:100]}...")
    
    if not records and not person_records:
        print("\n[UYARI] Hicbir kayit bulunamadi!")
        print("\n>> Ilk 500 karakter:")
        print(all_text[:500])
    
    print("\n" + "=" * 60)
    print("[TAMAMLANDI]")
    print("=" * 60)
    
    return records, person_records

if __name__ == "__main__":
    parse_pdf_to_excel()
