import pandas as pd
import json
import os
from pathlib import Path
import glob

def clean_value(val):
    """Clean and normalize values"""
    if pd.isna(val):
        return ""
    if isinstance(val, (int, float)):
        return str(int(val)) if isinstance(val, float) and val.is_integer() else str(val)
    return str(val).strip()

def process_excel_file(file_path):
    """Process a single Excel file and return records"""
    print(f"\nProcessing: {file_path.name}")
    
    try:
        df = pd.read_excel(file_path)
        print(f"  - Columns: {len(df.columns)}")
        print(f"  - Rows: {len(df)}")
        
        records = []
        
        # Determine List Name from Filename
        filename = file_path.name.lower()
        list_name = "TR MASAK"
        if "section_a" in filename or "5.madde" in filename or "5._madde" in filename:
            list_name = "TR MASAK - BM Güvenlik Konseyi (5. Madde)"
        elif "section_b" in filename or "6.madde" in filename or "6._madde" in filename:
            list_name = "TR MASAK - Yabancı Ülke Talepleri (6. Madde)"
        elif "section_c" in filename or "7.madde" in filename or "7._madde" in filename:
            list_name = "TR MASAK - İç Dondurma Kararı (7. Madde)"
        elif "section_d" in filename or "3.a" in filename:
            list_name = "TR MASAK - 7262 Sayılı Kanun (3.A ve 3.B)"
            
        print(f"  - Detected List: {list_name}")
        
        for idx, row in df.iterrows():
            # Create a record with ALL columns from Excel
            record = {
                "list": list_name,
                "source": "TR MASAK"
            }
            
            # Add ALL columns from the Excel file
            for col in df.columns:
                # Clean column name and use as key
                key = col.strip() if isinstance(col, str) else str(col)
                value = clean_value(row[col])
                record[key] = value
            
            # Add standardized fields for searching
            # Try to identify name field
            name_field = None
            for col in df.columns:
                col_lower = str(col).lower()
                if 'ad-soyad' in col_lower or 'ünvan' in col_lower or 'unvan' in col_lower or 'isim' in col_lower:
                    name_field = col
                    break
            
            if name_field and row[name_field] and not pd.isna(row[name_field]):
                record["name"] = clean_value(row[name_field])
            
            # Try to identify ID field (TCKN/VKN)
            id_field = None
            for col in df.columns:
                col_lower = str(col).lower()
                if 'tckn' in col_lower or 'vkn' in col_lower or 'kimlik' in col_lower or 'pasaport' in col_lower or 'sicil' in col_lower:
                    id_field = col
                    break
            
            if id_field and row[id_field] and not pd.isna(row[id_field]):
                # Keep original value (e.g. "123/456") so search can handle it
                record["tckn"] = clean_value(row[id_field])
                # Also map to tckn_vkn for compatibility if needed
                record["tckn_vkn"] = record["tckn"]
            
            # Only add if we have at least a name
            if "name" in record and len(record["name"]) > 1:
                records.append(record)
        
        print(f"  [OK] Processed {len(records)} records")
        return records
        
    except Exception as e:
        print(f"  [ERROR] Error processing {file_path.name}: {e}")
        return []

def main():
    # Paths
    base_dir = Path(__file__).parent.parent
    excel_dir = base_dir / "masak_downloads"
    output_file = base_dir / "masak_data.js"
    
    print("=" * 80)
    print("MASAK Excel to JS Converter")
    print(f"Input Directory: {excel_dir}")
    print("=" * 80)
    
    if not excel_dir.exists():
        print(f"[ERROR] Directory not found: {excel_dir}")
        return

    # Find all Excel files
    excel_files = list(excel_dir.glob("*.xlsx"))
    if not excel_files:
        print("[ERROR] No .xlsx files found in directory.")
        return

    all_records = []
    
    for file_path in excel_files:
        records = process_excel_file(file_path)
        all_records.extend(records)
    
    # Save to JS
    print("\n" + "=" * 80)
    print(f"Total records: {len(all_records)}")
    print(f"Saving to: {output_file}")
    
    try:
        json_str = json.dumps(all_records, ensure_ascii=False, indent=2)
        js_content = f"window.MASAK_DATA = {json_str};"
        
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(js_content)
        
        print(f"[OK] Successfully saved {len(all_records)} records to {output_file.name}")
    except Exception as e:
        print(f"[ERROR] Failed to save file: {e}")

    print("=" * 80)

if __name__ == "__main__":
    main()
