/**
 * ============================================================
 *  /api/auth 路由 — 登录注册 5 个 API
 *
 *  V3 范围(无手机号验证码,邮箱+密码):
 *    POST /api/auth/register    注册 (email + password + nickname)
 *    POST /api/auth/login       登录 (email + password) → 返回 access + refresh
 *    GET  /api/auth/me          当前用户(需 Authorization)
 *    POST /api/auth/refresh     用 refresh_token 换新 access_token
 *    POST /api/auth/logout      登出(V1 仅客户端丢 token,V2 加黑名单)
 *
 *  Token:
 *    access_token  TTL 2h
 *    refresh_token TTL 30d
 * ============================================================
 */
import { Router, type Request, type Response } from 'express'
import { z } from 'zod'
import { db, rowToUser, type UserRow } from './db.js'
import {
  hashPassword,
  verifyPassword,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  requireAuth,
  getCurrentUser,
} from './auth.js'

export const authRouter = Router()

// =============== Zod ===============

const RegisterBody = z.object({
  email: z.string().email().max(120),
  password: z.string().min(6).max(72),
  nickname: z.string().min(1).max(20),
})

const LoginBody = z.object({
  email: z.string().email().max(120),
  password: z.string().min(1).max(72),
})

// =============== Helpers ===============

function genUserId(): string {
  return `usr_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`
}

const stmtInsertUser = db.prepare(`
  INSERT INTO users (id, email, phone, password_hash, nickname, created_at, updated_at)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`)

const stmtGetUserByEmail = db.prepare(`SELECT * FROM users WHERE email = ?`)
const stmtGetUserById = db.prepare(`SELECT * FROM users WHERE id = ?`)

// =============== POST /api/auth/register ===============

authRouter.post('/register', async (req: Request, res: Response) => {
  const parsed = RegisterBody.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({
      error: 'invalid_body',
      message: '请求体不合法',
      details: parsed.error.issues,
    })
  }
  const { email, password, nickname } = parsed.data

  // 邮箱是否已注册
  const existing = stmtGetUserByEmail.get(email.toLowerCase()) as UserRow | undefined
  if (existing) {
    return res.status(409).json({
      error: 'email_taken',
      message: '该邮箱已注册,直接登录即可',
    })
  }

  // 哈希 + 写入
  const passwordHash = await hashPassword(password)
  const now = Date.now()
  const id = genUserId()
  try {
    stmtInsertUser.run(id, email.toLowerCase(), null, passwordHash, nickname, now, now)
  } catch (e) {
    return res.status(500).json({ error: 'insert_failed', message: String(e) })
  }

  const user = stmtGetUserById.get(id) as UserRow
  const accessToken = signAccessToken(id)
  const refreshToken = signRefreshToken(id)
  return res.status(201).json({
    ok: true,
    user: rowToUser(user),
    accessToken,
    refreshToken,
  })
})

// =============== POST /api/auth/login ===============

authRouter.post('/login', async (req: Request, res: Response) => {
  const parsed = LoginBody.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({
      error: 'invalid_body',
      message: '请求体不合法',
      details: parsed.error.issues,
    })
  }
  const { email, password } = parsed.data

  const user = stmtGetUserByEmail.get(email.toLowerCase()) as UserRow | undefined
  if (!user) {
    return res.status(401).json({
      error: 'invalid_credentials',
      message: '邮箱或密码错误',
    })
  }
  const ok = await verifyPassword(password, user.password_hash)
  if (!ok) {
    return res.status(401).json({
      error: 'invalid_credentials',
      message: '邮箱或密码错误',
    })
  }
  const accessToken = signAccessToken(user.id)
  const refreshToken = signRefreshToken(user.id)
  return res.json({
    ok: true,
    user: rowToUser(user),
    accessToken,
    refreshToken,
  })
})

// =============== GET /api/auth/me ===============

authRouter.get('/me', requireAuth, (req: Request, res: Response) => {
  return res.json({
    ok: true,
    user: getCurrentUser(req),
  })
})

// =============== POST /api/auth/refresh ===============

authRouter.post('/refresh', (req: Request, res: Response) => {
  const body = (req.body || {}) as { refreshToken?: string }
  if (!body.refreshToken) {
    return res.status(400).json({ error: 'missing_refresh_token' })
  }
  const payload = verifyRefreshToken(body.refreshToken)
  if (!payload) {
    return res.status(401).json({ error: 'invalid_refresh_token' })
  }
  const user = stmtGetUserById.get(payload.sub) as UserRow | undefined
  if (!user) {
    return res.status(401).json({ error: 'user_not_found' })
  }
  const accessToken = signAccessToken(user.id)
  return res.json({ ok: true, accessToken })
})

// =============== POST /api/auth/logout ===============

authRouter.post('/logout', (_req: Request, res: Response) => {
  // V1: 客户端丢 token 即可,服务端不维护黑名单
  // V2: 加 jti 黑名单(redis 或 DB)
  return res.json({ ok: true, message: '已登出(请客户端删除 token)' })
})
