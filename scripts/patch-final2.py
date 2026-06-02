# Patch final-fix.py to handle s-32_part1.jpg and _cn/_en audio format
f = open("/tmp/final-fix.py")
c = f.read()
f.close()

# Replace find_audio with super-enhanced version
old = '''def find_audio(scene_id, pnum):
    """智能查找 part N 的音频 - 支持3种命名格式"""
    aud_dir = os.path.join(AUD_BASE, scene_id)
    if not os.path.exists(aud_dir):
        return None
    
    all_files = os.listdir(aud_dir)
    mp3_files = [f for f in all_files if f.endswith('.mp3')]
    
    found_zh = None
    found_en = None
    
    # Enhanced pattern: matches part1-zh.mp3, s06p1_zh.mp3, s13-part1-zh.mp3, part1_en.mp3 etc.
    pattern = r"(.*?)[_-]?p(?:art)?%d[_-]?(zh|en)\\.mp3$" % pnum
    
    for af in mp3_files:
        afl = af.lower()
        m = re.search(pattern, afl)
        if m:
            lang_type = m.group(2)
            if lang_type == "zh":
                found_zh = af
            else:
                found_en = af
    
    if found_zh or found_en:
        result = {}
        if found_zh:
            result["zh"] = "/audio/%s/%s" % (scene_id, found_zh)
        if found_en:
            result["en"] = "/audio/%s/%s" % (scene_id, found_en)
        return result
    
    return None'''

new = '''def find_audio(scene_id, pnum):
    """智能查找 part N 的音频 - 支持4种命名格式"""
    aud_dir = os.path.join(AUD_BASE, scene_id)
    if not os.path.exists(aud_dir):
        return None
    
    all_files = os.listdir(aud_dir)
    mp3_files = [f for f in all_files if f.endswith('.mp3')]
    
    found_zh = None
    found_en = None
    
    # Super pattern: matches ALL formats:
    #   part1-zh.mp3, part1_en.mp3 (standard)
    #   s06p1_zh.mp3, s06p1_en.mp3 (compact)
    #   s13-part1-zh.mp3, s13-part1-en.mp3 (prefixed)
    #   s-32_part1_cn.mp3, s-32_part1_en.mp3 (underscore + cn/en)
    #   s-32_part1-zh.mp3 (underscore + zh)
    pattern = r"(.*?)[_.\-]?p(?:art)?%d[_.\-]?(zh|cn|en)\\.mp3$" % pnum
    
    for af in mp3_files:
        afl = af.lower()
        m = re.search(pattern, afl)
        if m:
            lang_type = m.group(2)
            # Map cn -> zh for consistency
            if lang_type in ("zh", "cn"):
                if not found_zh:  # prefer _zh over _cn
                    found_zh = af
            elif lang_type == "en":
                found_en = af
    
    if found_zh or found_en:
        result = {}
        if found_zh:
            result["zh"] = "/audio/%s/%s" % (scene_id, found_zh)
        if found_en:
            result["en"] = "/audio/%s/%s" % (scene_id, found_en)
        return result
    
    return None'''

c = c.replace(old, new)

# Also fix image parsing for s-32_part1.jpg format
old_img = '''        pm = re.match(r'(part(\\d+))-.+\\.(png|jpg|jpeg)', fname)
            if pm:
                pn = int(pm.group(2))
                if pn not in part_images:
                    part_images[pn] = "/images/%s/%s" % (scene_id, fname)
            else:
                # Match s06p1.jpg, s13-part1-xxx.png formats
                pm2 = re.match(r'.*?(?:^|[_-])p(\\d+)(?:[_-].*)?\\.(png|jpg|jpeg)', fname)
                if pm2:
                    pn = int(pm2.group(1))
                    if pn not in part_images:
                        part_images[pn] = "/images/%s/%s" % (scene_id, fname)'''

new_img = '''        pm = re.match(r'(part(\\d+))-.+\\.(png|jpg|jpeg)', fname)
            if pm:
                pn = int(pm.group(2))
                if pn not in part_images:
                    part_images[pn] = "/images/%s/%s" % (scene_id, fname)
            else:
                # Match s06p1.jpg, s13-part1-xxx.png, s-32_part1.jpg formats
                pm2 = re.match(r'.*?[_.\-]?p(?:art)?(\\d+)[_.\-]?.*?\\.(png|jpg|jpeg)', fname)
                if pm2:
                    pn = int(pm2.group(1))
                    if pn not in part_images:
                        part_images[pn] = "/images/%s/%s" % (scene_id, fname)'''

c = c.replace(old_img, new_img)

f = open("/tmp/final-fix.py", "w")
f.write(c)
f.close()
print("patched with _cn format support")
