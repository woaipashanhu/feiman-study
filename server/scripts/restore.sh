#!/usr/bin/env bash
# ============================================================
#  小纸条数据库 — 手动恢复
#
#  用法:
#    ./restore.sh                              # 列出所有可用备份,选 1 个
#    ./restore.sh letters-20260607-030000.tar.gz  # 直接指定
#
#  行为:
#    1. 解压到 /tmp/restore-<timestamp>/
#    2. 停后端进程(避免 SQLite 写入冲突)
#    3. 备份当前 DB 到 /var/backups/feiman-letters/EMERGENCY-<ts>.tar.gz
#    4. 复制恢复的 DB 覆盖到 /var/lib/feiman-letters/
#    5. 重启后端
#
#  ⚠️ 恢复会覆盖当前 DB,务必先确认目标备份是对的
# ============================================================
set -euo pipefail

DB_DIR="/var/lib/feiman-letters"
BACKUP_DIR="/var/backups/feiman-letters"
SERVER_DIR="/var/www/feiman-letters-server"
LOG_FILE="/var/log/feiman-letters-backup.log"

log() {
  local ts=$(date '+%Y-%m-%d %H:%M:%S')
  echo "[$ts] [restore] $1" | tee -a "$LOG_FILE"
}

# 选备份
if [ -n "${1:-}" ]; then
  BACKUP_FILE="${BACKUP_DIR}/$1"
  [ -f "$BACKUP_FILE" ] || { echo "❌ 备份文件不存在: $BACKUP_FILE"; exit 1; }
else
  echo "可用的备份:"
  ls -lht "$BACKUP_DIR"/letters-*.tar.gz 2>/dev/null | head -10 || { echo "❌ 没有可用备份"; exit 1; }
  echo ""
  read -p "请输入要恢复的文件名(完整名): " BACKUP_NAME
  BACKUP_FILE="${BACKUP_DIR}/${BACKUP_NAME}"
  [ -f "$BACKUP_FILE" ] || { echo "❌ 备份文件不存在: $BACKUP_FILE"; exit 1; }
fi

echo "⚠️  即将恢复: $BACKUP_FILE"
echo "目标: $DB_DIR"
read -p "确认?输入 yes 继续: " CONFIRM
[ "$CONFIRM" = "yes" ] || { echo "❌ 取消"; exit 1; }

# 1. 解压到临时目录
TMPDIR=$(mktemp -d)
log "📦 解压到 $TMPDIR"
tar -xzf "$BACKUP_FILE" -C "$TMPDIR"

RESTORED_DB="$TMPDIR/$(basename "$DB_DIR")/letters.db"
[ -f "$RESTORED_DB" ] || { echo "❌ 备份里没找到 letters.db"; exit 1; }

# 2. 停后端
log "⏸  停后端进程"
if command -v pm2 >/dev/null 2>&1; then
  pm2 stop letters-server 2>/dev/null || true
else
  pkill -f "node dist/index.js" 2>/dev/null || true
fi
sleep 1

# 3. 备份当前 DB
EMERGENCY_FILE="${BACKUP_DIR}/EMERGENCY-$(date +%Y%m%d-%H%M%S).tar.gz"
log "💾 备份当前 DB 到 $EMERGENCY_FILE"
tar -czf "$EMERGENCY_FILE" -C "$(dirname "$DB_DIR")" "$(basename "$DB_DIR")" 2>>"$LOG_FILE" || true

# 4. 覆盖
log "📋 复制恢复的 DB"
cp -f "$RESTORED_DB" "$DB_DIR/letters.db"
[ -f "$TMPDIR/$(basename "$DB_DIR")/letters.db-shm" ] && cp -f "$TMPDIR/$(basename "$DB_DIR")/letters.db-shm" "$DB_DIR/letters.db-shm" || true
[ -f "$TMPDIR/$(basename "$DB_DIR")/letters.db-wal" ] && cp -f "$TMPDIR/$(basename "$DB_DIR")/letters.db-wal" "$DB_DIR/letters.db-wal" || true

# 5. 重启
log "▶  启动后端"
if command -v pm2 >/dev/null 2>&1; then
  pm2 start letters-server 2>/dev/null || pm2 restart letters-server
else
  cd "$SERVER_DIR"
  DB_PATH="${DB_DIR}/letters.db" PORT=3000 NODE_ENV=production \
    nohup node dist/index.js >> /var/log/feiman-letters.log 2>&1 &
fi

# 6. 健康检查
sleep 2
if curl -sf http://127.0.0.1:3000/api/health > /dev/null; then
  log "✅ 恢复成功,后端 health OK"
else
  log "⚠️ 恢复完成但 health 检查失败,看 /var/log/feiman-letters.log"
fi

# 清理
rm -rf "$TMPDIR"
log "🎉 恢复流程完成"
