/**
 *  用 Puppeteer 模拟浏览器访问社交页面，捕获控制台错误和网络请求
 */
import { readFileSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// 动态导入 puppeteer
let puppeteer
try {
  puppeteer = (await import('puppeteer')).default
} catch {
  console.log('puppeteer 未安装，尝试用轻量方式...')
  // 不用 puppeteer，直接用 curl + 分析 JS 来排查
  process.exit(0)
}

const URL = 'http://47.99.101.168:8890/social'
const SOCIAL_URL = 'http://47.99.101.168:8890/social/scene/social-01'

console.log(`=== 浏览器测试 ===`)
console.log(`目标1(列表页): ${URL}`)
console.log(`目标2(阅读器): ${SOCIAL_URL}`)

const browser = await puppeteer.launch({
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox']
})

async function testPage(name, url) {
  console.log(`\n--- ${name} ---`)
  const page = await browser.newPage()
  
  const consoleLogs = []
  const consoleErrors = []
  const networkErrors = []
  
  page.on('console', msg => {
    const text = msg.text().substring(0, 300)
    if (msg.type() === 'error') consoleErrors.push(text)
    else consoleLogs.push(text)
  })
  
  page.on('pageerror', err => {
    networkErrors.push(err.message.substring(0, 300))
  })
  
  page.on('requestfailed', req => {
    networkErrors.push(`FAIL ${req.method()} ${req.url()} (${req.failure()?.errorText})`)
  })
  
  try {
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 15000 })
    
    // 等待额外时间让 React 渲染
    await new Promise(r => setTimeout(r, 2000))
    
    // 获取页面内容
    const bodyText = await page.evaluate(() => document.body?.innerText?.substring(0, 1000) || '(empty)')
    const html = await page.evaluate(() => document.body?.innerHTML?.substring(0, 500) || '(empty)')
    
    console.log(`  页面文本: "${bodyText.substring(0, 200)}"`)
    console.log(`  HTML片段: ${html.substring(0, 300)}`)
    
    // 获取 #root 的子元素信息
    const rootInfo = await page.evaluate(() => {
      const root = document.getElementById('root')
      if (!root) return 'NO ROOT ELEMENT'
      return `children=${root.children.length}, innerHTML_len=${root.innerHTML.length}`
    })
    console.log(`  Root: ${rootInfo}`)
    
  } catch (e) {
    console.error(`  导航失败: ${e.message}`)
  }
  
  if (consoleErrors.length > 0) {
    console.error(`  ❌ 控制台错误(${consoleErrors.length}):`)
    consoleErrors.slice(0, 10).forEach(e => console.error(`     ${e}`))
  }
  
  if (networkErrors.length > 0) {
    console.error(`  ❌ 网络/JS错误(${networkErrors.length}):`)
    networkErrors.slice(0, 10).forEach(e => console.error(`     ${e}`))
  }
  
  // 显示有用的日志
  const usefulLogs = consoleLogs.filter(l => 
    l.includes('校验') || l.includes('加载') || l.includes('失败') || 
    l.includes('fallback') || l.includes('error') || l.includes('Error')
  )
  if (usefulLogs.length > 0) {
    console.log(`  📋 关键日志:`)
    usefulLogs.slice(0, 10).forEach(l => console.log(`     ${l}`))
  }
  
  await page.close()
}

await testPage('列表页', URL)
await testPage('阅读器(social-01)', SOCIAL_URL)

await browser.close()
console.log('\n=== 测试完成 ===')
