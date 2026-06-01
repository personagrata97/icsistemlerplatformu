try:
    import pdfplumber
    import requests
    import bs4
    print("All modules installed")
except ImportError as e:
    print(f"Missing module: {e}")
