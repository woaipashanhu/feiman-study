import puppeteer from 'puppeteer'

const BASE = 'http://47.99.101.168:8890'
const pages = [
  // 列表页
  { name: '📐 数学列表', url: `${BASE}/math`, check: '第1课' },
  { name: '🔬 科学列表', url: `${BASE}/science`, check: '原子结构' },
  { name: '💭 社交列表', url: `${BASE}/social`, check: '卡耐基' },
  { name: '🖼️ 画廊列表', url: `${BASE}/gallery`, check: '蒙娜丽莎' },
  { name: '🃏 内功列表', url: `${BASE}/neimen`, check: '腹式呼吸' },
  // 详情/播放页
  { name: '📐 数学播放', url: `${BASE}/math/m01-01`, check: '加载视频' },
  { name: '🔬 科学3D', url: `${BASE}/science/atom-structure`, check: '原子结构' },
  { name: '💭 社交阅读器', url: `${BASE}/social/scene/s001`, check: '' }, // 可能加载慢
  { name: '🖼️ 画廊大图', url: `${BASE}/gallery/art_mona_lisa`, check: '蒙娜丽莎' },
  { name: '🃏 内功卡片', url: `${BASE}/neimen/n01`, check: '腹式呼吸' },
]

const browser = await puppeteer.launch({ headless: true })
let passed = 0
let failed = 0

for (const p of pages) {
  try {
    const page = await browser.newPage()
    await page.goto(p.url, { waitUntil: 'domcontentloaded', timeout: 20000 })
    await new Promise(r => setTimeout(r, 2500))

    const text = await page.evaluate(() => document.body?.innerText?.substring(0, 300) || '')
    const hasContent = text.length > 30
    const hasCheck = p.check ? text.includes(p.check) : true
    const imgs = await page.evaluate(() => document.querySelectorAll('img').length)
    const loadedImgs = await page.evaluate(() =>
      Array.from(document.querySelectorAll('img')).filter(i => i.naturalWidth > 0).length
    )

    const status = hasContent && hasCheck ? '✅' : '⚠️'
    if (status === '✅') passed++
    else failed++

    console.log(`${status} ${p.name}`)
    console.log(`   URL: ${p.url}`)
    console.log(`   内容长度: ${text.length} | 图片: ${imgs}张 (已加载${loadedImgs})`)
    if (!hasCheck && p.check) console.log(`   缺少关键词: "${p.check}"`)
    if (!hasContent) console.log(`   ⚠️ 页面内容为空!`)
    console.log('')

    await page.close()
  } catch (err) {
    failed++
    console.log(`❌ ${p.name}`)
    console.log(`   URL: ${p.url}`)
    console.log(`   错误: ${err.message}`)
    console.log('')
  }
}

await browser.close()
console.log('='.repeat(40))
console.log(`总计: ${pages.length} 页 | ✅ 通过: ${passed} | ❌ 失败: ${failed}`)
console.log(failed === 0 ? '\n🎉 所有页面验证通过！' : `\n⚠️ 有 ${failed} 个页面需要检查`)
