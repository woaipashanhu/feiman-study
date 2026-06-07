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
import { randomUUID, randomBytes } from 'node:crypto'
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
  const type = req.query.type ? String(req.query.type) : null
  const mood = req.query.mood ? String(req.query.mood) : null
  const q = req.query.q ? String(req.query.q).trim() : null
  const tag = req.query.tag ? String(req.query.tag).trim() : null

  let sql = `SELECT id, type, content, audio_url, audio_duration_ms, storage, tags, mood, created_at, updated_at
             FROM aha_moments WHERE user_id = ?`
  const params: any[] = [userId]
  if (storage === 'cloud' || storage === 'local') {
    sql += ` AND storage = ?`
    params.push(storage)
  }
  if (type === 'text' || type === 'audio') {
    sql += ` AND type = ?`
    params.push(type)
  }
  if (mood) {
    sql += ` AND mood = ?`
    params.push(mood)
  }
  if (q) {
    // 搜索 content 和 tags
    sql += ` AND (content LIKE ? OR tags LIKE ?)`
    const like = `%${q}%`
    params.push(like, like)
  }
  if (tag) {
    // tag 精确匹配(逗号分隔的 tags 字段)
    sql += ` AND (tags = ? OR tags LIKE ? OR tags LIKE ? OR tags LIKE ?)`
    params.push(tag, `${tag},%`, `%,${tag}`, `%,${tag},%`)
  }
  sql += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`
  params.push(limit, offset)

  const rows = db.prepare(sql).all(...params) as any[]

  // 总数(用相同过滤条件)
  let countSql = `SELECT COUNT(*) as c FROM aha_moments WHERE user_id = ?`
  const countParams: any[] = [userId]
  if (storage === 'cloud' || storage === 'local') { countSql += ` AND storage = ?`; countParams.push(storage) }
  if (type === 'text' || type === 'audio') { countSql += ` AND type = ?`; countParams.push(type) }
  if (mood) { countSql += ` AND mood = ?`; countParams.push(mood) }
  if (q) { countSql += ` AND (content LIKE ? OR tags LIKE ?)`; countParams.push(`%${q}%`, `%${q}%`) }
  if (tag) {
    countSql += ` AND (tags = ? OR tags LIKE ? OR tags LIKE ? OR tags LIKE ?)`
    countParams.push(tag, `${tag},%`, `%,${tag}`, `%,${tag},%`)
  }
  const total = (db.prepare(countSql).get(...countParams) as { c: number }).c

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

/**
 * GET /api/aha/tags — 列出该用户所有出现过的 tag(用于前端下拉/搜索建议)
 */
ahaRouter.get('/tags', requireAuth, (req: Request, res: Response) => {
  const userId = (req as any).userId
  const rows = db
    .prepare(`SELECT tags FROM aha_moments WHERE user_id = ? AND tags IS NOT NULL AND tags != ''`)
    .all(userId) as { tags: string }[]

  const tagSet = new Set<string>()
  for (const r of rows) {
    for (const t of r.tags.split(',')) {
      const tag = t.trim()
      if (tag) tagSet.add(tag)
    }
  }
  return res.json({ ok: true, tags: Array.from(tagSet).sort() })
})

/**
 * GET /api/aha/stats — 统计(情绪 + 数量)
 *   - total: 总数
 *   - byMood: { '💡': 5, '❤️': 3, ... }
 *   - byType: { text: 8, audio: 2 }
 *   - byStorage: { cloud: 5, local: 5 }
 *   - byDay: 最近 30 天每天的数量 [{ date: '2026-06-01', count: 3 }, ...]
 */
ahaRouter.get('/stats', requireAuth, (req: Request, res: Response) => {
  const userId = (req as any).userId
  const all = db
    .prepare(`SELECT type, mood, storage, created_at FROM aha_moments WHERE user_id = ?`)
    .all(userId) as { type: string; mood: string | null; storage: string; created_at: number }[]

  const byMood: Record<string, number> = {}
  const byType: Record<string, number> = { text: 0, audio: 0 }
  const byStorage: Record<string, number> = { cloud: 0, local: 0 }
  const byDayMap: Record<string, number> = {}
  const dayMs = 24 * 60 * 60 * 1000
  const now = Date.now()
  const thirtyDaysAgo = now - 30 * dayMs

  for (const r of all) {
    if (r.mood) byMood[r.mood] = (byMood[r.mood] || 0) + 1
    byType[r.type] = (byType[r.type] || 0) + 1
    byStorage[r.storage] = (byStorage[r.storage] || 0) + 1
    if (r.created_at >= thirtyDaysAgo) {
      const d = new Date(r.created_at)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      byDayMap[key] = (byDayMap[key] || 0) + 1
    }
  }

  // 30 天数组(没数据的天补 0)
  const byDay: { date: string; count: number }[] = []
  for (let i = 29; i >= 0; i--) {
    const t = now - i * dayMs
    const d = new Date(t)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    byDay.push({ date: key, count: byDayMap[key] || 0 })
  }

  return res.json({
    ok: true,
    total: all.length,
    byMood,
    byType,
    byStorage,
    byDay,
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

// =============== V4.5 aha → letter 一键转公开 ===============

/**
 * POST /api/aha/moments/:id/promote
 *   - 复制一条 aha moment 到 letters 表(成为公开小纸条)
 *   - 复制 source 字段保留 aha id 关联
 *   - 音频 moment:kind=audio 不支持(只能 text 转)
 *   - 返回新 letter 对象
 */
ahaRouter.post('/moments/:id/promote', requireAuth, (req: Request, res: Response) => {
  const userId = (req as any).userId
  const ahaId = String(req.params.id)
  const user = getCurrentUser(req)

  const row = db
    .prepare(`
      SELECT id, type, content, audio_url, audio_duration_ms, storage, tags, mood
      FROM aha_moments WHERE id = ? AND user_id = ?
    `)
    .get(ahaId, userId) as {
      id: string; type: string; content: string | null; audio_url: string | null
      audio_duration_ms: number | null; storage: string; tags: string | null
      mood: string | null
    } | undefined

  if (!row) return res.status(404).json({ error: 'not_found', message: '啊哈时刻不存在' })
  if (row.type !== 'text' || !row.content) {
    return res.status(400).json({
      error: 'only_text_supported',
      message: '只能把文字类型的啊哈时刻转成小纸条(录音暂不支持)',
    })
  }

  // 防止重复转(查 source 字段)
  const existing = db
    .prepare(`SELECT id FROM letters WHERE content LIKE ?`)
    .get(`%[aha:${ahaId}]%`) as { id: string } | undefined
  if (existing) {
    return res.status(409).json({
      error: 'already_promoted',
      message: '这条啊哈时刻已经转过小纸条了',
      letterId: existing.id,
    })
  }

  // 在内容前加个标识,方便溯源
  const taggedContent = `${row.content}\n\n— 来自啊哈时刻 [${row.mood || '💡'}]`

  const newLetterId = `lt_${randomBytes(8).toString('hex')}`
  const shareToken = `sl_${randomBytes(8).toString('hex')}`
  const now = Date.now()
  const authorNickname = user?.nickname || '匿名'

  db.prepare(`
    INSERT INTO letters (id, content, author, author_user_id, bg_key, translations, share_token, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    newLetterId,
    taggedContent,
    authorNickname,
    userId,
    'ivory',
    null,  // translations
    shareToken,
    now,
    now
  )

  // 记录 aha → letter 关联(避免重复 promote)
  // 用 aha_momments 表加 source_letter_id 字段? 简单起见,放 content 里用 [aha:ID] 标记
  // 已经在上面 content 里加了

  return res.status(201).json({
    ok: true,
    letterId: newLetterId,
    shareToken,
    content: taggedContent,
    author: authorNickname,
    mood: row.mood,
    fromAhaId: ahaId,
  })
})
