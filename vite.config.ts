import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/',
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      // 自动注册 + 立刻激活新 SW(用户不卡旧版本)
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      workbox: {
        // 关键: 让新 SW 立刻 skipWaiting + 接管所有 client tab
        // 不加这俩,用户得手动关掉所有 tab 重开才看到新版本
        skipWaiting: true,
        clientsClaim: true,
        // 部署时删掉旧 chunk 的缓存,避免冲突
        cleanupOutdatedCaches: true,
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        // ⚠️ 不缓存 API 路径(后端数据必须每次拉新)
        navigateFallbackDenylist: [/^\/api\//],
        runtimeCaching: [
          {
            urlPattern: /^https?:\/\/.*\.(?:png|jpg|jpeg|svg|webp|gif)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images',
              expiration: { maxEntries: 200, maxAgeSeconds: 30 * 24 * 60 * 60 }
            }
          }
        ]
      },
      // 每次部署生成新 manifest,强制 PWA 检测到更新
      manifest: {
        // 加一个 build 时间戳,逼着 SW 重新比对
        // (PWA 插件内部已经按 dist hash 处理,但显式加更稳)
      },
      manifest: {
        name: '费曼科学课',
        short_name: '费曼科学',
        description: '探索数学、科学与社会的奇妙世界',
        theme_color: '#F8FAFC',
        background_color: '#F8FAFC',
        display: 'standalone',
        start_url: '/math',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' }
        ]
      },
      includeAssets: ['*.png']
    })
  ],
  resolve: {
    alias: {
      '@': __dirname + '/src',
    },
  },
})
