"""
MASAK Malvarlıkları Dondurulanlar - Otomatik İndirme

Bu script, MASAK sayfalarından Excel/CSV/Word dosyalarını otomatik bulup indirir.
Öncelik sırası: Excel > CSV > Word

Kullanım: python scripts/fetch_masak_download.py
"""

import json
import os
import traceback
from pathlib import Path
from datetime import datetime
import pandas as pd
import urllib.request
from playwright.sync_api import sync_playwright, TimeoutError as PlaywrightTimeoutError


def find_and_download_files(page, section_code, section_name, download_dir):
    """
    Sayfadaki Excel/CSV/Word indirme linklerini bul ve indir
    Öncelik: Excel > CSV > Word
    """
    downloaded_file = None
    
    try:
        print(f"\n[{section_code}] İndirme linkleri aranıyor...")
        
        # Önce Excel'i dene
        excel_links = page.locator('a[href*=".xlsx"], a[href*=".xls"]').all()
        if excel_links:
            for link in excel_links:
                try:
                    href = link.get_attribute('href')
                    if href and ('.xlsx' in href.lower() or '.xls' in href.lower()):
                        print(f"[{section_code}] ✓ Excel linki bulundu")
                        filepath = download_dir / f"masak_section_{section_code}.xlsx"
                        
                        # İndir
                        opener = urllib.request.build_opener()
                        opener.addheaders = [('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)')]
                        urllib.request.install_opener(opener)
                        urllib.request.urlretrieve(href, filepath)
                        
                        if filepath.exists() and filepath.stat().st_size > 100:
                            print(f"[{section_code}] ✓ Excel indirildi ({filepath.stat().st_size} bytes)")
                            return {'path': filepath, 'type': 'excel'}
                except Exception as e:
                    print(f"[{section_code}] Excel indirme denemesi başarısız: {e}")
                    continue
        
        # Excel bulunamadıysa CSV dene
        csv_links = page.locator('a[href*=".csv"]').all()
        if csv_links:
            for link in csv_links:
                try:
                    href = link.get_attribute('href')
                    if href and '.csv' in href.lower():
                        print(f"[{section_code}] ✓ CSV linki bulundu")
                        filepath = download_dir / f"masak_section_{section_code}.csv"
                        
                        opener = urllib.request.build_opener()
                        opener.addheaders = [('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)')]
                        urllib.request.install_opener(opener)
                        urllib.request.urlretrieve(href, filepath)
                        
                        if filepath.exists() and filepath.stat().st_size > 100:
                            print(f"[{section_code}] ✓ CSV indirildi ({filepath.stat().st_size} bytes)")
                            return {'path': filepath, 'type': 'csv'}
                except Exception as e:
                    print(f"[{section_code}] CSV indirme denemesi başarısız: {e}")
                    continue
        
        # CSV de bulunamadıysa Word dene
        word_links = page.locator('a[href*=".docx"], a[href*=".doc"]').all()
        if word_links:
            for link in word_links:
                try:
                    href = link.get_attribute('href')
                    if href and ('.docx' in href.lower() or '.doc' in href.lower()):
                        print(f"[{section_code}] ⚠ Sadece Word bulundu (Excel/CSV yok)")
                        filepath = download_dir / f"masak_section_{section_code}.docx"
                        
                        opener = urllib.request.build_opener()
                        opener.addheaders = [('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)')]
                        urllib.request.install_opener(opener)
                        urllib.request.urlretrieve(href, filepath)
                        
                        if filepath.exists() and filepath.stat().st_size > 100:
                            print(f"[{section_code}] ✓ Word indirildi ({filepath.stat().st_size} bytes)")
                            return {'path': filepath, 'type': 'word'}
                except Exception as e:
                    print(f"[{section_code}] Word indirme denemesi başarısız: {e}")
                    continue
        
        print(f"[{section_code}] ✗ Hiçbir indirme linki bulunamadı veya indirilemedi")
        return None
        
    except Exception as e:
        print(f"[{section_code}] ✗ Hata: {str(e)}")
        return None


def parse_excel_file(filepath, section_info):
    """
    Excel veya CSV dosyasını oku ve kayıtları çıkar
    """
    records = []
    section_code = section_info['code']
    section_name = section_info['name']
    
    try:
        print(f"\n[{section_code}] Parse ediliyor: {filepath.name}")
        
        # Dosya tipine göre oku
        if filepath.suffix.lower() in ['.xlsx', '.xls']:
            df = pd.read_excel(filepath, engine='openpyxl')
        elif filepath.suffix.lower() == '.csv':
            df = pd.read_csv(filepath, encoding='utf-8-sig')
        else:
            print(f"[{section_code}] ✗ Desteklenmeyen dosya formatı: {filepath.suffix}")
            return records
        
        print(f"[{section_code}] {len(df)} satır bulundu")
        
        # Sütun isimlerini temizle ve büyük harfe çevir
        df.columns = [str(col).strip().upper() for col in df.columns]
        
        # Sütun eşleştirme
        column_mapping = {
            'name': ['ADI SOYADI ÜNVANI', 'AD SOYAD', 'İSİM', 'NAME', 'ÜNVAN'],
            'tckn': ['TCKN/VKN/GKN PASAPORT NO', 'TCKN', 'TC KIMLIK NO', 'KIMLIK NO', 'VKN'],
            'nationality': ['UYRUĞU', 'UYRUK', 'NATIONALITY'],
            'sanction_type': ['M.V.D YAPTIRIM TÜRÜ', 'YAPTIRIM TÜRÜ', 'SANCTION TYPE'],
            'mother': ['ANNE ADI', 'ANNE', 'MOTHER NAME'],
            'father': ['BABA ADI', 'BABA', 'FATHER NAME'],
            'birth_date': ['DOĞUM TARİHİ', 'DOĞUM TARIHI', 'DOB', 'BIRTH DATE'],
            'birth_place': ['DOĞUM YERİ', 'DOĞUM YERI', 'BIRTH PLACE', 'POB']
        }
        
        # Sütunları bul
        found_columns = {}
        for field, possible_names in column_mapping.items():
            for col_name in possible_names:
                if col_name in df.columns:
                    found_columns[field] = col_name
                    break
        
        # En azından isim sütunu olmalı
        if 'name' not in found_columns:
            print(f"[{section_code}] ✗ İsim sütunu bulunamadı")
            print(f"[{section_code}] Mevcut sütunlar: {list(df.columns)}")
            return records
        
        # Her satırı işle
        valid_count = 0
        for idx, row in df.iterrows():
            try:
                # İsmi al
                name = str(row.get(found_columns['name'], '')).strip()
                
                # Boş veya geçersiz satırları atla
                if not name or name.lower() in ['nan', 'none', '']:
                    continue
                
                # Başlık satırlarını atla
                if any(keyword in name.upper() for keyword in ['ADI SOYADI', 'NAME', 'İSİM']):
                    continue
                
                # Diğer alanları al
                def get_field(field_name):
                    if field_name in found_columns:
                        value = str(row.get(found_columns[field_name], '')).strip()
                        return value if value.lower() not in ['nan', 'none', ''] else ''
                    return ''
                
                tckn = get_field('tckn')
                nationality = get_field('nationality')
                sanction_type = get_field('sanction_type')
                mother_name = get_field('mother')
                father_name = get_field('father')
                birth_date = get_field('birth_date')
                birth_place = get_field('birth_place')
                
                # Detay metni oluştur
                details_parts = []
                if nationality: details_parts.append(f"Uyruk: {nationality}")
                if mother_name: details_parts.append(f"Anne: {mother_name}")
                if father_name: details_parts.append(f"Baba: {father_name}")
                if birth_date: details_parts.append(f"Doğum Tarihi: {birth_date}")
                if birth_place: details_parts.append(f"Doğum Yeri: {birth_place}")
                if sanction_type: details_parts.append(f"Yaptırım: {sanction_type}")
                
                details = " | ".join(details_parts) if details_parts else ""
                
                # Entity mi Individual mı?
                entity_keywords = ['A.Ş.', 'LTD', 'ŞTİ', 'SAN.', 'TİC.', 'CORP', 'INC', 'LLC', 'FOUNDATION', 'VAKFI', 'DERNEĞİ']
                entity_type = "Entity" if any(kw in name.upper() for kw in entity_keywords) else "Individual"
                
                # Liste ismini ayarla
                list_name = f"TR MASAK - {section_name}"
                
                # Kayıt oluştur
                record = {
                    'name': name,
                    'list': list_name,
                    'type': entity_type,
                    'tckn': tckn if tckn else None,
                    'nationality': nationality,
                    'sanctionType': sanction_type,
                    'sourceDetails': details,
                    'motherName': mother_name,
                    'fatherName': father_name,
                    'birthDate': birth_date,
                    'birthPlace': birth_place,
                    'originalId': f'MASAK-{section_code}-{abs(hash(name + str(tckn)))}'
                }
                
                records.append(record)
                valid_count += 1
                
            except Exception as e:
                # Sessizce devam et
                continue
        
        print(f"[{section_code}] ✓ {valid_count} geçerli kayıt çıkarıldı")
        
    except Exception as e:
        print(f"[{section_code}] ✗ Parse hatası: {str(e)}")
        traceback.print_exc()
    
    return records


def main():
    """
    Ana fonksiyon - MASAK verilerini indir ve işle
    """
    print("\n" + "=" * 70)
    print("MASAK MALVARLIĞI DONDURMA LİSTESİ - OTOMATİK İNDİRME")
    print("=" * 70)
    
    # İndirme klasörü
    download_dir = Path("masak_downloads")
    download_dir.mkdir(exist_ok=True)
    
    # MASAK bölümleri
    sections = [
        {
            'code': 'A',
            'name': '5. Madde (BM Kararları)',
            'url': 'https://masak.hmb.gov.tr/5-maddeye-iliskin-bakanlar-kurulu-kararlari'
        },
        {
            'code': 'B',
            'name': '6. Madde (Yabancı Ülke)',
            'url': 'https://masak.hmb.gov.tr/6-maddeye-iliskin-bakanlar-kurulu-kararlari'
        },
        {
            'code': 'C',
            'name': '7. Madde (İç Dondurma)',
            'url': 'https://masak.hmb.gov.tr/7madde'
        },
        {
            'code': 'D',
            'name': '3A/3B Madde (Terör)',
            'url': 'https://masak.hmb.gov.tr/3a3b'
        }
    ]
    
    # 1. Playwright ile sayfaları ziyaret et ve dosyaları indir
    print("\n[ADIM 1] MASAK sayfaları ziyaret ediliyor ve dosyalar indiriliyor...")
    print("-" * 70)
    
    downloaded_files = []
    browser = None
    context = None
    
    try:
        with sync_playwright() as p:
            # Tek bir browser aç
            print("[*] Tarayıcı başlatılıyor...")
            browser = p.chromium.launch(
                headless=True,
                args=['--no-sandbox', '--disable-setuid-sandbox']
            )
            context = browser.new_context(accept_downloads=True)
            
            # Her bölüm için
            for section in sections:
                page = None
                try:
                    print(f"\n[{section['code']}] {section['name']}")
                    print(f"[{section['code']}] URL: {section['url']}")
                    
                    # Yeni sayfa aç
                    page = context.new_page()
                    
                    # Sayfaya git (basit timeout)
                    try:
                        page.goto(section['url'], wait_until='domcontentloaded', timeout=30000)
                        page.wait_for_timeout(2000)  # 2 saniye bekle
                    except PlaywrightTimeoutError:
                        print(f"[{section['code']}] ⚠ Sayfa yavaş yüklendi, devam ediliyor...")
                    
                    # İndirme linklerini bul ve indir
                    file_info = find_and_download_files(page, section['code'], section['name'], download_dir)
                    
                    if file_info:
                        file_info['section'] = section
                        downloaded_files.append(file_info)
                    
                except Exception as e:
                    print(f"[{section['code']}] ✗ Hata: {str(e)}")
                
                finally:
                    # Sayfayı kapat
                    if page:
                        try:
                            page.close()
                        except:
                            pass
            
    except Exception as e:
        print(f"\n✗ KRİTİK HATA: {str(e)}")
        traceback.print_exc()
    
    finally:
        # Temizlik - HER DURUMDA
        if context:
            try:
                context.close()
            except:
                pass
        if browser:
            try:
                browser.close()
                print("\n[*] Tarayıcı kapatıldı")
            except:
                pass
    
    # Sonuç kontrolü
    if not downloaded_files:
        print("\n✗ HİÇBİR DOSYA İNDİRİLEMEDİ!")
        return []
    
    print(f"\n✓ {len(downloaded_files)} dosya başarıyla indirildi")
    
    # 2. Dosyaları parse et
    print("\n[ADIM 2] Dosyalar parse ediliyor...")
    print("-" * 70)
    
    all_records = []
    for file_info in downloaded_files:
        # Sadece Excel ve CSV'yi parse et (Word'ü değil)
        if file_info['type'] in ['excel', 'csv']:
            records = parse_excel_file(file_info['path'], file_info['section'])
            all_records.extend(records)
        else:
            print(f"\n[{file_info['section']['code']}] ⚠ Word dosyası parse edilemedi (Excel/CSV bulunamadı)")
    
    # 3. Sonuçları raporla
    print("\n" + "=" * 70)
    print(f"TOPLAM: {len(all_records)} KAYIT ÇIKARILDI")
    print("=" * 70)
    
    if all_records:
        # İstatistikler
        lists = {}
        for record in all_records:
            list_name = record['list']
            lists[list_name] = lists.get(list_name, 0) + 1
        
        print("\n[İSTATİSTİK] Liste Dağılımı:")
        for list_name, count in sorted(lists.items()):
            print(f"  • {list_name}: {count} kayıt")
        
        # JSON'a kaydet
        output_file = 'masak_data.json'
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(all_records, f, ensure_ascii=False, indent=2)
        print(f"\n✓ JSON kaydedildi: {output_file}")
        
        # Frontend JS dosyası
        js_output_file = 'masak_data.js'
        with open(js_output_file, 'w', encoding='utf-8') as f:
            json_str = json.dumps(all_records, ensure_ascii=False)
            f.write(f"window.MASAK_DATA = {json_str};")
        print(f"✓ Frontend JS kaydedildi: {js_output_file}")
        
        # Güncelleme tarihi
        print(f"✓ Güncelleme: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        
        # Örnek kayıt
        if len(all_records) > 0:
            print("\n[ÖRNEK KAYIT]")
            print("-" * 70)
            example = all_records[0]
            print(json.dumps(example, ensure_ascii=False, indent=2))
        
        return all_records
    
    else:
        print("\n✗ HİÇBİR KAYIT ÇIKARıLAMADI!")
        return []


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n✗ İşlem kullanıcı tarafından iptal edildi")
    except Exception as e:
        print(f"\n\n✗ BEKLENMEYEN HATA: {str(e)}")
        traceback.print_exc()
