# Capacitor App 打包指南 — 小纸条 V3.7

## 目标

把 Vite 打的 web 包封成 iOS / Android 原生 App,从 App Store / Google Play 上线。

## 当前状态(2026-06-07)

✅ **代码就绪**:
- `capacitor.config.ts` 已配(`appId: com.feiman.letters` + `appName: 小纸条`)
- `ios/App/App.xcodeproj` 已生成,可直接 Xcode 打开
- `android/app/` 已生成,Android Studio 可直接打开
- **ATS 例外**: iOS `Info.plist` 允许 `47.99.101.168` http 加载(临时)
- Web bundle 同步进 `ios/App/App/public/` 和 `android/app/src/main/assets/public/`(`cap add` 自动 copy)
- `package.json` 加了 4 个脚本:`cap:sync` / `cap:ios` / `cap:android` / `cap:build:ios`

❌ **未做(需要付费账号 + 签名工具链)**:
- iOS 证书(Apple Developer Program, $99/年)
- iOS 发布 ipa(需要 Xcode + 真机/模拟器)
- Android 签名 keystore
- Android release apk/aab

## 立即可跑(macOS 端)

```bash
# 1. 重新 build web(改了 Sentry / 其他之后)
npm run build

# 2. 同步到原生项目
npm run cap:sync

# 3a. iOS — Xcode 打开
npm run cap:ios
# 在 Xcode: Product → Run(模拟器)或插 iPhone 真机跑

# 3b. Android — Android Studio 打开
npm run cap:android
# Android Studio: Run ▶
```

## 一次性准备: iOS 开发者账号

1. 注册 [Apple Developer Program](https://developer.apple.com/programs/)(个人/公司 $99/年,审核 1-2 天)
2. Xcode → Settings → Accounts → 登录 Apple ID
3. 创建 App ID: `com.feiman.letters`(要和 `capacitor.config.ts` 一致)
4. 创建 Provisioning Profile(Development + Distribution)
5. Xcode 选 Team + 自动签名(Automatic Signing)
6. Product → Archive → Distribute App → App Store Connect → 上传

## 一次性准备: Android 签名

1. Android Studio → Build → Generate Signed Bundle / APK
2. 选 APK / AAB,创建 keystore(**本地保管,丢失无法更新 App!**)
3. minify 选 ProGuard,target 选 Google Play(AAB)
4. 上传 Google Play Console($25 一次性注册)

## 提交到应用商店

### App Store

1. App Store Connect → 我的 App → 新建
2. 填 App 信息(名称/副标题/截图/描述/关键词)
3. 选刚才 Archive 的 build
4. 提交审核(通常 1-3 天)

### Google Play

1. Google Play Console → 创建应用
2. 填商店信息(描述/截图/分类)
3. 上传 AAB,内部测试 → 正式发布
4. 审核通常几小时

## 配置细节

### 1. webview 加载线上

`capacitor.config.ts` → `server.url: 'http://47.99.101.168:8890'`

app 启动时 webview 加载真 URL → API 走同源。

⚠️ **正式上线前必须换 https**:
1. 阿里云申请免费 SSL 证书
2. nginx 配 `listen 443 ssl`
3. capacitor.config.ts 改 `url: 'https://域名'` + `cleartext: false`
4. iOS `Info.plist` 删 ATS 例外
5. 重新 build + sync

### 2. 应用图标 + 启动画面

- **iOS**: 替换 `ios/App/App/Assets.xcassets/AppIcon.appiconset/` 里所有尺寸 PNG
- **Android**: 替换 `android/app/src/main/res/mipmap-*/ic_launcher.png` + `android/app/src/main/res/drawable/splash.png`

用 [figma.com](https://figma.com) 做一个 1024×1024 logo,用 [appicon.co](https://appicon.co) 一键导出所有尺寸。

### 3. 离线降级

web 包本地有完整 dist,断网时:
- ✅ 看历史信(localStorage 缓存)
- ❌ 发新信(需 API)
- ❌ 登录/注册(需 API)
- ❌ 收新信(WS 推送)

UI 已经有 401/网络失败降级,断网时按钮点不动 + toast 提示。

## 已知坑

1. **PWA Service Worker** 在 Capacitor 容器里行为不同。`vite-plugin-pwa` 的 `registerType: 'autoUpdate'` 仍 work,但 `workbox` 路径在原生 webview 可能要重写。
2. **微信 OAuth / 第三方登录** 在 webview 里要 Universal Links / App Links 配置,跟 PWA 流程不同。V3.7 不集成,等真要做再补。
3. **Push 通知** 要 FCM(Android) / APNs(iOS),需要单独配。V3.7 暂用 WebSocket + 弹窗,不真推。
4. **App Store 审核 4.0 / 4.2** 可能被拒(纯壳子 app),建议 App 至少做一个"原生壳独有"的能力(真推送 / NFC / 本地存储同步)。
5. **iOS 9+ Webview** 内存压力:大 JS bundle(我们 ~700KB gzip)可能低端机闪退。Capacitor 默认带 `WKWebView` + 内存优化,问题不大。

## 后续动作

- [ ] 用户用 [figma.com](https://figma.com) 做 logo(2 小时)
- [ ] 用 [appicon.co](https://appicon.co) 导出所有尺寸
- [ ] 注册 Apple Developer / Google Play(等审核 1-2 天)
- [ ] 用 Xcode / Android Studio 跑一次,确认 web 端 API 通
- [ ] 按上面的"提交到应用商店"流程上传

## 工具命令速查

```bash
# 看 capacitor 项目状态
npx cap doctor

# 同步 web → 原生(改了 web 后必跑)
npx cap sync

# 只 copy web(改 web 但没改 plugin)
npx cap copy

# 只更新 plugin(改了 package.json 装了新 plugin)
npx cap update

# 看 iOS / Android 原生日志
npx cap run ios --target=<device-id> --livereload
npx cap run android --livereload
```

## 文件结构

```
.
├── capacitor.config.ts      # 主配置(appId, name, server.url, plugins)
├── ios/                     # iOS 原生项目(Xcode 打开 App/App.xcodeproj)
│   └── App/
│       ├── App.xcodeproj/   # Xcode 项目
│       ├── App/             # 主 app 目录
│       │   ├── Info.plist   # 权限 + ATS 配置
│       │   ├── public/      # web bundle copy(已 gitignore)
│       │   └── Assets.xcassets/  # 图标 + 启动图
│       └── CapApp-SPM/      # Swift Package Manager 依赖
└── android/                 # Android 原生项目(Android Studio 打开)
    └── app/
        ├── build.gradle
        └── src/main/
            ├── assets/public/  # web bundle copy(已 gitignore)
            └── res/         # 图标 + 启动图
```

---

**状态**: Capacitor 段 2 收口(代码 100%,账号/签名/审核 = 用户操作)
