#!/usr/bin/env bash
# ============================================================
#  费曼 V3 一键部署脚本
#
#  用法:
#    chmod +x deploy.sh
#    ./deploy.sh              # 默认部署到生产环境
#    ./deploy.sh --dry-run    # 只构建不上传（本地预检）
#    ./deploy.sh --skip-build # 跳过构建，直接上传已有 dist/
#
#  流程: 构建 → 本地预检 → 打包 → 清理服务器旧文件 → 上传 → 解压 → 验证
# ============================================================
set -euo pipefail

# ==================== 配置区（按需修改）====================
SERVER_HOST="47.99.101.168"
SERVER_PORT="8890"
SERVER_USER="root"
SERVER_KEY="/Users/liuzhen/Desktop/项目/lingxi_cloud.pem"  # PEM 密钥路径
REMOTE_DIR="/var/www/feiman-v3-new"        # 服务器部署目录
PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
DIST_DIR="${PROJECT_DIR}/dist"
TAR_FILE="/tmp/feiman-dist-$(date +%Y%m%d%H%M%S).tar.gz"
# ============================================================

# 颜色输出
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; NC='\033[0m'
log()  { echo -e "${CYAN}[deploy]${NC} $1"; }
ok()   { echo -e "${GREEN}  ✅ $1${NC}"; }
warn() { echo -e "${YELLOW}  ⚠️  $1${NC}"; }
err()  { echo -e "${RED}  ❌ $1${NC}"; }

# 参数解析
DRY_RUN=false
SKIP_BUILD=false
for arg in "$@"; do
  case "$arg" in
    --dry-run)    DRY_RUN=true ;;
    --skip-build) SKIP_BUILD=true ;;
    --help|-h)
      echo "用法: $0 [--dry-run] [--skip-build] [--help]"
      exit 0
      ;;
  esac
done

# SSH 辅助函数
ssh_cmd() {
  ssh -i "${SERVER_KEY}" -o StrictHostKeyChecking=no -o ConnectTimeout=10 "${SERVER_USER}@${SERVER_HOST}" "$@"
}
scp_cmd() {
  scp -i "${SERVER_KEY}" -o StrictHostKeyChecking=no -o ConnectTimeout=10 "$1" "${SERVER_USER}@${SERVER_HOST}:$2"
}

# ==================== Step 1: 构建 ====================
echo ""
log "=========================================="
log "  Step 1/5: 构建项目"
log "=========================================="

if [ "$SKIP_BUILD" = true ]; then
  warn "跳过构建，使用已有的 dist/ 目录"
else
  cd "$PROJECT_DIR"
  npm run build
  ok "Vite 构建完成"
fi

if [ ! -d "$DIST_DIR" ]; then
  err "dist/ 目录不存在！先运行 npm run build"
  exit 1
fi

# 检查关键文件
for f in index.html assets/*.js assets/*.css; do
  if [ ! -e "$DIST_DIR/$f" ] && [[ ! "$f" == *\* ]]; then
    warn "缺少文件: dist/$f"
  fi
done
ok "构建产物检查通过"

# ==================== Step 2: 本地预检（图标名等）===================
echo ""
log "=========================================="
log "  Step 2/5: 本地预检 (pre-deploy check)"
log "=========================================="

cd "$PROJECT_DIR"
if [ -f "scripts/pre-deploy-check.mjs" ]; then
  if node scripts/pre-deploy-check.mjs; then
    ok "预检全部通过"
  else
    err "预检未通过！请修复后再部署"
    exit 1
  fi
else
  warn "未找到 pre-deploy-check.mjs，跳过预检"
fi

# ==================== Step 3: 打包 ====================
echo ""
log "=========================================="
log "  Step 3/5: 打包构建产物"
log "=========================================="

cd "$DIST_DIR"
tar -czf "$TAR_FILE" .
SIZE=$(du -h "$TAR_FILE" | cut -f1)
ok "打包完成: ${TAR_FILE} (${SIZE})"

if [ "$DRY_RUN" = true ]; then
  echo ""
  log "Dry run 模式，停止 here。打包文件: ${TAR_FILE}"
  exit 0
fi

# ==================== Step 4: 部署到服务器 ====================
echo ""
log "=========================================="
log "  Step 4/5: 部署到服务器 ${SERVER_HOST}"
log "=========================================="

# 4a. 上传
log "上传 tar 包..."
scp_cmd "$TAR_FILE" "/tmp/feiman-dist.tar.gz"
ok "上传完成"

# 4b. 在服务器上执行原子化部署
log "在服务器上执行部署..."
ssh_cmd bash -s <<'REMOTE_SCRIPT'
set -euo pipefail
REMOTE_DIR="/var/www/feiman-v3-new"
TAR_FILE="/tmp/feiman-dist.tar.gz"

echo "  📦 创建临时目录..."
TMP_DEPLOY=$(mktemp -d)

echo "  🔓 解压到临时目录..."
tar -xzf "$TAR_FILE" -C "$TMP_DEPLOY/"

echo "  🧹 清理旧的 JS/CSS/SW 文件（保留 data/ 和其他静态资源）..."
rm -rf "${REMOTE_DIR}/assets/"*.js "${REMOTE_DIR}/assets/"*.css 2>/dev/null || true
rm -f "${REMOTE_DIR}/sw.js" "${REMOTE_DIR}/workbox-"*.js "${REMOTE_DIR}/registerSW.js" 2>/dev/null || true

echo "  📁 复制新的 assets/..."
# 先清空旧assets目录，防止assets/assets嵌套
rm -rf "${REMOTE_DIR}/assets/"
mkdir -p "${REMOTE_DIR}/assets"
cp -rf "${TMP_DEPLOY}/assets/"* "${REMOTE_DIR}/assets/"
echo "  📄 复制根目录文件（index.html, sw.js 等）..."
cp -f "${TMP_DEPLOY}/index.html" "${REMOTE_DIR}/index.html"
cp -f "${TMP_DEPLOY}/sw.js" "${REMOTE_DIR}/sw.html.sw" 2>/dev/null || true
cp -f "${TMP_DEPLOY}/sw.js" "${REMOTE_DIR}/sw.js" 2>/dev/null || true
cp -f "${TMP_DEPLOY}/registerSW.js" "${REMOTE_DIR}/registerSW.js" 2>/dev/null || true
cp -f "${TMP_DEPLOY}/workbox-"*.js "${REMOTE_DIR}/" 2>/dev/null || true

# 同步 data/ 目录（如果有更新）
if [ -d "${TMP_DEPLOY}/data" ]; then
  echo "  📊 同步 data/ 目录..."
  cp -rf "${TMP_DEPLOY}/data/"* "${REMOTE_DIR}/data/" 2>/dev/null || true
fi

# 同步 science/ 目录（Three.js 场景 HTML,iframe 加载）
if [ -d "${TMP_DEPLOY}/science" ]; then
  echo "  🔬 同步 science/ 目录..."
  mkdir -p "${REMOTE_DIR}/science"
  cp -rf "${TMP_DEPLOY}/science/"* "${REMOTE_DIR}/science/" 2>/dev/null || true
fi

# 同步 gallery/ 目录（童画廊图片/音频）
if [ -d "${TMP_DEPLOY}/gallery" ]; then
  echo "  🖼️  同步 gallery/ 目录..."
  mkdir -p "${REMOTE_DIR}/gallery"
  cp -rf "${TMP_DEPLOY}/gallery/"* "${REMOTE_DIR}/gallery/" 2>/dev/null || true
fi

# 同步 images/ 目录（场景缩略图等）
if [ -d "${TMP_DEPLOY}/images" ]; then
  echo "  🎨 同步 images/ 目录..."
  mkdir -p "${REMOTE_DIR}/images"
  cp -rf "${TMP_DEPLOY}/images/"* "${REMOTE_DIR}/images/" 2>/dev/null || true
fi

# 同步 previews/ 目录(视频缩略图/动态预览)
if [ -d "${TMP_DEPLOY}/previews" ]; then
  echo "  🎬 同步 previews/ 目录..."
  mkdir -p "${REMOTE_DIR}/previews"
  cp -rf "${TMP_DEPLOY}/previews/"* "${REMOTE_DIR}/previews/" 2>/dev/null || true
fi

# 同步 favicon / manifest 等静态资源
for static_file in favicon.svg manifest.json robots.txt; do
  if [ -f "${TMP_DEPLOY}/${static_file}" ]; then
    cp -f "${TMP_DEPLOY}/${static_file}" "${REMOTE_DIR}/${static_file}"
  fi
done

# 同步 PWA 图标（用 find 而非通配符，避免 heredoc 中通配符不展开的问题）
echo "  🖼️  同步 PWA 图标..."
if find "${TMP_DEPLOY}" -maxdepth 1 -name '*.png' -exec cp -f {} "${REMOTE_DIR}/" \; 2>/dev/null; then
  echo "    PNG 图标已同步"
fi

# 清理旧的不再使用的图标文件（如果有）
rm -f "${REMOTE_DIR}/icon-192.png" "${REMOTE_DIR}/icon-512.png" 2>/dev/null || true

echo "  🗑️  清理临时目录..."
rm -rf "$TMP_DEPLOY"
rm -f "$TAR_FILE"

echo "  ✅ 服务器部署完成!"
REMOTE_SCRIPT

ok "服务器部署完成"

# 清理本地 tar
rm -f "$TAR_FILE"

# ==================== Step 5: 在线验证 ====================
echo ""
log "=========================================="
log "  Step 5/5: 在线验证"
log "=========================================="

if [ -f "$PROJECT_DIR/verify-deploy.mjs" ]; then
  log "运行页面验证脚本..."
  cd "$PROJECT_DIR"
  if node verify-deploy.mjs; then
    ok "所有页面验证通过！🎉"
  else
    warn "验证脚本报告了问题，请检查上面的输出"
    warn "但部署已完成，你可以手动在浏览器中确认"
  fi
else
  warn "未找到 verify-deploy.mjs，跳过在线验证"
  warn "请手动访问 http://${SERVER_HOST}:${SERVER_PORT} 确认"
fi

echo ""
log "=========================================="
log "  部署完成! ✅"
log "  访问: http://${SERVER_HOST}:${SERVER_PORT}"
log "=========================================="
echo ""
