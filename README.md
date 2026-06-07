# 小纸条 / Letters

> A warm corner for every letter written to you.
> 一个温暖的角落,收下每封写给你的信。

[![Status](https://img.shields.io/badge/status-v3.8-success)]()
[![Stack](https://img.shields.io/badge/stack-React%2019%20%2B%20Express-blue)]()
[![License](https://img.shields.io/badge/license-Private-red)]()

---

## 这是什么?

小纸条是一个**慢社交**应用,让你认真写一封信给特定的人。

- 匿名 / 署名都可以
- AI 帮你润色、改写、翻译
- 收件人收到后,信变成收藏进"时空纸条"
- 跨端: Web (PWA) / iOS / Android

> V1/V2/V3 演进了 3 年,V3 加入了用户系统、AI、实时推送、Capacitor 打包。

---

## 技术栈

| 层 | 选型 | 理由 |
|---|---|---|
| **前端** | React 19 + Vite 6 + TypeScript | 快、现代、TypeScript 安全 |
| **样式** | Tailwind CSS 4 + Framer Motion | 原子化 + 流畅动效 |
| **路由** | React Router 7 | |
| **状态** | Zustand 5 + 模块级 hooks | 轻量、无 boilerplate |
| **PWA** | vite-plugin-pwa + Workbox | 离线优先 + 后台更新 |
| **App 打包** | Capacitor 8 (iOS + Android) | 一份代码,三端 |
| **后端** | Node 22 + Express 5 + TS | |
| **DB** | better-sqlite3 (WAL) | 单文件 + 够快 + 零运维 |
| **WS** | ws + 进程内 userSockets | |
| **AI** | LongCat API (OpenAI 兼容) + mock fallback | 国内可达 + 免费 5M tokens/日 |
| **错误监控** | Sentry (@sentry/react + @sentry/node) | |
| **存储** | 本地磁盘 (默认) / 阿里云 OSS (可选) | |
| **认证** | JWT (jti + 黑名单) + bcrypt | |
| **i18n** | react-i18next | 中英双语 |
| **API 文档** | @asteasolutions/zod-to-openapi + swagger-ui-express | |

---

## 快速开始

### 1. 克隆 + 安装

```bash
git clone <repo>
cd feiman-v3-new
npm install --registry=https://registry.npmmirror.com
```

### 2. 启动后端

```bash
cd server
npm install --registry=https://registry.npmmirror.com
npm run dev
# → http://localhost:3000/api/health
```

### 3. 启动前端

```bash
# 在项目根目录
npm run dev
# → http://localhost:5173
```

### 4. (可选) 配真实服务

复制 `.env.example` → `.env.local`,填:
- `LONGCAT_API_KEY`(AI 功能)
- `VITE_SENTRY_DSN`(错误监控)
- 服务器部署参见 [DEPLOY.md](#部署)

---

## 目录结构

```
feiman-v3-new/
├── src/                    # 前端(React)
│   ├── pages/              # 页面
│   ├── shared/
│   │   ├── components/     # 通用组件
│   │   ├── hooks/          # 自定义 hooks
│   │   └── utils/          # 工具
│   ├── i18n/               # 中英双语
│   ├── stores/             # Zustand
│   ├── types/              # Zod schema
│   └── main.tsx
├── server/                 # 后端(Express)
│   ├── src/
│   │   ├── routes-*.ts     # API 路由
│   │   ├── auth.ts         # JWT + 黑名单
│   │   ├── db.ts           # SQLite + migration
│   │   ├── ws.ts           # WebSocket
│   │   ├── sms-provider.ts # 阿里云短信
│   │   ├── wechat-provider.ts
│   │   └── storage-provider.ts
│   ├── scripts/            # 迁移 + 部署 + 截图
│   └── package.json
├── public/                 # 静态资源
│   ├── icons/              # PWA 图标(sharp 自动生成)
│   └── gallery/            # 信纸插图
├── ios/                    # Capacitor iOS 项目
├── android/                # Capacitor Android 项目
├── scripts/                # Puppeteer 截图
├── ARCHITECTURE.md         # 完整架构文档(1166 行)
├── CHANGELOG.md            # 版本日志(3391 行)
└── CAPACITOR.md            # 打包上架指南
```

---

## 常用命令

### 开发

```bash
# 前端
npm run dev               # 启动 Vite dev server
npm run build             # build production
npm run preview           # 预览 build
npm run lint              # ESLint

# 后端
cd server
npm run dev               # 启动 Express (ts-node)
npm run build             # tsc
npm start                 # 跑 dist/index.js
npm test                   # vitest run (20 tests, 66% 覆盖)
npm run test:coverage     # 看 HTML 报告
```

### 部署

```bash
# 前端 + 后端
./server/deploy-server.sh

# PWA 图标
node scripts/generate-app-icons.mjs

# App Store 截图
node scripts/screenshot-appstore.mjs
```

### 数据库

```bash
# 备份(已在 cron)
ls /var/backups/feiman-letters/

# 手动备份
cd server && bash scripts/backup.sh

# 恢复
cd server && bash scripts/restore.sh /var/backups/feiman-letters/letters-YYYYMMDD-HHMMSS.tar.gz
```

---

## 部署

### 服务器要求

- Linux (Ubuntu 22+ / Alibaba Cloud Linux 3)
- Node 22+
- Nginx 1.18+
- PM2 (global)
- 阿里云 ECS / 轻量应用服务器

### 一键部署

```bash
# 服务器
ssh root@47.99.101.168
cd /var/www
git clone <repo> feiman-v3-new
cd feiman-v3-new
./server/deploy-server.sh
```

详细流程:见 [server/POSTGRES_MIGRATION.md](./server/POSTGRES_MIGRATION.md) 和 [CAPACITOR.md](./CAPACITOR.md)

---

## API 文档

部署后访问:
- **Swagger UI**: `https://47.99.101.168:8890/api/docs`
- **OpenAPI JSON**: `https://47.99.101.168:8890/api/openapi.json`

当前 18 个端点,覆盖:
- Auth(注册/登录/刷新/登出/手机号/微信)
- Letters(创建/列表/分享/收藏/星标)
- AI(润色/改写/翻译)
- Upload(头像/通用图片)
- Inbox(收件箱)

---

## 测试

```bash
cd server
npm test
```

当前 **20 tests, 66% 覆盖**:
- auth.ts:83%(bcrypt + JWT + 黑名单)
- db.ts:86%(SQL 操作)
- openapi-registry:89%
- routes-letters:69%
- routes-auth:49%(没覆盖 avatar upload)

---

## 关键能力清单

### ✅ 已上线(代码 100% 就绪)

| 能力 | 入口 | 激活方式 |
|---|---|---|
| V1/V2 小纸条 CRUD | `/letters` | 默认 |
| V3 用户系统 | `/auth` | 默认 |
| V3 AI 润色/改写/翻译 | `/letters/compose` | `LONGCAT_API_KEY` |
| V3 WebSocket 推送 | 自动 | 默认 |
| V3 Sentry 错误监控 | 自动 | `SENTRY_DSN` |
| V3 手机号注册 | `/auth`(phone tab) | 阿里云短信 env |
| V3 微信 OAuth | `/auth`(微信按钮) | 微信开放平台 env |
| V3 OSS 存储 | 自动 | 阿里云 OSS env |
| V3 OpenAPI 文档 | `/api/docs` | 默认 |
| V3 单元 + 集成测试 | `npm test` | 默认 |
| V3.8 i18n 中英双语 | 右上角 EN/中 按钮 | 默认 |
| V3.8 PWA / iOS / Android 图标 | 自动 | `node generate-app-icons.mjs` |

### 🟡 激活即用(等凭据)

- 阿里云短信(段 5)
- 阿里云 OSS + CDN(段 6)
- 微信开放平台 OAuth(段 7)
- 阿里云 Postgres(段 4,QPS > 1k 时)
- Sentry DSN(段 1,真 DSN 激活)
- Apple Developer 账号($99/年,App Store 上架)
- Google Play 账号($25,Google Play 上架)

---

## 文档索引

- **[ARCHITECTURE.md](./ARCHITECTURE.md)** — 完整架构(1166 行,Roadmap + 12 模块 + §14 review)
- **[CHANGELOG.md](./CHANGELOG.md)** — 版本日志(3391 行,2026-04 → 2026-06,42 个会话)
- **[CAPACITOR.md](./CAPACITOR.md)** — 打包上架指南
- **[APP_STORE_METADATA.md](./APP_STORE_METADATA.md)** — 应用商店文案 + 截图脚本
- **[server/POSTGRES_MIGRATION.md](./server/POSTGRES_MIGRATION.md)** — SQLite → Postgres 切换指南
- **[.env.example](./.env.example)** — 部署环境变量参考
- **[.github/SECURITY.md](./.github/SECURITY.md)** — 漏洞报告流程

---

## 贡献

这是个人项目,目前不接受 PR。如发现 bug,提交 [issue](https://github.com/<user>/<repo>/issues) 或邮件联系。

---

## 许可证

**Private** — 仅供个人使用。代码可参考,不可商用。

---

<p align="center">Made with 💌 in Beijing</p>
