import pytesseract
from pdf2image import convert_from_path
import pandas as pd
import os
import cv2
import numpy as np
import io

# Tesseract path configuration (User might need to update this if not in PATH)
# pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'

def preprocess_image(image):
    # Convert to openCV format
    img = np.array(image)
    # Convert to grayscale
    gray = cv2.cvtColor(img, cv2.COLOR_RGB2GRAY)
    # Apply thresholding
    _, thresh = cv2.threshold(gray, 150, 255, cv2.THRESH_BINARY)
    return thresh

def process_custom_layout(text):
    """
    Resmi Gazete layout parsing logic.
    This assumes a specific structure often found in these documents.
    We need to handle multi-column or strictly tabular data.
    """
    lines = text.split('\n')
    data = []
    for line in lines:
        if not line.strip():
            continue
        # Basic parsing logic - needs to be adapted based on actual PDF content
        # For now, just splitting by sufficient whitespace might work for simple tables
        # But 'Resmi Gazete' often has complex layouts. 
        # We will try to preserve rows.
        row_data = [item.strip() for item in line.split('  ') if item.strip()]
        if row_data:
            data.append(row_data)
    return data

def main():
    pdf_path = os.path.join("downloads", "20211224-16.pdf")
    output_excel = "output.xlsx"
    
    if not os.path.exists(pdf_path):
        print(f"Hata: Dosya bulunamadı: {pdf_path}")
        return

    print("PDF sayfaları dönüştürülüyor...")
    try:
        # Convert pages to images, skip first page (first_page=2 means start from page 2)
        # Note: Thread count can be increased for speed
        images = convert_from_path(pdf_path, first_page=2)
    except Exception as e:
        print(f"PDF dönüştürme hatası (Poppler kurulu mu?): {e}")
        return

    all_data = []

    print(f"Toplam {len(images)} sayfa işlenecek (İlk sayfa hariç).")

    for i, image in enumerate(images):
        print(f"Sayfa {i+2} işleniyor...")
        
        # Preprocess
        processed_img = preprocess_image(image)
        
        # OCR
        # psm 6: Assume a single uniform block of text. Good for tabular data if structure is consistent.
        custom_config = r'--oem 3 --psm 6 -l tur' 
        try:
            text = pytesseract.image_to_string(processed_img, config=custom_config)
            
            # Simple parsing for now - just raw lines to debug the structure
            # We want to put this into Excel. 
            # If we want columns, we need smarter parsing.
            # Let's try `image_to_data` for more granular control if needed, 
            # but for now let's dump the text lines into rows.
            
            page_data = process_custom_layout(text)
            all_data.extend(page_data)
            
        except Exception as e:
            print(f"OCR Hatası Sayfa {i+2}: {e}")

    if all_data:
        # Normalize row lengths for DataFrame
        max_cols = max(len(row) for row in all_data)
        normalized_data = [row + [''] * (max_cols - len(row)) for row in all_data]
        
        df = pd.DataFrame(normalized_data)
        df.to_excel(output_excel, index=False, header=False)
        print(f"İşlem tamamlandı. Veriler {output_excel} dosyasına kaydedildi.")
    else:
        print("Hiçbir veri çekilemedi.")

if __name__ == "__main__":
    main()
