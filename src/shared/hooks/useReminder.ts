/**
 * ============================================================
 *  useReminder — V4.7 每日提醒 hook
 *
 *  用法:
 *    const { enabled, setEnabled, time, setTime, testNow } = useReminder()
 *
 *  行为:
 *    - enabled: 是否开启提醒(默认 false)
 *    - time: HH:MM(默认 21:00)
 *    - 开启后:注册 setInterval 每分钟检查一次,到时间弹 PWA Notification
 *    - 关闭后:清除 interval
 *
 *  限制:
 *    - PWA 关闭后 PWA 不能弹通知(只有活跃 tab 才能)
 *    - 浏览器需用户授权 Notification(否则 catch)
 *    - iOS Safari 16.4+ 才支持(可装到主屏)
 * ============================================================
 */
import { useState, useEffect, useRef } from 'react'

const STORAGE_KEY = 'aha_reminder_v1'

interface ReminderConfig {
  enabled: boolean
  time: string  // HH:MM
}

const DEFAULT_CONFIG: ReminderConfig = {
  enabled: false,
  time: '21:00',
}

function loadConfig(): ReminderConfig {
  if (typeof localStorage === 'undefined') return DEFAULT_CONFIG
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_CONFIG
    return { ...DEFAULT_CONFIG, ...JSON.parse(raw) }
  } catch {
    return DEFAULT_CONFIG
  }
}

function saveConfig(c: ReminderConfig) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(c))
  } catch {}
}

export function useReminder() {
  const [config, setConfig] = useState<ReminderConfig>(loadConfig)
  const lastFiredKeyRef = useRef<string>('')  // 防同分钟重弹

  useEffect(() => {
    saveConfig(config)
  }, [config])

  useEffect(() => {
    if (!config.enabled) return
    if (typeof Notification === 'undefined') return  // 不支持
    if (Notification.permission === 'default') {
      Notification.requestPermission().then((perm) => {
        if (perm !== 'granted') {
          // 拒绝时关掉开关
          setConfig((c) => ({ ...c, enabled: false }))
        }
      })
    } else if (Notification.permission === 'denied') {
      setConfig((c) => ({ ...c, enabled: false }))
    }
  }, [config.enabled])

  useEffect(() => {
    if (!config.enabled) return

    const check = () => {
      const now = new Date()
      const hh = String(now.getHours()).padStart(2, '0')
      const mm = String(now.getMinutes()).padStart(2, '0')
      const cur = `${hh}:${mm}`
      const dayKey = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()} ${cur}`
      if (cur === config.time && lastFiredKeyRef.current !== dayKey) {
        lastFiredKeyRef.current = dayKey
        fireNotification()
      }
    }
    // 立即查一次 + 每分钟查
    check()
    const id = setInterval(check, 60_000)
    return () => clearInterval(id)
  }, [config.enabled, config.time])

  const setEnabled = (v: boolean) => setConfig((c) => ({ ...c, enabled: v }))
  const setTime = (t: string) => setConfig((c) => ({ ...c, time: t }))

  /** 立即弹一个(测试用) */
  const testNow = () => fireNotification(true)

  return { enabled: config.enabled, setEnabled, time: config.time, setTime, testNow }
}

function fireNotification(testing = false) {
  if (typeof Notification === 'undefined') {
    alert('当前浏览器不支持通知')
    return
  }
  if (Notification.permission !== 'granted') {
    alert('通知权限未授权')
    return
  }
  const n = new Notification('小纸条 · 啊哈时刻 💡', {
    body: testing ? '(测试) 想起今天的灵感了吗?' : '想起今天的灵感了吗?记录一个吧。',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-72.png',
    tag: 'aha-reminder',
    requireInteraction: false,
  })
  n.onclick = () => {
    window.focus()
    n.close()
    window.location.href = '/aha'
  }
  // 5s 后自动关
  setTimeout(() => n.close(), 5000)
}
