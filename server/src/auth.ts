/**
 * ============================================================
 *  Auth 工具: JWT 签发/验证 + bcrypt 密码哈希 + 中间件
 *
 *  Token 设计:
 *    - access_token  短期(2h),  用于 API 鉴权
 *    - refresh_token 长期(30d), 用于换新 access_token
 *    两 token 都是 JWT, 但 secret 不同
 *
 *  Payload 格式:
 *    { sub: userId, type: 'access' | 'refresh', iat, exp }
 *
 *  ENV:
 *    JWT_ACCESS_SECRET  (默认 dev-only 字符串,生产必须改)
 *    JWT_REFRESH_SECRET (默认 dev-only 字符串,生产必须改)
 * ============================================================
 */
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { randomUUID } from 'node:crypto'
import type { Request, Response, NextFunction } from 'express'
import { db, rowToUser, type UserRow } from './db.js'

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'dev-access-secret-please-change-in-production'
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret-please-change-in-production'
const ACCESS_TTL = '2h'
const REFRESH_TTL = '30d'

// =============== 密码 ===============

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10)
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash)
}

// =============== JWT ===============

export interface AccessTokenPayload {
  sub: string  // user id
  type: 'access'
  jti: string  // token 唯一 id(登出后入黑名单)
}

export interface RefreshTokenPayload {
  sub: string
  type: 'refresh'
}

export function signAccessToken(userId: string): string {
  const jti = randomUUID()
  return jwt.sign(
    { sub: userId, type: 'access', jti } as AccessTokenPayload,
    ACCESS_SECRET,
    { expiresIn: ACCESS_TTL }
  )
}

export function signRefreshToken(userId: string): string {
  return jwt.sign({ sub: userId, type: 'refresh' } as RefreshTokenPayload, REFRESH_SECRET, {
    expiresIn: REFRESH_TTL,
  })
}

export function verifyAccessToken(token: string): AccessTokenPayload | null {
  try {
    const decoded = jwt.verify(token, ACCESS_SECRET) as AccessTokenPayload
    if (decoded.type !== 'access') return null
    return decoded
  } catch {
    return null
  }
}

export function verifyRefreshToken(token: string): RefreshTokenPayload | null {
  try {
    const decoded = jwt.verify(token, REFRESH_SECRET) as RefreshTokenPayload
    if (decoded.type !== 'refresh') return null
    return decoded
  } catch {
    return null
  }
}

// =============== 中间件 ===============

declare global {
  namespace Express {
    interface Request {
      user?: UserRow
      userId?: string
    }
  }
}

/** 黑名单查 token 是否被登出 */
export function isTokenBlacklisted(jti: string): boolean {
  if (!jti) return false
  const row = db.prepare('SELECT 1 FROM token_blacklist WHERE jti = ? LIMIT 1').get(jti)
  return !!row
}

/** 清理过期黑名单条目(> 2h 全部清掉,因为 access_token 2h 就过期) */
export function cleanExpiredBlacklist(): number {
  const twoHoursAgo = Date.now() - 2 * 60 * 60 * 1000
  const result = db.prepare('DELETE FROM token_blacklist WHERE expires_at < ?').run(twoHoursAgo)
  return result.changes
}

/** 要求 Authorization: Bearer <access_token> — 把 user 挂到 req.user */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.header('authorization') || req.header('Authorization')
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'unauthorized', message: '需要登录' })
  }
  const token = header.slice(7).trim()
  const payload = verifyAccessToken(token)
  if (!payload) {
    return res.status(401).json({ error: 'invalid_token', message: 'token 无效或已过期' })
  }
  // 检查黑名单(登出后的 token 失效)
  if (payload.jti && isTokenBlacklisted(payload.jti)) {
    return res.status(401).json({ error: 'token_revoked', message: 'token 已登出,请重新登录' })
  }
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(payload.sub) as UserRow | undefined
  if (!user) {
    return res.status(401).json({ error: 'user_not_found', message: '用户不存在' })
  }
  req.user = user
  req.userId = user.id
  // 顺便把 jti 挂到 req,登出端点用
  ;(req as any).tokenJti = payload.jti
  next()
}

/** 可选鉴权 — 有 token 就解析,没 token 也放行(req.user 可能是 undefined) */
export function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.header('authorization') || req.header('Authorization')
  if (!header || !header.startsWith('Bearer ')) {
    return next()
  }
  const token = header.slice(7).trim()
  const payload = verifyAccessToken(token)
  if (!payload) return next()
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(payload.sub) as UserRow | undefined
  if (user) {
    req.user = user
    req.userId = user.id
  }
  next()
}

/** 当前 user 的安全 DTO(无 password_hash) */
export function getCurrentUser(req: Request) {
  return req.user ? rowToUser(req.user) : null
}

// 启动时 + 每小时清一次过期黑名单
let cleanupTimer: NodeJS.Timeout | null = null
export function startBlacklistCleanup() {
  // 启动跑一次
  cleanExpiredBlacklist()
  if (cleanupTimer) return
  cleanupTimer = setInterval(() => {
    const n = cleanExpiredBlacklist()
    if (n > 0) console.log(`[auth] 清理了 ${n} 条过期黑名单条目`)
  }, 60 * 60 * 1000)  // 1h
}
