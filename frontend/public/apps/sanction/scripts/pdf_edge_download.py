# -*- coding: utf-8 -*-
import asyncio
from playwright.async_api import async_playwright
import PyPDF2
import pandas as pd
import os
import sys

# UTF-8 encoding için
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding='utf-8')

async def download_pdf_with_edge():
    """Edge browser ile PDF indir ve Excel'e çevir"""
    
    pdf_url = "https://www.resmigazete.gov.tr/eskiler/2021/12/20211224-16.pdf"
    download_dir = r"C:\Users\sk36\.gemini\antigravity\scratch\sanction_scanner\downloads"
    
    # Downloads klasörünü oluştur
    os.makedirs(download_dir, exist_ok=True)
    
    print(">> Edge browser baslatiliyor...")
    
    async with async_playwright() as p:
        try:
            # Edge browser'ı başlat
            browser = await p.chromium.launch(
                channel="msedge",
                headless=False,
                downloads_path=download_dir
            )
            
            context = await browser.new_context(
                accept_downloads=True
            )
            
            page = await context.new_page()
            
            print(f">> PDF aciliyor: {pdf_url}")
            await page.goto(pdf_url, wait_until="networkidle")
            
            # PDF yüklenmesini bekle
            await page.wait_for_timeout(3000)
            
            print(">> PDF indiriliyor...")
            
            # Download başlat  
            async with page.expect_download() as download_info:
                # Ctrl+S ile kaydet
                await page.keyboard.press("Control+S")
                download = await download_info.value
                
                # Dosyayı kaydet
                pdf_path = os.path.join(download_dir, "20211224-16.pdf")
                await download.save_as(pdf_path)
                print(f"[OK] PDF indirildi: {pdf_path}")
            
            await browser.close()
            
            # PDF'i oku ve Excel'e çevir
            print("\n>> PDF okunuyor...")
            return process_pdf_to_excel(pdf_path)
            
        except Exception as e:
            print(f"[HATA] {e}")
            if 'browser' in locals():
                await browser.close()
            raise

def process_pdf_to_excel(pdf_path):
    """PDF'i oku ve Excel'e çevir"""
    
    try:
        # PDF oku
        with open(pdf_path, 'rb') as file:
            pdf_reader = PyPDF2.PdfReader(file)
            
            print(f">> Toplam {len(pdf_reader.pages)} sayfa bulundu")
            
            # Tüm metni çıkar
            all_text = ""
            for page_num in range(len(pdf_reader.pages)):
                page = pdf_reader.pages[page_num]
                text = page.extract_text()
                all_text += text + "\n"
                print(f"  - Sayfa {page_num + 1}/{len(pdf_reader.pages)} okundu")
        
        # Tam metni kaydet
        text_file = r"C:\Users\sk36\.gemini\antigravity\scratch\sanction_scanner\pdf_content.txt"
        with open(text_file, 'w', encoding='utf-8') as f:
            f.write(all_text)
        print(f"[OK] Metin kaydedildi: {text_file}")
        
        # Satırlara böl
        lines = all_text.split('\n')
        
        # Malvarlığı dondurma kayıtlarını bul
        records = []
        current_record = ""
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
            
            # Yeni bir madde numarası bulunursa (örn: "1)", "2.", vb.)
            if line and (line[0].isdigit() or line.startswith('•') or line.startswith('-')):
                if current_record:
                    records.append({'Icerik': current_record.strip()})
                current_record = line
            else:
                current_record += " " + line
        
        # Son kaydı ekle
        if current_record:
            records.append({'Icerik': current_record.strip()})
        
        print(f"\n>> {len(records)} kayit bulundu")
        
        # Excel'e kaydet
        if records:
            df = pd.DataFrame(records)
            
            # Sıra numarası ekle
            df.insert(0, 'Sira_No', range(1, len(df) + 1))
            
            excel_file = r"C:\Users\sk36\.gemini\antigravity\scratch\sanction_scanner\malvarligi_dondurulanlar.xlsx"
            df.to_excel(excel_file, index=False, engine='openpyxl')
            
            print(f"[OK] Excel dosyasi olusturuldu: {excel_file}")
            print(f"[OK] Toplam {len(df)} satir kaydedildi\n")
            
            # İlk 3 kaydı göster
            print("=== Ilk 3 Kayit ===")
            for idx, row in df.head(3).iterrows():
                content = row['Icerik'][:150] if len(row['Icerik']) > 150 else row['Icerik']
                print(f"\n{row['Sira_No']}. {content}...")
            
            return excel_file
        else:
            print("[UYARI] Hicbir kayit bulunamadi")
            return None
            
    except Exception as e:
        print(f"[HATA] PDF isleme hatasi: {e}")
        raise

if __name__ == "__main__":
    print("=" * 60)
    print("MALVARLIGI DONDURULANLAR - PDF TO EXCEL")
    print("=" * 60)
    
    result = asyncio.run(download_pdf_with_edge())
    
    if result:
        print(f"\n{'=' * 60}")
        print(f"[BASARILI] Islem tamamlandi!")
        print(f"[DOSYA] Excel dosyasi: {result}")
        print(f"{'=' * 60}")
