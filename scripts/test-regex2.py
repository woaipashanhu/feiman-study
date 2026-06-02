import re
tests = [
    (1, "part1-zh.mp3"), (1, "part1_en.mp3"),
    (1, "s06p1_zh.mp3"), (1, "s06p1_en.mp3"),
    (1, "s13-part1-zh.mp3"), (1, "s13-part1-en.mp3"),
    (2, "s06p2_zh.mp3"), (5, "s15-part5-zh.mp3"),
    (3, "part3-en.mp3"),
]
for pnum, fname in tests:
    pat = r"(.*?)[_-]?p(?:art)?%d[_-]?(zh|en)\.mp3$" % pnum
    m = re.search(pat, fname.lower())
    if m:
        print("  OK pnum=%d %s -> type=%s" % (pnum, fname, m.group(2)))
    else:
        print("  MISS pnum=%d %s" % (pnum, fname))
