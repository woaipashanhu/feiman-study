// e2e/_runner.mjs — E2E 测试运行器
// 用法: node e2e/_runner.mjs
//
// 功能:
//   1. 自动 build dist(如果不存在 / 旧)
//   2. 启动 vite preview(带 /api proxy → 47.99.101.168:8890)
//   3. 跑 e2e/tests/ 下所有 .test.mjs
//   4. 关 preview
//
// 设计原则:
//   - 每个 test.mjs export default async function(setup) 收一个 { browser, page, BASE }
//   - 自己 assert,throw 即失败
//   - 跑完 pass 1 个,失败 throw 整个 runner exit 1

import { spawn } from 'node:child_process'
import { existsSync, readdirSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')
const PREVIEW_PORT = 4173
const PREVIEW_URL = `http://127.0.0.1:${PREVIEW_PORT}`
const API_TARGET = process.env.E2E_API_TARGET || 'http://47.99.101.168:8890'

let previewProcess = null

function log(...args) {
  console.log(`[e2e]`, ...args)
}

function err(...args) {
  console.error(`[e2e]`, ...args)
}

async function waitForServer(url, timeoutMs = 15000) {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url)
      if (res.status === 200) return true
    } catch {}
    await new Promise(r => setTimeout(r, 200))
  }
  return false
}

async function ensureBuild() {
  const distIndex = resolve(ROOT, 'dist/index.html')
  if (!existsSync(distIndex)) {
    log('dist 不存在,跑 vite build...')
    await new Promise((resolve, reject) => {
      const p = spawn('npx', ['vite', 'build'], { cwd: ROOT, stdio: 'inherit' })
      p.on('exit', code => code === 0 ? resolve() : reject(new Error(`build exit ${code}`)))
    })
  } else {
    log('dist 存在,跳过 build')
  }
}

function startPreview() {
  log('启动 vite preview(端口', PREVIEW_PORT, '+ /api proxy →', API_TARGET, ')')
  previewProcess = spawn('npx', ['vite', 'preview', '--port', String(PREVIEW_PORT), '--host', '127.0.0.1'], {
    cwd: ROOT,
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, VITE_API_TARGET: API_TARGET },
  })
  // 不打 preview 自身日志,跑成功就行
  previewProcess.stdout.on('data', () => {})
  previewProcess.stderr.on('data', d => {
    if (d.toString().includes('error') || d.toString().includes('Error')) {
      err('preview stderr:', d.toString().trim())
    }
  })
}

function stopPreview() {
  if (previewProcess) {
    log('关 vite preview')
    previewProcess.kill('SIGTERM')
    previewProcess = null
  }
}

async function runTests() {
  const puppeteer = (await import('puppeteer')).default
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  })
  // 改默认 navigation timeout(WS 长连接导致 networkidle0 永远不结束)
  browser.defaultBrowserContext().overridePermissions('http://127.0.0.1', [])

  const testsDir = resolve(__dirname, 'tests')
  const files = readdirSync(testsDir)
    .filter(f => f.endsWith('.test.mjs'))
    .sort()

  log(`找到 ${files.length} 个测试文件`)
  const results = []
  for (const f of files) {
    const path = resolve(testsDir, f)
    const mod = await import(pathToFileURL(path).href)
    const test = mod.default
    if (typeof test !== 'function') {
      err(`${f}: default export 必须是 async function,跳过`)
      results.push({ file: f, status: 'skip' })
      continue
    }
    const start = Date.now()
    let page = null
    try {
      page = await browser.newPage()
      await page.setViewport({ width: 393, height: 852 })
      // WS 长连接 networkidle0 永远不结束,用 domcontentloaded
      page.setDefaultNavigationTimeout(60000)
      page.setDefaultTimeout(30000)
      const ctx = { browser, page, BASE: PREVIEW_URL, API: API_TARGET, log }
      await test(ctx)
      const dur = ((Date.now() - start) / 1000).toFixed(1)
      log(`✅ ${f} (${dur}s)`)
      results.push({ file: f, status: 'pass', dur })
    } catch (e) {
      const dur = ((Date.now() - start) / 1000).toFixed(1)
      err(`❌ ${f} (${dur}s):`, e.message)
      results.push({ file: f, status: 'fail', dur, error: e.message })
    } finally {
      if (page) await page.close().catch(() => {})
    }
  }

  await browser.close()
  return results
}

async function main() {
  await ensureBuild()
  startPreview()
  if (!(await waitForServer(PREVIEW_URL))) {
    err('preview server 启动失败(等 15s 还没起来)')
    stopPreview()
    process.exit(1)
  }
  log('preview ready')

  let results = []
  try {
    results = await runTests()
  } finally {
    stopPreview()
  }

  // 汇总
  const pass = results.filter(r => r.status === 'pass').length
  const fail = results.filter(r => r.status === 'fail').length
  const skip = results.filter(r => r.status === 'skip').length
  log(`\n=== 总结 ===`)
  log(`通过: ${pass}, 失败: ${fail}, 跳过: ${skip}`)
  if (fail > 0) {
    err(`失败用例:`)
    results.filter(r => r.status === 'fail').forEach(r => err(`  - ${r.file}: ${r.error}`))
    process.exit(1)
  }
}

process.on('SIGINT', () => { stopPreview(); process.exit(1) })
process.on('uncaughtException', e => { err('uncaughtException:', e); stopPreview(); process.exit(1) })

main().catch(e => {
  err('runner 异常:', e)
  stopPreview()
  process.exit(1)
})
