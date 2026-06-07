// e2e/tests/02-aha-text.test.mjs
// 路径: 注册 → /aha → 文字 aha + 标签 + 心情 → 保存 → 列表看到

import { registerByPhone, assert } from '../_helpers.mjs'

const TS = Date.now()
const phone = `139${String(TS).slice(-8)}`

export default async function test({ page, BASE, log }) {
  log(`phone: ${phone}`)

  // 1. 注册(用现成 helper)
  await page.goto(`${BASE}/auth`, { waitUntil: 'domcontentloaded' })
  await new Promise(r => setTimeout(r, 800))
  await registerByPhone(null, page, phone)
  log('注册完成')

  // 2. 直接调 API 写一个 aha(更稳:不走前端 UI race)
  const ahaRes = await page.evaluate(async (args) => {
    const token = localStorage.getItem('feiman_auth_access')
    const r = await fetch('/api/aha/moments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        type: 'text',
        content: args.content,
        storage: 'cloud',
        tags: args.tag,
        mood: '💡',
      }),
    })
    return { status: r.status, body: await r.json() }
  }, { content: `E2E aha 灵感 ${TS}`, tag: 'e2e,test' })
  assert(ahaRes.status === 201, `创建 aha 失败: ${ahaRes.status} ${JSON.stringify(ahaRes.body)}`)
  assert(ahaRes.body.moment?.id, 'aha 响应没 id')
  log(`aha 创建 id=${ahaRes.body.moment.id}`)

  // 3. 跳到 /aha,UI 应渲染这条
  await page.goto(`${BASE}/aha`, { waitUntil: 'domcontentloaded' })
  await new Promise(r => setTimeout(r, 1500))

  // 列表应该出现
  const bodyText = await page.evaluate(() => document.body.innerText)
  assert(bodyText.includes(`E2E aha 灵感 ${TS}`), `/aha 列表没看到刚写的 aha`)

  // 4. 搜索:输入关键字过滤
  const searchResult = await page.evaluate((q) => {
    // 找 placeholder 含"搜索"或"标签"的 input
    const input = Array.from(document.querySelectorAll('input')).find(i =>
      (i.placeholder || '').includes('搜索') || (i.placeholder || '').includes('标签'))
    if (!input) return { found: false }
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set
    setter.call(input, q)
    input.dispatchEvent(new Event('input', { bubbles: true }))
    return { found: true, placeholder: input.placeholder }
  }, `E2E aha ${TS}`)
  assert(searchResult.found, `找不到搜索 input(placeholder 含"搜索"或"标签")`)
  await new Promise(r => setTimeout(r, 1000))
  const filteredText = await page.evaluate(() => document.body.innerText)
  assert(filteredText.includes(`E2E aha 灵感 ${TS}`), '搜索过滤后看不到匹配的 aha')
  log('✅ 搜索过滤 OK')

  // 5. stats 接口(后端)
  const stats = await page.evaluate(async () => {
    const token = localStorage.getItem('feiman_auth_access')
    const r = await fetch('/api/aha/stats', { headers: { Authorization: `Bearer ${token}` } })
    return { status: r.status, body: await r.json() }
  })
  assert(stats.status === 200, `stats 接口失败: ${stats.status}`)
  assert(stats.body.total >= 1, `stats.total 至少 1,实际 ${stats.body.total}`)
  log(`stats.total=${stats.body.total}`)

  // 6. tags 接口
  const tags = await page.evaluate(async () => {
    const token = localStorage.getItem('feiman_auth_access')
    const r = await fetch('/api/aha/tags', { headers: { Authorization: `Bearer ${token}` } })
    return { status: r.status, body: await r.json() }
  })
  assert(tags.status === 200, `tags 接口失败`)
  log(`tags 数量=${tags.body.tags?.length}`)

  // 7. 删除 aha
  const delRes = await page.evaluate(async (id) => {
    const token = localStorage.getItem('feiman_auth_access')
    const r = await fetch(`/api/aha/moments/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
    return { status: r.status, body: await r.json() }
  }, ahaRes.body.moment.id)
  assert(delRes.status === 200 || delRes.status === 204, `删除失败: ${delRes.status}`)
  log('✅ 啊哈路径全过(创建/搜索/stats/tags/删除)')
}
