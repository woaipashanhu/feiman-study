/**
 * WebSocket 推送 E2E:
 *   1. 浏览器: 用户 A 登录,打开 /profile (等待 WS 连接 + toast 容器)
 *   2. API: 注册用户 B
 *   3. API: B 创建一封信(关联到 B 的 userId)
 *   4. API: A star B 的信
 *   5. 浏览器: B 应该收到 toast(虽然 B 不在线,但我们其实是 A 收推送)
 *      等等,逻辑是 "谁写的信被 star → 推给作者"
 *      那这个 E2E 应该是: A 写信 → B star A 的信 → A 收到 toast
 *   修正:
 *   1. 浏览器: 用户 A 登录,等 WS online
 *   2. API: A 创建一封信
 *   3. API: 注册 B,B star A 的信
 *   4. 浏览器: A 应该看到 "B star 了你的信" toast
 */
import puppeteer from 'puppeteer'
import { mkdirSync } from 'node:fs'
import { join } from 'node:path'

const BASE = 'http://47.99.101.168:8890'
const OUT = '/tmp/feiman-letters-ws'
mkdirSync(OUT, { recursive: true })

const VIEWPORT = { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true }

const ts = Date.now()
const aEmail = `ws_a_${ts}@feiman.com`
const bEmail = `ws_b_${ts}@feiman.com`
const password = 'ws123456'

async function regLogin(email, nickname) {
  const reg = await fetch(`${BASE}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, nickname }),
  })
  const data = await reg.json()
  return data
}

async function main() {
  // 1. 注册 A 和 B
  const aReg = await regLogin(aEmail, '作者A')
  const bReg = await regLogin(bEmail, '读者B')
  console.log(`✓ A 注册: ${aReg.user.id}`)
  console.log(`✓ B 注册: ${bReg.user.id}`)
  const aToken = aReg.accessToken
  const bToken = bReg.accessToken

  // 2. 浏览器: A 登录,等 WS online
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] })
  const errors = []
  const page = await browser.newPage()
  await page.setViewport(VIEWPORT)
  page.on('pageerror', (e) => errors.push(`[pageerror] ${e.message}`))
  page.on('console', (m) => { if (m.type() === 'error') errors.push(`[console.error] ${m.text()}`) })

  await page.goto(`${BASE}/auth`, { waitUntil: 'domcontentloaded' })
  await page.evaluate((t) => {
    localStorage.setItem('feiman_auth_access', t.access)
    localStorage.setItem('feiman_auth_refresh', t.refresh)
  }, { access: aToken, refresh: aReg.refreshToken })

  await page.goto(`${BASE}/profile`, { waitUntil: 'domcontentloaded' })
  await new Promise((r) => setTimeout(r, 3000))
  // 检查在线状态
  const onlineText = await page.evaluate(() => {
    const el = Array.from(document.querySelectorAll('div')).find((d) => d.textContent === '在线' || d.textContent === '离线')
    return el ? el.textContent : 'not found'
  })
  console.log(`  浏览器 WS 状态: ${onlineText}`)
  await page.screenshot({ path: join(OUT, '01-A-online.png') })

  // 3. API: A 创建一封信
  const createA = await fetch(`${BASE}/api/letters`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${aToken}` },
    body: JSON.stringify({ content: 'WS 推送测试:作者A 的信,等待 B star。', bgKey: 'ivory' }),
  })
  const letterData = await createA.json()
  const letterId = letterData.letter.id
  console.log(`✓ A 创建信: ${letterId} (authorUserId=${letterData.letter.authorUserId})`)

  // 4. API: B star A 的信
  const starRes = await fetch(`${BASE}/api/letters/${letterId}/star`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${bToken}` },
  })
  console.log(`✓ B star 信: status=${starRes.status}`)

  // 5. 等 WS 推送
  await new Promise((r) => setTimeout(r, 2000))
  await page.screenshot({ path: join(OUT, '02-toast.png') })
  console.log(`  ✓ 02-toast.png 截图保存`)

  // 验证页面有 "star 了你的信" 或 "B" 字样
  const pageText = await page.evaluate(() => document.body.innerText)
  const hasToast = pageText.includes('star 了你的信') || pageText.includes('读者B')
  if (hasToast) {
    console.log('  ✓ 页面有 toast 文字 (推送成功!)')
  } else {
    console.log('  ⚠ 页面没看到 toast 文字')
    console.log('  页面前 500 字:', pageText.slice(0, 500))
  }

  // 6. 测 collect 推送
  const collectRes = await fetch(`${BASE}/api/letters/${letterId}/collect`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${bToken}` },
  })
  console.log(`✓ B collect 信: status=${collectRes.status}`)
  await new Promise((r) => setTimeout(r, 2000))
  await page.screenshot({ path: join(OUT, '03-collect-toast.png') })

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
