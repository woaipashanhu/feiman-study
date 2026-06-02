# 📋 费曼科学课 (feiman-v3-new) — 项目交接文档

> **交接日期**: 2026-06-02
> **当前版本**: v14 (2026-06-02 Safari横屏适配 + PWA图标 + 测试刷新按钮)
> **交接人**: AI Assistant
> **接收人**: 后续开发 Agent

---

## 一、项目概览

| 属性 | 值 |
|------|-----|
| **项目名称** | 费曼科学课 (feiman-web) |
| **技术栈** | React 19 + Vite 6 + TypeScript 5.7 + Tailwind CSS v4 + Zustand 5 + React Router v7 |
| **3D 渲染** | Three.js + @react-three/fiber + @react-three/drei |
| **PWA** | vite-plugin-pwa (Service Worker + Manifest) |
| **目标平台** | Web (移动端优先) / 预留 App (Capacitor) |
| **线上地址** | http://47.99.101.168:8890/ |
| **服务器** | 47.99.101.168 (阿里云) |
| **部署目录** | /var/www/feiman-v3-new/ |
| **Nginx 端口** | 8890 |
| **SSH 密钥** | /Users/liuzhen/Desktop/项目/lingxi_cloud.pem |

---

## 二、已完成的功能清单（100% 完成架构 P0+P1+P2+Phase3）

### 2.1 五大核心板块

| 板块 | 路由 | 状态 | 说明 |
|------|------|------|------|
| **数学课** | `/math` / `/math/:lessonId` | ✅ 完成 | Aliplayer + VOD 私有加密，26 节课 |
| **科学可视化** | `/science` / `/science/category/:id` / `/science/:id` | 🔄 改造中 | react-three-fiber，11 个 3D 场景，4 分类，新交互架构 |
| **社交训练** | `/social` / `/social/scene/:id` | ✅ 完成 | 绘本阅读器，86 场景，82/86 有音频，20/86 有英文旁白，Safari横屏提示适配 |
| **童画廊** | `/gallery` / `/gallery/:id` | ✅ 完成 | 瀑布流列表 + 全屏大图查看，8 幅名画，3 分类 |
| **内功养生法** | `/neimen` / `/neimen/:id` | ✅ 完成 | 卡片列表 + 翻转详情页，6 张卡片，3 分类 |

### 2.2 全局功能

| 功能 | 实现文件 | 说明 |
|------|---------|------|
| **TabBar 导航** | `BoardLayout.tsx` + `TabBar.tsx` | 5 个板块切换，固定在底部 |
| **个人中心侧边栏** | `ProfileDrawer/index.tsx` | 从右侧滑出，含今日学习/每日盲盒/心情/成就/反馈 |
| **页面转场动画** | `PageTransition.tsx` | 智能判断前进/后退/Tab 切换，纯 CSS |
| **骨架屏加载** | `Skeleton.tsx` | 4 种模板（画廊/列表/内功/详情），替代 LoadingScreen |
| **下拉刷新** | `PullToRefresh.tsx` | 纯 touch 事件，阻尼弹性，60px 触发阈值 |
| **滚动位置记忆** | `useScrollRestoration.ts` | 从详情页返回列表自动恢复位置 |
| **深色模式** | `useTheme.ts` | light/dark/system 三种模式，CSS 变量驱动 |
| **PWA** | `vite-plugin-pwa` | Service Worker，CDN/图片缓存策略，icon-192/512已补齐 |
| **测试刷新按钮** | `App.tsx` | 右下角固定刷新按钮，方便PWA测试时手动更新 |
| **分享海报** | `ShareButton.tsx` | Canvas 生成 750×1000px 海报，支持原生分享 API |
| **内容防复制** | `ContentProtection.tsx` | 禁用右键/选择/拖拽 |
| **错误边界** | `ErrorBoundary.tsx` | 单板块出错不白屏，自动上报错误 |
| **开发错误面板** | `DevErrorPanel.tsx` | 开发环境右下角实时错误捕获面板 |
| **错误上报** | `error-reporter.ts` | 生产环境自动收集错误（fetch + beacon + localStorage 三重保障） |

### 2.3 数据层

| 功能 | 实现文件 | 说明 |
|------|---------|------|
| **内容加载器** | `useContentLoader.ts` | fetch + Zod 校验 + fallback 降级 |
| **学习追踪** | `useLearningTracker.ts` | 记录访问/时长/完成状态，自动计算成就 |
| **心情记录** | `useMoodTracker.ts` | 每日一条（emoji+文字），保留 90 天 |
| **意见反馈** | `useFeedback.ts` | 4 种分类，最多保留 100 条 |
| **安全存储** | `storage.ts` | Base64 混淆（非加密），带前缀隔离 |
| **名言库** | `dailyQuotes.ts` | 30 条，按日期取模循环 |
| **环境检测** | `env.ts` | 预留 Capacitor App 检测 |
| **OG 标签** | `og.ts` | 动态更新页面 meta |
| **版本检查** | `useVersionCheck.ts` | 对比 manifest.json 版本号 |

### 2.4 架构预留（未激活但已准备）

| 预留项 | 状态 | 说明 |
|--------|------|------|
| **Capacitor 配置** | ✅ 就绪 | `capacitor.config.ts` 已配置，未安装依赖 |
| **用户系统** | ✅ 预留 | Store 中 `user`/`isLoggedIn` 字段已定义 |
| **全屏个人中心** | ✅ 已实现 | 路由 `/profile`，从消息图标进入，含今日学习/每日盲盒/心情/成就/反馈/主题切换 |
| **多端同步** | ⏳ 未开始 | 第三阶段功能 |
| **App 推送** | ⏳ 未开始 | 第三阶段功能 |

---

## 三、项目目录结构

```
feiman-v3-new/
├── src/
│   ├── App.tsx                    # 根组件：BrowserRouter + ContentProtection
│   ├── main.tsx                   # 入口：StrictMode + createRoot
│   ├── index.css                  # Tailwind v4 + 自定义动画 keyframes + 深色模式
│   ├── router/
│   │   └── index.tsx              # 路由配置：5列表页 + 5详情页，全部 lazy + Suspense
│   ├── boards/                    # 五大板块（每个板块独立目录）
│   │   ├── MathBoard/             # 数学课：List + Player(Aliplayer)
│   │   ├── ScienceBoard/          # 科学：List + Player(3D场景)
│   │   ├── SocialBoard/           # 社交训练：List + Player(绘本阅读器)
│   │   ├── GalleryBoard/          # 画廊：List + Viewer(全屏大图)
│   │   └── NeimenBoard/           # 内功：List + CardDetail(翻转卡片)
│   ├── shared/                    # 共享层（核心）
│   │   ├── components/            # 通用组件
│   │   │   ├── BoardLayout.tsx    # 布局：TabBar + ProfileDrawer + PullToRefresh + PageTransition
│   │   │   ├── TabBar.tsx         # 底部导航
│   │   │   ├── ProfileDrawer/     # 个人中心侧边栏
│   │   │   ├── PageTransition.tsx # 页面转场动画
│   │   │   ├── PullToRefresh.tsx  # 下拉刷新
│   │   │   ├── Skeleton.tsx       # 骨架屏（4种模板）
│   │   │   ├── ShareButton.tsx    # 分享 + 海报生成
│   │   │   ├── ErrorBoundary.tsx  # 错误边界（自动上报 + 友好UI）
│   │   │   ├── DevErrorPanel.tsx  # 开发环境错误实时面板
│   │   │   ├── LoadingScreen.tsx  # 全屏加载（fallback用）
│   │   │   ├── EmptyState.tsx     # 空状态占位
│   │   │   ├── ContentMenu.tsx    # 内容菜单
│   │   │   ├── BackTop.tsx        # 回到顶部
│   │   │   └── ContentProtection.tsx # 防复制
│   │   ├── hooks/                 # 通用 Hooks
│   │   │   ├── useContentLoader.ts   # 内容加载（fetch + Zod + fallback）
│   │   │   ├── useLearningTracker.ts # 学习追踪
│   │   │   ├── useMoodTracker.ts     # 心情记录
│   │   │   ├── useFeedback.ts        # 意见反馈
│   │   │   ├── useScrollRestoration.ts # 滚动位置记忆
│   │   │   ├── useTheme.ts           # 深色模式
│   │   │   ├── usePlayerState.ts     # 播放器状态
│   │   │   └── useVersionCheck.ts    # 版本检查
│   │   └── utils/                 # 工具函数
│   │       ├── storage.ts         # 安全存储（Base64混淆）
│   │       ├── dailyQuotes.ts     # 名言库
│   │       ├── validator.ts       # Zod 校验 + fallback 数据
│   │       ├── env.ts             # 环境检测（Capacitor预留）
│   │       ├── og.ts              # OG 标签管理
│   │       └── error-reporter.ts  # 生产环境错误上报（fetch + beacon + localStorage）
│   ├── stores/
│   │   └── useBoardStore.ts       # Zustand Store：板块状态 + 预留字段
│   └── types/
│       ├── content.ts             # Zod Schema + TypeScript 类型（5大板块）
│       └── board.ts               # 板块配置类型
├── public/
│   ├── data/                      # 内容数据（JSON，与代码分离）
│   │   ├── math.json              # 数学课：26节课，分章节
│   │   ├── science.json           # 科学：4分类11场景
│   │   ├── social-scenes.json     # 社交：86场景（v8，205KB）
│   │   ├── gallery.json           # 画廊：3分类8作品
│   │   ├── neimen.json            # 内功：3分类6卡片
│   │   └── manifest.json          # 版本清单
│   ├── manifest.json              # PWA Manifest
│   └── favicon.svg
├── scripts/                       # 数据生成/验证脚本（50+个）
│   ├── final-fix.py               # 社交数据最终生成脚本（Python 3.6兼容）
│   ├── final-verify.mjs           # Puppeteer E2E 验证
│   ├── verify-deploy.mjs          # 部署后冒烟测试
│   └── ...（大量调试/修复脚本）
├── dist/                          # 构建产物（部署用）
├── ARCHITECTURE.md                # 架构设计文档（1800+行）
├── CHANGELOG.md                   # 开发日志（必读）
├── HANDOVER.md                    # 本文件
├── capacitor.config.ts            # Capacitor 配置（预留）
├── vite.config.ts                 # Vite 配置（PWA + Tailwind + 路径别名）
└── package.json
```

---

## 四、关键技术决策（ADR）

| 决策 | 选择 | 理由 |
|------|------|------|
| **App 方案** | Capacitor（预留） | 零改造打包，WebView 热更新 |
| **本地存储** | localStorage（Base64混淆） | 零服务器成本，零登录门槛 |
| **内容分离** | JSON 数据文件 | Agent 只需改 JSON，不需懂 React |
| **个人中心** | Drawer 侧边栏（非全屏） | 轻量，不打断学习体验 |
| **路由懒加载** | React.lazy + Suspense | 减少首屏体积 |
| **数据校验** | Zod Schema | 运行时校验 + 自动降级到 fallback |
| **CSS 方案** | Tailwind CSS v4 (@theme) | 原子化 + 自定义主题变量 |
| **图标库** | lucide-react | 轻量，Tree-shakable |

---

## 五、开发环境搭建

### 5.1 第一次克隆后

```bash
# 1. 进入项目目录
cd feiman-v3-new

# 2. 安装依赖
npm install

# 3. 启动开发服务器
npm run dev
# → 打开 http://localhost:3000

# 4. 生产构建
npm run build
# → 输出到 dist/ 目录
```

### 5.2 关键依赖说明

```json
{
  "核心框架": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "react-router-dom": "^7.0.0"
  },
  "构建工具": {
    "vite": "^6.1.0",
    "typescript": "~5.7.2",
    "tailwindcss": "^4.0.0"
  },
  "状态管理": {
    "zustand": "^5.0.0"
  },
  "3D 渲染": {
    "three": "^0.184.0",
    "@react-three/fiber": "^9.6.1",
    "@react-three/drei": "^10.7.7"
  },
  "UI 组件": {
    "lucide-react": "^0.460.0"
  },
  "校验": {
    "zod": "^4.4.3"
  },
  "PWA": {
    "vite-plugin-pwa": "^1.3.0"
  }
}
```

---

## 六、部署流程

### 6.1 一键部署脚本（推荐）

```bash
# 完整部署（构建 → 预检 → 打包 → 上传 → 验证）
npm run deploy

# 只构建不上传（本地预检）
npm run deploy:dry

# 跳过构建，直接上传已有 dist/
npm run deploy:quick

# 单独运行预检
npm run predeploy

# 单独运行在线验证
npm run verify
```

**部署脚本流程** (`deploy.sh`)：
1. `npm run build` — Vite 生产构建
2. `node scripts/pre-deploy-check.mjs` — 5 大类 19 项预检（图标名 / 构建产物 / JSON 格式 / 代码陷阱 / 错误监控）
3. `tar -czf` — 打包 dist/ 目录
4. `scp` 上传 + `ssh` 远程原子化部署（临时目录解压 → 清理旧 JS/CSS → 复制新文件）
5. `node verify-deploy.mjs` — Puppeteer 在线验证所有页面

**旧的手动部署方式（不推荐，已废弃）：**
```bash
# 仅作为备用参考
npm run build
scp -i ~/Desktop/项目/CLAW.PEM -r dist/* root@47.99.101.168:/var/www/feiman-v3-new/
node verify-deploy.mjs
```

### 6.2 服务器信息

```bash
# SSH 连接
ssh -i ~/Desktop/项目/CLAW.PEM root@47.99.101.168

# 部署目录结构
/var/www/feiman-v3-new/
├── index.html              # SPA 入口
├── assets/                 # JS/CSS 分块
├── data/                   # JSON 数据文件（nginx no-cache）
│   ├── math.json
│   ├── science.json
│   ├── social-scenes.json
│   ├── gallery.json
│   └── neimen.json
├── audio/                  # 社交训练音频（332张图 + 618个音频）
├── images/                 # 社交训练图片
├── sw.js                   # Service Worker
└── robots.txt

# Nginx 配置路径
/etc/nginx/conf.d/feiman-v3-new.conf

# 重启 nginx
systemctl restart nginx
```

### 6.3 部署注意事项

1. **必须先运行预检**: `npm run predeploy` 会检查 19 项常见问题，**不通过则阻塞部署**
2. **Service Worker 缓存**: 部署新 JS/JSON 后可能需要清除浏览器缓存 (`Cmd+Shift+R`)
3. **nginx 的 `/data/` 已设 `no-cache`，但 SW precache 可能缓存旧版本
4. **服务器 Python 版本是 3.6.8**！不支持 f-string、walrus operator 等 3.7+ 语法
5. **SSH 密钥路径**: `/Users/liuzhen/Desktop/项目/CLAW.PEM`
6. **原子化部署**: deploy.sh 使用临时目录，确保部署过程中网站不会处于半更新状态

---

## 6.5 错误监控与调试

### 6.5.1 开发环境 — DevErrorPanel

开发时页面右下角自动显示错误面板：
- 🟢 绿色 = 无错误
- 🔴 红色脉冲 = 有错误，点击展开

捕获的错误类型：
- React 渲染错误（如 Minified React error #130）
- JS 运行时错误
- Promise 未处理异常
- 资源加载失败（JS/CSS/图片 404）

**一键复制**: 点击错误项的 📋 按钮，复制完整错误信息（可直接粘贴给开发者）

### 6.5.2 生产环境 — 自动上报

用户遇到错误时，自动收集并上报：
```
error-reporter.ts 收集的信息：
  ├── 错误消息 + 堆栈
  ├── 页面 URL
  ├── 浏览器 UA
  ├── 屏幕尺寸
  ├── Service Worker 状态
  └── 时间戳

上报方式（按优先级）：
  1. fetch POST → /api/log
  2. navigator.sendBeacon（页面关闭也能发送）
  3. localStorage 队列（下次打开时批量上报）
```

**去重**: 相同错误 5 分钟内只上报一次。

### 6.5.3 ErrorBoundary — 单板块出错不白屏

每个路由板块都被 `ErrorBoundary` 独立包裹：
- 数学板块出错了 → 其他板块（科学/社交/画廊/内功）**完全正常**
- 显示友好 UI：😵 图标 + "页面出错了" + 刷新按钮 + 复制错误信息
- 自动上报错误到服务器

### 6.5.4 图标类型安全

新增板块图标时，**必须**在 `icon-registry.ts` 中注册：
```typescript
// 1. 导入图标组件
import { NewIcon } from 'phosphor-react'

// 2. 添加到 VALID_ICON_NAMES
export const VALID_ICON_NAMES = [
  // ... 已有图标
  'NewIcon',
] as const

// 3. 添加到 registry
const registry = {
  // ... 已有图标
  NewIcon,
}
```

**TypeScript 会自动约束**: `useBoardStore.ts` 中写 `icon: 'NewIocon'`（拼写错误）→ **直接报红**

---

## 七、代码规范与约定

### 7.1 文件命名

| 类型 | 规范 | 示例 |
|------|------|------|
| 组件文件 | PascalCase | `BoardLayout.tsx` |
| Hook 文件 | camelCase + use 前缀 | `useLearningTracker.ts` |
| 工具文件 | camelCase | `storage.ts` |
| 类型文件 | camelCase | `content.ts` |
| 数据文件 | kebab-case | `social-scenes.json` |
| 部署脚本 | kebab-case | `deploy.sh` |
| 检查脚本 | kebab-case | `pre-deploy-check.mjs` |

### 7.2 目录约定

```
src/
├── boards/{BoardName}/      # 每个板块独立目录
│   ├── index.tsx             # 导出 List 组件
│   ├── List.tsx              # 列表页（必须导出）
│   ├── Player.tsx / Viewer.tsx / CardDetail.tsx  # 详情/播放页（按需）
│   └── types.ts              # 板块私有类型（按需）
├── shared/                   # 所有跨板块共享的代码
│   ├── components/           # 通用 UI 组件
│   ├── hooks/                # 通用 Hooks
│   └── utils/                # 工具函数
├── stores/                   # Zustand Store
├── router/                   # 路由配置
└── types/                    # 全局类型定义
```

### 7.3 组件编写规范

```tsx
// 1. 文件头注释（必须）
/**
 * ============================================================
 *  ComponentName — 组件用途一句话描述
 *
 *  功能：
 *    - 功能点1
 *    - 功能点2
 *
 *  使用方式：
 *    <ComponentName prop1="value" />
 * ============================================================
 */

// 2. 导入顺序
import { useState, useEffect } from 'react'        // React
import { SomeIcon } from 'lucide-react'            // UI 库
import { useSomeHook } from '@/shared/hooks'        // 内部 hooks
import type { SomeType } from '@/types/content'     // 类型

// 3. Props 接口
interface ComponentNameProps {
  /** 必填属性 */
  requiredProp: string
  /** 可选属性 */
  optionalProp?: number
}

// 4. 默认导出
export function ComponentName({ requiredProp, optionalProp }: ComponentNameProps) {
  // ...
}
```

### 7.4 数据流约定

```
用户操作
  ↓
组件 (boards/*/List.tsx 或 Player.tsx)
  ↓
Hook (shared/hooks/useContentLoader.ts)
  ↓
fetch('/data/xxx.json')  ← 从 public/data/ 加载
  ↓
Zod 校验 (shared/utils/validator.ts)
  ↓
校验通过 → setData(jsonData)
校验失败 → setData(fallbackData) + setError(msg)
  ↓
组件渲染 data || 显示 Skeleton || 显示 ErrorBoundary
```

### 7.5 新增内容步骤

如果要新增一个板块或修改内容：

1. **修改 JSON 数据文件** (`public/data/xxx.json`)
2. **更新 Zod Schema** (`src/types/content.ts`) — 如果数据结构变了
3. **更新 Fallback 数据** (`src/shared/utils/validator.ts`) — 保证校验失败时有兜底
4. **不需要重新编译前端** — JSON 是运行时加载的
5. **只需要把新 JSON 上传到服务器** 即可生效

---

## 八、已知问题与待办事项

### 8.1 已知问题（不影响主流程）

| 问题 | 严重度 | 说明 |
|------|--------|------|
| 数学播放页 VOD 加载慢 | 低 | 阿里云 VOD 加密视频，首次加载需要获取 playauth |
| 社交阅读器首屏慢 | 低 | 86 场景 JSON (205KB) + 音频资源较多 |
| s28/s29 无音频 | 低 | 原始数据缺失，需确认是否补充 |
| s-21b/s-31b ID 冲突 | 低 | 副本数据，无图片目录 |

### 8.2 待后续完善

| 任务 | 优先级 | 说明 |
|------|--------|------|
| 全屏个人中心页面 (/profile) | P2 可选 | 当前 Drawer 已覆盖核心功能 |
| 用户登录/注册 | P3 | 第三阶段 |
| 多端数据同步 | P3 | 第三阶段 |
| App 推送通知 | P3 | 第三阶段 |
| 微信小程序适配 | P3 | 第三阶段 |
| 3D 场景真实缩略图 | 低 | 当前用渐变色占位 |
| 名画高清图片资源 | low | 当前用 SVG 占位符 |
| 养生卡片封面图片 | low | 当前用渐变色占位 |

---

## 九、调试与验证

### 9.1 本地开发

```bash
# 启动 dev server
npm run dev
# → http://localhost:3000

# TypeScript 检查
npx tsc --noEmit

# 构建
npm run build
```

### 9.2 冒烟测试（Puppeteer）

```bash
# 运行自动化冒烟测试
node verify-deploy.mjs
# 测试项：
#   - 5 个列表页是否正常渲染
#   - 3 个播放/详情页是否可访问
#   - 无控制台错误
```

### 9.3 常用调试命令

```bash
# 检查线上 JSON 数据
ssh -i ~/Desktop/项目/CLAW.PEM root@47.99.101.168 \
  "python3 -c \"import json; d=json.load(open('/var/www/feiman-v3-new/data/social-scenes.json')); print(len(d['sceneData']), 'scenes')\""

# 检查音频目录
ssh -i ~/Desktop/项目/CLAW.PEM root@47.99.101.168 \
  "ls /var/www/feiman-v3-new/audio/s01/ | head -10"

# 检查 MD5 是否一致
md5sum public/data/social-scenes.json
ssh -i ~/Desktop/项目/CLAW.PEM root@47.99.101.168 \
  "md5sum /var/www/feiman-v3-new/data/social-scenes.json"
```

---

## 十、架构文档索引

| 文档 | 用途 | 必读性 |
|------|------|--------|
| **HANDOVER.md** (本文件) | 项目交接，快速上手 | ⭐⭐⭐ 必须 |
| **CHANGELOG.md** | 开发日志，历史问题链 | ⭐⭐⭐ 必须 |
| **ARCHITECTURE.md** | 完整架构设计（1800+行） | ⭐⭐ 详细时查阅 |
| **SKILL.md** (.catpaw/skills/) | Agent 操作手册 | ⭐⭐ AI 开发时必读 |

---

## 十一、快速上手 Checklist

接收此项目后，按以下顺序操作：

- [ ] 1. 阅读 **HANDOVER.md**（本文件）— 了解全貌
- [ ] 2. 阅读 **CHANGELOG.md** — 了解历史和已知问题
- [ ] 3. 运行 `npm install` 安装依赖
- [ ] 4. 运行 `npm run dev` 启动开发服务器
- [ ] 5. 浏览 5 个板块的列表页和详情页
- [ ] 6. 点击右下角 💬 按钮，查看 ProfilePage（个人中心）
- [ ] 7. 尝试下拉刷新、切换深色模式
- [ ] 8. 阅读 **ARCHITECTURE.md** §十（实施计划）了解后续规划
- [ ] 9. 如需部署，参考第六节「部署流程」

---

> **最后更新**: 2026-06-02 (v14 Safari横屏适配 + PWA图标 + 测试刷新按钮)
> **交接状态**: ✅ 代码完整，文档齐全，可无缝交接
> **最新变更**: 社交绘本移除Screen Orientation API改为CSS横屏提示、补齐PWA图标(icon-192/512)、App.tsx添加测试刷新按钮
