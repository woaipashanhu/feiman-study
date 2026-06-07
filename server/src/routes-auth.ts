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
import { sendVerificationCode, verifyCode, findOrCreatePhoneUser } from './sms-provider.js'
import { getStorageProvider } from './storage-provider.js'
import { registry, RegisterRequest, LoginRequest, AuthSuccessResponse, RefreshRequest, RefreshResponse, ErrorResponse } from './openapi-registry.js'

export const authRouter = Router()

// =============== OpenAPI 注解 ===============

registry.registerPath({
  method: 'post',
  path: '/api/auth/register',
  tags: ['Auth'],
  summary: '注册新用户',
  request: {
    body: {
      content: { 'application/json': { schema: RegisterRequest } },
    },
  },
  responses: {
    200: { description: '注册成功,返回 access + refresh + user', content: { 'application/json': { schema: AuthSuccessResponse } } },
    400: { description: '邮箱已注册 / 参数错误', content: { 'application/json': { schema: ErrorResponse } } },
  },
})

registry.registerPath({
  method: 'post',
  path: '/api/auth/login',
  tags: ['Auth'],
  summary: '登录获取 JWT',
  request: {
    body: { content: { 'application/json': { schema: LoginRequest } } },
  },
  responses: {
    200: { description: '登录成功', content: { 'application/json': { schema: AuthSuccessResponse } } },
    401: { description: '邮箱或密码错误', content: { 'application/json': { schema: ErrorResponse } } },
  },
})

registry.registerPath({
  method: 'get',
  path: '/api/auth/me',
  tags: ['Auth'],
  summary: '当前用户信息(需 Authorization)',
  security: [{ bearerAuth: [] }],
  responses: {
    200: { description: '当前用户', content: { 'application/json': { schema: AuthSuccessResponse } } },
    401: { description: '未登录 / token 过期', content: { 'application/json': { schema: ErrorResponse } } },
  },
})

registry.registerPath({
  method: 'post',
  path: '/api/auth/refresh',
  tags: ['Auth'],
  summary: 'refresh token 换新 access token',
  request: {
    body: { content: { 'application/json': { schema: RefreshRequest } } },
  },
  responses: {
    200: { description: '换新成功', content: { 'application/json': { schema: RefreshResponse } } },
    401: { description: 'refresh token 无效或已撤销', content: { 'application/json': { schema: ErrorResponse } } },
  },
})

registry.registerPath({
  method: 'post',
  path: '/api/auth/logout',
  tags: ['Auth'],
  summary: '登出(access token 入黑名单)',
  security: [{ bearerAuth: [] }],
  responses: {
    200: { description: '登出成功' },
    401: { description: '未登录', content: { 'application/json': { schema: ErrorResponse } } },
  },
})

// 注册 bearerAuth 安全方案
registry.registerComponent('securitySchemes', 'bearerAuth', {
  type: 'http',
  scheme: 'bearer',
  bearerFormat: 'JWT',
  description: '从 /api/auth/login 或 /api/auth/refresh 获取 accessToken,放 Authorization 头',
})

// =============== V3.8 手机号验证码 OpenAPI 注解 ===============

const SendCodeRequest = z.object({
  phone: z.string().regex(/^1[3-9]\d{9}$/).openapi({ example: '13800138000' }),
  purpose: z.enum(['login', 'register']).default('login'),
}).openapi('SendCodeRequest')

const SendCodeResponse = z.object({
  ok: z.boolean(),
  provider: z.enum(['aliyun', 'mock']),
  message: z.string(),
  devCode: z.string().optional().openapi({ description: '仅 mock 模式返回,真实环境无此字段' }),
}).openapi('SendCodeResponse')

const PhoneLoginRequest = z.object({
  phone: z.string().regex(/^1[3-9]\d{9}$/),
  code: z.string().regex(/^\d{5}$/),
  nickname: z.string().max(40).optional(),
}).openapi('PhoneLoginRequest')

registry.registerPath({
  method: 'post',
  path: '/api/auth/send-code',
  tags: ['Auth'],
  summary: '发送手机验证码(60s cooldown, 1h 限 10 条)',
  request: { body: { content: { 'application/json': { schema: SendCodeRequest } } } },
  responses: {
    200: { description: '发送成功', content: { 'application/json': { schema: SendCodeResponse } } },
    400: { description: '手机号格式错误', content: { 'application/json': { schema: ErrorResponse } } },
    429: { description: 'cooldown / rate limit', content: { 'application/json': { schema: ErrorResponse } } },
  },
})

registry.registerPath({
  method: 'post',
  path: '/api/auth/phone-login',
  tags: ['Auth'],
  summary: '手机号 + 验证码登录/注册(无该用户则自动注册)',
  request: { body: { content: { 'application/json': { schema: PhoneLoginRequest } } } },
  responses: {
    200: { description: '登录成功', content: { 'application/json': { schema: AuthSuccessResponse } } },
    400: { description: '参数错误', content: { 'application/json': { schema: ErrorResponse } } },
    401: { description: '验证码错误或过期', content: { 'application/json': { schema: ErrorResponse } } },
  },
})

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

// =============== V3.8 手机号验证码登录/注册 ===============

const SendCodeBody = z.object({
  phone: z.string().regex(/^1[3-9]\d{9}$/, '手机号格式不正确'),
  purpose: z.enum(['login', 'register']).default('login'),
})

authRouter.post('/send-code', async (req: Request, res: Response) => {
  const parsed = SendCodeBody.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({
      error: 'invalid_body',
      message: '请求体不合法',
      details: parsed.error.issues,
    })
  }
  const { phone, purpose } = parsed.data

  const result = await sendVerificationCode(phone, purpose)
  if (!result.ok) {
    if (result.error === 'cooldown') {
      return res.status(429).json({ error: 'cooldown', message: `请 ${result.cooldownSec} 秒后再试`, cooldownSec: result.cooldownSec })
    }
    if (result.error === 'rate_limit_exceeded') {
      return res.status(429).json({ error: 'rate_limit', message: '1 小时内最多 10 条验证码' })
    }
    return res.status(500).json({ error: 'send_failed', message: result.error })
  }

  return res.json({
    ok: true,
    provider: result.provider,
    message: result.provider === 'mock' ? '验证码已生成(开发模式,见后端日志)' : '验证码已发送',
    // mock 模式回传验证码(仅开发)
    ...(result.provider === 'mock' && { devCode: result.mockCode }),
  })
})

const PhoneLoginBody = z.object({
  phone: z.string().regex(/^1[3-9]\d{9}$/, '手机号格式不正确'),
  code: z.string().regex(/^\d{5}$/, '验证码必须 5 位数字'),
  nickname: z.string().max(40).optional(),
})

authRouter.post('/phone-login', async (req: Request, res: Response) => {
  const parsed = PhoneLoginBody.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({
      error: 'invalid_body',
      message: '请求体不合法',
      details: parsed.error.issues,
    })
  }
  const { phone, code, nickname } = parsed.data

  // 1. 校验验证码
  const codeResult = verifyCode(phone, code, 'login')
  if (!codeResult.ok) {
    return res.status(401).json({ error: codeResult.error || 'invalid_code', message: '验证码错误或已过期' })
  }

  // 2. 找或建用户
  const user = findOrCreatePhoneUser(phone, nickname || '')

  // 3. 签 token
  const accessToken = signAccessToken(user.id)
  const refreshToken = signRefreshToken(user.id)

  return res.json({
    ok: true,
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      email: user.email,
      nickname: user.nickname,
      avatarUrl: user.avatarUrl,
      phone: user.phone,
      createdAt: user.createdAt,
    },
  })
})

// =============== POST /api/auth/avatar (V3.5 头像上传,V3.8 改用 StorageProvider) ===============

// multer 配: memory storage(文件先到 buffer)+ 2MB 限 + 图片类型
const avatarUpload = multer({
  storage: multer.memoryStorage(),
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
  async (req: Request, res: Response) => {
    if (!req.file) {
      return res.status(400).json({ error: 'no_file', message: '请提供 avatar 文件' })
    }
    const userId = (req as any).userId
    const storage = getStorageProvider()
    const result = await storage.uploadFile(
      req.file.originalname,
      req.file.buffer,
      req.file.mimetype
    )
    if (!result.ok) {
      return res.status(500).json({ error: 'upload_failed', message: result.error })
    }

    // 更新 DB
    const now = Date.now()
    db.prepare('UPDATE users SET avatar_url = ?, updated_at = ? WHERE id = ?')
      .run(result.url, now, userId)

    return res.json({
      ok: true,
      avatarUrl: result.url,
      size: result.size,
      provider: result.provider,
    })
  }
)

// =============== POST /api/upload/image (V3.8 通用图片上传,供写信插图) ===============

const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },  // 5MB(头像 2MB,插图可大点)
  fileFilter: (_req, file, cb) => {
    const allowed = /^image\/(jpeg|jpg|png|webp|gif)$/i
    if (!allowed.test(file.mimetype)) {
      return cb(new Error('只支持 jpg/png/webp/gif 图片'))
    }
    cb(null, true)
  },
})

export const uploadRouter = Router()
uploadRouter.post(
  '/image',
  requireAuth,
  imageUpload.single('file'),
  async (req: Request, res: Response) => {
    if (!req.file) {
      return res.status(400).json({ error: 'no_file', message: '请提供文件' })
    }
    const storage = getStorageProvider()
    const result = await storage.uploadFile(
      req.file.originalname,
      req.file.buffer,
      req.file.mimetype
    )
    if (!result.ok) {
      return res.status(500).json({ error: 'upload_failed', message: result.error })
    }
    return res.json({
      ok: true,
      url: result.url,
      key: result.key,
      size: result.size,
      provider: result.provider,
    })
  }
)

// 删除头像
authRouter.delete('/avatar', requireAuth, async (req: Request, res: Response) => {
  const userId = (req as any).userId
  const row = db.prepare('SELECT avatar_url FROM users WHERE id = ?').get(userId) as { avatar_url: string | null } | undefined
  if (row?.avatar_url) {
    // 抽 key(URL 最后一段)
    const key = row.avatar_url.split('/').pop() || ''
    if (key) {
      const storage = getStorageProvider()
      await storage.deleteFile(key)
    }
    db.prepare('UPDATE users SET avatar_url = NULL, updated_at = ? WHERE id = ?')
      .run(Date.now(), userId)
  }
  return res.json({ ok: true, avatarUrl: null })
})

// Export upload router(给 index.ts 用)
// export { uploadRouter } // moved to top-level declaration
