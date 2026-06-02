/**
 * ============================================================
 *  useScrollRestoration — 滚动位置记忆 Hook
 *
 *  功能：
 *    - 记住列表页的滚动位置
 *    - 从详情页返回时自动恢复
 *    - 按路径 key 隔离不同页面的位置
 *
 *  使用方式：
 *    const { scrollRef } = useScrollRestoration('/science')
 *    return <div ref={scrollRef}>...</div>
 *
 *  或手动绑定：
 *    const { savePosition, restorePosition } = useScrollRestoration('/gallery')
 * ============================================================
 */
import { useRef, useEffect, useCallback } from 'react'
import { useLocation } from 'react-router-dom'

/** 滚动位置缓存（模块级，跨组件实例持久化） */
const scrollCache = new Map<string, number>()

export function useScrollRestoration(cacheKey?: string) {
  const location = useLocation()
  const containerRef = useRef<HTMLDivElement>(null)
  // 用传入 key 或当前 pathname 作为缓存键
  const key = cacheKey || location.pathname
  const restoringRef = useRef(false)

  /** 保存当前位置 */
  const savePosition = useCallback(() => {
    const el = containerRef.current
    if (el && el.scrollTop > 0) {
      scrollCache.set(key, el.scrollTop)
    }
  }, [key])

  /** 恢复到保存的位置 */
  const restorePosition = useCallback(() => {
    const saved = scrollCache.get(key)
    if (saved && saved > 0 && containerRef.current) {
      restoringRef.current = true
      requestAnimationFrame(() => {
        if (containerRef.current) {
          containerRef.current.scrollTop = saved
        }
        // 恢复完成后允许再次保存
        setTimeout(() => {
          restoringRef.current = false
        }, 500)
      })
    }
  }, [key])

  // 组件挂载时恢复位置
  useEffect(() => {
    // 延迟一帧等 DOM 渲染完成
    const timer = requestAnimationFrame(() => {
      restorePosition()
    })
    return () => cancelAnimationFrame(timer)
  }, [restorePosition])

  // 滚动时保存位置（防抖）
  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    let timer: ReturnType<typeof setTimeout>
    const handleScroll = () => {
      if (restoringRef.current) return // 恢复过程中不覆盖
      clearTimeout(timer)
      timer = setTimeout(savePosition, 100)
    }

    el.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      el.removeEventListener('scroll', handleScroll)
      clearTimeout(timer)
    }
  }, [savePosition])

  // 离开页面时保存最终位置
  useEffect(() => {
    return () => {
      savePosition()
    }
  }, [location.pathname, savePosition])

  return {
    /** 绑定到可滚动容器的 ref */
    scrollRef: containerRef,
    /** 手动保存 */
    savePosition,
    /** 手动恢复 */
    restorePosition,
    /** 获取当前缓存的滚动值 */
    getSavedPosition: () => scrollCache.get(key) || 0,
  }
}
