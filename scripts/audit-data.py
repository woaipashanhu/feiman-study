import json
f = open("/tmp/social-scenes-full.json")
d = json.load(f)
f.close()

from collections import Counter
parts_count = Counter()
for sid, sd in d["sceneData"].items():
    pc = len(sd["parts"])
    parts_count[pc] += 1

print("=== Parts 分布 ===")
for k in sorted(parts_count.keys()):
    print(f"  {k} parts: {parts_count[k]} scenes")

print("\n=== 3 parts 场景 ===")
for sid, sd in sorted(d["sceneData"].items()):
    if len(sd["parts"]) == 3:
        has_aud = any(p.get("audio") for p in sd["parts"])
        # 检查 narration 是否有英文
        has_en = any(isinstance(p.get("narration"), dict) and p["narration"].get("en","").strip() for p in sd["parts"])
        print(f"  {sid}: {sd['title'][:50]}  aud={has_aud}  en_narr={has_en}")

print("\n=== 6+ parts 场景 ===")
for sid, sd in sorted(d["sceneData"].items()):
    if len(sd["parts"]) >= 6:
        has_aud = any(p.get("audio") for p in sd["parts"])
        has_en = any(isinstance(p.get("narration"), dict) and p["narration"].get("en","").strip() for p in sd["parts"])
        print(f"  {sid}: {len(sd['parts'])}p  {sd['title'][:50]}  aud={has_aud}  en={has_en}")

# 检查 audio 格式细节
print("\n=== Audio 格式抽样 ===")
count_with_aud = 0
count_without_aud = 0
sampled = 0
for sid, sd in list(d["sceneData"].items())[:10]:
    for i, p in enumerate(sd["parts"]):
        a = p.get("audio")
        if a:
            count_with_aud += 1
            if sampled < 5:
                print(f"  {sid} part{i+1}: {str(a)[:80]}")
                sampled += 1
        else:
            count_without_aud += 1
print(f"\n  有audio的parts: {count_with_aud}")
print(f"  无audio的parts: {count_without_aud}")
