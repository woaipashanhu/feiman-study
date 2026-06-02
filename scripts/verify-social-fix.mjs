import puppeteer from 'puppeteer'

const sleep = ms => new Promise(r => setTimeout(r, ms))
const BASE = 'http://47.99.101.168:8890'

const browser = await puppeteer.launch({ headless: true })
const page = await browser.newPage()
await page.setViewport({ width: 390, height: 844 })

console.log('=== 验证社交列表修复 ===')
await page.goto(`${BASE}/social`, { waitUntil: 'domcontentloaded', timeout: 20000 })
await sleep(4000)

const info = await page.evaluate(() => {
  return {
    linkCount: document.querySelectorAll('a[href*="social/scene"]').length,
    bodyText: document.body.innerText.substring(0, 600),
    hasCarnegie: document.body.innerText.includes('卡耐基'),
    hasSocialStory: document.body.innerText.includes('社交故事'),
    // 检查数字
    carnegieCount: document.body.innerText.match(/(\d+)\/(\d+)/)?.[0] || 'not found',
    socialCount: document.body.innerText.match(/(\d+)篇/)?.[0] || 'not found',
  }
})

console.log('\n卡片链接数量:', info.linkCount)
console.log('卡耐基计数:', info.carnegieCount)
console.log('社交故事计数:', info.socialCount)
console.log('\n页面内容预览:')
console.log(info.bodyText)

await page.screenshot({ path: 'tmp/social-fixed.png', fullPage: true })

// 检查错误
const errors = []
page.on('pageerror', err => errors.push(err.message))
if (errors.length > 0) {
  console.log('\n⚠️ 错误:')
  errors.forEach(e => console.log(' ', e.substring(0, 200)))
} else {
  console.log('\n✅ 无 JS 错误！')
}

await browser.close()
console.log('\n🎉 截图: tmp/social-fixed.png')
