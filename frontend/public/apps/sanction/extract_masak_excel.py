import re
import pandas as pd
import fitz  # PyMuPDF
import pytesseract
import cv2
import numpy as np
from pathlib import Path
from PIL import Image
import io

# Set Tesseract Path
pytesseract.pytesseract.tesseract_cmd = r"C:\Users\sk36\AppData\Local\Programs\Tesseract-OCR\tesseract.exe"

def preprocess_image(img):
    # Convert PIL Image to OpenCV format
    img_cv = cv2.cvtColor(np.array(img), cv2.COLOR_RGB2BGR)
    
    # Convert to grayscale
    gray = cv2.cvtColor(img_cv, cv2.COLOR_BGR2GRAY)
    
    # Apply thresholding to binarize the image
    # Otsu's thresholding
    _, thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    
    # Optional: Dilation/Erosion if text is too thin or thick
    # kernel = np.ones((1, 1), np.uint8)
    # thresh = cv2.dilate(thresh, kernel, iterations=1)
    
    return Image.fromarray(thresh)

def extract_data_from_pdf(pdf_path: Path, output_excel: Path):
    print(f"Processing PDF: {pdf_path}")
    
    data = []
    
    try:
        doc = fitz.open(pdf_path)
    except Exception as e:
        print(f"Error opening PDF: {e}")
        return

    # Regex for TCKN (11 digits)
    tckn_pattern = re.compile(r'\b\d{11}\b')
    
    # Iterate over pages, skipping the first one
    for i in range(1, len(doc)):
        print(f"Processing Page {i+1}/{len(doc)}...")
        page = doc.load_page(i)
        
        # Render page at high DPI (Zoom factor 3 = ~216 DPI if base is 72, or just high enough)
        zoom = 3
        mat = fitz.Matrix(zoom, zoom)
        pix = page.get_pixmap(matrix=mat)
        
        img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
        
        # Preprocess
        img = preprocess_image(img)
        
        # OCR with Turkish language support
        # psm 6: Assume a single uniform block of text. Good for tables if lines are preserved.
        text = pytesseract.image_to_string(img, lang='tur', config='--psm 6')
        
        lines = text.split('\n')
        for line in lines:
            line = line.strip()
            if not line:
                continue
            
            # Heuristic: Look for lines with TCKN or specific keywords
            # The table structure is complex, but let's try to capture rows with TCKN
            tckn_match = tckn_pattern.search(line)
            
            if tckn_match:
                tckn = tckn_match.group(0)
                # This line likely contains a person's record.
                # Let's try to split by whitespace, but names can have spaces.
                # This is tricky. We'll dump the raw line for now and try to parse TCKN.
                
                # Simple parsing strategy:
                # Assume format: ID | Name Surname | ... | TCKN | ...
                # We will just save the TCKN and the full raw line for manual review if parsing fails
                
                row_data = {
                    'Page': i + 1,
                    'TCKN': tckn,
                    'Raw_Line': line
                }
                data.append(row_data)
            else:
                # Some rows might not have TCKN or it wasn't read correctly.
                # We can save them if they look like data (length > 10)
                if len(line) > 20 and not "PAGE BREAK" in line:
                     data.append({'Page': i+1, 'TCKN': '', 'Raw_Line': line})

    df = pd.DataFrame(data)
    
    # Post-processing to clean up data if possible
    # (e.g., extract names from Raw_Line if structure is consistent)
    
    df.to_excel(output_excel, index=False)
    print(f"Data extracted and saved to {output_excel}")

if __name__ == "__main__":
    pdf_file = Path(r"C:\Users\sk36\.gemini\antigravity\scratch\sanction_scanner\downloads\20211224-16.pdf")
    output_excel = Path(r"C:\Users\sk36\.gemini\antigravity\scratch\sanction_scanner\masak_data.xlsx")
    
    if not pdf_file.exists():
         # Fallback search
        downloads_dir = pdf_file.parent
        if downloads_dir.exists():
            pdfs = list(downloads_dir.glob("*.pdf"))
            if pdfs:
                pdf_file = pdfs[0]
                print(f"Using found PDF: {pdf_file}")
    
    if pdf_file.exists():
        extract_data_from_pdf(pdf_file, output_excel)
    else:
        print("PDF file not found.")
