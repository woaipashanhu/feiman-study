/**
 * ============================================================
 *  AuthPage — 登录/注册  /auth
 *
 *  一个页面,顶部 iOS Segmented Control 切换"登录 / 注册"
 *  表单:
 *    登录:  邮箱 + 密码
 *    注册:  邮箱 + 密码 + 昵称
 *  成功后跳 -1(回到上一页面,通常是 /profile)
 *
 *  视觉: 苹果风 + 思源宋体大标题(跟小纸条一致)
 * ============================================================
 */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, LayoutGroup } from 'framer-motion'
import { ArrowLeft, EnvelopeSimple, Lock, User, CheckCircle } from 'phosphor-react'
import { useAuth } from '@/shared/hooks/useAuth'
import { LETTER_PALETTE } from '@/shared/components/LetterPaper/palette'

type Mode = 'login' | 'register'

export default function AuthPage() {
  const navigate = useNavigate()
  const { login, register, loading, error } = useAuth()
  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nickname, setNickname] = useState('')
  const [justOK, setJustOK] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !password.trim()) return
    if (mode === 'register' && !nickname.trim()) return
    const ok =
      mode === 'login'
        ? await login(email.trim(), password)
        : await register(email.trim(), password, nickname.trim())
    if (ok) {
      setJustOK(true)
      // 跳到个人中心(V3:登录入口卡在 /profile)
      setTimeout(() => navigate('/profile'), 600)
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

      {/* Segmented Control */}
      <div className="px-4 pb-4">
        <LayoutGroup>
          <div
            className="relative flex p-1 rounded-2xl"
            style={{ backgroundColor: 'rgba(0,0,0,0.05)' }}
          >
            {(['login', 'register'] as const).map((m) => {
              const active = m === mode
              return (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className="relative flex-1 py-2.5 text-[13px] font-medium z-10 transition-colors"
                  style={{ color: active ? '#1A1D2B' : 'rgba(26,29,43,0.55)' }}
                >
                  {active && (
                    <motion.div
                      layoutId="auth-seg"
                      className="absolute inset-0 rounded-xl bg-white shadow-sm"
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

      {/* 表单 */}
      <form
        onSubmit={handleSubmit}
        className="flex-1 flex flex-col px-6 pt-2"
      >
        {/* 大标题 */}
        <h2
          className="text-[28px] font-bold text-text leading-tight mb-1"
          style={{ fontFamily: '"Noto Serif SC","Songti SC",serif' }}
        >
          {mode === 'login' ? '欢迎回来' : '加入小纸条'}
        </h2>
        <p className="text-sm text-text-secondary mb-6">
          {mode === 'login' ? '登录后,你写的信会留在这里' : '一个邮箱 + 一个昵称,30 秒搞定'}
        </p>

        {mode === 'register' && (
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
          autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
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
            (mode === 'register' && !nickname.trim())
          }
          className="mt-6 w-full py-3.5 rounded-2xl text-sm font-semibold text-white disabled:opacity-40 transition-colors flex items-center justify-center gap-1.5"
          style={{ backgroundColor: justOK ? '#10B981' : '#1A1D2B' }}
        >
          {justOK ? (
            <>
              <CheckCircle size={16} weight="fill" />
              {mode === 'login' ? '登录成功' : '注册成功'}
            </>
          ) : loading ? (
            '处理中…'
          ) : mode === 'login' ? (
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
