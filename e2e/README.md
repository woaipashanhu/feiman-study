# E2E 测试 (Puppeteer)

端到端测试 — 模拟真用户走关键路径,防止加新功能把旧功能搞坏。

## 跑

```bash
# 1. 确保后端可达(默认连 47.99.101.168:8890)
curl http://47.99.101.168:8890/api/health

# 2. 跑所有 E2E
npm run test:e2e
```

**E2E 做了什么**:
1. 自动 build dist(如果旧了)
2. 启 `vite preview`(带 /api proxy → 生产后端)
3. 跑 `e2e/tests/*.test.mjs` 全部
4. 关 preview

**默认 API target**:`http://47.99.101.168:8890`(生产)
**自定义**:`E2E_API_TARGET=http://localhost:8890 npm run test:e2e`(跑本地后端)

## 4 条覆盖路径

| # | 文件 | 路径 |
|---|---|---|
| 01 | `01-register-and-write.test.mjs` | 手机号注册 → 写一封信 → 保存 → /letters 看到 |
| 02 | `02-aha-text.test.mjs` | 注册 → 文字 aha 创建/搜索/stats/tags/删除 |
| 03 | `03-aha-promote.test.mjs` | aha → 转公开 letter → 访客 shareToken 访问 |
| 04 | `04-ws-push.test.mjs` | 用户 A 发信 → 用户 B 在线 → 收 WS 推送 toast |

## 写新 E2E

```js
// e2e/tests/05-your-test.test.mjs
import { registerByPhone, assert } from '../_helpers.mjs'

export default async function test({ page, browser, BASE, log }) {
  // page: Puppeteer Page(viewport 393x852,iPhone 14 Pro)
  // BASE: http://127.0.0.1:4173
  // log(...): 自动加 [e2e] 前缀
  // registerByPhone: 走真实后端 API 注册 + 存 token
  // assert(cond, msg): 失败 throw
  
  await page.goto(`${BASE}/auth`, { waitUntil: 'domcontentloaded' })
  // ...你的路径...
}
```

**注意**:
- 每个 test 自己 `await new browser.newPage()` 或者用 runner 给的 `page`
- 用 `domcontentloaded` 而非 `networkidle0`(WS 长连接让 networkidle 永远不结束)
- `setTimeout` 给足时间(建议 800ms+ 等 SPA 加载)
- fail 抛 throw,runner 自动汇总
- 跑完 `page.close()` 由 runner 处理

## 已知限制 / 跳过

- **重复 promote 防呆**(路径 3):PM2 跑的老 server 代码没把 `[aha:ID]` 写进 content,导致 `LIKE '%[aha:ID]%'` 查不到,409 失效。等 deploy 新 server 才会返回 409。
- **WS 推送在某些版本不稳定**:如果 server 端 ws.broadcast 改了语义,可能要调 `04-ws-push.test.mjs` 的 `wsMessagePromise` 匹配规则。
- **iPhone 视口固定 393x852**:不测横屏 / iPad。
- **mock SMS provider**:后端必须是 mock 模式(返 devCode)才能走 phone-login 流。生产 SMS provider 不会返 devCode,E2E 会卡在 Step 4。
