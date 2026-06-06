/**
 * 小纸条模块截图脚本
 * 拍 7 张 iPhone 14 Pro 视口 (390x844) 的关键页面
 * 截图存到 /tmp/feiman-letters/
 */
import puppeteer from 'puppeteer'
import { mkdirSync } from 'node:fs'
import { join } from 'node:path'

const BASE = 'http://47.99.101.168:8890'
const OUT = '/tmp/feiman-letters'
mkdirSync(OUT, { recursive: true })

const VIEWPORT = { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true }

const SHOTS = [
  { name: '01-letters-home-quote', url: '/letters', wait: 1200, action: 'default' },
  { name: '02-today-sealed', url: '/letters/today', wait: 1200, action: 'sealed' },
  { name: '03-today-opened', url: '/letters/today', wait: 2500, action: 'opened' },
  { name: '04-personal-tab', url: '/letters', wait: 1500, action: 'click-personal' },
  { name: '05-compose-empty', url: '/letters/compose', wait: 1500, action: 'default' },
  { name: '06-compose-typing', url: '/letters/compose', wait: 1800, action: 'type-then-ai' },
  { name: '07-letter-detail-welcome', url: '/letters', wait: 1500, action: 'open-welcome' },
]

async function clickByText(page, text) {
  // 用 evaluate 找含文字的元素并点击
  await page.evaluate((t) => {
    const els = Array.from(document.querySelectorAll('button, a, div[role="button"]'))
    const el = els.find((e) => e.textContent && e.textContent.trim().includes(t))
    if (el) (el).click()
  }, text)
}

async function clickBySelector(page, sel) {
  const el = await page.$(sel)
  if (el) await el.click()
}

async function main() {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  })

  for (const shot of SHOTS) {
    console.log(`\n📸 ${shot.name}  →  ${BASE}${shot.url}`)
    const page = await browser.newPage()
    await page.setViewport(VIEWPORT)
    await page.goto(`${BASE}${shot.url}`, { waitUntil: 'networkidle0', timeout: 30000 })

    // 给 SPA 客户端渲染一点时间
    await new Promise((r) => setTimeout(r, shot.wait))

    // 执行动作
    switch (shot.action) {
      case 'sealed':
        // 等待,让信封停留
        break
      case 'opened':
        // 强制跳到 opened 状态 — 多次点击信封区域(屏幕中心)
        try {
          await page.evaluate(() => {
            const center = document.querySelector('div[style*="perspective"]')
            if (center) (center).click()
          })
          await new Promise((r) => setTimeout(r, 1200))
        } catch {}
        break
      case 'click-personal':
        await clickByText(page, '收到的纸条')
        await new Promise((r) => setTimeout(r, 700))
        break
      case 'type-then-ai':
        try {
          await page.click('textarea')
          await page.keyboard.type('此刻,我想对自己说:保持好奇,继续前行。')
          await new Promise((r) => setTimeout(r, 400))
          // 点 "让 AI 写古文/英文" 面板展开
          await clickByText(page, '让 AI 写古文/英文')
          await new Promise((r) => setTimeout(r, 400))
          // 点 "生成古文 + 英文" 按钮
          await clickByText(page, '生成古文 + 英文')
          await new Promise((r) => setTimeout(r, 2200))
        } catch (e) {
          console.warn('  type-then-ai 动作部分失败:', e.message)
        }
        break
      case 'open-welcome':
        // 进入主页 → 切到 personal tab → 点欢迎信
        await clickByText(page, '收到的纸条')
        await new Promise((r) => setTimeout(r, 800))
        // 点第一个 LetterPaper
        try {
          await page.evaluate(() => {
            const el = document.querySelector('[style*="position: relative"][style*="backgroundColor"]')
            if (el) (el).click()
          })
        } catch {}
        await new Promise((r) => setTimeout(r, 1500))
        break
      default:
        break
    }

    // 截图
    const path = join(OUT, `${shot.name}.png`)
    await page.screenshot({ path, fullPage: false })
    console.log(`  ✅ ${path}`)
    await page.close()
  }

  await browser.close()
  console.log('\n🎉 全部完成,截图在', OUT)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
