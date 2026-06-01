# -*- coding: utf-8 -*-
import fitz  # PyMuPDF
import pandas as pd
import re
import sys

# UTF-8 encoding için
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding='utf-8')

def extract_pdf_with_pymupdf():
    """PyMuPDF ile PDF'den tüm metni çıkar"""
    
    pdf_path = r"C:\Users\sk36\.gemini\antigravity\scratch\sanction_scanner\downloads\20211224-16.pdf"
    
    print("=" * 70)
    print("MALVARLIGI DONDURULANLAR - PDF EXTRACTION WITH PyMuPDF")
    print("=" * 70)
    
    print(f"\n>> PDF aciliyor: {pdf_path}")
    
    # PDF'i aç
    doc = fitz.open(pdf_path)
    total_pages = len(doc)
    
    print(f">> Toplam {total_pages} sayfa bulundu\n")
    
    all_text = ""
    
    for page_num in range(total_pages):
        page = doc[page_num]
        text = page.get_text()
        all_text += text + "\n\n--- SAYFA SONU ---\n\n"
        print(f"  - Sayfa {page_num + 1}/{total_pages} okundu ({len(text)} karakter)")
    
    doc.close()
    
    # Tam metni kaydet
    text_file = r"C:\Users\sk36\.gemini\antigravity\scratch\sanction_scanner\pdf_pymupdf_content.txt"
    with open(text_file, 'w', encoding='utf-8') as f:
        f.write(all_text)
    
    print(f"\n[OK] Tam metin kaydedildi: {text_file}")
    print(f"[OK] Toplam karakter: {len(all_text)}")
    
    # Verileri parse et
    print("\n>> Veriler parse ediliyor...")
    records = parse_data(all_text)
    
    if records:
        # Excel'e kaydet
        df = pd.DataFrame(records)
        excel_file = r"C:\Users\sk36\.gemini\antigravity\scratch\sanction_scanner\malvarligi_dondurulanlar_FINAL.xlsx"
        df.to_excel(excel_file, index=False, engine='openpyxl')
        
        print(f"\n[BASARILI] Excel dosyasi olusturuldu: {excel_file}")
        print(f"[BASARILI] Toplam {len(df)} kayit bulundu\n")
        
        # İlk 10 kaydı göster
        print("=" * 70)
        print("ILK 10 KAYIT:")
        print("=" * 70)
        for idx, row in df.head(10).iterrows():
            print(f"\n{idx+1}. {str(row.to_dict())[:150]}...")
        
        print("\n" + "=" * 70)
        return excel_file
    else:
        print("\n[UYARI] Hicbir kayit bulunamadi!")
        print("\n>> Ilk 1000 karakter:")
        print(all_text[:1000])
        return None

def parse_data(text):
    """PDF metninden yapılandırılmış verileri çıkar"""
    
    records = []
    lines = text.split('\n')
    
    current_record = {}
    in_list = False
    
    for i, line in enumerate(lines):
        line = line.strip()
        
        if not line or line == "--- SAYFA SONU ---":
            continue
        
        # Liste başlangıcını tespit et
        if "BÖLÜM" in line or "KISIM" in line or "CETVEL" in line:
            in_list = True
            continue
        
        # Sıra numarası pattern'i (1), 2), 3) vb.)
        num_match = re.match(r'^(\d+)\)', line)
        if num_match:
            # Önceki kaydı kaydet
            if current_record:
                records.append(current_record)
            
            # Yeni kayıt başlat
            current_record = {
                'Sira_No': num_match.group(1),
                'Ham_Veri': line
            }
            continue
        
        # Eğer kayıt varsa, devam eden satırları ekle
        if current_record:
            current_record['Ham_Veri'] = current_record.get('Ham_Veri', '') + ' ' + line
    
    # Son kaydı ekle
    if current_record:
        records.append(current_record)
    
    # Her kayıttan bilgileri çıkar
    for record in records:
        ham_veri = record.get('Ham_Veri', '')
        
        # İsim çıkar (genellikle ilk kısım)
        parts = ham_veri.split()
        if len(parts) >= 2:
            record['Isim'] = ' '.join(parts[1:min(4, len(parts))])
        
        # TC Kimlik No
        tc_match = re.search(r'\b(\d{11})\b', ham_veri)
        if tc_match:
            record['TC_Kimlik_No'] = tc_match.group(1)
        
        # Pasaport No
        passport_match = re.search(r'\b([A-Z]\d{7,9})\b', ham_veri)
        if passport_match:
            record['Pasaport_No'] = passport_match.group(1)
        
        # Doğum tarihi
        date_match = re.search(r'\b(\d{1,2}[/\.]\d{1,2}[/\.]\d{4})\b', ham_veri)
        if date_match:
            record['Dogum_Tarihi'] = date_match.group(1)
        
        # Uyru k
        uyruk_keywords = ['Türkiye', 'Suriye', 'Irak', 'Iran', 'Afganistan']
        for keyword in uyruk_keywords:
            if keyword in ham_veri:
                record['Uyruk'] = keyword
                break
    
    return records

if __name__ == "__main__":
    result = extract_pdf_with_pymupdf()
    
    if result:
        print(f"\n{'=' * 70}")
        print(f"[TAMAMLANDI] Excel dosyasi hazir: {result}")
        print(f"{'=' * 70}")
