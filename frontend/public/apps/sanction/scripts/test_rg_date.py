import requests
from bs4 import BeautifulSoup
import pdfplumber
import io
import re
import urllib3

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

def test_specific_date():
    date_str = "20210707"
    url = "https://www.resmigazete.gov.tr/eskiler/2021/07/20210707.htm"
    
    print(f"Checking {url}...")
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
    try:
        response = requests.get(url, verify=False, timeout=30, headers=headers)
        if response.status_code != 200:
            print(f"Failed to fetch page: {response.status_code}")
            return

        soup = BeautifulSoup(response.content, 'html.parser')
        links = soup.find_all('a', href=True)
        
        pdf_links = []
        for link in links:
            href = link['href']
            text = link.text.lower()
            if 'malvarlığı' in text or 'dondurulması' in text or 'terörizm' in text or 'konsey' in text or 'birlemi' in text:
                safe_text = text.encode('ascii', 'ignore').decode('ascii')
                safe_href = href.encode('ascii', 'ignore').decode('ascii')
                print(f"Found relevant link: {safe_text} -> {safe_href}")
                if not href.startswith('http'):
                    # href is like 20210707-4.pdf
                    # base is https://www.resmigazete.gov.tr/eskiler/YYYY/MM/
                    year = date_str[:4]
                    month = date_str[4:6]
                    href = f"https://www.resmigazete.gov.tr/eskiler/{year}/{month}/{href}"
                pdf_links.append(href)

        if not pdf_links:
            print("No relevant PDF links found. Printing all links:")
            print("No relevant PDF links found. Printing all links:")
            for i, link in enumerate(links):
               try:
                   safe_text = link.text.encode('ascii', 'ignore').decode('ascii')
                   safe_href = link['href'].encode('ascii', 'ignore').decode('ascii')
                   print(f"Link {i}: {safe_text} -> {safe_href}")
               except Exception as e_inner:
                   print(f"Skipping link {i} due to error: {e_inner}")
            return

        for pdf_url in pdf_links:
            print(f"Processing PDF: {pdf_url}")
            try:
                pdf_resp = requests.get(pdf_url, verify=False, timeout=60, headers=headers)
                
                text = ""
                try:
                    with pdfplumber.open(io.BytesIO(pdf_resp.content)) as pdf:
                        for page in pdf.pages:
                            extracted = page.extract_text()
                            if extracted:
                                text += extracted + "\n"
                except Exception as e:
                    print(f"pdfplumber error: {e}")

                print(f"Final extracted length: {len(text)}")
                # print(f"Text content sample: {text[:200].encode('ascii', 'ignore').decode('ascii')}")
                
                if "TCKN" in text or "Doğum" in text:
                    print("PDF contains TCKN/Doğum keywords.")
                else:
                    print("PDF might be image-based or different format.")
            except Exception as e:
                print(f"Error processing PDF: {e}")
            except Exception as e:
                print(f"Error processing PDF: {e}")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_specific_date()
