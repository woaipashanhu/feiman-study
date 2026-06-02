#!/usr/bin/env python3
"""
v3: 修复 ID 冲突 + 重新同步资源 + 生成 JSON
对于冲突的 s09/s10 等使用 s09a/s09b 或完整短名
"""
import json, os, re, glob, shutil

SCENES_ROOT = "/root/workspace_backup/fox-school/scenes"
IMG_BASE = "/var/www/feiman-v3-new/images"
AUD_BASE = "/var/www/feiman-v3-new/audio"

def extract_scene_id(dir_name):
    """提取唯一场景ID"""
    if dir_name.startswith("social-"):
        return "-".join(dir_name.split("-")[:2])
    m = re.match(r'^(s-\d+)', dir_name)
    if m: return m.group(1)
    m = re.match(r'^(s\d+)', dir_name)
    if m: 
        base = m.group(1)
        # 对于可能有冲突的 s06-s16 格式，用更多字符区分
        rest = dir_name[len(base):]
        if rest.startswith('-'):
            # 取标题前2个字作为后缀来区分
            title_part = rest[1:]  # 去掉开头的 -
            short_title = re.sub(r'[^\u4e00-\u9fa5]', '', title_part)[:2]
            return f"{base}-{short_title}"
        return base
    return dir_name

def clean(s):
    return re.sub(r'\s+', ' ', s).strip()

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
    m = re.search(r'类型[：:]\s*(.+)', content)
    if m: result["subtitle"] = clean(m.group(1))
    m = re.search(r'核心技能[：:]\s*(.+)', content)
    if m: result["principle"] = clean(m.group(1))
    m = re.search(r'难度[：:]\s*(\d+)', content)
    if m: result["difficulty"] = int(m.group(1))
    m = re.search(r'角色[：:]\s*(.+)', content)
    if m: result["characters"] = [r.strip() for r in m.group(1).split("、")]
    
    part_headers = list(re.finditer(
        r'^##\s*Part\s*(\d+)(?:\s*[—\-–]\s*(.+?))?(?:\s*[（(]([^)）]+)[)）])?\s*$',
        content, re.MULTILINE
    ))
    
    for idx, ph in enumerate(part_headers):
        pnum = int(ph.group(1))
        start = ph.end()
        if idx + 1 < len(part_headers):
            end = part_headers[idx + 1].start()
        else:
            ns = re.search(r'\n##\s+(?:总结|猫头鹰智慧|总结与反思)', content[start:])
            end = (start + ns.start()) if ns else len(content)
        
        body = content[start:end].strip()
        part_data = {
            "id": f"part{pnum}", "image": "", "audio": {},
            "narration": {"zh": "", "en": ""}, "thoughts": []
        }
        
        zh_narr = re.search(r'\*\*旁白（中文）\*\*[：:]\s*(.+?)(?=\*\*|$)', body, re.DOTALL)
        en_narr = re.search(r'\*\*旁白（英文）\*\*[：:]\s*(.+?)(?=\*\*|$)', body, re.DOTALL)
        
        if zh_narr and en_narr:
            part_data["narration"] = {"zh": clean(zh_narr.group(1)), "en": clean(en_narr.group(1))}
        elif zh_narr:
            part_data["narration"] = clean(zh_narr.group(1))
        else:
            narr_lines = []
            for line in body.split('\n'):
                line = line.strip()
                if not line or line.startswith('---') or line.startswith('**气泡') or line.startswith('>'):
                    continue
                narr_lines.append(line)
            if narr_lines:
                part_data["narration"] = clean(" ".join(narr_lines))
        
        cn_bubbles = re.findall(
            r'\*\*气泡（([左右])-([^）]+)）\*\*[：:]\s*(.+?)(?=\*\*气泡|\n>|$)',
            body, re.DOTALL
        )
        for side, char, raw_text in cn_bubbles:
            is_left = side == '左'
            display_char = char.strip()
            text = clean(raw_text)
            zh_text, en_text = text, ""
            sp = text.rsplit('/', 1)
            if len(sp) == 2 and re.match(r'^[A-Za-z]', sp[1].strip()):
                zh_text, en_text = clean(sp[0]), clean(sp[1])
            part_data["thoughts"].append({
                "character": display_char,
                "characterColor": "#E8985E" if is_left else "#5B9BD5",
                "text": {"zh": zh_text, "en": en_text} if en_text else zh_text
            })
        
        quotes = re.findall(r'^>\s*(.+)$', body, re.MULTILINE)
        for q in quotes:
            qtext = clean(q)
            if not qtext: continue
            zh_q, en_q = qtext, ""
            sp = qtext.rsplit('/', 1)
            if len(sp) == 2 and re.match(r'^[A-Za-z]', sp[1].strip()):
                zh_q, en_q = clean(sp[0]), clean(sp[1])
            part_data["thoughts"].append({
                "character": "在想", "characterColor": "#9B8BB4",
                "text": {"zh": zh_q, "en": en_q} if en_q else zh_q
            })
        
        result["parts"].append(part_data)
    
    sum_m = re.search(r'##\s*总结\s*\n(.+?)(?=\n##|\Z)', content, re.DOTALL)
    if sum_m:
        stext = clean(sum_m.group(1))
        result["summary"]["title"] = stext
        steps = [s.strip() for s in re.split(r'[，。；]', stext) if len(s.strip()) > 4]
        result["summary"]["socialSteps"] = steps[:5] if steps else [stext]
    
    owl_m = re.search(r'##\s*猫头鹰智慧\s*\n(.+?)(?=\n##|\Z)', content, re.DOTALL)
    if owl_m and result["parts"]:
        result["parts"][-1]["owlWisdom"] = clean(owl_m.group(1))
    
    return result if result["title"] else None

def get_images(scene_id):
    d = os.path.join(IMG_BASE, scene_id)
    if not os.path.exists(d): return []
    files = []
    for ext in ['*.png', '*.jpg', '*.jpeg']:
        files.extend(glob.glob(os.path.join(d, ext)))
    return sorted(files)

def get_audio(scene_id, pnum):
    d = os.path.join(AUD_BASE, scene_id)
    if not os.path.exists(d): return {}
    r = {}
    zf = os.path.join(d, f"part{pnum}-zh.mp3")
    ef = os.path.join(d, f"part{pnum}-en.mp3")
    sf = os.path.join(d, f"part{pnum}.mp3")
    if os.path.exists(zf): r["zh"] = f"/audio/{scene_id}/part{pnum}-zh.mp3"
    if os.path.exists(ef): r["en"] = f"/audio/{scene_id}/part{pnum}-en.mp3"
    if not r and os.path.exists(sf): r = f"/audio/{scene_id}/part{pnum}.mp3"
    return r

def main():
    # Step 1: 清理并重新同步（使用新的 ID 策略）
    print("=== Step 1: Re-syncing resources with unique IDs ===")
    if os.path.exists(IMG_BASE): shutil.rmtree(IMG_BASE)
    if os.path.exists(AUD_BASE): shutil.rmtree(AUD_BASE)
    os.makedirs(IMG_BASE, exist_ok=True)
    os.makedirs(AUD_BASE, exist_ok=True)
    
    dirs = sorted([d for d in os.listdir(SCENES_ROOT) 
                   if os.path.isdir(os.path.join(SCENES_ROOT, d))])
    
    id_map = {}  # track used IDs to detect conflicts
    
    for dir_name in dirs:
        scene_id = extract_scene_id(dir_name)
        scene_path = os.path.join(SCENES_ROOT, dir_name)
        
        has_img = os.path.exists(os.path.join(scene_path, "images"))
        has_aud = os.path.exists(os.path.join(scene_path, "audio"))
        if not has_img and not has_aud: continue
        
        # Handle ID conflicts by appending counter
        base_id = scene_id
        if scene_id in id_map:
            counter = 2
            while f"{base_id}_{counter}" in id_map:
                counter += 1
            scene_id = f"{base_id}_{counter}"
            print(f"  ID conflict: {dir_name} -> {scene_id} (was {base_id})")
        
        id_map[scene_id] = dir_name
        
        img_dir = os.path.join(scene_path, "images")
        aud_dir = os.path.join(scene_path, "audio")
        
        if has_img:
            dst_img = os.path.join(IMG_BASE, scene_id)
            os.makedirs(dst_img, exist_ok=True)
            for f in os.listdir(img_dir):
                shutil.copy2(os.path.join(img_dir, f), os.path.join(dst_img, f))
        
        if has_aud:
            dst_aud = os.path.join(AUD_BASE, scene_id)
            os.makedirs(dst_aud, exist_ok=True)
            for f in os.listdir(aud_dir):
                if f.endswith('.mp3'):
                    shutil.copy2(os.path.join(aud_dir, f), os.path.join(dst_aud, f))
    
    total_img = sum(len(files) for _, _, files in os.walk(IMG_BASE))
    total_aud = sum(1 for _, _, files in os.walk(AUD_BASE) for f in files if f.endswith('.mp3'))
    print(f"  Synced: {len(id_map)} scenes, {total_img} images, {total_aud} audio files")
    
    # Step 2: Generate JSON
    print("\n=== Step 2: Generating social-scenes.json ===")
    carnegie_catalog = []
    social_story_catalog = []
    scenes = {}
    
    for scene_id, dir_name in id_map.items():
        scene_path = os.path.join(SCENES_ROOT, dir_name)
        
        images = get_images(scene_id)
        if not images: continue
        
        text_md = os.path.join(scene_path, "text.md")
        scene_data = parse_text_md(text_md)
        
        if scene_data is None:
            scene_data = {
                "id": scene_id,
                "title": dir_name.split('-', 1)[-1] if '-' in dir_name else dir_name,
                "subtitle": "社交故事", "principle": "", "difficulty": 1,
                "characters": ["阿布"], "parts": [],
                "summary": {"title": "", "socialSteps": []}
            }
        
        scene_data["id"] = scene_id
        
        part_images = {}
        for img_path in images:
            fname = os.path.basename(img_path)
            pm = re.match(r'(part(\d+))-.+\.(png|jpg|jpeg)', fname)
            if pm:
                pn = int(pm.group(2))
                if pn not in part_images: part_images[pn] = f"/images/{scene_id}/{fname}"
            else:
                pm2 = re.match(r'.*p(\d+)\.(png|jpg|jpeg)', fname)
                if pm2:
                    pn = int(pm2.group(1))
                    if pn not in part_images: part_images[pn] = f"/images/{scene_id}/{fname}"
        
        existing_parts = scene_data.get("parts", [])
        new_parts = []
        for pnum in sorted(part_images.keys()):
            img_path = part_images[pnum]
            if pnum <= len(existing_parts):
                part = dict(existing_parts[pnum - 1])
                part["image"] = img_path
                part["id"] = f"part{pnum}"
                aud = get_audio(scene_id, pnum)
                if aud: part["audio"] = aud
                new_parts.append(part)
            else:
                new_parts.append({
                    "id": f"part{pnum}", "image": img_path,
                    "audio": get_audio(scene_id, pnum),
                    "narration": {"zh": scene_data["title"], "en": ""},
                    "thoughts": []
                })
        
        scene_data["parts"] = new_parts
        
        if not scene_data["parts"] and images:
            scene_data["parts"] = []
            for i, ip in enumerate(sorted(images)):
                pn = i + 1
                scene_data["parts"].append({
                    "id": f"part{pn}",
                    "image": f"/images/{scene_id}/{os.path.basename(ip)}",
                    "audio": get_audio(scene_id, pn),
                    "narration": {"zh": scene_data["title"], "en": ""},
                    "thoughts": []
                })
        
        entry = {
            "id": scene_id, "title": scene_data["title"],
            "principle": scene_data.get("principle", ""),
            "difficulty": scene_data.get("difficulty", 1),
            "unlocked": True,
            "coverImage": scene_data["parts"][0]["image"] if scene_data["parts"] else ""
        }
        
        if scene_id.startswith("social"):
            social_story_catalog.append(entry)
        else:
            carnegie_catalog.append(entry)
        
        scenes[scene_id] = scene_data
    
    output = {
        "version": "2026-05-30-v5-full-fix",
        "title": "社交训练",
        "description": f"完整迁移自 fox-school | {len(scenes)} 个场景 | 自动生成",
        "carnegieCatalog": carnegie_catalog,
        "socialStoryCatalog": social_story_catalog,
        "sceneData": scenes
    }
    
    out_path = "/tmp/social-scenes-full.json"
    with open(out_path, 'w', encoding='utf-8') as f:
        json.dump(output, f, ensure_ascii=False, indent=2)
    
    print(f"  Generated: {len(scenes)} scenes ({len(carnegie)} carnegie, {len(social_story)} social)")
    print(f"  Output: {out_path} ({os.path.getsize(out_path)} bytes)")

if __name__ == "__main__":
    main()
