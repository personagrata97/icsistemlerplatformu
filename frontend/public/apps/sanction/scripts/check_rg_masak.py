#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Resmi Gazete MASAK/Yaptırım Karar Tarayıcı
Günlük Resmi Gazete'yi tarayarak malvarlığı dondurma kararlarını kontrol eder.
"""

import urllib.request
import ssl
import json
import os
import re
from datetime import datetime
from html.parser import HTMLParser

# SSL doğrulamasını devre dışı bırak
ssl._create_default_https_context = ssl._create_unverified_context

# Dosya yolları
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
ALERT_FILE = os.path.join(SCRIPT_DIR, '..', 'rg_alert_status.js')

# Aranacak anahtar kelimeler (MASAK/yaptırım ile ilgili)
KEYWORDS = [
    # Malvarlığı dondurma varyasyonları
    'malvarlığı dondurma',
    'malvarlıklarının dondurulması',
    'malvarlığının dondurulması',
    'mal varlığı dondurma',
    'mal varlıklarının dondurulması',
    # Kanun numaraları
    '6415 sayılı',
    '7262 sayılı',
    '6415',
    '7262',
    # Terörizm/terör
    'terörizmin finansmanı',
    'terörün finansmanı',
    'terör örgütü',
    'terörle mücadele',
    # MASAK
    'masak',
    'mali suçları araştırma',
    # Yaptırım
    'yaptırım',
    'uluslararası yaptırım',
    # BM/BMGK
    'birleşmiş milletler güvenlik konseyi',
    'bmgk',
    # Diğer
    'kara para',
    'suç geliri',
    'suç gelirleri',
]

class ResmiGazeteScraper(HTMLParser):
    """Resmi Gazete ana sayfasından karar başlıklarını çeker"""
    
    def __init__(self):
        super().__init__()
        self.in_link = False
        self.current_href = ""
        self.decisions = []
        self.current_text = ""
        self.gazette_date = ""
        self.gazette_number = ""
    
    def handle_starttag(self, tag, attrs):
        if tag == 'a':
            attrs_dict = dict(attrs)
            href = attrs_dict.get('href', '')
            if 'eskiler' in href or 'htm' in href or 'pdf' in href:
                self.in_link = True
                self.current_href = href
                self.current_text = ""
        elif tag == 'h6':
            self.in_link = True
            self.current_text = ""
    
    def handle_endtag(self, tag):
        if tag == 'a' and self.in_link:
            if self.current_text.strip():
                self.decisions.append({
                    'title': self.current_text.strip(),
                    'url': self.current_href
                })
            self.in_link = False
        elif tag == 'h6' and self.in_link:
            # Gazete tarih ve sayısı h6 içinde
            text = self.current_text.strip()
            if 'Tarihli' in text and 'Sayılı' in text:
                # "05 Aralık 2025 Tarihli ve 33098 Sayılı Resmî Gazete"
                date_match = re.search(r'(\d{2})\s+(\w+)\s+(\d{4})', text)
                number_match = re.search(r'(\d+)\s+Sayılı', text)
                if date_match:
                    self.gazette_date = f"{date_match.group(1)} {date_match.group(2)} {date_match.group(3)}"
                if number_match:
                    self.gazette_number = number_match.group(1)
            self.in_link = False
    
    def handle_data(self, data):
        if self.in_link:
            self.current_text += data

def fetch_resmi_gazete():
    """Resmi Gazete ana sayfasını çeker ve ayrıştırır"""
    url = "https://www.resmigazete.gov.tr/default.aspx"
    
    try:
        req = urllib.request.Request(url, headers={
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        })
        
        with urllib.request.urlopen(req, timeout=30) as response:
            html = response.read().decode('utf-8')
            
        parser = ResmiGazeteScraper()
        parser.feed(html)
        
        return {
            'date': parser.gazette_date,
            'number': parser.gazette_number,
            'decisions': parser.decisions
        }
    except Exception as e:
        print(f"Hata: Resmi Gazete'ye erişilemedi - {e}")
        return None

def check_for_masak_decisions(decisions):
    """Kararlar içinde MASAK ile ilgili olanları bulur"""
    found = []
    
    for decision in decisions:
        title_lower = decision['title'].lower()
        for keyword in KEYWORDS:
            if keyword.lower() in title_lower:
                found.append({
                    'title': decision['title'],
                    'url': decision['url'],
                    'matched_keyword': keyword
                })
                break  # Aynı kararı birden fazla ekleme
    
    return found

def save_alert_status(status):
    """Alert durumunu JS dosyasına kaydeder (browser için)"""
    json_str = json.dumps(status, ensure_ascii=False, indent=2)
    js_content = f"// Resmi Gazete Tarama Sonucu - Otomatik oluşturuldu\n// Son güncelleme: {status.get('scan_time', '')}\nwindow.RG_ALERT_STATUS = {json_str};"
    with open(ALERT_FILE, 'w', encoding='utf-8') as f:
        f.write(js_content)
    print(f"Alert durumu kaydedildi: {ALERT_FILE}")

def main():
    print("=" * 60)
    print("Resmi Gazete MASAK Tarayıcı")
    print("=" * 60)
    
    # Resmi Gazete'yi tara
    print("\nResmi Gazete taranıyor...")
    data = fetch_resmi_gazete()
    
    if not data:
        status = {
            'scanned': False,
            'scan_time': datetime.now().isoformat(),
            'error': 'Resmi Gazete sitesine erişilemedi',
            'found_decisions': []
        }
        save_alert_status(status)
        return
    
    print(f"\nTarih: {data['date']}")
    print(f"Sayı: {data['number']}")
    print(f"Toplam karar sayısı: {len(data['decisions'])}")
    
    # MASAK ile ilgili kararları kontrol et
    print("\nMASAK/Yaptırım kararları aranıyor...")
    masak_decisions = check_for_masak_decisions(data['decisions'])
    
    status = {
        'scanned': True,
        'scan_time': datetime.now().isoformat(),
        'gazette_date': data['date'],
        'gazette_number': data['number'],
        'total_decisions': len(data['decisions']),
        'found_count': len(masak_decisions),
        'found_decisions': masak_decisions,
        'has_alert': len(masak_decisions) > 0
    }
    
    if masak_decisions:
        print(f"\n[!] {len(masak_decisions)} ADET MASAK/YAPTIRIM KARARI BULUNDU!")
        for i, d in enumerate(masak_decisions, 1):
            print(f"  {i}. {d['title']}")
            print(f"     Eşleşen: '{d['matched_keyword']}'")
    else:
        print("\n[OK] MASAK/Yaptirim ile ilgili yeni karar bulunamadi.")
    
    save_alert_status(status)
    print("\n" + "=" * 60)

if __name__ == "__main__":
    main()
