import { useState, useRef, useCallback, type ReactNode } from 'react'
import { motion, useMotionValue, useTransform, animate } from 'framer-motion'
import { ArrowClockwise } from 'phosphor-react'

interface PullToRefreshProps {
  children: ReactNode
  onRefresh: () => void
  threshold?: number
}

export function PullToRefresh({ children, onRefresh, threshold = 80 }: PullToRefreshProps) {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isPulling, setIsPulling] = useState(false)
  const startY = useRef(0)
  const currentY = useMotionValue(0)
  const rotate = useTransform(currentY, [0, threshold], [0, 360])
  const opacity = useTransform(currentY, [0, threshold], [0, 1])

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const el = e.currentTarget as HTMLElement
    if (el.scrollTop === 0) {
      startY.current = e.touches[0].clientY
      setIsPulling(true)
    }
  }, [])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isPulling) return
    const delta = e.touches[0].clientY - startY.current
    if (delta > 0) {
      currentY.set(Math.min(delta * 0.5, threshold + 20))
    }
  }, [isPulling, currentY, threshold])

  const handleTouchEnd = useCallback(() => {
    if (!isPulling) return
    const y = currentY.get()
    if (y >= threshold) {
      setIsRefreshing(true)
      onRefresh()
      setTimeout(() => {
        setIsRefreshing(false)
        setIsPulling(false)
        animate(currentY, 0, { duration: 0.3, ease: 'easeOut' })
      }, 1500)
    } else {
      setIsPulling(false)
      animate(currentY, 0, { duration: 0.3, ease: 'easeOut' })
    }
  }, [isPulling, currentY, threshold, onRefresh])

  return (
    <div
      className="relative"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* 下拉指示器 */}
      <motion.div
        className="absolute top-0 left-0 right-0 flex items-center justify-center pointer-events-none z-10"
        style={{ y: currentY, opacity }}
      >
        <div className="flex flex-col items-center gap-1 pt-3">
          <motion.div style={{ rotate }}>
            <ArrowClockwise
              size={20}
              weight="bold"
              className={isRefreshing ? 'text-brand animate-spin' : 'text-text-tertiary'}
            />
          </motion.div>
          <span className="text-[10px] text-text-tertiary">
            {isRefreshing ? '刷新中...' : '下拉刷新'}
          </span>
        </div>
      </motion.div>

      {children}
    </div>
  )
}
