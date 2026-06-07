/**
 * ============================================================
 *  api-aha-integration.test.ts — V4 啊哈时刻集成测试
 *
 *  覆盖:
 *    - create text / audio moment
 *    - list 过滤(q/type/mood/tag)
 *    - patch(只允许改 content/tags/mood)
 *    - delete(级联 audio)
 *    - promote aha → letter(text only,重复防呆)
 *    - tags 列表
 *    - stats(总数/按情绪/30天)
 *    - 权限:不能改/删别人的 aha
 * ============================================================
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { existsSync, mkdirSync, rmSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { tmpdir } from 'node:os'

const TEST_DB = resolve(tmpdir(), `aha-test-${Date.now()}.db`)
const TEST_AVATAR = resolve(tmpdir(), `aha-test-avatars-${Date.now()}`)
mkdirSync(dirname(TEST_DB), { recursive: true })
mkdirSync(TEST_AVATAR, { recursive: true })

process.env.DB_PATH = TEST_DB
process.env.AVATAR_DIR = TEST_AVATAR
process.env.NODE_ENV = 'test'
process.env.JWT_SECRET = 'test-jwt-secret-128-bytes-test-jwt-secret-128-bytes-test-jwt-secret-128'
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-128-bytes-test-refresh-secret-128'

// 动态 import(在 env 设置后)
const { db } = await import('../src/db.js')
const { lettersRouter } = await import('../src/routes-letters.js')
const { authRouter } = await import('../src/routes-auth.js')
const { ahaRouter } = await import('../src/routes-aha.js')
const { ensureSmsTables } = await import('../src/sms-provider.js')
const { ensureWechatTables } = await import('../src/wechat-provider.js')
const express = (await import('express')).default
const request = (await import('supertest')).default
const { signAccessToken } = await import('../src/auth.js')

// 跑表迁移(因为 db.ts 不会自动建 verification_codes/wechat 字段)
ensureSmsTables()
ensureWechatTables()

const app = express()
app.use(express.json())
app.use('/api/auth', authRouter)
app.use('/api/letters', lettersRouter)
app.use('/api/aha', ahaRouter)

function tokenFor(userId: string) {
  return signAccessToken(userId)
}

async function createUserViaAuth(phone: string, nickname: string) {
  // 用 sms-provider mock 发码 + phone-login(已有 e2e 验证过,直接用底层)
  // 简化:直接 INSERT users
  const { randomUUID } = await import('node:crypto')
  const id = randomUUID()
  const now = Date.now()
  const email = `${phone}@phone.feiman.letters`
  db.prepare(`
    INSERT INTO users (id, email, phone, nickname, password_hash, created_at, updated_at)
    VALUES (?, ?, ?, ?, '', ?, ?)
  `).run(id, email, phone, nickname, now, now)
  return { id, email, nickname, phone }
}

describe('V4 API 集成: aha 时刻', () => {
  let userA: { id: string; nickname: string; phone: string; email: string }
  let userB: { id: string; nickname: string; phone: string; email: string }
  let tokenA: string
  let tokenB: string
  let momentId: string

  beforeEach(async () => {
    // 先清所有表(用 CASCADE 顺序)
    db.exec('DELETE FROM user_letter_actions')
    db.exec('DELETE FROM letters')
    db.exec('DELETE FROM aha_moments')
    db.exec('DELETE FROM token_blacklist')
    db.exec('DELETE FROM verification_codes')
    db.exec('DELETE FROM users')

    // 重新创建 2 个用户
    userA = await createUserViaAuth('13900000001', '用户A')
    userB = await createUserViaAuth('13900000002', '用户B')
    tokenA = tokenFor(userA.id)
    tokenB = tokenFor(userB.id)
  })

  it('create text aha + list', async () => {
    const r = await request(app)
      .post('/api/aha/moments')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ type: 'text', content: '今天的灵感', storage: 'cloud', tags: 'v4,test', mood: '💡' })
    console.log('create response:', JSON.stringify(r.body))
    expect(r.status).toBe(201)
    expect(r.body.moment.content).toBe('今天的灵感')
    expect(r.body.moment.tags).toBe('v4,test')
    expect(r.body.moment.mood).toBe('💡')
    momentId = r.body.moment.id

    const list = await request(app)
      .get('/api/aha/moments')
      .set('Authorization', `Bearer ${tokenA}`)
    expect(list.status).toBe(200)
    expect(list.body.moments).toHaveLength(1)
    expect(list.body.total).toBe(1)
  })

  it('create text 不带 content 应 400', async () => {
    const r = await request(app)
      .post('/api/aha/moments')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ type: 'text', storage: 'cloud' })
    expect(r.status).toBe(400)
  })

  it('create audio 不带 audioUrl 应 400', async () => {
    const r = await request(app)
      .post('/api/aha/moments')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ type: 'audio', storage: 'cloud' })
    expect(r.status).toBe(400)
  })

  it('搜索 q=V4', async () => {
    await request(app)
      .post('/api/aha/moments')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ type: 'text', content: 'V4 上线啦', storage: 'cloud' })
    await request(app)
      .post('/api/aha/moments')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ type: 'text', content: '其他内容', storage: 'cloud' })

    const r = await request(app)
      .get('/api/aha/moments?q=V4')
      .set('Authorization', `Bearer ${tokenA}`)
    expect(r.status).toBe(200)
    expect(r.body.moments).toHaveLength(1)
    expect(r.body.moments[0].content).toBe('V4 上线啦')
  })

  it('filter type=audio 应空', async () => {
    await request(app)
      .post('/api/aha/moments')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ type: 'text', content: 'text only', storage: 'cloud' })

    const r = await request(app)
      .get('/api/aha/moments?type=audio')
      .set('Authorization', `Bearer ${tokenA}`)
    expect(r.body.moments).toHaveLength(0)
    expect(r.body.total).toBe(0)
  })

  it('filter mood=💡', async () => {
    await request(app)
      .post('/api/aha/moments')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ type: 'text', content: '💡 灵感', storage: 'cloud', mood: '💡' })
    await request(app)
      .post('/api/aha/moments')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ type: 'text', content: '❤️ 爱', storage: 'cloud', mood: '❤️' })

    const r = await request(app)
      .get('/api/aha/moments?mood=%F0%9F%92%A1')  // 💡 URL encoded
      .set('Authorization', `Bearer ${tokenA}`)
    expect(r.body.moments).toHaveLength(1)
    expect(r.body.moments[0].mood).toBe('💡')
  })

  it('filter tag=v4', async () => {
    await request(app)
      .post('/api/aha/moments')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ type: 'text', content: 'A', storage: 'cloud', tags: 'v4,urgent' })
    await request(app)
      .post('/api/aha/moments')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ type: 'text', content: 'B', storage: 'cloud', tags: 'other' })

    const r = await request(app)
      .get('/api/aha/moments?tag=v4')
      .set('Authorization', `Bearer ${tokenA}`)
    expect(r.body.moments).toHaveLength(1)
    expect(r.body.moments[0].content).toBe('A')
  })

  it('patch content/tags/mood', async () => {
    const created = await request(app)
      .post('/api/aha/moments')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ type: 'text', content: 'old', storage: 'cloud' })
    const id = created.body.moment.id

    const r = await request(app)
      .patch(`/api/aha/moments/${id}`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ content: 'new', tags: 'updated', mood: '✨' })
    expect(r.status).toBe(200)

    const get = await request(app)
      .get(`/api/aha/moments/${id}`)
      .set('Authorization', `Bearer ${tokenA}`)
    expect(get.body.moment.content).toBe('new')
    expect(get.body.moment.tags).toBe('updated')
    expect(get.body.moment.mood).toBe('✨')
  })

  it('patch 不存在 → 404', async () => {
    const r = await request(app)
      .patch('/api/aha/moments/nonexistent-id-1234')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ content: 'x' })
    expect(r.status).toBe(404)
  })

  it('别人不能改我的 aha → 404', async () => {
    const created = await request(app)
      .post('/api/aha/moments')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ type: 'text', content: 'A的aha', storage: 'cloud' })
    const id = created.body.moment.id

    const r = await request(app)
      .patch(`/api/aha/moments/${id}`)
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ content: 'B 改' })
    expect(r.status).toBe(404)  // 查询就找不到(A 的 aha 不属于 B)
  })

  it('别人不能删我的 aha → 403', async () => {
    const created = await request(app)
      .post('/api/aha/moments')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ type: 'text', content: 'A 的', storage: 'cloud' })
    const id = created.body.moment.id

    const r = await request(app)
      .delete(`/api/aha/moments/${id}`)
      .set('Authorization', `Bearer ${tokenB}`)
    expect(r.status).toBe(403)
  })

  it('delete 自己 aha → 200', async () => {
    const created = await request(app)
      .post('/api/aha/moments')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ type: 'text', content: '删', storage: 'cloud' })
    const id = created.body.moment.id

    const r = await request(app)
      .delete(`/api/aha/moments/${id}`)
      .set('Authorization', `Bearer ${tokenA}`)
    expect(r.status).toBe(200)
  })

  it('/api/aha/tags 返回该用户所有 tag', async () => {
    await request(app)
      .post('/api/aha/moments')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ type: 'text', content: 'A', storage: 'cloud', tags: 'react,bug' })
    await request(app)
      .post('/api/aha/moments')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ type: 'text', content: 'B', storage: 'cloud', tags: 'react,idea' })

    const r = await request(app)
      .get('/api/aha/tags')
      .set('Authorization', `Bearer ${tokenA}`)
    expect(r.body.tags).toEqual(['bug', 'idea', 'react'])  // sorted, unique
  })

  it('/api/aha/stats 统计正确', async () => {
    await request(app)
      .post('/api/aha/moments')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ type: 'text', content: '1', storage: 'cloud', mood: '💡' })
    await request(app)
      .post('/api/aha/moments')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ type: 'text', content: '2', storage: 'local', mood: '💡' })
    await request(app)
      .post('/api/aha/moments')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ type: 'text', content: '3', storage: 'cloud', mood: '❤️' })

    const r = await request(app)
      .get('/api/aha/stats')
      .set('Authorization', `Bearer ${tokenA}`)
    expect(r.body.total).toBe(3)
    expect(r.body.byMood['💡']).toBe(2)
    expect(r.body.byMood['❤️']).toBe(1)
    expect(r.body.byType.text).toBe(3)
    expect(r.body.byType.audio).toBe(0)
    expect(r.body.byStorage.cloud).toBe(2)
    expect(r.body.byStorage.local).toBe(1)
    expect(r.body.byDay).toHaveLength(30)  // 30 天
  })

  it('promote text aha → letter', async () => {
    const created = await request(app)
      .post('/api/aha/moments')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ type: 'text', content: '想转成信', storage: 'cloud', mood: '⚡' })
    const id = created.body.moment.id

    const r = await request(app)
      .post(`/api/aha/moments/${id}/promote`)
      .set('Authorization', `Bearer ${tokenA}`)
    expect(r.status).toBe(201)
    expect(r.body.letterId).toMatch(/^lt_/)
    expect(r.body.content).toContain('想转成信')
    expect(r.body.content).toContain('[aha:')  // 溯源标记
    expect(r.body.author).toBe('用户A')
  })

  it('重复 promote 应 409', async () => {
    const created = await request(app)
      .post('/api/aha/moments')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ type: 'text', content: 'unique-promote-test-12345', storage: 'cloud' })
    const id = created.body.moment.id

    await request(app)
      .post(`/api/aha/moments/${id}/promote`)
      .set('Authorization', `Bearer ${tokenA}`)

    const r2 = await request(app)
      .post(`/api/aha/moments/${id}/promote`)
      .set('Authorization', `Bearer ${tokenA}`)
    expect(r2.status).toBe(409)
  })

  it('promote audio aha 应 400', async () => {
    const created = await request(app)
      .post('/api/aha/moments')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ type: 'audio', audioUrl: 'https://x/y.mp3', audioDurationMs: 5000, storage: 'cloud' })
    const id = created.body.moment.id

    const r = await request(app)
      .post(`/api/aha/moments/${id}/promote`)
      .set('Authorization', `Bearer ${tokenA}`)
    expect(r.status).toBe(400)
  })
})
