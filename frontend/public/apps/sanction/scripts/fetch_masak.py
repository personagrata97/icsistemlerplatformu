"""
MASAK Scraper - Selenium ile malvarlığı dondurma listelerini çeker
"""
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
import time
import json

def setup_driver():
    options = Options()
    options.add_argument('--headless')
    options.add_argument('--no-sandbox')
    options.add_argument('--disable-dev-shm-usage')
    options.add_argument('--disable-gpu')
    options.add_argument('user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36')
    
    driver = webdriver.Chrome(options=options)
    return driver

def fetch_masak_list(url, list_name):
    """Fetch data from a single MASAK list page"""
    driver = setup_driver()
    data = []
    
    try:
        print(f"Fetching {list_name} from {url}...")
        driver.get(url)
        
        # Wait for table to load
        wait = WebDriverWait(driver, 20)
        wait.until(EC.presence_of_element_located((By.TAG_NAME, "table")))
        
        time.sleep(2)  # Additional wait for dynamic content
        
        # Find table rows
        table = driver.find_element(By.TAG_NAME, "table")
        rows = table.find_elements(By.TAG_NAME, "tr")
        
        print(f"Found {len(rows)} rows")
        
        for row in rows[1:]:  # Skip header
            cells = row.find_elements(By.TAG_NAME, "td")
            if len(cells) >= 2:
                name = cells[0].text.strip()
                details = cells[1].text.strip() if len(cells) > 1 else ""
                
                if name and name not in ["", "No data available"]:
                    data.append({
                        'name': name,
                        'list': f'TR MASAK - {list_name}',
                        'type': 'Individual',
                        'sourceDetails': details,
                        'originalId': f'MASAK-{list_name}-{hash(name)}'
                    })
        
        print(f"Extracted {len(data)} records from {list_name}")
        
    except Exception as e:
        print(f"Error fetching {list_name}: {e}")
    finally:
        driver.quit()
    
    return data

def fetch_all_masak_data():
    """Fetch all MASAK lists (5th, 6th, 7th articles)"""
    all_data = []
    
    # 5. Madde - UN based
    data_5 = fetch_masak_list(
        "https://masak.hmb.gov.tr/5-maddeye-iliskin-kararlari",
        "5. Madde (BM Kararları)"
    )
    all_data.extend(data_5)
    
    # 6. Madde - Foreign country requests
    data_6 = fetch_masak_list(
        "https://masak.hmb.gov.tr/6-maddeye-iliskin-bakanlar-kurulu-kararlari",
        "6. Madde (Yabancı Ülke)"
    )
    all_data.extend(data_6)
    
    # 7. Madde - Domestic freezing
    data_7 = fetch_masak_list(
        "https://masak.hmb.gov.tr/7madde",
        "7. Madde (İç Dondurma)"
    )
    all_data.extend(data_7)
    
    return all_data

if __name__ == "__main__":
    print("Starting MASAK data fetch...")
    masak_data = fetch_all_masak_data()
    
    print(f"\nTotal MASAK records: {len(masak_data)}")
    
    # Save to JSON
    with open('masak_data.json', 'w', encoding='utf-8') as f:
        json.dump(masak_data, f, ensure_ascii=False, indent=2)
    
    print("Saved to masak_data.json")
