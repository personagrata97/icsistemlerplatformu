
import os
import re

file_path = r"c:\Users\sk36\.gemini\antigravity\scratch\sanction_scanner\sanctions_data.js"

with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

found = False
for i, line in enumerate(lines):
    if "decrees" in line:
        print(f"Found 'decrees' at line {i+1}: {repr(line)}")
        # Check if it matches the pattern "decrees:\s*,"
        if re.search(r"decrees:\s*,", line):
            lines[i] = re.sub(r"decrees:\s*,", "decrees: [],", line)
            print(f"Replaced with: {repr(lines[i])}")
            found = True
            break

if found:
    with open(file_path, 'w', encoding='utf-8') as f:
        f.writelines(lines)
    print("File updated successfully.")
else:
    print("Pattern not found.")
