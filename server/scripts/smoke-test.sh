#!/usr/bin/env bash
# ============================================================
#  小纸条后端 smoke test — 5 个核心接口
#  用法: PORT=3000 ./scripts/smoke-test.sh
# ============================================================
set -euo pipefail
PORT="${PORT:-3000}"
HOST="${HOST:-127.0.0.1}"
BASE="http://${HOST}:${PORT}"

# 颜色
RED='\033[0;31m'; GREEN='\033[0;32m'; CYAN='\033[0;36m'; NC='\033[0m'
ok()   { echo -e "${GREEN}  ✅ $1${NC}"; }
err()  { echo -e "${RED}  ❌ $1${NC}"; exit 1; }
log()  { echo -e "${CYAN}[smoke]${NC} $1"; }

# 0. 健康检查
log "GET /api/health"
HEALTH=$(curl -sf "${BASE}/api/health")
echo "  → ${HEALTH}"
echo "$HEALTH" | grep -q '"ok":true' || err "health check failed"
ok "health"

# 1. POST /api/letters — 创建
log "POST /api/letters"
CREATE_RESP=$(curl -sf -X POST "${BASE}/api/letters" \
  -H "Content-Type: application/json" \
  -d '{"content":"此刻,我想对自己说:保持好奇,继续前行。","author":"刘费曼","bgKey":"ivory","translations":{"classicalChinese":"保持好奇,继续前行。","english":"Stay curious, keep moving."}}')
echo "  → ${CREATE_RESP}"
LETTER_ID=$(echo "$CREATE_RESP" | python3 -c "import json,sys; print(json.load(sys.stdin)['letter']['id'])")
SHARE_TOKEN=$(echo "$CREATE_RESP" | python3 -c "import json,sys; print(json.load(sys.stdin)['letter']['shareToken'])")
[[ -n "$LETTER_ID" ]] || err "no letter id"
[[ -n "$SHARE_TOKEN" ]] || err "no share token"
ok "create (id=${LETTER_ID}, token=${SHARE_TOKEN})"

# 2. GET /api/letters — 列表
log "GET /api/letters?limit=5"
LIST_RESP=$(curl -sf "${BASE}/api/letters?limit=5")
COUNT=$(echo "$LIST_RESP" | python3 -c "import json,sys; print(len(json.load(sys.stdin)['letters']))")
[[ "$COUNT" -ge 1 ]] || err "list empty"
ok "list (${COUNT} letters)"

# 3. GET /api/letters/:id
log "GET /api/letters/${LETTER_ID}"
ID_RESP=$(curl -sf "${BASE}/api/letters/${LETTER_ID}")
echo "$ID_RESP" | grep -q "\"id\":\"${LETTER_ID}\"" || err "id mismatch"
ok "get by id"

# 4. GET /api/letters/by-token/:token
log "GET /api/letters/by-token/${SHARE_TOKEN}"
TOK_RESP=$(curl -sf "${BASE}/api/letters/by-token/${SHARE_TOKEN}")
echo "$TOK_RESP" | grep -q "\"shareToken\":\"${SHARE_TOKEN}\"" || err "token mismatch"
ok "get by token"

# 5. POST /api/letters/:id/collect
log "POST /api/letters/${LETTER_ID}/collect"
COL_RESP=$(curl -sf -X POST "${BASE}/api/letters/${LETTER_ID}/collect")
echo "  → ${COL_RESP}"
echo "$COL_RESP" | grep -q '"ok":true' || err "collect failed"
ok "collect"

# 6. 错误用例 — 404
log "GET /api/letters/by-token/sl_nonexistent (expect 404)"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "${BASE}/api/letters/by-token/sl_nonexistent")
[[ "$HTTP_CODE" == "404" ]] || err "expected 404, got $HTTP_CODE"
ok "404 not_found"

# 7. 错误用例 — 400
log "POST /api/letters with empty body (expect 400)"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "${BASE}/api/letters" \
  -H "Content-Type: application/json" -d '{}')
[[ "$HTTP_CODE" == "400" ]] || err "expected 400, got $HTTP_CODE"
ok "400 invalid_body"

echo
ok "🎉 全部 smoke test 通过"
