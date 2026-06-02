#!/usr/bin/env node
/**
 * ============================================================
 *  部署前预检脚本 (pre-deploy check)
 *
 *  在每次部署前自动运行，拦截常见问题:
 *    1. 图标名拼写检查 — 防止 React Error #130 白屏
 *    2. 构建产物完整性检查
 *    3. 关键文件存在性检查
 *    4. data JSON 格式校验
 *
 *  用法: node scripts/pre-deploy-check.mjs
 *  退出码: 0 = 全通过, 1 = 有问题
 * ============================================================
 */
import { readFileSync, existsSync, readdirSync } from 'fs'
import { join, relative } from 'path'
import { fileURLToPath } from 'url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const ROOT = join(__dirname, '..')
const DIST = join(ROOT, 'dist')

// ---- 工具 ----
const RED = '\x1b[31m', GREEN = '\x1b[32m', YELLOW = '\x1b[33m', CYAN = '\x1b[36m', RESET = '\x1b[0m'
let pass = 0, fail = 0, warnCount = 0

function ok(msg)   { console.log(`  ${GREEN}✅${RESET} ${msg}`); pass++ }
function failMsg(msg) { console.log(`  ${RED}❌${RESET} ${msg}`); fail++ }
function warn(msg) { console.log(`  ${YELLOW}⚠️ ${RESET} ${msg}`); warnCount++ }
function section(title) { console.log(`\n${CYAN}[pre-deploy]${RESET} ${title}`) }

// ==================== 检查 1: 图标名合法性 ====================
section('1. 图标名拼写检查（防止白屏）')

try {
  // 从 icon-registry 读取合法图标名列表
  const registryContent = readFileSync(join(ROOT, 'src/shared/components/icon-registry.ts'), 'utf-8')
  const validMatch = registryContent.match(/VALID_ICON_NAMES.*?=\s*\[([\s\S]*?)\]/)
  if (!validMatch) {
    failMsg('无法从 icon-registry.ts 解析 VALID_ICON_NAMES')
  } else {
    const validIcons = [...validMatch[1].matchAll(/'(\w+)'/g)].map(m => m[1])

    // 检查 useBoardStore 中的图标名
    const storeContent = readFileSync(join(ROOT, 'src/stores/useBoardStore.ts'), 'utf-8')
    const iconUsages = [...storeContent.matchAll(/icon:\s*'(\w+)'/g)]

    let allOk = true
    for (const usage of iconUsages) {
      const iconName = usage[1]
      if (validIcons.includes(iconName)) {
        ok(`图标 "${iconName}" ✅`)
      } else {
        allOk = false
        failMsg(`无效图标名: "${iconName}" (位置: useBoardStore.ts)`)
        console.log(`     可用图标: ${validIcons.join(', ')}`)
      }
    }
    if (allOk && iconUsages.length > 0) {
      // 已经逐个 ok 了，不再重复
    } else if (iconUsages.length === 0) {
      warn('未找到任何图标配置')
    }
  }
} catch (e) {
  failMsg(`图标检查异常: ${e.message}`)
}

// ==================== 检查 2: 构建产物完整性 ====================
section('2. 构建产物完整性')

if (!existsSync(DIST)) {
  failMsg('dist/ 目录不存在！请先运行 npm run build')
} else {
  const requiredFiles = ['index.html']
  const requiredDirs = ['assets']

  for (const f of requiredFiles) {
    const p = join(DIST, f)
    if (existsSync(p)) {
      ok(`dist/${f} 存在`)
    } else {
      failMsg(`dist/${f} 缺失！`)
    }
  }

  for (const d of requiredDirs) {
    const p = join(DIST, d)
    if (existsSync(p)) {
      const files = readdirSync(p).filter(f => f.endsWith('.js') || f.endsWith('.css'))
      if (files.length > 0) {
        ok(`dist/${d}/ 包含 ${files.length} 个资源文件 (${files.slice(0,3).join(', ')}...)`)
      } else {
        failMsg(`dist/${d}/ 目录为空！没有 JS/CSS 文件`)
      }
    } else {
      failMsg(`dist/${d}/ 目录缺失！`)
    }
  }

  // 检查 index.html 中的引用是否与实际文件匹配
  try {
    const indexHtml = readFileSync(join(DIST, 'index.html'), 'utf-8')
    const jsRefs = [...indexHtml.matchAll(/src="\/assets\/([^"]+\.js)"/g)].map(m => m[1])
    const cssRefs = [...indexHtml.matchAll(/href="\/assets\/([^"]+\.css)"/g)].map(m => m[1])

    if (jsRefs.length === 0) {
      warn('index.html 中未找到 JS 文件引用')
    } else {
      for (const ref of jsRefs) {
        if (existsSync(join(DIST, 'assets', ref))) {
          ok(`JS 引用有效: ${ref}`)
        } else {
          failMsg(`JS 引用断裂! index.html 引用 /assets/${ref} 但该文件不存在`)
        }
      }
    }

    for (const ref of cssRefs) {
      if (existsSync(join(DIST, 'assets', ref))) {
        ok(`CSS 引用有效: ${ref}`)
      } else {
        failMsg(`CSS 引用断裂! index.html 引用 /assets/${ref} 但该文件不存在`)
      }
    }
  } catch (e) {
    warn(`index.html 引用检查跳过: ${e.message}`)
  }
}

// ==================== 检查 3: data JSON 格式 ====================
section('3. 数据文件格式检查')

const dataDir = join(DIST, 'data')
if (!existsSync(dataDir)) {
  warn('dist/data/ 不存在（可能不需要数据文件）')
} else {
  const jsonFiles = readdirSync(dataDir).filter(f => f.endsWith('.json'))
  for (const f of jsonFiles) {
    try {
      const content = readFileSync(join(dataDir, f), 'utf-8')
      JSON.parse(content)
      ok(`${f} JSON 格式正确`)
    } catch (e) {
      failMsg(`${f} JSON 解析失败: ${e.message}`)
    }
  }
}

// ==================== 检查 4: 常见代码陷阱扫描 ====================
section('4. 代码陷阱快速扫描')

try {
  // 扫描是否有未 catch 的潜在 undefined 组件引用
  const tabBarContent = readFileSync(join(ROOT, 'src/shared/components/TabBar.tsx'), 'utf-8')
  if (tabBarContent.includes('const Icon = iconMap[') && !tabBarContent.includes('if (!Icon)')) {
    warn('TabBar 使用了 iconMap 但缺少 null guard（建议迁移到 getIcon()）')
  } else if (tabBarContent.includes('getIcon') || tabBarContent.includes('if (!Icon)')) {
    ok('TabBar 已使用安全的图标获取方式')
  }

  // 检查是否还有旧的 iconMap 写法（应该已迁移到 icon-registry）
  if (tabBarContent.includes('const iconMap: Record<string,')) {
    warn('TabBar 仍使用旧版 iconMap（不影响运行，但建议统一到 icon-registry）')
  }
} catch (e) {
  // 跳过
}

// ==================== 检查 5: 错误监控系统 ====================
section('5. 错误监控系统检查')

try {
  const mainContent = readFileSync(join(ROOT, 'src/main.tsx'), 'utf-8')
  if (mainContent.includes('initGlobalErrorListeners')) {
    ok('main.tsx 已初始化全局错误监听')
  } else {
    failMsg('main.tsx 缺少全局错误监听初始化！')
  }

  const appRouterContent = readFileSync(join(ROOT, 'src/router/index.tsx'), 'utf-8')
  if (appRouterContent.includes('ErrorBoundary')) {
    ok('路由已使用 ErrorBoundary 包裹')
  } else {
    failMsg('路由缺少 ErrorBoundary 保护！')
  }

  const errorReporterExists = existsSync(join(ROOT, 'src/shared/utils/error-reporter.ts'))
  if (errorReporterExists) {
    ok('错误上报模块存在')
  } else {
    failMsg('缺少错误上报模块 src/shared/utils/error-reporter.ts')
  }
} catch (e) {
  warn(`错误监控系统检查异常: ${e.message}`)
}

// ==================== 结果汇总 ====================
console.log('\n' + '='.repeat(45))
console.log(`  总计: ${pass + fail + warnCount} 项 | ${GREEN}✅ 通过: ${pass}${RESET} | ${RED}❌ 失败: ${fail}${RESET} | ${YELLOW}⚠️ 警告: ${warnCount}${RESET}`)
console.log('='.repeat(45))

if (fail > 0) {
  console.log(`\n  ${RED}🚫 预检未通过！请修复上述错误后再部署${RESET}\n`)
  process.exit(1)
} else if (warnCount > 0) {
  console.log(`\n  ${YELLOW}⚠️ 有警告项，但不阻塞部署${RESET}\n`)
  process.exit(0)
} else {
  console.log(`\n  ${GREEN}🎉 预检全部通过，可以安全部署！${RESET}\n`)
  process.exit(0)
}
