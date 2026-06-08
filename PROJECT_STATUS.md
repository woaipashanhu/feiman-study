# 小纸条 / Letters — 项目状态交接

> 写给下个接手的 agent 用。比 CHANGELOG 紧凑,只讲"我现在在哪 + 我做完啥 + 你接着做啥 + 必看 5 条"。
> 最后更新: 2026-06-07(会话 #50)

---

## 1. 项目位置

```
仓库:     /Users/liuzhen/Documents/lingxi-claw/20260605-14-20-02-486/feiman-v3-new
分支:     main
本地:     98 commits,**85 ahead of origin**(用户没 push,等他拍)
架构:     React 19 + Vite 6 + Tailwind 4 + Express 5 + better-sqlite3 + WS
部署:     生产 nginx + PM2 跑 server 在 47.99.101.168:8890
        ⚠️ 88 commits 没 deploy,PM2 还在跑老 server
后端测试: cd server && npx vitest run  → 37/37 pass
E2E 测试:  npm run test:e2e            → 4/4 pass(25s)
```

## 2. 已完成(V3.8 收口 + V4 啊哈 + 本段 UI/E2E)

- **V3.8 收口**(15 commits):Sentry / Capacitor / PM2 fork 模式 / OpenAPI swagger / 单元测试起步 / SMS / OSS / 微信 OAuth / Postgres 抽象 / App 图标 / i18n / App Store 元数据 / Infra / 死代码归档 / 性能基线
- **V3.8 文档**:Helmet+10 安全头 / PrivacyPage / TermsPage / README / SECURITY / CI workflow
- **V4 啊哈时刻**(7 commits,#46-#49):后端 aha_moments 表 + 10 API + 前端 AhaPage + 首页集成 + iOS 麦克风/相册/相机权限 + 搜索/筛选/波形/导入导出 + 统计面板(心情饼图 + 30天柱状) + 一键转公开 letter + 每日 PWA 提醒
- **本段 UI 收口**(commit `05f8f12`):7 修(品牌名 / AhaPage NavBar / i18n 漏翻 / Profile 精简 / Favorites 文案 / 临时文件)
- **本段 E2E bug 修复**(commit `dff42cb`):6 真 bug(Sentry placeholder / vite proxy / phone-login token / [object Object] / LETTERS_KEY 双前缀 / LettersPage tab UX)
- **本段 E2E 永久套件**(commit `be99a57`):4 关键路径 + npm script
- **本段 iOS 真机指南**(commit `cb2c1c3`)
- **跨项目交付**:ui-review skill(`~/.mavis/agents/mavis/skills/ui-review/`,7 维度 + 减法清单 + 严重度 ladder + 实施切片)

## 3. 你接着做啥(按 ROI 排序)

### 必修(用户没拍之前不要动)

1. **Deploy 新 server 到 PM2**(老代码还在跑,改了 server/* 没 deploy)
   - 跑 `./deploy.sh` 或 `cd server && bash scripts/deploy-server.sh`
   - 修后:aha taggedContent 修复(letter 含 [aha:ID] 标记) / 重复 promote 409 防呆 / Sentry 真 DSN / LetterInboxPage token 真实解析
2. **真机测试**(等用户 Mac + iPhone)
   - 跟 `CAPACITOR_IOS_DEVICE_DEBUG.md` 走,**不用花 1 块钱**(免费 Apple ID 7 天签名)
3. **E2E 跟 push**:`npm run test:e2e` 在 PR 流水线里跑

### 选做(等用户拍)

4. **Push 85 commits 到 origin**:用户决定时机(独立开发者习惯攒一波 push)
5. **新模块 / V5**:用户没提,不主动开
6. **ui-review skill 的 self-check 单向弱点**:留作生产用时发现再补
7. **Apple Developer 申请**($99)+ SSL 证书(真要上架时)
8. **OPEN GRAPH 分享卡**:信纸动态生成图,PWA 分享体验质变(估时 2h)

## 4. 上手必读 5 条

1. **CHANGELOG.md** 是 source of truth — 57 个 session 记录,#50 是最新的
2. **ARCHITECTURE.md** §十三是 roadmap(全部 P0/P1/P2 已收口)+ §十四 V3.8 + V4 详情
3. **DB_PATH 部署陷阱** — `.env.local` + `/etc/feiman-letters.env` + `pm2 jlist` 都得对得上,漏一个数据全错位(见 #46 教训)
4. **5 tab 底部 iOS 风格** 是锁定的(用户原话),只动页面内容,不动 TabBar
5. **3 个 README 文档**:`README.md` / `CAPACITOR.md` / `CAPACITOR_IOS_DEVICE_DEBUG.md` / `e2e/README.md` — 各有分工

## 5. 别踩的 3 个坑(用户偏好)

1. **不要 ABC 选项**:用户原话"你就直接做就行了,直接给我出计划自己做就行了,因为我也不懂"。出计划 + 直接做 + 做完一段报告
2. **不要一次推 2+ 段没确认**:一段 = 1 个可独立交付的功能集(估时 1-3h),结束 → 报告 + 推荐下一段 + 等拍板
3. **不要做技术选型让他拍**:你拍,他一键过

## 6. 关键文件清单(高频访问)

```
ARCHITECTURE.md         1431 行,roadmap + V3.8 性能 + V4 详情
CHANGELOG.md            3675 行,57 个 session 详细记录
README.md               项目入口 + 部署 + 上架
CAPACITOR.md            打包上架指南(注册 Apple Developer $99)
CAPACITOR_IOS_DEVICE_DEBUG.md  真机调试 0→1(免费)
e2e/README.md           E2E 套件怎么跑
UI_REVIEW_AHA.md        AhaPage 7 维度审查报告(22 finding)

server/src/
  ├── routes-{auth,letters,ai,aha}.ts   4 路由
  ├── db.ts                              schema + 6 表(aha_moments 是 V4 新增)
  ├── auth.ts                            JWT + bcrypt + blacklist
  ├── ws.ts                              WS 广播(PM2 fork 模式 OK,cluster 不行)
  ├── storage-provider.ts                OSS / 本地 适配
  ├── sms-provider.ts                    阿里云 / mock 适配
  ├── wechat-provider.ts                 微信 OAuth
  ├── openapi-registry.ts                /api/docs swagger UI
  └── index.ts                           Express + WS + 10 路由

src/pages/
  ├── AhaPage.tsx          1048 行,V4 主页面(大文件,可拆)
  ├── LettersPage.tsx       小纸条主页(时空/收到/写过)
  ├── LetterComposePage.tsx  写新信
  ├── LetterTodayPage.tsx    今日信封
  ├── LetterDetailPage.tsx   信详情
  ├── ProfilePage.tsx        个人中心(已精简)
  ├── AuthPage.tsx           登录/注册
  ├── FavoritesPage.tsx      我的收藏

src/shared/hooks/
  ├── useLetters.ts          私人信件 CRUD(localStorage + cloud 双存)
  ├── useLettersServer.ts    服务端拉取(收藏/收到)
  ├── useAuth.ts              JWT 状态
  ├── useAudioRecorder.ts     MediaRecorder 60s 上限
  ├── useReminder.ts          每日 PWA 提醒
  ├── apiClient.ts            fetch wrapper(自动加 token / 401 自动 refresh)
  └── useContentLoader.ts     /data/*.json 加载(5 tab 内容)
```

## 7. 上下文状态(下次接手时)

- 85 commits 没 push
- server/* 没 deploy(PM2 跑老代码)
- 用户主项目是 1 人独立开发,~5h/周
- 工作流: 1 段 1 报告,等拍板
- 真机测试:还没做(用户没 Mac 桌面 in workspace,或没时间)
- Apple Developer 账号:未申请

## 8. 通信接口

- 项目根 Lark / 飞书群:无(独立项目)
- 用户 IM:本会话(看 agent-context 里的 YOUR SESSION ID 走 mavis communication)
- Server log:`pm2 logs letters-server --lines 100` 查实时

---

**TL;DR**:项目当前 98 commits 在本地,产品形态是"小纸条 + 啊哈时刻"(V4 完整),3 大块 1 次性投资都已收口(V3.8 / V4 / UI+E2E)。剩 1 件事用户没拍:**deploy server + 真机测试**。其余 backlog 等用户提。
