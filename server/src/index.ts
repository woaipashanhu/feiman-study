/**
 * ============================================================
 *  费曼 V3 — 小纸条后端入口
 *
 *  端口:    3000 (生产可被 nginx 反代到 8890/api/*)
 *  启动:    npm run dev  (开发) | npm start (生产)
 *  健康:    GET /api/health
 *
 *  路由:
 *    /api/health          GET   存活探针
 *    /api/letters         POST  创建纸条
 *    /api/letters         GET   列表(默认 20, max 100)
 *    /api/letters/:id     GET   按 id 读
 *    /api/letters/:id/collect POST  收藏(全局计数)
 *    /api/letters/by-token/:token GET  按分享 token 读
 * ============================================================
 */
import express, { type Request, type Response, type NextFunction } from 'express'
import cors from 'cors'
import { lettersRouter } from './routes-letters.js'

const PORT = parseInt(process.env.PORT || '3000', 10)
const HOST = process.env.HOST || '0.0.0.0'
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*'

const app = express()

// 基础中间件
app.use(
  cors({
    origin: CORS_ORIGIN === '*' ? true : CORS_ORIGIN.split(','),
    credentials: false,
  })
)
app.use(express.json({ limit: '64kb' }))

// 请求日志(开发期)
app.use((req, _res, next) => {
  const ts = new Date().toISOString().slice(11, 19)
  console.log(`[${ts}] ${req.method} ${req.url}`)
  next()
})

// 路由
app.use('/api/letters', lettersRouter)

// 健康检查
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    ok: true,
    service: 'feiman-letters-server',
    version: '0.1.0',
    uptime: process.uptime(),
    ts: Date.now(),
  })
})

// 根路径
app.get('/', (_req: Request, res: Response) => {
  res.json({
    ok: true,
    service: 'feiman-letters-server',
    docs: 'https://47.99.101.168:8890/letters',
  })
})

// 404
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'not_found', path: _req.url })
})

// 错误兜底
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[error]', err)
  res.status(500).json({
    error: 'internal_error',
    message: process.env.NODE_ENV === 'production' ? '服务器内部错误' : err.message,
  })
})

// 启动
app.listen(PORT, HOST, () => {
  console.log(`[feiman-letters] listening on http://${HOST}:${PORT}`)
  console.log(`[feiman-letters] CORS origin: ${CORS_ORIGIN}`)
})
