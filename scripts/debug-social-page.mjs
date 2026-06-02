import puppeteer from 'puppeteer'

const sleep = ms => new Promise(r => setTimeout(r, ms))

const browser = await puppeteer.launch({ headless: true })
const page = await browser.newPage()
await page.setViewport({ width: 390, height: 844 })

const errors = []
const consoleLogs = []
page.on('console', msg => {
  const text = msg.text()
  consoleLogs.push(text)
  if (msg.type() === 'error') errors.push(text)
})
page.on('pageerror', err => errors.push(err.message))

console.log('=== 打开社交列表页 ===')
await page.goto('http://47.99.101.168:8890/social', { waitUntil: 'domcontentloaded', timeout: 20000 })
await sleep(4000)

// 截图
await page.screenshot({ path: 'tmp/debug-social.png', fullPage: true })

// 检查 DOM
const domInfo = await page.evaluate(() => {
  const body = document.body
  return {
    bodyHTMLLength: body.innerHTML.length,
    bodyTextLength: body.innerText.length,
    bodyTextPreview: body.innerText.substring(0, 500),
    // 查找卡片链接数量
    linkCount: document.querySelectorAll('a[href*="social/scene"]').length,
    // 查找 section 数量
    sectionCount: document.querySelectorAll('section').length,
    // 查找"加载中"
    hasLoading: body.innerText.includes('加载中'),
    // 检查是否有 ErrorBoundary 内容
    hasError: body.innerText.includes('出错了') || body.innerText.includes('刷新'),
    // 检查 main 区域
    mainHTML: document.querySelector('main')?.innerHTML?.substring(0, 500) || 'no main',
    // 检查是否有 carnegie 文字
    hasCarnegie: body.innerText.includes('卡耐基'),
    hasSocialStory: body.innerText.includes('社交故事'),
  }
})

console.log('\n=== DOM 检查结果 ===')
for (const [k, v] of Object.entries(domInfo)) {
  if (typeof v === 'string' && v.length > 200) {
    console.log(`${k}: ${v.substring(0, 200)}...`)
  } else {
    console.log(`${k}: ${v}`)
  }
}

console.log('\n=== Console Logs (前20条) ===')
consoleLogs.slice(0, 20).forEach(l => console.log(' ', l.substring(0, 200)))

if (errors.length > 0) {
  console.log('\n=== 错误 ===')
  errors.forEach(e => console.log(' ❌', e.substring(0, 300)))
}

await browser.close()
console.log('\n完成！截图: tmp/debug-social.png')
