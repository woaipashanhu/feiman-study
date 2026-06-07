/**
 * ============================================================
 *  storage-provider.ts — V3.8 对象存储抽象层
 *
 *  设计目标:
 *    1. 抽象接口: 业务层只调 uploadFile(path, buffer) → URL
 *    2. 多 provider: 本地磁盘(默认) + 阿里云 OSS(可选)
 *    3. 占位配置自动降级到本地,不影响开发
 *    4. 走 OSS 时,文件存 OSS bucket,URL 走 CDN 加速
 *
 *  激活方式(用户):
 *    1. 阿里云 OSS 控制台 → 建 bucket + 配 CDN 加速域名
 *    2. 拿 accessKeyId / accessKeySecret / bucket / CDN domain
 *    3. 写 /etc/feiman-letters.env:
 *         STORAGE_PROVIDER=oss
 *         ALIYUN_OSS_KEY_ID=...
 *         ALIYUN_OSS_KEY_SECRET=...
 *         ALIYUN_OSS_BUCKET=feiman-letters
 *         ALIYUN_OSS_REGION=oss-cn-hangzhou
 *         ALIYUN_OSS_CDN_DOMAIN=https://cdn.feiman.letters
 *    4. 重新 pm2 restart
 *
 *  没配置 → 用 Local(开发/测试),文件存 AVATAR_DIR(/var/lib/feiman-letters/avatars)
 * ============================================================
 */
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { resolve, extname } from 'node:path'
import { randomBytes } from 'node:crypto'
import OSSClient from 'ali-oss'

// ali-oss types 定义不完整,这里用 any 兜底
type AliyunOSS = any

// =============== 类型 ===============

export interface UploadResult {
  ok: boolean
  url: string          // 完整访问 URL(本地: /avatars/xxx, OSS: https://cdn.xxx/xxx)
  key: string          // 内部 key(本地: 文件名, OSS: object key)
  provider: 'local' | 'oss'
  size: number         // 文件字节数
  error?: string
}

export interface StorageProvider {
  name: 'local' | 'oss'
  uploadFile(filename: string, buffer: Buffer, mimeType: string): Promise<UploadResult>
  deleteFile(key: string): Promise<boolean>
}

// =============== Local Provider(默认) ===============

const AVATAR_DIR = process.env.AVATAR_DIR || '/var/lib/feiman-letters/avatars'
mkdirSync(AVATAR_DIR, { recursive: true })
const PUBLIC_AVATAR_PREFIX = '/avatars'  // express 静态服务路径

const LocalProvider: StorageProvider = {
  name: 'local',
  async uploadFile(filename, buffer, _mimeType) {
    try {
      // 生成唯一文件名: <random>.<ext>
      const ext = extname(filename) || '.bin'
      const key = `${Date.now()}-${randomBytes(6).toString('hex')}${ext}`
      const filepath = resolve(AVATAR_DIR, key)
      writeFileSync(filepath, buffer)
      return {
        ok: true,
        url: `${PUBLIC_AVATAR_PREFIX}/${key}`,
        key,
        provider: 'local',
        size: buffer.length,
      }
    } catch (err: any) {
      return { ok: false, url: '', key: '', provider: 'local', size: 0, error: err.message }
    }
  },
  async deleteFile(key) {
    try {
      const { unlinkSync } = await import('node:fs')
      unlinkSync(resolve(AVATAR_DIR, key))
      return true
    } catch {
      return false
    }
  },
}

// =============== Aliyun OSS Provider ===============

let _ossClient: AliyunOSS | null = null

function getOssClient(): AliyunOSS | null {
  if (_ossClient) return _ossClient
  const keyId = process.env.ALIYUN_OSS_KEY_ID
  const keySecret = process.env.ALIYUN_OSS_KEY_SECRET
  const bucket = process.env.ALIYUN_OSS_BUCKET
  const region = process.env.ALIYUN_OSS_REGION
  if (!keyId || !keySecret || !bucket || !region) return null

  _ossClient = new OSSClient({
    accessKeyId: keyId,
    accessKeySecret: keySecret,
    bucket,
    region,
    // 私有读但 CDN 公开: secure: true 用 HTTPS endpoint
    secure: true,
  })
  return _ossClient
}

const OssProvider: StorageProvider = {
  name: 'oss',
  async uploadFile(filename, buffer, _mimeType) {
    const client = getOssClient()
    if (!client) {
      return { ok: false, url: '', key: '', provider: 'oss', size: 0, error: 'oss_not_configured' }
    }
    const ext = extname(filename) || '.bin'
    const date = new Date()
    const datePath = `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}`
    const key = `letters/${datePath}/${Date.now()}-${randomBytes(6).toString('hex')}${ext}`

    try {
      const result = await client.put(key, buffer)
      // 拼接 URL: 优先用 CDN domain,否则用 OSS endpoint
      const cdn = process.env.ALIYUN_OSS_CDN_DOMAIN
      const url = cdn
        ? `${cdn.replace(/\/$/, '')}/${key}`
        : result.url
      return { ok: true, url, key, provider: 'oss', size: buffer.length }
    } catch (err: any) {
      return { ok: false, url: '', key, provider: 'oss', size: 0, error: err.message || 'oss_upload_failed' }
    }
  },
  async deleteFile(key) {
    const client = getOssClient()
    if (!client) return false
    try {
      await client.delete(key)
      return true
    } catch {
      return false
    }
  },
}

// =============== Provider 工厂 ===============

let _activeProvider: StorageProvider | null = null

export function getStorageProvider(): StorageProvider {
  if (_activeProvider) return _activeProvider

  const configured = (process.env.STORAGE_PROVIDER || 'local').toLowerCase()
  if (configured === 'oss' && getOssClient()) {
    _activeProvider = OssProvider
    console.log('[storage] using oss provider')
  } else {
    _activeProvider = LocalProvider
    if (configured === 'oss') {
      console.warn('[storage] ALIYUN_OSS_KEY_ID not set, fallback to local')
    } else {
      console.log('[storage] using local provider (dev/test) at ' + AVATAR_DIR)
    }
  }
  return _activeProvider
}
