/**
 * Token 黑名单 E2E:
 *   1. 注册新用户 → 拿 accessToken
 *   2. /me 200(登出前)
 *   3. /api/auth/logout
 *   4. /me 401 token_revoked(登出后)
 *   5. 重新登录,新 token 有效
 */
const BASE = 'http://47.99.101.168:8890'

async function main() {
  const email = `bl_${Date.now()}@feiman.com`
  const password = 'bl123456'

  console.log('1. REGISTER')
  const regRes = await fetch(`${BASE}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, nickname: '黑名单测试' }),
  })
  const reg = await regRes.json()
  if (!reg.ok) {
    console.error('注册失败:', reg)
    process.exit(1)
  }
  console.log(`  ✓ 注册, token 长度 ${reg.accessToken.length}`)

  console.log('\n2. /me 登出前 (200 expected)')
  const me1 = await fetch(`${BASE}/api/auth/me`, {
    headers: { Authorization: `Bearer ${reg.accessToken}` },
  })
  console.log(`  status=${me1.status}`)

  console.log('\n3. POST /api/auth/logout')
  const logoutRes = await fetch(`${BASE}/api/auth/logout`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${reg.accessToken}` },
  })
  const logoutData = await logoutRes.json()
  console.log(`  status=${logoutRes.status} body=${JSON.stringify(logoutData)}`)

  console.log('\n4. /me 登出后 (401 token_revoked expected)')
  const me2 = await fetch(`${BASE}/api/auth/me`, {
    headers: { Authorization: `Bearer ${reg.accessToken}` },
  })
  const me2Data = await me2.json()
  console.log(`  status=${me2.status} body=${JSON.stringify(me2Data)}`)

  if (me2.status !== 401 || me2Data.error !== 'token_revoked') {
    console.log('  ❌ 期望 401 token_revoked, 实际', me2.status, me2Data.error)
    process.exit(1)
  }

  console.log('\n5. 重新登录, 新 token 200 expected')
  const loginRes = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  const loginData = await loginRes.json()
  if (!loginData.ok) {
    console.error('登录失败:', loginData)
    process.exit(1)
  }
  const me3 = await fetch(`${BASE}/api/auth/me`, {
    headers: { Authorization: `Bearer ${loginData.accessToken}` },
  })
  console.log(`  status=${me3.status}`)
  if (me3.status !== 200) {
    console.log('  ❌ 期望 200, 实际', me3.status)
    process.exit(1)
  }

  console.log('\n🎉 P2-3 token 黑名单 E2E 全过!')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
