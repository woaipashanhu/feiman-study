import re
test_files = ["part1-zh.mp3", "part1-en.mp3", "s14-part1-zh.mp3", "s14-part1-en.mp3", "s15-part5-zh.mp3"]
pnum = 1
pattern_zh = r".*-part%d-?zh\.mp3$" % pnum
pattern_en = r".*-part%d-?en\.mp3$" % pnum
print("zh_pattern:", pattern_zh)
for f in test_files:
    mz = re.search(pattern_zh, f.lower())
    me = re.search(pattern_en, f.lower())
    print("  %s -> zh=%s en=%s" % (f, bool(mz), bool(me)))

# Also test pnum=5
pnum = 5
pattern_zh5 = r".*-part%d-?zh\.mp3$" % pnum
print("\npnum=5 pattern:", pattern_zh5)
for f in ["s15-part5-zh.mp3", "part5-zh.mp3"]:
    mz = re.search(pattern_zh5, f.lower())
    print("  %s -> zh=%s" % (f, bool(mz)))
