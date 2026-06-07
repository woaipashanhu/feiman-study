/**
 * ============================================================
 *  AuthPage — 登录/注册  /auth
 *
 *  V3.8 加手机号验证码登录:
 *    - 顶部 Segmented: 邮箱登录 / 手机号登录
 *    - 邮箱模式: 邮箱 + 密码(原 V3 逻辑)
 *    - 手机号模式: 手机号 + 验证码(60s 后重发)
 *
 *  表单:
 *    邮箱登录:  email + password
 *    邮箱注册:  email + password + nickname
 *    手机号:    phone + code(自动注册/登录)
 *
 *  成功后跳 -1(回到上一页面,通常是 /profile)
 *
 *  视觉: 苹果风 + 思源宋体大标题(跟小纸条一致)
 * ============================================================
 */
import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, LayoutGroup } from 'framer-motion'
import { ArrowLeft, EnvelopeSimple, Lock, User, CheckCircle, Phone, ShieldCheck } from 'phosphor-react'
import { useAuth } from '@/shared/hooks/useAuth'
import { LETTER_PALETTE } from '@/shared/components/LetterPaper/palette'

type Channel = 'email' | 'phone'
type EmailMode = 'login' | 'register'

export default function AuthPage() {
  const navigate = useNavigate()
  const { login, register, loading, error } = useAuth()

  // 渠道: 邮箱 / 手机号
  const [channel, setChannel] = useState<Channel>('email')

  // 邮箱模式
  const [emailMode, setEmailMode] = useState<EmailMode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nickname, setNickname] = useState('')

  // 手机号模式
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [sendingCode, setSendingCode] = useState(false)
  const [codeCooldown, setCodeCooldown] = useState(0)
  const [phoneLoginLoading, setPhoneLoginLoading] = useState(false)
  const [phoneError, setPhoneError] = useState<string | null>(null)
  const [devCode, setDevCode] = useState<string | null>(null)
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const [justOK, setJustOK] = useState(false)

  // 倒计时 cleanup
  useEffect(() => {
    return () => {
      if (cooldownRef.current) clearInterval(cooldownRef.current)
    }
  }, [])

  const startCooldown = (sec: number) => {
    setCodeCooldown(sec)
    if (cooldownRef.current) clearInterval(cooldownRef.current)
    cooldownRef.current = setInterval(() => {
      setCodeCooldown((s) => {
        if (s <= 1) {
          if (cooldownRef.current) clearInterval(cooldownRef.current)
          return 0
        }
        return s - 1
      })
    }, 1000)
  }

  // =============== 邮箱登录/注册 ===============

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !password.trim()) return
    if (emailMode === 'register' && !nickname.trim()) return
    const ok =
      emailMode === 'login'
        ? await login(email.trim(), password)
        : await register(email.trim(), password, nickname.trim())
    if (ok) {
      setJustOK(true)
      setTimeout(() => navigate('/profile'), 600)
    }
  }

  // =============== 手机号验证码 ===============

  const sendCode = async () => {
    if (!/^1[3-9]\d{9}$/.test(phone)) {
      setPhoneError('手机号格式不正确')
      return
    }
    setSendingCode(true)
    setPhoneError(null)
    try {
      const res = await fetch('/api/auth/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, purpose: 'login' }),
      })
      const data = await res.json()
      if (!res.ok) {
        if (data.error === 'cooldown') {
          setPhoneError(`请 ${data.cooldownSec} 秒后再试`)
          startCooldown(data.cooldownSec || 60)
        } else {
          setPhoneError(data.message || '发送失败')
        }
        return
      }
      // mock 模式拿到 devCode
      if (data.devCode) {
        setDevCode(data.devCode)
        setCode(data.devCode)  // 自动填入
      }
      startCooldown(60)
    } catch (err: any) {
      setPhoneError('网络错误: ' + (err?.message || 'unknown'))
    } finally {
      setSendingCode(false)
    }
  }

  const handlePhoneLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!/^1[3-9]\d{9}$/.test(phone)) {
      setPhoneError('手机号格式不正确')
      return
    }
    if (!/^\d{5}$/.test(code)) {
      setPhoneError('验证码必须是 5 位数字')
      return
    }
    setPhoneLoginLoading(true)
    setPhoneError(null)
    try {
      const res = await fetch('/api/auth/phone-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, code }),
      })
      const data = await res.json()
      if (!res.ok) {
        setPhoneError(data.message || '登录失败')
        return
      }
      // 登录成功:刷新页面让 useAuth 拿到新 token
      setJustOK(true)
      setTimeout(() => window.location.href = '/profile', 600)
    } catch (err: any) {
      setPhoneError('网络错误: ' + (err?.message || 'unknown'))
    } finally {
      setPhoneLoginLoading(false)
    }
  }

  return (
    <div
      className="h-full flex flex-col"
      style={{ backgroundColor: LETTER_PALETTE.ivory }}
    >
      {/* 顶部栏 */}
      <header className="flex items-center gap-3 px-4 pt-4 pb-3 shrink-0">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full bg-white/80 border border-black/5 flex items-center justify-center shadow-sm"
        >
          <ArrowLeft size={18} weight="regular" className="text-text" />
        </motion.button>
        <h1
          className="font-semibold text-text text-base"
          style={{ fontFamily: '"Noto Serif SC","Songti SC",serif' }}
        >
          登录 / 注册
        </h1>
      </header>

      {/* 渠道 Segmented: 邮箱 / 手机号 */}
      <div className="px-4 pb-4">
        <LayoutGroup>
          <div
            className="relative flex p-1 rounded-2xl"
            style={{ backgroundColor: 'rgba(0,0,0,0.05)' }}
          >
            {(['email', 'phone'] as const).map((c) => {
              const active = c === channel
              return (
                <button
                  key={c}
                  onClick={() => setChannel(c)}
                  className="relative flex-1 py-2.5 text-[13px] font-medium z-10 transition-colors"
                  style={{ color: active ? '#1A1D2B' : 'rgba(26,29,43,0.55)' }}
                >
                  {active && (
                    <motion.div
                      layoutId="auth-channel-seg"
                      className="absolute inset-0 rounded-xl bg-white shadow-sm"
                      style={{ zIndex: -1 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    />
                  )}
                  {c === 'email' ? '邮箱' : '手机号'}
                </button>
              )
            })}
          </div>
        </LayoutGroup>
      </div>

      {channel === 'email' ? (
        // ============== 邮箱登录/注册 ==============
        <>
          {/* 二级 Segmented: 登录 / 注册 */}
          <div className="px-4 pb-3">
            <LayoutGroup>
              <div
                className="relative flex p-0.5 rounded-xl"
                style={{ backgroundColor: 'rgba(0,0,0,0.04)' }}
              >
                {(['login', 'register'] as const).map((m) => {
                  const active = m === emailMode
                  return (
                    <button
                      key={m}
                      onClick={() => setEmailMode(m)}
                      className="relative flex-1 py-1.5 text-[12px] font-medium z-10 transition-colors"
                      style={{ color: active ? '#1A1D2B' : 'rgba(26,29,43,0.5)' }}
                    >
                      {active && (
                        <motion.div
                          layoutId="auth-email-seg"
                          className="absolute inset-0 rounded-lg bg-white/80 shadow-sm"
                          style={{ zIndex: -1 }}
                          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        />
                      )}
                      {m === 'login' ? '登录' : '注册'}
                    </button>
                  )
                })}
              </div>
            </LayoutGroup>
          </div>

          <form onSubmit={handleEmailSubmit} className="flex-1 flex flex-col px-6 pt-2">
            <h2
              className="text-[28px] font-bold text-text leading-tight mb-1"
              style={{ fontFamily: '"Noto Serif SC","Songti SC",serif' }}
            >
              {emailMode === 'login' ? '欢迎回来' : '加入小纸条'}
            </h2>
            <p className="text-sm text-text-secondary mb-6">
              {emailMode === 'login' ? '登录后,你写的信会留在这里' : '一个邮箱 + 一个昵称,30 秒搞定'}
            </p>

            {emailMode === 'register' && (
              <Field
                icon={<User size={16} weight="regular" />}
                placeholder="昵称"
                value={nickname}
                onChange={setNickname}
                maxLength={20}
              />
            )}
            <Field
              icon={<EnvelopeSimple size={16} weight="regular" />}
              placeholder="邮箱"
              value={email}
              onChange={setEmail}
              type="email"
              autoComplete="email"
            />
            <Field
              icon={<Lock size={16} weight="regular" />}
              placeholder="密码(至少 6 位)"
              value={password}
              onChange={setPassword}
              type="password"
              autoComplete={emailMode === 'login' ? 'current-password' : 'new-password'}
            />

            {error && (
              <p className="text-[12px] text-red-500 mt-2 leading-relaxed">{error}</p>
            )}

            <motion.button
              type="submit"
              whileTap={{ scale: 0.96 }}
              disabled={
                loading ||
                !email.trim() ||
                !password.trim() ||
                (emailMode === 'register' && !nickname.trim())
              }
              className="mt-6 w-full py-3.5 rounded-2xl text-sm font-semibold text-white disabled:opacity-40 transition-colors flex items-center justify-center gap-1.5"
              style={{ backgroundColor: justOK ? '#10B981' : '#1A1D2B' }}
            >
              {justOK ? (
                <>
                  <CheckCircle size={16} weight="fill" />
                  {emailMode === 'login' ? '登录成功' : '注册成功'}
                </>
              ) : loading ? (
                '处理中…'
              ) : emailMode === 'login' ? (
                '登录'
              ) : (
                '注册并登录'
              )}
            </motion.button>

            <p className="text-[11px] text-text-tertiary text-center mt-4 leading-relaxed">
              登录即表示你同意
              <br />
              做一个温暖的小纸条用户 🤝
            </p>
          </form>
        </>
      ) : (
        // ============== 手机号验证码登录 ==============
        <form onSubmit={handlePhoneLogin} className="flex-1 flex flex-col px-6 pt-2">
          <h2
            className="text-[28px] font-bold text-text leading-tight mb-1"
            style={{ fontFamily: '"Noto Serif SC","Songti SC",serif' }}
          >
            手机号登录
          </h2>
          <p className="text-sm text-text-secondary mb-6">
            没注册过会自动创建账号,验证码 5 分钟内有效
          </p>

          <Field
            icon={<Phone size={16} weight="regular" />}
            placeholder="手机号"
            value={phone}
            onChange={setPhone}
            type="tel"
            maxLength={11}
            autoComplete="tel"
          />
          <div className="flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-white/80 border border-black/5 mb-3">
            <span className="text-text-tertiary">
              <ShieldCheck size={16} weight="regular" />
            </span>
            <input
              type="text"
              inputMode="numeric"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 5))}
              placeholder="5 位验证码"
              maxLength={5}
              className="flex-1 bg-transparent outline-none text-sm text-text placeholder:text-text-tertiary"
            />
            <motion.button
              type="button"
              whileTap={{ scale: 0.96 }}
              onClick={sendCode}
              disabled={sendingCode || codeCooldown > 0 || !/^1[3-9]\d{9}$/.test(phone)}
              className="px-3 py-1 rounded-lg text-[12px] font-medium bg-brand text-white disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {sendingCode
                ? '发送中…'
                : codeCooldown > 0
                ? `${codeCooldown}s`
                : '获取验证码'}
            </motion.button>
          </div>

          {devCode && (
            <p className="text-[11px] text-amber-600 mb-2">
              开发模式验证码: <span className="font-mono font-semibold">{devCode}</span>(后端 mock 短信)
            </p>
          )}

          {phoneError && (
            <p className="text-[12px] text-red-500 mt-2 leading-relaxed">{phoneError}</p>
          )}

          <motion.button
            type="submit"
            whileTap={{ scale: 0.96 }}
            disabled={
              phoneLoginLoading ||
              !/^1[3-9]\d{9}$/.test(phone) ||
              !/^\d{5}$/.test(code)
            }
            className="mt-6 w-full py-3.5 rounded-2xl text-sm font-semibold text-white disabled:opacity-40 transition-colors flex items-center justify-center gap-1.5"
            style={{ backgroundColor: justOK ? '#10B981' : '#1A1D2B' }}
          >
            {justOK ? (
              <>
                <CheckCircle size={16} weight="fill" />
                登录成功
              </>
            ) : phoneLoginLoading ? (
              '处理中…'
            ) : (
              '登录 / 注册'
            )}
          </motion.button>

          <p className="text-[11px] text-text-tertiary text-center mt-4 leading-relaxed">
            没收到短信?<br />
            请检查手机号是否正确,或稍后重试
          </p>
        </form>
      )}
    </div>
  )
}

function Field({
  icon,
  placeholder,
  value,
  onChange,
  type = 'text',
  maxLength,
  autoComplete,
}: {
  icon: React.ReactNode
  placeholder: string
  value: string
  onChange: (v: string) => void
  type?: string
  maxLength?: number
  autoComplete?: string
}) {
  return (
    <div
      className="flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-white/80 border border-black/5 mb-3"
    >
      <span className="text-text-tertiary">{icon}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        autoComplete={autoComplete}
        className="flex-1 bg-transparent outline-none text-sm text-text placeholder:text-text-tertiary"
      />
    </div>
  )
}
