import PyPDF2
import pandas as pd
import re
import requests
from io import BytesIO

# PDF URL
pdf_url = "https://www.resmigazete.gov.tr/eskiler/2021/12/20211224-16.pdf"

print("PDF indiriliyor...")
response = requests.get(pdf_url)
pdf_file = BytesIO(response.content)

print("PDF okunuyor...")
pdf_reader = PyPDF2.PdfReader(pdf_file)

# Tüm metni çıkar
all_text = ""
for page_num in range(len(pdf_reader.pages)):
    page = pdf_reader.pages[page_num]
    all_text += page.extract_text() + "\n"

print(f"Toplam {len(pdf_reader.pages)} sayfa okundu")
print("\n=== PDF İçeriği Önizleme ===")
print(all_text[:2000])  # İlk 2000 karakter

# Malvarlığı dondurma kararlarını bul
# Pattern: Genellikle isim, TC/pasaport, doğum tarihi gibi bilgiler içerir
lines = all_text.split('\n')

# Verileri saklamak için liste
data_records = []

# Basit pattern matching ile kişi bilgilerini çıkar
current_record = {}
for i, line in enumerate(lines):
    line = line.strip()
    if not line:
        continue
    
    # Numara ile başlıyorsa yeni kayıt
    if re.match(r'^\d+[\.\)]\s', line):
        if current_record:
            data_records.append(current_record)
        current_record = {'Sıra No': line.split()[0].rstrip('.)'), 'Tam Metin': line}
    elif current_record:
        current_record['Tam Metin'] = current_record.get('Tam Metin', '') + ' ' + line

# Son kaydı ekle
if current_record:
    data_records.append(current_record)

print(f"\n{len(data_records)} kayıt bulundu")

# Excel'e kaydet
if data_records:
    df = pd.DataFrame(data_records)
    output_file = "C:\\Users\\sk36\\.gemini\\antigravity\\scratch\\sanction_scanner\\malvarligi_dondurulanlar.xlsx"
    df.to_excel(output_file, index=False, engine='openpyxl')
    print(f"\n✓ Excel dosyası oluşturuldu: {output_file}")
    print(f"✓ Toplam {len(df)} satır kaydedildi")
    
    # İlk birkaç kaydı göster
    print("\n=== İlk 5 Kayıt ===")
    print(df.head().to_string())
else:
    print("! Hiçbir kayıt bulunamadı")

# Tam metni de kaydet (analiz için)
with open("C:\\Users\\sk36\\.gemini\\antigravity\\scratch\\sanction_scanner\\pdf_full_text.txt", "w", encoding="utf-8") as f:
    f.write(all_text)
print("\n✓ Tam metin kaydedildi: pdf_full_text.txt")
