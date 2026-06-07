/**
 * ============================================================
 *  PWAUpdatePrompt — 新版本可用提示
 *
 *  监听 vite-plugin-pwa 的 update 事件,有新 SW 时:
 *  - 不自动 reload(可能丢用户输入)
 *  - 弹一个底部 toast:"新版本可用,点刷新"
 *  - 用户点了 → skipWaiting + clientsClaim + reload
 *
 *  为什么不用默认的 autoUpdate:
 *    默认的 silent autoUpdate 在新 SW ready 时会强 reload,
 *    用户在写信/改心情时突然白屏,体验差。
 *    改成手动确认后,用户感知"这是个更新",接受度更高。
 * ============================================================
 */
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowsClockwise, X } from 'phosphor-react'

interface PWAModule {
  registerSW: (options?: {
    immediate?: boolean
    onNeedRefresh?: () => void
    onOfflineReady?: () => void
  }) => (reloadPage?: boolean) => Promise<void>
}

export function PWAUpdatePrompt() {
  const [needRefresh, setNeedRefresh] = useState(false)
  const [updateSW, setUpdateSW] = useState<((reload?: boolean) => Promise<void>) | null>(null)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    // 动态 import virtual:pwa-register(只有装了 PWA 插件才能解析)
    // Vite 编译时如果没装插件,这个 import 会失败,我们 fallback 到 null
    import('virtual:pwa-register' as string)
      .then((mod: PWAModule) => {
        const update = mod.registerSW({
          immediate: true,
          onNeedRefresh: () => {
            console.log('[PWA] New version available')
            setNeedRefresh(true)
          },
          onOfflineReady: () => {
            console.log('[PWA] Offline ready')
          },
        })
        setUpdateSW(() => update)
      })
      .catch((e) => {
        // 开发环境没装 PWA 插件,正常
        console.debug('[PWA] registerSW not available (dev?)', e?.message)
      })
  }, [])

  const handleRefresh = () => {
    if (updateSW) {
      updateSW(true) // skipWaiting + reload
    } else {
      window.location.reload()
    }
  }

  const show = needRefresh && !dismissed

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed left-1/2 -translate-x-1/2 z-[100] flex items-center gap-3 px-4 py-3 rounded-2xl shadow-2xl"
          style={{
            backgroundColor: '#1A1D2B',
            color: '#FAF7F2',
            bottom: 'calc(24px + env(safe-area-inset-bottom, 0px))',
            maxWidth: 'calc(100vw - 32px)',
          }}
        >
          <ArrowsClockwise size={18} weight="bold" className="text-amber-300 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold">新版本已就绪</p>
            <p className="text-[11px] opacity-70 mt-0.5">
              点刷新加载最新功能
            </p>
          </div>
          <button
            onClick={handleRefresh}
            className="px-3 py-1.5 rounded-xl text-[12px] font-semibold shrink-0"
            style={{ backgroundColor: '#C83820' }}
          >
            刷新
          </button>
          <button
            onClick={() => setDismissed(true)}
            className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 hover:bg-white/10"
            aria-label="稍后"
          >
            <X size={14} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
