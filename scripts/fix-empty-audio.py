import json
f = open("/tmp/social-scenes-full.json")
d = json.load(f)
f.close()
fixed = 0
for sid, sd in d["sceneData"].items():
    for p in sd["parts"]:
        if p.get("audio") == {} or p.get("audio") == {"zh": "", "en": ""}:
            del p["audio"]
            fixed += 1
        # Also fix empty narration
        n = p.get("narration")
        if n == {} or n == {"zh": "", "en": ""}:
            p["narration"] = ""
f = open("/tmp/social-scenes-full.json", "w")
json.dump(d, f, ensure_ascii=False, indent=2)
f.close()
print(f"Fixed {fixed} empty audio fields")
