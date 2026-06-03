# 📋 费曼科学课 (feiman-v3-new) — 项目进度日志

> **维护规则**：每次开发会话结束时更新此文件。开始新会话时必须先阅读。
>
> **项目路径**: `/Users/liuzhen/Documents/lingxi-claw/20260529-08-47-11-713/feiman-v3-new/`
> **线上地址**: `http://47.99.101.168:8890/`
> **服务器**: `47.99.101.168` (SSH密钥: `/Users/liuzhen/Desktop/项目/lingxi_cloud.pem`)
> **部署目录**: `/var/www/feiman-v3-new/`
> **Nginx配置**: `/etc/nginx/conf.d/feiman-v3-new.conf` (端口 8890)
> **原始资源**: `/root/workspace_backup/fox-school/scenes/` (88个场景源文件)

---

## 📊 当前状态总览 (2026-06-02)

| 板块 | 状态 | 完成度 | 说明 |
|------|------|--------|------|
| 基础框架 | ✅ 完成 | 100% | React+Vite+TS+Tailwind v4+Zustand+Router v7 |
| 数学课播放器 | ✅ 完成 | 100% | Aliplayer + VOD私有加密, 26节课 |
| 社交训练绘本阅读器 | ✅ 基本完成 | 98% | 86场景已上线，横屏提示适配Safari，移除Screen Orientation API |
| 科学3D可视化 | 🔄 **改造中** | **85%** | 卡片主页+分类列表+3D播放页，新交互架构 |
| 童画廊 | ✅ 基本完成 | 85% | 8幅名画(3分类), 瀑布流列表+全屏大图查看 |
| 内功养生法 | ✅ 基本完成 | 85% | 6张养生卡片(3分类), 卡片翻转详情页 |
| PWA/Service Worker | ✅ 完成 | 100% | vite-plugin-pwa，icon-192.png/icon-512.png已补齐 |
| **部署防错体系** | ✅ **完成** | **100%** | deploy.sh + pre-deploy-check.mjs + 图标类型安全 |
| **错误监控系统** | ✅ **完成** | **100%** | DevErrorPanel + error-reporter + ErrorBoundary |
| **测试刷新按钮** | ✅ **完成** | **100%** | App.tsx 右下角固定刷新按钮，方便PWA测试时手动更新 |

### 社交训练板块详细数据

| 指标 | 数值 |
|------|------|
| 总场景数 | **86** |
| 卡耐基(6+parts) | **21** 个 |
| 社交故事(3parts) | **65** 个 |
| 有音频场景 | **82/86** (96%) |
| 有英文旁白场景 | **20/86** |
| 图片总数 | 332 张 |
| 音频总数 | 618 个 |
| JSON版本 | v8 (2026-05-30-v8-fixed-en) |
| Zod校验 | ✅ 通过 |

---

### 2026-06-03 会话 #8 — 新增「光与颜色」主题(2 个 Three.js 场景)

#### 本次会话目标
为科学板块新增一个对比主题，让用户验证大卡片首页 + Banner 详情页在不同主题下的视觉效果。

#### 完成的工作

**1. 🎨 新分类「光与颜色」(`public/data/science.json`)**
- 新增第 2 个分类 `id: "light"`,`color: "#A855F7"` 紫色,`icon: "💡"`
- 挂载 2 个新场景（均用 `type: "iframe"` 加载独立 HTML + Three.js）
- JSON version 升至 `2026-06-03-v4`

**2. 🔺 场景 1：三棱镜分光 (`public/science/prism.html`)**
- 左侧一道白色光束射向中央的玻璃三棱镜（`MeshPhysicalMaterial` + `transmission: 0.92` 物理玻璃材质）
- 棱镜右侧 7 条不同角度的色光束（红橙黄绿蓝靛紫），分别用 `CylinderGeometry` + `MeshBasicMaterial` 渲染
- 每条色光附带 additive blending 的辉光光晕
- 棱镜带轻微正弦摆动（`rotation.y = Math.sin(elapsed * 0.3) * 0.15`）展示不同角度的折射效果
- 200 颗环境粒子做尘埃感
- 底部带 7 色色板图例（ROYGBIV）

**3. 🌈 场景 2：彩虹形成 (`public/science/rainbow.html`)**
- 3 个模式可切换（**水滴阵列** / **单滴放大** / **完整彩虹**）：
  - **水滴阵列**：12×7 玻璃水滴网格，带上下浮动动画
  - **单滴放大**：1 颗 3x 放大的水滴 + 入射白光 + 内部反射路径（黄色折线）+ 7 色出射光线
  - **完整彩虹**：120 颗水滴沿 180° 圆弧排列，背后是 vertexColors 着色的七彩弧线（按 ROYGBIV 渐变）
- 太阳（带光晕）从左上方照入
- 物理玻璃材质 `ior: 1.33`（接近真实水的折射率）

#### 文件变更清单

| 文件 | 变更类型 | 说明 |
|------|---------|------|
| `public/data/science.json` | 修改 | 新增 `light` 分类 + 2 场景；version v3→v4 |
| `public/science/prism.html` | **新建** | 三棱镜分光场景（~250 行） |
| `public/science/rainbow.html` | **新建** | 彩虹形成场景（~280 行，3 模式） |

#### 验证结果

```
✅ JSON 格式：node 解析通过
✅ 预检脚本：20/20 项通过（含 science.json JSON 格式检查）
✅ Vite 构建：成功（2.12s, 58 entries PWA precache）
```

#### 后续可选
- 部署后访问 `http://47.99.101.168:8890/science`，查看新分类「光与颜色」的大卡片效果
- 2 个场景的 thumbnail 暂用 `/images/science-thumbs/xxx.jpg` 占位路径，若加载失败会回退到渐变背景（已测试 OK）

---

### 2026-06-03 会话 #7 — 科学板块 App Store Today 风格改造 + 死代码清理

#### 本次会话目标
参照 App Store Today 视觉风格，全面改造科学板块界面（毛玻璃 TabBar + 大卡片首页 + Banner 详情页 + 滚动记忆），并清理被废弃的旧组件。

#### 完成的工作

**1. 🪟 TabBar 毛玻璃化 (`src/shared/components/TabBar.tsx`)**
- 背景由实心改为 `backdrop-blur(20px) saturate(180%)` 半透明毛玻璃
- 增加文字标签（图标+文字组合），选中态用主题色填充，未选中灰色线框
- 选中态图标用 `weight="fill"` 突出显示

**2. 🏠 科学首页大卡片化 (`src/boards/ScienceBoard/Home.tsx`)**
- 卡片布局从 2 列网格改为纵向堆叠（`space-y-5`），一屏一张
- 卡片高度 `calc(100vh - 200px)`，`min-height: 420px`
- 大圆角 `28px`，卡片上半部分嵌入 iframe 实时 3D 预览（`transform: scale(0.4)` 缩放适配）
- 卡片下半部分白色大字标题（`text-[28px] font-bold`）+ 描述
- 入场动画：stagger + spring，从 `y:40 scale:0.96` 展开
- 引入 `useScrollMemory` hook，进入分类页前 `saveScroll()` 保存滚动位置

**3. 🎬 分类列表页全屏化 (`src/boards/ScienceBoard/CategoryList.tsx`)**
- 顶部大 Banner（`height: 45vh`, `minHeight: 320px`），嵌入 iframe 3D 场景（`transform: scale(0.5)`）
- 关闭按钮改为右上角圆形叉号（`X` 图标，`bg-white/20 backdrop-blur-md`）
- 入场/退场动画：缩放 0.95 ↔ 1，配合 framer-motion `spring`
- Banner 下方为场景信息流列表（缩略图 + 标题 + 描述 + 难度标签）
- 列表项悬停显示播放按钮

**4. 🛣 路由调整 (`src/router/index.tsx`)**
- `/science/category/:categoryId` 从 `BoardLayout` 包裹区内移到顶层路由
- 配合 CategoryList 改造，分类页跳出 TabBar 布局，全屏沉浸式

**5. 🧹 死代码清理**
- 删除 `src/boards/ScienceBoard/List.tsx`（203 行）
- 原因：上一轮改造后 `ScienceBoard/index.tsx` 只导出 `Home`，旧 2 列网格 List 组件已无引用（`grep` 全局确认无 import）
- 删除前 `mavis-trash` 进入回收站，可恢复

#### 对照原需求逐项核对

| # | 需求项 | 状态 | 关键实现 |
|---|--------|------|---------|
| 1 | TabBar 毛玻璃 + 图标文字 | ✅ | `backdropFilter: 'blur(20px) saturate(180%)'` |
| 2 | 首页：2列→纵向大卡片 + 28px 圆角 + iframe + 白色大字 | ✅ | `space-y-5` + `borderRadius: '28px'` |
| 3 | 分类页：45% Banner + iframe + 右上角叉号 + 滚动记忆 + 缩放动画 + 列表 | ✅ | 5 项全部实现 |
| 4 | 路由：分类页跳出 BoardLayout | ✅ | `router/index.tsx:75-84` 移到顶层路由区 |

#### 关于「双层滚动嵌套」的核查结论
初次审查时曾误判 `BoardLayout` 外层 `main` 与 `Home` 内层 `div` 同时设置 `overflow-y-auto` 会产生双滚。经过仔细核查：
- 外层 main `flex-1 min-h-0 overflow-y-auto` → 高度为视口减 TabBar 的**计算后固定值**
- 内层 div `h-full flex flex-col overflow-y-auto` → 高度被 `h-full` 锁死 = 外层 main 高度
- 内层 div 永远不会"撑出"外层 main，**实际只有内层 div 在滚**
- `useScrollMemory` 存的就是用户实际看到的那个 scrollTop，完全正确

撤回原"双层滚动嵌套"瑕疵标记，**不修改 BoardLayout**。

#### 文件变更清单

| 文件 | 变更类型 | 说明 |
|------|---------|------|
| `src/boards/ScienceBoard/Home.tsx` | 重写 | 纵向大卡片 + 滚动记忆 + iframe 预览 |
| `src/boards/ScienceBoard/CategoryList.tsx` | 重写 | 全屏 Banner 详情页 + 缩放动画 |
| `src/boards/ScienceBoard/List.tsx` | **删除** | 旧 2 列网格死代码（203 行） |
| `src/router/index.tsx` | 修改 | 分类页路由移出 BoardLayout |
| `src/shared/components/TabBar.tsx` | 修改 | 毛玻璃 + 图标文字组合 |
| `src/shared/hooks/useScrollMemory.ts` | **新建** | 滚动位置 Map 记忆 hook |
| `src/shared/hooks/index.ts` | 修改 | 导出 `useScrollMemory` |

#### 验证结果

```
✅ TypeScript: 零错误（改造前已通过，保持）
✅ 全局 grep 确认 List.tsx 无引用后安全删除
✅ 路由结构清晰：/science 有 TabBar，/science/category/* 全屏
```

---

### 2026-05-31 会话 #5 — 科学板块交互架构改造（原型）

#### 本次会话目标
按新交互架构改造科学板块：卡片主页 → 分类列表 → 3D播放页，统一顶部按钮栏（返回+消息+列表抽屉）。

#### 完成的工作

**1. 🏠 新建科学卡片主页 (`Home.tsx`)**
- 4张分类卡片网格展示：物理世界、化学奇观、生命科学、地球与宇宙
- 每张卡片显示分类图标、名称、场景数量
- 右上角 📬 消息按钮（带红点提示），点击进入消息中心
- 点击卡片进入分类列表页
- Framer Motion 入场动画 + 悬停放大效果

**2. 📋 新建科学分类列表页 (`CategoryList.tsx`)**
- 顶部返回按钮 + 分类标题（带图标）
- 场景列表项：缩略图/序号 + 标题 + 描述
- 悬停显示播放按钮，点击进入3D播放页
- 路由：`/science/category/:categoryId`

**3. 🎮 改造科学3D播放页 (`Player.tsx`)**
- **统一顶部按钮栏**：← 返回 | 标题 | 📬 消息 | ☰ 列表
- **右侧列表抽屉**：展示所有分类和场景，可快速切换
- 保留3D画布、上下场景导航、操作提示

**4. 🚀 部署到生产环境**
- 修复 `deploy.sh` SSH 密钥路径（`id_rsa` → `lingxi_cloud.pem`）
- 预检 19/19 项通过
- 成功部署到 `47.99.101.168:8890`

#### 文件变更清单

| 文件 | 变更类型 | 说明 |
|------|---------|------|
| `src/boards/ScienceBoard/Home.tsx` | **新建** | 科学卡片主页（4分类卡片网格） |
| `src/boards/ScienceBoard/CategoryList.tsx` | **新建** | 科学分类列表页 |
| `src/boards/ScienceBoard/Player.tsx` | 修改 | 统一顶部按钮栏 + 列表抽屉 |
| `src/boards/ScienceBoard/index.tsx` | 修改 | 入口改为 Home 组件 |
| `src/router/index.tsx` | 修改 | 新增 `/science/category/:categoryId` 路由 |
| `deploy.sh` | 修改 | 修复 SSH 密钥路径 |

#### 验证结果
```
✅ TypeScript: 零错误 (tsc --noEmit)
✅ 构建: Vite 构建成功
✅ 预检脚本: 19/19 项通过
✅ 部署: 成功上传到服务器
```

#### 待后续完善
- [ ] 其他四个板块按同样架构改造（数学、社交、画廊、内功）
- [ ] 消息中心页面实现（盲盒+个人中心+设置）
- [ ] 视觉风格统一（配色、圆角、阴影、留白）

---

### 2026-05-31 会话 #4 — 部署防错体系 + 错误监控系统

#### 本次会话目标
解决生产环境 React Error #130 白屏问题，建立自动化部署流程和错误监控体系，防止未来再次出现类似问题。

#### 完成的工作

**1. 🔧 修复 React Error #130 白屏（紧急）**
- **根因**: `useBoardStore.ts` 中内功板块图标名写为 `'Sparkles'`，但 `TabBar.tsx` 的 `iconMap` 中只有 `'Sparkle'`，导致 `Icon` 为 `undefined`，React 渲染报错
- **修复**: 图标名 `'Sparkles'` → `'Sparkle'`
- **教训**: 字符串类型无约束，拼写错误编译期无法发现

**2. 🛡️ 图标类型安全体系（防止同类错误）**
- 新建 `src/shared/components/icon-registry.ts` — 图标注册表（Single Source of Truth）
  - 定义 `BoardIconName` 联合类型：`'Calculator' | 'Atom' | 'BookOpen' | 'Image' | 'Sparkle'`
  - 导出 `VALID_ICON_NAMES` 常量数组
  - 提供 `getIcon(name)` 安全获取函数（无效时返回 null + 控制台警告）
- 修改 `src/types/board.ts` — `icon` 字段类型从 `string` → `BoardIconName`
  - **效果**: 写错图标名时 TypeScript **直接报红**，编译不过
- 修改 `src/shared/components/TabBar.tsx` — 使用 `getIcon()` + null guard
  - 无效图标时显示 ❓ 占位符 + 红色文字，**绝不白屏**

**3. 🚀 一键部署脚本（deploy.sh）**
- 新建 `deploy.sh` — 5 步自动化部署：
  1. `npm run build` — Vite 生产构建
  2. `node scripts/pre-deploy-check.mjs` — 部署前预检
  3. `tar -czf` — 打包 dist/ 目录
  4. `scp` 上传 + `ssh` 远程原子化部署（临时目录 → 清理旧文件 → 复制新文件）
  5. `node verify-deploy.mjs` — 在线验证所有页面
- 支持参数：`--dry-run`（只构建不上传）、`--skip-build`（跳过构建）

**4. ✅ 部署前预检脚本（pre-deploy-check.mjs）**
- 新建 `scripts/pre-deploy-check.mjs` — 5 大类 19 项检查：
  1. 图标名拼写检查（防止 React #130）
  2. 构建产物完整性（index.html / assets/ / JS+CSS 引用匹配）
  3. data JSON 格式校验
  4. 代码陷阱扫描（TabBar null guard）
  5. 错误监控系统检查（全局监听 / ErrorBoundary / 上报模块）
- 退出码 0 = 通过，1 = 阻塞部署

**5. 📊 三层错误监控体系**
- **开发环境**: `DevErrorPanel.tsx` — 页面右下角实时错误面板
  - 自动捕获 JS 错误 / React 错误 / Promise 异常 / 资源加载失败
  - 显示错误类型、消息、堆栈，支持一键复制
  - 生产环境自动隐藏
- **生产环境**: `error-reporter.ts` — 自动上报错误到服务器
  - 收集：错误消息 + 堆栈 + URL + UA + 屏幕尺寸 + 时间戳
  - 上报方式：fetch POST → navigator.sendBeacon → localStorage 队列（三重保障）
  - 5 分钟去重，避免刷屏
- **ErrorBoundary 升级**: 每个路由板块独立包裹
  - 单板块出错不影响其他板块
  - 自动上报错误 + 显示友好 UI（刷新按钮 + 复制错误信息）

**6. 📦 package.json 部署命令**
```json
"predeploy": "node scripts/pre-deploy-check.mjs"
"deploy": "./deploy.sh"
"deploy:dry": "./deploy.sh --dry-run"
"deploy:quick": "./deploy.sh --skip-build"
"verify": "node verify-deploy.mjs"
```

#### 文件变更清单

| 文件 | 变更类型 | 说明 |
|------|---------|------|
| `src/shared/components/icon-registry.ts` | **新建** | 图标注册表 + 类型安全 |
| `src/shared/components/TabBar.tsx` | 修改 | 使用 getIcon() + null guard |
| `src/types/board.ts` | 修改 | icon: string → BoardIconName |
| `deploy.sh` | **新建** | 一键部署脚本（5步自动化） |
| `scripts/pre-deploy-check.mjs` | **新建** | 部署前 19 项预检 |
| `src/shared/utils/error-reporter.ts` | **新建** | 生产环境错误上报 |
| `src/shared/components/DevErrorPanel.tsx` | **新建** | 开发环境实时错误面板 |
| `src/shared/components/ErrorBoundary.tsx` | 修改 | 自动上报 + 复制错误 + 友好 UI |
| `src/router/index.tsx` | 修改 | SafeLazy 包裹所有路由（ErrorBoundary+Suspense） |
| `src/main.tsx` | 修改 | 初始化全局错误监听 |
| `src/App.tsx` | 修改 | 添加 DevErrorPanel |
| `package.json` | 修改 | 新增 deploy/predeploy/verify scripts |

#### 验证结果
```
✅ TypeScript: 零错误 (tsc --noEmit)
✅ 预检脚本: 19/19 项通过
✅ 图标类型安全: 写错图标名直接 TS 报红
✅ 部署脚本: --dry-run 模式测试通过
```

#### 待后续完善
- [ ] 部署脚本实际运行测试（需要服务器连接）
- [ ] 错误上报后端接口 `/api/log`（当前 fetch 会 404，但 beacon/localStorage 兜底）
- [ ] Sentry / LogRocket 第三方错误追踪服务集成（可选）

---

### 2026-05-31 会话 #3 — P2 收尾 + Phase 3 体验优化完成

#### 本次会话目标
完成 P2 剩余项（意见反馈）+ Phase 3 全部体验优化（滚动位置记忆、深色模式）。

#### 完成的工作

**1. 💬 意见反馈入口（P2 #22）**
- 新建 `src/shared/hooks/useFeedback.ts` — 反馈管理 hook
  - 4 种分类：💡功能建议 / 🐛Bug反馈 / 📚内容需求 / 💬其他
  - localStorage 加密持久化，最多保留 100 条
- 升级 `ProfileDrawer`：新增可折叠反馈区块 + 分类选择 + 发送按钮

**2. 📍 记住浏览位置（Phase 3）**
- 新建 `src/shared/hooks/useScrollRestoration.ts` — 通用滚动位置记忆 hook
- 接入 GalleryBoard / ScienceBoard / NeimenBoard 列表页

**3. 🌙 深色模式（Phase 3）**
- 新建 `src/shared/hooks/useTheme.ts` — light/dark/system 三种模式
- CSS 深色变量覆盖 + 平滑过渡动画
- ProfileDrawer 底部 ☀️/🌛 主题切换按钮

#### 文件变更清单

| 文件 | 变更类型 | 说明 |
|------|---------|------|
| `src/shared/hooks/useFeedback.ts` | **新建** | 反馈管理 CRUD hook |
| `src/shared/hooks/useScrollRestoration.ts` | **新建** | 滚动位置记忆 hook |
| `src/shared/hooks/useTheme.ts` | **新建** | 深色模式切换 hook |
| `src/shared/components/ProfileDrawer/index.tsx` | 修改 | 反馈入口 + 主题切换按钮 |
| `src/index.css` | 修改 | .dark 深色模式 CSS 变量 |
| `src/boards/GalleryBoard/List.tsx` | 修改 | useScrollRestoration |
| `src/boards/ScienceBoard/List.tsx` | 修改 | useScrollRestoration |
| `src/boards/NeimenBoard/List.tsx` | 修改 | useScrollRestoration |

#### 验证结果
```
✅ TypeScript: 零错误 | ✅ 构建: 2.90s | ✅ 部署: 成功 | ✅ 冒烟测试: 8/10
```

---

## 📝 开发日志

### 2026-05-31 会话 #2 — Phase 3 体验优化 + 心情记录功能

#### 本次会话目标
按架构计划推进 P2 剩余项和 Phase 3 体验优化：心情记录保存、页面转场动画、骨架屏加载、下拉刷新。

#### 完成的工作

**1. 📝 心情记录保存功能（P2 #21）**
- 新建 `src/shared/hooks/useMoodTracker.ts` — 完整的心情 CRUD hook
  - 8 种 emoji 快捷选择（😊🤩💪😐🤔😴😢❤️）
  - 每天一条记录，自动清理 90 天前数据
  - `saveSecure` 加密持久化到 localStorage
- 升级 `ProfileDrawer` 心情模块：
  - Emoji 选择栏（带选中高亮 + 缩放动画）
  - 文字输入 + 💾 保存按钮（输入后浮现）
  - 保存成功显示 ✅ 已保存提示（3秒后消失）
  - 底部展示最近 5 条历史心情记录（日期+emoji+文字）

**2. ✨ 页面转场动画（Phase 3）**
- 新建 `src/shared/components/PageTransition.tsx` — 零依赖纯 CSS 转场组件
- 新增 6 组 CSS keyframes 到 `index.css`：
  - `page-in-forward` — 列表→详情：右滑入
  - `page-in-back` — 详情→列表：左滑回
  - `page-out-forward/page-out-back` — 离场动画
  - `fade-in` — 淡入（Tab切换）
  - `scale-in` — 缩放淡入（弹窗/卡片）
- 智能方向判断：根据 pathname 自动识别前进/后退/Tab切换
- 全局生效：BoardLayout Outlet + 4 个全屏路由页都包裹了 PageTransition

**3. 🎴 骨架屏加载（Phase 3）**
- 新建 `src/shared/components/Skeleton.tsx` — 4 种预设骨架屏模板：
  - `SkeletonCardGrid` — 画廊风格（2列图片卡片骨架）
  - `SkeletonListRows` — 科学/社交风格（横向列表行骨架）
  - `SkeletonNeimenCards` — 内功风格（带色条卡片骨架）
  - `SkeletonDetail` — 详情页通用骨架
  - `SkeletonHeader` / `SkeletonCategoryTitle` — 头部/分类标题骨架
- 替换了 4 个列表页的 loading 状态：
  - GalleryBoard/List.tsx → `<Skeleton type="gallery" />`
  - ScienceBoard/List.tsx → `<Skeleton type="list" />`
  - NeimenBoard/List.tsx → `<Skeleton type="neimen" />`
  - SocialBoard/List.tsx → `<Skeleton type="list" />`

**4. 👇 下拉刷新（Phase 3）**
- 新建 `src/shared/components/PullToRefresh.tsx` — 纯 touch 事件实现，零依赖
  - 60px 触发阈值，阻尼弹性效果（越拉阻力越大）
  - 4 状态指示器：下拉中→释放刷新→刷新中→完成
  - 仅在容器 scrollTop=0 时激活（避免冲突）
- 接入 BoardLayout：所有 TabBar 页面自动支持下拉刷新
- useContentLoader 监听 `feiman-refresh` 自定义事件触发 refetch

#### Bug 修复
- TS6133 未使用导入错误：清理了各列表页多余的 Skeleton 子组件导入
- TS2305 导出缺失：将 SkeletonCategoryTitle 加入 components/index.ts 导出

#### 文件变更清单

| 文件 | 变更类型 | 说明 |
|------|---------|------|
| `src/shared/hooks/useMoodTracker.ts` | **新建** | 心情记录 CRUD hook |
| `src/shared/components/ProfileDrawer/index.tsx` | 修改 | 心情模块升级：emoji选择+保存+历史 |
| `src/shared/components/PageTransition.tsx` | **新建** | 页面转场动画组件 |
| `src/shared/components/Skeleton.tsx` | **新建** | 骨架屏组件库（4种模板） |
| `src/shared/components/PullToRefresh.tsx` | **新建** | 下拉刷新组件 |
| `src/shared/components/BoardLayout.tsx` | 修改 | 集成 PageTransition + PullToRefresh |
| `src/shared/components/index.ts` | 修改 | 新导出 3 个组件 |
| `src/router/index.tsx` | 修改 | 4个全屏路由包裹 PageTransition |
| `src/shared/hooks/useContentLoader.ts` | 修改 | 监听 feiman-refresh 事件 |
| `src/index.css` | 修改 | 新增 6 组 keyframes 动画 |
| `src/boards/GalleryBoard/List.tsx` | 修改 | loading→骨架屏 |
| `src/boards/ScienceBoard/List.tsx` | 修改 | loading→骨架屏 |
| `src/boards/SocialBoard/List.tsx` | 修改 | loading→骨架屏 |
| `src/boards/NeimenBoard/List.tsx` | 修改 | loading→骨架屏 |

#### 验证结果

```
✅ TypeScript 编译: 零错误 (tsc -b)
✅ Vite 生产构建: 成功 (2.76s, 2269 modules)
✅ PWA Service Worker: 26 entries precached (1630.98 KiB)
✅ SCP 部署: 成功 (CLAW.PEM 密钥)
✅ Puppeteer 冒烟测试: 8/10 通过
   - 数学/科学/社交/画廊/内功 列表页 ✅
   - 科学3D/画廊大图/内功卡片 ✅
   - 数学播放页 ⚠️ (老问题, VOD加载慢)
   - 社交阅读器 ⚠️ (老问题, 资源加载慢)
```

#### 待后续完善
- [ ] 深色模式（Phase 3 剩余项）
- [ ] 记住浏览位置（仅 SocialBoard 已实现，其他板块待加）
- [ ] 数学播放页 VOD 加载超时问题排查
- [ ] 社交阅读器首屏加载速度优化

---

#### 本次会话目标
将 fox-school 项目的社交绘本阅读引擎完整复刻到 feiman-v3-new，确保 UI 交互与原版一致。

#### 完成的工作

##### 1. 数据层修复（核心工作）

**问题链**：
1. 列表页空白 → Zod 校验失败 → audio 字段为空对象 `{}` 
2. 修复空 audio 后 → 只有 3 场景有音频（正则不匹配多种命名格式）
3. 增强正则后 → 26 场景有音频（还有 s06p1_zh.mp3 格式没覆盖）
4. 再次增强 → 82 场景有音频 ✅
5. 英文字幕全无 → Python raw string 中 Unicode 转义不解释为字符 → 改用原始中文字符 → 20 场景有英文旁白 ✅
6. 部署后发现还是旧数据 → MD5 不一致 → 强制 cp 覆盖 ✅

**发现的 4 种音频/图片命名格式**：
```
格式1 (标准): part1-zh.mp3 / part1-painting-spill.png    ← s-01, s09 等
格式2 (紧凑): s06p1_zh.mp3 / s06p1.jpg                  ← s06-s10
格式3 (前缀): s14-part1-zh.mp3 / s14-part1-aboo.png      ← s13-s27  
格式4 (下划线): s-32_part1_cn.mp3 / s-32_part1.jpg       ← s-32 到 s-65
```

最终正则: `(.*?)[_.\-]?p(?:art)?%d[_.\-]?(zh|cn|en)\.mp3$`

**JSON 生成脚本**: `scripts/fix-narration-v2.py` (服务器端执行，Python 3.6 兼容)

##### 2. Player.tsx 播放器 Bug 修复

**Bug: 切换绘本后播放按钮失效**
- 根因: `destroyAudio()` 用 `useCallback` 引用移除事件监听器，但切换场景后引用已变化(stale closure)，导致旧监听器残留、新音频无法绑定
- 修复: 引入 `onTimeUpdateRef`/`onEndedRef`/`onPauseRef` 三个 ref 持有最新函数引用；所有 add/removeEventListener 统一用 ref.current

**Bug: 英文字幕不显示**
- 根因: 数据层面 — 正则不匹配导致 0 场景提取到英文旁白
- 修复: 见上方第 5 点

##### 3. 分类说明
用户期望: 卡耐基 30个(6parts) + 社交故事(3parts)  
实际数据: 21个(6parts) + 65个(3parts) = 86 总  
→ 原始 fox-school 数据中只有 21 个场景有 6+ 张图片。如需调整分类标准请告知。

#### 文件变更清单

| 文件 | 变更类型 | 说明 |
|------|---------|------|
| `src/boards/SocialBoard/Player.tsx` | 修改 | 修复 stale closure 导致的播放按钮失效 |
| `src/boards/SocialBoard/ThoughtBubbleCard.tsx` | 未变 | renderBilingual 函数正常 |
| `src/boards/SocialBoard/types.ts` | 未变 | 类型定义正确 |
| `src/boards/SocialBoard/List.tsx` | 未变 | 列表页正常 |
| `scripts/final-fix.py` | 新建 | 完整数据生成脚本(Python 3.6兼容) |
| `scripts/fix-narration-v2.py` | 新建 | 最终版脚本(修复EN旁白提取) |
| `scripts/verify-player2.mjs` | 新建 | Puppeteer E2E 测试脚本 |
| `scripts/final-verify.mjs` | 新建 | 最终验证脚本 |
| 服务器 `/var/www/feiman-v3-new/data/social-scenes.json` | 更新 | v8, 205KB, 86场景 |

#### 验证结果 (Puppeteer E2E)

```
✅ 列表页: 21/21 卡耐基 + 65 社交故事, 0 warnings
✅ 播放/暂停: 暂停→播放→暂停 循环 3 次正常
✅ 场景切换: s16→s17 后播放按钮响应正常
✅ EN切换: 按钮 EN↔中 正常切换, 旁白文本变化
✅ Zod校验: 全部通过, 无控制台错误
```

---

## ⚠️ 下次开发注意事项

### 必读（每次开工前）
1. **先读此 CHANGELOG.md** 了解当前进度和已知问题
2. **检查线上状态**: `http://47.99.101.168:8890/social` 是否正常
3. **SSH 连接测试**: 确保 CLAW.PEM 密钥可用
4. **Python 版本注意**: 服务器是 **Python 3.6.8**！不支持 f-string、walrus operator、rf-string 等 3.7+ 语法
5. **Service Worker 缓存**: 部署新 JSON/JS 后可能需要清除浏览器缓存(Cmd+Shift+R)。nginx 的 `/data/` 已设 no-cache 但 SW precache 可能缓存旧版本

### 已知待解决问题
- [ ] **s28(壮壮最靠谱)** 和 **s29(球球怕水)**: 原始数据中没有音频文件，需要确认是否补充
- [ ] **s-21b** 和 **s-31b**: ID 冲突产生的副本，没有 images 目录，需确认原始数据
- [ ] **分类调整**: 用户提到卡耐基应该是约 30 个，目前只有 21 个 6-parts 的。如果需要把部分 3-parts 也归入卡耐基，需要明确标准
- [ ] **EN 旁白覆盖率**: 目前只有 20/86 场景有英文旁白（只有带精炼双语 text.md 的场景才有），其余 66 个场景的 text.md 是纯中文格式
- [ ] **Puppeteer 测试超时**: `networkidle2` 等待策略在某些页面容易超时，改用 `domcontentloaded` + 显式 wait 更稳定

### 服务器关键路径速查
```bash
# SSH 连接
ssh -i ~/Desktop/项目/CLAW.PEM root@47.99.101.168

# 部署 JSON
cp /tmp/social-scenes-full.json /var/www/feiman-v3-new/data/social-scenes.json

# 部署前端构建产物
scp -i ~/Desktop/项目/CLAW.PEM -r dist/* root@47.99.101.168:/var/www/feiman-v3-new/

# 检查 MD5 是否一致
md5sum /tmp/social-scenes-full.json /var/www/feiman-v3-new/data/social-scenes.json

# 检查 nginx 配置
cat /etc/nginx/conf.d/feiman-v3-new.conf

# 重启 nginx
systemctl restart nginx
```

### 常用调试命令
```bash
# 运行 Puppeteer E2E 测试
node scripts/final-verify.mjs

# 在服务器上检查 JSON 数据
python3 -c "import json; d=json.load(open('/var/www/feiman-v3-new/data/social-scenes.json')); print(len(d['sceneData']), 'scenes')"

# 检查音频目录
ls /var/www/feiman-v3-new/audio/<scene_id>/
ls /var/www/feiman-v3-new/images/<scene_id>/
```

---

## 🗓️ 版本历史

| 版本 | 日期 | 内容 | 状态 |
|------|------|------|------|
| v8 | 2026-05-30深夜 | 修复 EN 旁白正则, 20场景有双语; 音频 82/86; Player stale closure 修复 | ✅ 已部署 |
| v7 | 2026-05-30晚间 | 增强4种音频格式正则, 26场景有音频 | ⚠️ 被v8替代 |
| v6 | 2026-05-30下午 | 首次完整同步 332图+618音频, 修复空audio Zod错误 | ⚠️ 被v8替代 |
| v1-v5 | 2026-05-30白天 | 多次迭代: 从零搭建→列表页→播放器→数据迁移→各种bug修复 | 归档 |

### 2026-05-30 会话 #1.5 — 项目文档整理

#### 完成的工作

1. **创建 CHANGELOG.md** — 项目进度日志文件，包含：
   - 当前状态总览（6大板块完成度）
   - 完整开发日志（问题链→修复→验证）
   - 已知待解决问题清单
   - 服务器命令速查表
   - 版本历史

2. **复制 ARCHITECTURE.md 到项目内** — 从 `feiman-v3/ARCHITECTURE.md` 复制到 `feiman-v3-new/ARCHITECTURE.md`，方便随时查阅完整架构设计（1800+行）

3. **更新 Skill 文件 (SKILL.md)** — 新增第八节「开发前必读」：
   - 第一步：阅读 CHANGELOG.md + ARCHITECTURE.md（双文档必读）
   - 第二步：运行 E2E 验证检查线上状态
   - 第三步：注意 5 个常见陷阱（Python 3.6 / SW缓存 / SSH路径 / 音频格式 / Zod校验）
   - 第四步：每次工作结束后必须更新日志

#### 文件变更清单

| 文件 | 操作 | 说明 |
|------|------|------|
| `CHANGELOG.md` | 新建 | 项目进度日志 |
| `ARCHITECTURE.md` | 从 feiman-v3 复制 | 完整架构设计文档 |
| `.catpaw/skills/feiman-project/SKILL.md` | 更新 | 新增第八节开发前必读指引 |

---

### 2026-05-31 会话 #2 — 三大空板块搭建 + 社交滚动位置修复

#### 本次会话目标
把科学3D可视化、童画廊、内功养生法三个空板块从 EmptyState 占位壳搭建成完整功能；同时修复社交训练返回列表滚动位置丢失的问题。

#### 完成的工作

##### 1. 社交训练：返回列表记住滚动位置
- **问题**: 从绘本阅读器返回列表时，总是回到顶部，丢失之前浏览的位置
- **方案**: 模块级变量 `savedScrollY` 记录滚动位置 + `useRef` 绑定容器 + `requestAnimationFrame` 恢复
- **修改文件**: `src/boards/SocialBoard/List.tsx`

##### 2. 科学3D可视化板块（全新搭建）

**依赖安装**: `three` + `@react-three/fiber` + `@react-three/drei`

**数据层** (`public/data/science.json`):
- 4 大分类：物理世界⚛️、化学奇观🧪、生命科学🦠、地球与宇宙🌍
- 共 11 个 3D 场景（原子结构、太阳系、DNA双螺旋、波的干涉、分子模型、晶体结构、细胞探秘、血液循环、地球内部、月相变化、板块构造）

**组件**:
- `List.tsx` — 场景列表页，按分类展示，每个场景显示标题/描述/难度/时长
- `Player.tsx` — 全屏 3D 播放页（~600行），包含：
  - 11 个独立 3D 场景实现（原子电子轨道动画、太阳系公转、DNA双螺旋、波干涉网格、晶体格子、地球分层、水分子、月相、细胞器、红细胞流动、板块构造）
  - OrbitControls 自动旋转 + 手动拖拽/缩放
  - 上一个/下一个场景导航
  - 操作提示自动隐藏
  - OG 标签动态更新

**路由**: `/science/:id` → SciencePlayer（全屏，无 TabBar）

##### 3. 童画廊板块（全新搭建）

**数据层** (`public/data/gallery.json`):
- 3 大分类：文艺复兴🏛️、印象派🎨、中国书画🖌️
- 共 8 幅名画（蒙娜丽莎、创造亚当、雅典学院、星月夜、睡莲、舞蹈课、清明上河图、千里江山图）
- 每幅作品含：标题、艺术家、年代、描述（艺术赏析文字）

**组件**:
- `List.tsx` — 瀑布流画廊列表（grid-cols-2），按分类展示作品卡片（封面图+标题+艺术家）
- `Viewer.tsx` — 全屏大图欣赏页，包含：
  - 自适应大图展示
  - 左右切换按钮 + 键盘方向键导航
  - 底部信息栏（标题/艺术家/年代/赏析文字/计数器）
  - 点击图片区域显示/隐藏信息
  - ESC 返回列表

**路由**: `/gallery/:id` → GalleryViewer（全屏，无 TabBar）

##### 4. 内功养生法板块（全新搭建）

**数据层** (`public/data/neimen.json`):
- 3 大分类：呼吸调息🌬️、静心冥想🧘、体态调整🧍
- 共 6 张养生卡片（腹式呼吸、4-7-8放松呼吸、身体扫描、正念呼吸、猫牛式伸展、坐姿矫正）
- 每张卡片含：标题、副标题、详细内容（步骤说明）、要点提示(tips)

**组件**:
- `List.tsx` — 卡片列表页（grid-cols-2），每张卡片带色条+封面+标题预览
- `CardDetail.tsx` — 卡片详情页（翻转交互），包含：
  - CSS 3D 翻转效果（rotateY 180deg）
  - 正面：封面图 + 标题 + 副标题
  - 背面：详细内容（支持多行文本）+ 要点提示列表
  - 点击/空格/回车 触发翻转
  - 左右切换卡片导航
  - 键盘方向键 + ESC 支持

**路由**: `/neimen/:id` → NeimenCardDetail（全屏，无 TabBar）

##### 5. 类型系统升级

所有三个新板块的数据格式都采用了**分类(categories) + 兼容旧格式**的双模式设计：
- `ScienceDataSchema`: categories (ScienceCategory[]) + scenes (Scene[]) 兼容
- `GalleryDataSchema`: categories (GalleryCategory[]) + artworks (Artwork[]) 兼容
- `NeimenDataSchema`: categories (NeimenCategory[]) + cards (Card[]) 兼容
- CardSchema 新增 `tips` 字段（字符串数组）
- validator.ts fallback 数据同步更新

#### 文件变更清单

| 文件 | 变更类型 | 说明 |
|------|---------|------|
| `src/boards/SocialBoard/List.tsx` | 修改 | 滚动位置记忆功能 |
| `src/boards/ScienceBoard/List.tsx` | **新建** | 科学场景列表页（按分类展示） |
| `src/boards/ScienceBoard/Player.tsx` | **新建** | 3D播放页（11个场景，react-three-fiber） |
| `src/boards/ScienceBoard/index.tsx` | 修改 | 导出 List 组件 |
| `src/boards/GalleryBoard/List.tsx` | **新建** | 画廊列表页（瀑布流） |
| `src/boards/GalleryBoard/Viewer.tsx` | **新建** | 全屏大图欣赏页 |
| `src/boards/GalleryBoard/index.tsx` | 修改 | 导出 List 组件 |
| `src/boards/NeimenBoard/List.tsx` | **新建** | 养生卡片列表页 |
| `src/boards/NeimenBoard/CardDetail.tsx` | **新建** | 卡片翻转详情页 |
| `src/boards/NeimenBoard/index.tsx` | 修改 | 导出 List 组件 |
| `src/router/index.tsx` | 修改 | 新增 3 条全屏路由 (/science/:id, /gallery/:id, /neimen/:id) |
| `src/types/content.ts` | 修改 | 3 个 Schema 升级为分类格式 + CardSchema 新增 tips |
| `src/shared/utils/validator.ts` | 修改 | 3 个 fallback 数据添加 categories 字段 |
| `public/data/science.json` | 重写 | 4分类 11场景 |
| `public/data/gallery.json` | 重写 | 3分类 8幅名画 |
| `public/data/neimen.json` | 重写 | 3分类 6张卡片 |
| `package.json` | 修改 | 新增 three + @react-three/fiber + @react-three/drei |

#### 验证结果

```
✅ TypeScript 编译: 零错误 (tsc --noEmit)
✅ Vite 生产构建: 成功 (2.64s)
✅ PWA Service Worker: 25 entries precached
✅ 路由配置: 5 个全屏页面路由全部就位
```

#### 待后续完善
- [ ] 3D 场景缩略图（当前用渐变色占位）
- [ ] 名画图片资源（当前用占位符）
- [ ] 养生卡片封面图片
- [ ] 移动端适配细节优化
- [ ] 部署到服务器并测试

---

## 🗓️ 版本历史

| 版本 | 日期 | 内容 | 状态 |
|------|------|------|------|
| v12 | 2026-05-31 | 部署防错体系+错误监控系统 (deploy.sh + pre-deploy-check + icon类型安全 + DevErrorPanel) | ✅ 已部署 |
| v11 | 2026-05-31 | 意见反馈+滚动位置记忆+深色模式 (P2收尾+Phase3完成) | ✅ 已部署 |
| v10 | 2026-05-31 | 心情记录+转场动画+骨架屏+下拉刷新 (Phase 3体验优化) | ✅ 已部署 |
| v9 | 2026-05-31 | 三大空板块搭建(科学3D+画廊+内功)+社交滚动位置修复 | ✅ 已部署 |
| v8 | 2026-05-30深夜 | 修复 EN 旁白正则, 20场景有双语; 音频 82/86; Player stale closure 修复 | ✅ 已部署 |
| v7 | 2026-05-30晚间 | 增强4种音频格式正则, 26场景有音频 | ⚠️ 被v8替代 |
| v6 | 2026-05-30下午 | 首次完整同步 332图+618音频, 修复空audio Zod错误 | ⚠️ 被v8替代 |
| v1-v5 | 2026-05-30白天 | 多次迭代: 从零搭建→列表页→播放器→数据迁移→各种bug修复 | 归档 |

---

### 2026-06-02 会话 #6 — Safari横屏适配 + PWA图标 + 测试刷新按钮

#### 本次会话目标
解决社交绘本在iPhone Safari上无法自动横屏的问题，补齐PWA图标，添加测试用刷新按钮。

#### 完成的工作

**1. 🔧 社交绘本播放器横屏适配 (SocialBoard/Player.tsx)**
- 移除 Safari 不支持的 `screen.orientation.lock()` API
- 添加竖屏提示遮罩：手机竖屏时显示"请横屏使用"全屏提示
- CSS 媒体查询控制：
  - 手机竖屏（≤768px）：显示提示，隐藏播放器
  - 手机横屏/桌面端：正常显示播放器
  - iPad 竖屏：允许使用，自动缩小适配

**2. 🖼️ PWA 图标补齐**
- 生成 `public/icon-192.png`（192×192，绿色圆形白字"F"）
- 生成 `public/icon-512.png`（512×512，同上）
- 修复 PWA "添加到主屏幕" 白屏问题

**3. 🔄 测试用刷新按钮 (App.tsx)**
- 右下角固定绿色圆形按钮，带旋转箭头图标
- 点击强制刷新页面（`location.reload()`）
- 方便 PWA 测试时手动获取最新版本

#### 文件变更清单

| 文件 | 变更类型 | 说明 |
|------|---------|------|
| `src/boards/SocialBoard/Player.tsx` | 修改 | 移除 Screen Orientation API，添加竖屏提示遮罩 |
| `public/icon-192.png` | **新建** | PWA 192×192 图标 |
| `public/icon-512.png` | **新建** | PWA 512×512 图标 |
| `src/App.tsx` | 修改 | 添加右下角测试刷新按钮 |

#### 验证结果
```
✅ TypeScript 编译: 零错误
✅ Vite 生产构建: 成功
✅ PWA Service Worker: 39 entries precached（包含图标）
```

#### 待后续完善
- [ ] 社交绘本：手机横屏后的实际显示效果验证
- [ ] PWA：真机"添加到主屏幕"流程测试
- [ ] 科学3D：继续改造新交互架构

---

### 2026-06-02 热修复 — TabBar 显示 + PWA 全面优化

#### 修复内容

**1. 🔧 内门板块 TabBar 不显示**
- **根因**: `PageTransition` 组件使用 `minHeight: '100%'` 内联样式，导致子组件 `h-full` 高度计算异常，在内容较少时布局塌陷
- **修复**: 将 `minHeight: '100%'` 改为 Tailwind `h-full` 类，确保高度正确传递
- **文件**: `src/shared/components/PageTransition.tsx`

**2. 📱 PWA 全面优化（iOS Safari standalone 模式）**

**问题现象**：
- PWA 图标初始很小，点击后变大
- 底部出现浏览器返回/分享/关闭按钮
- 整体感觉像浏览器而非独立 App

**根因分析**：
- 缺少 `apple-touch-icon` — iOS 添加到主屏幕时优先使用此图标，而非 manifest icons
- 只有 2 个尺寸图标（192/512）— iOS 需要多尺寸（120/152/167/180）
- manifest 缺少 `scope` 字段 — iOS 无法正确识别 PWA 范围
- `theme-color` 与 `background_color` 不一致

**修复措施**：

| 文件 | 变更 |
|------|------|
| `index.html` | 添加 3 个 `apple-touch-icon`（120/152/180）、添加 `apple-mobile-web-app-title`、整理 meta 标签顺序 |
| `public/manifest.json` | 添加 `scope: "/"`、`start_url` 带 `?source=pwa`、8 个完整图标列表（含 maskable）、`theme-color` 与背景色一致、添加 `categories` |
| `public/*.png` | 新增 9 个尺寸的 PWA 图标（72/96/120/128/144/152/167/180/384） |
| `src/index.css` | 新增 `.safe-area-pb` / `.safe-area-pt` 安全区域适配类 |
| `vite.config.ts` | `includeAssets` 添加 `*.png` 通配符 |
| `scripts/gen-pwa-icons.py` | 新建：PWA 图标批量生成脚本 |

#### 验证结果
```
✅ TypeScript: 零错误
✅ Vite 构建: 成功 (3.24s)
✅ PWA Service Worker: 59 entries precached（含全部图标）
✅ 部署: 成功上传到服务器
```

**⚠️ 重要提示**：iOS 用户需要**删除旧的主屏幕快捷方式，重新「添加到主屏幕」**才能生效！

---

### 2026-06-02 紧急修复 — PWA 图标未部署（deploy.sh Bug）

#### 问题
iOS Safari 无法识别为 PWA，以普通快捷方式模式运行（有浏览器工具栏、图标变小等）

#### 根因
`deploy.sh` 的远程部署脚本中，静态资源同步只包含了 `favicon.svg`、`manifest.json`、`robots.txt` 三个文件，**完全没有同步 `*.png` 图标文件**。导致服务器上缺少所有 PWA 图标（apple-touch-icon、icon-*.png），iOS Safari 找不到图标 → 不识别为 PWA → 降级为快捷方式。

#### 修复
1. **手动上传**了 11 个 PNG 图标到服务器
2. **修复 deploy.sh**：将 PNG 同步从 `for` 循环通配符改为 `find -exec` 命令（SSH heredoc 中通配符不展开是已知坑）
3. 验证所有图标 HTTP 200 可访问

#### 文件变更
| 文件 | 变更 |
|------|------|
| `deploy.sh` | 添加 `find ... -name '*.png' -exec cp` 同步 PWA 图标 |

---

> 最后更新: 2026-06-02
> 下次更新: 下一次开发会话结束时
