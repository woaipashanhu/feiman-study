#!/usr/bin/env node
/**
 * ============================================================
 *  generate-app-icons.mjs — V3.8 PWA + App 图标生成
 *
 *  用法: node scripts/generate-app-icons.mjs
 *
 *  生成:
 *    - PWA icons: 192x192, 512x512, 512x512 maskable
 *    - iOS App Store: 1024x1024 (无透明)
 *    - iOS Spotlight: 120x120, 152x152, 167x167, 180x180
 *    - Android: 48/72/96/144/192 (mipmap)
 *    - Favicon: 16x16, 32x32, 48x48
 *
 *  设计: 奶油底色 + 信封图标 + 品牌色(用 sharp 画 SVG 简化版)
 * ============================================================
 */
import sharp from 'sharp'
import { writeFileSync, mkdirSync, existsSync, rmSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')

// =============== 设计常量 ===============

const COLORS = {
  // 奶油色(跟 LETTER_PALETTE.ivory 一致)
  bg: '#F8F1E7',
  // 信封深色
  fg: '#1A1D2B',
  // 红色蜡封
  accent: '#C73E3A',
}

// SVG 模板: 奶油底 + 信封
// 512x512 视图框,信封占 70% 中心
function makeIconSvg(maskable = false) {
  // maskable 时四周留 10% safe zone,中间内容不裁
  const safePad = maskable ? 64 : 0
  const innerSize = 512 - safePad * 2
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="paper" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FAF4E9"/>
      <stop offset="100%" stop-color="#F0E5D0"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" fill="${COLORS.bg}"/>
  <g transform="translate(${safePad}, ${safePad})">
    <!-- 信封(简化版) -->
    <rect x="${innerSize * 0.12}" y="${innerSize * 0.28}" width="${innerSize * 0.76}" height="${innerSize * 0.5}" rx="${innerSize * 0.04}" fill="${COLORS.fg}"/>
    <!-- 信封折线 -->
    <path d="M ${innerSize * 0.12} ${innerSize * 0.28} L ${innerSize * 0.5} ${innerSize * 0.58} L ${innerSize * 0.88} ${innerSize * 0.28}" fill="none" stroke="${COLORS.bg}" stroke-width="${innerSize * 0.025}" stroke-linejoin="round"/>
    <!-- 蜡封(右下角) -->
    <circle cx="${innerSize * 0.78}" cy="${innerSize * 0.75}" r="${innerSize * 0.08}" fill="${COLORS.accent}"/>
    <text x="${innerSize * 0.78}" y="${innerSize * 0.78}" text-anchor="middle" fill="${COLORS.bg}" font-family="serif" font-size="${innerSize * 0.08}" font-weight="bold">信</text>
  </g>
</svg>`
}

// =============== 写文件 ===============

const outputDirs = [
  resolve(root, 'public/icons'),
  resolve(root, 'ios/App/App/Assets.xcassets/AppIcon.appiconset'),
  resolve(root, 'ios/App/App/Assets.xcassets/Splash.imageset'),
  resolve(root, 'android/app/src/main/res/mipmap-mdpi'),
  resolve(root, 'android/app/src/main/res/mipmap-hdpi'),
  resolve(root, 'android/app/src/main/res/mipmap-xhdpi'),
  resolve(root, 'android/app/src/main/res/mipmap-xxhdpi'),
  resolve(root, 'android/app/src/main/res/mipmap-xxxhdpi'),
]

for (const dir of outputDirs) {
  mkdirSync(dir, { recursive: true })
}

// =============== 生成 PWA icons ===============

async function genPwa() {
  const svg = Buffer.from(makeIconSvg(false))
  const maskSvg = Buffer.from(makeIconSvg(true))

  // 192x192
  await sharp(svg).resize(192, 192).png().toFile(resolve(root, 'public/icons/icon-192.png'))
  // 512x512
  await sharp(svg).resize(512, 512).png().toFile(resolve(root, 'public/icons/icon-512.png'))
  // maskable 512x512
  await sharp(maskSvg).resize(512, 512).png().toFile(resolve(root, 'public/icons/icon-maskable-512.png'))
  // 苹果 touch icon 180x180
  await sharp(svg).resize(180, 180).png().toFile(resolve(root, 'public/icons/apple-touch-icon.png'))
  // favicon 32 + 16
  await sharp(svg).resize(32, 32).png().toFile(resolve(root, 'public/icons/favicon-32.png'))
  await sharp(svg).resize(16, 16).png().toFile(resolve(root, 'public/icons/favicon-16.png'))
  // favicon.ico (32x32 single)
  await sharp(svg).resize(32, 32).toFile(resolve(root, 'public/favicon.ico'))
  console.log('✅ PWA icons (8) 生成到 public/icons/')
}

// =============== 生成 iOS App Store 1024 ===============

async function genIosAppStore() {
  const svg = Buffer.from(makeIconSvg(false))
  // App Store 要求 1024x1024 无透明,无 alpha
  await sharp(svg).resize(1024, 1024).flatten({ background: COLORS.bg }).png().toFile(resolve(root, 'ios/App/App/Assets.xcassets/AppIcon.appiconset/icon-1024.png'))
  // 同时生成 ios App icon 各种尺寸
  for (const [name, size] of [
    ['icon-20', 20], ['icon-29', 29], ['icon-40', 40], ['icon-58', 58],
    ['icon-60', 60], ['icon-76', 76], ['icon-80', 80], ['icon-87', 87],
    ['icon-120', 120], ['icon-152', 152], ['icon-167', 167], ['icon-180', 180],
  ]) {
    await sharp(svg).resize(size, size).flatten({ background: COLORS.bg }).png().toFile(resolve(root, `ios/App/App/Assets.xcassets/AppIcon.appiconset/${name}.png`))
  }
  console.log('✅ iOS App icons (13) 生成到 ios/App/App/Assets.xcassets/AppIcon.appiconset/')

  // 启动图(简单底色)
  const splashSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024"><rect width="1024" height="1024" fill="${COLORS.bg}"/></svg>`
  for (const [name, w, h] of [
    ['Default@1x', 1024, 1024],
    ['Default@2x', 2048, 2048],
    ['Default@3x', 3072, 3072],
  ]) {
    await sharp(Buffer.from(splashSvg)).resize(w, h).png().toFile(resolve(root, `ios/App/App/Assets.xcassets/Splash.imageset/${name}.png`))
  }
  console.log('✅ iOS Splash (3) 生成到 ios/App/App/Assets.xcassets/Splash.imageset/')
}

// =============== 生成 Android mipmap ===============

async function genAndroid() {
  const svg = Buffer.from(makeIconSvg(false))
  const sizes = [
    ['mdpi', 48],
    ['hdpi', 72],
    ['xhdpi', 96],
    ['xxhdpi', 144],
    ['xxxhdpi', 192],
  ]
  for (const [density, size] of sizes) {
    const dir = resolve(root, `android/app/src/main/res/mipmap-${density}`)
    await sharp(svg).resize(size, size).flatten({ background: COLORS.bg }).png().toFile(resolve(dir, `ic_launcher.png`))
    await sharp(svg).resize(size, size).flatten({ background: COLORS.bg }).png().toFile(resolve(dir, `ic_launcher_round.png`))
    await sharp(svg).resize(size, size).flatten({ background: COLORS.bg }).png().toFile(resolve(dir, `ic_launcher_foreground.png`))
  }
  console.log('✅ Android mipmap (15) 生成到 android/app/src/main/res/mipmap-*/')
}

// =============== 主流程 ===============

async function main() {
  console.log('🎨 生成 V3.8 App 图标(信封 + 蜡封)\n')
  await genPwa()
  await genIosAppStore()
  await genAndroid()
  console.log('\n🎉 全部完成!')
  console.log('📍 PWA: public/icons/')
  console.log('📍 iOS: ios/App/App/Assets.xcassets/AppIcon.appiconset/')
  console.log('📍 Android: android/app/src/main/res/mipmap-*/')
}

main().catch((err) => {
  console.error('❌ 生成失败:', err)
  process.exit(1)
})
