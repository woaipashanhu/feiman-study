/**
 * ============================================================
 *  api-integration.test.ts — API 集成测试
 *
 *  用 supertest 跑真实 Express + 真实 SQLite(临时文件)
 *  测核心流程:register → login → me → create letter → list letters
 *
 *  策略:
 *    1. beforeAll: set DB_PATH 到临时文件,启动 express
 *    2. 每次测试前清表
 *    3. afterAll: 删临时文件
 * ============================================================
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { existsSync, unlinkSync, mkdirSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { tmpdir } from 'node:os'
import request from 'supertest'

// 必须在 import app/db 前 set env
const TEST_DB = resolve(tmpdir(), `letters-test-${Date.now()}.db`)
const TEST_AVATAR_DIR = resolve(tmpdir(), `letters-test-avatars-${Date.now()}`)
process.env.DB_PATH = TEST_DB
process.env.AVATAR_DIR = TEST_AVATAR_DIR
process.env.NODE_ENV = 'test'
process.env.JWT_SECRET = 'test-jwt-secret-128-bytes-test-jwt-secret-128-bytes-test-jwt-secret-128'
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-128-bytes-test-refresh-secret-128'
process.env.LONGCAT_API_KEY = ''  // 测试时用 mock

mkdirSync(dirname(TEST_DB), { recursive: true })
mkdirSync(TEST_AVATAR_DIR, { recursive: true })

// 动态 import — 让 env 在前
const { db } = await import('../src/db.js')
const { lettersRouter } = await import('../src/routes-letters.js')
const { authRouter } = await import('../src/routes-auth.js')
const express = (await import('express')).default
const cors = (await import('cors')).default

const app = express()
app.use(cors())
app.use(express.json())
app.use('/api/auth', authRouter)
app.use('/api/letters', lettersRouter)

// 文件级 cleanup — 所有 describe 跑完才关
afterAll(() => {
  try { db.close() } catch {}
  if (existsSync(TEST_DB)) unlinkSync(TEST_DB)
  if (existsSync(TEST_AVATAR_DIR)) {
    try { require('node:fs').rmSync(TEST_AVATAR_DIR, { recursive: true, force: true }) } catch {}
  }
})

describe('API 集成: 鉴权流', () => {
  beforeEach(() => {
    // 清表
    db.exec('DELETE FROM user_letter_actions')
    db.exec('DELETE FROM letters')
    db.exec('DELETE FROM token_blacklist')
    db.exec('DELETE FROM users')
  })

  it('register → login → me 完整流程', async () => {
    // 1. 注册
    const reg = await request(app)
      .post('/api/auth/register')
      .send({ email: 'test@example.com', password: 'pass1234', nickname: '小测' })
    expect(reg.status).toBe(201)  // V3 路由返回 201 Created
    expect(reg.body.accessToken).toBeTruthy()
    expect(reg.body.refreshToken).toBeTruthy()
    expect(reg.body.user.email).toBe('test@example.com')
    expect(reg.body.user.nickname).toBe('小测')

    // 2. 登录
    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'pass1234' })
    expect(login.status).toBe(200)
    expect(login.body.accessToken).toBeTruthy()

    // 3. me
    const me = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${login.body.accessToken}`)
    expect(me.status).toBe(200)
    expect(me.body.user.email).toBe('test@example.com')
  })

  it('重复 email 注册应失败', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({ email: 'dup@x.com', password: 'pass1234', nickname: 'a' })
    const dup = await request(app)
      .post('/api/auth/register')
      .send({ email: 'dup@x.com', password: 'pass1234', nickname: 'b' })
    expect(dup.status).toBe(409)  // 409 Conflict
  })

  it('me 不带 token 应 401', async () => {
    const me = await request(app).get('/api/auth/me')
    expect(me.status).toBe(401)
  })

  it('me 带错 token 应 401', async () => {
    const me = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer invalid.token.here')
    expect(me.status).toBe(401)
  })

  it('短密码注册应失败', async () => {
    const r = await request(app)
      .post('/api/auth/register')
      .send({ email: 'x@x.com', password: '123', nickname: 'a' })
    expect(r.status).toBe(400)
  })
})

describe('API 集成: 纸条 CRUD', () => {
  let token: string

  beforeAll(async () => {
    db.exec('DELETE FROM user_letter_actions')
    db.exec('DELETE FROM letters')
    db.exec('DELETE FROM users')
    const reg = await request(app)
      .post('/api/auth/register')
      .send({ email: 'writer@x.com', password: 'pass1234', nickname: 'writer' })
    token = reg.body.accessToken
  })

  beforeEach(() => {
    db.exec('DELETE FROM user_letter_actions')
    db.exec('DELETE FROM letters')
  })

  it('登录用户 create + list 自己的信', async () => {
    const create = await request(app)
      .post('/api/letters')
      .set('Authorization', `Bearer ${token}`)
      .send({ kind: 'compose', content: '第一封信', bgKey: 'ivory' })
    expect(create.status).toBe(201)  // POST /api/letters 返回 201 Created
    expect(create.body.letter.content).toBe('第一封信')
    expect(create.body.letter.shareToken).toBeTruthy()

    const list = await request(app)
      .get('/api/letters?limit=10')
      .set('Authorization', `Bearer ${token}`)
    expect(list.status).toBe(200)
    expect(list.body.letters).toHaveLength(1)
  })

  it('空内容 create 应失败', async () => {
    const r = await request(app)
      .post('/api/letters')
      .set('Authorization', `Bearer ${token}`)
      .send({ kind: 'compose', content: '', bgKey: 'ivory' })
    expect(r.status).toBe(400)
  })

  it('不登录也能 create 匿名信', async () => {
    const r = await request(app)
      .post('/api/letters')
      .send({ kind: 'quote', content: '匿名信内容', bgKey: 'midnight' })
    expect(r.status).toBe(201)  // POST 也返回 201
    expect(r.body.letter.authorUserId).toBeNull()
  })

  it('按 shareToken 读信(无 auth 也能)', async () => {
    const create = await request(app)
      .post('/api/letters')
      .send({ kind: 'quote', content: '分享测试', bgKey: 'kraft' })
    const shareToken = create.body.letter.shareToken

    const get = await request(app).get(`/api/letters/by-token/${shareToken}`)
    expect(get.status).toBe(200)
    // by-token 返回 { ok, letter: { content, ... } } 结构
    expect(get.body.letter.content).toBe('分享测试')
  })

  it('collect 增加计数', async () => {
    const create = await request(app)
      .post('/api/letters')
      .send({ kind: 'quote', content: '收藏测试', bgKey: 'ivory' })
    const id = create.body.letter.id

    const c1 = await request(app).post(`/api/letters/${id}/collect`)
    expect(c1.body.collectCount).toBe(1)

    const c2 = await request(app).post(`/api/letters/${id}/collect`)
    expect(c2.body.collectCount).toBe(2)
  })
})
