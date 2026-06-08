/**
 * ============================================================
 *  个人中心页面（全屏）
 *
 *  从消息中心入口进入，展示个人学习数据、每日名言、心情等
 *  顶部用返回按钮，不用关闭按钮
 * ============================================================
 */
import React, { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  CaretRight,
  Quotes, PencilSimpleLine, EnvelopeOpen,
  Lightning, Sun, Moon
} from 'phosphor-react'

import { useAuth } from '@/shared/hooks/useAuth'
import { useFavorites } from '@/shared/hooks/useFavorites'
import { VideoPreview } from '@/shared/components/VideoPreview'

export default function ProfilePage() {
  const navigate = useNavigate()
  const { getRecentFavorites } = useFavorites()

  

  const recentFavorites = getRecentFavorites(6)

  return (
    <div className="h-full flex flex-col bg-bg overflow-hidden">
      {/* 内容区 */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {/* 账号卡 — 未登录显示"去登录",已登录显示昵称 + 登出 */}
        <AuthCard />

        {/* 收藏内容 — 横向跑马灯单行滚动 */}
        <section
          onClick={() => navigate('/favorites')}
          className="rounded-[20px] overflow-hidden shadow-lg ring-1 ring-black/5 cursor-pointer active:scale-[0.98] transition-transform relative"
          style={{ height: '180px' }}
        >
          {/* 渐变背景 */}
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(160deg, #EF444430 0%, #0f172a 70%)`,
            }}
          />
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 rounded-full blur-3xl opacity-15"
            style={{ backgroundColor: '#EF4444' }}
          />

          {/* 左上角标题 */}
          <div className="absolute top-2.5 left-3 z-20">
            <h2 className="text-[14px] font-bold text-white leading-tight">
              收藏内容
            </h2>
          </div>

          {/* 右上角箭头 */}
          <div className="absolute top-2.5 right-3 z-20">
            <CaretRight size={16} className="text-white/60" />
          </div>

          {/* 跑马灯滚动区 */}
          {recentFavorites.length > 0 && (
            <div className="absolute inset-x-0 bottom-0 h-[150px] z-10 overflow-hidden">
              <div className="marquee-track flex items-center gap-3 h-full animate-marquee-left" style={{ animationDuration: '20s' }}>
                {[...recentFavorites, ...recentFavorites].map((item: any, idx: number) => (
                  <div
                    key={`${item.id}-${idx}`}
                    className="relative w-[130px] h-[130px] rounded-2xl overflow-hidden bg-gray-900/50 shadow-md shrink-0"
                  >
                    {item.videoUrl && item.videoUrl.endsWith('.html') ? (
                      <iframe
                        src={item.videoUrl}
                        className="w-full h-full border-0"
                        style={{
                          transform: 'scale(0.4)',
                          transformOrigin: 'top left',
                          width: '250%',
                          height: '250%',
                          pointerEvents: 'none',
                        }}
                        loading="lazy"
                        title={item.title}
                      />
                    ) : item.videoUrl ? (
                      <VideoPreview
                        src={item.videoUrl}
                        poster={item.cover}
                        fallbackColor="#EF4444"
                        rounded={16}
                        className="w-full h-full"
                        fallback={
                          <span className="text-base font-bold text-red-400">{idx + 1}</span>
                        }
                      />
                    ) : item.cover ? (
                      <img
                        src={item.cover.startsWith('data:') || item.cover.startsWith('/') || item.cover.startsWith('http') ? item.cover : '/' + item.cover}
                        alt={item.title}
                        className="w-full h-full object-contain"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-red-500/20">
                        <span className="text-2xl">❤️</span>
                      </div>
                    )}
                    <div className="absolute top-1 left-1 w-5 h-5 rounded-md bg-black/40 backdrop-blur-sm flex items-center justify-center">
                      <span className="text-[10px] font-bold text-white">{(idx % recentFavorites.length) + 1}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="absolute inset-x-0 top-0 h-6 bg-gradient-to-b from-black/20 to-transparent pointer-events-none z-20" />
        </section>

        {/* 小纸条 — 三入口卡片 */}
        <section className="rounded-[20px] overflow-hidden shadow-lg ring-1 ring-black/5 bg-surface">
          {/* 标题区 */}
          <div className="px-5 pt-5 pb-2">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold tracking-[0.18em] px-2 py-0.5 rounded"
                style={{ backgroundColor: '#C83820', color: '#FAF7F2' }}>
                小纸条
              </span>
            </div>
            <h2 className="text-[20px] font-bold text-text leading-tight">
              写一封信,收一句名言
            </h2>
            <p className="text-[12px] text-text-secondary mt-1">
              每日一句,纸短情长
            </p>
          </div>

          {/* 三个入口 */}
          <div className="px-5 pb-5 space-y-2">
            {/* 每日名言 */}
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/letters/today')}
              className="w-full flex items-center gap-2 p-3.5 rounded-2xl text-left transition-colors hover:bg-black/[0.03] active:bg-black/[0.06]"
            >
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                <Quotes size={20} weight="fill" className="text-amber-500" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-[15px] font-semibold text-text">每日名言</h4>
                <p className="text-[11px] text-text-secondary mt-0.5">拆一封今天的信,收藏一句名言</p>
              </div>
              <CaretRight size={16} className="text-text-tertiary shrink-0" />
            </motion.button>

            {/* 写一封信 */}
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/letters/compose')}
              className="w-full flex items-center gap-2 p-3.5 rounded-2xl text-left transition-colors hover:bg-black/[0.03] active:bg-black/[0.06]"
            >
              <div className="w-10 h-10 rounded-xl bg-sky-50 flex items-center justify-center shrink-0">
                <PencilSimpleLine size={20} weight="fill" className="text-sky-500" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-[15px] font-semibold text-text">写一封信</h4>
                <p className="text-[11px] text-text-secondary mt-0.5">语音或文字输入,AI 帮你转成古文</p>
              </div>
              <CaretRight size={16} className="text-text-tertiary shrink-0" />
            </motion.button>

            {/* 收到的信 */}
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/letters')}
              className="w-full flex items-center gap-2 p-3.5 rounded-2xl text-left transition-colors hover:bg-black/[0.03] active:bg-black/[0.06]"
            >
              <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center shrink-0">
                <EnvelopeOpen size={20} weight="fill" className="text-rose-500" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-[15px] font-semibold text-text">收到的信</h4>
                <p className="text-[11px] text-text-secondary mt-0.5">时空纸条、收到的信、写过的信</p>
              </div>
              <CaretRight size={16} className="text-text-tertiary shrink-0" />
            </motion.button>
          </div>
        </section>

        {/* 啊哈时刻入口 */}
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate('/aha')}
          className="w-full rounded-[20px] overflow-hidden shadow-lg ring-1 ring-black/5 text-left"
          style={{
            background: 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 50%, #FCD34D 100%)',
          }}
        >
          <div className="p-5 flex items-center gap-2">
            <div className="w-12 h-12 rounded-2xl bg-amber-400/30 flex items-center justify-center shrink-0">
              <Lightning size={24} weight="fill" className="text-amber-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-base font-semibold text-amber-900">啊哈时刻</h3>
              <p className="text-[12px] text-amber-700/80 mt-0.5">
                记录灵感、录音、写写画画
              </p>
            </div>
            <CaretRight size={18} className="text-amber-500 shrink-0" />
          </div>
        </motion.button>

        {/* 主题切换 */}
        <ThemeToggle />

        {/* 底部留白 */}
        <div className="h-6" />
      </div>
    </div>
  )
}

// ==================== 子组件 ====================

/** 主题切换 */
function ThemeToggle() {
  const [isDark, setIsDark] = React.useState(
    typeof document !== 'undefined' && document.documentElement.classList.contains('dark')
  )

  const toggleDark = () => {
    const html = document.documentElement
    const next = !isDark
    html.classList.toggle('dark', next)
    setIsDark(next)
    try { localStorage.setItem('theme', next ? 'dark' : 'light') } catch {}
  }

  return (
    <section className="bg-surface rounded-xl p-4 border border-border shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider flex items-center gap-1.5">
          {isDark ? <Moon size={14} weight="bold" /> : <Sun size={14} weight="bold" />}
          主题模式
        </h3>
        <button
          onClick={toggleDark}
          className={`relative w-12 h-6 rounded-full transition-colors ${
            isDark ? 'bg-brand' : 'bg-border'
          }`}
        >
          <span
            className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
              isDark ? 'left-0.5 translate-x-6' : 'left-0.5'
            }`}
          />
        </button>
      </div>
    </section>
  )
}
// ==================== 子组件 ====================

/** 账号卡 — 未登录显示"去登录",已登录显示昵称 + 头像 + 登出 */
function AuthCard() {
  const navigate = useNavigate()
  const { user, isAuthenticated, logout, uploadAvatar, deleteAvatar } = useAuth()
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [uploading, setUploading] = useState(false)

  if (!isAuthenticated || !user) {
    return (
      <section
        onClick={() => navigate('/auth')}
        className="relative p-4 overflow-hidden cursor-pointer active:scale-[0.98] transition-transform bg-surface border-b border-border"
      >
        <div className="flex items-center gap-2">
          <div className="w-11 h-11 rounded-full bg-brand flex items-center justify-center text-white text-base font-bold shadow-md shrink-0">
            🦊
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold text-text">登录 / 注册</h3>
            <p className="text-[12px] text-text-secondary mt-0.5">
              登录后,你写的信会留在这里
            </p>
          </div>
          <CaretRight size={16} className="text-text-tertiary shrink-0" />
        </div>
      </section>
    )
  }

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    await uploadAvatar(file)
    setUploading(false)
    e.target.value = ''  // 清掉,允许重复选同一文件
  }

  return (
    <section
      className="relative p-4 overflow-hidden"
      style={{ backgroundColor: '#FAF7F2' }}
    >
      <div className="flex items-center gap-2">
        {/* 头像 — 点击换头像 */}
        <button
          onClick={() => fileInputRef.current?.click()}
          className="relative w-12 h-12 rounded-2xl overflow-hidden flex items-center justify-center shrink-0 shadow-sm group"
          style={{ backgroundColor: '#C83820' }}
          aria-label="上传头像"
        >
          {user.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt="avatar"
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-white text-lg font-bold">
              🦊
            </span>
          )}
          {/* hover 提示 */}
          <div
            className="absolute inset-0 flex items-center justify-center text-[9px] font-medium text-white opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          >
            {uploading ? '上传中' : '换头像'}
          </div>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={handleFile}
          className="hidden"
        />
        <div className="flex-1 min-w-0">
          <h3
            className="text-base font-semibold text-text truncate"
            style={{ fontFamily: '"Noto Serif SC","Songti SC",serif' }}
          >
            {user.nickname}
          </h3>
          <p className="text-[12px] text-text-tertiary truncate">{user.email}</p>
        </div>
        <div className="flex items-center gap-1">
          {user.avatarUrl && (
            <button
              onClick={() => deleteAvatar()}
              className="text-[11px] text-text-tertiary px-2 py-1 rounded-lg hover:bg-black/5"
              title="删除头像"
            >
              移除
            </button>
          )}
          <button
            onClick={() => {
              if (confirm('确定登出?')) logout()
            }}
            className="text-[12px] text-text-tertiary px-2.5 py-1.5 rounded-lg hover:bg-black/5"
          >
            登出
          </button>
        </div>
      </div>
    </section>
  )
}
