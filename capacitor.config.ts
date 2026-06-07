/**
 * ============================================================
 *  Capacitor 配置 — 小纸条 V3.7
 *
 *  用途: 把 Vite 打的 web 包封成 iOS / Android 原生 app
 *  状态: 代码就绪,build 由用户 Xcode / Android Studio 触发
 *
 *  不做的事:
 *  - 不打 release 签名 ipa/apk(需要付费开发者账号 + macOS/Windows 端工具链)
 *  - 不集成 Capacitor Push(暂用 WebSocket,真要 push 再加 FCM/APNs)
 *  - 不集成 InAppBrowser(分享走系统 share sheet)
 *
 *  build 流程(macOS 端):
 *    npm run build
 *    npx cap sync ios
 *    cd ios/App && open App.xcworkspace
 *    # Xcode → Product → Archive → Distribute App
 *
 *  Android 端:
 *    npm run build
 *    npx cap sync android
 *    # Android Studio → Build → Generate Signed Bundle
 * ============================================================
 */
import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.feiman.letters',
  appName: '小纸条',
  webDir: 'dist',
  // V3.7 Capacitor 打包:
  //   - iOS: webview 加载线上 http://47.99.101.168:8890(走真实 API)
  //   - ATS 例外: iOS Info.plist 加 NSAllowsLocalNetworking=true(允许 http)
  //   - 没网时降级: 历史信 localStorage 仍可看(不能发新信)
  //   - bundle 内 dist/index.html 仅作离线 fallback
  server: {
    // 服务器当前是 http(端口 8890 未配 SSL),正式上线前用户可换 https
    url: 'http://47.99.101.168:8890',
    cleartext: true,
    androidScheme: 'https',
  },
  ios: {
    contentInset: 'automatic',
    // 状态栏白底黑字(贴合小纸条"纸张"美学)
    backgroundColor: '#F8F1E7',
  },
  android: {
    // 启动画面 + 状态栏:奶油色(跟小纸条底色一致)
    backgroundColor: '#F8F1E7',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 800,
      launchAutoHide: true,
      backgroundColor: '#F8F1E7',
      androidSplashResourceName: 'splash',
      showSpinner: false,
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#F8F1E7',
    },
  },
}

export default config
