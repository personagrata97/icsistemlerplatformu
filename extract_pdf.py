import pypdf
import sys
import io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

reader = pypdf.PdfReader(r'C:\Users\sk36\Downloads\ic_sistemler_platformu_v5_gerceklik_kontrolu.pdf')
for i, page in enumerate(reader.pages):
    text = page.extract_text()
    print(f'--- PAGE {i+1} ---')
    print(text)
    print()
