"""
MASAK Malvarlıkları Dondurulanlar - Otomatik Veri Çekme
Kullanım: python scripts/fetch_masak_new.py

Bu script https://masak.hmb.gov.tr/bkk-ile-malvarliklari-dondurulanlar
sayfasından TÜM malvarlığı dondurulmuş kişi/kuruluşları çeker.
"""

from playwright.sync_api import sync_playwright
import json
import time
from datetime import datetime

def fetch_all_masak_data():
    """
    MASAK'tan tüm malvarlığı dondurulmuş kişi/kuruluşları çeker
    A-B-C-D sekmelerindeki tüm verileri toplar
    """
    all_data = []
    
    with sync_playwright() as p:
        print("🚀 MASAK Veri Çekme Başlıyor...")
        print("=" * 70)
        
        browser = p.chromium.launch(headless=False)  # Debug için görünür
        page = browser.new_page()
        
        # Ana sayfaya git
        url = "https://masak.hmb.gov.tr/bkk-ile-malvarliklari-dondurulanlar"
        print(f"\n📍 Sayfa açılıyor: {url}")
        page.goto(url, wait_until='networkidle', timeout=60000)
        time.sleep(2)
        
        # Boş arama yap (tüm verileri getirmek için)
        print("\n🔍 Arama yapılıyor (tüm veriler)...")
        try:
            # Arama butonunu bul ve tıkla
            search_button = page.locator('button:has-text("Kişi Ünvan Araması Yap")')
            if search_button.count() > 0:
                search_button.click()
                time.sleep(3)  # Verilerin yüklenmesi için bekle
            else:
                print("⚠️ Arama butonu bulunamadı, alternatif yöntem deneniyor...")
                page.click('button[type="submit"]')
                time.sleep(3)
        except Exception as e:
            print(f"⚠️ Arama butonu hatası: {e}")
        
        # Tabloyu bul ve scroll yap
        print("\n📊 Tablo bulunuyor ve kaydırılıyor...")
        try:
            # Table container'ı bul
            table_container = page.locator('div.table-responsive')
            
            if table_container.count() > 0:
                # Scroll to end to load all data
                print("   🔄 Tablo sonuna kadar kaydırılıyor (tüm veri yükleniyor)...")
                
                # Multiple scrolls to ensure all data is loaded
                for i in range(10):  # 10 kez scroll yap
                    table_container.evaluate('el => el.scrollTop = el.scrollHeight')
                    time.sleep(0.5)
                    print(f"   Scroll {i+1}/10 tamamlandı")
                
                print("   ✅ Tüm veri yüklendi")
                
                # Tablodan verileri çek
                print("\n📝 Veriler işleniyor...")
                
                # Her satırı al
                rows = page.locator('tbody tr').all()
                
                print(f"   Toplam {len(rows)} satır bulundu")
                
                for idx, row in enumerate(rows, 1):
                    try:
                        cells = row.locator('td').all()
                        
                        if len(cells) >= 8:
                            # Hücre içeriklerini al
                            name = cells[0].inner_text().strip()
                            tckn = cells[1].inner_text().strip()
                            nationality = cells[2].inner_text().strip()
                            sanction_type = cells[3].inner_text().strip()
                            mother_name = cells[4].inner_text().strip() if len(cells) > 4 else ""
                            father_name = cells[5].inner_text().strip() if len(cells) > 5 else ""
                            birth_date = cells[6].inner_text().strip() if len(cells) > 6 else ""
                            birth_place = cells[7].inner_text().strip() if len(cells) > 7 else ""
                            
                            # Skip header rows
                            if name and name.upper() not in ['ADI SOYADI ÜNVANI', 'AD SOYAD', 'İSİM']:
                                # Detay bilgilerini birleştir
                                details_parts = []
                                if nationality: details_parts.append(f"Uyruk: {nationality}")
                                if mother_name: details_parts.append(f"Anne Adı: {mother_name}")
                                if father_name: details_parts.append(f"Baba Adı: {father_name}")
                                if birth_date: details_parts.append(f"Doğum Tarihi: {birth_date}")
                                if birth_place: details_parts.append(f"Doğum Yeri: {birth_place}")
                                
                                details = " | ".join(details_parts)
                                
                                # Liste tipini belirle
                                list_name = "TR MASAK - Malvarlığı Dondurulmuş"
                                if "BM" in sanction_type.upper() or "UN" in sanction_type.upper():
                                    list_name = "TR MASAK - 5. Madde (BM Kararları)"
                                elif "YABANCI" in sanction_type.upper():
                                    list_name = "TR MASAK - 6. Madde (Yabancı Ülke)"
                                elif "İÇ" in sanction_type.upper() or "7" in sanction_type:
                                    list_name = "TR MASAK - 7. Madde (İç Dondurma)"
                                elif "3A" in sanction_type or "3B" in sanction_type:
                                    list_name = "TR MASAK - 3A/3B Madde (Terör)"
                                
                                # Entity mi Individual mı?
                                entity_type = "Entity" if any(word in name.upper() for word in 
                                    ['A.Ş.', 'LTD', 'ŞTİ', 'LTD.ŞTİ', 'SAN.', 'TİC.', 'CORP', 'INC', 'LLC', 'FOUNDATION']) else "Individual"
                                
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
                                    'originalId': f'MASAK-{abs(hash(name + tckn))}'
                                }
                                
                                all_data.append(record)
                                
                                if idx % 100 == 0:
                                    print(f"   İşlenen kayıt: {idx}/{len(rows)}")
                    
                    except Exception as e:
                        print(f"   ⚠️ Satır {idx} işlenirken hata: {e}")
                        continue
            
            else:
                print("❌ Tablo bulunamadı!")
        
        except Exception as e:
            print(f"❌ Tablo işleme hatası: {e}")
        
        browser.close()
    
    return all_data


def main():
    print("\n" + "=" * 70)
    print("MASAK MALVARLIĞı DONDURMA LİSTESİ - OTOMATİK ÇEKME")
    print("=" * 70)
    
    # Veri çek
    data = fetch_all_masak_data()
    
    print("\n" + "=" * 70)
    print(f"✅ TOPLAM {len(data)} KAYIT ÇEKİLDİ")
    print("=" * 70)
    
    if data:
        # İstatistikler
        lists = {}
        for record in data:
            list_name = record['list']
            lists[list_name] = lists.get(list_name, 0) + 1
        
        print("\n📊 Liste Dağılımı:")
        for list_name, count in sorted(lists.items()):
            print(f"   {list_name}: {count} kayıt")
        
        # JSON'a kaydet
        output_file = 'masak_data.json'
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        
        print(f"\n💾 Veriler kaydedildi: {output_file}")
        print(f"📅 Güncelleme Tarihi: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        
        # Örnek kayıt göster
        if len(data) > 0:
            print("\n📋 Örnek Kayıt:")
            example = data[0]
            print(json.dumps(example, ensure_ascii=False, indent=2))
    
    else:
        print("\n❌ Hiç veri çekilemedi! Lütfen sayfayı manuel kontrol edin.")
    
    return data


if __name__ == "__main__":
    main()
