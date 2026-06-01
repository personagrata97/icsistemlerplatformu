
import os

file_path = r"c:\Users\sk36\.gemini\antigravity\scratch\sanction_scanner\sanctions_data.js"

with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Look for the line with "decrees: ,"
for i, line in enumerate(lines):
    if "decrees: ," in line:
        lines[i] = line.replace("decrees: ,", "decrees: [],")
        print(f"Fixed line {i+1}")
        break

with open(file_path, 'w', encoding='utf-8') as f:
    f.writelines(lines)
