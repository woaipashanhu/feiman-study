// e2e/tests/01-register-and-write.test.mjs
// 路径: 访客 → 手机号注册 → 跳 /profile → 写一封信 → 保存 → /letters 看到

import { registerByPhone, clickByText, assert } from '../_helpers.mjs'

const TS = Date.now()
const phone = `139${String(TS).slice(-8)}`

export default async function test({ browser, page, BASE, log }) {
  log(`phone: ${phone}`)

  // 1. 打开首页 → 跳到 /auth
  await page.goto(`${BASE}/auth`, { waitUntil: 'domcontentloaded' })
  await new Promise(r => setTimeout(r, 800))

  // 2. 切到手机号 tab
  const tabOk = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'))
    const phone = btns.find(b => b.textContent?.trim() === '手机号')
    if (phone) { phone.click(); return true }
    return false
  })
  assert(tabOk, '找不到"手机号" tab')

  // 3. 输手机号
  await page.evaluate((p) => {
    const input = Array.from(document.querySelectorAll('input')).find(i => i.placeholder?.includes('手机号'))
    if (input) {
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set
      setter.call(input, p)
      input.dispatchEvent(new Event('input', { bubbles: true }))
    }
  }, phone)
  await new Promise(r => setTimeout(r, 200))

  // 4. 直接调后端注册(更稳:不走前端表单 race condition)
  await registerByPhone(null, page, phone)
  log('注册完成,token 已存 localStorage')

  // 5. 跳到 /letters/compose + 写一封
  await page.goto(`${BASE}/letters/compose`, { waitUntil: 'domcontentloaded' })
  await new Promise(r => setTimeout(r, 800))
  const content = `E2E 自动测 ${TS}`
  await page.evaluate((c) => {
    const ta = document.querySelector('textarea')
    if (ta) {
      const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set
      setter.call(ta, c)
      ta.dispatchEvent(new Event('input', { bubbles: true }))
    }
  }, content)
  await new Promise(r => setTimeout(r, 300))

  // 6. 点保存
  const saveOk = await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => {
      const t = b.textContent?.trim() || ''
      return (t === '保存' || t === '已保存') && b.offsetParent !== null
    })
    if (btn) { btn.click(); return true }
    return false
  })
  assert(saveOk, '找不到保存按钮')
  await new Promise(r => setTimeout(r, 2500))  // 等跳到详情页

  // 7. 验证 URL 是 /letters/letter/compose_...(不是 [object Object])
  const url = page.url()
  log('保存后 URL:', url)
  assert(/\/letters\/letter\/compose_\d+_\w+/.test(url), `URL 格式错(应包含 compose_xxx_xxx): ${url}`)

  // 8. 跳到 /letters,默认 tab 应该看到刚写的
  await page.goto(`${BASE}/letters`, { waitUntil: 'domcontentloaded' })
  await new Promise(r => setTimeout(r, 1500))
  const bodyText = await page.evaluate(() => document.body.innerText)
  assert(bodyText.includes(content), `列表没看到刚写的信"${content}"`)

  log('✅ 看到刚写的信')
}
