import pdfplumber
import json
import os
import sys
import re
import unicodedata

# Configuration
DATA_FILE = os.path.join(os.path.dirname(__file__), '..', 'sanctions_data.js')

def load_sanctions_data():
    """Loads sanctions data from the JS file."""
    if not os.path.exists(DATA_FILE):
        print(f"Error: Data file not found at {DATA_FILE}")
        return []
    
    try:
        with open(DATA_FILE, 'r', encoding='utf-8') as f:
            content = f.read()
            # Extract JSON part: window.SANCTIONS_DATA = [...];
            match = re.search(r'window\.SANCTIONS_DATA\s*=\s*(\[.*?\]);', content, re.DOTALL)
            if match:
                json_str = match.group(1)
                return json.loads(json_str)
            else:
                print("Error: Could not find JSON data in JS file.")
                return []
    except Exception as e:
        print(f"Error loading data: {e}")
        return []

def normalize_text(text):
    """Normalizes text for comparison (lowercase, remove accents)."""
    if not text: return ""
    text = text.lower()
    text = unicodedata.normalize('NFKD', text).encode('ASCII', 'ignore').decode('utf-8')
    return text.strip()

def extract_text_from_pdf(pdf_path):
    """Extracts all text from a PDF file."""
    print(f"Reading PDF: {pdf_path}...")
    text_content = ""
    try:
        with pdfplumber.open(pdf_path) as pdf:
            for page in pdf.pages:
                text = page.extract_text()
                if text:
                    text_content += text + "\n"
    except Exception as e:
        print(f"Error reading PDF: {e}")
        return None
    return text_content

def scan_pdf(pdf_path):
    sanctions = load_sanctions_data()
    if not sanctions:
        print("No sanctions data available. Please run full_update.py first.")
        return

    print(f"Loaded {len(sanctions)} sanction records.")
    
    pdf_text = extract_text_from_pdf(pdf_path)
    if not pdf_text:
        return

    print("Scanning PDF content against sanctions list...")
    pdf_text_normalized = normalize_text(pdf_text)
    
    matches = []
    # Simple keyword matching (can be improved with fuzzy matching)
    # We iterate over sanctions and check if they exist in the PDF text
    # This is O(N*M) but N (sanctions) is ~30k and M (pdf size) is smallish.
    # Optimization: Only check names with length > 4 to avoid noise
    
    count = 0
    for record in sanctions:
        name = record.get('name')
        if not name or len(name) < 4: continue
        
        name_norm = normalize_text(name)
        if name_norm in pdf_text_normalized:
            matches.append(record)
            print(f"MATCH FOUND: {name} ({record.get('list')})")
        
        count += 1
        if count % 5000 == 0:
            print(f"Checked {count} records...")

    print(f"\nScan Complete. Found {len(matches)} matches.")
    
    if matches:
        print("\n--- Detailed Matches ---")
        for m in matches:
            print(f"- {m['name']} [{m['list']}]")
            print(f"  Details: {m.get('sourceDetails', '-')}")
            print("-" * 30)

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python scan_pdf.py <path_to_pdf_file>")
    else:
        scan_pdf(sys.argv[1])
