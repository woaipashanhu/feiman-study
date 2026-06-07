/**
 * 小纸条 Auth E2E (V3) — 改用键盘输入
 */
import puppeteer from 'puppeteer'
import { mkdirSync } from 'node:fs'
import { join } from 'node:path'

const BASE = 'http://47.99.101.168:8890'
const OUT = '/tmp/feiman-letters-auth'
mkdirSync(OUT, { recursive: true })

const VIEWPORT = { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true }

const email = `test_${Date.now()}@feiman.com`
const password = 'hello1234'
const nickname = '自动化用户'

async function main() {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  })
  const errors = []
  const page = await browser.newPage()
  await page.setViewport(VIEWPORT)
  page.on('pageerror', (e) => errors.push(`[pageerror] ${e.message}`))
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(`[console.error] ${m.text()}`)
  })

  // 1. 注册页
  await page.goto(`${BASE}/auth`, { waitUntil: 'domcontentloaded' })
  await new Promise((r) => setTimeout(r, 1500))

  // 切到"注册"模式
  await page.evaluate(() => {
    // 找"注册" segment(在 segmented control 里,位置是第 2 个)
    const segBtns = Array.from(document.querySelectorAll('div.flex.p-1 button'))
    const regSeg = segBtns.find((b) => b.textContent && b.textContent.trim() === '注册')
    if (regSeg) regSeg.click()
  })
  await new Promise((r) => setTimeout(r, 500))
  await page.screenshot({ path: join(OUT, '01-register-mode.png') })
  console.log('  ✓ 01-register-mode.png')

  // 用键盘输入(模拟用户)
  // 找 3 个 input(按 placeholder 顺序: 昵称 → 邮箱 → 密码)
  const inputs = await page.$$('input')
  if (inputs.length !== 3) {
    console.log(`  ⚠ expected 3 inputs, got ${inputs.length}`)
  }
  await inputs[0].click()
  await page.keyboard.type(nickname, { delay: 30 })
  await new Promise((r) => setTimeout(r, 200))
  await inputs[1].click()
  await page.keyboard.type(email, { delay: 20 })
  await new Promise((r) => setTimeout(r, 200))
  await inputs[2].click()
  await page.keyboard.type(password, { delay: 20 })
  await new Promise((r) => setTimeout(r, 300))
  await page.screenshot({ path: join(OUT, '02-form-filled.png') })
  console.log('  ✓ 02-form-filled.png')

  // 点"注册并登录"提交按钮(form 里的 type=submit)
  await page.evaluate(() => {
    const btn = document.querySelector('form button[type="submit"]')
    if (btn) btn.click()
  })
  await new Promise((r) => setTimeout(r, 2500))
  await page.screenshot({ path: join(OUT, '03-after-register.png') })
  console.log('  ✓ 03-after-register.png')

  // 验证 token 已存
  const meCheck = await page.evaluate(async () => {
    const token = localStorage.getItem('feiman_auth_access')
    if (!token) return { ok: false, error: 'no token' }
    const res = await fetch('/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    })
    return { status: res.status, data: await res.json() }
  })
  console.log('  /api/auth/me:', JSON.stringify(meCheck).slice(0, 200))

  // 4. /profile 看账号卡
  await page.goto(`${BASE}/profile`, { waitUntil: 'domcontentloaded' })
  await new Promise((r) => setTimeout(r, 1500))
  await page.screenshot({ path: join(OUT, '04-profile-loggedin.png') })
  console.log('  ✓ 04-profile-loggedin.png')

  // 5. 写一封信,验证 authorUserId 关联
  const createRes = await page.evaluate(async () => {
    const token = localStorage.getItem('feiman_auth_access')
    if (!token) return { ok: false, error: 'no token' }
    const res = await fetch('/api/letters', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        content: 'V3 登录后写信:作者应该是我的昵称',
        bgKey: 'ivory',
      }),
    })
    return { status: res.status, data: await res.json() }
  })
  console.log('  POST /api/letters (token):', JSON.stringify(createRes).slice(0, 300))

  // 6. /letters/compose
  await page.goto(`${BASE}/letters/compose`, { waitUntil: 'domcontentloaded' })
  await new Promise((r) => setTimeout(r, 1500))
  await page.click('textarea')
  await page.keyboard.type('V3 自动化测试:登录后写信,自动带 token')
  await new Promise((r) => setTimeout(r, 500))
  await page.screenshot({ path: join(OUT, '05-compose-with-token.png') })
  console.log('  ✓ 05-compose-with-token.png')

  // 7. inbox
  const inboxRes = await page.evaluate(async () => {
    const token = localStorage.getItem('feiman_auth_access')
    const res = await fetch('/api/me/inbox', {
      headers: { Authorization: `Bearer ${token}` },
    })
    return { status: res.status, data: await res.json() }
  })
  console.log('  /api/me/inbox:', JSON.stringify(inboxRes).slice(0, 200))

  await browser.close()

  if (errors.length > 0) {
    console.log('\n⚠ Browser errors:')
    errors.forEach((e) => console.log('  ' + e))
  } else {
    console.log('\n🎉 E2E 0 browser errors')
  }
  console.log(`\n测试账号: ${email} / ${password}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
