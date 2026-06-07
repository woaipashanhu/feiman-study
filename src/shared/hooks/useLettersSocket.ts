/**
 * ============================================================
 *  useLettersSocket — 实时事件订阅 hook
 *
 *  监听后端 /api/ws 推过来的事件:
 *    { type: 'new_collect', letterId, byUserId, byNickname, ... }
 *    { type: 'new_star',    letterId, byUserId, byNickname, ... }
 *    { type: 'new_letter',  letter }
 *    { type: 'ping',        at }
 *
 *  行为:
 *    - 自动从 useAuth 拿 token,连 ws://<host>/api/ws?token=...
 *    - 自动重连(指数退避 1s, 2s, 4s, 最多 30s)
 *    - 暴露最近 10 个事件给 UI
 *    - 30s 心跳自动处理
 *
 *  用法:
 *    const { events, online, lastEvent } = useLettersSocket()
 *    useEffect(() => { if (lastEvent) toast.show(lastEvent) }, [lastEvent])
 * ============================================================
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { getAccessToken } from './useAuth'

export type WSMessage =
  | {
      type: 'new_collect'
      letterId: string
      letterContent: string
      byUserId: string
      byNickname: string
      at: number
    }
  | {
      type: 'new_star'
      letterId: string
      letterContent: string
      byUserId: string
      byNickname: string
      at: number
    }
  | { type: 'new_letter'; letter: any }
  | { type: 'ping'; at: number }

const MAX_EVENTS = 10

function buildWsUrl(token: string): string {
  const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  return `${proto}//${window.location.host}/api/ws?token=${encodeURIComponent(token)}`
}

export function useLettersSocket() {
  const [events, setEvents] = useState<WSMessage[]>([])
  const [online, setOnline] = useState(false)
  const [lastEvent, setLastEvent] = useState<WSMessage | null>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const retryRef = useRef(0)
  const retryTimer = useRef<number | null>(null)

  const connect = useCallback(() => {
    const token = getAccessToken()
    if (!token) return  // 未登录不连

    // 已有连接则跳过
    if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
      return
    }

    let ws: WebSocket
    try {
      ws = new WebSocket(buildWsUrl(token))
    } catch (e) {
      console.warn('[ws] 创建失败', e)
      scheduleReconnect()
      return
    }
    wsRef.current = ws

    ws.onopen = () => {
      console.log('[ws] connected')
      setOnline(true)
      retryRef.current = 0
    }

    ws.onmessage = (ev) => {
      try {
        const msg = JSON.parse(ev.data) as WSMessage
        if (msg.type === 'ping') return  // 静默心跳
        setLastEvent(msg)
        setEvents((prev) => [msg, ...prev].slice(0, MAX_EVENTS))
      } catch {
        // 忽略解析错误
      }
    }

    ws.onerror = () => {
      // 浏览器不暴露详细错误,onclose 兜底
    }

    ws.onclose = () => {
      console.log('[ws] closed')
      setOnline(false)
      wsRef.current = null
      scheduleReconnect()
    }
  }, [])

  const scheduleReconnect = useCallback(() => {
    if (retryTimer.current) return
    const delay = Math.min(1000 * 2 ** retryRef.current, 30_000)
    retryRef.current++
    retryTimer.current = window.setTimeout(() => {
      retryTimer.current = null
      connect()
    }, delay)
  }, [connect])

  // 启动:登录后连,登出后断
  useEffect(() => {
    connect()
    return () => {
      if (retryTimer.current) clearTimeout(retryTimer.current)
      if (wsRef.current) {
        wsRef.current.onclose = null  // 避免触发 reconnect
        wsRef.current.close()
        wsRef.current = null
      }
    }
  }, [connect])

  // 登出时断开
  useEffect(() => {
    const handler = () => {
      if (wsRef.current) {
        wsRef.current.onclose = null
        wsRef.current.close()
        wsRef.current = null
        setOnline(false)
        setEvents([])
      }
    }
    window.addEventListener('auth:logout', handler)
    return () => window.removeEventListener('auth:logout', handler)
  }, [])

  const clearEvents = useCallback(() => {
    setEvents([])
    setLastEvent(null)
  }, [])

  return {
    events,
    online,
    lastEvent,
    clearEvents,
  }
}
