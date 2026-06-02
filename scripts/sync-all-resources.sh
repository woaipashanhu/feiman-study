#!/bin/bash
# ============================================================
#  完整同步 fox-school 所有素材到 feiman-v3-new
#  源: /root/workspace_backup/fox-school/scenes/
#  目标: /var/www/feiman-v3-new/images/ 和 /var/www/feiman-v3-new/audio/
# ============================================================

set -e

SRC="/root/workspace_backup/fox-school/scenes"
DST_IMG="/var/www/feiman-v3-new/images"
DST_AUDIO="/var/www/feiman-v3-new/audio"

echo "========================================="
echo "  Step 1: 清理旧资源目录"
echo "========================================="
rm -rf "$DST_IMG"/* 2>/dev/null || true
rm -rf "$DST_AUDIO"/* 2>/dev/null || true
mkdir -p "$DST_IMG" "$DST_AUDIO"

echo ""
echo "========================================="
echo "  Step 2: 同步所有场景的图片和音频"
echo "========================================="

TOTAL_IMG=0
TOTAL_MP3=0
SCENES_DONE=0

for scene_dir in "$SRC"/*/; do
  scene_name=$(basename "$scene_dir")
  
  # 提取场景ID (如 s-01, s09, social-02)
  # 目录名格式: s-01-我生气了, s09-让对方感到重要, social-02-心里不舒服的时候
  scene_id=$(echo "$scene_name" | sed 's/-.*//')
  
  # 对于 s06-s16 这种格式，保持原样；对于 s-01 格式也保持
  # 统一用目录名的第一段作为子目录名
  if [[ "$scene_name" =~ ^s[0-9]+- ]]; then
    # s09-, s10- 等格式 -> s09, s10
    scene_id=$(echo "$scene_name" | cut -d'-' -f1)
  elif [[ "$scene_name" =~ ^s-[0-9]+- ]]; then
    # s-01-, s-11- 等格式 -> s-01, s-11
    scene_id=$(echo "$scene_name" | cut -d'-' -f1-2)
  elif [[ "$scene_name" =~ ^social- ]]; then
    # social-02-... -> social-02
    scene_id=$(echo "$scene_name" | cut -d'-' -f1-2)
  else
    scene_id="$scene_name"
  fi
  
  # 复制图片
  img_cnt=0
  if [ -d "$scene_dir/images" ]; then
    mkdir -p "$DST_IMG/$scene_id"
    cp "$scene_dir/images/"* "$DST_IMG/$scene_id/" 2>/dev/null && img_cnt=$? || img_cnt=0
    img_cnt=$(ls "$DST_IMG/$scene_id/" 2>/dev/null | wc -l)
  fi
  
  # 复制音频
  mp3_cnt=0
  if [ -d "$scene_dir/audio" ]; then
    mkdir -p "$DST_AUDIO/$scene_id"
    cp "$scene_dir/audio/"*.mp3 "$DST_AUDIO/$scene_id/" 2>/dev/null || true
    mp3_cnt=$(ls "$DST_AUDIO/$scene_id/"*.mp3 2>/dev/null | wc -l)
  fi
  
  TOTAL_IMG=$((TOTAL_IMG + img_cnt))
  TOTAL_MP3=$((TOTAL_MP3 + mp3_cnt))
  SCENES_DONE=$((SCENES_DONE + 1))
  
  echo "  [$SCENES_DONE] $scene_name -> $scene_id ($img_cnt img, $mp3_cnt mp3)"
done

echo ""
echo "========================================="
echo "  Step 3: 统计结果"
echo "========================================="
echo "  场景数: $SCENES_DONE"
echo "  图片总数: $TOTAL_IMG"
echo "  音频总数: $TOTAL_MP3"
echo ""
echo "  === images 子目录 ==="
ls "$DST_IMG/" | head -30
echo "  ..."
ls "$DST_IMG/" | wc -l
echo "  === audio 子目录 ==="
ls "$DST_AUDIO/" | head -30
echo "  ..."
ls "$DST_AUDIO/" | wc -l
