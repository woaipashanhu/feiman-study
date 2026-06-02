import re

# Simulate the actual text.md content
body = """**旁白（中文）**：妈妈让小豆收拾房间。小豆嘟着嘴——"我不想收拾。"
**旁白（英文）**：Mom tells Xiaodou to tidy up. Xiaodou pouts — "I don't wanna."
**气泡（左-阿布在想）**：中文：收拾太累了…… / 英文：Cleaning up is too much work
"""

# The regex from final-fix.py (using unicode escapes)
zh_m = re.search(r'\*\*\u65c1\u76ef\uff08\u4e2d\u6587\uff09\*\*\uff1a(.+?)(?=\*\*|$)', body, re.DOTALL)
en_m = re.search(r'\*\*\u65c1\u76ef\uff08\u82f1\u6587\uff09\*\*\uff1a(.+?)(?=\*\*|$)', body, re.DOTALL)

print("zh match:", zh_m.group(1)[:60] if zh_m else "NONE")
print("en match:", en_m.group(1)[:60] if en_m else "NONE")

# Also try with raw Chinese chars
zh_m2 = re.search(r'\*\*旁白（中文）\*\*[：:](.+?)(?=\*\*|$)', body, re.DOTALL)
en_m2 = re.search(r'\*\*旁白（英文）\*\*[：:](.+?)(?=\*\*|$)', body, re.DOTALL)
print("zh2 match:", zh_m2.group(1)[:60] if zh_m2 else "NONE")
print("en2 match:", en_m2.group(1)[:60] if en_m2 else "NONE")
