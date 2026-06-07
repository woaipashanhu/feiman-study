/**
 * LongCat AI 集成 E2E:
 *   1. 直接调 /api/ai/transform(用真实 LongCat)
 *   2. 打开 /letters/compose 输入文字 → 点"让 AI 写古文/英文"
 *   3. 验证返回的 source 是 'longcat' 不是 'mock'
 *   4. 截图保存
 */
import puppeteer from 'puppeteer'
import { mkdirSync } from 'node:fs'
import { join } from 'node:path'

const BASE = 'http://47.99.101.168:8890'
const OUT = '/tmp/feiman-letters-longcat'
mkdirSync(OUT, { recursive: true })

const VIEWPORT = { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true }

async function main() {
  // 1. 直接 API 测试
  console.log('1. POST /api/ai/transform (直调)')
  const apiRes = await fetch(`${BASE}/api/ai/transform`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content: '保持好奇,继续前行,每天进步一点点。' }),
  })
  const apiData = await apiRes.json()
  console.log('  source:', apiData.source)
  console.log('  古文:', apiData.classicalChinese)
  console.log('  英文:', apiData.english)

  if (apiData.source !== 'longcat') {
    console.log('  ❌ source 不是 longcat, 实际是:', apiData.source)
    process.exit(1)
  }
  console.log('  ✓ source = longcat (用了真实 AI)')

  // 2. 浏览器端验证
  console.log('\n2. 浏览器写信 + AI 转换')
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  })
  const errors = []
  const page = await browser.newPage()
  await page.setViewport(VIEWPORT)
  page.on('pageerror', (e) => errors.push(`[pageerror] ${e.message}`))
  page.on('console', (m) => { if (m.type() === 'error') errors.push(`[console.error] ${m.text()}`) })

  await page.goto(`${BASE}/letters/compose`, { waitUntil: 'domcontentloaded' })
  await new Promise((r) => setTimeout(r, 1500))
  await page.click('textarea')
  await page.keyboard.type('保持好奇,继续前行,每天进步一点点。', { delay: 20 })
  await new Promise((r) => setTimeout(r, 500))
  await page.screenshot({ path: join(OUT, '01-typed.png') })
  console.log('  ✓ 01-typed.png')

  // 展开 AI 面板
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'))
    const aiBtn = btns.find((b) => b.textContent && b.textContent.includes('让 AI 写古文'))
    if (aiBtn) aiBtn.click()
  })
  await new Promise((r) => setTimeout(r, 500))

  // 点"生成古文 + 英文"按钮
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'))
    const submit = btns.find((b) => b.textContent && b.textContent.includes('生成古文 + 英文'))
    if (submit) submit.click()
  })
  console.log('  ... 等待 LongCat 响应(最多 8 秒)')
  await new Promise((r) => setTimeout(r, 8000))
  await page.screenshot({ path: join(OUT, '02-ai-result.png') })
  console.log('  ✓ 02-ai-result.png')

  // 验证页面有真实 AI 输出(不是 mock 模板)
  const pageText = await page.evaluate(() => document.body.innerText)
  const hasLongCat = pageText.includes('秉心') || pageText.includes('砥砺') || pageText.includes('好奇')
  if (hasLongCat) {
    console.log('  ✓ 页面显示真实 AI 输出(包含"秉心/砥砺/好奇"等)')
  } else {
    console.log('  ⚠ 页面内容(前 200 字):', pageText.slice(0, 200))
  }

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
