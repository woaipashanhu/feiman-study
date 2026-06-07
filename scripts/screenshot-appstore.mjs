#!/usr/bin/env node
/**
 * ============================================================
 *  screenshot-appstore.mjs — V3.8 App Store 截图脚本
 *
 *  生成符合 App Store / Google Play 规范的截图:
 *    - iPhone 6.7" 显示屏(1290×2796)
 *    - iPhone 6.5" 显示屏(1242×2688)
 *
 *  用法: node scripts/screenshot-appstore.mjs
 *  截图存到 scripts/screenshots/appstore/
 * ============================================================
 */
import puppeteer from 'puppeteer'
import { mkdirSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { dirname } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')
const outDir = resolve(__dirname, 'screenshots/appstore')
if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true })

// 设备配置
const DEVICES = [
  { name: 'iPhone-6.7', w: 1290, h: 2796, scale: 3, userAgent: 'iPhone; CPU iPhone OS 17_0 like Mac OS X' },
  { name: 'iPhone-6.5', w: 1242, h: 2688, scale: 3, userAgent: 'iPhone; CPU iPhone OS 17_0 like Mac OS X' },
]

const BASE_URL = process.env.SCREENSHOT_URL || 'http://47.99.101.168:8890'

// 截图主题(URL + 名字 + 中文/英文)
const SCENES = [
  { name: '01-home', url: '/letters', title: '主页 · 三种信纸底色' },
  { name: '02-compose', url: '/letters/compose', title: '写信 · AI 润色' },
  { name: '03-inbox', url: '/me/inbox', title: '收件箱 · 收到的信' },
  { name: '04-detail', url: '/letters/sample-id-123', title: '信详情 · 长图分享' },
  { name: '05-profile', url: '/profile', title: '个人中心 · 我的收藏' },
  { name: '06-auth-en', url: '/auth', title: 'Sign in / Sign up', lang: 'en' },
]

async function main() {
  const browser = await puppeteer.launch({ headless: 'new' })

  for (const device of DEVICES) {
    const page = await browser.newPage()
    await page.setViewport({
      width: device.w / device.scale,
      height: device.h / device.scale,
      deviceScaleFactor: device.scale,
      isMobile: true,
      hasTouch: true,
    })
    await page.setUserAgent(device.userAgent)

    for (const scene of SCENES) {
      console.log(`📸 ${device.name} → ${scene.name} (${scene.url})`)
      try {
        if (scene.lang === 'en') {
          await page.evaluateOnNewDocument(() => {
            localStorage.setItem('feiman_lang', 'en')
          })
        }
        await page.goto(`${BASE_URL}${scene.url}`, { waitUntil: 'networkidle0', timeout: 30000 })
        await new Promise((r) => setTimeout(r, 2000))
        await page.screenshot({
          path: resolve(outDir, `${device.name}-${scene.name}.png`),
          fullPage: false,
        })
      } catch (err) {
        console.warn(`  ⚠️  ${scene.name} 失败: ${err.message}`)
      }
    }
    await page.close()
  }

  await browser.close()
  console.log(`\n🎉 截图完成,存到 scripts/screenshots/appstore/`)
  console.log('上传到 App Store Connect 时,按设备分目录即可。')
}

main().catch((err) => {
  console.error('❌ 截图失败:', err)
  process.exit(1)
})
