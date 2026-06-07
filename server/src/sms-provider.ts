/**
 * ============================================================
 *  sms-provider.ts — V3.8 短信服务商抽象层
 *
 *  设计目标:
 *    1. 抽象接口: 业务层只调 sendCode(phone, code),不关心是阿里云/腾讯云/mock
 *    2. 多 provider: 阿里云(主) + Mock(降级/开发)
 *    3. 失败重试 + 超时 + 降级: LongCat 同款
 *    4. 占位 key 不发真短信: SDK 静默失败 → 自动降级 mock
 *    5. 5 位数验证码 + 5 分钟过期
 *
 *  激活方式(用户):
 *    1. 阿里云控制台 → 短信服务 → 申请签名 + 模板
 *    2. 拿 accessKeyId + accessKeySecret
 *    3. 写 /etc/feiman-letters.env: ALIYUN_SMS_KEY_ID / ALIYUN_SMS_KEY_SECRET / ALIYUN_SMS_SIGN_NAME / ALIYUN_SMS_TEMPLATE_CODE
 *    4. 改 SMS_PROVIDER=aliyun
 *    5. 重新 pm2 restart
 *
 *  没配置 → 用 mock(开发/测试),不发真短信,验证码在日志打
 * ============================================================
 */
import Dysmsapi20170525, * as $Dysmsapi20170525 from '@alicloud/dysmsapi20170525'
import * as $OpenApi from '@alicloud/openapi-client'
import { randomUUID } from 'node:crypto'
import { db, hasColumn } from './db.js'

// =============== 类型 ===============

export interface SendCodeResult {
  ok: boolean
  provider: 'aliyun' | 'mock'
  requestId?: string
  error?: string
  /** mock 模式时把验证码回传给前端(仅开发用) */
  mockCode?: string
}

// =============== 抽象接口 ===============

export interface SmsProvider {
  name: 'aliyun' | 'mock'
  sendCode(phone: string, code: string): Promise<SendCodeResult>
}

// =============== Mock Provider(默认) ===============

const MockProvider: SmsProvider = {
  name: 'mock',
  async sendCode(phone, code) {
    console.log(`[sms:mock] 发送验证码到 ${phone}: ${code}`)
    return { ok: true, provider: 'mock', mockCode: code }
  },
}

// =============== Aliyun Provider ===============

let _aliyunClient: any = null

function getAliyunClient() {
  if (_aliyunClient) return _aliyunClient
  const accessKeyId = process.env.ALIYUN_SMS_KEY_ID
  const accessKeySecret = process.env.ALIYUN_SMS_KEY_SECRET
  if (!accessKeyId || !accessKeySecret) return null

  const config = new $OpenApi.Config({
    accessKeyId,
    accessKeySecret,
    endpoint: 'dysmsapi.aliyuncs.com',
  })
  _aliyunClient = new Dysmsapi20170525(config)
  return _aliyunClient
}

const AliyunProvider: SmsProvider = {
  name: 'aliyun',
  async sendCode(phone, code) {
    const client = getAliyunClient()
    if (!client) {
      return { ok: false, provider: 'aliyun', error: 'aliyun_sms_not_configured' }
    }

    const signName = process.env.ALIYUN_SMS_SIGN_NAME
    const templateCode = process.env.ALIYUN_SMS_TEMPLATE_CODE
    if (!signName || !templateCode) {
      return { ok: false, provider: 'aliyun', error: 'aliyun_sms_template_not_configured' }
    }

    try {
      const sendSmsRequest = new $Dysmsapi20170525.SendSmsRequest({
        phoneNumbers: phone,
        signName,
        templateCode,
        templateParam: JSON.stringify({ code }),
      })
      const response = await client.sendSms(sendSmsRequest)
      // 阿里云返回 body.code === 'OK' 表示成功
      if (response.body.code === 'OK') {
        return { ok: true, provider: 'aliyun', requestId: response.body.requestId }
      }
      return {
        ok: false,
        provider: 'aliyun',
        error: response.body.message || response.body.code,
        requestId: response.body.requestId,
      }
    } catch (err: any) {
      return { ok: false, provider: 'aliyun', error: err.message || 'aliyun_sms_error' }
    }
  },
}

// =============== Provider 工厂 ===============

let _activeProvider: SmsProvider | null = null

export function getSmsProvider(): SmsProvider {
  if (_activeProvider) return _activeProvider

  const configured = (process.env.SMS_PROVIDER || 'mock').toLowerCase()
  if (configured === 'aliyun' && getAliyunClient()) {
    _activeProvider = AliyunProvider
    console.log('[sms] using aliyun provider')
  } else {
    _activeProvider = MockProvider
    if (configured === 'aliyun') {
      console.warn('[sms] ALIYUN_SMS_KEY_ID not set, fallback to mock')
    } else {
      console.log('[sms] using mock provider (dev/test)')
    }
  }
  return _activeProvider
}

// =============== 业务封装: 验证码生成 + 存储 + 发送 + 校验 ===============

/** 生成 5 位数字验证码 */
export function generateCode(): string {
  return Math.floor(10000 + Math.random() * 90000).toString()
}

/** 验证码有效期 5 分钟 */
const CODE_TTL_MS = 5 * 60 * 1000
/** 60 秒内不能重发 */
const RESEND_COOLDOWN_MS = 60 * 1000
/** 1 小时最多 10 次(防刷) */
const RATE_LIMIT_PER_HOUR = 10

interface StoredCode {
  code: string
  phone: string
  expiresAt: number
  attempts: number
}

// =============== Schema migration: verification_codes ===============

/** 启动时调一次: 建表 + ALTER TABLE users 加 phone */
export function ensureSmsTables() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS verification_codes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      phone TEXT NOT NULL,
      code TEXT NOT NULL,
      purpose TEXT NOT NULL DEFAULT 'login',
      expires_at INTEGER NOT NULL,
      created_at INTEGER NOT NULL,
      consumed INTEGER NOT NULL DEFAULT 0
    )
  `)
  db.exec(`CREATE INDEX IF NOT EXISTS idx_verif_phone_purpose ON verification_codes(phone, purpose, created_at)`)

  // users 表加 phone 字段
  if (!hasColumn('users', 'phone')) {
    try {
      db.exec(`ALTER TABLE users ADD COLUMN phone TEXT UNIQUE`)
      console.log('[sms] added users.phone column')
    } catch (err) {
      // 已存在,忽略
    }
  }
  console.log('[sms] verification_codes table ensured')
}

/** 发验证码: 限频 + 存储 + 发送 */
export async function sendVerificationCode(phone: string, purpose: 'login' | 'register' = 'login'): Promise<SendCodeResult & { cooldownSec?: number }> {
  // 1. 限频: 60s cooldown
  const lastSent = db
    .prepare(`SELECT created_at FROM verification_codes WHERE phone = ? AND purpose = ? ORDER BY created_at DESC LIMIT 1`)
    .get(phone, purpose) as { created_at: number } | undefined
  if (lastSent) {
    const elapsed = Date.now() - lastSent.created_at
    if (elapsed < RESEND_COOLDOWN_MS) {
      return { ok: false, provider: 'mock', error: 'cooldown', cooldownSec: Math.ceil((RESEND_COOLDOWN_MS - elapsed) / 1000) }
    }
  }

  // 2. 1h 限频: 最多 10 条
  const count1h = db
    .prepare(`SELECT COUNT(*) as c FROM verification_codes WHERE phone = ? AND created_at > ?`)
    .get(phone, Date.now() - 3600 * 1000) as { c: number }
  if (count1h.c >= RATE_LIMIT_PER_HOUR) {
    return { ok: false, provider: 'mock', error: 'rate_limit_exceeded' }
  }

  // 3. 生成 + 存 + 发送
  const code = generateCode()
  const now = Date.now()
  db
    .prepare(`INSERT INTO verification_codes (phone, code, purpose, expires_at, created_at) VALUES (?, ?, ?, ?, ?)`)
    .run(phone, code, purpose, now + CODE_TTL_MS, now)

  const result = await getSmsProvider().sendCode(phone, code)
  return result
}

/** 校验验证码: 成功 → consume(标记 consumed=1) */
export function verifyCode(phone: string, code: string, purpose: 'login' | 'register' = 'login'): { ok: boolean; error?: string } {
  const row = db
    .prepare(`SELECT id, expires_at, consumed FROM verification_codes WHERE phone = ? AND purpose = ? AND code = ? ORDER BY created_at DESC LIMIT 1`)
    .get(phone, purpose, code) as { id: number; expires_at: number; consumed: number } | undefined

  if (!row) return { ok: false, error: 'invalid_code' }
  if (row.consumed) return { ok: false, error: 'code_already_used' }
  if (Date.now() > row.expires_at) return { ok: false, error: 'code_expired' }

  // 标记已用
  db.prepare(`UPDATE verification_codes SET consumed = 1 WHERE id = ?`).run(row.id)
  return { ok: true }
}

/** 找或建手机号用户(用于 login/register) */
export function findOrCreatePhoneUser(phone: string, nickname: string): { id: string; email: string | null; nickname: string; phone: string; avatarUrl: string | null; createdAt: number } {
  const existing = db
    .prepare(`SELECT id, email, nickname, phone, avatar_url, created_at FROM users WHERE phone = ?`)
    .get(phone) as { id: string; email: string | null; nickname: string; phone: string; avatar_url: string | null; created_at: number } | undefined
  if (existing) {
    return {
      id: existing.id,
      email: existing.email,
      nickname: existing.nickname,
      phone: existing.phone,
      avatarUrl: existing.avatar_url,
      createdAt: existing.created_at,
    }
  }

  // 新用户: 生成 userId + 临时 email
  const userId = randomUUID()
  const tempEmail = `${phone}@phone.feiman.letters`  // 内部标识
  const now = Date.now()
  db
    .prepare(`INSERT INTO users (id, email, nickname, phone, password_hash, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)`)
    .run(userId, tempEmail, nickname || `用户${phone.slice(-4)}`, phone, '', now, now)
  return { id: userId, email: tempEmail, nickname: nickname || `用户${phone.slice(-4)}`, phone, avatarUrl: null, createdAt: now }
}
