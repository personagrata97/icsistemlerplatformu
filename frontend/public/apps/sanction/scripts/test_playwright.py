from playwright.sync_api import sync_playwright

try:
    with sync_playwright() as p:
        print("Playwright started")
        browser = p.chromium.launch(headless=True, args=['--no-sandbox', '--disable-setuid-sandbox'])
        print("Browser launched")
        page = browser.new_page()
        print("Page created")
        browser.close()
        print("Browser closed")
except Exception as e:
    print(f"Error: {e}")
