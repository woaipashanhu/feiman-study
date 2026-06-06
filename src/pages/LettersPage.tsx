/**
 * ============================================================
 *  LettersPage — 小纸条主页  /letters
 *
 *  3 Tab Segmented Control:
 *    1. 时空纸条    — 收藏的名言 (kind=quote)
 *    2. 收到的纸条  — 私人信(系统欢迎信 + V2 跨用户分享)
 *    3. 写过的纸条  — 写信历史
 *
 *  顶部:返回 + 标题"小纸条" + 副标题
 *  右上角:今日纸条入口(信封图标 → /letters/today)
 *  内容:LetterPaper 列表
 *  底部:悬浮 FAB "写一张纸条" → /letters/compose
 *
 *  视觉:苹果风 + 暖米色基底,与个人中心/收藏形成层次
 * ============================================================
 */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
// useNavigate is also used in EmptyFor below
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion'
import { ArrowLeft, EnvelopeSimple, Plus, Quotes, EnvelopeOpen, PencilSimpleLine } from 'phosphor-react'
import { useLetters } from '@/shared/hooks/useLetters'
import { LetterPaper } from '@/shared/components/LetterPaper'
import { LETTER_KIND_LABEL, type LetterKind } from '@/types/letters'
import { EmptyState } from '@/shared/components/EmptyState'

type Tab = LetterKind

const TABS: { key: Tab; label: string; icon: typeof Quotes }[] = [
  { key: 'quote', label: '时空纸条', icon: Quotes },
  { key: 'personal', label: '收到的纸条', icon: EnvelopeOpen },
  { key: 'compose', label: '写过的纸条', icon: PencilSimpleLine },
]

export default function LettersPage() {
  const navigate = useNavigate()
  const { getByKind, countByKind } = useLetters()
  const [active, setActive] = useState<Tab>('quote')
  const counts = countByKind()
  const items = getByKind(active)

  return (
    <div className="h-full flex flex-col overflow-hidden" style={{ backgroundColor: '#FAF7F2' }}>
      {/* 顶部栏 */}
      <header className="flex items-center gap-3 px-4 pt-4 pb-3 shrink-0">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full bg-white/80 border border-black/5 flex items-center justify-center shadow-sm"
          aria-label="返回"
        >
          <ArrowLeft size={18} weight="regular" className="text-text" />
        </motion.button>
        <div className="flex-1 min-w-0">
          <h1 className="font-semibold text-text text-base flex items-center gap-1.5">
            <span style={{ fontFamily: '"Noto Serif SC","Songti SC",serif' }}>小纸条</span>
          </h1>
          <p className="text-[10px] text-text-tertiary mt-0.5">写一封信,收一句名言</p>
        </div>
        {/* 今日纸条入口 */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/letters/today')}
          className="w-10 h-10 rounded-full flex items-center justify-center shadow-sm"
          style={{ backgroundColor: '#C83820' }}
          aria-label="今日纸条"
        >
          <EnvelopeSimple size={18} weight="fill" className="text-white" />
        </motion.button>
      </header>

      {/* Segmented Control — iOS 风格 */}
      <div className="px-4 pb-3 shrink-0">
        <LayoutGroup>
          <div
            className="relative flex p-1 rounded-2xl"
            style={{ backgroundColor: 'rgba(0,0,0,0.05)' }}
          >
            {TABS.map((t) => {
              const isActive = t.key === active
              const Icon = t.icon
              return (
                <button
                  key={t.key}
                  onClick={() => setActive(t.key)}
                  className="relative flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[13px] font-medium z-10 transition-colors"
                  style={{ color: isActive ? '#1A1D2B' : 'rgba(26,29,43,0.55)' }}
                >
                  {isActive && (
                    <motion.div
                      layoutId="letters-seg"
                      className="absolute inset-0 rounded-xl bg-white shadow-sm"
                      style={{ zIndex: -1 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    />
                  )}
                  <Icon size={14} weight={isActive ? 'fill' : 'regular'} />
                  <span>{t.label}</span>
                  <span
                    className="text-[10px] tabular-nums"
                    style={{ color: isActive ? '#9AA0B8' : 'rgba(154,160,184,0.6)' }}
                  >
                    {counts[t.key]}
                  </span>
                </button>
              )
            })}
          </div>
        </LayoutGroup>
      </div>

      {/* 列表区 */}
      <div className="flex-1 overflow-y-auto px-4 pb-32">
        <AnimatePresence mode="wait">
          {items.length === 0 ? (
            <motion.div
              key={`empty-${active}`}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              <EmptyFor kind={active} />
            </motion.div>
          ) : (
            <motion.div
              key={`list-${active}`}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="space-y-4 pt-2"
            >
              {items.map((l) => (
                <LetterPaper
                  key={l.id}
                  letter={l}
                  variant={l.kind === 'quote' ? 'quote' : l.kind === 'personal' ? 'personal' : 'compose'}
                  onClick={() => navigate(`/letters/letter/${l.id}`)}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* FAB 写一张纸条 — 仅在 quote/personal tab 显示(写过的 tab 自己满屏) */}
      {active !== 'compose' && (
        <motion.button
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 300, damping: 24 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/letters/compose')}
          className="fixed right-5 z-30 flex items-center gap-2 px-5 py-3.5 rounded-full shadow-2xl"
          style={{
            backgroundColor: '#1A1D2B',
            color: '#FAF7F2',
            bottom: 'calc(24px + env(safe-area-inset-bottom, 0px))',
          }}
        >
          <Plus size={18} weight="bold" />
          <span className="text-sm font-semibold tracking-wide">写一张纸条</span>
        </motion.button>
      )}
    </div>
  )
}

/** 空状态 */
function EmptyFor({ kind }: { kind: Tab }) {
  const cfg = (() => {
    if (kind === 'quote') {
      return {
        title: '还没有收藏名言',
        desc: '点右上角信封,看看今天的「今日纸条」',
        cta: '去拆今日纸条',
        path: '/letters/today',
      }
    }
    if (kind === 'personal') {
      return {
        title: LETTER_KIND_LABEL.personal + '空空如也',
        desc: '系统欢迎信已为你准备,就在收件箱里',
        cta: '看看欢迎信',
        path: '/letters/today',
      }
    }
    return {
      title: '还没有写过纸条',
      desc: '写下第一张纸条,送给未来的自己',
      cta: '写一张纸条',
      path: '/letters/compose',
    }
  })()
  return (
    <div className="pt-12">
      <EmptyState
        title={cfg.title}
        description={cfg.desc}
        showAction
        actionText={cfg.cta}
        actionPath={cfg.path}
      />
    </div>
  )
}
