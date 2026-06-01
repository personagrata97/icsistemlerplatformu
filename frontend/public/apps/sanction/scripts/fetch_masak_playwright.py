"""
MASAK Scraper - Playwright version (robust)
Kullanım: py scripts/fetch_masak_playwright.py
"""
from playwright.sync_api import sync_playwright
import json
import time

def fetch_masak_with_playwright(url, list_name):
    """Fetch MASAK data using Playwright"""
    data = []
    
    with sync_playwright() as p:
        browser = None
        try:
            print(f"\n=== Fetching {list_name} ===")
            print(f"URL: {url}")
            
            browser = p.chromium.launch(headless=True)
            page = browser.new_page()
            
            # Navigate
            page.goto(url, wait_until='networkidle', timeout=60000)
            time.sleep(3)  # Extra wait for any async rendering
            
            # Try to find table
            tables = page.query_selector_all('table')
            print(f"Found {len(tables)} table(s)")
            
            if not tables:
                # Try to find any div with class containing 'table' or 'list'
                divs = page.query_selector_all('div')
                print(f"Checking {len(divs)} divs for data...")
                
                # Save HTML for debugging
                html_content = page.content()
                with open(f'masak_{list_name.replace(" ", "_")}_debug.html', 'w', encoding='utf-8') as f:
                    f.write(html_content)
                print(f"Saved HTML to masak_{list_name.replace(' ', '_')}_debug.html")
            
            for table_idx, table in enumerate(tables):
                rows = table.query_selector_all('tr')
                print(f"Table {table_idx + 1}: {len(rows)} rows")
                
                for row_idx, row in enumerate(rows):
                    cells = row.query_selector_all('td, th')
                    
                    if len(cells) >= 1:
                        # First cell is usually the name
                        name_cell = cells[0]
                        name = name_cell.inner_text().strip()
                        
                        # Second cell might be details
                        details = ""
                        if len(cells) > 1:
                            details = cells[1].inner_text().strip()
                        
                        # Skip headers and empty rows
                        if name and len(name) > 2 and not name.lower() in ['no', 'sıra', 'isim', 'ad', 'name']:
                            data.append({
                                'name': name,
                                'list': f'TR MASAK - {list_name}',
                                'type': 'Individual',
                                'sourceDetails': details if details else f'Kaynak: {url}',
                                'originalId': f'MASAK-{list_name}-{abs(hash(name))}'
                            })
            
            print(f"✓ Extracted {len(data)} records from {list_name}")
            
        except Exception as e:
            print(f"✗ Error fetching {list_name}: {e}")
            import traceback
            traceback.print_exc()
        
        finally:
            # HER DURUMDA browser'ı kapat - Antigravity donmasını engeller
            if browser:
                try:
                    browser.close()
                    print(f"[OK] Browser kapatildi")
                except Exception as e:
                    print(f"[!] Browser kapatma hatasi: {e}")
    
    return data

def main():
    print("="*60)
    print("MASAK Data Scraper (Playwright)")
    print("="*60)
    
    all_data = []
    
    # 5. Madde - UN based sanctions
    data_5 = fetch_masak_with_playwright(
        "https://masak.hmb.gov.tr/5-maddeye-iliskin-kararlari",
        "5. Madde (BM Kararları)"
    )
    all_data.extend(data_5)
    
    # 6. Madde - Foreign requests
    data_6 = fetch_masak_with_playwright(
        "https://masak.hmb.gov.tr/6-maddeye-iliskin-bakanlar-kurulu-kararlari",
        "6. Madde (Yabancı Ülke)"
    )
    all_data.extend(data_6)
    
    # 7. Madde - Domestic freezing
    data_7 = fetch_masak_with_playwright(
        "https://masak.hmb.gov.tr/7madde",
        "7. Madde (İç Dondurma)"
    )
    all_data.extend(data_7)
    
    print("\n" + "="*60)
    print(f"TOTAL RECORDS: {len(all_data)}")
    print("="*60)
    
    if all_data:
        output_file = 'masak_data.json'
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(all_data, f, ensure_ascii=False, indent=2)
        print(f"\n✓ Saved {len(all_data)} records to {output_file}")
    else:
        print("\n✗ No data extracted. Check debug HTML files.")
    
    return all_data

if __name__ == "__main__":
    main()
