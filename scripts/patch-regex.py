f = open("/tmp/final-fix.py")
c = f.read()
f.close()
c = c.replace(
    "pattern_zh = r'.*-part%d-?zh\\.mp3$' % pnum",
    "pattern_zh = r'(.*?)-?part%d-?zh\\.mp3$' % pnum"
)
c = c.replace(
    "pattern_en = r'.*-part%d-?en\\.mp3$' % pnum",
    "pattern_en = r'(.*?)-?part%d-?en\\.mp3$' % pnum"
)
f = open("/tmp/final-fix.py", "w")
f.write(c)
f.close()
print("patched")
