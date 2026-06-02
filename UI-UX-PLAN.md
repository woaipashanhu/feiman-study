# 费曼科学课 — UI/UX 美化提升规划方案

> **版本**: v1.0
> **日期**: 2026-05-31
> **状态**: 规划阶段（待用户确认后实施）

---

## 一、现状诊断总结

### 1.1 项目基础（优势）

| 维度 | 现状 | 评价 |
|------|------|------|
| 技术栈 | React 19 + Vite + Tailwind v4 + TypeScript | 现代、高效 |
| 架构 | 模块化目录、JSON 驱动内容、懒加载路由 | 清晰、可维护 |
| 功能完整性 | 5 大板块 + 全局功能全部完成 | 功能丰富 |
| 动画基础 | PageTransition、Skeleton、下拉刷新 | 已有基础 |
| 深色模式 | CSS 变量驱动、useTheme Hook | 已具备 |
| PWA | Service Worker、Manifest | 已具备 |

### 1.2 核心问题清单

#### 严重问题

| # | 问题 | 影响 | 涉及文件 |
|---|------|------|---------|
| 1 | **色彩系统混乱** — 同时存在两套不兼容的色板（系统蓝绿 + 社交绘本暖棕），无统一设计令牌 | 视觉割裂、品牌感弱 | `index.css` 全站 |
| 2 | **字体系统缺失** — 全站使用系统默认字体，无品牌字体、无字号层级规范 | 缺乏教育产品的温度感、阅读体验平淡 | 全站 |
| 3 | **圆角/阴影不统一** — 卡片圆角有 `rounded-xl`(16px)、`rounded-2xl`(24px) 混用，阴影有 4 套不同参数 | 精致感不足、显得拼凑 | 各板块 List |
| 4 | **交互反馈薄弱** — 按钮点击仅有 `active:scale-95`，无涟漪效果、无状态过渡 | 操作确认感弱、不够现代 | 全站 |

#### 中等问题

| # | 问题 | 影响 | 涉及文件 |
|---|------|------|---------|
| 5 | **TabBar 视觉单薄** — 仅顶部一条色线指示激活状态，无背景高亮、无图标填充态 | 导航辨识度低 | `TabBar.tsx` |
| 6 | **LoadingScreen 简陋** — 纯 spinner + 文字，无品牌元素、无进度感 | 等待体验差 | `LoadingScreen.tsx` |
| 7 | **空状态缺乏温度** — `EmptyState` 仅用 `FileX` 图标，无插画、无引导操作 | 情感连接弱 | `EmptyState.tsx` |
| 8 | **数学播放器课程列表视觉平淡** — 课程卡片无悬停效果、选中态仅边框变色 | 内容吸引力不足 | `MathBoard/index.tsx` |
| 9 | **科学板块列表缩略图占位粗糙** — 使用 `🌐` emoji 占位，无真实缩略图或精致占位图 | 专业感不足 | `ScienceBoard/List.tsx` |
| 10 | **画廊/内功封面图缺失** — 大量使用渐变色或 emoji 占位 | 内容可信度低 | `GalleryBoard/List.tsx`, `NeimenBoard/List.tsx` |

#### 细节优化

| # | 问题 | 影响 |
|---|------|------|
| 11 | 社交阅读器固定布局 `960×560` 在超宽屏上留白过多 | 大屏体验不佳 |
| 12 | ProfileDrawer 各区块视觉权重相同，信息层级不清晰 | 阅读疲劳 |
| 13 | 分享海报渐变背景 (`#667eea → #f093fb`) 与品牌色调不符 | 品牌一致性弱 |
| 14 | 无微交互动画（如列表项入场、卡片悬浮放大、数字滚动） | 活力感不足 |
| 15 | 无全局加载进度指示（路由切换、大数据加载） | 感知性能弱 |

---

## 二、美化提升总体规划

### 2.1 设计原则（确立后全站遵循）

```
1. 温暖教育感 — 色彩柔和、圆角友好、动画舒缓
2. 内容优先 — 减少装饰干扰，让学习内容成为视觉焦点
3. 一致性 — 任何元素在全站只使用一种样式
4. 反馈即时 — 每个操作都有明确的视觉/触觉反馈
5. 无障碍 — 对比度达标、支持深色模式、字体可缩放
```

### 2.2 实施阶段

```
Phase A: 设计系统重构（基础层）    — 影响全站，必须先做
Phase B: 全局组件升级（共享层）    — 提升整体质感
Phase C: 板块精细化（业务层）      — 逐个板块打磨
Phase D: 动效与微交互（体验层）    — 注入生命力
Phase E: 资源补全（内容层）        — 图片、插画等
```

---

## 三、Phase A: 设计系统重构（详细方案）

### 3.1 统一色彩系统

#### 当前问题
- 系统色：`#3B82F6` 蓝、`#10B981` 绿、`#F59E0B` 橙、`#EF4444` 红
- 社交色：`#3D2C1E` 棕、`#2D6A4F` 森林绿、`#FFF8F0` 奶油
- 两者混用，无主次之分

#### 新色彩系统（教育科技风格）

```css
/* ===== 主品牌色 ===== */
--color-brand: #4F6EF7;           /* 主品牌蓝 — 信任、智慧 */
--color-brand-light: #EEF1FF;     /* 品牌浅背景 */
--color-brand-dark: #3A56D4;      /* 品牌深 — 悬停/按下 */

/* ===== 辅助色（用于各板块区分） ===== */
--color-math: #4F6EF7;            /* 数学 — 蓝 */
--color-science: #00C9A7;         /* 科学 — 青绿 */
--color-social: #FF9F43;          /* 社交 — 暖橙 */
--color-gallery: #A55EEA;         /* 画廊 — 紫 */
--color-neimen: #FF6B6B;          /* 内功 — 珊瑚红 */

/* ===== 中性色 ===== */
--color-bg: #F7F8FC;              /* 页面背景 — 极浅灰蓝 */
--color-surface: #FFFFFF;         /* 卡片表面 */
--color-surface-elevated: #FFFFFF;/* 提升层（带阴影） */
--color-text: #1A1D2B;            /* 主文字 — 深蓝黑 */
--color-text-secondary: #5A6078;  /* 次要文字 */
--color-text-tertiary: #9AA0B8;   /* 辅助文字 */
--color-border: #E8EAF0;          /* 边框 */
--color-border-light: #F0F1F5;    /* 浅色分隔线 */

/* ===== 功能色 ===== */
--color-success: #34D399;
--color-warning: #FBBF24;
--color-error: #EF4444;
--color-info: #60A5FA;

/* ===== 深色模式 ===== */
--color-bg-dark: #0F1117;
--color-surface-dark: #1A1D26;
--color-text-dark: #F0F1F5;
--color-text-secondary-dark: #A0A5B8;
--color-border-dark: #2A2E3A;
```

#### 实施步骤
1. 重写 `index.css` 的 `@theme` 区块
2. 更新 `useBoardStore.ts` 中各板块 `color` 字段
3. 全站搜索替换旧色值（使用 Tailwind 类名替换）

---

### 3.2 字体系统升级

#### 当前问题
- 全站 `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto...`
- 无中文字体优化、无字号层级

#### 新字体系统

```css
/* ===== 字体族 ===== */
--font-sans: 'Inter', 'PingFang SC', 'Microsoft YaHei', -apple-system, sans-serif;
--font-display: 'Inter', 'PingFang SC', sans-serif;  /* 标题 */
--font-mono: 'JetBrains Mono', 'SF Mono', monospace;  /* 代码/数据 */

/* ===== 字号层级（以 16px 为基准） ===== */
--text-xs: 12px;      /* 标签、辅助信息 */
--text-sm: 14px;      /* 正文次要 */
--text-base: 16px;    /* 正文 */
--text-lg: 18px;      /* 小标题 */
--text-xl: 20px;      /* 板块标题 */
--text-2xl: 24px;     /* 页面标题 */
--text-3xl: 30px;     /* 大标题（Hero） */

/* ===== 字重 ===== */
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;

/* ===== 行高 ===== */
--leading-tight: 1.25;   /* 标题 */
--leading-normal: 1.5;   /* 正文 */
--leading-relaxed: 1.75; /* 长文本 */
```

#### 实施步骤
1. 在 `index.html` 中引入 Google Fonts（Inter）
2. 更新 `index.css` 字体变量
3. 为各组件建立标准字号映射

---

### 3.3 间距与圆角规范

#### 新规范

```css
/* ===== 圆角 ===== */
--radius-sm: 8px;     /* 按钮、标签 */
--radius-md: 12px;    /* 小卡片、输入框 */
--radius-lg: 16px;    /* 标准卡片 */
--radius-xl: 20px;    /* 大卡片、弹窗 */
--radius-full: 9999px; /* 圆形 */

/* ===== 间距（8px 基准） ===== */
--space-1: 4px;
--space-2: 8px;
--space-3: 12px;
--space-4: 16px;
--space-5: 20px;
--space-6: 24px;
--space-8: 32px;
--space-10: 40px;

/* ===== 阴影（统一为 3 层） ===== */
--shadow-sm: 0 1px 2px rgba(26, 29, 43, 0.05);
--shadow-md: 0 4px 12px rgba(26, 29, 43, 0.08);
--shadow-lg: 0 8px 24px rgba(26, 29, 43, 0.12);
```

---

## 四、Phase B: 全局组件升级（详细方案）

### 4.1 TabBar 重构

#### 目标
- 激活态更醒目
- 增加图标填充态（Filled vs Outline）
- 添加微动画

#### 设计稿

```
[数学] [科学] [社交] [画廊] [内功]

激活态：
- 图标：lucide filled 版本（或自定义 SVG）
- 文字：品牌色 + font-semibold
- 背景：品牌色 8% 透明度圆角背景
- 顶部指示条：加粗至 3px，带圆角

未激活态：
- 图标：outline 版本，灰色
- 文字：text-tertiary
- 无背景

交互：
- 点击：scale(0.92) -> scale(1)，150ms spring
- 切换：指示条滑动动画（width + left 过渡）
```

#### 实施
- 安装 `@lucide/lab` 或自定义 SVG 图标获取 filled 版本
- 重写 `TabBar.tsx`，添加 `layoutId` 动画（Framer Motion）

---

### 4.2 LoadingScreen 重构

#### 目标
- 品牌识别度
- 加载进度感知

#### 设计稿

```
+-----------------------------+
|                             |
|        (品牌 Logo)          |
|        费曼科学课            |
|                             |
|    +------------------+     |
|    |██████████████░░░░|     |  <- 进度条（如有进度）
|    +------------------+     |
|                             |
|      "加载精彩内容..."       |  <- 随机提示语
|                             |
+-----------------------------+

动画：
- Logo：呼吸动画（scale 0.98 <-> 1.02，3s infinite）
- 进度条：shimmer 效果
- 提示语：淡入切换
```

#### 实施
- 重写 `LoadingScreen.tsx`
- 添加随机提示语文本数组
- 支持 `progress?: number` 可选属性

---

### 4.3 EmptyState 重构

#### 目标
- 情感化设计
- 引导用户操作

#### 设计稿

```
+-----------------------------+
|                             |
|     [插画：空盒子/望远镜]     |
|                             |
|      "这里暂时空空如也"       |
|      "去首页发现精彩内容吧"    |
|                             |
|    [ 返回首页 ]              |
|                             |
+-----------------------------+

插画风格：简约线条 + 品牌色点缀
可使用 Lottie 动画或 SVG 插画
```

#### 实施
- 引入 Lottie 或设计 SVG 插画
- 重写 `EmptyState.tsx`，支持 `action` 属性

---

### 4.4 按钮组件标准化

#### 新建 `Button.tsx` 组件

```tsx
interface ButtonProps {
  variant: 'primary' | 'secondary' | 'ghost' | 'danger'
  size: 'sm' | 'md' | 'lg'
  loading?: boolean
  icon?: ReactNode
  children: ReactNode
}
```

#### 样式规范

| Variant | 背景 | 文字 | 悬停 | 按下 |
|---------|------|------|------|------|
| primary | brand | white | brand-dark | scale(0.97) |
| secondary | brand-light | brand | bg-opacity 增加 | scale(0.97) |
| ghost | transparent | text | surface | scale(0.97) |
| danger | error/10 | error | error/20 | scale(0.97) |

#### 交互
- 涟漪效果（Ripple）：点击位置扩散的圆形波纹
- 加载状态：spinner 替换图标，文字变灰

---

## 五、Phase C: 板块精细化（详细方案）

### 5.1 数学课板块

#### 当前问题
- 播放器下方课程列表像"设置项"而非"内容卡片"
- 选中态仅边框变色，不够醒目
- 无学习进度可视化

#### 改进方案

```
课程卡片新设计：
+-------------------------------------+
|  +----+  第3课：数键入门              |
|  | 🖼  |  掌握数字键盘的基础操作        |
|  +----+  ●------○  12:34   已学完     |
+-------------------------------------+

改进点：
1. 封面图圆角加大，增加阴影
2. 标题字号加大至 text-base
3. 添加学习进度条（已观看时长/总时长）
4. "已学完"状态用绿色勾选标签
5. 当前播放课程：左侧添加播放中动画（声波动画）
6. 悬停/点击：卡片整体上移 2px + 阴影加深
```

#### 实施文件
- `MathBoard/index.tsx` — 课程列表卡片样式
- 新增 `LessonCard.tsx` 组件

---

### 5.2 科学可视化板块

#### 当前问题
- 列表项缩略图是 `🌐` emoji，极不专业
- 卡片横向排列但信息密度低

#### 改进方案

```
场景卡片新设计：
+-------------------------------------+
|  +----------+                       |
|  |          |  原子结构              |
|  |   [3D    |  探索微观世界的奥秘     |
|  |  缩略图]  |  简单  ·  5分钟        |
|  |          |                       |
|  +----------+                       |
+-------------------------------------+

改进点：
1. 使用 Three.js 生成场景缩略图（预渲染）
2. 或设计精美的 SVG 占位插画（每个分类一种风格）
3. 卡片改为竖向（封面图在上，信息在下）
4. 添加难度标签（颜色区分：绿-简单、黄-中等、红-困难）
5. 悬停：封面图微放大（scale 1.05）
```

#### 实施文件
- `ScienceBoard/List.tsx`
- 新增 `SceneThumbnail.tsx`（3D 预渲染或 SVG）

---

### 5.3 社交训练板块

#### 当前问题
- 列表页卡片设计尚可，但序号圆圈太素
- 阅读器固定布局在大屏体验差

#### 改进方案

**列表页：**
```
序号改进：
- 背景：渐变圆形（森林绿渐变）
- 文字：白色 + 粗体
- 添加微妙的内阴影

卡片改进：
- 添加左侧色条（4px，分类色）
- 悬停时色条加宽（4px -> 6px）
- 封面图增加圆角和遮罩
```

**阅读器：**
```
大屏适配：
- 当屏幕宽度 > 1200px 时，左右添加装饰性背景
- 或使用响应式布局（非固定 960px）

进度条改进：
- 底部进度条加高（2px -> 4px）
- 添加渐变色彩（森林绿 -> 青色）
- 已完成部分添加微光动画
```

#### 实施文件
- `SocialBoard/List.tsx`
- `SocialBoard/Player.tsx`

---

### 5.4 童画廊板块

#### 当前问题
- 大量作品无真实图片（SVG 占位）
- 瀑布流布局但卡片间距不均

#### 改进方案

```
作品卡片新设计：
+---------------------+
|                     |
|    [名画高清图]      |
|                     |
|  星空                |
|  梵高 · 1889        |
|  收藏  ·  1.2k      |
+---------------------+

改进点：
1. 图片懒加载 + 模糊渐显（blur-up）
2. 图片下方信息区增加半透明遮罩
3. 悬停：图片放大 + 信息区上滑显示描述
4. 无图状态：优雅的骨架屏（非 emoji）
```

#### 实施文件
- `GalleryBoard/List.tsx`
- `GalleryBoard/Viewer.tsx`

---

### 5.5 内功养生法板块

#### 当前问题
- 卡片封面是渐变色 + emoji，缺乏吸引力
- 翻转卡片正面信息太少

#### 改进方案

```
卡片新设计：
正面：
+---------------------+
| ################### |  <- 顶部色条（渐变）
|                     |
|   [精美插画/图标]     |
|                     |
|  呼吸法              |
|  调节身心的基础练习   |
|                     |
|  [点击翻转 ->]       |
+---------------------+

改进点：
1. 顶部色条改为渐变（分类色 -> 分类色浅）
2. 封面使用统一风格的插画（可找开源插画库）
3. 添加分类标签（小圆角标签）
4. 翻转动画优化：3D 翻转更流畅（perspective 调整）
```

#### 实施文件
- `NeimenBoard/List.tsx`
- `NeimenBoard/CardDetail.tsx`

---

## 六、Phase D: 动效与微交互（详细方案）

### 6.1 列表项入场动画

```tsx
// 使用 Framer Motion 的 staggerChildren
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
}
```

**应用位置：** 所有列表页（数学课程列表、科学场景列表、社交绘本列表等）

### 6.2 卡片悬浮效果

```css
.card {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}
.card:active {
  transform: translateY(0) scale(0.98);
}
```

### 6.3 按钮涟漪效果

```tsx
// 纯 CSS 实现
<button className="ripple-button">
  点击我
</button>

/* CSS */
.ripple-button {
  position: relative;
  overflow: hidden;
}
.ripple-button::after {
  content: '';
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  pointer-events: none;
  background-image: radial-gradient(circle, #fff 10%, transparent 10.01%);
  background-repeat: no-repeat;
  background-position: 50%;
  transform: scale(10, 10);
  opacity: 0;
  transition: transform 0.5s, opacity 1s;
}
.ripple-button:active::after {
  transform: scale(0, 0);
  opacity: 0.3;
  transition: 0s;
}
```

### 6.4 数字滚动动画

```tsx
// 学习时长、星星数等数字变化时滚动
function AnimatedNumber({ value }: { value: number }) {
  // 使用 Framer Motion 的 useSpring
  const spring = useSpring(value, { stiffness: 100, damping: 20 })
  return <motion.span>{spring}</motion.span>
}
```

### 6.5 页面切换增强

```tsx
// PageTransition 升级
// 1. 添加 exit 动画（当前页面向左滑出）
// 2. 使用 AnimatePresence 包裹
// 3. 不同方向使用不同动画曲线
```

---

## 七、Phase E: 资源补全（详细方案）

### 7.1 插画资源

| 位置 | 需求 | 风格建议 |
|------|------|---------|
| EmptyState | 空状态插画（3-5 个场景） | 简约线条 + 品牌色 |
| LoadingScreen | 品牌吉祥物动画 | Lottie JSON |
| Neimen 卡片封面 | 6 张养生主题插画 | 国风/扁平 |
| 错误页面 | 404/500 插画 | 可爱风格 |

**推荐来源：**
- unDraw（开源 SVG 插画，可改色）
- Storyset（免费插画）
- LottieFiles（免费动画）

### 7.2 图标资源

| 需求 | 方案 |
|------|------|
| TabBar filled 图标 | 1. 使用 `@lucide/lab`（如有）<br>2. 自定义 SVG 图标组件<br>3. 使用 Phosphor Icons（支持 duotone/fill） |
| 板块分类图标 | 统一风格，建议 24×24px，2px 描边 |

**推荐：** 考虑将 `lucide-react` 替换为 `phosphor-react`（支持 fill 变体）

### 7.3 图片资源

| 位置 | 需求 | 优先级 |
|------|------|--------|
| Gallery 名画 | 8 幅高清图 | P1 |
| Science 缩略图 | 11 个场景 3D 截图/SVG | P1 |
| Neimen 卡片封面 | 6 张插画 | P2 |
| Math 课程封面 | 26 张（可用纯色+文字替代） | P2 |

---

## 八、实施优先级与排期

### 8.1 优先级矩阵

| 优先级 | 任务 | 预估工时 | 影响范围 |
|--------|------|---------|---------|
| **P0** | 统一色彩系统 | 4h | 全站 |
| **P0** | 统一圆角/阴影/间距 | 3h | 全站 |
| **P0** | TabBar 重构 | 3h | 全局导航 |
| **P1** | 字体系统升级 | 2h | 全站 |
| **P1** | LoadingScreen 重构 | 2h | 全局 |
| **P1** | EmptyState 重构 | 2h | 全局 |
| **P1** | 按钮标准化 + 涟漪 | 3h | 全站 |
| **P2** | 列表项入场动画 | 4h | 各列表页 |
| **P2** | 卡片悬浮效果统一 | 2h | 全站卡片 |
| **P2** | 数学课程卡片升级 | 3h | MathBoard |
| **P2** | 科学缩略图占位优化 | 2h | ScienceBoard |
| **P3** | 画廊图片补全 | 4h | GalleryBoard |
| **P3** | 内功插画补全 | 4h | NeimenBoard |
| **P3** | 分享海报重设计 | 2h | ShareButton |
| **P3** | ProfileDrawer 层级优化 | 3h | 全局 |

### 8.2 推荐实施顺序

```
第 1 轮（基础层，必须先做）：
  1. 统一色彩系统
  2. 统一圆角/阴影/间距
  3. 字体系统升级

第 2 轮（全局组件）：
  4. TabBar 重构
  5. LoadingScreen 重构
  6. EmptyState 重构
  7. 按钮标准化

第 3 轮（动效层）：
  8. 列表项入场动画
  9. 卡片悬浮效果
  10. 按钮涟漪效果

第 4 轮（业务层）：
  11. 数学课程卡片
  12. 科学缩略图
  13. 社交阅读器优化

第 5 轮（资源层）：
  14. 插画/图片补全
  15. 分享海报重设计
```

---

## 九、技术实现建议

### 9.1 新增依赖

```json
{
  "framer-motion": "^11.0.0",      // 动效库（入场、页面切换、手势）
  "@phosphor-icons/react": "^2.0.0" // 图标库（支持 fill 变体，替换 lucide）
}
```

> 注：如果保持 lucide，需要自定义 filled 图标组件

### 9.2 关键实现模式

```tsx
// 1. 设计令牌使用方式
// index.css
@theme {
  --color-brand: #4F6EF7;
  --color-brand-light: #EEF1FF;
  // ...
}

// 组件中使用
<div className="bg-brand text-white rounded-lg shadow-md">

// 2. 动画组件封装
// shared/components/FadeIn.tsx
export function FadeIn({ children, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  )
}

// 3. 卡片悬浮效果封装
// shared/components/Card.tsx
export function Card({ children, hover = true }) {
  return (
    <div className={`
      bg-surface rounded-lg shadow-sm
      transition-all duration-200
      ${hover ? 'hover:-translate-y-0.5 hover:shadow-md active:scale-[0.98]' : ''}
    `}>
      {children}
    </div>
  )
}
```

### 9.3 深色模式适配清单

每修改一个组件，检查：
- [ ] 背景色是否有 `dark:` 变体
- [ ] 文字色是否有 `dark:` 变体
- [ ] 边框色是否有 `dark:` 变体
- [ ] 阴影在深色模式下是否过强
- [ ] 图片/插画在深色模式下是否需要反色

---

## 十、验收标准

### 10.1 视觉一致性检查

- [ ] 全站无硬编码色值（除设计令牌定义外）
- [ ] 全站卡片圆角统一为 16px（或设计规范值）
- [ ] 全站阴影只使用 3 种规范阴影
- [ ] 全站按钮样式统一
- [ ] 全站字体只使用规范字号

### 10.2 交互体验检查

- [ ] 每个可点击元素都有 hover 状态
- [ ] 每个可点击元素都有 active/pressed 状态
- [ ] 页面切换有转场动画
- [ ] 列表加载有入场动画
- [ ] 加载状态有品牌 LoadingScreen

### 10.3 无障碍检查

- [ ] 文字对比度 >= 4.5:1
- [ ] 支持 prefers-reduced-motion
- [ ] 所有图片有 alt 文本
- [ ] 按钮有 aria-label

---

> **备注：** 本规划为详细方案文档。实际实施时建议按"Phase A -> Phase B -> Phase C -> Phase D -> Phase E"的顺序逐步推进，每轮完成后进行视觉验收，确保质量。
