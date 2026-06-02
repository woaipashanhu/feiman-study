import re

filepath = "/root/workspace_backup/fox-school/scenes/s16-小豆收拾房间/text.md"
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

print("File length:", len(content))
print("First 200 chars:")
print(repr(content[:200]))

# Test the exact regex used in fix-narration.py
zh_m = re.search(r'\*\*\u65c1\u76ef\uff08\u4e2d\u6587\uff09\*\*[\uff1a:](.+?)(?=\*\*|$)', content, re.DOTALL)
en_m = re.search(r'\*\*\u65c1\u76ef\uff08\u82f1\u6587\uff09\*\*[\uff1a:](.+?)(?=\*\*|$)', content, re.DOTALL)

print("\nUnicode escape zh match:", "YES" if zh_m else "NO")
print("Unicode escape en match:", "YES" if en_m else "NO")

if zh_m:
    print("zh text:", repr(zh_m.group(1)[:80]))
if en_m:
    print("en text:", repr(en_m.group(1)[:80]))

# Try literal Chinese
zh_m2 = re.search(r'\*\*旁白（中文）\*\*[：:](.+?)(?=\*\*|$)', content, re.DOTALL)
en_m2 = re.search(r'\*\*旁白（英文）\*\*[：:](.+?)(?=\*\*|$)', content, re.DOTALL)

print("\nLiteral zh match:", "YES" if zh_m2 else "NO")
print("Literal en match:", "YES" if en_m2 else "NO")

if zh_m2:
    print("zh text:", repr(zh_m2.group(1)[:80]))
if en_m2:
    print("en text:", repr(en_m2.group(1)[:80]))

# Check if the file has the patterns at all
if '**旁白' in content:
    print("\n**旁白 FOUND in file")
else:
    print("\n**旁白 NOT FOUND in file")

if '\u65c1\u76ef' in content:
    print("unicode escape string FOUND in file")
else:
    print("unicode escape string NOT FOUND in file")
