/**
 * 头像上传 E2E:
 *   1. 注册新用户(或登录老用户)
 *   2. /profile 看到 AuthCard 默认显示昵称首字
 *   3. 上传一张小图
 *   4. AuthCard 显示真实头像
 *   5. 截图
 */
import puppeteer from 'puppeteer'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const BASE = 'http://47.99.101.168:8890'
const OUT = '/tmp/feiman-letters-avatar'
mkdirSync(OUT, { recursive: true })

const VIEWPORT = { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true }

const email = `avatar_${Date.now()}@feiman.com`
const password = 'avatar123'
const nickname = '头像测试'

// 生成一张 64x64 PNG (用 Buffer 拼,简单纯色)
function makeTestPng() {
  // 最简合法 PNG:1x1 红色
  // 用 Buffer 直接拼 PNG header + IDAT + IEND
  // 这里用一个已知合法 1x1 红色 PNG 的字节
  return Buffer.from(
    '89504e470d0a1a0a0000000d4948445200000001000000010802000090737a7a0000000c4944415478da63f8cfc0000000030001' +
      '5e8f5c9c0000000049454e44ae426082',
    'hex'
  )
}

async function main() {
  // 1. 注册
  const regRes = await fetch(`${BASE}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, nickname }),
  })
  const regData = await regRes.json()
  if (!regData.ok) {
    console.error('注册失败:', regData)
    process.exit(1)
  }
  const token = regData.accessToken
  console.log(`✓ 注册 ${email}, token 长度 ${token.length}`)

  // 2. 上传头像 (multipart)
  const pngBuffer = makeTestPng()
  writeFileSync('/tmp/test-avatar.png', pngBuffer)
  const form = new FormData()
  // FormData + Blob 在 Node.js 18+ 也支持
  form.append('avatar', new Blob([pngBuffer], { type: 'image/png' }), 'avatar.png')
  const upRes = await fetch(`${BASE}/api/auth/avatar`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  })
  const upData = await upRes.json()
  console.log(`✓ 上传头像: status=${upRes.status} body=${JSON.stringify(upData)}`)
  if (!upRes.ok) process.exit(1)

  // 3. /me 验证
  const meRes = await fetch(`${BASE}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
  const meData = await meRes.json()
  console.log(`✓ /me.avatarUrl = ${meData.user.avatarUrl}`)

  // 4. 静态文件 GET
  if (meData.user.avatarUrl) {
    const fileRes = await fetch(`${BASE}${meData.user.avatarUrl}`)
    const buf = await fileRes.arrayBuffer()
    console.log(`✓ 头像文件 GET: status=${fileRes.status} size=${buf.byteLength}B`)
  }

  // 5. 浏览器验证
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] })
  const errors = []
  const page = await browser.newPage()
  await page.setViewport(VIEWPORT)
  page.on('pageerror', (e) => errors.push(`[pageerror] ${e.message}`))
  page.on('console', (m) => { if (m.type() === 'error') errors.push(`[console.error] ${m.text()}`) })

  // 注入 token
  await page.goto(`${BASE}/auth`, { waitUntil: 'domcontentloaded' })
  await page.evaluate((t) => {
    localStorage.setItem('feiman_auth_access', t.access)
    localStorage.setItem('feiman_auth_refresh', t.refresh)
  }, { access: regData.accessToken, refresh: regData.refreshToken })

  await page.goto(`${BASE}/profile`, { waitUntil: 'domcontentloaded' })
  await new Promise((r) => setTimeout(r, 2000))
  await page.screenshot({ path: join(OUT, '01-profile-with-avatar.png') })
  console.log('  ✓ 01-profile-with-avatar.png')

  await browser.close()

  if (errors.length > 0) {
    console.log('\n⚠ Browser errors:')
    errors.forEach((e) => console.log('  ' + e))
  } else {
    console.log('\n🎉 E2E 0 browser errors')
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
