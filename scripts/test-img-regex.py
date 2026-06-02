import re
tests = [
    "part1-painting-spill.png",     # standard
    "s06p1.jpg",                     # compact
    "s13-part1-aboo.png",            # prefixed
    "s-32_part1.jpg",                # underscore (s-32 format)
    "s-32_part2.jpg",
    "s09p1.jpg",                     # s09 compact
]
for fname in tests:
    # Current regex in final-fix.py
    pm = re.match(r'(part(\d+))-.+\.(png|jpg|jpeg)', fname)
    if pm:
        print("  MATCH part: %s -> pnum=%s" % (fname, pm.group(2)))
        continue
    pm2 = re.match(r'.*?[_.\-]?p(?:art)?(\d+)[_.\-]?.*?\.(png|jpg|jpeg)', fname)
    if pm2:
        print("  MATCH generic: %s -> pnum=%s" % (fname, pm2.group(1)))
        continue
    print("  NO MATCH: %s" % fname)
