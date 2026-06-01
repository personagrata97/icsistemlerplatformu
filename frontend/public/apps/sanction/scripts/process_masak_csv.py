import os
import json
import datetime

# Setup paths
base_dir = os.path.dirname(os.path.abspath(__file__))
raw_dir = os.path.join(base_dir, '../data/masak_raw')
output_file = os.path.join(base_dir, '../data/masak_data.js')

all_records = []

print(f"Reading CSV files from {raw_dir}...")

if not os.path.exists(raw_dir):
    print(f"Directory not found: {raw_dir}")
    exit(1)

for filename in os.listdir(raw_dir):
    if not filename.endswith('.csv'):
        continue
        
    print(f"Processing {filename}...")
    filepath = os.path.join(raw_dir, filename)
    
    # Try reading with different encodings
    encodings = ['cp1254', 'utf-8', 'latin-1']
    lines = []
    
    for enc in encodings:
        try:
            with open(filepath, 'r', encoding=enc) as f:
                lines = f.readlines()
            print(f"Successfully read with {enc}")
            break
        except UnicodeDecodeError:
            continue
            
    if not lines:
        print(f"Failed to read {filename}")
        continue
        
    # Parse Header
    if len(lines) < 2:
        continue
        
    header_line = lines[0].strip()
    headers = [h.strip().upper() for h in header_line.split(';')]
    
    # Column Mapping
    col_map = {
        'name': -1, 'tckn': -1, 'nationality': -1, 'dob': -1, 'pob': -1,
        'mother': -1, 'father': -1, 'org': -1, 'listType': -1, 'decree': -1
    }
    
    for i, h in enumerate(headers):
        if 'AD-SOYAD' in h or 'GERÇEK/TÜZEL' in h or 'ADI SOYADI' in h or 'UNVANI' in h: col_map['name'] = i
        elif 'TCKN' in h or 'VKN' in h or 'PASAPORT' in h: col_map['tckn'] = i
        elif 'UYRU' in h: col_map['nationality'] = i
        elif 'DOĞUM TARİHİ' in h or 'DOGUM TARIHI' in h: col_map['dob'] = i
        elif 'DOĞUM YERİ' in h or 'DOGUM YERI' in h: col_map['pob'] = i
        elif 'ANNE ADI' in h: col_map['mother'] = i
        elif 'BABA ADI' in h: col_map['father'] = i
        elif 'ÖRGÜT' in h or 'ORGUT' in h or 'BAĞLANTILI' in h: col_map['org'] = i
        elif 'YAPTIRIM TÜRÜ' in h or 'YAPTIRIM TURU' in h: col_map['listType'] = i
        elif 'KARAR SAYISI' in h or 'RESMİ GAZETE' in h or 'RESMI GAZETE' in h: col_map['decree'] = i

    print(f"Column Mapping: {col_map}")
    
    # Process Lines
    for line in lines[1:]:
        parts = line.strip().split(';')
        if len(parts) < 2: continue
        
        # Safe get
        def get_col(idx):
            if idx > -1 and idx < len(parts):
                return parts[idx].strip().replace('"', '')
            return ''
            
        name = get_col(col_map['name'])
        if not name or len(name) < 2: continue
        
        record = {
            'name': name,
            'list': 'TR MASAK (Yurtiçi)',
            'type': 'Individual',
            'score': 0,
            'sourceDetails': '',
            'tckn': '',
            'decreeUrl': ''
        }
        
        details = []
        tckn = get_col(col_map['tckn'])
        if tckn:
            record['tckn'] = tckn
            details.append(f"TCKN/VKN/Pasaport: {tckn}")
            
        nat = get_col(col_map['nationality'])
        if nat: details.append(f"Uyruk: {nat}")
        
        dob = get_col(col_map['dob'])
        if dob: details.append(f"Doğum Tarihi: {dob}")
        
        pob = get_col(col_map['pob'])
        if pob: details.append(f"Doğum Yeri: {pob}")
        
        mother = get_col(col_map['mother'])
        if mother: details.append(f"Anne Adı: {mother}")
        
        father = get_col(col_map['father'])
        if father: details.append(f"Baba Adı: {father}")
        
        org = get_col(col_map['org'])
        if org: details.append(f"Örgüt: {org}")
        
        ltype = get_col(col_map['listType'])
        if ltype: details.append(f"Yaptırım Türü: {ltype}")
        
        decree = get_col(col_map['decree'])
        if decree: details.append(f"Karar/Gazete: {decree}")
        
        record['sourceDetails'] = '\n'.join(details)
        
        # Determine List Name
        if 'IC-DONDURMA' in filename:
            record['list'] = 'TR MASAK - İç Dondurma (FETÖ/PKK/DHKP-C/DEAŞ)'
        elif 'BIRLESMIS-MILLETLER' in filename:
            record['list'] = 'TR MASAK - BMGK Kararları'
        elif 'YABANCI-ULKE' in filename:
            record['list'] = 'TR MASAK - Yabancı Ülke Talepleri'
            
        all_records.append(record)

print(f"Total records processed: {len(all_records)}")

# Write to JS file
js_content = f"// MASAK Data generated from CSVs\n// Last Updated: {datetime.datetime.now().isoformat()}\nwindow.MASAK_DATA = {json.dumps(all_records, ensure_ascii=False, indent=2)};\n"

with open(output_file, 'w', encoding='utf-8') as f:
    f.write(js_content)
    
print(f"Successfully wrote to {output_file}")
