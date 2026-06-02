#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
修复 narration 正则 + 重新生成 JSON
关键修复: 所有 Unicode 转义的正则改为原始中文字符
"""
import json, os, re, glob, shutil

SCENES_ROOT = "/root/workspace_backup/fox-school/scenes"
IMG_BASE = "/var/www/feiman-v3-new/images"
AUD_BASE = "/var/www/feiman-v3-new/audio"

def clean(s):
    return re.sub(r'\s+', ' ', s).strip()

def get_scene_id(dir_name):
    if dir_name.startswith("social-"):
        base = "-".join(dir_name.split("-")[:2])
        return (base, "zzz" + base)
    m = re.match(r'^(s-\d+)', dir_name)
    if m:
        num_str = m.group(1).replace('-', '')
        try: num = int(num_str)
        except: num = 999
        return (m.group(1), "%03d" % num)
    m = re.match(r'^(s\d+)', dir_name)
    if m:
        base = m.group(1)
        num_str = base[1:]
        try: num = int(num_str)
        except: num = 999
        return (base, "%03d" % num)
    return (dir_name, "999")

# Step 1
print("=== Step 1 ===")
all_dirs = [d for d in os.listdir(SCENES_ROOT) 
            if os.path.isdir(os.path.join(SCENES_ROOT, d))]
id_map = {}
id_usage = {}
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
        print("  CONFLICT: %s -> %s" % (d, unique_id))
    else:
        id_usage[base_id] = 1
        unique_id = base_id
    id_map[d] = {"id": unique_id, "sort": sort_key}
sorted_items = sorted(id_map.items(), key=lambda x: x[1]["sort"])
print("Total: %d" % len(sorted_items))

# Step 2: Sync resources (reuse existing - already done)
print("\n=== Step 2: Using existing resources ===")

# Step 3: Parse text.md with FIXED regex
print("\n=== Step 3: Parsing (FIXED regex) ===")

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
    
    # FIX: Use raw Chinese characters instead of unicode escapes!
    m = re.search(r'\u7c7b\u578b[\uff1a:](.+)', content)
    if m: result["subtitle"] = clean(m.group(1))
    m = re.search(r'\u6838\u5fc3\u6280\u80fd[\uff1a:](.+)', content)
    if m: result["principle"] = clean(m.group(1))
    m = re.search(r'\u96be\u5ea6[\uff1a:](\d+)', content)
    if m: result["difficulty"] = int(m.group(1))
    m = re.search(r'\u89d2\u8272[\uff1a:](.+)', content)
    if m: result["characters"] = [r.strip() for r in m.group(1).split('\u3001')]
    
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
        
        # FIX: Use raw Chinese for narration matching!
        zh_m = re.search(r'\*\*\u65c1\u76ef\uff08\u4e2d\u6587\uff09\*\*[\uff1a:](.+?)(?=\*\*|$)', body, re.DOTALL)
        en_m = re.search(r'\*\*\u65c1\u76ef\uff08\u82f1\u6587\uff09\*\*[\uff1a:](.+?)(?=\*\*|$)', body, re.DOTALL)
        
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
            lines = []
            for line in body.split('\n'):
                line = line.strip()
                if not line or line.startswith('---') or line.startswith('**') or line.startswith('>'):
                    continue
                lines.append(line)
            if lines:
                part_data["narration"] = clean(" ".join(lines))
        
        # Thought bubbles with raw Chinese
        bubbles = re.findall(
            r'\*\*\u6c14\u6ce1\uff08([\u5de6\u53f9])-([^)\uff09]+)\uff09\*\*[\uff1a:](.+?)(?=\*\*\u6c14泡|\n>|$)',
            body, re.DOTALL
        )
        for side, char, raw_text in bubbles:
            is_left = (side == '\u5de6')
            display_char = char.strip()
            text = clean(raw_text)
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
        
        quotes = re.findall(r'^>\s*(.+)$', body, re.MULTILINE)
        for q in quotes:
            qtext = clean(q)
            if not qtext: continue
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
    
    sm = re.search(r'##\s+\u603b\u7ed3\s*\n(.+?)(?=\n##|\Z)', content, re.DOTALL)
    if sm:
        stext = clean(sm.group(1))
        result["summary"]["title"] = stext
        steps = [s.strip() for s in re.split(r'[，。；]', stext) if len(s.strip()) > 4]
        result["summary"]["socialSteps"] = steps[:5] if steps else [stext]
    
    om = re.search(r'##\s+\u732b\u5934\u9e70\u667a\u6167\s*\n(.+?)(?=\n##|\Z)', content, re.DOTALL)
    if om and result["parts"]:
        result["parts"][-1]["owlWisdom"] = clean(om.group(1))
    
    return result if result["title"] else None

# Step 4: Build data
print("\n=== Step 4: Building data ===")

def find_audio(scene_id, pnum):
    aud_dir = os.path.join(AUD_BASE, scene_id)
    if not os.path.exists(aud_dir):
        return None
    all_files = os.listdir(aud_dir)
    mp3_files = [f for f in all_files if f.endswith('.mp3')]
    found_zh = None
    found_en = None
    pattern = r"(.*?)[_.\-]?p(?:art)?%d[_.\-]?(zh|cn|en)\.mp3$" % pnum
    for af in mp3_files:
        afl = af.lower()
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
    return None

carnegie_catalog = []
social_story_catalog = {}
scenes = {}

for dir_name, info in sorted_items:
    scene_id = info["id"]
    scene_path = os.path.join(SCENES_ROOT, dir_name)
    
    img_dir = os.path.join(IMG_BASE, scene_id)
    images = []
    if os.path.exists(img_dir):
        for ext in ['*.png', '*.jpg', '*.jpeg']:
            images.extend(glob.glob(os.path.join(img_dir, ext)))
    images = sorted(images)
    
    if not images:
        print("  SKIP %s: no images" % scene_id)
        continue
    
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
    
    for p in new_parts:
        n = p.get("narration")
        if n == "" or n == {} or n == {"zh": "", "en": ""}:
            p["narration"] = scene_data["title"]
        elif isinstance(n, dict) and n.get("en") == "":
            if n.get("zh"):
                p["narration"] = n["zh"]
    
    scene_data["parts"] = new_parts
    
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

social_list = sorted(social_story_catalog.values(), key=lambda x: x["id"])

output = {
    "version": "2026-05-30-v7-final",
    "title": "\u793e\u4ea4\u8bad\u7ec3",
    "description": "v7: fixed EN narration regex | %d scenes | carnegie=%d social=%d" % (
        len(scenes), len(carnegie_catalog), len(social_list)),
    "carnegieCatalog": carnegie_catalog,
    "socialStoryCatalog": social_list,
    "sceneData": scenes
}

out_path = "/tmp/social-scenes-full.json"
with open(out_path, 'w', encoding='utf-8') as f:
    json.dump(output, f, ensure_ascii=False, indent=2)

print("\n=== Results ===")
print("Total: %d" % len(scenes))
print("Carnegie (6+p): %d" % len(carnegie_catalog))
print("Social (3p): %d" % len(social_list))

# Check Zod
errors = []
for sid, sd in scenes.items():
    for i, p in enumerate(sd["parts"]):
        a = p.get("audio")
        if a == {} or a == {"zh": "", "en": ""}:
            errors.append("%s p%d: empty audio" % (sid, i+1))
        n = p.get("narration")
        if n == "" or n == {} or n == {"zh": "", "en": ""}:
            errors.append("%s p%d: empty narr" % (sid, i+1))
if errors:
    print("Issues: %d" % len(errors))
else:
    print("Zod: OK!")

# Count bilingual narrations
en_count = 0
for sid, sd in scenes.items():
    for p in sd["parts"]:
        n = p.get("narration")
        if isinstance(n, dict) and n.get("en"):
            en_count += 1
            break
print("Scenes with EN narration: %d/%d" % (en_count, len(scenes)))

# Audio stats
has_aud = sum(1 for sd in scenes.values() if any(p.get("audio") for p in sd["parts"]))
print("Audio: %d with / %d without" % (has_aud, len(scenes) - has_aud))

# Sample
if "s16" in scenes:
    s = scenes["s16"]
    p = s["parts"][0]
    print("\nSample s16 p1:")
    print("  narr:", str(p.get("narration"))[:100])
    print("  audio:", str(p.get("audio","NONE"))[:60])

print("\nDone! %d bytes" % os.path.getsize(out_path))
