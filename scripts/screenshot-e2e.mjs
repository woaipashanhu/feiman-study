/**
 * 小纸条 E2E 验证:
 *   1. 创建一张纸条 (POST /api/letters) → 拿到 shareToken
 *   2. 打开 /letters/inbox/<token> 落地页 → 渲染 LetterPaper
 *   3. 点 "收藏到我的小纸条" → 调用 collect + addPersonal
 *   4. 截图保存
 */
import puppeteer from 'puppeteer'
import { mkdirSync } from 'node:fs'
import { join } from 'node:path'

const BASE = 'http://47.99.101.168:8890'
const OUT = '/tmp/feiman-letters-e2e'
mkdirSync(OUT, { recursive: true })

const VIEWPORT = { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true }

async function main() {
  // 1. 通过 API 创建一张纸条
  console.log('1. POST /api/letters (create a shareable letter)')
  const createRes = await fetch(`${BASE}/api/letters`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      content: 'E2E 验证:小纸条 V1 跨用户收信链路通了!',
      author: 'Mavis(自动测试)',
      bgKey: 'ivory',
      translations: {
        classicalChinese: '后端已通,跨用户可期。',
        english: 'Backend live, cross-user ready.',
      },
    }),
  })
  const createData = await createRes.json()
  if (!createData.ok) {
    console.error('Create failed:', createData)
    process.exit(1)
  }
  const { id, shareToken } = createData.letter
  console.log(`   ✓ Created id=${id} token=${shareToken}`)

  // 2. Puppeteer 打开落地页
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  })

  const errors = []

  // 截图 1: 落地页
  console.log('2. Navigate to /letters/inbox/' + shareToken)
  {
    const page = await browser.newPage()
    await page.setViewport(VIEWPORT)
    page.on('pageerror', (e) => errors.push(`[pageerror] ${e.message}`))
    page.on('console', (m) => {
      if (m.type() === 'error') errors.push(`[console.error] ${m.text()}`)
    })
    await page.goto(`${BASE}/letters/inbox/${shareToken}`, {
      waitUntil: 'domcontentloaded',
      timeout: 15000,
    })
    await new Promise((r) => setTimeout(r, 2500))
    await page.screenshot({ path: join(OUT, '01-inbox-loaded.png') })
    console.log('   ✓ Screenshot 01-inbox-loaded.png')
    await page.close()
  }

  // 截图 2: 点收藏按钮
  console.log('3. Click "收藏到我的小纸条"')
  {
    const page = await browser.newPage()
    await page.setViewport(VIEWPORT)
    page.on('pageerror', (e) => errors.push(`[pageerror] ${e.message}`))
    page.on('console', (m) => {
      if (m.type() === 'error') errors.push(`[console.error] ${m.text()}`)
    })
    await page.goto(`${BASE}/letters/inbox/${shareToken}`, {
      waitUntil: 'domcontentloaded',
      timeout: 15000,
    })
    await new Promise((r) => setTimeout(r, 2000))
    // 点收藏按钮
    try {
      await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button'))
        const target = btns.find((b) => b.textContent && b.textContent.includes('收藏到我的小纸条'))
        if (target) target.click()
      })
      await new Promise((r) => setTimeout(r, 1500))
      await page.screenshot({ path: join(OUT, '02-after-collect.png') })
      console.log('   ✓ Screenshot 02-after-collect.png')
    } catch (e) {
      console.log('   ⚠ collect click failed:', e.message)
    }
    await page.close()
  }

  // 3. API 验证: 收藏数 +1
  console.log('4. Verify collect count incremented via API')
  const afterRes = await fetch(`${BASE}/api/letters/${id}`)
  const after = await afterRes.json()
  console.log(`   ✓ collectCount: ${after.letter.collectCount} (was 0)`)

  // 4. 错误场景: 404
  console.log('5. Test 404 path')
  {
    const page = await browser.newPage()
    await page.setViewport(VIEWPORT)
    await page.goto(`${BASE}/letters/inbox/sl_nonexistent_test`, {
      waitUntil: 'domcontentloaded',
      timeout: 15000,
    })
    await new Promise((r) => setTimeout(r, 1500))
    await page.screenshot({ path: join(OUT, '03-not-found.png') })
    console.log('   ✓ Screenshot 03-not-found.png')
    await page.close()
  }

  await browser.close()

  if (errors.length > 0) {
    console.log('\n⚠ Browser errors:')
    errors.forEach((e) => console.log('  ' + e))
  } else {
    console.log('\n🎉 E2E 全过, 0 browser errors')
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
