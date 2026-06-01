import os
import sys
from pathlib import Path

# Install required packages if not present
try:
    import pytesseract
    import fitz  # PyMuPDF
    from PIL import Image
except ImportError:
    print("Required packages not found. Please install: pytesseract pymupdf Pillow")
    sys.exit(1)

# Set Tesseract Path
# Adjust this path if Tesseract is installed elsewhere
pytesseract.pytesseract.tesseract_cmd = r"C:\Users\sk36\AppData\Local\Programs\Tesseract-OCR\tesseract.exe"

def extract_text_from_pdf(pdf_path: Path, output_path: Path):
    # Ensure output directory exists
    output_path.parent.mkdir(parents=True, exist_ok=True)

    all_text = []
    
    try:
        doc = fitz.open(pdf_path)
        num_pages = len(doc)
    except Exception as e:
        print(f"Error opening PDF: {e}")
        return

    # Skip the first page (index 0) as requested
    print(f"Processing {num_pages - 1} pages (skipping first page)...")

    for page_number in range(1, num_pages):
        page = doc.load_page(page_number)
        
        # 1. Try extracting text directly
        text = page.get_text()
        if text and text.strip():
            all_text.append(text)
            print(f"Page {page_number + 1}: Text extracted directly.")
            continue
        
        # 2. If no text, convert to image and OCR
        print(f"Page {page_number + 1}: No text found, performing OCR...")
        # Increase resolution (zoom x 2 = 144 dpi, x 3 = 216 dpi, x 4 = 288 dpi)
        zoom = 4
        mat = fitz.Matrix(zoom, zoom)
        pix = page.get_pixmap(matrix=mat)
        img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
        
        # Perform OCR (Turkish + English)
        try:
            # Use local tessdata directory
            tessdata_dir = Path(__file__).parent / "tessdata"
            os.environ["TESSDATA_PREFIX"] = str(tessdata_dir.absolute())
            
            ocr_text = pytesseract.image_to_string(img, lang='tur+eng')
            all_text.append(ocr_text)
        except pytesseract.TesseractError as e:
            print(f"OCR Error on page {page_number + 1}: {e}")
            all_text.append(f"[OCR Failed for Page {page_number + 1}]")

    # Write combined text to output file
    with open(output_path, "w", encoding="utf-8") as out_f:
        out_f.write("\n\n---PAGE BREAK---\n\n".join(all_text))
    print(f"Extraction completed. Output saved to {output_path}")

if __name__ == "__main__":
    # Expected PDF location
    pdf_file = Path(r"C:\Users\sk36\.gemini\antigravity\scratch\sanction_scanner\downloads\20211224-16.pdf")
    output_file = Path(r"C:\Users\sk36\.gemini\antigravity\scratch\sanction_scanner\extracted_text.txt")
    
    if not pdf_file.is_file():
        print(f"PDF file not found at {pdf_file}")
        # For testing purposes, if the specific file doesn't exist, try to find any PDF in the downloads folder
        downloads_dir = pdf_file.parent
        if downloads_dir.exists():
            pdfs = list(downloads_dir.glob("*.pdf"))
            if pdfs:
                pdf_file = pdfs[0]
                print(f"Using alternative PDF: {pdf_file}")
            else:
                sys.exit(1)
        else:
            sys.exit(1)

    extract_text_from_pdf(pdf_file, output_file)
