#!/bin/bash
echo "========================================="
echo "  全服务器 fox/school/social 资源大搜索"
echo "========================================="

echo ""
echo "=== 1. 所有 fox 相关目录 ==="
find / -maxdepth 4 -name "*fox*" -type d 2>/dev/null | grep -v proc | grep -v sys | grep -v cache

echo ""
echo "=== 2. /root 下所有目录 ==="
ls -la /root/ 2>/dev/null

echo ""
echo "=== 3. /var/www 下所有项目 ==="
ls -la /var/www/ 2>/dev/null

echo ""
echo "=== 4. 所有图片>50的目录 ==="
for d in /var/www/*/images /root/*/images /root/*/public/images /home/*/images; do
  [ -d "$d" ] || continue
  cnt=$(find "$d" -type f \( -name "*.png" -o -name "*.jpg" \) 2>/dev/null | wc -l)
  [ "$cnt" -gt "10" ] && echo "  [$cnt img] $d"
done

echo ""
echo "=== 5. 所有音频>50的目录 ==="
for d in /var/www/*/audio /root/*/audio /root/*/public/audio; do
  [ -d "$d" ] || continue
  cnt=$(find "$d" -name "*.mp3" 2>/dev/null | wc -l)
  [ "$cnt" -gt "10" ] && echo "  [$cnt mp3] $d"
done

echo ""
echo "=== 6. workspace_backup 完整内容 ==="
ls -la /root/workspace_backup/ 2>/dev/null

echo ""
echo "=== 7. 搜索 scenes/social/story 相关目录 ==="
find /root /var/www /home -maxdepth 5 -type d \( -name "*scene*" -o -name "*social*" -o -name "*story*" \) 2>/dev/null | head -30

echo ""
echo "=== 8. 搜索 generated/ai 图片目录（AI生成的素材）==="
find /root /var/www -maxdepth 5 -type d -name "*generated*" -o -name "*ai-img*" -o -name "*assets*img*" 2>/dev/null | head -20
find /root /var/www -maxdepth 6 -type d 2>/dev/null | while read d; do
  cnt=$(find "$d" -maxdepth 1 -name "generated*.png" -o -name "generated*.jpg" 2>/dev/null | wc -l)
  [ "$cnt" -gt "5" ] && echo "  [$cnt gen] $d"
done
