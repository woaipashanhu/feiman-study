import type { CapacitorConfig } from '@capacitor/cli'

/**
 * Capacitor 配置（预留，当前不激活）
 * 做 App 时执行：npm install @capacitor/core @capacitor/cli
 * 然后：npx cap init
 */
const config: CapacitorConfig = {
  appId: 'com.feiman.science',
  appName: '费曼科学课',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    iosScheme: 'https',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#F8FAFC',
    },
  },
}

export default config
