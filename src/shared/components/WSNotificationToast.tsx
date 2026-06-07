/**
 * ============================================================
 *  WSNotificationToast — WebSocket 事件 toast
 *
 *  监听 useLettersSocket 推送的事件,在屏幕顶部弹一个 toast:
 *    - "自动化用户 star 了你的信「保持好奇...」"
 *    - "有人 collect 了你的信「每天进步...」"
 *  3 秒自动消失
 *
 *  视觉: 苹果风 + 朱红 accent + 思源宋体标题
 * ============================================================
 */
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Star, Heart, X } from 'phosphor-react'
import { useLettersSocket, type WSMessage } from '@/shared/hooks/useLettersSocket'
import { LETTER_PALETTE } from '@/shared/components/LetterPaper/palette'

interface ToastItem {
  id: number
  message: WSMessage
  expiresAt: number
}

const TOAST_DURATION = 3500

export function WSNotificationToast() {
  const { lastEvent, online } = useLettersSocket()
  const [toasts, setToasts] = useState<ToastItem[]>([])

  useEffect(() => {
    if (!lastEvent) return
    if (lastEvent.type === 'ping') return
    const id = Date.now() + Math.random()
    const expiresAt = Date.now() + TOAST_DURATION
    setToasts((prev) => [...prev, { id, message: lastEvent, expiresAt }])
    // 自动移除
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, TOAST_DURATION)
  }, [lastEvent])

  return (
    <div
      className="fixed left-0 right-0 z-[200] flex flex-col items-center gap-2 pointer-events-none"
      style={{ top: 'calc(20px + env(safe-area-inset-top, 0px))' }}
    >
      {/* 在线状态指示(右上角小圆点) */}
      <div
        className="absolute right-3 pointer-events-auto"
        style={{ top: -10 }}
      >
        <div
          className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] backdrop-blur-sm"
          style={{
            backgroundColor: online ? 'rgba(16,185,129,0.9)' : 'rgba(154,160,184,0.4)',
            color: online ? '#fff' : 'rgba(255,255,255,0.8)',
          }}
          title={online ? '已连接到服务器' : '未连接'}
        >
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: online ? '#fff' : 'rgba(255,255,255,0.5)' }}
          />
          {online ? '在线' : '离线'}
        </div>
      </div>

      <AnimatePresence>
        {toasts.map((toast) => {
          const m = toast.message
          if (m.type === 'new_star' || m.type === 'new_collect') {
            const isStar = m.type === 'new_star'
            const snippet = m.letterContent.slice(0, 14) + (m.letterContent.length > 14 ? '…' : '')
            return (
              <motion.div
                key={toast.id}
                initial={{ opacity: 0, y: -20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 300, damping: 28 }}
                className="pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-2xl shadow-2xl"
                style={{
                  backgroundColor: '#1A1D2B',
                  color: '#FAF7F2',
                  maxWidth: 'calc(100vw - 32px)',
                }}
                onClick={() => {
                  window.location.href = `/letters/letter/${m.letterId}`
                }}
              >
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                  style={{
                    backgroundColor: isStar ? LETTER_PALETTE.gold : LETTER_PALETTE.vermilion,
                  }}
                >
                  {isStar ? (
                    <Star size={16} weight="fill" />
                  ) : (
                    <Heart size={16} weight="fill" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold leading-tight">
                    {m.byNickname}{' '}
                    <span className="opacity-70 font-normal">
                      {isStar ? 'star 了你的信' : '收藏了你的信'}
                    </span>
                  </p>
                  <p
                    className="text-[11px] opacity-60 mt-0.5 truncate"
                    style={{ fontFamily: '"Noto Serif SC","Songti SC",serif' }}
                  >
                    「{snippet}」
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setToasts((prev) => prev.filter((t) => t.id !== toast.id))
                  }}
                  className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 hover:bg-white/10"
                >
                  <X size={12} />
                </button>
              </motion.div>
            )
          }
          return null
        })}
      </AnimatePresence>
    </div>
  )
}
