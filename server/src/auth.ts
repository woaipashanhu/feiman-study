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
}

export interface RefreshTokenPayload {
  sub: string
  type: 'refresh'
}

export function signAccessToken(userId: string): string {
  return jwt.sign({ sub: userId, type: 'access' } as AccessTokenPayload, ACCESS_SECRET, {
    expiresIn: ACCESS_TTL,
  })
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
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(payload.sub) as UserRow | undefined
  if (!user) {
    return res.status(401).json({ error: 'user_not_found', message: '用户不存在' })
  }
  req.user = user
  req.userId = user.id
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
