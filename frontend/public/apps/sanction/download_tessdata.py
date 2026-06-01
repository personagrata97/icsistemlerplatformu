import os
import urllib.request
from pathlib import Path

import ssl

def download_file(url, dest_path):
    print(f"Downloading {url} to {dest_path}...")
    try:
        # Create unverified context to bypass SSL errors
        ctx = ssl.create_default_context()
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE
        
        with urllib.request.urlopen(url, context=ctx) as response, open(dest_path, 'wb') as out_file:
            out_file.write(response.read())
            
        print(f"Successfully downloaded {dest_path}")
    except Exception as e:
        print(f"Error downloading {url}: {e}")

def main():
    # Create local tessdata directory
    tessdata_dir = Path("tessdata")
    tessdata_dir.mkdir(exist_ok=True)

    # URLs for Tesseract 4.0.0+ (compatible with most recent versions)
    # Using 'best' or 'fast' or standard 'tessdata'. Standard is usually a good balance.
    base_url = "https://github.com/tesseract-ocr/tessdata/raw/main"
    
    files = [
        "tur.traineddata",
        "eng.traineddata"
    ]

    for filename in files:
        dest_path = tessdata_dir / filename
        if dest_path.exists():
            print(f"{filename} already exists, skipping.")
            continue
            
        url = f"{base_url}/{filename}"
        download_file(url, dest_path)

if __name__ == "__main__":
    main()
