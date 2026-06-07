// e2e/_helpers.mjs — 共享工具
// 每个 .test.mjs 都可以用

import puppeteer from 'puppeteer'

/** 模拟手机号注册(走真实后端 API) */
export async function registerByPhone(API, page, phone) {
  // 1. 发验证码(mock SMS 会返 devCode)
  const sendRes = await page.evaluate(async (args) => {
    const r = await fetch('/api/auth/send-code', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(args),
    })
    return { status: r.status, body: await r.text() }
  }, { phone, purpose: 'login' })
  if (sendRes.status !== 200) {
    throw new Error(`send-code 失败: ${sendRes.status} ${sendRes.body}`)
  }
  const devCode = JSON.parse(sendRes.body).devCode
  if (!devCode) throw new Error('send-code 没返 devCode,可能不是 mock SMS provider')

  // 2. 登录
  const loginRes = await page.evaluate(async (args) => {
    const r = await fetch('/api/auth/phone-login', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(args),
    })
    return { status: r.status, body: await r.text() }
  }, { phone, code: devCode })
  if (loginRes.status !== 200) {
    throw new Error(`phone-login 失败: ${loginRes.status} ${loginRes.body}`)
  }
  const data = JSON.parse(loginRes.body)
  if (!data.accessToken) throw new Error('phone-login 没返 accessToken')

  // 3. 存 token 到 page 的 localStorage
  await page.evaluate((args) => {
    localStorage.setItem('feiman_auth_access', args.access)
    localStorage.setItem('feiman_auth_refresh', args.refresh)
  }, { access: data.accessToken, refresh: data.refreshToken })

  return { access: data.accessToken, refresh: data.refreshToken, devCode }
}

/** 在当前 page 注入 token(快速登录态) */
export async function injectToken(page, access, refresh) {
  await page.evaluateOnNewDocument((args) => {
    if (args.access) localStorage.setItem('feiman_auth_access', args.access)
    if (args.refresh) localStorage.setItem('feiman_auth_refresh', args.refresh)
  }, { access, refresh })
}

/** 用 fetch 走任意 API(携带当前 page 的 token) */
export async function apiFetch(page, path, init = {}) {
  return page.evaluate(async (args) => {
    const token = localStorage.getItem('feiman_auth_access') || ''
    const r = await fetch(args.path, {
      ...args.init,
      headers: { ...(args.init.headers || {}), Authorization: `Bearer ${token}` },
    })
    let body
    try { body = await r.json() } catch { body = await r.text() }
    return { status: r.status, body }
  }, { path, init })
}

/** 在 page 找按钮文本并点击(忽略 disabled) */
export async function clickByText(page, text, opts = {}) {
  return page.evaluate(({ text, selector }) => {
    const target = selector || 'button'
    const els = Array.from(document.querySelectorAll(target))
    const el = els.find(e => (e.textContent?.trim() || '') === text && !e.disabled)
    if (!el) return { ok: false, available: els.map(e => e.textContent?.trim()).filter(t => t) }
    el.click()
    return { ok: true }
  }, { text, selector: opts.selector })
}

/** 通用断言 */
export function assert(cond, msg) {
  if (!cond) throw new Error(msg || '断言失败')
}
