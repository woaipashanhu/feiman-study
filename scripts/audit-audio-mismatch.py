import json, os, glob

f = open("/tmp/social-scenes-full.json")
d = json.load(f)
f.close()

IMG_BASE = "/var/www/feiman-v3-new/images"
AUD_BASE = "/var/www/feiman-v3-new/audio"

# 检查所有场景目录 vs JSON 中的 scene ID
print("=== 音频目录列表 (前30) ===")
aud_dirs = sorted(os.listdir(AUD_BASE))
for ad in aud_dirs[:30]:
    mp3s = len(glob.glob(os.path.join(AUD_BASE, ad, "*.mp3")))
    print(f"  {ad}: {mp3s} mp3 files")

print(f"\n... total {len(aud_dirs)} audio dirs")

# 找出有音频文件但 JSON 中没匹配上的场景
print("\n=== 有音频但JSON中audio为空的场景 ===")
for sid, sd in d["sceneData"].items():
    # 检查是否有音频目录
    aud_dir = os.path.join(AUD_BASE, sid)
    if os.path.exists(aud_dir):
        mp3_files = glob.glob(os.path.join(aud_dir, "*.mp3"))
        if mp3_files:
            json_has_aud = any(p.get("audio") for p in sd["parts"])
            if not json_has_aud:
                print(f"  {sid}: has {len(mp3_files)} mp3 files but JSON has no audio!")
                print(f"    files: {[os.path.basename(f) for f in mp3_files[:6]]}")
                print(f"    parts: {len(sd['parts'])}")
                for i,p in enumerate(sd["parts"]):
                    expected_zh = os.path.join(aud_dir, f"part{i+1}-zh.mp3")
                    expected_en = os.path.join(aud_dir, f"part{i+1}-en.mp3")
                    zh_exists = os.path.exists(expected_zh)
                    en_exists = os.path.exists(expected_en)
                    print(f"      part{i+1}: img={os.path.basename(p.get('image',''))} zh_mp3={zh_exists} en_mp3={en_exists}")

# 也检查图片
print("\n=== 图片目录 vs parts 数量不匹配 ===")
for sid, sd in d["sceneData"].items():
    img_dir = os.path.join(IMG_BASE, sid)
    if os.path.exists(img_dir):
        img_count = len([f for f in os.listdir(img_dir) if f.endswith(('.png','.jpg','.jpeg'))])
        parts_count = len(sd["parts"])
        if img_count != parts_count:
            print(f"  {sid}: images={img_count} parts={parts_count} MISMATCH")
