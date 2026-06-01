"""
Resmi Gazete PDF Parser
PDF'ten malvarlığı dondurma kararlarını çıkarır ve Excel'e yazar
"""

import requests
import pandas as pd
from pathlib import Path
import re
from datetime import datetime

def download_pdf(url, output_path):
    """PDF'i indir"""
    print(f"PDF indiriliyor: {url}")
    response = requests.get(url)
    response.raise_for_status()
    
    with open(output_path, 'wb') as f:
        f.write(response.content)
    print(f"PDF indirildi: {output_path}")
    return output_path

def extract_text_from_pdf(pdf_path):
    """PDF'ten metin çıkar - pdfplumber veya OCR kullanarak"""
    try:
        import pdfplumber
        print("pdfplumber kullanılarak metin çıkarılıyor...")
        
        text = ""
        with pdfplumber.open(pdf_path) as pdf:
            for page_num, page in enumerate(pdf.pages, 1):
                print(f"Sayfa {page_num} işleniyor...")
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
        
        if not text.strip():
            print("pdfplumber metin bulamadı, OCR deneniyor...")
            return extract_with_ocr(pdf_path)
        
        return text
    
    except ImportError:
        print("pdfplumber yüklü değil, OCR kullanılacak...")
        return extract_with_ocr(pdf_path)

def extract_with_ocr(pdf_path):
    """OCR kullanarak PDF'ten metin çıkar"""
    try:
        from pdf2image import convert_from_path
        import pytesseract
        
        print("OCR ile metin çıkarılıyor (bu biraz zaman alabilir)...")
        images = convert_from_path(pdf_path)
        
        text = ""
        for i, image in enumerate(images, 1):
            print(f"OCR - Sayfa {i}/{len(images)}")
            # Türkçe karakterler için 'tur' dili kullan
            page_text = pytesseract.image_to_string(image, lang='tur')
            text += page_text + "\n"
        
        return text
    
    except Exception as e:
        print(f"OCR hatası: {e}")
        return ""

def parse_data(text):
    """
    PDF metninden kişi verilerini çıkar
    Format: Karar No | Ad Soyad | TCKN | Doğum Tarihi | Uyruk | Pasaport No | Dondurulan Malvarlığı
    """
    records = []
    
    # Satırları ayır
    lines = text.split('\n')
    
    current_record = {}
    
    for line in lines:
        line = line.strip()
        if not line:
            continue
        
        # Karar No pattern: 2018/11290 gibi
        karar_match = re.search(r'(\d{4}/\d+)', line)
        
        # TCKN pattern: 11 haneli sayı
        tckn_match = re.search(r'\b(\d{11})\b', line)
        
        # Uyruk pattern: büyük harflerle yazılmış ülke isimleri
        uyruk_pattern = r'\b([A-ZÇĞİÖŞÜ]{3,}(?:\s+[A-ZÇĞİÖŞÜ]{3,})*)\b'
        
        # Basit parsing - satırı parçalara ayır
        parts = line.split()
        
        # Her satırda farklı bilgiler olabilir, akıllı parse yapmaya çalış
        if karar_match:
            # Yeni kayıt başladı
            if current_record:
                records.append(current_record)
            current_record = {
                'Karar No': karar_match.group(1),
                'Ad Soyad': '',
                'TCKN': '',
                'Doğum Tarihi': '',
                'Uyruk': '',
                'Pasaport No': '',
                'Dondurulan Malvarlığı': ''
            }
        
        # TCKN varsa ekle
        if tckn_match and current_record:
            current_record['TCKN'] = tckn_match.group(1)
        
        # Ad soyad - büyük harflerle yazılmış isimler
        name_match = re.findall(r'\b([A-ZÇĞİÖŞÜ]+(?:\s+[A-ZÇĞİÖŞÜ]+)+)\b', line)
        if name_match and current_record:
            # En uzun eşleşmeyi al (genelde tam isim)
            full_name = max(name_match, key=len)
            if len(full_name) > len(current_record.get('Ad Soyad', '')):
                current_record['Ad Soyad'] = full_name
    
    # Son kaydı ekle
    if current_record:
        records.append(current_record)
    
    return records

def smart_parse_table(text):
    """
    Daha akıllı tablo parsing - kolonları tanıyarak
    """
    records = []
    lines = text.split('\n')
    
    # Tablo başlıklarını bul
    header_found = False
    data_lines = []
    
    for line in lines:
        # "Karar No" başlığı varsa tablo başladı
        if 'Karar No' in line or 'KARAR NO' in line:
            header_found = True
            continue
        
        if header_found and line.strip():
            data_lines.append(line.strip())
    
    # Verileri parse et
    for line in data_lines:
        # Karar No ile başlıyorsa yeni kayıt
        karar_match = re.match(r'^(\d{4}/\d+)', line)
        if karar_match:
            # Satırı tablolar gibi parse et
            # Format genelde: KararNo | AdSoyad | TCKN | DoğumTar | Uyruk | PasaportNo | DiğerBilgi
            
            parts = re.split(r'\s{2,}|\t', line)  # 2+ boşluk veya tab ile ayır
            
            record = {
                'Karar No': '',
                'Ad Soyad': '',
                'TCKN': '',
                'Doğum Tarihi': '',
                'Uyruk': '',
                'Pasaport No': '',
                'Dondurulan Malvarlığı': ''
            }
            
            # İlk part karar no
            if len(parts) > 0:
                record['Karar No'] = parts[0]
            
            # TCKN bul (11 haneli)
            tckn_match = re.search(r'\b(\d{11})\b', line)
            if tckn_match:
                record['TCKN'] = tckn_match.group(1)
            
            # İsimleri bul (büyük harfler)
            names = re.findall(r'[A-ZÇĞİÖŞÜ]{2,}(?:\s+[A-ZÇĞİÖŞÜ]{2,})+', line)
            if names:
                record['Ad Soyad'] = names[0]
                if len(names) > 1:
                    record['Uyruk'] = names[1]
            
            # Tarih bul (DD.MM.YYYY veya DD/MM/YYYY)
            date_match = re.search(r'(\d{2}[./]\d{2}[./]\d{4})', line)
            if date_match:
                record['Doğum Tarihi'] = date_match.group(1)
            
            records.append(record)
    
    return records

def main():
    """Ana fonksiyon"""
    # PDF URL
    pdf_url = "https://www.resmigazete.gov.tr/eskiler/2021/12/20211224-16.pdf"
    
    # Çıktı klasörü
    output_dir = Path(__file__).parent.parent / "data" / "resmigazete"
    output_dir.mkdir(parents=True, exist_ok=True)
    
    # PDF indir
    pdf_path = output_dir / "20211224-16.pdf"
    if not pdf_path.exists():
        download_pdf(pdf_url, pdf_path)
    
    # Metin çıkar
    print("\nPDF metni çıkarılıyor...")
    text = extract_text_from_pdf(pdf_path)
    
    # Debug: metni kaydet
    text_output = output_dir / "extracted_text.txt"
    with open(text_output, 'w', encoding='utf-8') as f:
        f.write(text)
    print(f"Çıkarılan metin kaydedildi: {text_output}")
    
    # Verileri parse et
    print("\nVeriler parse ediliyor...")
    records = smart_parse_table(text)
    
    if not records:
        print("Akıllı parse başarısız, basit parse deneniyor...")
        records = parse_data(text)
    
    print(f"\n{len(records)} kayıt bulundu")
    
    # Excel'e yaz
    if records:
        df = pd.DataFrame(records)
        excel_path = output_dir / f"resmigazete_data_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
        df.to_excel(excel_path, index=False, engine='openpyxl')
        print(f"\nExcel dosyası oluşturuldu: {excel_path}")
        
        # İlk 5 kaydı göster
        print("\nİlk 5 kayıt:")
        print(df.head().to_string())
        
        # Zekeriya Öz var mı kontrol et
        zekeriya = df[df['Ad Soyad'].str.contains('ZEKERİYA|ZEKERIYA', case=False, na=False)]
        if not zekeriya.empty:
            print("\n✅ ZEKERİYA ÖZ BULUNDU!")
            print(zekeriya.to_string())
        else:
            print("\n⚠️ Zekeriya Öz bulunamadı - isim farklı formatta olabilir")
            # Tüm isimleri göster
            print("\nTüm isimler:")
            print(df['Ad Soyad'].unique())
    else:
        print("❌ Hiç kayıt bulunamadı!")

if __name__ == "__main__":
    main()
