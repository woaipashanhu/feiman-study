import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import * as Sentry from '@sentry/react'
import './index.css'
import './i18n/i18n'  // V3.8 i18n 初始化
import App from './App'
import { initGlobalErrorListeners } from '@/shared/utils/error-reporter'

// 初始化 Sentry 错误监控(仅生产环境)
// V3.6: DSN 从 env 拿,占位 DSN 时静默(SDK fail-safe)
// 上线前用户填真实 DSN 即可激活
const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN
// 占位 DSN 检测: placeholder / 000000 / 空值 都不 init,避免 400 噪声
const SENTRY_DSN_IS_PLACEHOLDER =
  !SENTRY_DSN ||
  SENTRY_DSN.includes('placeholder') ||
  /\/000000(\b|\/)/.test(SENTRY_DSN)

if (import.meta.env.PROD && !SENTRY_DSN_IS_PLACEHOLDER) {
  Sentry.init({
    dsn: SENTRY_DSN,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration(),
    ],
    // 性能采样 20%,错误采样 100%
    tracesSampleRate: 0.2,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    // 过滤:不报 favicon / 后端 API 路径 / 阿里云内网
    denyUrls: [
      /\/api\/letters\/by-token\//,  // 收信落地页 401 误报
    ],
    beforeSendTransaction(event) {
      // 去掉阿里云健康检查
      if (event.transaction === 'GET /api/health') return null
      return event
    },
  })
  console.log('[Sentry] initialized with DSN')
}

// 初始化全局错误监听(开发环境用,生产环境 Sentry 接管)
initGlobalErrorListeners()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
