#!/usr/bin/env bash
# ============================================================
#  小纸条数据库 — 自动备份
#
#  行为:
#    1. tar 打包 /var/lib/feiman-letters/letters.db (含 -shm / -wal)
#    2. 放到 /var/backups/feiman-letters/letters-YYYYMMDD-HHMMSS.tar.gz
#    3. 保留最近 7 天,自动删老的
#    4. 备份完成写日志 /var/log/feiman-letters-backup.log
#
#  crontab: 0 3 * * *  /var/www/feiman-letters-server/scripts/backup.sh
#  (每天凌晨 3 点,详见 README 同目录)
# ============================================================
set -euo pipefail

# 路径
DB_DIR="/var/lib/feiman-letters"
BACKUP_DIR="/var/backups/feiman-letters"
LOG_FILE="/var/log/feiman-letters-backup.log"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/letters-${TIMESTAMP}.tar.gz"
RETENTION_DAYS=7

# 颜色 / 日志函数
log() {
  local ts=$(date '+%Y-%m-%d %H:%M:%S')
  echo "[$ts] $1" | tee -a "$LOG_FILE"
}

# 前置检查
[ -d "$DB_DIR" ] || { log "❌ DB 目录不存在: $DB_DIR"; exit 1; }
[ -f "$DB_DIR/letters.db" ] || { log "❌ DB 文件不存在: $DB_DIR/letters.db"; exit 1; }

# 建备份目录
mkdir -p "$BACKUP_DIR"

# 备份
log "📦 开始备份: $DB_DIR/letters.db → $BACKUP_FILE"
if tar -czf "$BACKUP_FILE" -C "$(dirname "$DB_DIR")" "$(basename "$DB_DIR")" 2>>"$LOG_FILE"; then
  SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
  log "✅ 备份成功 ($SIZE): $BACKUP_FILE"
else
  log "❌ 备份失败"
  exit 1
fi

# 清理老备份(7 天前)
DELETED=$(find "$BACKUP_DIR" -name "letters-*.tar.gz" -mtime +${RETENTION_DAYS} -delete -print 2>/dev/null | wc -l | tr -d ' ')
if [ "$DELETED" -gt 0 ]; then
  log "🧹 清理了 $DELETED 个老备份(>${RETENTION_DAYS} 天)"
fi

# 统计当前备份数
TOTAL=$(find "$BACKUP_DIR" -name "letters-*.tar.gz" | wc -l | tr -d ' ')
TOTAL_SIZE=$(du -sh "$BACKUP_DIR" 2>/dev/null | cut -f1 || echo "?")
log "📊 当前共 $TOTAL 个备份, 总大小 $TOTAL_SIZE"
