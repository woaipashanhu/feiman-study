import puppeteer from 'puppeteer'
const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] })
const page = await browser.newPage()
await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true })
const errors = []
page.on('pageerror', (e) => errors.push(`[pageerror] ${e.message}`))
page.on('console', (m) => { if (m.type() === 'error') errors.push(`[console.error] ${m.text()}`) })
for (const path of ['/', '/profile', '/letters', '/letters/today', '/auth']) {
  await page.goto(`http://47.99.101.168:8890${path}`, { waitUntil: 'domcontentloaded' })
  await new Promise((r) => setTimeout(r, 1500))
  console.log(`  ✓ ${path}`)
}
await browser.close()
if (errors.length > 0) {
  console.log('⚠ errors:')
  errors.forEach((e) => console.log('  ' + e))
  process.exit(1)
} else {
  console.log('\n🎉 0 errors on 5 pages')
}
