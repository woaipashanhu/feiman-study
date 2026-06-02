/**
 * ============================================================
 *  useTheme — 深色模式 Hook
 *
 *  功能：
 *    - light / dark / system 三种模式
 *    - localStorage 持久化用户选择
 *    - 自动检测系统 prefers-color-scheme
 *    - 给 <html> 添加 dark class，驱动 CSS 变量切换
 *
 *  使用方式：
 *    const { theme, setTheme, isDark } = useTheme()
 *    setTheme('dark') // 切换深色
 *
 *  CSS 配合方式：
 *    .dark { --color-bg: #0f172a; ... }
 * ============================================================
 */
import { useState, useEffect, useCallback } from 'react'

export type ThemeMode = 'light' | 'dark' | 'system'

const THEME_KEY = 'feiman_theme_mode'

/** 获取系统是否为深色 */
function getSystemDark(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

/** 从 localStorage 读取主题 */
function getSavedTheme(): ThemeMode {
  try {
    const saved = localStorage.getItem(THEME_KEY)
    if (saved === 'light' || saved === 'dark' || saved === 'system') {
      return saved
    }
  } catch { /* ignore */ }
  return 'system' // 默认跟随系统
}

/** 应用主题到 DOM */
function applyTheme(mode: ThemeMode): void {
  if (typeof document === 'undefined') return

  const root = document.documentElement
  const isDark = mode === 'dark' || (mode === 'system' && getSystemDark())

  if (isDark) {
    root.classList.add('dark')
  } else {
    root.classList.remove('dark')
  }
}

export function useTheme() {
  const [theme, setThemeState] = useState<ThemeMode>('system')

  // 初始化：从 localStorage 读取并应用
  useEffect(() => {
    const saved = getSavedTheme()
    setThemeState(saved)
    applyTheme(saved)
  }, [])

  // 监听系统主题变化（当 mode === 'system' 时）
  useEffect(() => {
    if (theme !== 'system') return

    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = () => applyTheme('system')
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [theme])

  // 切换主题
  const setTheme = useCallback((mode: ThemeMode) => {
    setThemeState(mode)
    try {
      localStorage.setItem(THEME_KEY, mode)
    } catch { /* ignore */ }
    applyTheme(mode)
  }, [])

  // 快捷切换 light ↔ dark
  const toggleDark = useCallback(() => {
    const currentIsDark = theme === 'dark' || (theme === 'system' && getSystemDark())
    setTheme(currentIsDark ? 'light' : 'dark')
  }, [theme, setTheme])

  // 当前实际是否为深色
  const isDark = theme === 'dark' || (theme === 'system' && getSystemDark())

  return {
    /** 当前设置的模式 */
    theme,
    /** 设置模式 */
    setTheme,
    /** 快捷切换亮/暗 */
    toggleDark,
    /** 当前实际是否深色 */
    isDark,
  }
}
