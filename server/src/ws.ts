/**
 * ============================================================
 *  ws.ts — WebSocket 实时推送
 *
 *  端点: ws://host/api/ws?token=<access_token>
 *  (也支持 wss://,反代需要 nginx upgrade 配置)
 *
 *  推送事件类型:
 *    { type: 'new_collect', letterId, byUserId, byNickname, at }
 *    { type: 'new_star',    letterId, byUserId, byNickname, at }
 *    { type: 'new_letter',  letter }   // V2: 新信广播(暂未触发)
 *
 *  内部:
 *    userSockets: Map<userId, Set<WebSocket>>
 *    - 同一用户多端登录有多个连接
 *    - ws.on('close') 自动清理
 *
 *  调用:
 *    notifyLetterAuthor(letterId, event) — 收信/被 star 时,找到信作者
 *    推给该作者的所有连接(如果在线)
 * ============================================================
 */
import { WebSocketServer, WebSocket } from 'ws'
import type { Server } from 'node:http'
import { verifyAccessToken } from './auth.js'
import { db, type LetterRow } from './db.js'

// =============== 类型 ===============

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

// =============== 全局状态 ===============

const userSockets = new Map<string, Set<WebSocket>>()

function addSocket(userId: string, ws: WebSocket) {
  if (!userSockets.has(userId)) userSockets.set(userId, new Set())
  userSockets.get(userId)!.add(ws)
}

function removeSocket(userId: string, ws: WebSocket) {
  const set = userSockets.get(userId)
  if (!set) return
  set.delete(ws)
  if (set.size === 0) userSockets.delete(userId)
}

/** 给指定用户推消息(如果在线) */
export function pushToUser(userId: string, msg: WSMessage) {
  const set = userSockets.get(userId)
  if (!set) return 0
  const payload = JSON.stringify(msg)
  let count = 0
  for (const ws of set) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(payload)
      count++
    }
  }
  return count
}

/** 给所有在线用户广播 */
export function broadcast(msg: WSMessage) {
  const payload = JSON.stringify(msg)
  let count = 0
  for (const set of userSockets.values()) {
    for (const ws of set) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(payload)
        count++
      }
    }
  }
  return count
}

/** 推送给某封信的作者(收信人) */
export function notifyLetterAuthor(letterId: string, event: WSMessage): number {
  const row = db
    .prepare('SELECT author_user_id FROM letters WHERE id = ?')
    .get(letterId) as { author_user_id: string | null } | undefined
  if (!row || !row.author_user_id) return 0
  return broadcastToAllWorkers(row.author_user_id, event)
}

/**
 * V3.6 PM2 cluster 模式: 每个 worker 独立的 userSockets,
 * 推送需要广播到所有 worker(同 user 的 WS 可能连在不同 worker)。
 *
 * 方案: 用 PM2 内置的 process.send 广播机制
 *   - master 收到 type='ws:broadcast' 消息,自动 fan-out 到所有 worker
 *   - 每个 worker 监听 process.on('message'),收到后调 pushToUser
 */
function broadcastToAllWorkers(userId: string, msg: WSMessage): number {
  if (process.send) {
    // PM2 cluster 模式: 发到 master,master 广播到所有 worker
    try {
      process.send({
        type: 'process:msg',
        data: { type: 'ws:broadcast', userId, msg },
      })
      return 1  // 表示已发送(实际推送数由各 worker 返回,这里只统计 1 次"尝试")
    } catch (err) {
      console.warn('[ws] broadcast failed:', err)
      // 失败时回退到本进程推送
      return pushToUser(userId, msg)
    }
  }
  // fork 模式: 直接本进程推送
  return pushToUser(userId, msg)
}

// =============== Cluster worker 消息监听 ===============

/** 每个 worker 启动时调一次,监听 master 广播的 ws:broadcast 消息 */
export function setupClusterBroadcastListener() {
  if (!process.send) return  // 非 cluster 模式,跳过
  process.on('message', (raw: any) => {
    // PM2 包装: 消息体在 raw.data(我们发的 type='process:msg')
    const data = raw?.data ?? raw
    if (data?.type === 'ws:broadcast') {
      pushToUser(data.userId, data.msg)
    }
  })
  console.log('[ws] cluster broadcast listener enabled')
}

// =============== 启动 ===============

let wss: WebSocketServer | null = null

export function attachWebSocketServer(server: Server) {
  if (wss) return  // 已启动
  wss = new WebSocketServer({ noServer: true })

  server.on('upgrade', (req, socket, head) => {
    const url = new URL(req.url || '', `http://${req.headers.host}`)
    if (url.pathname !== '/api/ws') {
      // 不处理 → 让 socket 关闭
      return
    }
    const token = url.searchParams.get('token')
    if (!token) {
      socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n')
      socket.destroy()
      return
    }
    const payload = verifyAccessToken(token)
    if (!payload) {
      socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n')
      socket.destroy()
      return
    }
    // 升级 WebSocket
    wss!.handleUpgrade(req, socket, head, (ws) => {
      onConnection(ws, payload.sub)
    })
  })

  console.log('[ws] WebSocket server attached on /api/ws')
}

function onConnection(ws: WebSocket, userId: string) {
  addSocket(userId, ws)
  console.log(`[ws] + user ${userId} connected, total: ${userSockets.get(userId)?.size}`)

  // 心跳
  const heartbeat = setInterval(() => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'ping', at: Date.now() } satisfies WSMessage))
    }
  }, 30_000)

  ws.on('close', () => {
    clearInterval(heartbeat)
    removeSocket(userId, ws)
    console.log(`[ws] - user ${userId} closed, total: ${userSockets.get(userId)?.size || 0}`)
  })

  ws.on('error', (err) => {
    console.warn(`[ws] error user=${userId}:`, err.message)
  })

  // 欢迎消息
  ws.send(JSON.stringify({ type: 'ping', at: Date.now() } satisfies WSMessage))
}

/** 当前在线用户数(调试用) */
export function onlineCount(): number {
  return userSockets.size
}
