/**
 * ============================================================
 *  错误上报系统 — 生产环境自动收集错误
 *
 *  设计思路:
 *    1. 开发环境：打印到控制台，不上报
 *    2. 生产环境：收集错误详情，发送到服务器日志端点
 *    3. 去重：相同错误 5 分钟内只上报一次
 *    4. 包含：错误堆栈、用户 UA、页面路径、时间戳
 *
 *  使用方式:
 *    - ErrorBoundary 捕获 React 渲染错误
 *    - window.onerror 捕获 JS 运行时错误
 *    - window.onunhandledrejection 捕获 Promise 未处理异常
 * ============================================================
 */

const IS_DEV = import.meta.env.DEV
const LOG_ENDPOINT = '/api/log'  // 如果没有后端，可改为发送到 Sentry/LogRocket 等第三方
const DEDUP_MS = 5 * 60 * 1000   // 5 分钟去重

/** 已上报的错误指纹集合（用于去重） */
const reportedFingerprints = new Set<string>()

/** 生成错误指纹 */
function fingerprint(error: Error | string): string {
  const msg = typeof error === 'string' ? error : error.message
  const stack = typeof error === 'string' ? '' : (error.stack || '').split('\n').slice(0, 3).join('|')
  return `${msg}|${stack}`.slice(0, 200)
}

/** 检查是否已上报过 */
function isDuplicate(fp: string): boolean {
  if (reportedFingerprints.has(fp)) return true
  reportedFingerprints.add(fp)
  // 5 分钟后清除去重标记
  setTimeout(() => reportedFingerprints.delete(fp), DEDUP_MS)
  return false
}

/** 收集上下文信息 */
function collectContext() {
  return {
    url: window.location.href,
    path: window.location.pathname,
    userAgent: navigator.userAgent,
    screen: `${window.innerWidth}x${window.innerHeight}`,
    timestamp: new Date().toISOString(),
    // 如果是 PWA，记录 Service Worker 状态
    sw: 'serviceWorker' in navigator ? navigator.serviceWorker.controller?.state : 'none',
  }
}

/** 上报错误 */
export async function reportError(
  error: Error | string,
  context?: Record<string, unknown>
) {
  const fp = fingerprint(error)

  // 同时调用 Sentry(如果已初始化)
  // 动态 import 避免 main.tsx 加载阶段就触发
  import('@sentry/react').then((Sentry) => {
    if (typeof Sentry.captureException === 'function') {
      Sentry.captureException(error instanceof Error ? error : new Error(String(error)), {
        contexts: { react: context as any },
      })
    }
  }).catch(() => { /* Sentry 未装 */ })

  // 开发环境：不上报服务器，但发送到 DevErrorPanel
  if (IS_DEV) {
    // 动态导入避免循环依赖
    import('@/shared/components/DevErrorPanel').then(({ registerDevError }) => {
      registerDevError({
        message: typeof error === 'string' ? error : error.message,
        stack: typeof error === 'string' ? '' : error.stack,
        source: (context?.source as string) || (context?.location as string),
        type: (context?.type as any) || 'js',
      })
    }).catch(() => {
      // DevErrorPanel 可能还没加载
    })
    return
  }

  // 生产环境：去重后上报
  if (isDuplicate(fp)) {
    console.log('[ErrorReporter] 重复错误，跳过上报:', fp.slice(0, 80))
    return
  }

  const payload = {
    type: 'error',
    message: typeof error === 'string' ? error : error.message,
    stack: typeof error === 'string' ? '' : error.stack,
    fingerprint: fp,
    context: { ...collectContext(), ...context },
  }

  // 尝试发送到服务器（静默失败，不影响用户体验）
  try {
    // 如果没有后端日志接口，这里会 404，但没关系
    await fetch(LOG_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      // 不阻塞页面，使用 keepalive 确保页面关闭时也能发送
      keepalive: true,
    }).catch(() => {
      // 静默失败
    })
  } catch {
    // 静默失败
  }

  // 同时发送到 beacon（更可靠，页面关闭也能发送）
  if (navigator.sendBeacon) {
    try {
      navigator.sendBeacon(LOG_ENDPOINT, JSON.stringify(payload))
    } catch {
      // 静默失败
    }
  }

  // 备用：存储到 localStorage，下次打开页面时批量上报
  try {
    const queue = JSON.parse(localStorage.getItem('__error_queue') || '[]')
    queue.push(payload)
    // 最多保留 20 条
    if (queue.length > 20) queue.shift()
    localStorage.setItem('__error_queue', JSON.stringify(queue))
  } catch {
    // localStorage 可能不可用
  }
}

/** 批量上报存储的错误 */
export async function flushStoredErrors() {
  if (IS_DEV) return

  try {
    const queue = JSON.parse(localStorage.getItem('__error_queue') || '[]')
    if (queue.length === 0) return

    await fetch(LOG_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'batch', errors: queue }),
      keepalive: true,
    }).catch(() => {})

    localStorage.removeItem('__error_queue')
  } catch {
    // 静默失败
  }
}

/** 初始化全局错误监听 */
export function initGlobalErrorListeners() {
  // 1. JS 运行时错误
  window.addEventListener('error', (event) => {
    reportError(event.error || new Error(event.message), {
      source: event.filename,
      line: event.lineno,
      col: event.colno,
      type: 'window.onerror',
    })
  })

  // 2. Promise 未处理异常
  window.addEventListener('unhandledrejection', (event) => {
    const error = event.reason instanceof Error
      ? event.reason
      : new Error(String(event.reason))
    reportError(error, {
      type: 'unhandledrejection',
      reason: String(event.reason),
    })
  })

  // 3. 页面加载完成后尝试 flush 之前存储的错误
  window.addEventListener('load', () => {
    setTimeout(flushStoredErrors, 3000)
  })

  // 4. React 特定：资源加载失败
  window.addEventListener('error', (event) => {
    // 捕获 <script> <link> <img> 等加载失败
    const target = event.target as HTMLElement | null
    if (target && !(target instanceof Window)) {
      const tag = target.tagName?.toLowerCase()
      const src = (target as any).src || (target as any).href || 'unknown'
      reportError(new Error(`资源加载失败: ${tag} → ${src}`), {
        type: 'resource_error',
        tag,
        src,
      })
    }
  }, true) // 使用捕获阶段

  console.log('[ErrorReporter] 全局错误监听已初始化')
}
