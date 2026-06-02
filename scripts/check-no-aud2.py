import json, os
f = open("/tmp/social-scenes-full.json")
d = json.load(f)
f.close()
AUD = "/var/www/feiman-v3-new/audio"
no_aud = []
for sid, sd in d["sceneData"].items():
    has = any(p.get("audio") for p in sd["parts"])
    if not has:
        ad = os.path.join(AUD, sid)
        exists = os.path.exists(ad)
        cnt = len([f for f in os.listdir(ad) if f.endswith('.mp3')]) if exists else 0
        no_aud.append((sid, len(sd["parts"]), cnt, sd["title"][:35]))
print("No-audio scenes: %d" % len(no_aud))
# Group by audio file count
from collections import Counter
cnt_groups = Counter(t[2] for t in no_aud)
print("By actual mp3 count:")
for c in sorted(cnt_groups.keys()):
    print("  %d mp3 files: %d scenes" % (c, cnt_groups[c]))
# Show those that DO have mp3 but didn't match
print("\nScenes with mp3 files but unmatched:")
for sid, pc, cnt, title in no_aud:
    if cnt > 0:
        print("  %s (%dp, %d mp3) %s" % (sid, pc, cnt, title))
# Show those truly without
print("\nScenes with zero mp3 (original data missing):")
for sid, pc, cnt, title in no_aud:
    if cnt == 0:
        print("  %s (%dp) %s" % (sid, pc, title))
