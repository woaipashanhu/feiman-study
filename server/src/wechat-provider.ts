/**
 * ============================================================
 *  wechat-provider.ts — V3.8 微信 OAuth 抽象层
 *
 *  流程:
 *    1. 前端调 /api/auth/wechat/start → 后端重定向到微信授权页
 *    2. 用户在微信里点"允许"
 *    3. 微信回调 /api/auth/wechat/callback?code=xxx&state=xxx
 *    4. 后端用 code 调 https://api.weixin.qq.com/sns/oauth2/access_token 拿 openid + access_token
 *    5. (可选) 调 /sns/userinfo 拿 unionid + nickname + headimgurl
 *    6. 找/建 users 表(用 wechat_openid 关联)→ 签 JWT
 *    7. 重定向回前端 /auth/wechat-callback?token=<JWT>
 *
 *  激活方式(用户):
 *    1. 微信开放平台 https://open.weixin.qq.com 注册 → 网站应用
 *    2. 填授权回调域: 47.99.101.168:8890
 *    3. 拿 appid + secret(审核 7-14 天)
 *    4. 写 /etc/feiman-letters.env:
 *         WECHAT_APPID=wx...
 *         WECHAT_SECRET=...
 *         WECHAT_REDIRECT_URI=http://47.99.101.168:8890/api/auth/wechat/callback
 *    5. 重新 pm2 restart
 *
 *  没配置 → /api/auth/wechat/start 返回 503"微信登录未配置"
 * ============================================================
 */
import axios from 'axios'
import { db, hasColumn } from './db.js'
import { randomUUID } from 'node:crypto'
import { signAccessToken, signRefreshToken } from './auth.js'

// =============== 启动时建表 ===============

export function ensureWechatTables() {
  if (!hasColumn('users', 'wechat_openid')) {
    try {
      db.exec(`ALTER TABLE users ADD COLUMN wechat_openid TEXT UNIQUE`)
      console.log('[wechat] added users.wechat_openid column')
    } catch {
      // 已存在,忽略
    }
  }
  if (!hasColumn('users', 'wechat_unionid')) {
    try {
      db.exec(`ALTER TABLE users ADD COLUMN wechat_unionid TEXT`)
    } catch {}
  }
  if (!hasColumn('users', 'wechat_nickname')) {
    try {
      db.exec(`ALTER TABLE users ADD COLUMN wechat_nickname TEXT`)
    } catch {}
  }
  if (!hasColumn('users', 'wechat_avatar')) {
    try {
      db.exec(`ALTER TABLE users ADD COLUMN wechat_avatar TEXT`)
    } catch {}
  }
  console.log('[wechat] wechat fields ensured')
}

// =============== 配置 ===============

export function getWechatConfig() {
  return {
    appid: process.env.WECHAT_APPID || '',
    secret: process.env.WECHAT_SECRET || '',
    redirectUri: process.env.WECHAT_REDIRECT_URI || '',
  }
}

export function isWechatConfigured(): boolean {
  const c = getWechatConfig()
  return !!(c.appid && c.secret && c.redirectUri)
}

/** 生成微信授权 URL(扫码登录 — snsapi_login 适合 PC / snsapi_userinfo 适合移动端) */
export function buildWechatAuthUrl(state: string, scope: 'snsapi_login' | 'snsapi_userinfo' = 'snsapi_userinfo'): string {
  const { appid, redirectUri } = getWechatConfig()
  const params = new URLSearchParams({
    appid,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope,
    state,
  })
  return `https://open.weixin.qq.com/connect/qrconnect?${params.toString()}#wechat_redirect`
}

/** 用 code 换 access_token + openid */
async function exchangeCodeForToken(code: string): Promise<{
  access_token: string
  expires_in: number
  refresh_token: string
  openid: string
  scope: string
  unionid?: string
  errcode?: number
  errmsg?: string
}> {
  const { appid, secret } = getWechatConfig()
  const url = `https://api.weixin.qq.com/sns/oauth2/access_token?appid=${appid}&secret=${secret}&code=${code}&grant_type=authorization_code`
  const res = await axios.get(url, { timeout: 10000 })
  return res.data
}

/** 用 access_token + openid 拉 user info(可选,unionid 需要 scope = snsapi_userinfo) */
async function fetchWechatUserInfo(accessToken: string, openid: string): Promise<{
  openid: string
  nickname: string
  sex: number
  province: string
  city: string
  country: string
  headimgurl: string
  unionid?: string
  errcode?: number
  errmsg?: string
}> {
  const url = `https://api.weixin.qq.com/sns/userinfo?access_token=${accessToken}&openid=${openid}&lang=zh_CN`
  const res = await axios.get(url, { timeout: 10000 })
  return res.data
}

/** 找或建微信用户(用 wechat_openid 关联) */
export function findOrCreateWechatUser(opts: {
  openid: string
  unionid?: string
  nickname?: string
  avatar?: string
}): { id: string; email: string | null; nickname: string; phone: string | null; avatarUrl: string | null; createdAt: number } {
  // 1. 查老用户
  const existing = db
    .prepare(`SELECT id, email, nickname, phone, avatar_url, created_at FROM users WHERE wechat_openid = ?`)
    .get(opts.openid) as { id: string; email: string | null; nickname: string; phone: string | null; avatar_url: string | null; created_at: number } | undefined

  if (existing) {
    // 2. 更新 userinfo(可能变化)
    db.prepare(`UPDATE users SET wechat_nickname = ?, wechat_avatar = ?, wechat_unionid = ?, updated_at = ? WHERE id = ?`)
      .run(opts.nickname || null, opts.avatar || null, opts.unionid || null, Date.now(), existing.id)
    return {
      id: existing.id,
      email: existing.email,
      nickname: existing.nickname,
      phone: existing.phone,
      avatarUrl: existing.avatar_url,
      createdAt: existing.created_at,
    }
  }

  // 3. 新用户:生成 userId + 临时 email + 默认昵称
  const userId = randomUUID()
  const tempEmail = `wx_${opts.openid.slice(-12)}@wechat.feiman.letters`
  const defaultNickname = opts.nickname || `微信用户${opts.openid.slice(-4)}`
  const now = Date.now()
  db
    .prepare(`
      INSERT INTO users (id, email, nickname, password_hash, wechat_openid, wechat_unionid, wechat_nickname, wechat_avatar, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    .run(
      userId,
      tempEmail,
      defaultNickname,
      '',
      opts.openid,
      opts.unionid || null,
      opts.nickname || null,
      opts.avatar || null,
      now,
      now
    )
  return {
    id: userId,
    email: tempEmail,
    nickname: defaultNickname,
    phone: null,
    avatarUrl: opts.avatar || null,
    createdAt: now,
  }
}

/** 完整流程: code → token → userinfo → 找/建用户 → JWT */
export async function wechatLogin(code: string): Promise<{
  ok: boolean
  user?: any
  accessToken?: string
  refreshToken?: string
  error?: string
}> {
  // 1. code → token
  const tokenRes = await exchangeCodeForToken(code)
  if (tokenRes.errcode) {
    return { ok: false, error: `wechat_token_error: ${tokenRes.errmsg || tokenRes.errcode}` }
  }
  const { access_token, openid, unionid } = tokenRes

  // 2. token → userinfo(可选)
  let userInfo: Awaited<ReturnType<typeof fetchWechatUserInfo>> | null = null
  try {
    userInfo = await fetchWechatUserInfo(access_token, openid)
    if (userInfo.errcode) userInfo = null
  } catch {
    userInfo = null
  }

  // 3. 找/建用户
  const user = findOrCreateWechatUser({
    openid,
    unionid: unionid || userInfo?.unionid,
    nickname: userInfo?.nickname,
    avatar: userInfo?.headimgurl,
  })

  // 4. 签 token
  return {
    ok: true,
    user: {
      id: user.id,
      email: user.email,
      nickname: user.nickname,
      avatarUrl: user.avatarUrl,
      phone: user.phone,
      createdAt: user.createdAt,
    },
    accessToken: signAccessToken(user.id),
    refreshToken: signRefreshToken(user.id),
  }
}
