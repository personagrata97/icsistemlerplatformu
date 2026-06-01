"""
MASAK Scraper - Simple version without Selenium
Tries to parse HTML directly from MASAK pages
"""
import requests
from bs4 import BeautifulSoup
import json
import urllib3

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

def fetch_masak_simple(url, list_name):
    """Try to fetch MASAK data without JavaScript rendering"""
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
    
    try:
        print(f"Fetching {list_name} from {url}...")
        response = requests.get(url, headers=headers, verify=False, timeout=30)
        
        if response.status_code != 200:
            print(f"  Failed: HTTP {response.status_code}")
            return []
        
        # Save HTML for inspection
        with open(f'masak_{list_name.replace(" ", "_")}.html', 'w', encoding='utf-8') as f:
            f.write(response.text)
        
        soup = BeautifulSoup(response.content, 'html.parser')
        
        # Try to find tables
        tables = soup.find_all('table')
        print(f"  Found {len(tables)} tables")
        
        data = []
        for table in tables:
            rows = table.find_all('tr')
            print(f"    Table has {len(rows)} rows")
            
            for row in rows[1:]:  # Skip header
                cells = row.find_all(['td', 'th'])
                if len(cells) >= 1:
                    name = cells[0].get_text(strip=True)
                    details = cells[1].get_text(strip=True) if len(cells) > 1 else ""
                    
                    if name and len(name) > 2:
                        data.append({
                            'name': name,
                            'list': f'TR MASAK - {list_name}',
                            'type': 'Individual',
                            'sourceDetails': details,
                            'originalId': f'MASAK-{list_name}-{hash(name)}'
                        })
        
        print(f"  Extracted {len(data)} records")
        return data
        
    except Exception as e:
        print(f"  Error: {e}")
        return []

if __name__ == "__main__":
    print("=== MASAK Data Fetch (Simple Mode) ===\n")
    
    all_data = []
    
    # Test with 7th article (most likely to have data)
    data_7 = fetch_masak_simple(
        "https://masak.hmb.gov.tr/7madde",
        "7.Madde"
    )
    all_data.extend(data_7)
    
    print(f"\nTotal records: {len(all_data)}")
    
    if all_data:
        with open('masak_data_simple.json', 'w', encoding='utf-8') as f:
            json.dump(all_data, f, ensure_ascii=False, indent=2)
        print("Saved to masak_data_simple.json")
    else:
        print("\nNOTE: Page is JavaScript-rendered. Selenium required.")
        print("Alternative: Manual CSV download from MASAK website")
