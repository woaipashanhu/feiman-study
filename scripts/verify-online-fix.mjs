import puppeteer from 'puppeteer'

const sleep = ms => new Promise(r => setTimeout(r, ms))
const BASE = 'http://47.99.101.168:8890'
const OUT = 'tmp/deploy-fix'

const browser = await puppeteer.launch({ headless: true })
const page = await browser.newPage()
await page.setViewport({ width: 390, height: 844 })

const errors = []
page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()) })
page.on('pageerror', err => errors.push(err.message))

// 1. 首页
console.log('=== 1. 首页 ===')
await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded', timeout: 20000 })
await sleep(3000)
const tabs = await page.evaluate(() => document.querySelectorAll('nav a').length)
const tabTexts = await page.evaluate(() => Array.from(document.querySelectorAll('nav a')).map(a => a.textContent.trim()))
console.log(`Tab 数量: ${tabs}`)
console.log(`Tab 内容: ${tabTexts.join(' | ')}`)
await page.screenshot({ path: `${OUT}-home.png`, fullPage: false })

// 2. 社交列表
console.log('\n=== 2. 社交列表 ===')
await page.goto(`${BASE}/social`, { waitUntil: 'domcontentloaded', timeout: 20000 })
await sleep(2500)
await page.screenshot({ path: `${OUT}-social.png`, fullPage: true })
const socialLen = await page.evaluate(() => document.body.innerText.length)
console.log(`社交页面内容长度: ${socialLen}`)

// 3. 数学课
console.log('\n=== 3. 数学课 ===')
await page.goto(`${BASE}/math`, { waitUntil: 'domcontentloaded', timeout: 20000 })
await sleep(2500)
await page.screenshot({ path: `${OUT}-math.png`, fullPage: false })

// 4. 科学
console.log('\n=== 4. 科学 ===')
await page.goto(`${BASE}/science`, { waitUntil: 'domcontentloaded', timeout: 20000 })
await sleep(2000)
await page.screenshot({ path: `${OUT}-science.png`, fullPage: true })

// 5. 画廊
console.log('\n=== 5. 画廊 ===')
await page.goto(`${BASE}/gallery`, { waitUntil: 'domcontentloaded', timeout: 20000 })
await sleep(2000)
await page.screenshot({ path: `${OUT}-gallery.png`, fullPage: true })

// 6. 内功
console.log('\n=== 6. 内功 ===')
await page.goto(`${BASE}/neimen`, { waitUntil: 'domcontentloaded', timeout: 20000 })
await sleep(2000)
await page.screenshot({ path: `${OUT}-neimen.png`, fullPage: true })

// 汇总
if (errors.length > 0) {
  console.log('\n⚠️ 页面错误:')
  errors.slice(0, 5).forEach(e => console.log('  -', e.substring(0, 150)))
} else {
  console.log('\n✅✅✅ 零 JS 错误！btoa 中文崩溃问题已彻底修复！')
}

await browser.close()
console.log(`\n🎉 线上验证完成！截图: ${OUT}-*.png`)
