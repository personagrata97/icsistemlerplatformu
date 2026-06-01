"""
Tesseract OCR ile PDF'den Excel'e Dönüştürme
İlk sayfa hariç tüm sayfaları okur ve tablo verilerini Excel'e aktarır.
"""

import os
import sys
import re
from pathlib import Path

try:
    import pytesseract
    from PIL import Image
    import pdf2image
    import pandas as pd
    import openpyxl
    import cv2
    import numpy as np
except ImportError as e:
    print(f"Gerekli kütüphane eksik: {e}")
    print("\nGerekli kütüphaneler yükleniyor...")
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "pytesseract", "Pillow", "pdf2image", "pandas", "openpyxl", "opencv-python-headless", "numpy"])
    import pytesseract
    from PIL import Image
    import pdf2image
    import pandas as pd
    import openpyxl
    import cv2
    import numpy as np

# Tesseract yollarını ayarla (Windows için)
TESSERACT_PATHS = [
    r"C:\Program Files\Tesseract-OCR\tesseract.exe",
    r"C:\Program Files (x86)\Tesseract-OCR\tesseract.exe",
    r"C:\Users\sk36\AppData\Local\Programs\Tesseract-OCR\tesseract.exe",
]

for path in TESSERACT_PATHS:
    if os.path.exists(path):
        pytesseract.pytesseract.tesseract_cmd = path
        print(f"Tesseract bulundu: {path}")
        break
else:
    print("⚠️ UYARI: Tesseract bulunamadı. Lütfen Tesseract OCR'ı yükleyin:")
    print("https://github.com/UB-Mannheim/tesseract/wiki")

def preprocess_image(image):
    """
    Görüntüyü OCR için optimize eder
    """
    # PIL Image'ı numpy array'e dönüştür
    img_array = np.array(image)
    
    # Gri tonlamaya çevir
    if len(img_array.shape) == 3:
        gray = cv2.cvtColor(img_array, cv2.COLOR_RGB2GRAY)
    else:
        gray = img_array
    
    # Gürültü azaltma
    denoised = cv2.fastNlMeansDenoising(gray)
    
    # Kontrast artırma (CLAHE)
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8,8))
    enhanced = clahe.apply(denoised)
    
    # Adaptif eşikleme (threshold) - daha iyi OCR için
    binary = cv2.adaptiveThreshold(
        enhanced, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, 
        cv2.THRESH_BINARY, 11, 2
    )
    
    # Numpy array'i PIL Image'a geri dönüştür
    return Image.fromarray(binary)

def extract_table_data(text):
    """
    OCR metninden tablo verilerini çıkarır ve yapılandırır
    """
    lines = text.split('\n')
    
    # Boş satırları temizle
    lines = [line.strip() for line in lines if line.strip()]
    
    # Tablo verilerini saklamak için liste
    table_data = []
    
    for line in lines:
        # Her satırı boşluklara göre ayır ve temizle
        cells = [cell.strip() for cell in re.split(r'\s{2,}|\t', line) if cell.strip()]
        
        if cells:
            table_data.append(cells)
    
    return table_data

def ocr_pdf_to_excel(pdf_path, output_excel_path, skip_first_page=True):
    """
    PDF'i Tesseract OCR ile okur ve Excel'e dönüştürür
    
    Args:
        pdf_path: PDF dosyasının yolu
        output_excel_path: Çıktı Excel dosyasının yolu
        skip_first_page: İlk sayfayı atla (True/False)
    """
    print(f"\n{'='*60}")
    print(f"PDF: {pdf_path}")
    print(f"Çıktı: {output_excel_path}")
    print(f"İlk sayfa atlanacak: {'Evet' if skip_first_page else 'Hayır'}")
    print(f"{'='*60}\n")
    
    if not os.path.exists(pdf_path):
        raise FileNotFoundError(f"PDF dosyası bulunamadı: {pdf_path}")
    
    # PDF'i görüntülere dönüştür
    print("📄 PDF sayfaları görüntülere dönüştürülüyor...")
    try:
        images = pdf2image.convert_from_path(
            pdf_path,
            dpi=300,  # Yüksek DPI daha iyi OCR sonucu verir
            grayscale=False,
            fmt='png'
        )
    except Exception as e:
        print(f"❌ PDF dönüştürme hatası: {e}")
        print("\nPoppler yüklü değilse, pdf2image çalışmaz.")
        print("Poppler indirmek için: https://github.com/oschwartz10612/poppler-windows/releases/")
        raise
    
    total_pages = len(images)
    print(f"✅ Toplam {total_pages} sayfa bulundu\n")
    
    # İlk sayfayı atla
    start_page = 1 if skip_first_page else 0
    
    all_data = []
    
    # Her sayfayı işle
    for page_num in range(start_page, total_pages):
        print(f"🔍 Sayfa {page_num + 1}/{total_pages} işleniyor...")
        
        # Görüntüyü ön işlemden geçir
        preprocessed_image = preprocess_image(images[page_num])
        
        # Tesseract OCR - Türkçe + İngilizce dil desteği
        # PSM 6: Tek düzenli metin bloğu varsay
        custom_config = r'--oem 3 --psm 6 -l tur+eng'
        
        try:
            # OCR uygula
            text = pytesseract.image_to_string(
                preprocessed_image,
                config=custom_config
            )
            
            if not text.strip():
                print(f"  ⚠️ Uyarı: Sayfa {page_num + 1}'de metin bulunamadı")
                continue
            
            # Tablo verilerini çıkar
            table_data = extract_table_data(text)
            
            if table_data:
                # Her satıra sayfa numarası ekle
                for row in table_data:
                    all_data.append([f"Sayfa {page_num + 1}"] + row)
                print(f"  ✅ {len(table_data)} satır veri çıkarıldı")
            else:
                print(f"  ⚠️ Uyarı: Sayfa {page_num + 1}'de tablo verisi bulunamadı")
                
        except Exception as e:
            print(f"  ❌ Hata: Sayfa {page_num + 1} işlenirken hata: {e}")
            continue
    
    # Excel'e kaydet
    if all_data:
        print(f"\n💾 Veriler Excel'e kaydediliyor...")
        
        # En uzun satırı bul (sütun sayısı için)
        max_cols = max(len(row) for row in all_data)
        
        # Tüm satırları aynı uzunluğa getir
        normalized_data = []
        for row in all_data:
            normalized_row = row + [''] * (max_cols - len(row))
            normalized_data.append(normalized_row)
        
        # DataFrame oluştur
        df = pd.DataFrame(normalized_data)
        
        # Sütun başlıklarını ayarla
        df.columns = [f'Sütun_{i}' for i in range(max_cols)]
        df.columns.values[0] = 'Sayfa'
        
        # Excel'e yaz
        df.to_excel(output_excel_path, index=False, engine='openpyxl')
        
        print(f"✅ Başarıyla kaydedildi: {output_excel_path}")
        print(f"📊 Toplam {len(all_data)} satır, {max_cols} sütun")
        
    else:
        print("\n❌ HATA: Hiç veri çıkarılamadı!")
        return False
    
    return True

def main():
    # PDF yolu
    pdf_path = r"C:\Users\sk36\.gemini\antigravity\scratch\sanction_scanner\downloads\20211224-16.pdf"
    
    # Çıktı Excel yolu
    output_path = r"C:\Users\sk36\.gemini\antigravity\scratch\sanction_scanner\downloads\resmi_gazete_data.xlsx"
    
    try:
        success = ocr_pdf_to_excel(pdf_path, output_path, skip_first_page=True)
        
        if success:
            print(f"\n{'='*60}")
            print("✨ İşlem tamamlandı!")
            print(f"{'='*60}")
        else:
            print(f"\n{'='*60}")
            print("❌ İşlem başarısız!")
            print(f"{'='*60}")
            
    except Exception as e:
        print(f"\n❌ Kritik hata: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
