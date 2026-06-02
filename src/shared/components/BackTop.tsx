import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowUp } from 'phosphor-react'

interface BackTopProps {
  /** 滚动容器 ref（默认 window） */
  containerRef?: React.RefObject<HTMLElement | null>
  /** 显示阈值（默认 300px） */
  threshold?: number
}

export function BackTop({ containerRef, threshold = 300 }: BackTopProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = containerRef?.current || window

    const handleScroll = () => {
      const scrollY = containerRef?.current
        ? containerRef.current.scrollTop
        : window.scrollY
      setVisible(scrollY > threshold)
    }

    el.addEventListener('scroll', handleScroll, { passive: true })
    return () => el.removeEventListener('scroll', handleScroll)
  }, [containerRef, threshold])

  const handleClick = () => {
    const el = containerRef?.current
    if (el) {
      el.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          onClick={handleClick}
          className="fixed bottom-20 right-4 z-40 w-10 h-10 rounded-full bg-surface border border-border shadow-lg flex items-center justify-center text-text-secondary hover:text-brand hover:border-brand/30 transition-colors"
          initial={{ opacity: 0, scale: 0.8, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 10 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          aria-label="回到顶部"
        >
          <ArrowUp size={18} weight="bold" />
        </motion.button>
      )}
    </AnimatePresence>
  )
}
