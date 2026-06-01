import urllib.request
import xml.etree.ElementTree as ET
import csv
import json
import ssl
import sys
import io
import os

# Disable SSL verification for simplicity (avoid cert errors)
ssl._create_default_https_context = ssl._create_unverified_context

# Save to parent directory (project root)
DATA_FILE = os.path.join(os.path.dirname(__file__), '..', 'sanctions_data.js')

SOURCES = {
    'UN': 'https://scsanctions.un.org/resources/xml/en/consolidated.xml',
    'EU': 'https://webgate.ec.europa.eu/europeaid/fsd/fsf/public/files/xmlFullSanctionsList/content?token=dG9rZW4tMjAxNw',
    'OFAC': 'https://www.treasury.gov/ofac/downloads/sdn.csv'
}

consolidated_data = []

def fetch_un():
    print("Fetching UN List...")
    try:
        req = urllib.request.Request(SOURCES['UN'], headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req) as response:
            xml_content = response.read()
            root = ET.fromstring(xml_content)
            
            # Individuals
            for individual in root.findall('.//INDIVIDUAL'):
                first_name = individual.find('FIRST_NAME').text if individual.find('FIRST_NAME') is not None else ''
                second_name = individual.find('SECOND_NAME').text if individual.find('SECOND_NAME') is not None else ''
                third_name = individual.find('THIRD_NAME').text if individual.find('THIRD_NAME') is not None else ''
                name = f"{first_name} {second_name} {third_name}".strip()
                
                consolidated_data.append({
                    'name': name,
                    'list': 'UN Consolidated',
                    'type': 'Individual',
                    'originalId': individual.find('DATAID').text
                })

            # Entities
            for entity in root.findall('.//ENTITY'):
                name = entity.find('FIRST_NAME').text if entity.find('FIRST_NAME') is not None else ''
                consolidated_data.append({
                    'name': name,
                    'list': 'UN Consolidated',
                    'type': 'Entity',
                    'originalId': entity.find('DATAID').text
                })
            print(f"Parsed UN records.")
    except Exception as e:
        print(f"Error fetching UN: {e}")

def fetch_eu():
    print("Fetching EU List...")
    try:
        req = urllib.request.Request(SOURCES['EU'], headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req) as response:
            xml_content = response.read()
            root = ET.fromstring(xml_content)
            
            count = 0
            for entity in root.findall('.//sanctionEntity'):
                name_alias = entity.find('.//nameAlias')
                if name_alias is not None:
                    name = name_alias.find('wholeName').text
                    consolidated_data.append({
                        'name': name,
                        'list': 'EU Financial Sanctions',
                        'type': 'Entity/Individual',
                        'originalId': entity.get('logicalId')
                    })
                    count += 1
            print(f"Parsed {count} EU records.")
    except Exception as e:
        print(f"Error fetching EU: {e}")

def fetch_ofac():
    print("Fetching OFAC List...")
    try:
        req = urllib.request.Request(SOURCES['OFAC'], headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req) as response:
            csv_content = response.read().decode('utf-8')
            reader = csv.reader(io.StringIO(csv_content))
            
            count = 0
            for row in reader:
                if len(row) > 1:
                    # OFAC CSV format: ent_num, SDN_Name, SDN_Type, ...
                    consolidated_data.append({
                        'name': row[1], # SDN_Name
                        'list': 'OFAC SDN',
                        'type': row[2], # SDN_Type
                        'originalId': row[0]
                    })
                    count += 1
            print(f"Parsed {count} OFAC records.")
    except Exception as e:
        print(f"Error fetching OFAC: {e}")

def main():
    fetch_un()
    fetch_eu()
    fetch_ofac()
    
    # Write as JS file
    with open(DATA_FILE, 'w', encoding='utf-8') as f:
        json_str = json.dumps(consolidated_data, indent=2, ensure_ascii=False)
        f.write(f"window.SANCTIONS_DATA = {json_str};")
    
    print(f"Total records saved to {DATA_FILE}: {len(consolidated_data)}")

if __name__ == "__main__":
    main()
