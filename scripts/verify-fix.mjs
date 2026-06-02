import puppeteer from 'puppeteer'

const sleep = ms => new Promise(r => setTimeout(r, ms))

const browser = await puppeteer.launch({ headless: true })
const page = await browser.newPage()
await page.setViewport({ width: 390, height: 844 })

// 捕获 console 错误
const errors = []
page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()) })
page.on('pageerror', err => errors.push(err.message))

// 1. 首页 — 应该看到 5 个 Tab
console.log('=== 1. 首页 / ===')
await page.goto('http://localhost:5174/', { waitUntil: 'domcontentloaded', timeout: 20000 })
await sleep(2000)

const tabs = await page.evaluate(() => document.querySelectorAll('nav a').length)
const tabTexts = await page.evaluate(() =>
  Array.from(document.querySelectorAll('nav a')).map(a => a.textContent.trim())
)
console.log('Tab 数量:', tabs)
console.log('Tab 内容:', tabTexts.join(' | '))
await page.screenshot({ path: 'tmp/fix-home.png', fullPage: false })

// 2. 社交训练列表
console.log('\n=== 2. 社交列表 /social ===')
await page.goto('http://localhost:5174/social', { waitUntil: 'domcontentloaded', timeout: 20000 })
await sleep(2000)
const socialItems = await page.evaluate(() =>
  document.querySelectorAll('[class*="group"]').length
)
console.log('社交条目数量:', socialItems)
await page.screenshot({ path: 'tmp/fix-social.png', fullPage: true })

// 3. 数学课
console.log('\n=== 3. 数学课 /math ===')
await page.goto('http://localhost:5174/math', { waitUntil: 'domcontentloaded', timeout: 20000 })
await sleep(2000)
const mathLessons = await page.evaluate(() =>
  document.querySelectorAll('button[class*="rounded-xl"]').length
)
console.log('数学课程数量:', mathLessons)

// 4. 科学列表
console.log('\n=== 4. 科学列表 /science ===')
await page.goto('http://localhost:5174/science', { waitUntil: 'domcontentloaded', timeout: 20000 })
await sleep(2000)
await page.screenshot({ path: 'tmp/fix-science.png', fullPage: true })
console.log('科学列表截图完成')

// 5. 画廊
console.log('\n=== 5. 画廊 /gallery ===')
await page.goto('http://localhost:5174/gallery', { waitUntil: 'domcontentloaded', timeout: 20000 })
await sleep(2000)
await page.screenshot({ path: 'tmp/fix-gallery.png', fullPage: true })
console.log('画廊截图完成')

// 6. 内功
console.log('\n=== 6. 内功 /neimen ===')
await page.goto('http://localhost:5174/neimen', { waitUntil: 'domcontentloaded', timeout: 20000 })
await sleep(2000)
await page.screenshot({ path: 'tmp/fix-neimen.png', fullPage: true })
console.log('内功截图完成')

// 输出错误汇总
if (errors.length > 0) {
  console.log('\n⚠️ 页面错误:')
  errors.forEach(e => console.log('  -', e.substring(0, 200)))
} else {
  console.log('\n✅ 无 JS 错误！btoa 中文问题已修复！')
}

await browser.close()
console.log('\n🎉 全部验证完成！截图保存在 tmp/fix-*.png')
