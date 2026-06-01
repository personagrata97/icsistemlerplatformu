import os
import sys
import subprocess

# Install required packages
print("Installing required packages...")
packages = ["easyocr", "pdf2image", "Pillow", "PyPDF2"]
for package in packages:
    try:
        __import__(package.replace("-", "_").lower())
        print(f"{package} already installed")
    except ImportError:
        print(f"Installing {package}...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", package, "--quiet"])

import easyocr
from pdf2image import convert_from_path
from PyPDF2 import PdfReader
from PIL import Image
import io

def extract_text_from_pdf(pdf_path, output_txt_path):
    """Extract text from PDF using OCR for image-based pages and PyPDF2 for text-based pages"""
    
    print(f"\n{'='*60}")
    print(f"Processing PDF: {pdf_path}")
    print(f"{'='*60}\n")
    
    # Initialize EasyOCR reader for Turkish
    print("Initializing EasyOCR with Turkish language support...")
    reader = easyocr.Reader(['tr'])
    print("EasyOCR ready!\n")
    
    # Try to read PDF with PyPDF2 first
    pdf_reader = PdfReader(pdf_path)
    total_pages = len(pdf_reader.pages)
    print(f"Total pages in PDF: {total_pages}\n")
    
    all_text = []
    
    for page_num in range(total_pages):
        print(f"Processing page {page_num + 1}/{total_pages}...")
        
        # Try to extract text directly first
        page = pdf_reader.pages[page_num]
        text = page.extract_text()
        
        # If text extraction yields substantial text, use it
        if text and len(text.strip()) > 50:
            print(f"  ✓ Page {page_num + 1}: Text extracted directly ({len(text)} chars)")
            all_text.append(f"\n{'='*60}\nPAGE {page_num + 1} (Direct Text Extraction)\n{'='*60}\n")
            all_text.append(text)
        else:
            # Otherwise, use OCR
            print(f"  → Page {page_num + 1}: Using OCR (image-based page)")
            
            # Convert PDF page to image
            images = convert_from_path(pdf_path, first_page=page_num + 1, last_page=page_num + 1, dpi=300)
            
            if images:
                image = images[0]
                
                # Perform OCR
                ocr_results = reader.readtext(image, detail=0, paragraph=True)
                ocr_text = '\n'.join(ocr_results)
                
                print(f"  ✓ Page {page_num + 1}: OCR completed ({len(ocr_text)} chars)")
                
                all_text.append(f"\n{'='*60}\nPAGE {page_num + 1} (OCR Extraction)\n{'='*60}\n")
                all_text.append(ocr_text)
    
    # Save all extracted text
    final_text = '\n'.join(all_text)
    with open(output_txt_path, 'w', encoding='utf-8') as f:
        f.write(final_text)
    
    print(f"\n{'='*60}")
    print(f"✓ Extraction complete!")
    print(f"Total characters extracted: {len(final_text)}")
    print(f"Output saved to: {output_txt_path}")
    print(f"{'='*60}\n")
    
    return final_text

if __name__ == "__main__":
    # PDF file path
    downloads_dir = r"C:\Users\sk36\.gemini\antigravity\scratch\sanction_scanner\downloads"
    
    # Find PDF files in the directory
    pdf_files = [f for f in os.listdir(downloads_dir) if f.endswith('.pdf')]
    
    if not pdf_files:
        print("No PDF files found in downloads directory!")
        sys.exit(1)
    
    print(f"Found {len(pdf_files)} PDF file(s):")
    for i, pdf_file in enumerate(pdf_files, 1):
        print(f"  {i}. {pdf_file}")
    
    # Process each PDF
    for pdf_file in pdf_files:
        pdf_path = os.path.join(downloads_dir, pdf_file)
        output_txt = os.path.join(downloads_dir, pdf_file.replace('.pdf', '_extracted.txt'))
        
        try:
            extract_text_from_pdf(pdf_path, output_txt)
        except Exception as e:
            print(f"Error processing {pdf_file}: {str(e)}")
            import traceback
            traceback.print_exc()
