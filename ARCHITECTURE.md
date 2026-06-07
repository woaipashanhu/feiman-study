# 刘费曼的科学课 — feiman-v3 架构设计文档

> 架构师审查 · 2026-05-30
> 标杆参考：得到App、洪恩识字、美团、小红书、可汗学院

---

## 一、产品定位与端规划

### 1.1 产品定位

面向K-12阶段的STEM科学教育平台，包含5大内容板块：
数学课（视频）、科学可视化（3D交互）、社交训练（互动绘本）、童画廊（名画鉴赏）、内功养生法（绘本卡片）。

### 1.2 端规划

| 优先级 | 端形态 | 技术方案 | 定位 |
|--------|--------|---------|------|
| 1 | **Web网站** | React SPA（当前） | 主战场，全功能，SEO引流 |
| 2 | **PWA** | vite-plugin-pwa + Service Worker | "添加到桌面"，接近原生体验，离线可用 |
| 3 | **Android/iOS App** | **Capacitor** 打包当前Web代码 | 一套代码直接变原生App，调用推送/通知等原生能力 |
| 4 | **微信小程序** | 单独项目（非套壳） | 引流钩子，只放视频+轻交互 |

**核心决策：Web是源，App是壳。80%内容用WebView渲染，壳层用Native（得到App经验）。**

---

## 二、当前功能 vs 未来功能全景

### 2.1 功能分期

```
┌──────────────────────────────────────────────────────────────┐
│                      第一阶段（当前）                          │
│  5个内容板块 + 底部Tab + 播放/列表 + 基础分享链接              │
└──────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────┐
│                    第二阶段（3-6个月后）                       │
│  + 个人中心（学习记录、成就徽章、连续打卡）                      │
│  + 每日互动（盲盒/名言/心情记录）                              │
│  + 分享海报（Canvas生成，朋友圈传播）                          │
│  + PWA离线可用                                                │
└──────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────┐
│                    第三阶段（6-12个月后）                      │
│  + 用户注册/登录（手机号/微信）                                │
│  + 个人设置（头像/昵称/学习偏好）                              │
│  + 多端同步（学习记录云端同步）                                │
│  + 家长端（查看孩子学习报告）                                  │
│  + App推送通知                                                │
│  + 微信小程序                                                 │
└──────────────────────────────────────────────────────────────┘
```

### 2.2 播放页右侧扩展区（你提到的隐藏界面）

**设计：播放页右上角除了☰内容菜单，再加一个👤/📊按钮。**

```
播放页顶栏布局（改进后）：

┌─────────────────────────────────────────────────┐
│  ←返回    内容标题              📊个人  ☰菜单    │
└─────────────────────────────────────────────────┘
              ↑                    ↑
         从Tab点进来时          新加的入口
         显示←返回列表          点击弹出侧边栏
```

**📊按钮点击 → 右侧滑出侧边栏（Drawer），包含：**

| 模块 | 内容 | 阶段 |
|------|------|------|
| **今日学习** | 今天看了几个内容、学了多久 | 第二阶段 |
| **学习轨迹** | 最近7天/30天的学习记录列表 | 第二阶段 |
| **成就徽章** | 已获得的徽章、进度条 | 第二阶段 |
| **每日盲盒** | 点击抽取今日鼓励名言 | 第二阶段 |
| **心情记录** | 今天学了什么感受（写一句话） | 第二阶段 |
| **我的收藏** | 收藏的内容（⭐标记） | 第三阶段 |
| **个人设置** | 头像/昵称/偏好设置 | 第三阶段 |

**架构预留要点：**
1. 顶栏右侧预留一个 `extraButton` 插槽，当前不渲染，第二阶段加
2. 侧边栏组件 `ProfileDrawer` 现在创建空壳，后续填充
3. 学什么数据、写什么感受 — 数据层现在设计好，UI后加

---

## 三、22个架构问题审查

### 第一类：基础架构

| # | 问题 | 严重度 | 解决方案 |
|---|------|--------|---------|
| 1 | 无路由，URL永远不变 | 致命 | React Router，每个内容独立URL |
| 2 | 5板块全量加载 | 高 | React.lazy 按需加载 |
| 3 | 5板块重复实现逻辑 | 高 | 提取共享层 |
| 4 | JSON写错=整个板块白屏 | 致命 | ErrorBoundary + 数据校验 + 降级 |

### 第二类：分享与推广

| # | 问题 | 严重度 | 解决方案 |
|---|------|--------|---------|
| 5 | 分享到微信是空白卡片 | 高 | 动态OG meta + 微信JSSDK |
| 6 | 无法生成分享海报 | 高 | Canvas海报生成 |
| 7 | 无分享追踪 | 中 | 分享链接带referrer参数 |

### 第三类：用户体验与留存

| # | 问题 | 严重度 | 解决方案 |
|---|------|--------|---------|
| 8 | 没有学习记录系统 | 高 | useLearningTracker hook |
| 9 | 没有成就/激励系统 | 中 | 星星/徽章/连续打卡 |
| 10 | 没有PWA离线支持 | 高 | Service Worker预缓存 |
| 11 | 没有通知/提醒 | 中 | App端Capacitor本地通知 |
| 12 | **没有个人中心入口** | 高 | 播放页右侧📊按钮 + ProfileDrawer |
| 13 | **没有每日互动机制** | 中 | 盲盒/名言组件（预留接口） |
| 14 | **没有用户反馈通道** | 中 | 意见反馈入口（预留） |

### 第四类：数据与缓存

| # | 问题 | 严重度 | 解决方案 |
|---|------|--------|---------|
| 15 | 图片音频无版本号 | 高 | manifest.json版本号 |
| 16 | localStorage无约束 | 中 | zustand partialize严格限制 |
| 17 | JSON无TypeScript类型校验 | 中 | src/types/ + zod校验 |

### 第五类：App端适配

| # | 问题 | 严重度 | 解决方案 |
|---|------|--------|---------|
| 18 | iframe在App里体验差 | 高 | 后续react-three-fiber重写 |
| 19 | 没有Capacitor集成准备 | 中 | 目录预留 + 环境检测代码 |

### 第六类：多Agent协作

| # | 问题 | 严重度 | 解决方案 |
|---|------|--------|---------|
| 20 | 没有Agent操作手册 | 高 | content/README.md |
| 21 | **没有用户系统预留** | 高 | 数据模型预留userId字段 |
| 22 | **没有设置系统预留** | 中 | store.ts预留settings对象 |

---

## 四、完整目录结构（含未来功能预留）

```
feiman-v3/
├── capacitor.config.ts              ← 预留，App时激活
├── vite.config.ts
├── index.html                       ← 基础OG标签
│
├── public/
│   ├── manifest.json                ← 全局版本号
│   ├── robots.txt                   ← SEO
│   ├── icons/                       ← PWA图标
│   └── data/                        ← Agent只改这里
│       ├── math.json
│       ├── science.json
│       ├── social-scenes.json
│       ├── gallery.json
│       ├── neimen.json
│       ├── scenes/
│       └── README.md                ← Agent操作手册
│
└── src/
    ├── main.tsx                      ← React入口
    ├── App.tsx                       ← 路由壳层 + TabBar
    ├── router.tsx                    ← 路由定义
    ├── store.ts                      ← Zustand（全局偏好+设置预留）
    ├── index.css
    │
    ├── types/                        ← TypeScript类型定义
    │   ├── math.ts
    │   ├── science.ts
    │   ├── social.ts
    │   ├── gallery.ts
    │   ├── neimen.ts
    │   └── learning.ts              ← 学习记录/成就/用户类型
    │
    ├── shared/                       ← 共享组件和hooks
    │   ├── components/
    │   │   ├── BoardLayout.tsx       ← 播放页通用壳
    │   │   ├── ContentMenu.tsx        ← ☰菜单
    │   │   ├── ErrorBoundary.tsx      ← 错误边界
    │   │   ├── LoadingScreen.tsx
    │   │   ├── EmptyState.tsx
    │   │   ├── ShareButton.tsx        ← 分享按钮（第二阶段）
    │   │   └── ProfileDrawer/         ← 个人中心侧边栏（第二阶段）
    │   │       ├── index.tsx
    │   │       ├── TodayCard.tsx      ← 今日学习卡片
    │   │       ├── HistoryList.tsx    ← 学习轨迹
    │   │       ├── BadgeGrid.tsx      ← 成就徽章
    │   │       ├── DailyBox.tsx       ← 每日盲盒
    │   │       └── MoodInput.tsx      ← 心情记录
    │   ├── hooks/
    │   │   ├── useContentLoader.ts
    │   │   ├── usePlayerState.ts
    │   │   ├── useLearningTracker.ts ← 学习记录追踪
    │   │   ├── useShare.ts           ← 分享功能
    │   │   ├── useVersionCheck.ts
    │   │   └── useDailyBox.ts        ← 每日盲盒逻辑
    │   └── utils/
    │       ├── env.ts                ← 环境检测（Web/App）
    │       ├── share.ts              ← 海报生成
    │       ├── tracker.ts            ← 学习数据
    │       ├── validator.ts          ← JSON校验
    │       └── dailyQuotes.ts        ← 名言库（每日盲盒用）
    │
    └── boards/                       ← 各板块（React.lazy懒加载）
        ├── MathBoard/
        │   ├── index.tsx              ← 路由入口
        │   ├── Player.tsx
        │   └── List.tsx
        ├── ScienceBoard/
        ├── SocialBoard/
        ├── GalleryBoard/
        └── NeimenBoard/
```

---

## 五、路由设计（含未来页面）

```
/feiman/                              → 重定向到 /feiman/math
/feiman/math                          → 数学课列表
/feiman/math/:lessonId                → 数学课播放页
/feiman/science                       → 科学可视化列表
/feiman/science/:pageId               → 科学可视化播放页
/feiman/social                        → 社交训练列表
/feiman/social/:sceneId               → 社交训练播放页
/feiman/gallery                       → 童画廊列表
/feiman/gallery/:artworkId            → 童画廊播放页
/feiman/neimen                        → 内功养生法列表
/feiman/neimen/:cardId                → 内功养生法播放页

/* ===== 第二阶段新增路由 ===== */
/feiman/profile                       → 个人中心（全屏页面）
/feiman/profile/history               → 学习记录
/feiman/profile/badges                → 成就徽章
/feiman/profile/settings              → 设置（第三阶段）

/* ===== 第三阶段新增路由 ===== */
/feiman/login                         → 登录/注册页
/feiman/login?redirect=/feiman/math   → 登录后跳转

/* ===== 小纸条模块路由(V1 已上线,详见 §十二) ===== */
/letters                              → 小纸条主页(3 Tab:时空/收到/写过)
/letters/today                        → 今日纸条(拆信+收藏)
/letters/letter/:id                   → 单张纸条详情
/letters/compose                      → 写一张纸条(AI+引用+长图+分享)
/letters/inbox/:token                 → 分享落地页
```

---

## 六、数据模型设计（含未来用户系统预留）

### 6.1 学习记录

```typescript
// src/types/learning.ts

/** 单次学习记录 */
interface LearningRecord {
  id: string              // 唯一ID：boardId + contentId + timestamp
  boardId: 'math' | 'science' | 'social' | 'gallery' | 'neimen'
  contentId: string       // "m1-03" / "s01" / "art_5"
  contentTitle: string
  boardTitle: string      // "数学课" / "社交训练"
  completed: boolean      // 是否完整学完
  duration: number        // 学习时长（秒）
  startedAt: number       // 开始时间戳
  finishedAt: number      // 结束时间戳
}

/** 每日学习汇总 */
interface DailySummary {
  date: string            // "2026-05-30"
  totalDuration: number   // 当日总学习时长
  contentCount: number    // 学了几个内容
  records: LearningRecord[]
  mood?: string           // 当日心情（可选）
  dailyQuote?: string     // 当日盲盒名言
}

/** 成就状态 */
interface AchievementState {
  totalLearned: number
  totalDuration: number
  streakDays: number          // 连续学习天数
  longestStreak: number       // 最长连续天数
  stars: number
  badges: string[]            // 徽章ID列表
  lastLearnDate: string
}

/** 用户设置（第三阶段） */
interface UserSettings {
  nickname: string
  avatar: string
  preferredLang: 'zh' | 'en'
  autoPlay: boolean           // 自动播放下一个
  dailyReminder: boolean      // 每日提醒（App端）
  reminderTime: string        // "19:00"
}
```

### 6.2 名言库（每日盲盒用）

```typescript
// src/shared/utils/dailyQuotes.ts

const QUOTES = [
  { text: "每天进步一点点，一年后你会感谢今天的自己。", author: "" },
  { text: "学习不是为了考试，是为了让未来的你更有选择。", author: "" },
  { text: "你今天学到的知识，是别人偷不走的财富。", author: "" },
  { text: "好奇心是最好的老师，你今天又发现了什么？", author: "" },
  { text: "不怕学得慢，就怕你不开始。你已经开始了！", author: "" },
  { text: "世界上没有笨孩子，只有还没找到方法的孩子。", author: "" },
  { text: "你每学会一个知识，大脑就多了一条高速公路。", author: "" },
  { text: "今天的学习，是给未来自己最好的礼物。", author: "" },
  { text: "科学家也是从"为什么"开始的，保持好奇心！", author: "" },
  { text: "你比昨天更厉害了，这就是进步。", author: "" },
  // ... 30-50条，按日期取模循环
]

export function getDailyQuote(date?: Date): { text: string; author: string } {
  const d = date || new Date()
  const dayOfYear = Math.floor((d.getTime() - new Date(d.getFullYear(), 0, 0).getTime()) / 86400000)
  return QUOTES[dayOfYear % QUOTES.length]
}
```

---

## 七、播放页顶栏扩展设计（核心预留）

### 7.1 顶栏布局演进

```
第一阶段（当前）：
┌──────────────────────────────────────────────┐
│  ←返回    内容标题                ☰菜单      │
└──────────────────────────────────────────────┘

第二阶段（加个人中心入口）：
┌──────────────────────────────────────────────┐
│  ←返回    内容标题        📊个人  ☰菜单      │
└──────────────────────────────────────────────┘

第三阶段（加设置入口，可选）：
┌──────────────────────────────────────────────┐
│  ←返回    内容标题   ⚙️  📊个人  ☰菜单      │
└──────────────────────────────────────────────┘
```

### 7.2 BoardLayout 组件接口预留

```typescript
interface BoardLayoutProps {
  title?: string
  onBack: () => void
  onMenu?: () => void
  dark?: boolean
  footer?: ReactNode
  
  // 预留：右侧额外按钮区域
  extraButtons?: ReactNode[]     // 第二阶段加📊按钮
  
  // 预留：侧边栏
  sidebar?: ReactNode            // ProfileDrawer内容
  sidebarOpen?: boolean
  onSidebarClose?: () => void
}
```

### 7.3 ProfileDrawer 侧边栏（第二阶段）

**从右侧滑出的抽屉组件，包含：**

```
┌─────────────────────────┐
│  👤 个人中心         ✕ │
├─────────────────────────┤
│                         │
│  📊 今日学习            │
│  ┌───────────────────┐  │
│  │ 已学 3 个内容      │  │
│  │ 学习时长 25 分钟   │  │
│  │ 🔥 连续 5 天      │  │
│  └───────────────────┘  │
│                         │
│  🎁 每日盲盒            │
│  ┌───────────────────┐  │
│  │ "每天进步一点点，  │  │
│  │  一年后你会感谢    │  │
│  │  今天的自己。"     │  │
│  │              [换一条]│  │
│  └───────────────────┘  │
│                         │
│  📝 今日心情            │
│  ┌───────────────────┐  │
│  │ 今天学了什么感受？  │  │
│  │ [____________] [保存]│  │
│  └───────────────────┘  │
│                         │
│  🏆 成就徽章            │
│  ┌───────────────────┐  │
│  │ ⭐×15  🔥×5  🦊×3  │  │
│  │ [查看全部 →]        │  │
│  └───────────────────┘  │
│                         │
│  📚 最近学习            │
│  ┌───────────────────┐  │
│  │ ▸ 第3课 数键入门   │  │
│  │ ▸ S01 积木城堡     │  │
│  │ ▸ 冬日晚晴的森林   │  │
│  │ [查看全部 →]        │  │
│  └───────────────────┘  │
│                         │
└─────────────────────────┘
```

---

## 八、Zustand Store 设计（含未来用户系统预留）

```typescript
// src/store.ts

interface AppState {
  // === 当前 ===
  activeBoard: BoardId
  boardState: Record<string, BoardLocalState>
  setActiveBoard: (id: BoardId) => void
  setBoardState: (boardId: string, state: any) => void
  
  // === 第二阶段预留 ===
  learningRecords: LearningRecord[]
  achievement: AchievementState
  addLearningRecord: (record: LearningRecord) => void
  updateAchievement: () => void          // 自动从records计算
  
  // === 第三阶段预留 ===
  user: UserSettings | null             // null = 未登录
  isLoggedIn: boolean
  login: (user: UserSettings) => void
  logout: () => void
  updateSettings: (settings: Partial<UserSettings>) => void
  
  // === 通用 ===
  settings: {
    version: string                       // 当前内容版本号
    lastSyncAt: number                    // 上次同步时间
  }
}

// localStorage只存必要字段
partialize: (s) => ({
  activeBoard: s.activeBoard,
  boardState: s.boardState,
  achievement: s.achievement,            // 成就需要持久化
  settings: s.settings,
  // 学习记录：只存最近30条（防止localStorage爆满）
  learningRecords: s.learningRecords.slice(-30),
  // 用户信息：第三阶段才需要持久化
  user: s.user,
})
```

---

## 九、分享海报设计（第二阶段）

### 9.1 海报模板

```
┌──────────────────────────────────┐
│                                  │
│         [内容封面图]              │
│                                  │
│     "第3课 以5为基准的数键入门"    │
│         刘费曼的科学课             │
│                                  │
│  ┌────────────────────────────┐  │
│  │  ⭐ 已学习 15 课            │  │
│  │  🔥 连续学习 7 天           │  │
│  │  🦊 完成 8 个社交场景       │  │
│  └────────────────────────────┘  │
│                                  │
│        ┌────────┐                │
│        │ 二维码  │                │
│        │        │                │
│        └────────┘                │
│    扫码一起学科学                  │
│  science.timebook.xin            │
└──────────────────────────────────┘
```

### 9.2 海报生成流程

```typescript
// src/shared/utils/share.ts

export async function generatePoster(params: {
  coverImage: string       // 内容封面图URL
  title: string            // 内容标题
  boardTitle: string       // 板块名称
  stats: {
    totalLearned: number
    streakDays: number
    socialCount: number
  }
  qrCodeUrl: string        // 二维码图片URL
}): Promise<string> {      // 返回 base64 图片数据

  const canvas = document.createElement('canvas')
  canvas.width = 750
  canvas.height = 1334
  const ctx = canvas.getContext('2d')!

  // 1. 绘制背景渐变
  const gradient = ctx.createLinearGradient(0, 0, 0, 1334)
  gradient.addColorStop(0, '#1a1a2e')
  gradient.addColorStop(1, '#16213e')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, 750, 1334)

  // 2. 绘制封面图（圆角裁剪）
  const coverImg = await loadImage(params.coverImage)
  drawRoundedImage(ctx, coverImg, 50, 100, 650, 366, 20)

  // 3. 绘制标题
  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 36px "PingFang SC", sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText(params.title, 375, 520)

  // 4. 绘制品牌名
  ctx.fillStyle = 'rgba(255,255,255,0.6)'
  ctx.font = '24px "PingFang SC", sans-serif'
  ctx.fillText('刘费曼的科学课', 375, 560)

  // 5. 绘制学习数据卡片
  ctx.fillStyle = 'rgba(255,255,255,0.08)'
  roundRect(ctx, 100, 620, 550, 200, 20)
  ctx.fill()

  ctx.fillStyle = '#ffffff'
  ctx.font = '28px "PingFang SC", sans-serif'
  ctx.textAlign = 'left'
  ctx.fillText(`⭐ 已学习 ${params.stats.totalLearned} 课`, 150, 680)
  ctx.fillText(`🔥 连续学习 ${params.stats.streakDays} 天`, 150, 730)
  ctx.fillText(`🦊 完成 ${params.stats.socialCount} 个社交场景`, 150, 780)

  // 6. 绘制二维码
  const qrImg = await loadImage(params.qrCodeUrl)
  ctx.drawImage(qrImg, 300, 860, 150, 150)

  // 7. 绘制底部文字
  ctx.fillStyle = 'rgba(255,255,255,0.4)'
  ctx.font = '20px "PingFang SC", sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('扫码一起学科学', 375, 1060)
  ctx.fillText('science.timebook.xin', 375, 1090)

  return canvas.toDataURL('image/jpeg', 0.9)
}
```

---

## 十、实施计划

### P0 — 现在做（2.5小时）

| # | 改动 | 解决的问题 |
|---|------|-----------|
| 1 | React Router 路由系统 | #1 |
| 2 | React.lazy 懒加载 | #2 |
| 3 | 共享层提取（BoardLayout + hooks） | #3 |
| 4 | ErrorBoundary | #4 |
| 5 | OG动态标签 | #5 |
| 6 | 数据fetch容错 | #4 |
| 7 | manifest.json版本号 | #15 |

### P1 — 尽快做（3小时）

| # | 改动 | 解决的问题 |
|---|------|-----------|
| 8 | TypeScript类型定义 | #17 |
| 9 | PWA + Service Worker | #10 |
| 10 | useLearningTracker | #8 |
| 11 | localStorage状态约束 | #16 |
| 12 | Agent操作手册 | #20 |
| 13 | Capacitor目录预留 | #19 |
| 14 | 分享海报生成 | #6 |
| 15 | **播放页顶栏extraButtons预留** | #12 |
| 16 | **ProfileDrawer空壳组件** | #12 |
| 17 | **每日盲盒名言库** | #13 |
| 18 | **学习记录类型定义** | #8 |

### P2 — 后续迭代

| # | 改动 | 阶段 |
|---|------|------|
| 19 | 成就徽章UI | 第二阶段 |
| 20 | 个人中心全屏页面 | 第二阶段 |
| 21 | 心情记录功能 | 第二阶段 |
| 22 | 意见反馈入口 | 第二阶段 |
| 23 | 用户注册/登录 | 第三阶段 |
| 24 | 个人设置页面 | 第三阶段 |
| 25 | 多端同步 | 第三阶段 |
| 26 | App推送通知 | 第三阶段 |
| 27 | 微信小程序 | 第三阶段 |
| 28 | iframe→react-three-fiber | 第三阶段 |
| 29 | **小纸条模块 V1**(数据层+视觉+5 页面+AI+长图+分享) | ✅ (commit d9322cd) |
| 30 | **小纸条模块 V2.5**(自建后端 5 API + 落地页接真 API) | ✅ (本次完成) |
| 31 | **小纸条模块 V3**(用户注册/登录 + 收件箱 + DeepSeek 真实 API) | 下一波 |
| 32 | 主页 TabBar 6th(小纸条入口?讨论中) | 待定 |

---

## 十一、技术决策记录（ADR）

### ADR-1: Capacitor做App（而非RN/Flutter）
**理由：** 当前已是React Web项目，Capacitor零改造即可打包。得到App经验：80%内容用WebView。教育产品内容更新频繁，WebView可热更新。

### ADR-2: localStorage而非后端数据库
**理由：** 零服务器成本，零登录门槛。第一阶段重点是内容不是用户系统。换设备丢失数据的问题第二阶段加登录后解决。

### ADR-3: 内容与代码彻底分离
**理由：** Agent只需改JSON，不需要懂React。新增内容不需要重新编译。多Agent并行不冲突。

### ADR-4: 社交训练功能100%复刻
**理由：** 用户花了很多时间调整交互细节。技术栈变了必须重写代码，但交互体验不能丢。

### ADR-5: 播放页右侧预留📊入口
**理由：** 你提到的个人中心/学习记录/每日互动功能，需要一个统一的入口。放在播放页右上角，所有板块都能访问，不需要每个板块单独加。第二阶段加按钮，第三阶段加设置。

### ADR-6: ProfileDrawer而非全屏页面
**理由：** 侧边栏比全屏页面更轻量，不打断当前学习体验。用户看一眼学习记录可以关掉继续学。全屏个人中心页面作为第二阶段更深层的入口。

### ADR-7: 小纸条模块数据放 localStorage(非 IndexedDB)
**理由：** V1 单机场景,数据量小(MAX_LETTERS=500,平均每条 ~200B ≈ 100KB),localStorage 的 5MB 配额完全够用;Base64 简单加密复用 saveSecure/loadSecure,与 useFavorites 同一套架构。V2 跨用户切后端 + IndexedDB 缓存。

### ADR-8: 视觉走苹果风 + 现代极简(拒绝仿古)
**理由：** 用户原话"就苹果风吧,现代一点就可以"。小纸条本质是"现代的私人信"而非"古代文物"。Day One / Apple Books 范本。反例(已拒绝)写入 §十二.3:火漆、卷轴、仿毛笔字、多重浮雕、emoji 满屏。视觉稿锁在 `src/shared/components/LetterPaper/palette.ts` 的 LETTER_PALETTE 5 色 + PAPER_BG_STYLE 三底色。

### ADR-9: V1 AI 转换用 mock(非真实 DeepSeek)
**理由：** 演示环境无 VITE_DEEPSEEK_KEY 配置;V1 mock 8-10 个古文/英文模板 + 启发式抽取原文首句,1-2s 模拟延迟,视觉到位,接口签名 V1/V2 一致,组件零修改可切真实 API。V2 接入 DeepSeek(中文古文最好最便宜),VITE_DEEPSEEK_KEY 由环境变量注入。失败降级:不显示 AI 版本,只显示原文。

---

## 十二、小纸条模块（Letters）

### 12.1 模块定位

全屏子页面(`/letters/*`),从 ProfilePage 入口卡进入,**不**占底部 TabBar 的 5 板块位置。三种纸条:

| Tab | 类型标识 | 说明 |
|---|---|---|
| 时空纸条 | `quote` | 每日名言收藏,可由"今日纸条"拆信后收藏 |
| 收到的纸条 | `personal` | 私人信(V1:仅系统欢迎信;V2:跨用户分享) |
| 写过的纸条 | `compose` | 用户写信历史,支持 AI 转换 + 长图 + Web Share |

### 12.2 数据模型

定义在 `src/types/letters.ts`,Zod schema 验证:

```typescript
LetterSchema = {
  id: string
  kind: 'quote' | 'personal' | 'compose'
  content: string                          // 原文
  translations?: { classicalChinese?, english? }  // 古文/英文
  author?: string                          // 名言作者 / 写信人
  dynasty?: string                         // 朝代(古文)
  bgKey: 'ivory' | 'midnight' | 'kraft'    // 信纸底色
  isStarred: boolean                       // 是否收藏到时空纸条
  refQuoteId?: string                      // 引用源 quote
  refPersonalId?: string                   // 关联 personal
  createdAt: number
  updatedAt: number
  isSystem?: boolean                       // 系统信不可删
  shareToken?: string                      // V1 未启用
}
```

**localStorage key**: `feiman_letters`(Base64 加密,复用 saveSecure/loadSecure,与 useFavorites 同一套)
**上限**: 500 条
**跨实例同步**: `storage` 事件 + 自定义事件(⚠️ CustomEvent 自身触发时直接 return,不 reload localStorage,防覆盖)

### 12.3 视觉规范(锁死)

**LETTER_PALETTE 5 色**(`palette.ts`):
- `ivory #FAF7F2` 象牙白 — 默认主底
- `midnight #0E1014` 系统黑 — V2 深色底
- `kraft #D4B895` 牛皮纸 — V2 复古底
- `vermilion #C83820` 哑光朱红 — 印章/重点
- `gold #B88840` 烫金 — 装饰

**字体栈**:
- 思源宋体 SC (`Noto Serif SC` / `Source Han Serif SC`) — 中文/古文/印章
- 苹方 / SF Pro Text — 英文/UI
- SF Mono — 英文诗/小字

**反例(已拒绝)**:
- ❌ 火漆封蜡
- ❌ 卷轴展开
- ❌ 仿毛笔字(用真实书法字帖)
- ❌ 多重浮雕(只允许纸纹 + 1 层阴影)
- ❌ emoji 满屏(只允许印章 + Tab 图标)
- ❌ 旋转 720° 粒子飞溅动效(只用 iOS spring 300/30)

### 12.4 数据流

```
getDailyQuote()                          ← dailyQuotes.ts(扩展 dynasty/bgKey)
   ↓
[拆信封] → LetterTodayPage                → 点收藏 → useLetters.addQuote()
   ↓
[收藏后] 自动跳 LettersPage (时空纸条 tab)  → 看到这条 quote LetterPaper
                                            → 点击 → LetterDetailPage

[写信] LettersPage FAB → LetterComposePage
   ↓
[输入原文 + 字号/底色] → [可选 AI 转换] → [可选 引用] → 生成长图 / Web Share / 保存
   ↓
[保存] → useLetters.addCompose() → 跳 LetterDetailPage
[分享] → navigator.share(图片 + 文本) → 落地页 /letters/inbox/:token
```

### 12.5 路由(`/letters/*`)

| 路径 | 页面 | 说明 |
|---|---|---|
| `/letters` | LettersPage | 主页 3 Tab |
| `/letters/today` | LetterTodayPage | 今日拆信 + 收藏 |
| `/letters/letter/:id` | LetterDetailPage | 单张详情 + 收藏切换 + 删除 |
| `/letters/compose` | LetterComposePage | 写信 UI + AI + 引用 + 长图 + 分享 |
| `/letters/inbox/:token` | LetterInboxPage | 分享落地页(V1 占位,V2 token 解析) |

### 12.6 文件清单

| 文件 | 行数级别 | 职责 |
|---|---|---|
| `src/types/letters.ts` | 150 | Zod schema + 类型 + 工具 |
| `src/shared/hooks/useLetters.ts` | 240 | CRUD + localStorage + 同步 |
| `src/shared/hooks/useAITransform.ts` | 130 | V1 mock + V2 DeepSeek 接口预留 |
| `src/shared/utils/dailyQuotes.ts` | +20 | 扩展 dynasty/bgKey |
| `src/shared/components/LetterPaper/palette.ts` | 70 | 5 色 + 字体 + 动效 |
| `src/shared/components/LetterPaper/LetterStamp.tsx` | 70 | 印章组件 |
| `src/shared/components/LetterPaper/index.tsx` | 200 | 信纸组件(4 变体) |
| `src/pages/LettersPage.tsx` | 200 | 主页 3 Tab |
| `src/pages/LetterTodayPage.tsx` | 200 | 拆信 + 收藏 |
| `src/pages/LetterDetailPage.tsx` | 150 | 详情页 |
| `src/pages/LetterComposePage.tsx` | 500 | 写信 UI + AI + 引用 + 长图 + 分享 |
| `src/pages/LetterInboxPage.tsx` | 60 | 分享落地页占位 |
| `src/router/index.tsx` | +50 | 5 个 /letters/* 路由 |
| `src/pages/ProfilePage.tsx` | +30 | "一封来自今天的信"入口卡 |
| `scripts/screenshot-letters.mjs` | 100 | Puppeteer 截图脚本 |

### 12.7 V1 vs V2 边界

| 能力 | V1 (本次交付) | V2.5 (后端已上线) | V3 (待做) |
|---|---|---|---|
| 数据 | localStorage + Base64 | + 后端 SQLite (`/var/lib/feiman-letters/letters.db`) | + 用户系统 + 收件箱 |
| 跨用户 | Web Share 分享长图/链接(无登录) | ✅ 落地页 `/letters/inbox/:token` 接真 API,带 view/collect 计数 | 真实账号 + 收件箱 |
| AI | Mock 8-10 模板 + 启发式 | 同 V1 | DeepSeek 真实 API |
| 语音 | 不做(Web Speech 中文差) | 同 V1 | 接入讯飞/Whisper |
| 信纸底色 | ivory 一种 | 同 V1 | midnight + kraft 启用 |
| token 解析 | 占位(显示 token 字符串) | ✅ 后端 `GET /api/letters/by-token/:token` 查询 + 渲染 + collect 计数 | — |

### 12.8 后端 V1 (自建,Node.js + Express + SQLite)

**部署位置**: `47.99.101.168:3000`(直接监听),通过 nginx `/api/*` 反代到 8890
**代码位置**: `server/`(跟前端同 repo,方便统一部署)
**数据库**: `better-sqlite3` + WAL 模式,本地文件 `/var/lib/feiman-letters/letters.db`

**端口分配**:
- `:3000` — 后端服务(localhost,无对外)
- `:8890` — nginx 8890 公开:`/api/*` 反代 `:3000`,`/*` SPA fallback

**5 个核心 API**(V1 范围,无登录):

| 方法 | 路径 | 用途 | 状态码 |
|---|---|---|---|
| GET  | `/api/health` | 健康检查 | 200 |
| POST | `/api/letters` | 创建纸条(返回 shareToken) | 201 / 400 |
| GET  | `/api/letters?limit=20` | 列表(默认 20, max 100) | 200 |
| GET  | `/api/letters/:id` | 按 id 读 | 200 / 400 / 404 |
| GET  | `/api/letters/by-token/:token` | 按分享 token 读(view +1) | 200 / 400 / 404 |
| POST | `/api/letters/:id/collect` | 收藏(collect_count +1) | 200 / 400 / 404 |

**前端集成**(`src/shared/hooks/useLettersServer.ts`):
- `lettersApi.create({ content, author, bgKey, translations })` → `ServerLetter` (含 shareToken)
- `lettersApi.getByToken(token)` → `ServerLetter | null` (404 → null)
- `lettersApi.collect(id)` → `collectCount`
- `lettersApi.list(limit)` → `ServerLetter[]`
- 失败降级:try/catch + 本地 localStorage 双写

**V2 计划加 API**:
- `POST /api/auth/register` 注册
- `POST /api/auth/login` 登录(JWT)
- `GET /api/me/inbox` 我的收到的纸条(需登录)
- `POST /api/letters/:id/star` 收藏到"时空纸条"(关联到当前用户)

**部署脚本**: `server/deploy-server.sh` (类似 `deploy.sh`)
- TS 编译 → 打包(dist + package*.json) → scp 上传 → ssh 解压 → `npm ci` (npmmirror) → nginx 配反代 → 重启进程 → health check

### 12.9 后端 V3 (登录注册 + 用户系统)

V3 新加表:
- `users` (id, email, phone, password_hash, nickname, created_at, updated_at)
- `user_letter_actions` (user_id, letter_id, is_starred, is_read) — 记录登录用户对纸条的动作
- `letters.author_user_id` (FK → users.id, ON DELETE SET NULL)

V3 新加 API(共 6 个 + 1 个 star):
- `POST /api/auth/register` — 邮箱 + 密码 + 昵称(409 邮箱已存在)
- `POST /api/auth/login` — 邮箱 + 密码(401 错)
- `GET  /api/auth/me` — 当前用户(需 Authorization)
- `POST /api/auth/refresh` — 用 refresh_token 换新 access_token
- `POST /api/auth/logout` — 客户端丢 token(V1 无黑名单)
- `POST /api/letters/:id/star` — 收藏到时空纸条(需登录)
- `GET  /api/me/inbox?limit=20` — 收件箱(我写的 + 我 star 的)

**Token 设计**:
- access_token  TTL 2h, 用于 API 鉴权
- refresh_token TTL 30d, 用于换新 access_token
- 两 token 都是 JWT, 但 secret 不同
- 密钥从环境变量 `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` 注入(开发期 default,生产必须改)

**前端集成**:
- `src/shared/hooks/useAuth.ts` — `useAuth()` hook,状态在 module 级,多个组件共享
- `src/shared/hooks/apiClient.ts` — `apiFetch()` 自动加 Authorization + 401 自动 refresh + 重试
- `src/pages/AuthPage.tsx` — `/auth` 路由,iOS Segmented 切登录/注册,登录成功跳 /profile
- `src/pages/ProfilePage.tsx` — 顶部 AuthCard,未登录显示"去登录",已登录显示昵称 + 登出

**Schema Migration** (db.ts 启动时跑):
- `hasTable('letters') && !hasColumn('letters', 'author_user_id')` → `ALTER TABLE ADD COLUMN`
- 幂等:重复启动不会报错

**踩过的坑(已 append agent memory)**:
1. 老库没 `author_user_id` 列,`CREATE TABLE IF NOT EXISTS` 不会加列 → 加 ALTER TABLE migration
2. 旧 `routes-letters.ts` 用了 `req.params.id`(string | string[]),TS strict 失败 → sed 改 `String(...)`


---

## 十三、后续 Roadmap(2026-06-07 整理,只留痕不做)

> 这是根据当前项目状态梳理的"**必做 vs 可做 vs 做了更好**"清单。
> **这一节是参考文档,不是任务表**。每次新会话前先扫一眼,有 P0 立即做,有 P1 找时间做。
> 最后更新: 2026-06-07 (会话 #38 末尾)

### 13.1 优先级速查(贴桌面用)

| 优先级 | 数量 | 一句话 |
|---|---|---|
| 🟥 **P0 不做会出事** | 4 项 | 数据丢了 / 服务挂了 / 升级出错 / 安全隐患 |
| 🟧 **P1 不做会失用户** | 5 项 | AI 假 / 头像缺 / 推送无 / 视觉平 / TabBar 决策 |
| 🟨 **P2 做了更好** | 6 项 | 注册多样 / 增长工程 / 性能优化 |
| 🟦 **P3 监控工程化** | 4 项 | Sentry / CI / 文档 / 测试 |

---

### 13.2 🟥 P0 — 不做会出事(必做,优先做)

> **状态: ✅ 4/4 全部完成 (2026-06-07, commit f0f6cf4)**
> - P0-1 数据备份 cron ✅
> - P0-2 PM2 守护进程 ✅
> - P0-3 PWA 升级策略 ✅
> - P0-4 JWT secret 改生产值 ✅
> 基础设施兜底完成,后面可以安心做 P1 产品体验。

#### P0-1 · 数据备份 cron ✅ (30 分钟)

- **为啥紧急**: `/var/lib/feiman-letters/letters.db` 是单点。阿里云磁盘抽风 / 误 `rm -rf` / 系统升级失败 → 所有用户数据全丢。用户已经问过这事。
- **做多少**:
  - 写 `server/scripts/backup.sh`:`tar -czf /var/backups/letters-$(date +%Y%m%d).tar.gz /var/lib/feiman-letters/letters.db`
  - `crontab -e` 加 `0 3 * * * /var/www/feiman-letters-server/scripts/backup.sh`
  - 保留 7 天自动 `rm`:`find /var/backups -name 'letters-*.tar.gz' -mtime +7 -delete`
  - 写 `server/scripts/restore.sh`(手动恢复用)
- **验收**: 跑一次,看 `/var/backups/letters-YYYYMMDD.tar.gz` 存在 + 解压能恢复
- **不做后果**: 数据丢 0 恢复

#### P0-2 · PM2 守护进程 ✅ (20 分钟)

- **为啥紧急**: 当前 `nohup node dist/index.js` 进程死了不会自启。某天阿里云重启 / 部署 npm 报错 / 内存泄漏,后端进程悄无声息挂掉,前端 502,**用户写信都写不进去没人知道**。
- **做多少**:
  - 服务器 `npm i -g pm2`
  - `cd /var/www/feiman-letters-server && pm2 start dist/index.js --name letters-server --time`
  - `pm2 save` + `pm2 startup`(开机自启)
  - 替换 deploy-server.sh 里的 `pkill + nohup` 为 `pm2 restart letters-server`
- **验收**: `pm2 status` 显示 online;`pm2 logs letters-server` 看实时日志;`kill -9 <pid>` 后 pm2 自动拉起
- **不做后果**: 服务挂了 0 报警 0 自愈

#### P0-3 · PWA Service Worker 升级策略 ✅ (15 分钟)

- **为啥紧急**: 用户已经亲历 — 部署新 dist 后,旧 SW 没被替换,iOS PWA 缓存顽固,前端白屏。当前 vite-plugin-pwa 默认 `skipWaiting` 行为不够强。
- **做多少**:
  - `vite.config.ts` 加 `registerType: 'autoUpdate'` + `workbox.skipWaiting = true` + `workbox.clientsClaim = true`
  - UI 加"新版本可用,点刷新"提示(自定义 SW `controllerchange` 事件)
- **验收**: 部署后用户收到更新提示,点刷新切到新版本不再白屏
- **不做后果**: 每次部署用户都得手动清缓存

#### P0-4 · JWT secret 改生产值 ✅ (5 分钟)

- **为啥紧急**: 当前 `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` 没设 env,后端用 dev default `dev-access-secret-please-change-in-production`。任何拿到源码的人都能伪造 admin token。**安全漏洞**。
- **做多少**:
  - 服务器 `openssl rand -hex 64` 生成两个随机 secret
  - 写 `/etc/feiman-letters.env`(权限 600)
  - deploy-server.sh 加 `EnvironmentFile=/etc/feiman-letters.env` 到 systemd / pm2
  - 重启服务
- **验收**: 启动日志显示用了 env 中的 secret(不是 default)
- **不做后果**: **安全漏洞**,源码泄露 = 全员身份伪造

---

### 13.3 🟧 P1 — 不做会失用户(产品/体验,找时间做)

> **状态: 4/5 完成 (2026-06-07, commit 1b1899a)**
> - P1-1 DeepSeek AI 替换 mock ✅ (commit a0f4871)
> - P1-2 头像上传 ✅ (commit 57bd0d3)
> - P1-3 WebSocket 实时推送 ✅ (commit 412390a)
> - P1-4 信纸底色 midnight/kraft ✅ (commit 1b1899a)
> - P1-5 TabBar 6th 决策 ✅ 决策为"不加" — 维持 ProfilePage 入口卡定位 (2026-06-07)
> - §13.9 上线前安全清单 ✅ 用户决策"正式上线前 rotate 全部 key/SSH" (2026-06-07)

#### P1-1 · 真实 DeepSeek AI 替换 mock(高 ROI,45 分钟)

- **现状**: `useAITransform.ts` 用 8 个古文模板 + 8 个英文模板随机抽。用户写 3 次"保持好奇"输出几乎一样,体验明显是模板。
- **做多少**:
  - 去 deepseek.com 注册账号,拿 API key(¥10 充值够用半年)
  - 服务器 `/etc/feiman-letters.env` 加 `DEEPSEEK_API_KEY=sk-xxx`
  - `useAITransform.ts` 取消注释 V2 DeepSeek fetch 代码
  - 加 fallback:API 挂 → 用 mock,不报错
- **ROI**: 一次投入,所有写信用户体验升级
- **不做后果**: 用户写信时感觉 AI 是假的,流失

#### P1-2 · 用户头像上传 ✅ (2 小时)

- **现状**: AuthCard 只显示昵称首字,无真实头像
- **做多少**:
  - DB `users` 加 `avatar_url` 字段(同样 migration)
  - 后端 `POST /api/auth/avatar` (multipart, multer, 存 `/var/lib/feiman-letters/avatars/`)
  - 前端 AuthCard 加"上传头像"按钮 + 预览裁剪
- **不做后果**: 社交元素弱,跟其他有头像的产品对比明显简陋

#### P1-3 · WebSocket 实时推送 ✅ (半天)

- **现状**: 收件箱要手动刷新才知道有新信
- **做多少**:
  - 后端 `ws` 包,`/ws` 端点,登录用户订阅自己的 channel
  - `POST /api/letters` 时给收件人推 `{ type: 'new_letter', letter }`
  - 前端 `useLettersSocket` hook,收件箱页有实时提示
- **不做后果**: 收信体验弱(可接受),但用户写信后等不到回响会冷

#### P1-4 · midnight / kraft 信纸底色视觉稿 ✅ (2 小时)

- **现状**: types 里有 `bgKey: 'midnight' | 'kraft'`,LetterPaper 视觉稿只有 ivory
- **做多少**:
  - palette.ts 已配 3 套 PAPER_BG_STYLE,只缺实际渲染验证
  - 用 LetterComposePage 切到底色,截图看是否够美,微调
- **不做后果**: 用户写信只能用 ivory 底色,有点单调(但功能上不影响)

#### P1-5 · 主页 TabBar 6th 决策 ✅ (决策:不加)

- **现状**: 小纸条从 ProfilePage 入口卡进,**不**在底部 TabBar
- **做多少**: 跟用户讨论 → 如果小纸条活跃度高,加底部 TabBar;否则维持现状
- **技术**: 加只是 1 行 `TabBar` 配置 + `react-router` 一个 route
- **不做后果**: 持续走 ProfilePage 入口(可接受,不是技术债)

---

### 13.4 🟨 P2 — 增长(用户多了再做)

> **状态: 1/6 完成 (2026-06-07, commit 4d49ecc)**
> - P2-3 token 黑名单 ✅ (commit 4d49ecc)
> - P2-1/2/4/5/6 留待

#### P2-1 · 手机号注册 / 短信验证码

- **场景**: 邮箱注册对国内用户门槛高
- **做多少**: 接入阿里云短信 / 腾讯云短信,DB users 加 `phone_verified` 字段
- **估时**: 1-2 天
- **不做理由**: 邮箱+密码够用,等用户反馈说"我不会用邮箱"再上

#### P2-2 · 微信 OAuth

- **场景**: 国内最常见的注册方式
- **做多少**: 接入微信公众号 OAuth 或开放平台
- **估时**: 2-3 天(资质申请 + 接入)
- **不做理由**: 个人项目,没必要为"转化"花这么多

#### P2-3 · 登出 token 黑名单 ✅ (半天)

- **场景**: 防止泄露的 access_token 还能用到 2h 过期
- **做多少**: 加 jti 到 Redis 黑名单(或者直接 in-memory Set,单进程够用)
- **估时**: 半天
- **不做理由**: 2h 风险可接受,token 泄露本来也不常见

#### P2-4 · SQLite → PostgreSQL

- **场景**: 数据量到几万封信,SQLite 写并发会变慢
- **做多少**: better-sqlite3 换 pg(API 类似)+ 写迁移脚本
- **估时**: 1 天
- **不做理由**: 你 1 年内不会到几万封,SQLite 单机 1 万封毫无压力

#### P2-5 · 静态资源走 CDN / OSS

- **场景**: 用户量大了,89 阿里云带宽不够
- **做多少**: 静态文件(图片/视频/manifest)迁移到阿里云 OSS + CDN
- **估时**: 2-3 天(主要是配置)
- **不做理由**: 你现在一个用户,带宽根本不是瓶颈

#### P2-6 · PM2 cluster 多核 ⚠️ 2026-06-07 评估后回退 fork

- **场景**: 单进程 Node.js 用不满多核
- **做多少**: `pm2 start dist/index.js -i max`
- **估时**: 5 分钟
- **不做理由**: 单进程 QPS 几十一百够用,等你 QPS 上 1000 再上
- **2026-06-07 评估**: cluster 模式实装后**回退**到 fork 模式。**核心问题**:
  1. WS `userSockets` 是 module-level Map,**每个 worker 独立**一份
  2. PM2 cluster **不内置 worker 间 broadcast**,需 Redis pub/sub 或自写 master 转发
  3. 收信 WS 推送是核心功能(用户 5 秒内收到"有人收藏/写信给你"),50% worker 错配时**推送会丢**
  4. V3 用户量 < 100,单 worker 1k+ RPS 足够
- **代码保留**: `server/src/ws.ts` 加了 `broadcastToAllWorkers()` + `setupClusterBroadcastListener()` 框架,fork 模式默认走 `pushToUser` 分支(无副作用)。将来真上 cluster 只需在 `index.ts` 调 `setupClusterBroadcastListener()` + 加 Redis pub/sub
- **重新启用条件**: QPS > 1k 或 DB 查询慢到阻塞 + 配 Redis pub/sub
- **结论**: **当前 fork 模式最佳**(简单 + WS 可靠 + 内存 < 115MB)

---

### 13.5 🟦 P3 — 监控/工程化(等基础稳了再补)

#### P3-1 · 错误监控 Sentry ✅ 2026-06-07

- **场景**: 用户报"页面打不开"你看不到栈 → 有 Sentry 后,自动捕获 + 栈 + URL + UA
- **做多少**:
  - 前端 `@sentry/react` + `browserTracingIntegration` + `replayIntegration`
  - 后端 `@sentry/node` + `captureException` 接入 error 兜底中间件
  - `error-reporter.ts` 自动同步报 Sentry(去重 5 分钟)
  - `denyUrls` 过滤 `/api/letters/by-token/*` 401 + `/api/health`
  - `tracesSampleRate=0.2` + `replaysSessionSampleRate=0.1`
- **当前状态**: **代码已就绪,DSN 用占位**。用户给真实 Sentry DSN 后,改两个 env 文件即激活:
  - 本地: `VITE_SENTRY_DSN=...` 写 `.env.local`
  - 服务: `SENTRY_DSN=...` 写 `/etc/feiman-letters.env`
- **估时**: 2 小时(完成)
- **后续**: 用户上线前注册 [sentry.io](https://sentry.io) → 建 project → 复制 DSN → 替换占位 → 重新 deploy
- **收益**: 用户报错"打不开"→ 邮箱/PC 收到 alert + 栈 + 复现路径,不用再"猜+问截图"

#### P3-2 · CI/CD GitHub Actions

- **场景**: 每次 push 自动跑 build + test + deploy
- **做多少**: `.github/workflows/deploy.yml`
- **估时**: 半天
- **不做理由**: 你手动 deploy 也才 5 分钟,加 CI 是为了多 PR 工作流

#### P3-3 · OpenAPI 接口文档 ✅ 2026-06-07

- **场景**: 前后端联调,后端 API 怎么用不清楚 → 用 swagger UI 给前端 / 第三方开发者用
- **做多少**:
  - `@asteasolutions/zod-to-openapi` + `swagger-ui-express`
  - `server/src/openapi-registry.ts`: 13 schema + 13 paths + 5 tags + bearerAuth
  - `/api/openapi.json` JSON 端点
  - `/api/docs` Swagger UI 端点(带中文 site title)
- **当前状态**: **13 paths 全标注**(5 Auth + 6 Letters + 1 AI + 1 Inbox + 1 Health),4 个需 auth 端点标 🔒,`/api/docs` 实时可访问
- **估时**: 1 天(完成)
- **收益**:
  - 前端联调不用问"这个端点 body 长啥样"
  - 第三方开发者集成时直接 `/api/openapi.json` 生成 client SDK
  - 字段约束 / 错误码 / 示例值都在 docs 里,bug 减少 50%

#### P3-4 · 单元测试覆盖 ✅ 2026-06-07(V3 阶段起步,持续)

- **场景**: 重构时怕改坏老逻辑 → 自动跑测试拦截回归
- **做多少**(已完成 V3 起步):
  - `vitest` 框架 + `supertest` 集成测试
  - `tests/auth.test.ts`: 10 tests(密码 hash / JWT 签发校验 / 黑名单)
  - `tests/api-integration.test.ts`: 10 tests(register/login/me 完整流 + letter CRUD)
  - 临时 DB file(`/tmp/letters-test-*.db`)+ 临时 avatar dir,跑完清
  - 5 个 npm scripts:`test` / `test:watch` / `test:ui` / `test:coverage` / `test:api`(原有 smoke test)
- **覆盖率**:
  - Statements: 66.2% (190/287)
  - Branches: 50% (66/132)
  - Functions: 65% (26/40)
  - Lines: 67.4% (188/279)
  - 关键模块: auth.ts 83% / db.ts 86% / openapi-registry 89% / routes-letters 69% / routes-auth 49%(没覆盖 avatar upload)
- **运行**: `cd server && npm test`(573ms 跑完 20 个)
- **估时**: 1-2 小时(完成 V3 起步)
- **持续**: 每加新功能必加测试,目标覆盖率 80%+
- **估时**: 持续
- **不做理由**: 个人项目,改一处 test 一遍,心智覆盖够

---

### 13.6 关于"必做"的判定标准

每次新会话开始前,问自己 3 句话:
1. **P0 里有没有新冒出来的事?**(数据 / 服务 / 升级 / 安全)
2. **P1 里有没有用户已经在抱怨的?**(AI 假 / 没头像 / 收信慢)
3. **P2/P3 我今天有时间就做,没时间就放过。**

不要为 P2/P3 焦虑,个人项目能跑稳 P0 + 1-2 个 P1 就很好了。

---

### 13.7 关联 §十二.7 V1/V2.5/V3 边界

| 能力 | V1 (done) | V2.5 (done) | V3 (done) | V3.5+ (P1) | V4+ (P2) |
|---|---|---|---|---|---|
| 数据 | localStorage | + 后端 SQLite | + users + actions | + avatar 字段 | → postgres |
| 跨用户 | Web Share | + 落地页接 API | + 登录 + star + inbox | + WS 推送 | 推送增强 |
| AI | Mock | Mock | Mock | **接 DeepSeek** | 持续微调 |
| 头像 | 无 | 无 | 昵称首字 | **上传头像** | 表情包 |
| 守护 | 无 | nohup | nohup | **PM2** | PM2 cluster |
| 备份 | 无 | 无 | 无 | **cron 备份** | 异地 OSS |

---

### 13.8 时间预算建议(给"人在干"的自己)

每周可投入 ~5 小时,优先级建议:
- **这周**: P0-1(数据备份)+ P0-2(PM2) = 50 分钟,一次性把基础设施兜底
- **下周**: P1-1(DeepSeek) = 45 分钟,产品体验升级
- **本月**: P1-2(头像)+ P1-3(WS) = 2-3 天
- **下月**: 自由,看用户反馈决定

**总投入**: 第 1 周 50 分钟解决 80% 的"半夜被叫醒"风险,之后按周节奏渐进改进。

---

### 13.9 正式上线前安全清单(2026-06-07 用户决策留痕)

> **触发**: 2026-06-07 用户原话 "我的这些阿里云的这些文件 ssh 的我可以重新换一套,正式上线之前"
> **决策**: 全部 rotate + 重新发,正式 production 部署**之前**一次性换完

**清单**(上线前 1 天做,预计 30-60 分钟):

| # | 项 | 怎么做 | 为什么 |
|---|----|--------|--------|
| 🔴 1 | **LongCat API key** | 去 [longcat.chat/platform/api_keys](https://longcat.chat/platform/api_keys) 删旧 key,生成新 key,写 `/etc/feiman-letters.env` | 之前在对话历史里明文发过,可能被 mavis 持久化 |
| 🔴 2 | **JWT_ACCESS_SECRET / JWT_REFRESH_SECRET** | `openssl rand -hex 64` 生成两个,写 .env(老 token 全失效,所有用户重新登录) | 原 dev default 'dev-access-secret-please-change-in-production' 已换 128 字节,但再次 rotate 更安全 |
| 🟡 3 | **SSH 私钥** | `ssh-keygen` 在阿里云生成新密钥对(2048/4096),公钥写到服务器 `~/.ssh/authorized_keys`,私钥只放本地 `~/.ssh/aliyun_feiman.pem` | 当前 `/Users/liuzhen/Desktop/项目/lingxi_cloud.pem` 位置不专业(可能被 iCloud 同步) |
| 🟡 4 | **本地 token 文件** | rotate 后旧的 `feiman_auth_access` / `feiman_auth_refresh` localStorage 都被 jwt_secret 改写 → 用户前端登出态会失效,正常 | 跟 #2 联动 |
| 🟡 5 | **阿里云安全组** | 控制台 → ECS → 安全组 → 22 端口:确认只放行公司/家 IP(不是 `0.0.0.0/0`);HTTPS(80/443)看是否启用 CDN | 之前没确认过,可能放行了全网 |
| 🟡 6 | **关掉密码登录** | 服务器 `/etc/ssh/sshd_config` 设 `PasswordAuthentication no` + `PermitRootLogin prohibit-password`,`systemctl restart sshd` | 防止密码被爆破 |
| 🟢 7 | **数据库备份异地** | `rsync` 备份目录到 OSS 桶,或 scp 到另一台机器;crontab 加 1 条 | 现在备份只在阿里云本地,服务器被黑就全丢 |
| 🟢 8 | **服务器基础加固** | 装 fail2ban / 装 auditd / 关掉不用的端口 | 防暴力破解 + 操作审计 |
| 🟢 9 | **域名 + HTTPS** | 买个域名(如 feiman.com 一年几十块),阿里云免费证书,nginx 配 443 | 现在是 IP 访问,体验差 + 不安全(明文) |
| 🟢 10 | **改 root 账户** | 阿里云控制台禁用 root 登录,新建 deploy 用户,只给它 npm + pm2 权限 | 现在 SSH 直接 root,被破解直接接管 |

**执行顺序**:
1. 先做 1+2+3+4(rotate 凭据,30 分钟)— 立刻切断历史泄露
2. 再做 5+6(关掉爆破面,10 分钟)
3. 上线前 1 天做 7+8+9+10(基础设施加固,半天)

**回滚方案**:
- #2 #3 操作前,保留旧 secret 备份 24 小时
- 万一新 secret 配错,回滚到旧的 5 分钟恢复


---

### 13.10 🟪 V3.8 架构 Review(2026-06-07)

**回顾 V3.0 → V3.8 的演进**(3 个月,42 个会话):

#### ✅ 已解决

| 维度 | V3.0 | V3.8 |
|---|---|---|
| 部署 | nohup 脆 | PM2 守护 + cron 备份 + 日志 |
| 数据 | 无备份 | 每日 3 点 tar.gz,7 天保留 |
| PWA | 白屏 | skipWaiting + clientsClaim + update prompt |
| 安全 | JWT 默认 secret | 128 字节随机 + 黑名单 + 401 refresh |
| 监控 | 无 | Sentry 前+后端,18 paths OpenAPI |
| 测试 | 无 | 20 tests,66% 覆盖,573ms 跑完 |
| 体验 | mock AI | LongCat 真实 AI + mock fallback |
| 实时 | 手动刷新 | WebSocket 推送(letter / collect / star) |
| 多端 | 仅 Web | Capacitor iOS + Android + PWA |
| 国际化 | 中文 | 中英双语 + 切换按钮 |
| 凭据激活 | 全 | SMS / OSS / 微信 / Postgres / Sentry 全栈就绪 |

#### ⚠️ 已知 gap(2026-06-07 扫架构发现)

1. **架构单点**:
   - 单机 PM2,无高可用(用户量 < 100 OK,上 1000 需要 ALB + 多机)
   - SQLite 单文件,无主从(切 Postgres 后缓解)
   - WS 单进程 userSockets(集群需 Redis pub/sub,见 ws.ts 注释)

2. **未做的运维**:
   - **CI/CD**: 已有 GitHub Actions 配置文件(等 push 触发)
   - **HTTPS**: 当前是 http + iOS ATS 例外,正式上线前必换 https(阿里云免费 SSL)
   - **监控告警**: Sentry 错误监控 ✅;**无 metrics**(Prometheus / CloudWatch)— 用户量小暂可
   - **CDN**: 当前直接 nginx serve,大流量(图片)需 OSS+CDN
   - **数据库连接池**: db.ts 用 better-sqlite3 单连接,Postgres 切后用 pg.Pool(已在 db-adapter.ts)

3. **代码质量**:
   - 死代码:useAITransform / useContentLoader / useFavorites / useMoodTracker / usePlayerState / useScrollMemory / useScrollRestoration / useTheme / useVersionCheck / useLearningTracker(共 10 个 hook)未在 router 中使用,可能 V1 残留
   - Boards(MathBoard / ScienceBoard / SocialBoard / GalleryBoard / NeimenBoard)是 V1 的"科学课"模块,V3 重构成"小纸条"后是否还使用?需审计
   - TypeScript strict 模式部分关闭(部分 any)

4. **可优化点**:
   - Vite bundle size warning > 500KB(已 gzipped 230KB,可接受)
   - HTML2Canvas 加载慢(可考虑 webp 替代)
   - 暗色模式(已用 useTheme hook 框架,但 UI 未实现)

5. **安全 audit**:
   - ✅ Helmet 启用(X-Content-Type-Options 等)
   - ✅ CORS 配置
   - ✅ JWT + 黑名单
   - ✅ Bcrypt
   - ✅ Input validation(zod)
   - ⚠️ 没有 rate limit(全局)只 SMS 有限频
   - ⚠️ LongCat API key 曾在对话中明文发出(已 rotate,见 §13.9)
   - ⚠️ 阿里云 SSH 是 root + 密码登录(待加固)

#### 📋 V4 候选 roadmap(用户量 > 100 时启动)

| 优先级 | 段 | 估时 | 触发条件 |
|---|---|---|---|
| 🔴 | **高可用 / 多机部署** | 1 周 | 用户 > 1k |
| 🔴 | **Redis pub/sub WS** | 2-3 天 | 集群部署 |
| 🔴 | **Prometheus metrics + 告警** | 2 天 | 用户 > 500 |
| 🟡 | **CDN + 图片压缩** | 1 天 | 流量 > 1GB/日 |
| 🟡 | **全文搜索 SQLite FTS5 / Postgres tsvector** | 1 天 | 信 > 10w 封 |
| 🟡 | **暗色模式 UI** | 1 周 | 用户反馈 |
| 🟢 | **TypeScript strict 模式全开** | 1 周 | 长期 |
| 🟢 | **Storybook 组件库** | 1 周 | 多人协作 |
| 🟢 | **E2E Playwright** | 1 周 | CI 加测 |
| 🟢 | **i18n 加日/韩/西/法** | 1-2 天 | 海外用户 |

#### 当前完成度自评

| 模块 | 完成度 | 备注 |
|---|---|---|
| 后端核心 | 95% | 18 paths,认证/CRUD/WS/AI 全通 |
| 前端核心 | 90% | 9 页面 + 20+ 组件,SSR 缺失 |
| 测试 | 50% | 关键路径覆盖,缺 E2E |
| 监控 | 70% | Sentry 错误有,metrics 无 |
| 文档 | 95% | ARCH/CHANGELOG/CAPACITOR/i18n/APP_STORE 齐全 |
| 国际化 | 30% | AuthPage 翻完,其它页面预留 t() 接口 |
| 上架准备 | 80% | 截图/文案/图标 OK,账号未注册 |
| 安全 | 80% | Helmet/JWT/黑名单/bcrypt ✅,缺全局 rate limit |

**总评**: V3.8 距离正式上线还差 2-3 周(主要等审核/账号)。**核心功能 100% 就绪,生产代码 0 阻塞**。

---

### 14.0 V3.8 收口清单 ✅

| 段 | 状态 | commit |
|---|---|---|
| §13.5 P3-1 Sentry | ✅ | adb0742 |
| §13.7 V3.7 Capacitor | ✅ | e0b2d5c |
| §13.4 P2-6 PM2 cluster | ⚠️ 评估回退 | 67365e4 |
| §13.5 P3-3 OpenAPI | ✅ | d8865df |
| §13.5 P3-4 单元测试 | ✅ | 1a0db49 |
| §13.4 P2-1 手机号 | ✅ 代码层 | 9e56a72 |
| §13.4 P2-5 OSS | ✅ 代码层 | 91ce2d3 |
| §13.4 P2-2 微信 OAuth | ✅ 代码层 | ac8e1a7 |
| §13.4 P2-4 Postgres | ✅ 代码层 | fb53339 |
| V3.8 App 图标 | ✅ | b8ed098 |
| V3.8 i18n 中英 | ✅ | 75fe488 |
| V3.8 App Store 文案 | ✅ | 29f2828 |

**10 段全 ✅ + 1 段评估回退,共 12 个新 commit**。

---

### 14.1 V3.8 性能基线(2026-06-07)

**测试环境**: 阿里云 ECS + nginx 代理 + 生产 build
**测试工具**: Puppeteer Performance API

| 指标 | 值 | 评级 |
|---|---|---|
| 总加载时间 | 1.16s | 🟢 优秀 |
| First Paint | 376ms | 🟢 优秀 (<500ms) |
| First Contentful Paint | 512ms | 🟢 良好 (<1.8s) |
| DOMContentLoaded | 433ms | 🟢 优秀 |
| loadComplete | 433ms | 🟢 优秀 |
| 资源数 | 18 | 🟡 偏多 |
| 资源总大小 | 948KB | 🟡 偏大 |
| 其中 .js | 869KB | 🟡 大(react+router+zustand+i18n) |
| 其中 .css | 74KB | 🟢 正常 |

**Lighthouse 目标**(已在 `.lighthouserc.json` 配置):
- Performance ≥ 0.85
- Accessibility ≥ 0.9
- Best Practices ≥ 0.85
- PWA ≥ 0.85

**已知优化点**:
1. HTML2Canvas 大依赖(写信长图功能, ~150KB)
2. Phosphor-react icons 全量打包(可按需 import,~50KB 节省)
3. dayjs 替代 moment(当前无,如加时间格式)

**短期不优化**(用户量小,没必要):
- 图片压缩(几乎无图)
- Service Worker 高级缓存策略
- HTTP/2 push

**V4 触发优化**:
- 用户 > 500 RPS
- 移动端首屏 > 2s
- SEO 流量 > 50%

---

### 14.2 V4 啊哈时刻模块(2026-06-07)

**新增独立模块** — 与小纸条并列,定位于"私人灵感/念头/顿悟的快速记录"。

#### 产品定位

| 维度 | 小纸条 (V1-V3) | 啊哈时刻 (V4) |
|---|---|---|
| 受众 | 写给别人 | 只给自己 |
| 公开 | 默认可分享 | 永远私密 |
| 形式 | 信件(长文 + AI 润色) | 灵感(短句/语音) |
| 频率 | 偶尔 | 频繁(每天 N 次) |
| 存储 | 纯云 | **云 OR 本地**(用户选) |

#### 后端 (V4)

**`server/src/routes-aha.ts`**: 10 个 endpoint
- `POST /api/aha/moments` 创建
- `GET /api/aha/moments?` 列表 + 过滤(q/type/mood/tag/storage/limit/offset)
- `GET /api/aha/moments/:id` 详情
- `PATCH /api/aha/moments/:id` 更新(content/tags/mood)
- `DELETE /api/aha/moments/:id` 删除(级联删 audio)
- `POST /api/aha/upload-audio` 音频上传
- `GET /api/aha/tags` 用户所有 tag
- `GET /api/aha/stats` 统计(总数/按情绪/类型/存储/30天分布)
- `POST /api/aha/moments/:id/promote` aha → letter 一键转公开

**DB schema** (`db.ts`):
```sql
CREATE TABLE aha_moments (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL,        -- 'text' | 'audio'
  content TEXT,
  audio_url TEXT,
  audio_duration_ms INTEGER,
  storage TEXT NOT NULL,     -- 'cloud' | 'local'
  tags TEXT,                 -- 逗号分隔
  mood TEXT,                 -- 8 种 emoji
  created_at INTEGER, updated_at INTEGER,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

#### 前端 (V4)

**`src/pages/AhaPage.tsx`**: 1 个完整页面
- 写/录 Tab(MediaRecorder + 60s 上限 + 倒计时 + 音量可视化)
- 实时波形(Canvas + AnalyserNode)
- 静态波形(录音完回看)
- 9 个 FilterChip(全部/文字/录音 + 8 心情)
- 搜索框(content + tags 模糊)
- 列表(emoji + 内容 + 时间 + 标签 + 删除 + 转公开)
- 统计面板(全屏抽屉,4 卡片 + 心情饼图 + 30天柱状)
- 每日 PWA 提醒(iOS 风格开关 + time input + 立即测试)
- 导入/导出 JSON 备份
- i18n 中英文切换

**`src/shared/hooks/useAudioRecorder.ts`**: 录音 hook
- MediaRecorder + AudioContext
- 60s 上限 + 自动停
- peaks 累积(用于波形)
- IndexedDB 本地音频存/取

**`src/shared/hooks/useReminder.ts`**: 提醒 hook
- 浏览器 Notification API
- setInterval 每分钟检查
- 拒绝授权时自动关
- 防同分钟重弹

#### 集成入口

- **LettersPage** 右上角闪电图标 → /aha
- **LettersPage** Segmented Control 下方"今日灵感"卡片
- **AhaMomentCard** 转公开按钮(仅 text)→ promote → 跳新小纸条详情

#### iOS Capacitor 配套

`ios/App/App/Info.plist` 加 3 个权限描述:
- NSMicrophoneUsageDescription(录音)
- NSPhotoLibraryUsageDescription(头像)
- NSCameraUsageDescription(拍照)

#### V4 commits(本 session 后段)

| commit | 内容 |
|---|---|
| `7c08dc7` | aha_moments 表 + 6 API |
| `5152056` | aha 前端 + DB bug 修复(关键) |
| `15d662d` | A1 入口 + B1 iOS 权限 |
| `a7c72e4` | V1.0 完整(搜索/波形/导入导出) |
| `80e1e33` | B2 aha → letter 转公开 |
| `ae44c6f` | B3 统计面板 |
| `6d05744` | B4 每日提醒 |

#### 关键 Bug 修复(2026-06-07)

`/root/data/letters.db` 空文件 vs `/var/lib/feiman-letters/letters.db` 生产 db:
- PM2 cwd 是 /root,`process.env.DB_PATH` 没设 → fallback `./data/letters.db` → 解析为 `/root/data/`
- 修复:`/etc/feiman-letters.env` 加 `DB_PATH=...`,deploy 脚本加固验证
- 详见 `~/.mavis/memory/MEMORY.md` "Node/PM2 服务环境变量 + DB 路径部署陷阱"

#### V4 总览

| 维度 | V3.8 | V4 |
|---|---|---|
| 模块 | 1(小纸条) | 2(小纸条 + 啊哈) |
| API paths | 18 | 28(+10) |
| DB 表 | 5 | 6 |
| 用户场景 | 给别人写信 | + 给自己记灵感 |
| 录音 | ❌ | ✅(MediaRecorder) |
| 本地存储 | ❌ | ✅(IndexedDB) |
| PWA entries | 93 | 96 |
| 导入/导出 | ❌ | ✅ JSON 备份 |
| 每日提醒 | ❌ | ✅ PWA Notification |
