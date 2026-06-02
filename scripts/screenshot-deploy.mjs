import puppeteer from 'puppeteer'

const BASE = 'http://47.99.101.168:8890'
const OUT = '/Users/liuzhen/Documents/lingxi-claw/20260529-08-47-11-713/feiman-v3-new/tmp'

// 兼容新版 Puppeteer 的 sleep 辅助函数
const sleep = (ms) => new Promise(r => setTimeout(r, ms))

const browser = await puppeteer.launch({ headless: true })
const page = await browser.newPage()
await page.setViewport({ width: 390, height: 844 })

console.log('=== 1. 首页 ===')
await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded', timeout: 20000 })
await sleep(2500)
await page.screenshot({ path: `${OUT}/deploy-home.png`, fullPage: false })
console.log('✅ 首页截图完成')

console.log('\n=== 2. 科学可视化列表 ===')
await page.goto(`${BASE}/science`, { waitUntil: 'domcontentloaded', timeout: 20000 })
await sleep(2000)
await page.screenshot({ path: `${OUT}/deploy-science.png`, fullPage: true })
console.log('✅ 科学列表截图完成')

console.log('\n=== 3. 科学3D播放页 ===')
await page.goto(`${BASE}/science/atom-structure`, { waitUntil: 'domcontentloaded', timeout: 20000 })
await sleep(4000)
await page.screenshot({ path: `${OUT}/deploy-science-player.png`, fullPage: false })
console.log('✅ 3D播放页截图完成')

console.log('\n=== 4. 童画廊列表 ===')
await page.goto(`${BASE}/gallery`, { waitUntil: 'domcontentloaded', timeout: 20000 })
await sleep(2000)
await page.screenshot({ path: `${OUT}/deploy-gallery.png`, fullPage: true })
console.log('✅ 画廊列表截图完成')

console.log('\n=== 5. 童画廊大图 ===')
await page.goto(`${BASE}/gallery/art_starry_night`, { waitUntil: 'domcontentloaded', timeout: 20000 })
await sleep(2000)
await page.screenshot({ path: `${OUT}/deploy-gallery-viewer.png`, fullPage: false })
console.log('✅ 大图查看截图完成')

console.log('\n=== 6. 内功养生法列表 ===')
await page.goto(`${BASE}/neimen`, { waitUntil: 'domcontentloaded', timeout: 20000 })
await sleep(2000)
await page.screenshot({ path: `${OUT}/deploy-neimen.png`, fullPage: true })
console.log('✅ 内功列表截图完成')

console.log('\n=== 7. 内功卡片详情 ===')
await page.goto(`${BASE}/neimen/n01`, { waitUntil: 'domcontentloaded', timeout: 20000 })
await sleep(1500)
// 点击翻转卡片
try {
  const cardEl = await page.$('[style*="perspective"]')
  if (cardEl) await cardEl.click()
} catch(e) {}
await sleep(800)
await page.screenshot({ path: `${OUT}/deploy-neimen-card-back.png`, fullPage: false })
console.log('✅ 卡片详情截图完成')

console.log('\n=== 8. 社交训练列表 ===')
await page.goto(`${BASE}/social`, { waitUntil: 'domcontentloaded', timeout: 20000 })
await sleep(2000)
await page.screenshot({ path: `${OUT}/deploy-social.png`, fullPage: true })
console.log('✅ 社交列表截图完成')

await browser.close()
console.log('\n🎉 全部截图完成！查看 tmp/deploy-*.png')
