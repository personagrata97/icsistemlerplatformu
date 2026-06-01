"""
MASAK Web Scraping - Edge Browser
Fetches Turkish sanctions data from MASAK website using Playwright with Edge browser
"""
import asyncio
from playwright.async_api import async_playwright
import json
import os
import re
from datetime import datetime

# Configuration
OUTPUT_FILE = os.path.join(os.path.dirname(__file__), '..', 'masak_data.json')
BASE_URL = "https://masak.hmb.gov.tr"

# Target URLs
URLS = {
    "BKK": f"{BASE_URL}/bkk-ile-malvarliklari-dondurulanlar",  # Bakanlar Kurulu Kararı
    "3A": f"{BASE_URL}/3a3b",  # BM Kararları
}

masak_data = []

def log(msg):
    print(f"[{datetime.now().strftime('%H:%M:%S')}] {msg}", flush=True)

def clean_text(text):
    """Clean and normalize text"""
    if not text:
        return ""
    # Remove extra whitespace
    text = re.sub(r'\s+', ' ', text).strip()
    return text

def extract_table_data(table_html):
    """Extract data from HTML table structure"""
    from bs4 import BeautifulSoup
    
    soup = BeautifulSoup(table_html, 'html.parser')
    rows = soup.find_all('tr')
    
    records = []
    headers = []
    
    for idx, row in enumerate(rows):
        cells = row.find_all(['td', 'th'])
        
        if idx == 0:  # Header row
            headers = [clean_text(cell.get_text()) for cell in cells]
            log(f"Table headers: {headers}")
            continue
        
        if len(cells) == 0:
            continue
            
        row_data = {}
        for i, cell in enumerate(cells):
            header = headers[i] if i < len(headers) else f"Column_{i}"
            row_data[header] = clean_text(cell.get_text())
        
        # Extract name (usually first column)
        name = None
        for key in ['Adı Soyadı', 'İsim', 'Ad Soyad', 'Adı ve Soyadı', 'Ünvanı']:
            if key in row_data and row_data[key]:
                name = row_data[key]
                break
        
        if not name and row_data:
            # Take first non-empty value
            name = next((v for v in row_data.values() if v), None)
        
        if name and len(name) > 2:
            records.append({
                'name': name,
                'details': row_data
            })
    
    return records

async def fetch_masak_page(page, url, list_type):
    """Fetch data from a MASAK page"""
    log(f"Fetching {list_type} from {url}...")
    
    try:
        # Navigate to page
        await page.goto(url, wait_until='networkidle', timeout=30000)
        
        # Wait for content to load
        await page.wait_for_timeout(3000)
        
        # Try to find tables
        tables = await page.query_selector_all('table')
        
        if not tables:
            log(f"No tables found on {list_type} page")
            # Try to get all text content
            content = await page.text_content('body')
            log(f"Page content preview: {content[:500]}...")
            return []
        
        log(f"Found {len(tables)} table(s) on {list_type} page")
        
        all_records = []
        for i, table in enumerate(tables):
            log(f"Processing table {i+1}...")
            table_html = await table.inner_html()
            records = extract_table_data(table_html)
            
            if records:
                log(f"Extracted {len(records)} records from table {i+1}")
                
                # Add list type to each record
                for record in records:
                    record['list'] = f'TR MASAK - {list_type}'
                    record['type'] = 'Individual/Entity'
                    record['sourceUrl'] = url
                    
                    # Format details as string
                    details_parts = []
                    for key, value in record['details'].items():
                        if key and value and key.lower() not in ['adı soyadı', 'isim', 'ad soyad', 'ünvanı']:
                            details_parts.append(f"{key}: {value}")
                    
                    record['sourceDetails'] = " | ".join(details_parts) if details_parts else f'MASAK {list_type}'
                    
                all_records.extend(records)
        
        return all_records
        
    except Exception as e:
        log(f"Error fetching {list_type}: {e}")
        return []

async def fetch_pdf_links(page, url):
    """Fetch PDF download links from MASAK pages"""
    log(f"Looking for PDF links at {url}...")
    
    try:
        await page.goto(url, wait_until='networkidle', timeout=30000)
        await page.wait_for_timeout(2000)
        
        # Find all PDF links
        pdf_links = await page.query_selector_all('a[href*=".pdf"], a[href*=".PDF"]')
        
        links = []
        for link in pdf_links:
            href = await link.get_attribute('href')
            text = await link.text_content()
            
            if href:
                # Make absolute URL
                if not href.startswith('http'):
                    href = f"{BASE_URL}{href}" if href.startswith('/') else f"{BASE_URL}/{href}"
                
                links.append({
                    'url': href,
                    'title': clean_text(text),
                })
                
        log(f"Found {len(links)} PDF links")
        return links
        
    except Exception as e:
        log(f"Error fetching PDF links: {e}")
        return []

async def main():
    log("--- Starting MASAK Data Fetch (Edge Browser) ---")
    
    async with async_playwright() as p:
        browser = None
        try:
            # Launch Edge browser
            log("Launching Microsoft Edge browser...")
            browser = await p.chromium.launch(
                channel="msedge",  # Use Microsoft Edge
                headless=False,  # Show browser for debugging
                args=['--start-maximized']
            )
            
            context = await browser.new_context(
                viewport={'width': 1920, 'height': 1080},
                user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0'
            )
            
            page = await context.new_page()
            
            # Fetch from each URL
            for list_name, url in URLS.items():
                records = await fetch_masak_page(page, url, list_name)
                masak_data.extend(records)
                
                # Also try to get PDF links for manual review
                pdf_links = await fetch_pdf_links(page, url)
                if pdf_links:
                    log(f"\nPDF Links for {list_name}:")
                    for link in pdf_links[:5]:  # Show first 5
                        log(f"  - {link['title']}: {link['url']}")
        
        except Exception as e:
            log(f"KRITIK HATA: {e}")
            import traceback
            traceback.print_exc()
        
        finally:
            # HER DURUMDA browser'ı kapat - Antigravity donmasını engeller
            if browser:
                log("Browser kapatiliyor...")
                try:
                    await browser.close()
                    log("[OK] Browser basariyla kapatildi")
                except Exception as e:
                    log(f"[!] Browser kapatma hatasi: {e}")
    
    # Save data
    log(f"\nSaving {len(masak_data)} MASAK records to {OUTPUT_FILE}...")
    
    output_data = {
        'lastUpdated': datetime.now().strftime("%d.%m.%Y %H:%M"),
        'count': len(masak_data),
        'source': 'MASAK - Mali Suçları Araştırma Kurulu',
        'data': masak_data
    }
    
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(output_data, f, indent=2, ensure_ascii=False)
    
    log(f"--- MASAK Fetch Complete ---")
    log(f"Total Records: {len(masak_data)}")
    
    if len(masak_data) > 0:
        log(f"\nSample record:")
        log(json.dumps(masak_data[0], indent=2, ensure_ascii=False))
    else:
        log("\n⚠️  No records extracted. The page structure might be different.")
        log("Please check the browser window and page content manually.")

if __name__ == "__main__":
    asyncio.run(main())
