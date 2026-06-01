
with open(r'c:\Users\sk36\.gemini\antigravity\scratch\icsistemler-platformu\frontend\app\audit\staff\page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()
    
p_count = 0
b_count = 0
s_count = 0
for i, char in enumerate(content):
    if char == '(': p_count += 1
    elif char == ')': p_count -= 1
    elif char == '{': b_count += 1
    elif char == '}': b_count -= 1
    elif char == '[': s_count += 1
    elif char == ']': s_count -= 1
    
    if p_count < 0: print(f"Unmatched ) at char {i}")
    if b_count < 0: print(f"Unmatched }} at char {i}")
    if s_count < 0: print(f"Unmatched ] at char {i}")

print(f"Final counts: ( {p_count}, {{ {b_count}, [ {s_count}")
