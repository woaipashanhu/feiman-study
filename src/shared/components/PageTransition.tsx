/**
 * ============================================================
 *  PageTransition — 页面转场动画组件
 *
 *  功能：
 *    - 路由切换时播放滑动/淡入过渡效果
 *    - 自动判断前进（列表→详情）vs 后退（详情→列表）
 *    - 使用 Framer Motion AnimatePresence 实现 exit 动画
 * ============================================================
 */
import { useRef, useEffect, useState, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'

/** 列表页路径模式（用于判断方向） */
const LIST_PATHS = ['/math', '/science', '/social', '/gallery', '/neimen']

/** 判断是否为列表页 */
function isListPath(pathname: string): boolean {
  const segments = pathname.split('/').filter(Boolean)
  return segments.length === 1 && LIST_PATHS.includes(`/${segments[0]}`)
}

/** 判断是否为详情页 */
function isDetailPath(pathname: string): boolean {
  const segments = pathname.split('/').filter(Boolean)
  return segments.length >= 2 && LIST_PATHS.includes(`/${segments[0]}`)
}

interface PageTransitionProps {
  children: ReactNode
  /** 是否禁用动画 */
  disabled?: boolean
}

const variants = {
  forward: {
    initial: { opacity: 0, x: 30 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -30 },
  },
  back: {
    initial: { opacity: 0, x: -30 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 30 },
  },
  fade: {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10 },
  },
}

export function PageTransition({ children, disabled = false }: PageTransitionProps) {
  const location = useLocation()
  const prevPathRef = useRef(location.pathname)
  const [direction, setDirection] = useState<'forward' | 'back' | 'fade'>('fade')

  useEffect(() => {
    if (disabled) return

    const prevPath = prevPathRef.current
    const currPath = location.pathname

    if (prevPath === currPath) return

    let dir: 'forward' | 'back' | 'fade' = 'fade'

    if (isListPath(prevPath) && isDetailPath(currPath)) {
      dir = 'forward'
    } else if (isDetailPath(prevPath) && isListPath(currPath)) {
      dir = 'back'
    } else if (isListPath(prevPath) && isListPath(currPath)) {
      dir = 'fade'
    } else {
      dir = 'fade'
    }

    setDirection(dir)
    prevPathRef.current = currPath
  }, [location.pathname, disabled])

  if (disabled) {
    return <div className="min-h-full">{children}</div>
  }

  const v = variants[direction]

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location.pathname}
        initial={v.initial}
        animate={v.animate}
        exit={v.exit}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        className="min-h-full"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}
