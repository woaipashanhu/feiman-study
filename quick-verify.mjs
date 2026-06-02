import puppeteer from 'puppeteer'

const BASE = 'http://47.99.101.168:8890'
const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] })

try {
  const page = await browser.newPage()
  await page.goto(`${BASE}/math`, { waitUntil: 'domcontentloaded', timeout: 12000 })
  await new Promise(r => setTimeout(r, 1200))

  const bodyText = await page.evaluate(() => document.body?.innerText?.substring(0, 200) || '')
  const btnCount = await page.evaluate(() => {
    let c = 0
    document.querySelectorAll('button').forEach(b => { if (b.className.includes('bg-gradient')) c++ })
    return c
  })
  
  console.log(`[1] 数学页: ${bodyText.length > 30 ? '✅' : '❌'} | 📊按钮: ${btnCount}个`)
  console.log(`    内容: ${bodyText.substring(0, 60).replace(/\n/g,' ')}`)

  // 点击📊按钮
  if (btnCount > 0) {
    await page.evaluate(() => {
      document.querySelectorAll('button').forEach(b => { if (b.className.includes('bg-gradient')) b.click() })
    })
    await new Promise(r => setTimeout(r, 600))
    const drawerText = await page.evaluate(() => {
      const el = document.querySelector('[class*="slide-in"]')
      return el ? el.innerText.substring(0, 150) : ''
    })
    console.log(`[2] Drawer: ${drawerText.includes('个人中心') ? '✅' : '❌'} | ${drawerText.includes('每日盲盒') ? '盲盒✅' : ''}`)
    console.log(`    ${drawerText.replace(/\n/g, ' ').substring(0, 80)}`)
  }

  await page.close()

  // 快速检查其他页面
  for (const [name, path] of [['科学','/science'], ['社交','/social'], ['画廊','/gallery'], ['内功','/neimen']]) {
    const p = await browser.newPage()
    await p.goto(`${BASE}${path}`, { waitUntil: 'domcontentloaded', timeout: 10000 })
    await new Promise(r => setTimeout(r, 800))
    const c = await p.evaluate(() => { let n=0; document.querySelectorAll('button').forEach(b=>{if(b.className.includes('bg-gradient'))n++}); return n })
    const t = await p.evaluate(() => document.body?.innerText?.substring(0,40) || '')
    console.log(`[${name}] ${t.length>20?'✅':'❌'} 📊:${c} | ${t.replace(/\n/g,' ').substring(0,35)}`)
    await p.close()
  }
} catch(e) {
  console.log('Error:', e.message)
}

await browser.close()
console.log('\n🎉 Done!')
process.exit(0)
