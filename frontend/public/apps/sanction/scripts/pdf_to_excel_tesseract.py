"""
Resmi Gazete PDF'ini Tesseract OCR ile okuyup Excel'e çeviren script.
- İlk sayfa atlanır
- Türkçe karakter desteği (tur dil paketi)
- Tablolardaki tüm veriler eksiksiz çekilir
"""

import os
import sys
import re
from pathlib import Path

# Gerekli kütüphaneleri kontrol et ve kur
try:
    import pytesseract
except ImportError:
    os.system('pip install pytesseract')
    import pytesseract

try:
    from pdf2image import convert_from_path
except ImportError:
    os.system('pip install pdf2image')
    from pdf2image import convert_from_path

try:
    import pandas as pd
except ImportError:
    os.system('pip install pandas openpyxl')
    import pandas as pd

try:
    from PIL import Image
except ImportError:
    os.system('pip install Pillow')
    from PIL import Image

try:
    import cv2
    import numpy as np
except ImportError:
    os.system('pip install opencv-python numpy')
    import cv2
    import numpy as np

# Tesseract yolu (Windows)
tesseract_path = r"C:\Program Files\Tesseract-OCR\tesseract.exe"
if os.path.exists(tesseract_path):
    pytesseract.pytesseract.tesseract_cmd = tesseract_path

# Poppler yolu (Windows için gerekli)
poppler_path = r"C:\poppler\Library\bin"
if not os.path.exists(poppler_path):
    poppler_path = r"C:\poppler\bin"
    if not os.path.exists(poppler_path):
        # Kullanıcıdan poppler yolunu al veya PATH'te ara
        poppler_path = None


def preprocess_image(image):
    """
    Görüntüyü OCR için ön işleme tabi tutar.
    - Gri tonlamaya çevir
    - Kontrast artır
    - Gürültü azalt
    - Threshold uygula
    """
    # PIL Image'ı numpy array'e çevir
    img_array = np.array(image)
    
    # Gri tonlamaya çevir
    if len(img_array.shape) == 3:
        gray = cv2.cvtColor(img_array, cv2.COLOR_RGB2GRAY)
    else:
        gray = img_array
    
    # Kontrast artırma (CLAHE)
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    enhanced = clahe.apply(gray)
    
    # Gürültü azaltma
    denoised = cv2.fastNlMeansDenoising(enhanced, None, 10, 7, 21)
    
    # Adaptive threshold
    thresh = cv2.adaptiveThreshold(
        denoised, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 11, 2
    )
    
    # PIL Image'a geri çevir
    return Image.fromarray(thresh)


def extract_table_data(text):
    """
    OCR metninden tablo verilerini çıkarır.
    Resmi Gazete formatına uygun şekilde ayrıştırır.
    """
    lines = text.strip().split('\n')
    data_rows = []
    
    for line in lines:
        line = line.strip()
        if not line:
            continue
        
        # Satırı sütunlara ayır (en az 2 boşluk veya tab ile ayrılmış)
        # Tablo formatını korumak için regex kullan
        parts = re.split(r'\s{2,}|\t+', line)
        parts = [p.strip() for p in parts if p.strip()]
        
        if parts:
            data_rows.append(parts)
    
    return data_rows


def normalize_table_data(all_rows):
    """
    Tüm satırları aynı sütun sayısına normalize eder.
    """
    if not all_rows:
        return []
    
    # Maksimum sütun sayısını bul
    max_cols = max(len(row) for row in all_rows)
    
    # Tüm satırları aynı uzunluğa getir
    normalized = []
    for row in all_rows:
        if len(row) < max_cols:
            row.extend([''] * (max_cols - len(row)))
        normalized.append(row[:max_cols])
    
    return normalized


def process_pdf_to_excel(pdf_path, output_path, skip_first_page=True):
    """
    PDF'i Tesseract OCR ile okuyup Excel'e çevirir.
    """
    print(f"PDF dosyası işleniyor: {pdf_path}")
    
    # PDF'i görüntülere çevir
    print("PDF sayfaları görüntülere dönüştürülüyor...")
    try:
        if poppler_path:
            images = convert_from_path(pdf_path, dpi=300, poppler_path=poppler_path)
        else:
            images = convert_from_path(pdf_path, dpi=300)
    except Exception as e:
        print(f"PDF dönüştürme hatası: {e}")
        print("Poppler kurulu olduğundan emin olun.")
        return False
    
    total_pages = len(images)
    print(f"Toplam {total_pages} sayfa bulundu.")
    
    # İlk sayfayı atla
    start_page = 1 if skip_first_page else 0
    if skip_first_page:
        print("İlk sayfa atlanıyor...")
    
    all_data = []
    
    # Her sayfayı işle
    for page_num in range(start_page, total_pages):
        print(f"\nSayfa {page_num + 1}/{total_pages} işleniyor...")
        
        image = images[page_num]
        
        # Görüntüyü ön işleme tabi tut
        print("  Görüntü ön işleme yapılıyor...")
        processed_image = preprocess_image(image)
        
        # Tesseract ile OCR (Türkçe dil desteği)
        print("  OCR uygulanıyor (Türkçe)...")
        custom_config = r'--oem 3 --psm 6 -l tur'
        
        try:
            text = pytesseract.image_to_string(processed_image, config=custom_config)
        except Exception as e:
            print(f"  OCR hatası: {e}")
            # Türkçe dil paketi yoksa uyarı ver
            if "tur" in str(e).lower():
                print("  UYARI: Türkçe dil paketi bulunamadı. Varsayılan dil kullanılıyor.")
                text = pytesseract.image_to_string(processed_image, config=r'--oem 3 --psm 6')
            else:
                continue
        
        # Metni tablo verilerine çevir
        print("  Tablo verileri çıkarılıyor...")
        table_data = extract_table_data(text)
        
        if table_data:
            print(f"  {len(table_data)} satır veri bulundu.")
            # Sayfa numarasını ekle
            for row in table_data:
                row.insert(0, f"Sayfa {page_num + 1}")
            all_data.extend(table_data)
        else:
            print("  Bu sayfada veri bulunamadı.")
    
    if not all_data:
        print("\nHiç veri çıkarılamadı!")
        return False
    
    # Verileri normalize et
    print(f"\nToplam {len(all_data)} satır veri çıkarıldı.")
    print("Veriler normalize ediliyor...")
    normalized_data = normalize_table_data(all_data)
    
    # DataFrame oluştur ve Excel'e kaydet
    print("Excel dosyası oluşturuluyor...")
    
    # Sütun başlıkları
    num_cols = len(normalized_data[0]) if normalized_data else 0
    columns = ['Sayfa'] + [f'Sütun_{i}' for i in range(1, num_cols)]
    
    df = pd.DataFrame(normalized_data, columns=columns[:num_cols])
    
    # Excel'e kaydet
    df.to_excel(output_path, index=False, engine='openpyxl')
    print(f"\nExcel dosyası kaydedildi: {output_path}")
    print(f"Toplam {len(df)} satır kaydedildi.")
    
    return True


def main():
    # Dosya yolları
    base_dir = Path(__file__).parent.parent
    pdf_path = base_dir / "downloads" / "20211224-16.pdf"
    output_path = base_dir / "downloads" / "resmi_gazete_tesseract.xlsx"
    
    if not pdf_path.exists():
        print(f"PDF dosyası bulunamadı: {pdf_path}")
        return
    
    # Tesseract'ın kurulu olduğunu kontrol et
    try:
        version = pytesseract.get_tesseract_version()
        print(f"Tesseract sürümü: {version}")
    except Exception as e:
        print(f"Tesseract bulunamadı: {e}")
        print("Lütfen Tesseract OCR'ı kurun: https://github.com/UB-Mannheim/tesseract/wiki")
        return
    
    # Türkçe dil paketini kontrol et
    try:
        langs = pytesseract.get_languages()
        print(f"Mevcut diller: {langs}")
        if 'tur' not in langs:
            print("UYARI: Türkçe dil paketi (tur) bulunamadı!")
            print("Tesseract kurulum dizinindeki tessdata klasörüne tur.traineddata dosyasını ekleyin.")
    except Exception as e:
        print(f"Dil kontrolü hatası: {e}")
    
    # PDF'i Excel'e çevir
    success = process_pdf_to_excel(str(pdf_path), str(output_path), skip_first_page=True)
    
    if success:
        print("\n✓ İşlem başarıyla tamamlandı!")
    else:
        print("\n✗ İşlem başarısız!")


if __name__ == "__main__":
    main()
