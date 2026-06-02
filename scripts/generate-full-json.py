#!/usr/bin/env python3
"""
根据服务器上实际同步的资源（images/ + audio/），
自动生成完整的 social-scenes.json。
从 text.md 中提取场景元数据和 parts 数据。
v2: 改进 text.md 解析，支持简单和复杂两种格式
"""
import json, os, re, glob

SCENES_ROOT = "/root/workspace_backup/fox-school/scenes"
IMG_BASE = "/var/www/feiman-v3-new/images"
AUD_BASE = "/var/www/feiman-v3-new/audio"

def extract_scene_id(dir_name):
    if dir_name.startswith("social-"):
        return "-".join(dir_name.split("-")[:2])
    m = re.match(r'^(s-\d+)', dir_name)
    if m: return m.group(1)
    m = re.match(r'^(s\d+)', dir_name)
    if m: return m.group(1)
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
    
    # 标题
    m = re.search(r'^#\s+(.+)', content, re.MULTILINE)
    if m: result["title"] = clean(m.group(1))
    
    # 类型
    m = re.search(r'类型[：:]\s*(.+)', content)
    if m: result["subtitle"] = clean(m.group(1))
    
    # 核心技能
    m = re.search(r'核心技能[：:]\s*(.+)', content)
    if m: result["principle"] = clean(m.group(1))
    
    # 难度
    m = re.search(r'难度[：:]\s*(\d+)', content)
    if m: result["difficulty"] = int(m.group(1))
    
    # 角色
    m = re.search(r'角色[：:]\s*(.+)', content)
    if m: result["characters"] = [r.strip() for r in m.group(1).split("、")]
    
    # ===== 解析 Parts =====
    # 匹配 ## Part N — 标题 或 ## Part N (标题) 或 ## Part 1 等各种格式
    part_headers = list(re.finditer(
        r'^##\s*Part\s*(\d+)(?:\s*[—\-–]\s*(.+?))?(?:\s*[（(]([^)）]+)[)）])?\s*$',
        content, re.MULTILINE
    ))
    
    for idx, ph in enumerate(part_headers):
        pnum = int(ph.group(1))
        ptitle = ""
        if ph.group(2): ptitle = clean(ph.group(2))
        elif ph.group(3): ptitle = clean(ph.group(3))
        
        # 确定 part body 范围: 从当前 header 到下一个 header 或总结或结尾
        start = ph.end()
        if idx + 1 < len(part_headers):
            end = part_headers[idx + 1].start()
        else:
            # 找到 ## 总结 或 ## 猫头鹰智慧 或文件尾
            next_section = re.search(r'\n##\s+(?:总结|猫头鹰智慧|总结与反思)', content[start:])
            end = (start + next_section.start()) if next_section else len(content)
        
        body = content[start:end].strip()
        
        part_data = {
            "id": f"part{pnum}",
            "image": "",
            "audio": {},
            "narration": {"zh": "", "en": ""},
            "thoughts": []
        }
        
        # --- 提取旁白 ---
        zh_narr = re.search(r'\*\*旁白（中文）\*\*[：:]\s*(.+?)(?=\*\*|$)', body, re.DOTALL)
        en_narr = re.search(r'\*\*旁白（英文）\*\*[：:]\s*(.+?)(?=\*\*|$)', body, re.DOTALL)
        
        if zh_narr and en_narr:
            part_data["narration"] = {
                "zh": clean(zh_narr.group(1)),
                "en": clean(en_narr.group(1))
            }
        elif zh_narr:
            part_data["narration"] = clean(zh_narr.group(1))
        else:
            # 简单格式: 整个 body 就是中文旁白（去掉 > 引用行和气泡标记）
            narr_lines = []
            for line in body.split('\n'):
                line = line.strip()
                if not line or line.startswith('---') or line.startswith('**气泡'):
                    continue
                if line.startswith('>'):
                    continue
                narr_lines.append(line)
            if narr_lines:
                part_data["narration"] = clean(" ".join(narr_lines))
        
        # --- 提取气泡 ---
        cn_bubbles = re.findall(
            r'\*\*气泡（([左右])-([^）]+)）\*\*[：:]\s*(.+?)(?=\*\*气泡|\n>|$)',
            body, re.DOTALL
        )
        for side, char, raw_text in cn_bubbles:
            is_left = side == '左'
            display_char = char.strip()
            
            # 分离中英文
            text = clean(raw_text)
            zh_text = text
            en_text = ""
            
            # 尝试按最后一个 '/' 分割中英文
            slash_parts = text.rsplit('/', 1)
            if len(slash_parts) == 2 and len(slash_parts[1].strip()) > 0:
                # 检查后半部分是否像英文
                maybe_en = slash_parts[1].strip()
                if re.match(r'^[A-Za-z]', maybe_en):
                    zh_text = clean(slash_parts[0])
                    en_text = clean(maybe_en)
            
            thought = {
                "character": display_char,
                "characterColor": "#E8985E" if is_left else "#5B9BD5",
                "text": {"zh": zh_text, "en": en_text} if en_text else zh_text
            }
            part_data["thoughts"].append(thought)
        
        # --- 提取内心独白 (> 引用) 作为补充 thought ---
        quotes = re.findall(r'^>\s*(.+)$', body, re.MULTILINE)
        for q in quotes:
            qtext = clean(q)
            if not qtext: continue
            # 分离中英文
            zh_q = qtext
            en_q = ""
            sp = qtext.rsplit('/', 1)
            if len(sp) == 2 and re.match(r'^[A-Za-z]', sp[1].strip()):
                zh_q = clean(sp[0])
                en_q = clean(sp[1])
            # 判断左右: 通常内心独白属于当前说话角色
            # 如果已有 thoughts，追加到最后一个的同类；否则新建
            ref_thought = {
                "character": "在想",
                "characterColor": "#9B8BB4",
                "text": {"zh": zh_q, "en": en_q} if en_q else zh_q
            }
            part_data["thoughts"].append(ref_thought)
        
        result["parts"].append(part_data)
    
    # ===== 总结 =====
    sum_m = re.search(r'##\s*总结\s*\n(.+?)(?=\n##|\Z)', content, re.DOTALL)
    if sum_m:
        stext = clean(sum_m.group(1))
        result["summary"]["title"] = stext
        steps = [s.strip() for s in re.split(r'[，。；]', stext) if len(s.strip()) > 4]
        result["summary"]["socialSteps"] = steps[:5] if steps else [stext]
    
    # ===== 猫头鹰智慧 =====
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
    if not r and os.path.exists(sf): 
        r = f"/audio/{scene_id}/part{pnum}.mp3"
    return r

def main():
    carnegie_catalog = []
    social_story_catalog = []
    scenes = {}
    
    dirs = sorted([d for d in os.listdir(SCENES_ROOT) 
                   if os.path.isdir(os.path.join(SCENES_ROOT, d))])
    
    for dir_name in dirs:
        scene_id = extract_scene_id(dir_name)
        scene_path = os.path.join(SCENES_ROOT, dir_name)
        
        if not (os.path.exists(os.path.join(scene_path, "images")) or 
                os.path.exists(os.path.join(scene_path, "audio"))):
            continue
        
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
        
        # 映射图片到 parts
        part_images = {}
        for img_path in images:
            fname = os.path.basename(img_path)
            pm = re.match(r'(part(\d+))-.+\.(png|jpg|jpeg)', fname)
            if pm:
                pn = int(pm.group(2))
                if pn not in part_images:
                    part_images[pn] = f"/images/{scene_id}/{fname}"
            else:
                pm2 = re.match(r'.*p(\d+)\.(png|jpg|jpeg)', fname)
                if pm2:
                    pn = int(pm2.group(1))
                    if pn not in part_images:
                        part_images[pn] = f"/images/{scene_id}/{fname}"
        
        num_parts = max(len(part_images), len(scene_data.get("parts", [])))
        existing_parts = scene_data.get("parts", [])
        new_parts = []
        
        for pnum in sorted(part_images.keys()):
            img_path = part_images[pnum]
            if pnum <= len(existing_parts):
                part = dict(existing_parts[pnum - 1])  # copy
                part["image"] = img_path
                part["id"] = f"part{pnum}"
                aud = get_audio(scene_id, pnum)
                if aud: part["audio"] = aud
                new_parts.append(part)
            else:
                new_parts.append({
                    "id": f"part{pnum}",
                    "image": img_path,
                    "audio": get_audio(scene_id, pnum),
                    "narration": {"zh": scene_data["title"], "en": ""},
                    "thoughts": []
                })
        
        # 如果图片比 parts 多，补充空 parts
        if len(new_parts) < len(part_images):
            done_pnums = set(int(re.search(r'part(\d+)', p["id"]).group(1)) for p in new_parts)
            for pnum in sorted(part_images.keys()):
                if pnum not in done_pnums:
                    new_parts.append({
                        "id": f"part{pnum}",
                        "image": part_images[pnum],
                        "audio": get_audio(scene_id, pnum),
                        "narration": {"zh": "", "en": ""},
                        "thoughts": []
                    })
            # 按 part number 排序
            new_parts.sort(key=lambda x: int(re.search(r'part(\d+)', x["id"]).group(1)))
        
        scene_data["parts"] = new_parts
        
        # 如果完全没有 parts 但有图片
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
            "id": scene_id,
            "title": scene_data["title"],
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
        "version": "2026-05-30-v4-full",
        "title": "社交训练",
        "description": f"完整迁移自 fox-school | {len(scenes)} 个场景 | 自动生成",
        "carnegieCatalog": carnegie_catalog,
        "socialStoryCatalog": social_story_catalog,
        "sceneData": scenes
    }
    
    print(json.dumps(output, ensure_ascii=False, indent=2))

if __name__ == "__main__":
    main()
