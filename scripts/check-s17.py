import json, os
f = open("/var/www/feiman-v3-new/data/social-scenes.json")
d = json.load(f)
f.close()
print("s17 in data:", "s17" in d["sceneData"])
print("s17 keys sample:", list(d["sceneData"].keys())[:15])
if "s17" in d["sceneData"]:
    s = d["sceneData"]["s17"]
    print("parts:", len(s["parts"]))
    if s["parts"]:
        print("p1 img:", s["parts"][0].get("image", "NONE"))
        print("title:", s["title"])
else:
    # Find what looks like s17
    for k in d["sceneData"]:
        if "17" in k or "小豆" in d["sceneData"][k]["title"]:
            print("  similar: %s -> %s" % (k, d["sceneData"][k]["title"][:40]))
print("\nimages/s17 dir:", os.path.exists("/var/www/feiman-v3-new/images/s17"))
if os.path.exists("/var/www/feiman-v3-new/images/s17"):
    print("  files:", os.listdir("/var/www/feiman-v3-new/images/s17"))
# Check for棉花
for k in d["sceneData"]:
    if "棉花" in d["sceneData"][k]["title"]:
        print("  cotton: %s -> %s (%dp)" % (k, d["sceneData"][k]["title"][:40], len(d["sceneData"][k]["parts"])))
