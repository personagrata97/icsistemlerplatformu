import requests
from bs4 import BeautifulSoup
import datetime
import pdfplumber
import io
import json
import os
import re
import csv
import xml.etree.ElementTree as ET
import ssl
import urllib.request
import time
import urllib3
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

# Create session for requests
session = requests.Session()
session.verify = False

# Configuration
OUTPUT_FILE = os.path.join(os.path.dirname(__file__), '..', 'sanctions_data.js')
RESMI_GAZETE_URL = "https://www.resmigazete.gov.tr"

# Disable SSL verification for legacy systems if needed
ssl._create_default_https_context = ssl._create_unverified_context

consolidated_data = []
meta_data = {
    "sources": {
        "UN": {"count": 0, "lastUpdated": "-"},
        "EU": {"count": 0, "lastUpdated": "-"},
        "OFAC": {"count": 0, "lastUpdated": "-"},
        "TR": {"count": 0, "lastUpdated": "-"}
    },
    "decrees": [],
    "lastUpdated": "-"
}

def log(msg):
    print(f"[{datetime.datetime.now().strftime('%H:%M:%S')}] {msg}", flush=True)

# --- 1. Foreign Lists (UN, EU, OFAC) ---

def fetch_un():
    log("Fetching UN List...")
    url = 'https://scsanctions.un.org/resources/xml/en/consolidated.xml'
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req) as response:
            xml_content = response.read()
            root = ET.fromstring(xml_content)
            
            ind_count = len(root.findall('.//INDIVIDUAL'))
            ent_count = len(root.findall('.//ENTITY'))
            log(f"UN Debug: Found {ind_count} individuals and {ent_count} entities in XML.")
            
            count = 0
            for individual in root.findall('.//INDIVIDUAL'):
                first = individual.find('FIRST_NAME').text if individual.find('FIRST_NAME') is not None else ''
                second = individual.find('SECOND_NAME').text if individual.find('SECOND_NAME') is not None else ''
                third = individual.find('THIRD_NAME').text if individual.find('THIRD_NAME') is not None else ''
                name = f"{first} {second} {third}".strip()
                
                # Extract additional details
                comments = individual.find('COMMENTS1').text if individual.find('COMMENTS1') is not None else ''
                
                nationality = []
                for nat in individual.findall('.//NATIONALITY/VALUE'):
                    if nat.text: nationality.append(nat.text)
                
                dob = []
                for d in individual.findall('.//INDIVIDUAL_DATE_OF_BIRTH/DATE'):
                    if d.text: dob.append(d.text)
                
                details_parts = []
                if nationality: details_parts.append(f"Nationality: {', '.join(nationality)}")
                if dob: details_parts.append(f"DOB: {', '.join(dob)}")
                if comments: details_parts.append(f"Note: {comments[:200]}...") # Truncate long comments
                
                source_details = " | ".join(details_parts) if details_parts else 'UN Security Council Consolidated List'

                consolidated_data.append({
                    'name': name,
                    'list': 'UN Consolidated',
                    'type': 'Individual',
                    'originalId': individual.find('DATAID').text,
                    'sourceDetails': source_details
                })
                count += 1
            
            for entity in root.findall('.//ENTITY'):
                name = entity.find('FIRST_NAME').text if entity.find('FIRST_NAME') is not None else ''
                
                comments = entity.find('COMMENTS1').text if entity.find('COMMENTS1') is not None else ''
                address = entity.find('.//ENTITY_ADDRESS/STREET').text if entity.find('.//ENTITY_ADDRESS/STREET') is not None else ''
                
                details_parts = []
                if address: details_parts.append(f"Address: {address}")
                if comments: details_parts.append(f"Note: {comments[:200]}...")
                
                source_details = " | ".join(details_parts) if details_parts else 'UN Security Council Consolidated List'

                consolidated_data.append({
                    'name': name,
                    'list': 'UN Consolidated',
                    'type': 'Entity',
                    'originalId': entity.find('DATAID').text,
                    'sourceDetails': source_details
                })
                count += 1
            
            meta_data["sources"]["UN"]["count"] = count
            meta_data["sources"]["UN"]["lastUpdated"] = datetime.datetime.now().strftime("%d.%m.%Y %H:%M")
            log(f"Parsed {count} UN records.")
    except Exception as e:
        log(f"Error fetching UN: {e}")

def fetch_eu():
    log("Fetching EU List...")
    url = 'https://webgate.ec.europa.eu/europeaid/fsd/fsf/public/files/xmlFullSanctionsList/content?token=dG9rZW4tMjAxNw'
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req) as response:
            xml_content = response.read()
            root = ET.fromstring(xml_content)
            
            namespaces = {'ns': 'http://eu.europa.ec/fpi/fsd/export'}
            count = 0
            
            for entity in root.findall('.//ns:sanctionEntity', namespaces):
                # Name is in nameAlias attribute
                name_alias = entity.find('.//ns:nameAlias', namespaces)
                if name_alias is not None and 'wholeName' in name_alias.attrib:
                    name = name_alias.attrib['wholeName']
                    
                    # Extract additional details
                    details_parts = []
                    
                    # Citizenship
                    citizenships = []
                    for cit in entity.findall('.//ns:citizenship', namespaces):
                        country = cit.attrib.get('countryDescription', '')
                        region = cit.attrib.get('region', '')
                        val = f"{country} {region}".strip()
                        if val: citizenships.append(val)
                    if citizenships: details_parts.append(f"Citizenship: {', '.join(citizenships)}")

                    # Birth Date
                    birth_dates = []
                    for bd in entity.findall('.//ns:birthdate', namespaces):
                        date_str = bd.attrib.get('birthdate', '')
                        place = bd.attrib.get('place', '') or bd.attrib.get('city', '')
                        country = bd.attrib.get('countryDescription', '')
                        
                        bd_part = date_str
                        if place or country:
                            bd_part += f" ({place} {country})".strip()
                        
                        if bd_part: birth_dates.append(bd_part)
                    if birth_dates: details_parts.append(f"DOB: {', '.join(birth_dates)}")
                    
                    # Address
                    addresses = []
                    for addr in entity.findall('.//ns:address', namespaces):
                        city = addr.attrib.get('city', '')
                        country = addr.attrib.get('countryDescription', '')
                        street = addr.attrib.get('street', '')
                        val = f"{street} {city} {country}".strip()
                        if val: addresses.append(val)
                    if addresses: details_parts.append(f"Address: {', '.join(addresses[:2])}")

                    source_details = " | ".join(details_parts) if details_parts else 'EU Consolidated Financial Sanctions'

                    consolidated_data.append({
                        'name': name,
                        'list': 'EU Financial Sanctions',
                        'type': 'Entity/Individual',
                        'originalId': entity.attrib.get('logicalId', ''),
                        'sourceDetails': source_details
                    })
                    count += 1
            
            meta_data["sources"]["EU"]["count"] = count
            meta_data["sources"]["EU"]["lastUpdated"] = datetime.datetime.now().strftime("%d.%m.%Y %H:%M")
            log(f"Parsed {count} EU records.")
    except Exception as e:
        log(f"Error fetching EU: {e}")

def fetch_ofac():
    log("Fetching OFAC List...")
    url = 'https://www.treasury.gov/ofac/downloads/sdn.csv'
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req) as response:
            csv_content = response.read().decode('utf-8')
            reader = csv.reader(io.StringIO(csv_content))
            
            count = 0
            for row in reader:
                if len(row) > 11:
                    name = row[1]
                    if name and name != "-0- ":
                        details_parts = []
                        if len(row) > 3 and row[3]: details_parts.append(f"Program: {row[3]}")
                        if len(row) > 11 and row[11]: details_parts.append(f"Remarks: {row[11]}")
                        
                        # Add more fields if available (Title, Call_Sign, Vess_Type, Tonnage, GRT, Vess_Flag, Vess_Owner)
                        # Indices based on standard SDN.csv format:
                        # 0: ent_num, 1: SDN_Name, 2: SDN_Type, 3: Program, 4: Title, 5: Call_Sign, 6: Vess_Type, 7: Tonnage, 8: GRT, 9: Vess_Flag, 10: Vess_Owner, 11: Remarks
                        
                        if len(row) > 4 and row[4] and row[4] != "-0- ": details_parts.append(f"Title: {row[4]}")
                        if len(row) > 5 and row[5] and row[5] != "-0- ": details_parts.append(f"Call Sign: {row[5]}")
                        if len(row) > 6 and row[6] and row[6] != "-0- ": details_parts.append(f"Vessel Type: {row[6]}")
                        if len(row) > 9 and row[9] and row[9] != "-0- ": details_parts.append(f"Flag: {row[9]}")

                        source_details = " | ".join(details_parts)

                        consolidated_data.append({
                            'name': name,
                            'list': 'OFAC SDN',
                            'type': row[2], # SDN_Type
                            'originalId': row[0],
                            'sourceDetails': source_details
                        })
                        count += 1
            
            meta_data["sources"]["OFAC"]["count"] = count
            meta_data["sources"]["OFAC"]["lastUpdated"] = datetime.datetime.now().strftime("%d.%m.%Y %H:%M")
            log(f"Parsed {count} OFAC records.")
    except Exception as e:
        log(f"Error fetching OFAC: {e}")

# --- 2. Domestic Lists (Resmi Gazete & MASAK) ---

def check_daily_gazette(date=None):
    if date is None:
        date = datetime.date.today()
    
    date_str = date.strftime("%d%m%Y")
    url = f"{RESMI_GAZETE_URL}/eskiler/{date.strftime('%Y/%m')}/{date_str}.htm"
    
    # log(f"Checking Resmi Gazete for {date_str}...")
    
    try:
        response = requests.get(url, timeout=10)
        if response.status_code != 200:
            return []
            
        soup = BeautifulSoup(response.content, 'html.parser')
        links = []
        
        # Keywords for sanctions/asset freezing AND lifting
        keywords = ["mal varlığı", "dondurma", "terörizm", "finansman", "6415", "terörle mücadele", "kaldırılması", "yürürlükten"]
        
        for a in soup.find_all('a', href=True):
            title = a.get_text(strip=True).lower()
            if any(k in title for k in keywords) and "javascript" not in a['href']:
                href = a['href']
                if not href.startswith('http'):
                    if href.startswith('/'):
                        full_url = f"{RESMI_GAZETE_URL}{href}"
                    else:
                        full_url = f"{RESMI_GAZETE_URL}/eskiler/{date.strftime('%Y/%m')}/{href}"
                else:
                    full_url = href
                
                log(f"Found relevant decree: {title}")
                links.append({
                    'url': full_url,
                    'title': a.get_text(strip=True), # Keep original case for display
                    'date': date.strftime("%d.%m.%Y")
                })
                
        return links
    except Exception as e:
        # log(f"Error checking gazette: {e}")
        return []

def extract_names_from_pdf(pdf_url):
    log(f"Processing PDF: {pdf_url}")
    try:
        response = session.get(pdf_url, timeout=30, verify=False)
        if response.status_code != 200:
            return []
            
        extracted_records = []
        with pdfplumber.open(io.BytesIO(response.content)) as pdf:
            for page in pdf.pages:
                tables = page.extract_tables()
                for table in tables:
                    if not table: continue
                    
                    # Identify columns
                    header = table[0]
                    col_map = {"name": -1, "tckn": -1, "dob": -1, "pob": -1}
                    header_row_idx = -1
                    
                    for r_idx, row in enumerate(table):
                        for c_idx, col in enumerate(row):
                            if not col or not isinstance(col, str): continue
                            val = col.lower()
                            if "adı" in val or "unvanı" in val or "isim" in val: col_map["name"] = c_idx
                            elif "tc" in val or "kimlik" in val or "vergi" in val: col_map["tckn"] = c_idx
                            elif "doğum tarihi" in val: col_map["dob"] = c_idx
                            elif "doğum yeri" in val: col_map["pob"] = c_idx
                        
                        if col_map["name"] != -1:
                            header_row_idx = r_idx
                            break
                    
                    if col_map["name"] != -1:
                        for row in table[header_row_idx+1:]:
                            if len(row) > col_map["name"] and row[col_map["name"]]:
                                name = row[col_map["name"]].strip()
                                name = re.sub(r'\s+', ' ', name)
                                
                                # Skip headers repeated in pages
                                if len(name) < 3 or any(x in name.lower() for x in ["adı", "soyadı", "unvanı"]): continue

                                record = {"name": name, "details": []}
                                
                                # Extract TCKN
                                if col_map["tckn"] != -1 and len(row) > col_map["tckn"]:
                                    tckn = row[col_map["tckn"]]
                                    if tckn: 
                                        tckn = tckn.strip().replace('\n', '')
                                        record["details"].append(f"TCKN/VKN: {tckn}")
                                
                                # Extract DOB
                                if col_map["dob"] != -1 and len(row) > col_map["dob"]:
                                    dob = row[col_map["dob"]]
                                    if dob: record["details"].append(f"Doğum Tarihi: {dob.strip()}")

                                # Extract POB
                                if col_map["pob"] != -1 and len(row) > col_map["pob"]:
                                    pob = row[col_map["pob"]]
                                    if pob: record["details"].append(f"Doğum Yeri: {pob.strip()}")
                                
                                extracted_records.append(record)
        
        log(f"Extracted {len(extracted_records)} records from PDF.")
        return extracted_records
    except Exception as e:
        log(f"Error parsing PDF: {e}")
        return []

def save_data():
    log(f"Saving {len(consolidated_data)} records to {OUTPUT_FILE}...")
    meta_data["lastUpdated"] = datetime.datetime.now().strftime("%d.%m.%Y %H:%M")
    
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json_str = json.dumps(consolidated_data, indent=2, ensure_ascii=False)
        meta_str = json.dumps(meta_data, indent=2, ensure_ascii=False)
        
        f.write(f"window.SANCTIONS_DATA = {json_str};\n")
        f.write(f"window.SANCTIONS_META = {meta_str};")

def fetch_domestic_data_historical():
    """
    NOT IMPLEMENTED: Resmi Gazete PDF Parsing
    
    SORUN: Resmi Gazete PDF'leri image-based (taramalı) olduğundan 
    text extraction yapılamıyor. OCR kullanmak çok yavaş olur (3650 gün tarama).
    
    ÇÖZÜM: Kullanıcılar Türkiye kaynaklı yaptırımlar için 
    MASAK'ın resmi web sitesini kontrol etmelidir:
    
    - 5. Madde (BM Kararları): https://masak.hmb.gov.tr/5-maddeye-iliskin-kararlari
    - 6. Madde (Yabancı Ülke): https://masak.hmb.gov.tr/6-maddeye-iliskin-bakanlar-kurulu-kararlari  
    - 7. Madde (İç Dondurma): https://masak.hmb.gov.tr/7-maddeye-iliskin-bakanlar-kurulu-kararlari
    
    Bu listeler manuel olarak kontrol edilmeli veya MASAK API entegrasyonu yapılmalıdır.
    """
    log("INFO: Domestic (TR) sanctions skipped - PDFs are image-based.")
    log("INFO: Please check MASAK website for Turkish sanctions:")
    log("  - https://masak.hmb.gov.tr/bkk-ile-malvarliklari-dondurulanlar")
    return []

if __name__ == "__main__":
    try:
        log("--- Starting Full Data Update (Python) ---")
        
        # Fetch international data
        fetch_un()
        fetch_eu()
        fetch_ofac()
        
        # Note about domestic data
        fetch_domestic_data_historical()
        
        # Save all data
        save_data()
        
        log("--- Full Update Complete ---")
        log(f"Total Records: {len(consolidated_data)}")
        log(f"  - UN: {meta_data['sources']['UN']['count']}")
        log(f"  - EU: {meta_data['sources']['EU']['count']}")
        log(f"  - OFAC: {meta_data['sources']['OFAC']['count']}")
        log(f"Saved to: {OUTPUT_FILE}")
        
    except Exception as e:
        log(f"ERROR in main: {e}")
        import traceback
        traceback.print_exc()

