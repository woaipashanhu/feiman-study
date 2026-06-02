#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
终极修复 v5 - 兼容 Python 3.6
1. 重新同步资源（目录ID与音频文件名前缀一致）
2. 智能匹配音频文件名
3. 正确分类: 6parts=卡耐基, 3parts=社交故事
4. 清理所有Zod不兼容字段
"""
import json, os, re, glob, shutil

SCENES_ROOT = "/root/workspace_backup/fox-school/scenes"
IMG_BASE = "/var/www/feiman-v3-new/images"
AUD_BASE = "/var/www/feiman-v3-new/audio"

def clean(s):
    return re.sub(r'\s+', ' ', s).strip()

def get_scene_id(dir_name):
    """返回 (base_id, sort_key)"""
    if dir_name.startswith("social-"):
        base = "-".join(dir_name.split("-")[:2])
        return (base, "zzz" + base)
    
    m = re.match(r'^(s-\d+)', dir_name)
    if m:
        num_str = m.group(1).replace('-', '')
        try:
            num = int(num_str)
        except:
            num = 999
        return (m.group(1), "%03d" % num)
    
    m = re.match(r'^(s\d+)', dir_name)
    if m:
        base = m.group(1)
        num_str = base[1:]
        try:
            num = int(num_str)
        except:
            num = 999
        return (base, "%03d" % num)
    
    return (dir_name, "999")

# Step 1: 分配唯一 ID
print("=== Step 1: Assigning IDs ===")
all_dirs = [d for d in os.listdir(SCENES_ROOT) 
            if os.path.isdir(os.path.join(SCENES_ROOT, d))]

id_map = {}       # dir_name -> unique_id
id_usage = {}     # base_id -> usage_count

for d in sorted(all_dirs):
    sp = os.path.join(SCENES_ROOT, d)
    if not (os.path.exists(os.path.join(sp, "images")) or
            os.path.exists(os.path.join(sp, "audio"))):
        continue
    
    base_id, sort_key = get_scene_id(d)
    
    if base_id in id_usage:
        id_usage[base_id] += 1
        suffix_char = chr(ord('a') + id_usage[base_id] - 1)
        unique_id = base_id + suffix_char
        print("  CONFLICT: %s -> %s (base=%s used %dx)" % (d, unique_id, base_id, id_usage[base_id]))
    else:
        id_usage[base_id] = 1
        unique_id = base_id
    
    id_map[d] = {"id": unique_id, "sort": sort_key}

sorted_items = sorted(id_map.items(), key=lambda x: x[1]["sort"])
print("Total scenes: %d" % len(sorted_items))

# Step 2: 清空并重新同步资源
print("\n=== Step 2: Re-syncing resources ===")
if os.path.exists(IMG_BASE):
    shutil.rmtree(IMG_BASE)
if os.path.exists(AUD_BASE):
    shutil.rmtree(AUD_BASE)
os.makedirs(IMG_BASE, exist_ok=True)
os.makedirs(AUD_BASE, exist_ok=True)

for dir_name, info in sorted_items:
    scene_id = info["id"]
    sp = os.path.join(SCENES_ROOT, dir_name)
    
    img_src = os.path.join(sp, "images")
    aud_src = os.path.join(sp, "audio")
    
    if os.path.exists(img_src):
        dst = os.path.join(IMG_BASE, scene_id)
        os.makedirs(dst, exist_ok=True)
        for f in os.listdir(img_src):
            shutil.copy2(os.path.join(img_src, f), os.path.join(dst, f))
    
    if os.path.exists(aud_src):
        dst = os.path.join(AUD_BASE, scene_id)
        os.makedirs(dst, exist_ok=True)
        for f in os.listdir(aud_src):
            if f.endswith('.mp3'):
                shutil.copy2(os.path.join(aud_src, f), os.path.join(dst, f))

total_img = 0
for root_d, dirs, files in os.walk(IMG_BASE):
    total_img += len([f for f in files if f.endswith(('.png','.jpg','.jpeg'))])
total_aud = 0
for root_d, dirs, files in os.walk(AUD_BASE):
    total_aud += len([f for f in files if f.endswith('.mp3')])
print("Synced: %d scenes, %d images, %d audio" % (len(sorted_items), total_img, total_aud))

# Step 3: 解析 text.md
print("\n=== Step 3: Parsing text.md ===")

def parse_text_md(filepath):
    if not os.path.exists(filepath):
        return None
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    result = {
        "title": "", "subtitle": "", "principle": "",
        "difficulty": 1, "characters": [],
        "parts": [], "summary": {"title": "", "socialSteps": []}
    }
    
    m = re.search(r'^#\s+(.+)', content, re.MULTILINE)
    if m: result["title"] = clean(m.group(1))
    m = re.search(r'\u7c7b\u578b\uff1a(.+)', content)  # 类型：
    if m: result["subtitle"] = clean(m.group(1))
    m = re.search(r'\u6838\u5fc3\u6280\u80fd\uff1a(.+)', content)  # 核心技能：
    if m: result["principle"] = clean(m.group(1))
    m = re.search(r'\u96be\u5ea6\uff1a(\d+)', content)  # 难度：
    if m: result["difficulty"] = int(m.group(1))
    m = re.search(r'\u89d2\u8272\uff1a(.+)', content)  # 角色：
    if m: result["characters"] = [r.strip() for r in m.group(1).split('\u3001')]
    
    # Parse parts
    part_headers = list(re.finditer(
        r'^##\s*Part\s*(\d+)(?:\s*[\u2014\-].*?)?(?:\s*\(([^)]+)\))?\s*$',
        content, re.MULTILINE
    ))
    
    for idx, ph in enumerate(part_headers):
        pnum = int(ph.group(1))
        start = ph.end()
        if idx + 1 < len(part_headers):
            end = part_headers[idx + 1].start()
        else:
            ns = re.search(r'\n##\s+(\u603b\u7ed3|\u732b\u5934\u9e70\u667a\u6167)', content[start:])
            end = (start + ns.start()) if ns else len(content)
        
        body = content[start:end].strip()
        
        part_data = {
            "id": "part%d" % pnum,
            "image": "",
            "narration": "",
            "thoughts": []
        }
        
        # Bilingual narration
        zh_m = re.search(r'\*\*\u65c1\u76ef\uff08\u4e2d\u6587\uff09\*\*\uff1a(.+?)(?=\*\*|$)', body, re.DOTALL)
        en_m = re.search(r'\*\*\u65c1\u76ef\uff08\u82f1\u6587\uff09\*\*\uff1a(.+?)(?=\*\*|$)', body, re.DOTALL)
        
        if zh_m and en_m:
            zh_t = clean(zh_m.group(1))
            en_t = clean(en_m.group(1))
            if en_t:
                part_data["narration"] = {"zh": zh_t, "en": en_t}
            else:
                part_data["narration"] = zh_t
        elif zh_m:
            part_data["narration"] = clean(zh_m.group(1))
        else:
            # Simple format: body is narration
            lines = []
            for line in body.split('\n'):
                line = line.strip()
                if not line or line.startswith('---') or line.startswith('**') or line.startswith('>'):
                    continue
                lines.append(line)
            if lines:
                part_data["narration"] = clean(" ".join(lines))
        
        # Thought bubbles
        bubbles = re.findall(
            r'\*\*\u6c14\u6ce1\uff08([\u5de6\u53f9])-([^)\uff09]+)\uff09\*\*\uff1a(.+?)(?=\*\*\u6c14泡|\n>|$)',
            body, re.DOTALL
        )
        for side, char, raw_text in bubbles:
            is_left = (side == '\u5de6')
            display_char = char.strip()
            text = clean(raw_text)
            
            # Split zh/en by last '/'
            zh_t = text
            en_t = ""
            slash_idx = text.rfind('/')
            if slash_idx > 0:
                maybe_en = text[slash_idx+1:].strip()
                if maybe_en and re.match(r'^[A-Za-z]', maybe_en):
                    zh_t = clean(text[:slash_idx])
                    en_t = clean(maybe_en)
            
            thought = {
                "character": display_char,
                "characterColor": "#E8985E" if is_left else "#5B9BD5",
            }
            if en_t:
                thought["text"] = {"zh": zh_t, "en": en_t}
            else:
                thought["text"] = zh_t
            part_data["thoughts"].append(thought)
        
        # Inner thoughts (>)
        quotes = re.findall(r'^>\s*(.+)$', body, re.MULTILINE)
        for q in quotes:
            qtext = clean(q)
            if not qtext:
                continue
            zh_q = qtext
            en_q = ""
            si = qtext.rfind('/')
            if si > 0:
                me = qtext[si+1:].strip()
                if me and re.match(r'^[A-Za-z]', me):
                    zh_q = clean(qtext[:si])
                    en_q = clean(me)
            
            it = {"character": "\u5728\u60f3", "characterColor": "#9B8B4"}
            if en_q:
                it["text"] = {"zh": zh_q, "en": en_q}
            else:
                it["text"] = zh_q
            part_data["thoughts"].append(it)
        
        result["parts"].append(part_data)
    
    # Summary
    sm = re.search(r'##\s+\u603b\u7ed3\s*\n(.+?)(?=\n##|\Z)', content, re.DOTALL)
    if sm:
        stext = clean(sm.group(1))
        result["summary"]["title"] = stext
        steps = [s.strip() for s in re.split(r'[，。；]', stext) if len(s.strip()) > 4]
        result["summary"]["socialSteps"] = steps[:5] if steps else [stext]
    
    # Owl wisdom
    om = re.search(r'##\s+\u732b\u5934\u9e70\u667a\u6167\s*\n(.+?)(?=\n##|\Z)', content, re.DOTALL)
    if om and result["parts"]:
        result["parts"][-1]["owlWisdom"] = clean(om.group(1))
    
    return result if result["title"] else None


# Step 4: 匹配资源并构建数据
print("\n=== Step 4: Building data ===")

def find_audio(scene_id, pnum):
    """智能查找 part N 的音频"""
    aud_dir = os.path.join(AUD_BASE, scene_id)
    if not os.path.exists(aud_dir):
        return None
    
    all_files = os.listdir(aud_dir)
    mp3_files = [f for f in all_files if f.endswith('.mp3')]
    
    found_zh = None
    found_en = None
    
    for af in mp3_files:
        afl = af.lower()
        # Super pattern: matches ALL formats:
        #   part1-zh.mp3, part1_en.mp3 (standard)
        #   s06p1_zh.mp3, s06p1_en.mp3 (compact)
        #   s13-part1-zh.mp3, s13-part1-en.mp3 (prefixed)
        #   s-32_part1_cn.mp3, s-32_part1_en.mp3 (underscore + cn/en)
        pattern = r"(.*?)[_.\-]?p(?:art)?%d[_.\-]?(zh|cn|en)\.mp3$" % pnum
        
        m = re.search(pattern, afl)
        if m:
            lang_type = m.group(2)
            if lang_type in ("zh", "cn"):
                if not found_zh:
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
    
    # Try single file: partN.mp3
    for af in mp3_files:
        if re.match(r'^part%d\.mp3$' % pnum, af):
            return "/audio/%s/%s" % (scene_id, af)
    
    return None


carnegie_catalog = []
social_story_catalog = {}
scenes = {}

for dir_name, info in sorted_items:
    scene_id = info["id"]
    scene_path = os.path.join(SCENES_ROOT, dir_name)
    
    # Get images
    img_dir = os.path.join(IMG_BASE, scene_id)
    images = []
    if os.path.exists(img_dir):
        for ext in ['*.png', '*.jpg', '*.jpeg']:
            images.extend(glob.glob(os.path.join(img_dir, ext)))
    images = sorted(images)
    
    if not images:
        print("  SKIP %s: no images" % scene_id)
        continue
    
    # Map images to parts
    part_images = {}
    for ipath in images:
        fname = os.path.basename(ipath)
        pm = re.match(r'(part(\d+))-.+\.(png|jpg|jpeg)', fname)
        if pm:
            pn = int(pm.group(2))
            if pn not in part_images:
                part_images[pn] = "/images/%s/%s" % (scene_id, fname)
        else:
            pm2 = re.match(r'.*?[_.\-]?p(?:art)?(\d+)[_.\-]?.*?\.(png|jpg|jpeg)', fname)
            if pm2:
                pn = int(pm2.group(1))
                if pn not in part_images:
                    part_images[pn] = "/images/%s/%s" % (scene_id, fname)
    
    # Parse text.md
    text_md = os.path.join(scene_path, "text.md")
    scene_data = parse_text_md(text_md)
    
    if scene_data is None:
        title = dir_name.split('-', 1)[-1] if '-' in dir_name else dir_name
        scene_data = {
            "title": title, "subtitle": "\u793e\u4ea4\u6545\u4e8b",
            "principle": "", "difficulty": 1,
            "characters": ["\u963f\u5e03"], "parts": [],
            "summary": {"title": "", "socialSteps": []}
        }
    
    scene_data["id"] = scene_id
    
    # Merge
    existing_parts = scene_data.get("parts", [])
    new_parts = []
    
    for pnum in sorted(part_images.keys()):
        img_path = part_images[pnum]
        
        if pnum <= len(existing_parts):
            part = dict(existing_parts[pnum - 1])
            part["image"] = img_path
            part["id"] = "part%d" % pnum
            
            aud = find_audio(scene_id, pnum)
            if aud:
                part["audio"] = aud
            
            new_parts.append(part)
        else:
            part = {
                "id": "part%d" % pnum,
                "image": img_path,
                "narration": scene_data["title"],
                "thoughts": []
            }
            aud = find_audio(scene_id, pnum)
            if aud:
                part["audio"] = aud
            new_parts.append(part)
    
    # Clean up narrations
    for p in new_parts:
        n = p.get("narration")
        if n == "" or n == {} or n == {"zh": "", "en": ""}:
            p["narration"] = scene_data["title"]
        elif isinstance(n, dict) and n.get("en") == "":
            if n.get("zh"):
                p["narration"] = n["zh"]
    
    scene_data["parts"] = new_parts
    
    # Classify
    is_carnegie = (len(new_parts) >= 6)
    
    entry = {
        "id": scene_id,
        "title": scene_data["title"],
        "principle": scene_data.get("principle", ""),
        "difficulty": scene_data.get("difficulty", 1),
        "unlocked": True,
        "coverImage": new_parts[0]["image"] if new_parts else ""
    }
    
    if is_carnegie:
        carnegie_catalog.append(entry)
    else:
        social_story_catalog[scene_id] = entry
    
    scenes[scene_id] = scene_data

# Convert social_story_catalog dict to list (sorted)
social_list = sorted(social_story_catalog.values(), key=lambda x: x["id"])

# Build output
output = {
    "version": "2026-05-30-v6-final",
    "title": "\u793e\u4ea4\u8bad\u7ec3",
    "description": "\u5b8c\u6574\u8fc1\u79fb\u81ea fox-school | %d \u573a\u666f | \u5361\u8010\u57fa%d + \u793e\u4ea4%d" % (
        len(scenes), len(carnegie_catalog), len(social_list)),
    "carnegieCatalog": carnegie_catalog,
    "socialStoryCatalog": social_list,
    "sceneData": scenes
}

out_path = "/tmp/social-scenes-full.json"
with open(out_path, 'w', encoding='utf-8') as f:
    json.dump(output, f, ensure_ascii=False, indent=2)

print("\n=== \u7ed3\u679c\u7edf\u8ba1 ===")
print("\u603b\u573a\u666f: %d" % len(scenes))
print("\u5361\u8010\u57fa(6+parts): %d" % len(carnegie_catalog))
print("\u793e\u4ea4\u6545\u4e8b(3parts): %d" % len(social_list))

# Zod validation check
print("\n=== Zod \u6821\u9a8c ===")
errors = []
for sid, sd in scenes.items():
    for i, p in enumerate(sd["parts"]):
        a = p.get("audio")
        if a == {} or a == {"zh": "", "en": ""}:
            errors.append("%s part%d: empty audio" % (sid, i+1))
        n = p.get("narration")
        if n == "" or n == {} or n == {"zh": "", "en": ""}:
            errors.append("%s part%d: empty narration" % (sid, i+1))

if errors:
    print("  Issues: %d" % len(errors))
    for e in errors[:10]:
        print("    %s" % e)
else:
    print("  OK!")

# Audio stats
has_audio = 0
no_audio = 0
for sd in scenes.values():
    if any(p.get("audio") for p in sd["parts"]):
        has_audio += 1
    else:
        no_audio += 1
print("  Audio: %d with, %d without" % (has_audio, no_audio))

# Show sample
print("\n=== Sample: s-01 ===")
if "s-01" in scenes:
    s = scenes["s-01"]
    print("  title: %s" % s["title"])
    print("  parts: %d" % len(s["parts"]))
    if s["parts"]:
        p = s["parts"][0]
        print("  p1 image: %s" % str(p.get("image",""))[:60])
        print("  p1 audio: %s" % str(p.get("audio","NONE"))[:60])
        print("  p1 narr: %s" % str(p.get("narration",""))[:60])

print("\nSample: s09 (first 6-part)")
for sid in sorted(scenes.keys()):
    sd = scenes[sid]
    if len(sd["parts"]) >= 6:
        print("  %s: %s (%dp) audio=%s" % (
            sid, sd["title"][:30], len(sd["parts"]),
            "YES" if any(p.get("audio") for p in sd["parts"]) else "NO"
        ))
        break

print("\nDone! Output: %s (%d bytes)" % (out_path, os.path.getsize(out_path)))
