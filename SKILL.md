---
name: 费曼科学课 V3 (feiman-v3-new)
description: 维护「刘费曼的科学课」V3 STEM 教育平台（React 19 + TypeScript + Vite 6 + Tailwind CSS v4 + Framer Motion）。五大板块：1.数学课（视频播放）2.科学可视化（Three.js 3D交互页面）3.社交技能训练（小狐狸学堂儿童互动绘本）4.童画廊（世界名画鉴赏+音频讲解）5.内功养生法（八卦掌绘本）+ 小纸条模块（苹果风全屏子页面，从 ProfilePage 入口卡进入）。React SPA 单体架构，原生组件渲染，服务器部署。触发条件：用户提到'添加视频''加个视频''更新网站''加课''科学可视化''交互页面''社交训练''童画廊''内功养生法''综合网站''板块整合''更新日志''小纸条''时空纸条''收到的纸条''写过的纸条''今日纸条''写一张纸条''信纸''名言收藏''AI 转换''长图分享'或提供视频文件路径。
---

# 费曼科学课 V3 — Agent 操作手册

## 项目概览

| 属性 | 值 |
|------|-----|
| **项目名称** | 费曼科学课 V3 (feiman-v3-new) |
| **技术栈** | React 19 + Vite 6 + TypeScript 5.7 + Tailwind CSS v4 + Zustand 5 + React Router v7 |
| **3D 渲染** | Three.js + @react-three/fiber + @react-three/drei |
| **动画库** | Framer Motion（页面转场、卡片动画、抽屉） |
| **PWA** | vite-plugin-pwa (Service Worker + Manifest) |
| **目标平台** | Web (移动端优先) / 预留 App (Capacitor) |

### 线上地址

- **线上地址**: `http://47.99.101.168:8890/`
- **服务器**: `47.99.101.168` (阿里云)
- **部署目录**: `/var/www/feiman-v3-new/`
- **Nginx 端口**: `8890`
- **SSH 密钥**: `/Users/liuzhen/Desktop/项目/lingxi_cloud.pem`

### 项目位置

| 路径 | 说明 |
|------|------|
| **源码目录** | `/Users/liuzhen/Documents/lingxi-claw/20260529-08-47-11-713/feiman-v3-new/` |
| **日志文件** | `CHANGELOG.md`（每次会话必须更新） |
| **交接文档** | `HANDOVER.md`（项目完整交接信息） |
| **部署脚本** | `deploy.sh`（一键部署，5步自动化） |
| **预检脚本** | `scripts/pre-deploy-check.mjs`（19项检查） |

---

## 核心文件结构

```
src/
├── App.tsx                          # 根组件
├── main.tsx                         # 入口（初始化全局错误监听）
├── index.css                        # Tailwind CSS 入口
├── router/
│   └── index.tsx                    # 路由配置（SafeLazy + ErrorBoundary）
├── boards/
│   ├── MathBoard/                   # 数学课板块
│   │   ├── index.tsx                # 板块入口
│   │   ├── List.tsx                 # 课程列表页
│   │   └── Player.tsx              # 视频播放页（Aliplayer）
│   ├── ScienceBoard/               # 科学可视化板块 ⭐新架构
│   │   ├── index.tsx                # 板块入口 → Home.tsx
│   │   ├── Home.tsx                 # 卡片主页（4分类卡片网格）
│   │   ├── CategoryList.tsx         # 分类列表页（场景列表）
│   │   └── Player.tsx              # 3D播放页（统一顶栏+列表抽屉）
│   ├── SocialBoard/                # 社交训练板块
│   │   ├── index.tsx
│   │   ├── List.tsx
│   │   └── Player.tsx             # 绘本阅读器
│   ├── GalleryBoard/              # 童画廊板块
│   │   ├── index.tsx
│   │   ├── List.tsx
│   │   └── Viewer.tsx            # 全屏大图查看
│   └── NeimenBoard/               # 内功养生法板块
│       ├── index.tsx
│       ├── List.tsx
│       └── CardDetail.tsx        # 卡片翻转详情
├── shared/
│   ├── components/
│   │   ├── TabBar.tsx             # 底部导航栏（图标类型安全）
│   │   ├── BoardLayout.tsx        # 板块布局容器
│   │   ├── PageTransition.tsx     # 页面转场动画
│   │   ├── ErrorBoundary.tsx      # React 错误边界
│   │   ├── DevErrorPanel.tsx      # 开发环境错误面板
│   │   ├── Skeleton.tsx           # 骨架屏加载
│   │   ├── icon-registry.ts       # 图标注册表（类型安全）
│   │   └── index.ts
│   ├── hooks/
│   │   ├── useContentLoader.ts    # 数据加载 Hook
│   │   └── useScrollRestoration.ts # 滚动位置记忆
│   └── utils/
│       ├── error-reporter.ts      # 错误上报模块
│       └── index.ts
├── stores/
│   └── useBoardStore.ts          # TabBar 板块配置
└── types/
    ├── board.ts                   # 板块类型定义
    └── content.ts                # 内容数据类型

public/data/                        # 静态 JSON 数据
├── science.json                    # 科学场景数据（4分类，11场景）
├── math.json                       # 数学课程数据（26节课）
├── social-scenes.json             # 社交场景数据（86场景）
├── gallery.json                    # 画廊数据（8幅名画）
└── neimen.json                     # 内功数据（6张卡片）
```

---

## 五大板块

| 板块 | 路由 | 技术栈 | 状态 |
|------|------|--------|------|
| 数学课 | `/math` / `/math/:lessonId` | Aliplayer + VOD 私有加密 | ✅ 完成 |
| 科学可视化 | `/science` / `/science/category/:id` / `/science/:id` | react-three-fiber, 4分类, 11场景 | 🔄 改造中 |
| 社交训练 | `/social` / `/social/scene/:id` | 绘本阅读器, 86场景 | ✅ 完成 |
| 童画廊 | `/gallery` / `/gallery/:id` | 瀑布流 + 全屏查看 | ✅ 完成 |
| 内功养生法 | `/neimen` / `/neimen/:id` | 卡片翻转详情 | ✅ 完成 |
| 小纸条模块 | `/letters` / `/letters/today` / `/letters/letter/:id` / `/letters/compose` / `/letters/inbox/:token` | 苹果风全屏子页面(从 ProfilePage 入口卡进入,**不**占 TabBar) | ✅ V1 完成 |

---

## 新交互架构（以科学板块为原型）

```
TabBar 点击 → 板块主页(Home) → 分类列表(CategoryList) → 播放页(Player)
                  ↓
            📬 消息按钮 → 消息中心(/messages)
                  ↓
         [盲盒] [个人中心] [设置]
```

### 各页面职责

1. **卡片主页 (`Home.tsx`)**
   - 展示分类卡片网格（2列）
   - 右上角 📬 消息按钮（带红点）
   - 点击卡片进入分类列表

2. **分类列表页 (`CategoryList.tsx`)**
   - 返回按钮 + 分类标题
   - 场景列表（缩略图 + 标题 + 描述）
   - 点击场景进入播放页

3. **播放页 (`Player.tsx`)**
   - 统一顶部栏：← 返回 | 标题 | 📬 消息 | ☰ 列表
   - 列表抽屉：右侧滑出，展示所有分类和场景
   - 底部导航：上一个 / 下一个

---

## 配色方案

| 板块 | 主色 | 说明 |
|------|------|------|
| 数学 | 天蓝色 `#3B82F6` | 清爽、理性 |
| 科学 | 薄荷青 `#06B6D4` | 科技、探索 |
| 社交 | 暖橙 `#F97316` | 温暖、亲和 |
| 画廊 | 雾紫 `#A78BFA` | 艺术、优雅 |
| 内功 | 米白/暖沙 `#F5F0E8` | 自然、宁静 |

---

## 部署流程

```bash
# 一键部署（构建 + 预检 + 上传 + 验证）
npm run deploy

# 只构建不上传
npm run deploy:dry

# 跳过构建，直接上传已有 dist/
npm run deploy:quick

# 仅运行预检
npm run predeploy
```

### 部署前预检（19项）

1. 图标名拼写检查（防止 React #130 白屏）
2. 构建产物完整性检查
3. data JSON 格式校验
4. 代码陷阱扫描
5. 错误监控系统检查

---

## 错误监控体系

| 层级 | 文件 | 环境 |
|------|------|------|
| 全局错误捕获 | `main.tsx` → `error-reporter.ts` | 生产/开发 |
| React 错误边界 | `ErrorBoundary.tsx` | 所有路由 |
| 开发错误面板 | `DevErrorPanel.tsx` | 仅开发环境 |
| 图标类型安全 | `icon-registry.ts` | 编译期 |

---

## 常见陷阱

| 陷阱 | 解决方案 |
|------|---------|
| 图标名写错导致白屏 | 使用 `icon-registry.ts` 的 `getIcon()` 函数，TS 编译期检查 |
| SSH 连接失败 | 使用正确密钥：`/Users/liuzhen/Desktop/项目/lingxi_cloud.pem` |
| 部署后页面未更新 | 部署脚本已实现原子化部署（清理旧文件 → 复制新文件） |
| phosphor-react 组件名变化 | 用 `CaretDown` 替代 `ChevronDown`，用 `CaretUp` 替代 `ChevronUp` |

---

## 版本历史

| 版本 | 日期 | 更新内容 |
|------|------|---------|
| v14 | 2026-06-06 | 小纸条模块 V1(数据层+视觉+5 页面+路由+ProfilePage 入口+AI+长图+分享) |
| v13 | 2026-05-31 | 科学板块交互架构改造（原型） |
| v12 | 2026-05-31 | 部署防错体系 + 错误监控系统 |
| v11 | 2026-05-30 | PWA + 骨架屏 + 下拉刷新等体验优化 |
| v10 | 2026-05-29 | 五大板块基础功能完成 |

---

## 小纸条模块

### 命名规范(锁死)

**正确**:小纸条 / 时空纸条 / 收到的纸条 / 写过的纸条 / 今日纸条 / 写一张纸条
**错误**(禁止):信札 / 收件箱 / 写信 / 邮件 / 简讯 / 推送

### 路由

| 路径 | 页面 | 职责 |
|---|---|---|
| `/letters` | LettersPage | 主页 3 Tab(时空/收到/写过)+ FAB 写一张纸条 |
| `/letters/today` | LetterTodayPage | 拆信 + 收藏到时空纸条 |
| `/letters/letter/:id` | LetterDetailPage | 单张详情 + 收藏切换 + 删除 |
| `/letters/compose` | LetterComposePage | 写信 UI + AI 转换 + 引用 + 长图 + Web Share |
| `/letters/inbox/:token` | LetterInboxPage | 分享落地页(V1 占位,V2 真实解析) |

### 数据层

- 类型:`src/types/letters.ts`(LetterSchema + Zod)
- Hook:`src/shared/hooks/useLetters.ts`(CRUD + localStorage + 跨实例同步)
- localStorage key:`feiman_letters`(Base64 加密,复用 saveSecure/loadSecure,与 useFavorites 同套)
- 上限:500 条
- 三种 kind:`quote`(时空纸条)/ `personal`(收到的纸条)/ `compose`(写过的纸条)

### 视觉规范(锁死,palette.ts)

- **5 色**:ivory `#FAF7F2` / midnight `#0E1014` / kraft `#D4B895` / vermilion `#C83820` / gold `#B88840`
- **字体栈**:思源宋体 SC(中文/古文/印章)+ 苹方(英文/UI)+ SF Mono(英文小字)
- **3 信纸底色**:`ivory`(默认)/ `midnight`(V2)/ `kraft`(V2)
- **iOS 风格**:Segmented Control + spring(300, 30) + Segmented layoutId 滑块
- **反例(已拒绝)**:火漆、卷轴、仿毛笔字、多重浮雕、emoji 满屏、720° 旋转粒子

### 组件结构

```
src/shared/components/LetterPaper/
├── palette.ts          # LETTER_PALETTE + FONT_STACK + SPRING + PAPER_SHADOW
├── LetterStamp.tsx     # 印章(朱红/烫金 × 小/中/大)
└── index.tsx           # LetterPaper(变体 quote / personal / compose / preview)
```

### 写信页 LetterComposePage 工具

- **字号**:小(15px)/ 中(17px)/ 大(20px)
- **底色**:ivory(V1);midnight/kraft 灰色 V2 占位
- **AI 转换**:`useAITransform` hook — V1 mock(8 古文 + 8 英文模板),V2 切 DeepSeek
- **引用**:从今日纸条 + 时空纸条列表选
- **生成长图**:html2canvas-pro 2.0.4,750×1334 PNG
- **Web Share**:navigator.share(图片 + 文本),降级到剪贴板复制

### 入口

- **ProfilePage 卡片**:"一封来自今天的信"(暖米色 #FAF7F2 → #F0E8D8 渐变 + 朱红 LETTERS 小标签 + 思源宋体 22px 标题)
- 入口卡 → 跳 `/letters/today`(今日拆信)而非 `/letters`(主页)
- **不**占底部 TabBar 5 板块位置(P2 计划表 #31 待定)

### 触发词(用户常用)

| 用户说 | Agent 应该 |
|---|---|
| "小纸条" / "打开小纸条" | 跳 `/letters` |
| "时空纸条" | 跳 `/letters?tab=quote` |
| "收到的纸条" | 跳 `/letters?tab=personal` |
| "写过的纸条" | 跳 `/letters?tab=compose` |
| "今日纸条" / "今日名言" | 跳 `/letters/today` |
| "写一张纸条" / "写信" | 跳 `/letters/compose` |
| "收藏名言" / "收藏到时空" | `useLetters().addQuote(...)` |
| "AI 转换" / "古文" / "翻译" | `useAITransform().run(input)` |
| "分享纸条" / "寄出" | `navigator.share(图片+文本)` |

### 已知约束

- **V1 不做语音输入**:Web Speech 中文支持差,V2 接入讯飞/Whisper
- **V1 不接真实 DeepSeek**:mock 实现,接口签名与 V2 一致
- **V1 跨用户方案**:Web Share 分享长图/链接(无登录),V2 接账号 + 后端
- **midnight / kraft 底色**:types 里有,视觉上 V1 默认都走 ivory
- **小纸条不进 TabBar**:P2 #31 待定;当前从 ProfilePage 入口卡进
- **系统欢迎信**:isSystem=true,用户不可删(removeLetter 保护)
- **修过的坑**:useLetters 跨实例同步,CustomEvent 自身触发时直接 return,防 localStorage reload 覆盖新 state(2026-06-06)
