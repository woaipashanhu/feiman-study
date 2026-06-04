// 用 puppeteer 截屏 5 个板块首页 + 5 个分类页
// iPhone 12 viewport 模拟
import puppeteer from 'puppeteer'
import { mkdir } from 'fs/promises'

const BASE = 'http://47.99.101.168:8890'
const OUT = '/tmp/feiman-screenshots'

const PAGES = [
  { name: '01-math-home',        url: `${BASE}/math` },
  { name: '02-math-section',     url: `${BASE}/math/section/M1` },
  { name: '03-science-home',     url: `${BASE}/science` },
  { name: '04-science-category', url: `${BASE}/science/category/earth` },
  { name: '05-social-home',      url: `${BASE}/social` },
  { name: '06-social-category',  url: `${BASE}/social/category/carnegie` },
  { name: '07-gallery-home',     url: `${BASE}/gallery` },
  { name: '08-gallery-category', url: `${BASE}/gallery/category/met1` },
  { name: '09-neimen-home',      url: `${BASE}/neimen` },
  { name: '10-neimen-category',  url: `${BASE}/neimen/category/breathing` },
]

async function main() {
  await mkdir(OUT, { recursive: true })

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  })

  const page = await browser.newPage()
  // iPhone 12 viewport
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 })

  for (const p of PAGES) {
    try {
      console.log(`📸 ${p.name} <- ${p.url}`)
      await page.goto(p.url, { waitUntil: 'networkidle2', timeout: 30000 })
      // 等待 React + 数据加载
      await new Promise(r => setTimeout(r, 2500))
      await page.screenshot({
        path: `${OUT}/${p.name}.png`,
        fullPage: false, // 只截一屏(iPhone 视口)
      })
    } catch (err) {
      console.error(`❌ ${p.name} failed: ${err.message}`)
    }
  }

  await browser.close()
  console.log(`\n✅ Done. Screenshots in: ${OUT}`)
}

main().catch(console.error)
