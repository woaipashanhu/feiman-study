/**
 * 信纸底色 3 种视觉验证
 */
import puppeteer from 'puppeteer'
import { mkdirSync } from 'node:fs'
import { join } from 'node:path'

const BASE = 'http://47.99.101.168:8890'
const OUT = '/tmp/feiman-letters-paper'
mkdirSync(OUT, { recursive: true })

const VIEWPORT = { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true }

const BG_KEYS = [
  { name: 'ivory', color: '#FAF7F2', expected: 'ivory paper' },
  { name: 'midnight', color: '#0E1014', expected: 'dark' },
  { name: 'kraft', color: '#D4B895', expected: 'kraft paper' },
]

async function main() {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] })
  const errors = []
  const page = await browser.newPage()
  await page.setViewport(VIEWPORT)
  page.on('pageerror', (e) => errors.push(`[pageerror] ${e.message}`))
  page.on('console', (m) => { if (m.type() === 'error') errors.push(`[console.error] ${m.text()}`) })

  await page.goto(`${BASE}/letters/compose`, { waitUntil: 'domcontentloaded', timeout: 15000 })
  await new Promise((r) => setTimeout(r, 1500))

  // 输入文字
  await page.click('textarea')
  await page.keyboard.type('保持好奇,继续前行。纸短情长,一封信送给未来的自己。', { delay: 20 })
  await new Promise((r) => setTimeout(r, 500))

  for (const bg of BG_KEYS) {
    // 点对应 swatch
    await page.evaluate((bgName) => {
      // 找底色组的 3 个按钮(底色组是"底色"label 后面那个 p-1 圆角组的 3 个按钮)
      // 简化:点按 swatch 颜色匹配的最近父按钮
      const swatches = Array.from(document.querySelectorAll('span'))
      for (const s of swatches) {
        const style = s.style && s.style.backgroundColor
        if (style && style.toLowerCase().includes(bgName === 'ivory' ? '250, 247, 242' : bgName === 'midnight' ? '14, 16, 20' : '212, 184, 149')) {
          // 找最近按钮父
          let parent = s.parentElement
          while (parent && parent.tagName !== 'BUTTON') parent = parent.parentElement
          if (parent) (parent).click()
          return true
        }
      }
      return false
    }, bg.name)
    await new Promise((r) => setTimeout(r, 600))
    await page.screenshot({ path: join(OUT, `${bg.name}.png`) })
    console.log(`  ✓ ${bg.name}.png`)
  }

  await browser.close()

  if (errors.length > 0) {
    console.log('\n⚠ Browser errors:')
    errors.forEach((e) => console.log('  ' + e))
  } else {
    console.log('\n🎉 0 browser errors')
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
