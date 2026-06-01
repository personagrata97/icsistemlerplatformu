"""
PDF Okuyucu - Normal PDF + Image-Based OCR

Bu script:
1. İlk sayfayı normal PDF olarak okur (PyMuPDF ile)
2. Diğer sayfaları image-based olarak OCR ile okur (EasyOCR ile)

Kullanım: python scripts/read_pdf_with_ocr.py
"""

import os
import sys
import fitz  # PyMuPDF
from pathlib import Path
import easyocr
from PIL import Image
import io
import json

def read_pdf_with_ocr(pdf_path, output_json=None):
    """
    PDF'i okur - ilk sayfa normal, diğerleri OCR ile
    
    Args:
        pdf_path: PDF dosya yolu
        output_json: Çıktı JSON dosya yolu (opsiyonel)
    
    Returns:
        dict: Her sayfanın metinlerini içeren sözlük
    """
    
    print(f"\n{'='*70}")
    print(f"PDF OKUMA - OCR DESTEKLİ")
    print(f"{'='*70}")
    print(f"Dosya: {pdf_path}")
    
    # PDF dosyasını aç
    pdf_document = fitz.open(pdf_path)
    total_pages = pdf_document.page_count
    print(f"Toplam sayfa: {total_pages}")
    
    # EasyOCR reader'ı başlat (Türkçe + İngilizce)
    print("\n[*] EasyOCR başlatılıyor (Türkçe + İngilizce)...")
    reader = easyocr.Reader(['tr', 'en'], gpu=False)
    print("[✓] EasyOCR hazır")
    
    # Her sayfa için metin
    pages_text = {}
    
    # İlk sayfayı normal PDF olarak oku
    print(f"\n{'='*70}")
    print(f"SAYFA 1 - Normal PDF Okuma")
    print(f"{'='*70}")
    
    try:
        page = pdf_document[0]
        text = page.get_text()
        
        if text and text.strip():
            print(f"[✓] Metin çıkarıldı ({len(text)} karakter)")
            pages_text[1] = text
            
            # İlk 500 karakteri göster
            preview = text[:500] + "..." if len(text) > 500 else text
            print(f"\n[ÖNİZLEME]")
            print("-" * 70)
            print(preview)
        else:
            print("[!] Sayfa 1'de de metin bulunamadı, OCR deneniyor...")
            # Sayfa 1'de de OCR dene
            pix = page.get_pixmap(matrix=fitz.Matrix(2, 2))  # 2x zoom
            img_data = pix.tobytes("png")
            img = Image.open(io.BytesIO(img_data))
            
            result = reader.readtext(img, detail=0)
            text = "\n".join(result)
            
            pages_text[1] = text
            print(f"[✓] OCR ile metin çıkarıldı ({len(text)} karakter)")
            
            # İlk 500 karakteri göster
            preview = text[:500] + "..." if len(text) > 500 else text
            print(f"\n[ÖNİZLEME]")
            print("-" * 70)
            print(preview)
            
    except Exception as e:
        print(f"[✗] Sayfa 1 hatası: {e}")
        pages_text[1] = ""
    
    # Diğer sayfaları OCR ile oku
    for page_num in range(1, total_pages):
        print(f"\n{'='*70}")
        print(f"SAYFA {page_num + 1} - OCR ile Okuma")
        print(f"{'='*70}")
        
        try:
            page = pdf_document[page_num]
            
            # Sayfayı yüksek çözünürlükte görüntüye çevir
            print(f"[*] Sayfa görüntüye çevriliyor...")
            pix = page.get_pixmap(matrix=fitz.Matrix(2, 2))  # 2x zoom for better OCR
            img_data = pix.tobytes("png")
            img = Image.open(io.BytesIO(img_data))
            
            print(f"[*] OCR işleniyor...")
            # OCR yap
            result = reader.readtext(img, detail=0)
            text = "\n".join(result)
            
            pages_text[page_num + 1] = text
            
            print(f"[✓] Metin çıkarıldı ({len(text)} karakter)")
            
            # İlk 500 karakteri göster
            if text:
                preview = text[:500] + "..." if len(text) > 500 else text
                print(f"\n[ÖNİZLEME]")
                print("-" * 70)
                print(preview)
            else:
                print("[!] Boş sayfa")
                
        except Exception as e:
            print(f"[✗] Sayfa {page_num + 1} hatası: {e}")
            pages_text[page_num + 1] = ""
    
    # PDF'i kapat
    pdf_document.close()
    
    # Sonuç raporu
    print(f"\n{'='*70}")
    print(f"SONUÇ")
    print(f"{'='*70}")
    print(f"Toplam sayfa: {total_pages}")
    print(f"Başarılı: {len([t for t in pages_text.values() if t])} sayfa")
    print(f"Boş: {len([t for t in pages_text.values() if not t])} sayfa")
    
    # Toplam metin uzunluğu
    total_chars = sum(len(t) for t in pages_text.values())
    print(f"Toplam karakter: {total_chars:,}")
    
    # JSON'a kaydet
    if output_json:
        output_data = {
            'pdf_path': str(pdf_path),
            'total_pages': total_pages,
            'pages': pages_text,
            'total_characters': total_chars
        }
        
        with open(output_json, 'w', encoding='utf-8') as f:
            json.dump(output_data, f, ensure_ascii=False, indent=2)
        
        print(f"\n[✓] JSON kaydedildi: {output_json}")
    
    return pages_text


def main():
    """Ana fonksiyon"""
    
    # PDF dosyası
    pdf_path = Path("downloads/20211224-16.pdf")
    
    if not pdf_path.exists():
        print(f"[✗] PDF dosyası bulunamadı: {pdf_path}")
        return
    
    # Çıktı dosyası
    output_json = Path("downloads/20211224-16_ocr_output.json")
    
    # PDF'i oku
    pages_text = read_pdf_with_ocr(pdf_path, output_json)
    
    # Tüm metni birleştir
    full_text = "\n\n".join([f"=== SAYFA {num} ===\n{text}" for num, text in pages_text.items()])
    
    # Tam metni de kaydet
    text_output = Path("downloads/20211224-16_full_text.txt")
    with open(text_output, 'w', encoding='utf-8') as f:
        f.write(full_text)
    
    print(f"[✓] Tam metin kaydedildi: {text_output}")
    

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n[✗] İşlem iptal edildi")
    except Exception as e:
        print(f"\n\n[✗] HATA: {e}")
        import traceback
        traceback.print_exc()
