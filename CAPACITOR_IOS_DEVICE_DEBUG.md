# Capacitor iOS 真机调试指南

> 适用: 小纸条 V3.x / V4(啊哈时刻)
> 目标: 在 iPhone 真机跑通 App,验证录音 / 摄像头 / 通知 / PWA / API 联调
> 写给: 1 人开发者,无 iOS 经验(纯 Web 出身),Mac 已装 Xcode

---

## 0. 这文档跟 `CAPACITOR.md` 的区别

`CAPACITOR.md` 是 **打包上架指南**(注册 Apple Developer $99、Archive、上传 App Store Connect)。
本文是 **真机调试指南**:**不花 1 块钱、不用上架**也能把 App 装到自己 iPhone 上跑,只是 7 天后要重装(免费 Apple ID 限制)。

适合场景:
- ✅ 上线前先在真机自测录音 / 摄像头 / 横竖屏 / 弱网
- ✅ 给产品截图、给朋友预览
- ✅ 排查 Web 模拟器里重现不了的真机 bug
- ❌ 不适合: 真要给用户用 → 必须走 `CAPACITOR.md` 流程上架

---

## 1. 准备清单(1 次性,~30 分钟)

| 准备 | 是什么 | 没有的话 |
|---|---|---|
| Mac(macOS 12+) | Xcode 只跑 macOS | 真没法装 iOS App(没 mac 找朋友) |
| Xcode 15+ | App Store 装免费 | 缺这个下面都做不了 |
| iPhone + 数据线 | 真机调试要 USB 连 | 模拟器不测摄像头/麦克风 |
| Apple ID(免费) | 签名用 | 不用付费!免费 ID 也能签名 + 装到自己手机 |
| Node 20+ | 装 web 依赖 | `node --version` 看 |

### 1.1 装 Xcode(已装跳过)

```bash
# 看版本
xcode-select -p
# 输出 /Applications/Xcode.app/Contents/Developer 就 OK
# 没装就 App Store 搜 Xcode 装,装完跑一次同意 license
sudo xcodebuild -license accept
```

### 1.2 免费 Apple ID 能干什么

- ✅ 装 App 到 **自己 3 台以内**的 iPhone(注册过的设备)
- ✅ 跑真机调试 + 看 console 日志
- ❌ 7 天后 App 自动失效,得 Xcode 重装(开发够用)
- ❌ 不能上 App Store
- ❌ 不能给别人手机装

**先不用付 $99**,真要上架时再注册 Apple Developer Program。

---

## 2. 首次打开项目(2 分钟)

```bash
cd /Users/liuzhen/Documents/lingxi-claw/20260605-14-20-02-486/feiman-v3-new

# 装依赖(已有 node_modules 跳过)
npm install

# 看 capacitor 状态(每行都打 ✅ / ⚠️ 就 OK)
npx cap doctor
```

预期看到:

```
✓ Capacitor CLI installed (latest)
✓ @capacitor/ios installed
✓ iOS project created at ios/
✓ ios platform API version: 16+
✓ Native packages installed
```

### 2.1 打开 Xcode 项目

```bash
npm run cap:ios
# 等几秒会自动跳到 Xcode
```

> **没自动跳** 就手动:
> `open ios/App/App.xcodeproj`

---

## 3. 配 Team(签名,3 分钟)

Xcode 左侧栏点 **App** 项目 → 中间选 **Signing & Capabilities** Tab。

```
┌──────────────────────────────────────────┐
│ Signing                                   │
│   ☐ Automatically manage signing (✅ 勾) │
│   Team: [选你的 Apple ID] (下拉)           │
│   Bundle Identifier: com.feiman.letters    │
│   Provisioning Profile: (自动)             │
└──────────────────────────────────────────┘
```

**Team 下拉没东西** → 点 **Add Account...** → 登录 Apple ID → 选 **Personal Team**(免费)

⚠️ **Bundle ID 撞名处理**(理论上免费 ID 也不能用 `com.feiman.letters`):
- 把 Bundle ID 改成 `com.feiman.letters.YOURNAME`(你 Apple ID 前缀)
- 改完要 `npm run cap:sync` 同步一次(否则 Xcode 还是旧值)
- ⚠️ 改 ID 意味着真机重装,先确定再改

---

## 4. 插 iPhone + 选设备(2 分钟)

1. **数据线连 Mac**(用原装或 MFi 认证线,便宜线经常断)
2. iPhone 弹窗 **"信任此电脑"** → 输密码 → 点 **信任**
3. Mac 上 Xcode 顶部 **设备下拉**(▶️ 旁边) → 选 **你的 iPhone**(不是模拟器)

```
Scheme: App     Destination: [选 iPhone]    [Run ▶]
```

### 4.1 第一次"无法验证开发者"

装完第一次打开 App,iPhone 会弹:
> "未受信任的开发者"

iPhone 操作:**设置 → 通用 → VPN 与设备管理 → 开发者 App → 信任**

---

## 5. 跑起来 + 看日志(关键)

点 Xcode **▶️ Run**(快捷键 ⌘R),第一次会:
- 编译(1-3 分钟)
- 装到 iPhone
- 自动启动

预期:iPhone 上看到 "小纸条" 启动图 → 进入 App 首页。

### 5.1 看 console 日志(排错必看)

Xcode 底部 **Debug Area**:
- `⌘ + Shift + Y` 打开 / 隐藏
- 选 **Console** Tab
- 看到 `console.log()`、`fetch` 错误、Cordova 插件日志

### 5.2 真机 chrome/safari 调试(看网络/元素)

App 本质是 WKWebView,可以用 Safari 开发者工具看 DOM/网络:

**iPhone**:
1. `设置 → Safari → 高级 → Web 检查器: 开`

**Mac Safari**:
1. `Safari → 开发 → [你的 iPhone] → [App URL]`
2. 出来 Web Inspector,跟 Chrome DevTools 一样

⚠️ **看不到 iPhone 项**:
- 确认数据线连着
- iPhone 解锁状态
- 重新拔插数据线
- Xcode 还得在选你 iPhone(不能是模拟器)

---

## 6. V3 / V4 特有功能调试清单

| 功能 | 测试方法 | 没工作排查 |
|---|---|---|
| **啊哈录音** | AhaPage → 长按麦克风说话 | iPhone 没授权:`设置 → 小纸条 → 麦克风: 开` |
| **头像相册选择** | 资料页 → 换头像 | iPhone 没授权:`设置 → 小纸条 → 照片: 全部` |
| **拍照** | 写新信/资料 → 拍一张 | iPhone 没授权:`设置 → 小纸条 → 相机: 开` |
| **WS 实时推送** | 同时打开 web 端发信,iPhone 收 toast | 服务器端口 8890 通:`curl http://47.99.101.168:8890/api/health` |
| **PWA 提醒(B4)** | 等 22:00 / AhaPage 看 prompt | 装到主屏才完整支持(见 §8) |
| **本地存储(audio blob)** | AhaPage → 切本地 → 录 | DevTools → Application → IndexedDB |

### 6.1 录音没声音 / 提示没权限

```bash
# 看 Info.plist 有没有这 3 行(已加,确认存在)
grep -A1 "NSMicrophoneUsageDescription" ios/App/App/Info.plist
grep -A1 "NSPhotoLibraryUsageDescription" ios/App/App/Info.plist
grep -A1 "NSCameraUsageDescription" ios/App/App/Info.plist
```

### 6.2 API 连不上(白屏 / 一直 loading)

V3 默认 `capacitor.config.ts` 的 `server.url: 'http://47.99.101.168:8890'`。

如果服务器 IP 变了:
```bash
# 1. 改文件
sed -i '' 's|http://47.99.101.168:8890|http://新IP:8890|' capacitor.config.ts

# 2. 同步
npm run cap:sync

# 3. Xcode 重跑 ⌘R
```

---

## 7. 改 web 代码后重新跑(高频操作)

改了 `src/` 下任何代码 → 真机 App 看到的还是旧版。需要重 build + sync + 重跑。

```bash
# 一条龙(2-3 分钟)
npm run build && npm run cap:sync
# 回 Xcode,⌘R 重跑
```

### 7.1 加速:Live Reload(改完秒看)

开发期不用每次重 build,把 web 跑在本地,Vite HMR 实时推:

```bash
# 终端 1:Vite dev server(本地)
npm run dev
# 启动后看:  ➜  Local: http://localhost:5173

# 改 capacitor.config.ts(临时改!调试完改回线上 IP)
#   server.url: 'http://你 Mac 的 LAN IP:5173'
#   例:192.168.1.100(看 Mac 偏好设置 → 网络 → IP)

npm run cap:sync
# Xcode ⌘R 跑
```

现在改 React 代码 → iPhone App 实时刷新(比原生 React Native 慢半秒,Vite HMR)。

⚠️ **调试完一定要改回** `http://47.99.101.168:8890`(`git checkout capacitor.config.ts` 然后 `cap:sync`),不然发包会指向本地 IP,装到别人手机就连不上。

---

## 8. PWA 完整功能: 装到主屏

iOS Safari 16.4+ 才完整支持 PWA 提醒/后台。装主屏:

1. iPhone 用 **Safari**(不是 Chrome)打开 `http://47.99.101.168:8890`
2. 点底部 **分享按钮** → **添加到主屏幕**
3. 桌面出现 "小纸条" 图标 → 点开是全屏(无 Safari UI)
4. 跟 Xcode 装的 Capacitor 版功能一致(都是 WKWebView 套 web)

| 对比 | Safari 主屏 PWA | Capacitor Xcode 装 |
|---|---|---|
| 安装方式 | Safari 分享 | Xcode ⌘R |
| 提醒 / 后台 | 16.4+ 完整 | 16+ OK |
| 离线 | ✅ | ✅ |
| 装到别人手机 | 对方加主屏就行 | 需付 $99 + 上架 |
| 录音/摄像头 | ✅ | ✅ |

**调试 PWA 提醒/Service Worker 用 Safari 主屏版更快**(不用每次重 build + Xcode 重装)。

---

## 9. 常见坑(速查)

| 现象 | 原因 | 修复 |
|---|---|---|
| Xcode 不显示 iPhone | 数据线 / 信任未点 | 拔插 + iPhone 点信任 |
| Build 失败 "Code Signing" | Team 没选 | §3 重选 Team |
| 装上打开立刻闪退 | 看 Xcode console | 大概率是 `server.url` 连不上 |
| 真机白屏一直转 | API 地址不通 | `curl http://47.99.101.168:8890/api/health` |
| 7 天后 App 打开变灰 | 免费签名过期 | Xcode 重新 ⌘R 装一次 |
| 修改 Bundle ID 后 Xcode 还认旧的 | 没 sync | `npm run cap:sync` |
| 改了 web 代码 App 没变 | 没重 build | §7 跑一次 build + sync + ⌘R |
| iOS 17+ 录不了音 | 麦克风权限 | `设置 → 小纸条 → 麦克风: 开` |
| `npx cap doctor` 报红 | Xcode 路径 / iOS SDK | `sudo xcode-select --reset` |

---

## 10. 调试完怎么保留 Xcode 项目

⚠️ **重要**:`ios/` 目录是 `cap add` 生成的,但**已经 commit 进 git**(`.gitignore` 留了例外),所有修改都跟着仓库走。

- ✅ 改了 `Info.plist`(权限、Bundle ID)→ commit
- ✅ 改了 `AppIcon.appiconset/`(换图标)→ commit
- ❌ 不要 commit `ios/App/App/public/`(build 产物,gitignore 忽略)
- ❌ 不要 commit `ios/App/Pods/`(CocoaPods 依赖,别人 `pod install` 即可)

```bash
git status
# 改了什么一目了然,跟 web 代码一样 commit 即可
```

---

## 11. 完事确认清单(给你 / 给团队)

跑通下面的就 OK:

- [ ] iPhone 装了 App,首页能开
- [ ] 注册 / 登录 走通(token 存 localStorage)
- [ ] 写一封信,自己能在"我发出的"看到
- [ ] 啊哈页面: 录一段音(给麦克风权限一次)
- [ ] 啊哈页面: 切本地模式,录完刷新还在
- [ ] 一条 aha → 转公开 letter,生成链接可访问
- [ ] 同时开 web 端发信,iPhone App 收到 WS 推送
- [ ] Safari 主屏 PWA 版能装能跑

---

## 12. 工具命令速查

```bash
# 看 cap 状态
npx cap doctor

# web build + 同步到原生(改了 web 必跑)
npm run build && npm run cap:sync

# 只 copy web(没改 plugin)
npx cap copy

# 改 web 后秒推(需本地 dev server + 改 server.url)
#   见 §7.1

# 升级原生依赖(cap 升 / 装新 plugin)
npx cap update

# 看 iOS 模拟器(没真机时用)
npm run cap:ios
# Xcode 设备选 "iPhone 15 Pro" 等模拟器
```

---

## 13. 下一步(真要上线)

走 `CAPACITOR.md`:
1. 注册 Apple Developer Program($99/年,1-2 天审核)
2. 在 `developer.apple.com` 创 App ID = `com.feiman.letters`
3. 换 Distribution 证书
4. 阿里云申请 SSL 证书,把 `capacitor.config.ts` 改 `https://域名`
5. iOS `Info.plist` 删 ATS 例外
6. Xcode → Product → Archive → 上传 App Store Connect
7. 填 `APP_STORE_METADATA.md` 的素材 + 提交审核

---

**状态**: 真机调试指南完成,无需付费 / 上架即可全功能自测
**前提**: Mac + Xcode + 免费 Apple ID + iPhone 即可
