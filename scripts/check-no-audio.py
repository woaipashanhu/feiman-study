import json
f = open("/tmp/social-scenes-full.json")
d = json.load(f)
f.close()
no_aud = []
for sid, sd in d["sceneData"].items():
    has = any(p.get("audio") for p in sd["parts"])
    if not has:
        no_aud.append((sid, len(sd["parts"]), sd["title"][:40]))
        # Show first 2 parts' images
        for i, p in enumerate(sd["parts"][:2]):
            print("  NO_AUDIO %s (%dp) %s" % (sid, len(sd["parts"]), sd["title"][:50]))
            print("    p%d img: %s" % (i+1, p.get("image","")[:60]))
            aud_dir_name = sid
            break
print("\nTotal no-audio: %d" % len(no_aud))
# Check if audio dir exists for these
import os
AUD_BASE = "/var/www/feiman-v3-new/audio"
for sid, pc, title in no_aud[:10]:
    ad = os.path.join(AUD_BASE, sid)
    exists = os.path.exists(ad)
    count = len(os.listdir(ad)) if exists else 0
    print("  %s: dir_exists=%s file_count=%d" % (sid, exists, count))
