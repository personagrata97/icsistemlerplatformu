import re
import pandas as pd
from pathlib import Path

def parse_text_to_excel(input_path, output_path):
    print(f"Reading from {input_path}...")
    
    with open(input_path, "r", encoding="utf-8") as f:
        lines = f.readlines()

    data = []
    
    # Regex patterns
    # Look for 11 digit TCKN
    tckn_pattern = re.compile(r'(\d{11})')
    # Look for Date (DD.MM.YYYY)
    date_pattern = re.compile(r'(\d{1,2}\.\d{1,2}\.\d{4})')

    print(f"Parsing {len(lines)} lines...")
    
    for line in lines:
        line = line.strip()
        if not line:
            continue

        # Find TCKN
        tckn_match = tckn_pattern.search(line)
        if not tckn_match:
            continue
            
        tckn = tckn_match.group(1)
        
        # Find Date
        date_match = date_pattern.search(line)
        dob = date_match.group(1) if date_match else ""
        
        # Split line based on TCKN and Date to get other fields
        # Everything before TCKN is likely Sequence + Garbage
        # Everything between TCKN and Date is Name + Mother + Father
        # Everything after Date is Place + Reason
        
        parts_before_tckn = line[:tckn_match.start()]
        
        if date_match:
            parts_middle = line[tckn_match.end():date_match.start()]
            parts_after = line[date_match.end():]
        else:
            parts_middle = line[tckn_match.end():]
            parts_after = ""

        # Clean up middle part (Name, Mother, Father)
        # This is tricky because separators are inconsistent. 
        # We'll just store it as "Identity Info" for now, or try to split by spaces/pipes
        identity_info = parts_middle.replace('|', ' ').strip()
        identity_info = re.sub(r'\s+', ' ', identity_info) # Normalize spaces
        
        # Clean up after part (Place, Reason)
        location_info = parts_after.replace('|', ' ').strip()
        location_info = re.sub(r'\s+', ' ', location_info)

        row = {
            "TCKN": tckn,
            "Dogum Tarihi": dob,
            "Kimlik Bilgileri (Ad/Soyad/Ana/Baba)": identity_info,
            "Yer ve Gerekce": location_info,
            "Orjinal Satir": line # Keep original for reference
        }
        data.append(row)

    print(f"Found {len(data)} records.")
    
    if data:
        df = pd.DataFrame(data)
        df.to_excel(output_path, index=False)
        print(f"Excel file saved to {output_path}")
    else:
        print("No data found to save.")

if __name__ == "__main__":
    input_file = Path(r"C:\Users\sk36\.gemini\antigravity\scratch\sanction_scanner\extracted_text.txt")
    output_file = Path(r"C:\Users\sk36\.gemini\antigravity\scratch\sanction_scanner\extracted_data.xlsx")
    
    parse_text_to_excel(input_file, output_file)
