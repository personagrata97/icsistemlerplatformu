import urllib.request
import xml.etree.ElementTree as ET
import ssl

# Disable SSL verification
ssl._create_default_https_context = ssl._create_unverified_context

def fetch_eu():
    print("Fetching EU List...")
    url = 'https://webgate.ec.europa.eu/europeaid/fsd/fsf/public/files/xmlFullSanctionsList/content?token=dG9rZW4tMjAxNw'
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req) as response:
            print(f"Response Code: {response.getcode()}")
            xml_content = response.read()
            print(f"Content Length: {len(xml_content)}")
            
            try:
                root = ET.fromstring(xml_content)
                print("XML Parsed Successfully")
                
                # Debug: Print root tag and some children
                print(f"Root Tag: {root.tag}")
                
                namespaces = {'ns': 'http://eu.europa.ec/fpi/fsd/export'}
                count = 0
                for entity in root.findall('.//ns:sanctionEntity', namespaces):
                    count += 1
                    if count == 1:
                        for cit in entity.findall('ns:citizenship', namespaces):
                            print(f"Citizenship Attrib: {cit.attrib}")
                            for child in cit:
                                print(f"  Cit Child: {child.tag}, Text: {child.text}")
                        
                        for bd in entity.findall('ns:birthdate', namespaces):
                            print(f"Birthdate Attrib: {bd.attrib}")
                            for child in bd:
                                print(f"  BD Child: {child.tag}, Text: {child.text}")
                print(f"Found {count} sanctionEntity elements with namespace")
                
            except Exception as e:
                print(f"XML Parsing Error: {e}")
                print(f"First 500 chars of content: {xml_content[:500]}")

    except Exception as e:
        print(f"Error fetching EU: {e}")

if __name__ == "__main__":
    fetch_eu()
