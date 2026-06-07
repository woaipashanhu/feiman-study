/**
 * ============================================================
 *  费曼 V3 — 小纸条后端入口
 *
 *  端口:    3000 (生产可被 nginx 反代到 8890/api/*)
 *  启动:    npm run dev  (开发) | npm start (生产)
 *  健康:    GET /api/health
 *
 *  路由:
 *    /api/health                 GET   存活探针
 *    /api/auth/register          POST  注册
 *    /api/auth/login             POST  登录
 *    /api/auth/me                GET   当前用户(需登录)
 *    /api/auth/refresh           POST  换新 access_token
 *    /api/auth/logout            POST  登出
 *    /api/letters                POST  创建纸条
 *    /api/letters                GET   列表(默认 20, max 100)
 *    /api/letters/:id            GET   按 id 读
 *    /api/letters/:id/collect    POST  收藏(全局计数)
 *    /api/letters/:id/star       POST  收藏到"时空纸条"(需登录)
 *    /api/letters/by-token/:t    GET   按分享 token 读
 *    /api/me/inbox               GET   当前用户的收件箱(需登录)
 * ============================================================
 */
import express, { type Request, type Response, type NextFunction } from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import helmet from 'helmet'
import * as Sentry from '@sentry/node'
import swaggerUi from 'swagger-ui-express'
import { lettersRouter } from './routes-letters.js'
import { authRouter, uploadRouter } from './routes-auth.js'
import { aiRouter } from './routes-ai.js'
import { ahaRouter } from './routes-aha.js'
import { attachWebSocketServer } from './ws.js'
import { startBlacklistCleanup } from './auth.js'
import { db, rowToLetter, type LetterRow } from './db.js'
import { requireAuth, getCurrentUser } from './auth.js'
import { ensureSmsTables } from './sms-provider.js'
import { ensureWechatTables } from './wechat-provider.js'
import { getStorageProvider } from './storage-provider.js'
import { getDbAdapter } from './db-adapter.js'
import { generateOpenAPIDocument, registry, InboxResponse, ErrorResponse } from './openapi-registry.js'
import { z } from 'zod'

// =============== OpenAPI 注解 ===============

registry.registerPath({
  method: 'get',
  path: '/api/me/inbox',
  tags: ['Inbox'],
  summary: '当前用户的收件箱(我写的 + 我 star 过的)',
  security: [{ bearerAuth: [] }],
  request: {
    query: z.object({ limit: z.string().optional() }),
  },
  responses: {
    200: { description: '收件箱', content: { 'application/json': { schema: InboxResponse } } },
    401: { description: '未登录', content: { 'application/json': { schema: ErrorResponse } } },
  },
})

registry.registerPath({
  method: 'get',
  path: '/api/health',
  tags: ['Health'],
  summary: '健康检查(给 nginx / 阿里云监控)',
  responses: {
    200: { description: 'ok' },
  },
})

// V3.8 Storage Upload 注解
registry.registerPath({
  method: 'post',
  path: '/api/upload/image',
  tags: ['Upload'],
  summary: '上传图片(供写信插图/其他场景,5MB 限,返回 URL)',
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        'multipart/form-data': {
          schema: z.object({
            file: z.any().openapi({ description: '图片文件(jpg/png/webp/gif,≤5MB)', type: 'string', format: 'binary' }),
          }),
        },
      },
    },
  },
  responses: {
    200: { description: '上传成功,返回 url + key + provider', content: { 'application/json': { schema: z.object({ ok: z.boolean(), url: z.string(), key: z.string(), size: z.number().int(), provider: z.enum(['local', 'oss']) }) } } },
    400: { description: '无文件/类型错', content: { 'application/json': { schema: ErrorResponse } } },
    401: { description: '未登录', content: { 'application/json': { schema: ErrorResponse } } },
  },
})

// V3.8 Wechat OAuth 注解
registry.registerPath({
  method: 'get',
  path: '/api/auth/wechat/start',
  tags: ['Auth'],
  summary: '启动微信 OAuth 授权(redirect 到微信)',
  responses: {
    302: { description: '重定向到微信授权页' },
    503: { description: '微信登录未配置(等用户给 appid+secret)', content: { 'application/json': { schema: ErrorResponse } } },
  },
})

registry.registerPath({
  method: 'get',
  path: '/api/auth/wechat/callback',
  tags: ['Auth'],
  summary: '微信 OAuth 回调(微信 server-to-server 调用,带 code + state)',
  request: {
    query: z.object({
      code: z.string(),
      state: z.string().optional(),
    }),
  },
  responses: {
    302: { description: '登录成功,重定向到 /auth/wechat-callback?token=...&refresh=...' },
    400: { description: '缺少 code', content: { 'application/json': { schema: ErrorResponse } } },
    403: { description: 'state 不匹配(CSRF)', content: { 'application/json': { schema: ErrorResponse } } },
    500: { description: '微信登录失败', content: { 'application/json': { schema: ErrorResponse } } },
  },
})

const PORT = parseInt(process.env.PORT || '3000', 10)
const HOST = process.env.HOST || '0.0.0.0'
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*'

// V3.6 错误监控:初始化 Sentry(占位 DSN 时静默)
// 上线前用户填真实 SENTRY_DSN 即可激活
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'production',
    tracesSampleRate: 0.2,
    // 忽略健康检查 + 收信落地页 401
    denyUrls: [
      /\/api\/health/,
      /\/api\/letters\/by-token\//,
    ],
    beforeSendTransaction(event) {
      if (event.transaction === 'GET /api/health') return null
      return event
    },
  })
  console.log('[Sentry] backend initialized')
}

const app = express()

// V3.8 安全头(Helmet)
app.use(helmet({
  // Swagger UI 需 inline style + script
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
  // 跨域图片(头像)允许
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}))

// 基础中间件
app.use(
  cors({
    origin: CORS_ORIGIN === '*' ? true : CORS_ORIGIN.split(','),
    credentials: false,
  })
)
app.use(express.json({ limit: '64kb' }))
app.use(cookieParser())

// 静态服务 — 头像图片
import { existsSync, mkdirSync } from 'node:fs'
const AVATAR_DIR = process.env.AVATAR_DIR || '/var/lib/feiman-letters/avatars'
if (!existsSync(AVATAR_DIR)) mkdirSync(AVATAR_DIR, { recursive: true })
app.use(
  '/avatars',
  express.static(AVATAR_DIR, {
    maxAge: '7d',
    fallthrough: true,
  })
)

// 请求日志(开发期)
app.use((req, _res, next) => {
  const ts = new Date().toISOString().slice(11, 19)
  console.log(`[${ts}] ${req.method} ${req.url}`)
  next()
})

// 路由
app.use('/api/auth', authRouter)
app.use('/api/letters', lettersRouter)
app.use('/api/ai', aiRouter)
app.use('/api/aha', ahaRouter)
app.use('/api/upload', uploadRouter)

// 收件箱(V3 需登录,放主路由用 /api/me/inbox)
app.get('/api/me/inbox', requireAuth, (req: Request, res: Response) => {
  const limit = Math.min(Math.max(parseInt(String(req.query.limit ?? '20')), 1), 100)
  // "我写的" 或 "我 star 过的" 都会进收件箱
  const stmtGetInbox = db.prepare(`
    SELECT l.* FROM letters l
    LEFT JOIN user_letter_actions a ON a.letter_id = l.id AND a.user_id = ?
    WHERE l.author_user_id = ? OR a.is_starred = 1
    ORDER BY l.created_at DESC
    LIMIT ?
  `)
  const rows = stmtGetInbox.all(req.userId, req.userId, limit) as LetterRow[]
  return res.json({
    ok: true,
    user: getCurrentUser(req),
    letters: rows.map(rowToLetter),
  })
})

// 健康检查
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    ok: true,
    service: 'feiman-letters-server',
    version: '0.2.0',
    uptime: process.uptime(),
    ts: Date.now(),
  })
})

// =============== OpenAPI / Swagger UI ===============

const openapiDocument = generateOpenAPIDocument()
app.get('/api/openapi.json', (_req: Request, res: Response) => {
  res.json(openapiDocument)
})
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openapiDocument, {
  customSiteTitle: '小纸条 V3 API 文档',
  customCss: '.topbar { display: none }',  // 隐藏 swagger 顶部条
}))
console.log('[docs] Swagger UI: /api/docs  |  OpenAPI JSON: /api/openapi.json')

// 根路径
app.get('/', (_req: Request, res: Response) => {
  res.json({
    ok: true,
    service: 'feiman-letters-server',
    version: '0.2.0',
    docs: 'https://47.99.101.168:8890/letters',
  })
})

// 404
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'not_found', path: req.url })
})

// 错误兜底
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[error]', err)
  // 同步到 Sentry(已 init 时)
  Sentry.captureException(err)
  res.status(500).json({
    error: 'internal_error',
    message: process.env.NODE_ENV === 'production' ? '服务器内部错误' : err.message,
  })
})

// 启动
const server = app.listen(PORT, HOST, () => {
  console.log(`[feiman-letters] listening on http://${HOST}:${PORT}`)
  console.log(`[feiman-letters] CORS origin: ${CORS_ORIGIN}`)
  console.log(`[feiman-letters] version 0.3.1 (auth + letters + AI + WS)`)
  console.log(`[feiman-letters] LONGCAT_API_KEY: ${process.env.LONGCAT_API_KEY ? '✓ set' : '✗ not set (will use mock)'}`)
  console.log(`[feiman-letters] SMS provider: ${process.env.SMS_PROVIDER || 'mock'}`)
  // V3.8 主动初始化 storage provider 以打日志
  getStorageProvider()
  // V3.8 主动初始化 db adapter 以打日志
  getDbAdapter()
})

// V3.8 SMS 表启动时建
ensureSmsTables()
ensureWechatTables()

// 启动黑名单定期清理
startBlacklistCleanup()

// 挂 WebSocket
attachWebSocketServer(server)
