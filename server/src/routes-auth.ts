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
import multer from 'multer'
import { mkdirSync, existsSync } from 'node:fs'
import { resolve, extname } from 'node:path'
import { randomBytes } from 'node:crypto'
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

authRouter.post('/logout', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user
  const jti = (req as any).tokenJti
  if (!user || !jti) {
    // 没拿到 jti(可能 token 来自老版本),只做客户端清除
    return res.json({ ok: true, message: '已登出(老版本 token,服务端未记录)' })
  }
  // 把 jti 写进黑名单(expires_at = token 过期时间,V1 简化用 2h 后)
  const now = Date.now()
  const expiresAt = now + 2 * 60 * 60 * 1000  // 2h(跟 access_token TTL 一致)
  try {
    db.prepare(
      'INSERT INTO token_blacklist (jti, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)'
    ).run(jti, user.id, expiresAt, now)
  } catch (e) {
    // jti 已存在(重复登出) — 忽略
  }
  return res.json({ ok: true, message: '已登出,token 已失效' })
})

// =============== POST /api/auth/avatar (V3.5 头像上传) ===============

// 头像存储目录
const AVATAR_DIR = process.env.AVATAR_DIR || '/var/lib/feiman-letters/avatars'
mkdirSync(AVATAR_DIR, { recursive: true })

// multer 配: 限 2MB,只接受图片
const avatarUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, AVATAR_DIR),
    filename: (req, file, cb) => {
      // 名字: <userId>_<random>.jpg
      const userId = (req as any).userId || 'anon'
      const ext = extname(file.originalname).toLowerCase() || '.jpg'
      const name = `${userId}_${randomBytes(4).toString('hex')}${ext}`
      cb(null, name)
    },
  }),
  limits: { fileSize: 2 * 1024 * 1024 },  // 2MB
  fileFilter: (_req, file, cb) => {
    const allowed = /^image\/(jpeg|jpg|png|webp|gif)$/i
    if (!allowed.test(file.mimetype)) {
      return cb(new Error('只支持 jpg/png/webp/gif 图片'))
    }
    cb(null, true)
  },
})

authRouter.post(
  '/avatar',
  requireAuth,
  avatarUpload.single('avatar'),
  (req: Request, res: Response) => {
    if (!req.file) {
      return res.status(400).json({ error: 'no_file', message: '请提供 avatar 文件' })
    }
    const userId = (req as any).userId
    const fileName = req.file.filename
    const url = `/avatars/${fileName}`

    // 更新 DB
    const now = Date.now()
    db.prepare('UPDATE users SET avatar_url = ?, updated_at = ? WHERE id = ?')
      .run(url, now, userId)

    return res.json({
      ok: true,
      avatarUrl: url,
      size: req.file.size,
    })
  }
)

// 删除头像
authRouter.delete('/avatar', requireAuth, (req: Request, res: Response) => {
  const userId = (req as any).userId
  const row = db.prepare('SELECT avatar_url FROM users WHERE id = ?').get(userId) as { avatar_url: string | null } | undefined
  if (row?.avatar_url) {
    // 物理删除文件(忽略错误,文件可能已被删)
    const filename = row.avatar_url.split('/').pop()
    if (filename) {
      const filepath = resolve(AVATAR_DIR, filename)
      if (existsSync(filepath)) {
        try {
          // 动态 fs.unlinkSync
          require('node:fs').unlinkSync(filepath)
        } catch (e) { /* ignore */ }
      }
    }
    db.prepare('UPDATE users SET avatar_url = NULL, updated_at = ? WHERE id = ?')
      .run(Date.now(), userId)
  }
  return res.json({ ok: true, avatarUrl: null })
})
