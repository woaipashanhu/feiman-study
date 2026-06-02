import json, os, re
f = open("/tmp/social-scenes-full.json")
d = json.load(f)
f.close()
# Check s06 specifically
s = d["sceneData"]["s06"]
print("s06 parts:", len(s["parts"]))
for i, p in enumerate(s["parts"]):
    print("  p%d: img=%s audio=%s" % (i+1, p.get("image",""), str(p.get("audio","NONE"))[:60]))

# Check actual files
AUD_BASE = "/var/www/feiman-v3-new/audio"
aud_dir = os.path.join(AUD_BASE, "s06")
print("\nActual s06 audio files:", os.listdir(aud_dir))

# Test regex against s06 files
pnum = 1
pattern = r"(.*?)[_-]?p(?:art)?%d[_-]?(zh|en)\.mp3$" % pnum
print("\nPattern for pnum=1:", pattern)
for af in os.listdir(aud_dir):
    m = re.search(pattern, af.lower())
    print("  %s -> %s" % (af, "MATCH lang="+m.group(2) if m else "NO MATCH"))
