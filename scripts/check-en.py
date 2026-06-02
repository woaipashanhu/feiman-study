import json
f = open("/var/www/feiman-v3-new/data/social-scenes.json")
d = json.load(f)
f.close()
count = 0
samples = []
for sid, sd in d["sceneData"].items():
    for p in sd["parts"]:
        n = p.get("narration")
        if isinstance(n, dict) and n.get("en"):
            count += 1
            if len(samples) < 5:
                samples.append((sid, str(n.get("zh",""))[:50], str(n.get("en",""))[:50]))
            break
print("Scenes with EN narration: %d/%d" % (count, len(d["sceneData"])))
for s in samples:
    print("  %s" % str(s))
