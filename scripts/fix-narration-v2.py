#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
v8: Fix ALL regex to use actual Chinese characters (not unicode escapes in raw strings)
"""
import json, os, re, glob

SCENES_ROOT = "/root/workspace_backup/fox-school/scenes"
IMG_BASE = "/var/www/feiman-v3-new/images"
AUD_BASE = "/var/www/feiman-v3-new/audio"

# Pre-defined Chinese strings for regex (MUST be actual characters, not \u escapes)
NARR_ZH_LABEL = '**旁白（中文）**'
NARR_EN_LABEL = '**旁白（英文）**'
BUBBLE_LABEL = '**气泡'
SUMMARY_LABEL = '## 总结'
OWL_LABEL = '## 猫头鹰智慧'

def clean(s):
    return re.sub(r'\s+', ' ', s).strip()

def get_scene_id(dir_name):
    if dir_name.startswith("social-"):
        base = "-".join(dir_name.split("-")[:2])
        return (base, "zzz" + base)
    m = re.match(r'^(s-\d+)', dir_name)
    if m:
        try: num = int(m.group(1).replace('-', ''))
        except: num = 999
        return (m.group(1), "%03d" % num)
    m = re.match(r'^(s\d+)', dir_name)
    if m:
        try: num = int(m.group(1)[1:])
        except: num = 999
        return (m.group(1), "%03d" % num)
    return (dir_name, "999")

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
        unique_id = base_id + chr(ord('a') + id_usage[base_id] - 1)
    else:
        id_usage[base_id] = 1
        unique_id = base_id
    id_map[d] = {"id": unique_id, "sort": sort_key}
sorted_items = sorted(id_map.items(), key=lambda x: x[1]["sort"])
print("Total scenes: %d" % len(sorted_items))

print("\n=== Step 2: Parsing text.md ===")

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
    
    # Use Chinese labels directly
    for pattern, key in [
        (r'类型[：:](.+)', 'subtitle'),
        (r'核心技能[：:](.+)', 'principle'),
        (r'难度[：:](\d+)', 'difficulty'),
        (r'角色[：:](.+)', 'characters'),
    ]:
        m = re.search(pattern, content)
        if m:
            val = clean(m.group(1))
            if key == 'difficulty':
                result[key] = int(val)
            elif key == 'characters':
                result[key] = [r.strip() for r in val.split('、')]
            else:
                result[key] = val
    
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
            ns = re.search(r'\n##\s+(总结|猫头鹰智慧)', content[start:])
            end = (start + ns.start()) if ns else len(content)
        
        body = content[start:end].strip()
        
        part_data = {
            "id": "part%d" % pnum,
            "image": "",
            "narration": "",
            "thoughts": []
        }
        
        # Use Chinese label constants!
        zh_m = re.search(re.escape(NARR_ZH_LABEL) + r'[：:](.+?)(?=\*\*|$)', body, re.DOTALL)
        en_m = re.search(re.escape(NARR_EN_LABEL) + r'[：:](.+?)(?=\*\*|$)', body, re.DOTALL)
        
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
        
        # Thought bubbles - use Chinese
        bubbles = re.findall(
            r'\*\*气泡（([左右])-([^)）]+)）\*\*[：:](.+?)(?=\*\*气泡|\n>|$)',
            body, re.DOTALL
        )
        for side, char, raw_text in bubbles:
            is_left = (side == '左')
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
            
            it = {"character": "在想", "characterColor": "#9B8B4"}
            if en_q:
                it["text"] = {"zh": zh_q, "en": en_q}
            else:
                it["text"] = zh_q
            part_data["thoughts"].append(it)
        
        result["parts"].append(part_data)
    
    sm = re.search(r'##\s+总结\s*\n(.+?)(?=\n##|\Z)', content, re.DOTALL)
    if sm:
        stext = clean(sm.group(1))
        result["summary"]["title"] = stext
        steps = [s.strip() for s in re.split(r'[，。；]', stext) if len(s.strip()) > 4]
        result["summary"]["socialSteps"] = steps[:5] if steps else [stext]
    
    om = re.search(r'##\s+猫头鹰智慧\s*\n(.+?)(?=\n##|\Z)', content, re.DOTALL)
    if om and result["parts"]:
        result["parts"][-1]["owlWisdom"] = clean(om.group(1))
    
    return result if result["title"] else None

def find_audio(scene_id, pnum):
    aud_dir = os.path.join(AUD_BASE, scene_id)
    if not os.path.exists(aud_dir): return None
    mp3_files = [f for f in os.listdir(aud_dir) if f.endswith('.mp3')]
    found_zh = None
    found_en = None
    pattern = r"(.*?)[_.\-]?p(?:art)?%d[_.\-]?(zh|cn|en)\.mp3$" % pnum
    for af in mp3_files:
        m = re.search(pattern, af.lower())
        if m:
            if m.group(2) in ("zh", "cn"):
                if not found_zh: found_zh = af
            elif m.group(2) == "en":
                found_en = af
    if found_zh or found_en:
        result = {}
        if found_zh: result["zh"] = "/audio/%s/%s" % (scene_id, found_zh)
        if found_en: result["en"] = "/audio/%s/%s" % (scene_id, found_en)
        return result
    return None

print("\n=== Step 3: Building data ===")
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
        print("  SKIP %s" % scene_id); continue
    
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
    
    scene_data = parse_text_md(os.path.join(scene_path, "text.md"))
    if scene_data is None:
        title = dir_name.split('-', 1)[-1] if '-' in dir_name else dir_name
        scene_data = {"title": title, "subtitle": "社交故事", "principle": "", "difficulty": 1,
                      "characters": ["阿布"], "parts": [], "summary": {"title": "", "socialSteps": []}}
    
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
            if aud: part["audio"] = aud
            new_parts.append(part)
        else:
            part = {"id": "part%d" % pnum, "image": img_path, "narration": scene_data["title"], "thoughts": []}
            aud = find_audio(scene_id, pnum)
            if aud: part["audio"] = aud
            new_parts.append(part)
    
    for p in new_parts:
        n = p.get("narration")
        if n == "" or n == {} or n == {"zh": "", "en": ""}:
            p["narration"] = scene_data["title"]
        elif isinstance(n, dict) and n.get("en") == "" and n.get("zh"):
            p["narration"] = n["zh"]
    
    scene_data["parts"] = new_parts
    is_carnegie = (len(new_parts) >= 6)
    
    entry = {"id": scene_id, "title": scene_data["title"], "principle": scene_data.get("principle", ""),
             "difficulty": scene_data.get("difficulty", 1), "unlocked": True,
             "coverImage": new_parts[0]["image"] if new_parts else ""}
    
    if is_carnegie: carnegie_catalog.append(entry)
    else: social_story_catalog[scene_id] = entry
    scenes[scene_id] = scene_data

social_list = sorted(social_story_catalog.values(), key=lambda x: x["id"])

output = {
    "version": "2026-05-30-v8-fixed-en",
    "title": "社交训练",
    "description": "v8: fixed EN | %d scenes | C=%d S=%d" % (len(scenes), len(carnegie_catalog), len(social_list)),
    "carnegieCatalog": carnegie_catalog,
    "socialStoryCatalog": social_list,
    "sceneData": scenes
}

out_path = "/tmp/social-scenes-full.json"
with open(out_path, 'w', encoding='utf-8') as f:
    json.dump(output, f, ensure_ascii=False, indent=2)

# Stats
print("\n=== Results ===")
print("Total: %d  Carnegie: %d  Social: %d" % (len(scenes), len(carnegie_catalog), len(social_list)))

errors = []
for sid, sd in scenes.items():
    for i, p in enumerate(sd["parts"]):
        a = p.get("audio")
        if a == {} or a == {"zh": "", "en": ""}: errors.append("%s p%d audio" % (sid, i+1))
        n = p.get("narration")
        if n == "" or n == {} or n == {"zh": "", "en": ""}: errors.append("%s p%d narr" % (sid, i+1))
print("Zod issues: %d" % len(errors) if errors else "Zod: OK!")

en_count = 0
for sid, sd in scenes.items():
    for p in sd["parts"]:
        n = p.get("narration")
        if isinstance(n, dict) and n.get("en"): en_count += 1; break
print("EN narration: %d/%d scenes" % (en_count, len(scenes)))
has_aud = sum(1 for sd in scenes.values() if any(p.get("audio") for p in sd["parts"]))
print("Audio: %d with / %d without" % (has_aud, len(scenes) - has_aud))

if "s16" in scenes:
    p = scenes["s16"]["parts"][0]
    print("\ns16 p1 sample:")
    print("  narr:", str(p.get("narration"))[:120])
    print("  audio:", str(p.get("audio","NONE"))[:80])

print("\nDone! %d bytes" % os.path.getsize(out_path))
