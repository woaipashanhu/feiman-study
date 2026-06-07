/**
 * ============================================================
 *  routes-aha.ts — V4 啊哈时刻 API
 *
 *  端点:
 *    POST   /api/aha/moments       创建(text 或 audio)
 *    GET    /api/aha/moments       列表(分页,按 created_at DESC)
 *    GET    /api/aha/moments/:id   详情
 *    PATCH  /api/aha/moments/:id   更新(标签/心情/内容)
 *    DELETE /api/aha/moments/:id   删除
 *    POST   /api/aha/upload-audio  音频文件上传(multipart)
 *
 *  特点:
 *    - 需登录(用户的灵感归用户)
 *    - storage 字段标 'cloud'(走云)或 'local'(只本地,后端收个引用不存)
 *    - 永远私密(不暴露给其他用户)
 * ============================================================
 */
import { Router, type Request, type Response } from 'express'
import multer from 'multer'
import { z } from 'zod'
import { randomUUID } from 'node:crypto'
import { db, rowToUser, type UserRow } from './db.js'
import { requireAuth, getCurrentUser } from './auth.js'
import { getStorageProvider } from './storage-provider.js'
import { registry, ErrorResponse } from './openapi-registry.js'

export const ahaRouter = Router()

// =============== multer: audio upload ===============

const audioUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },  // 10MB(60s mono 64kbps ≈ 500KB)
  fileFilter: (_req, file, cb) => {
    const allowed = /^audio\/(mpeg|mp3|wav|webm|ogg|aac|m4a|mp4|x-m4a)$/i
    if (!allowed.test(file.mimetype)) {
      return cb(new Error('只支持 audio/mpeg / wav / webm / ogg / aac / m4a'))
    }
    cb(null, true)
  },
})

// =============== Zod schemas ===============

const CreateMomentBody = z.object({
  type: z.enum(['text', 'audio']),
  content: z.string().max(2000).optional(),
  audioUrl: z.string().max(500).optional(),
  audioKey: z.string().max(200).optional(),
  audioDurationMs: z.number().int().min(0).max(600_000).optional(),
  storage: z.enum(['cloud', 'local']),
  tags: z.string().max(200).optional(),
  mood: z.string().max(10).optional(),
})

const UpdateMomentBody = z.object({
  content: z.string().max(2000).optional(),
  tags: z.string().max(200).optional(),
  mood: z.string().max(10).optional(),
})

// =============== 创建 ===============

ahaRouter.post('/moments', requireAuth, (req: Request, res: Response) => {
  const parsed = CreateMomentBody.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ error: 'invalid_body', message: '参数错误', details: parsed.error.issues })
  }
  const { type, content, audioUrl, audioKey, audioDurationMs, storage, tags, mood } = parsed.data
  const userId = (req as any).userId

  // 校验:type=text 必须有 content,type=audio 必须有 audioUrl
  if (type === 'text' && !content) {
    return res.status(400).json({ error: 'missing_content', message: 'text 类型必须提供 content' })
  }
  if (type === 'audio' && !audioUrl) {
    return res.status(400).json({ error: 'missing_audio', message: 'audio 类型必须先调用 upload-audio' })
  }

  const id = randomUUID()
  const now = Date.now()
  db.prepare(`
    INSERT INTO aha_moments (id, user_id, type, content, audio_url, audio_duration_ms, storage, tags, mood, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, userId, type, content || null, audioUrl || null, audioDurationMs || null, storage, tags || null, mood || null, now, now)

  return res.status(201).json({
    ok: true,
    moment: { id, type, content, audioUrl, audioKey, audioDurationMs, storage, tags, mood, createdAt: now, updatedAt: now },
  })
})

// =============== 列表 ===============

ahaRouter.get('/moments', requireAuth, (req: Request, res: Response) => {
  const userId = (req as any).userId
  const limit = Math.min(Math.max(parseInt(String(req.query.limit ?? '50')), 1), 200)
  const offset = Math.max(parseInt(String(req.query.offset ?? '0')), 0)
  const storage = req.query.storage ? String(req.query.storage) : null

  let sql = `SELECT id, type, content, audio_url, audio_duration_ms, storage, tags, mood, created_at, updated_at
             FROM aha_moments WHERE user_id = ?`
  const params: any[] = [userId]
  if (storage === 'cloud' || storage === 'local') {
    sql += ` AND storage = ?`
    params.push(storage)
  }
  sql += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`
  params.push(limit, offset)

  const rows = db.prepare(sql).all(...params) as any[]
  const total = (db.prepare(`SELECT COUNT(*) as c FROM aha_moments WHERE user_id = ?`).get(userId) as { c: number }).c

  return res.json({
    ok: true,
    moments: rows.map((r) => ({
      id: r.id,
      type: r.type,
      content: r.content,
      audioUrl: r.audio_url,
      audioDurationMs: r.audio_duration_ms,
      storage: r.storage,
      tags: r.tags,
      mood: r.mood,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    })),
    total,
    limit,
    offset,
  })
})

// =============== 详情 ===============

ahaRouter.get('/moments/:id', requireAuth, (req: Request, res: Response) => {
  const userId = (req as any).userId
  const id = String(req.params.id)
  const row = db.prepare(`
    SELECT id, type, content, audio_url, audio_duration_ms, storage, tags, mood, created_at, updated_at
    FROM aha_moments WHERE id = ? AND user_id = ?
  `).get(id, userId) as any

  if (!row) return res.status(404).json({ error: 'not_found', message: '啊哈时刻不存在' })
  return res.json({
    ok: true,
    moment: {
      id: row.id,
      type: row.type,
      content: row.content,
      audioUrl: row.audio_url,
      audioDurationMs: row.audio_duration_ms,
      storage: row.storage,
      tags: row.tags,
      mood: row.mood,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    },
  })
})

// =============== 更新(只能改 content/tags/mood) ===============

ahaRouter.patch('/moments/:id', requireAuth, (req: Request, res: Response) => {
  const userId = (req as any).userId
  const id = String(req.params.id)
  const parsed = UpdateMomentBody.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ error: 'invalid_body', message: '参数错误', details: parsed.error.issues })
  }

  // 校验权限
  const existing = db.prepare(`SELECT user_id FROM aha_moments WHERE id = ?`).get(id) as { user_id: string } | undefined
  if (!existing) return res.status(404).json({ error: 'not_found' })
  if (existing.user_id !== userId) return res.status(403).json({ error: 'forbidden' })

  const updates: string[] = []
  const params: any[] = []
  if (parsed.data.content !== undefined) { updates.push('content = ?'); params.push(parsed.data.content) }
  if (parsed.data.tags !== undefined) { updates.push('tags = ?'); params.push(parsed.data.tags) }
  if (parsed.data.mood !== undefined) { updates.push('mood = ?'); params.push(parsed.data.mood) }
  if (updates.length === 0) return res.status(400).json({ error: 'no_updates' })
  updates.push('updated_at = ?'); params.push(Date.now())
  params.push(id)

  db.prepare(`UPDATE aha_moments SET ${updates.join(', ')} WHERE id = ?`).run(...params)
  return res.json({ ok: true })
})

// =============== 删除 ===============

ahaRouter.delete('/moments/:id', requireAuth, (req: Request, res: Response) => {
  const userId = (req as any).userId
  const id = String(req.params.id)
  const existing = db.prepare(`SELECT user_id, audio_url, storage FROM aha_moments WHERE id = ?`).get(id) as { user_id: string; audio_url: string | null; storage: string } | undefined
  if (!existing) return res.status(404).json({ error: 'not_found' })
  if (existing.user_id !== userId) return res.status(403).json({ error: 'forbidden' })

  db.prepare(`DELETE FROM aha_moments WHERE id = ?`).run(id)

  // 删云端音频文件
  if (existing.audio_url && existing.storage === 'cloud') {
    const key = existing.audio_url.split('/').pop() || ''
    if (key) {
      getStorageProvider().deleteFile(key).catch(() => {})
    }
  }
  return res.json({ ok: true })
})

// =============== 音频上传 ===============

ahaRouter.post(
  '/upload-audio',
  requireAuth,
  audioUpload.single('file'),
  async (req: Request, res: Response) => {
    if (!req.file) {
      return res.status(400).json({ error: 'no_file', message: '请提供音频文件' })
    }
    const userId = (req as any).userId
    const storage = (req.body.storage === 'local' ? 'local' : 'cloud') as 'local' | 'cloud'
    const ext = req.file.originalname.split('.').pop() || 'm4a'

    if (storage === 'local') {
      // 本地存储:后端只返回 metadata,内容给前端 IndexedDB 存
      // 实际上我们仍让后端存(到本地磁盘),前端可后续取回
      const key = `aha-local-${userId.slice(0, 8)}-${Date.now()}-${randomUUID().slice(0, 8)}.${ext}`
      const result = await getStorageProvider().uploadFile(req.file.originalname, req.file.buffer, req.file.mimetype)
      if (!result.ok) {
        return res.status(500).json({ error: 'upload_failed', message: result.error })
      }
      return res.json({
        ok: true,
        storage: 'local',
        url: result.url,
        key: result.key,
        size: result.size,
        provider: result.provider,
        // V4 提示:本地存储实际仍由后端接收,前端可以忽略 URL,只取 key/size
        // 真正纯本地需要前端 MediaRecorder + IndexedDB
        hint: 'V4 简化:本地存储后端也存了,只 metadata 标 local,纯本地请用前端 MediaRecorder 直接 IndexedDB',
      })
    }

    // cloud:正常存(走 StorageProvider,可能 OSS)
    const result = await getStorageProvider().uploadFile(req.file.originalname, req.file.buffer, req.file.mimetype)
    if (!result.ok) {
      return res.status(500).json({ error: 'upload_failed', message: result.error })
    }
    return res.json({
      ok: true,
      storage: 'cloud',
      url: result.url,
      key: result.key,
      size: result.size,
      provider: result.provider,
    })
  }
)

// =============== OpenAPI 注解 ===============

const AhaMoment = z.object({
  id: z.string().uuid(),
  type: z.enum(['text', 'audio']),
  content: z.string().nullable().optional(),
  audioUrl: z.string().nullable().optional(),
  audioKey: z.string().nullable().optional(),
  audioDurationMs: z.number().int().nullable().optional(),
  storage: z.enum(['cloud', 'local']),
  tags: z.string().nullable().optional(),
  mood: z.string().nullable().optional(),
  createdAt: z.number(),
  updatedAt: z.number(),
}).openapi('AhaMoment')

registry.registerPath({
  method: 'post',
  path: '/api/aha/moments',
  tags: ['Aha Moments'],
  summary: '创建啊哈时刻(text 或 audio)',
  security: [{ bearerAuth: [] }],
  request: { body: { content: { 'application/json': { schema: CreateMomentBody } } } },
  responses: {
    201: { description: '创建成功', content: { 'application/json': { schema: z.object({ ok: z.boolean(), moment: AhaMoment }) } } },
    400: { description: '参数错误', content: { 'application/json': { schema: ErrorResponse } } },
    401: { description: '未登录', content: { 'application/json': { schema: ErrorResponse } } },
  },
})

registry.registerPath({
  method: 'get',
  path: '/api/aha/moments',
  tags: ['Aha Moments'],
  summary: '啊哈时刻列表(分页)',
  security: [{ bearerAuth: [] }],
  request: {
    query: z.object({
      limit: z.string().optional(),
      offset: z.string().optional(),
      storage: z.enum(['cloud', 'local']).optional(),
    }),
  },
  responses: {
    200: { description: '列表', content: { 'application/json': { schema: z.object({ ok: z.boolean(), moments: z.array(AhaMoment), total: z.number().int() }) } } },
    401: { description: '未登录', content: { 'application/json': { schema: ErrorResponse } } },
  },
})

registry.registerPath({
  method: 'delete',
  path: '/api/aha/moments/{id}',
  tags: ['Aha Moments'],
  summary: '删除啊哈时刻',
  security: [{ bearerAuth: [] }],
  request: { params: z.object({ id: z.string().uuid() }) },
  responses: {
    200: { description: '删除成功' },
    404: { description: '不存在', content: { 'application/json': { schema: ErrorResponse } } },
  },
})
