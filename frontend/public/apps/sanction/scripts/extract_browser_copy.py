# -*- coding: utf-8 -*-
"""
PDF screenshot'larından OCR ile metin çıkar
Tesseract gerekli değil, bunun yerine pillow ile basit metin tanıma yapabiliriz
veya Google Cloud Vision API kullanabiliriz. Basit yöntem: PDF2image + pytesseract
Ama Tesseract kurulu olmalı.

Alternatif: Online OCR servisi veya manuel entry... 
En iyi çözüm: Bu PDF'i doğrudan https://www.resmigazete.gov.tr sitesinden HTML olarak çekmek
"""

import asyncio
from playwright.async_api import async_playwright
import pandas as pd
import re
import sys

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding='utf-8')

async def scrape_pdf_text_from_browser():
    """
    Browser'da PDF'i açıp, copy-paste ile metni çıkar
    """
    
    pdf_url = "https://www.resmigazete.gov.tr/eskiler/2021/12/20211224-16.pdf"
    
    print("=" * 70)
    print("PDF METIN CIKARMA - BROWSER COPY METHOD")
    print("=" * 70)
    
    async with async_playwright() as p:
        try:
            # Edge browser başlat
            browser = await p.chromium.launch(
                channel="msedge",
                headless=False
            )
            
            context = await browser.new_context()
            page = await context.new_page()
            
            print(f"\n>> PDF aciliyor: {pdf_url}")
            await page.goto(pdf_url, wait_until="networkidle", timeout=60000)
            await page.wait_for_timeout(5000)
            
            # PDF viewer'da Ctrl+A ile tümünü seç, Ctrl+C ile kopyala
            print(f">> PDF icerigini kopyalama islemi basliyor...")
            
            # Focus PDF'e
            await page.keyboard.press("Tab")
            await page.wait_for_timeout(1000)
            
            # Tümünü seç
            await page.keyboard.press("Control+A")
            await page.wait_for_timeout(1000)
            
            # Kopyala
            await page.keyboard.press("Control+C")
            await page.wait_for_timeout(2000)
            
            # Clipboard'dan al (JavaScript kullanarak)
            clipboard_text = await page.evaluate("""
                async () => {
                    try {
                        const text = await navigator.clipboard.readText();
                        return text;
                    } catch (e) {
                        return 'Clipboard erisim hatasi: ' + e.message;
                    }
                }
            """)
            
            print(f"[OK] Clipboard'dan {len(clipboard_text)} karakter alindi")
            
            await browser.close()
            
            # Metni kaydet
            text_file = r"C:\Users\sk36\.gemini\antigravity\scratch\sanction_scanner\pdf_browser_text.txt"
            with open(text_file, 'w', encoding='utf-8') as f:
                f.write(clipboard_text)
            
            print(f"[OK] Metin kaydedildi: {text_file}")
            
            # Parse et
            print("\n>> Veriler parse ediliyor...")
            records = parse_clipboard_data(clipboard_text)
            
            if records:
                df = pd.DataFrame(records)
                excel_file = r"C:\Users\sk36\.gemini\antigravity\scratch\sanction_scanner\malvarligi_dondurulanlar_FINAL.xlsx"
                df.to_excel(excel_file, index=False, engine='openpyxl')
                
                print(f"\n[BASARILI] Excel dosyasi: {excel_file}")
                print(f"[BASARILI] Toplam {len(df)} kayit\n")
                
                print("=" * 70)
                print("ILK 10 KAYIT:")
                print("=" * 70)
                for idx, row in df.head(10).iterrows():
                    print(f"{idx+1}. {row.get('Ham_Veri', '')[:100]}...")
                
                return excel_file
            else:
                print("\n[ UYARI] Parse edilemedi!")
                print(f"Metin uzunlugu: {len(clipboard_text)} karakter")
                print(f"Ilk 500 karakter:\n{clipboard_text[:500]}")
                return None
                
        except Exception as e:
            print(f"[HATA] {e}")
            if 'browser' in locals():
                await browser.close()
            raise

def parse_clipboard_data(text):
    """Clipboard'dan alınan metni parse et"""
    
    records = []
    lines = text.split('\n')
    
    current_record = {}
    
    for line in lines:
        line = line.strip()
        if not line:
            continue
        
        # Sıra numarası ile başlıyorsa
        num_match = re.match(r'^(\d+)\)', line)
        if num_match:
            if current_record:
                records.append(current_record)
            
            current_record = {
                'Sira_No': num_match.group( 1),
                'Ham_Veri': line
            }
        elif current_record:
            current_record['Ham_Veri'] = current_record.get('Ham_Veri', '') + ' ' + line
    
    if current_record:
        records.append(current_record)
    
    # Bilgileri çıkar
    for record in records:
        ham = record.get('Ham_Veri', '')
        
        # TC
        tc_match = re.search(r'\b(\d{11})\b', ham)
        if tc_match:
            record['TC_No'] = tc_match.group(1)
        
        # İsim (numaradan sonra gelen kısım)
        name_match = re.match(r'^\d+\)\s*(.+?)(?:\s+\d{11}|\s+[A-Z]\d{7}|$)', ham)
        if name_match:
            record['Isim'] = name_match.group(1).strip()
    
    return records

if __name__ == "__main__":
    result = asyncio.run(scrape_pdf_text_from_browser())
    
    if result:
        print(f"\n{'=' * 70}")
        print(f"[TAMAMLANDI] {result}")
        print(f"{'=' * 70}")
