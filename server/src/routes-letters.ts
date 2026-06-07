/**
 * ============================================================
 *  /api/letters 路由 — 小纸条 5 个核心 API
 *
 *  V1 (无登录) 范围:
 *    POST   /api/letters                  创建一张纸条
 *    GET    /api/letters/:id              通过 id 读取
 *    GET    /api/letters/by-token/:token  通过分享 token 读取
 *    GET    /api/letters?limit=20        最近 N 张公开纸条
 *    POST   /api/letters/:id/collect     收藏(全局计数)
 *
 *  V2 加:
 *    POST   /api/letters/:id/star        收藏到当前用户的"时空纸条"(需登录)
 *    POST   /api/auth/register           注册
 *    POST   /api/auth/login              登录
 *    GET    /api/me/inbox                我的收到的纸条
 * ============================================================
 */
import { Router, type Request, type Response } from 'express'
import { z } from 'zod'
import { db, rowToLetter, type LetterRow } from './db.js'

export const lettersRouter = Router()

// =============== Zod schemas ===============

const CreateLetterBody = z.object({
  content: z.string().min(1).max(2000),
  author: z.string().max(40).optional(),
  bgKey: z.enum(['ivory', 'midnight', 'kraft']).default('ivory'),
  translations: z
    .object({
      classicalChinese: z.string().max(2000).optional(),
      english: z.string().max(2000).optional(),
    })
    .optional(),
})

// =============== Helpers ===============

function genId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`
}

function genShareToken(): string {
  return `sl_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`
}

// =============== Prepared statements ===============

const stmtInsert = db.prepare(`
  INSERT INTO letters (id, content, author, bg_key, translations, share_token, created_at, updated_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`)

const stmtGetById = db.prepare(`SELECT * FROM letters WHERE id = ?`)
const stmtGetByToken = db.prepare(`SELECT * FROM letters WHERE share_token = ?`)
const stmtGetRecent = db.prepare(`
  SELECT * FROM letters
  ORDER BY created_at DESC
  LIMIT ?
`)
const stmtIncrementView = db.prepare(`
  UPDATE letters SET view_count = view_count + 1 WHERE id = ?
`)
const stmtIncrementCollect = db.prepare(`
  UPDATE letters SET collect_count = collect_count + 1, updated_at = ? WHERE id = ?
`)

// =============== POST /api/letters ===============

lettersRouter.post('/', (req: Request, res: Response) => {
  const parsed = CreateLetterBody.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({
      error: 'invalid_body',
      message: '请求体不合法',
      details: parsed.error.issues,
    })
  }
  const { content, author, bgKey, translations } = parsed.data
  const now = Date.now()
  const id = genId('lt')
  const shareToken = genShareToken()
  stmtInsert.run(
    id,
    content,
    author ?? null,
    bgKey,
    translations ? JSON.stringify(translations) : null,
    shareToken,
    now,
    now
  )
  const row = stmtGetById.get(id) as LetterRow | undefined
  if (!row) {
    return res.status(500).json({ error: 'insert_failed' })
  }
  return res.status(201).json({
    ok: true,
    letter: rowToLetter(row),
  })
})

// =============== GET /api/letters?limit=20 ===============

lettersRouter.get('/', (req: Request, res: Response) => {
  const limit = Math.min(Math.max(parseInt(String(req.query.limit ?? '20')), 1), 100)
  const rows = stmtGetRecent.all(limit) as LetterRow[]
  return res.json({
    ok: true,
    letters: rows.map(rowToLetter),
  })
})

// =============== GET /api/letters/by-token/:token ===============

lettersRouter.get('/by-token/:token', (req: Request, res: Response) => {
  const token = String(req.params.token)
  if (!token || !/^sl_[a-z0-9]+$/i.test(token)) {
    return res.status(400).json({ error: 'invalid_token_format' })
  }
  const row = stmtGetByToken.get(token) as LetterRow | undefined
  if (!row) {
    return res.status(404).json({ error: 'not_found' })
  }
  stmtIncrementView.run(row.id)
  return res.json({
    ok: true,
    letter: rowToLetter({ ...row, view_count: row.view_count + 1 }),
  })
})

// =============== GET /api/letters/:id ===============

lettersRouter.get('/:id', (req: Request, res: Response) => {
  const id = String(req.params.id)
  if (!id || !/^lt_[a-z0-9]+$/i.test(id)) {
    return res.status(400).json({ error: 'invalid_id_format' })
  }
  const row = stmtGetById.get(id) as LetterRow | undefined
  if (!row) {
    return res.status(404).json({ error: 'not_found' })
  }
  return res.json({
    ok: true,
    letter: rowToLetter(row),
  })
})

// =============== POST /api/letters/:id/collect ===============

lettersRouter.post('/:id/collect', (req: Request, res: Response) => {
  const id = String(req.params.id)
  if (!id || !/^lt_[a-z0-9]+$/i.test(id)) {
    return res.status(400).json({ error: 'invalid_id_format' })
  }
  const row = stmtGetById.get(id) as LetterRow | undefined
  if (!row) {
    return res.status(404).json({ error: 'not_found' })
  }
  const now = Date.now()
  stmtIncrementCollect.run(now, id)
  return res.json({
    ok: true,
    collectCount: row.collect_count + 1,
  })
})
