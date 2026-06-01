import json
import os
import traceback
from pathlib import Path
from datetime import datetime
import pandas as pd

def parse_excel_file(filepath, list_name):
    """
    Excel dosyasını oku ve kayıtları çıkar.
    Veri değerlerini değiştirmeden, sadece frontend için gerekli formatlamayı yapar.
    """
    records = []
    
    try:
        print(f"\nParse ediliyor: {filepath.name}")
        
        # Dosya tipine göre oku
        if filepath.suffix.lower() in ['.xlsx', '.xls']:
            df = pd.read_excel(filepath, engine='openpyxl')
        elif filepath.suffix.lower() == '.csv':
            df = pd.read_csv(filepath, encoding='utf-8-sig')
        else:
            print(f"✗ Desteklenmeyen dosya formatı: {filepath.suffix}")
            return records
        
        print(f"{len(df)} satır bulundu")
        
        # Sütun isimlerini temizle ve büyük harfe çevir (eşleştirme için)
        # Ancak orijinal veriyi korumak için df'in kopyası üzerinde çalışacağız veya dikkatli olacağız.
        # Frontend beklediği alanlar: name, tckn, list, type, nationality, sanctionType, sourceDetails...
        
        # Orijinal sütun isimlerini sakla
        original_columns = list(df.columns)
        
        # Eşleştirme için normalize edilmiş sütun isimleri
        normalized_columns = {col: str(col).strip().upper() for col in df.columns}
        
        # Sütun eşleştirme haritası
        column_mapping = {
            'name': ['ADI SOYADI ÜNVANI', 'AD SOYAD', 'İSİM', 'NAME', 'ÜNVAN', 'ADI SOYADI', 'UNVANI'],
            'tckn': ['TCKN/VKN/GKN PASAPORT NO', 'TCKN', 'TC KIMLIK NO', 'KIMLIK NO', 'VKN', 'TCKN/VKN'],
            'nationality': ['UYRUĞU', 'UYRUK', 'NATIONALITY'],
            'sanction_type': ['M.V.D YAPTIRIM TÜRÜ', 'YAPTIRIM TÜRÜ', 'SANCTION TYPE'],
            'mother': ['ANNE ADI', 'ANNE', 'MOTHER NAME'],
            'father': ['BABA ADI', 'BABA', 'FATHER NAME'],
            'birth_date': ['DOĞUM TARİHİ', 'DOĞUM TARIHI', 'DOB', 'BIRTH DATE'],
            'birth_place': ['DOĞUM YERİ', 'DOĞUM YERI', 'BIRTH PLACE', 'POB']
        }
        
        # Hangi sütun hangisine denk geliyor bul
        found_columns = {}
        for field, possible_names in column_mapping.items():
            for col in original_columns:
                norm_col = normalized_columns[col]
                # Tam eşleşme veya içerir eşleşmesi
                if any(p_name == norm_col for p_name in possible_names):
                    found_columns[field] = col
                    break
                # İkinci tur: kısmi eşleşme (daha riskli ama gerekli olabilir)
                if field not in found_columns:
                     if any(p_name in norm_col for p_name in possible_names):
                        found_columns[field] = col
                        break

        # İsim sütunu kritik
        if 'name' not in found_columns:
            print(f"✗ İsim sütunu bulunamadı. Mevcut sütunlar: {original_columns}")
            # Fallback: İlk sütunu isim olarak varsay (genelde öyledir)
            if len(original_columns) > 0:
                found_columns['name'] = original_columns[0]
                print(f"⚠ İlk sütun isim olarak kullanılacak: {original_columns[0]}")
            else:
                return records

        valid_count = 0
        for idx, row in df.iterrows():
            try:
                # İsmi al
                name_col = found_columns['name']
                name = str(row[name_col]).strip()
                
                # Boş veya geçersiz satırları atla
                if not name or name.lower() in ['nan', 'none', '']:
                    continue
                
                # Başlık tekrarı satırlarını atla
                if any(keyword in name.upper() for keyword in ['ADI SOYADI', 'NAME', 'İSİM', 'UNVANI']):
                    # Eğer bu satır gerçekten başlık satırıysa (diğer sütunlar da başlık gibiyse) atla
                    # Basit kontrol: TCKN sütunu varsa ve o da 'TCKN' içeriyorsa başlıktır.
                    if 'tckn' in found_columns:
                        tckn_val = str(row[found_columns['tckn']]).strip().upper()
                        if 'TCKN' in tckn_val or 'KİMLİK' in tckn_val:
                            continue
                
                # Diğer alanları al
                def get_val(field):
                    if field in found_columns:
                        val = str(row[found_columns[field]]).strip()
                        return val if val.lower() not in ['nan', 'none', ''] else ''
                    return ''

                tckn = get_val('tckn')
                nationality = get_val('nationality')
                sanction_type = get_val('sanction_type')
                mother = get_val('mother')
                father = get_val('father')
                birth_date = get_val('birth_date')
                birth_place = get_val('birth_place')
                
                # Detay metni oluştur (Orijinal verileri birleştirerek)
                details_parts = []
                if nationality: details_parts.append(f"Uyruk: {nationality}")
                if mother: details_parts.append(f"Anne: {mother}")
                if father: details_parts.append(f"Baba: {father}")
                if birth_date: details_parts.append(f"DT: {birth_date}")
                if birth_place: details_parts.append(f"DY: {birth_place}")
                if sanction_type: details_parts.append(f"Yaptırım: {sanction_type}")
                
                details = " | ".join(details_parts)
                
                # Entity Type Tahmini
                entity_keywords = ['A.Ş.', 'LTD', 'ŞTİ', 'SAN.', 'TİC.', 'CORP', 'INC', 'LLC', 'FOUNDATION', 'VAKFI', 'DERNEĞİ', 'İŞLETMESİ']
                type_ = "Entity" if any(kw in name.upper() for kw in entity_keywords) else "Individual"

                # Kayıt objesi
                record = {
                    'name': name,
                    'list': list_name,
                    'type': type_,
                    'tckn': tckn if tckn else None,
                    'nationality': nationality,
                    'sanctionType': sanction_type,
                    'sourceDetails': details,
                    # Orijinal Excel satırındaki tüm verileri de saklayabiliriz (opsiyonel ama güvenli)
                    # 'original_data': row.to_dict() 
                }
                
                # Ekstra alanlar (frontend uyumluluğu için)
                if mother: record['motherName'] = mother
                if father: record['fatherName'] = father
                if birth_date: record['birthDate'] = birth_date
                if birth_place: record['birthPlace'] = birth_place
                
                records.append(record)
                valid_count += 1
                
            except Exception as e:
                # Tekil satır hatası
                continue
                
        print(f"✓ {valid_count} kayıt çıkarıldı")
        return records

    except Exception as e:
        print(f"✗ Dosya işleme hatası: {e}")
        traceback.print_exc()
        return []

def main():
    print("="*70)
    print("MASAK YEREL EXCEL GÜNCELLEME")
    print("="*70)
    
    base_dir = Path("data/masak")
    if not base_dir.exists():
        print(f"Hata: {base_dir} klasörü bulunamadı!")
        return

    # Dosyaları bul
    files = list(base_dir.glob("*.xlsx"))
    if not files:
        print("Hata: Klasörde .xlsx dosyası bulunamadı!")
        return
        
    print(f"Bulunan dosya sayısı: {len(files)}")
    
    all_records = []
    
    for file_path in files:
        # Dosya ismine göre liste adı belirle
        filename = file_path.name.upper()
        list_name = "TR MASAK - Genel" # Varsayılan
        
        if "5." in filename or "BM" in filename:
            list_name = "TR MASAK - BM Güvenlik Konseyi (5. Madde)"
        elif "6." in filename or "YABANCI" in filename:
            list_name = "TR MASAK - Yabancı Ülke Talepleri (6. Madde)"
        elif "7." in filename or "İÇ" in filename or "IC" in filename:
            list_name = "TR MASAK - İç Dondurma (7. Madde)"
        elif "3A" in filename or "3.A" in filename:
            list_name = "TR MASAK - Terör (3A/3B Madde)"
            
        records = parse_excel_file(file_path, list_name)
        all_records.extend(records)
        
    print("\n" + "="*70)
    print(f"TOPLAM İŞLENEN KAYIT: {len(all_records)}")
    
    if len(all_records) == 0:
        print("Hata: Hiç kayıt çıkarılamadı. İşlem iptal.")
        return

    # JSON Kaydet
    json_path = "masak_data.json"
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(all_records, f, ensure_ascii=False, indent=2)
    print(f"\n✓ JSON dosyası oluşturuldu: {json_path}")
    
    # JS Kaydet (Frontend için)
    js_path = "masak_data.js"
    with open(js_path, 'w', encoding='utf-8') as f:
        json_str = json.dumps(all_records, ensure_ascii=False)
        f.write(f"window.MASAK_DATA = {json_str};")
    print(f"✓ JS dosyası güncellendi: {js_path}")
    
    print("\nİŞLEM TAMAMLANDI.")

if __name__ == "__main__":
    main()
