import json
f = open("/var/www/feiman-v3-new/data/social-scenes.json")
d = json.load(f)
f.close()
s = d["sceneData"]["s-11"]
print("s-11 parts:", len(s["parts"]))
for i, p in enumerate(s["parts"][:3]):
    a = p.get("audio", "NONE")
    print("  p%d audio: %s" % (i+1, str(a)[:100]))
    if a and isinstance(a, dict):
        print("     type=%s keys=%s" % (type(a).__name__, list(a.keys())))
# Check file size
import os
print("\nFile size:", os.path.getsize("/var/www/feiman-v3-new/data/social-scenes.json"))
