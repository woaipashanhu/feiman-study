#!/usr/bin/env bash
# ============================================================
#  费曼 V3 — 小纸条后端部署脚本
#
#  用法:
#    ./deploy-server.sh              # 默认部署到生产环境
#    ./deploy-server.sh --skip-build # 跳过构建,直接上传已有 dist/
#
#  流程: 构建 → 打包 → 上传 → 解压 → 装 deps → 重启进程
# ============================================================
set -euo pipefail

# ==================== 配置 ====================
SERVER_HOST="47.99.101.168"
SERVER_PORT="8890"
SERVER_USER="root"
SERVER_KEY="/Users/liuzhen/Desktop/项目/lingxi_cloud.pem"
REMOTE_DIR="/var/www/feiman-letters-server"  # 服务器部署目录
DB_DIR="/var/lib/feiman-letters"             # 数据库目录
PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
DIST_DIR="${PROJECT_DIR}/dist"
TAR_FILE="/tmp/feiman-server-$(date +%Y%m%d%H%M%S).tar.gz"
APP_PORT="${APP_PORT:-3000}"

# 颜色
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1,33m'; CYAN='\033[0,36m'; NC='\033[0m'
log()  { echo -e "${CYAN}[deploy]${NC} $1"; }
ok()   { echo -e "${GREEN}  ✅ $1${NC}"; }
warn() { echo -e "${YELLOW}  ⚠️  $1${NC}"; }
err()  { echo -e "${RED}  ❌ $1${NC}"; }

SKIP_BUILD=false
for arg in "$@"; do
  case "$arg" in
    --skip-build) SKIP_BUILD=true ;;
    --help|-h)
      echo "用法: $0 [--skip-build]"
      exit 0
      ;;
  esac
done

ssh_cmd() {
  ssh -i "${SERVER_KEY}" -o StrictHostKeyChecking=no -o ConnectTimeout=10 "${SERVER_USER}@${SERVER_HOST}" "$@"
}

# ==================== 1. 构建 ====================
if [ "$SKIP_BUILD" = false ]; then
  log "1. TypeScript 构建..."
  cd "${PROJECT_DIR}"
  npx tsc -p tsconfig.json
  ok "构建完成 → ${DIST_DIR}"
else
  log "1. 跳过构建(使用已有 dist/)"
  [ -d "${DIST_DIR}" ] || err "dist/ 不存在,无法跳过构建"
fi

# ==================== 2. 打包 ====================
log "2. 打包(包含 node_modules 用于 better-sqlite3 原生编译)..."
cd "${PROJECT_DIR}"
# 注意:better-sqlite3 需要原生编译,服务器上 node_modules 必须存在
# 这里我们打包 dist + package.json + package-lock.json,服务器上 npm ci --omit=dev
rm -f "${TAR_FILE}"
tar -czf "${TAR_FILE}" \
  --exclude='node_modules' \
  --exclude='data' \
  --exclude='*.log' \
  -C "${PROJECT_DIR}" \
  dist package.json package-lock.json deploy-server.sh scripts
ok "打包完成 → ${TAR_FILE} ($(du -h ${TAR_FILE} | cut -f1))"

# ==================== 3. 上传 ====================
log "3. 上传到 ${SERVER_HOST}..."
scp -i "${SERVER_KEY}" -o StrictHostKeyChecking=no -o ConnectTimeout=10 \
  "${TAR_FILE}" "${SERVER_USER}@${SERVER_HOST}:/tmp/"
ok "上传完成"

# ==================== 4. 解压 + 装依赖 ====================
log "4. 解压 + 装 prod 依赖..."
ssh_cmd bash -s <<REMOTE_SCRIPT
  set -e
  mkdir -p "${REMOTE_DIR}"
  mkdir -p "${DB_DIR}"
  cd "${REMOTE_DIR}"
  # 保留当前 dist/ (用于回滚)
  rm -rf dist.old 2>/dev/null || true
  [ -d dist ] && mv dist dist.old 2>/dev/null || true

  # 解压
  tar -xzf "${TAR_FILE}" -C "${REMOTE_DIR}"
  rm -f "${TAR_FILE}"

  # 装 prod 依赖(忽略 dev)
  npm ci --omit=dev --no-audit --no-fund 2>&1 | tail -3

  echo "✅ 解压 + npm ci 完成"
REMOTE_SCRIPT
ok "解压 + 装依赖完成"

# ==================== 5. 装 nginx 反代 ====================
log "5. 配 nginx /api/* 反代..."
ssh_cmd bash -s <<REMOTE_SCRIPT
  set -e
  NGINX_CONF="/etc/nginx/conf.d/feiman-v3-new.conf"

  # 备份
  cp "\${NGINX_CONF}" "\${NGINX_CONF}.bak" 2>/dev/null || true

  # 检查是否已经有 /api/ location
  if grep -q "location /api/" "\${NGINX_CONF}"; then
    echo "  /api/ 反代已存在,跳过"
  else
    # 在 server 块的最后一个 } 之前插入 /api/ 反代
    sed -i '/location \/assets\/ {/i\
    location /api/ {\
        proxy_pass http://127.0.0.1:${APP_PORT};\
        proxy_http_version 1.1;\
        proxy_set_header Host \$host;\
        proxy_set_header X-Real-IP \$remote_addr;\
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;\
        proxy_set_header X-Forwarded-Proto \$scheme;\
        proxy_read_timeout 60s;\
    }' "\${NGINX_CONF}"

    # 验证语法
    nginx -t
    echo "✅ nginx 配 + 语法检查通过"
  fi
REMOTE_SCRIPT
ok "nginx /api/* 反代配置完成"

# ==================== 6. 重启进程 ====================
log "6. 重启后端进程(端口 ${APP_PORT})..."
ssh_cmd bash -s <<REMOTE_SCRIPT
  set -e
  # 如果有旧的,杀掉
  pkill -f "node dist/index.js" 2>/dev/null || true
  sleep 1

  # 用 nohup 后台启动,日志写到 /var/log/feiman-letters.log
  cd "${REMOTE_DIR}"
  DB_PATH="${DB_DIR}/letters.db" \
    PORT="${APP_PORT}" \
    NODE_ENV=production \
    nohup node dist/index.js >> /var/log/feiman-letters.log 2>&1 &

  # 等 1.5s 让进程启动
  sleep 1.5

  # 健康检查
  if curl -sf http://127.0.0.1:${APP_PORT}/api/health > /dev/null; then
    echo "✅ 后端进程已启动,健康检查通过"
  else
    echo "❌ 健康检查失败,日志:"
    tail -20 /var/log/feiman-letters.log
    exit 1
  fi
REMOTE_SCRIPT
ok "后端进程重启完成"

# ==================== 7. reload nginx ====================
log "7. reload nginx 让 /api/ 反代生效..."
ssh_cmd bash -s <<REMOTE_SCRIPT
  set -e
  # 测试配置
  nginx -t
  # 重新加载(不中断服务)
  nginx -s reload || systemctl reload nginx
  echo "✅ nginx reload 完成"
REMOTE_SCRIPT
ok "nginx reload 完成"

# ==================== 8. 端到端验证 ====================
log "8. 端到端验证 (${SERVER_HOST}:${SERVER_PORT}/api/health)..."
sleep 1
if curl -sf "http://${SERVER_HOST}:${SERVER_PORT}/api/health" > /dev/null; then
  HEALTH=$(curl -sf "http://${SERVER_HOST}:${SERVER_PORT}/api/health")
  ok "线上健康检查通过: ${HEALTH}"
else
  err "线上健康检查失败,查看 /var/log/feiman-letters.log"
fi

echo
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  小纸条后端部署完成! ✅${NC}"
echo -e "${GREEN}  API: http://${SERVER_HOST}:${SERVER_PORT}/api/${NC}"
echo -e "${GREEN}  日志: tail -f /var/log/feiman-letters.log${NC}"
echo -e "${GREEN}========================================${NC}"
