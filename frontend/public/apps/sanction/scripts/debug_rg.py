import requests
import datetime
import time

def test_rg():
    session = requests.Session()
    session.headers.update({'User-Agent': 'Mozilla/5.0'})
    
    # Check today
    today = datetime.date.today()
    date_str = today.strftime("%d%m%Y")
    url = f"https://www.resmigazete.gov.tr/eskiler/{today.strftime('%Y/%m')}/{date_str}.htm"
    
    print(f"Checking {url}...")
    start = time.time()
    try:
        response = session.get(url, timeout=10)
        print(f"Status: {response.status_code}")
        print(f"Time: {time.time() - start:.2f}s")
    except Exception as e:
        print(f"Error: {e}")

    # Check a known old date (random)
    old_date = today - datetime.timedelta(days=30)
    date_str = old_date.strftime("%d%m%Y")
    url = f"https://www.resmigazete.gov.tr/eskiler/{old_date.strftime('%Y/%m')}/{date_str}.htm"
    print(f"Checking {url}...")
    start = time.time()
    try:
        response = session.get(url, timeout=10)
        print(f"Status: {response.status_code}")
        print(f"Time: {time.time() - start:.2f}s")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_rg()
