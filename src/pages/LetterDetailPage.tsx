/**
 * ============================================================
 *  LetterDetailPage — 单张纸条详情  /letters/letter/:id
 *
 *  - LetterPaper 全屏呈现
 *  - 下方:作者 / 朝代 / 引用源信息
 *  - 右上角:删除按钮(系统信不可删)
 *  - 长按/双击切换"展开翻译"模式
 * ============================================================
 */
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Trash, Star, StarFour } from 'phosphor-react'
import { useLetters } from '@/shared/hooks/useLetters'
import { LetterPaper } from '@/shared/components/LetterPaper'
import { LETTER_PALETTE } from '@/shared/components/LetterPaper/palette'
import { isSystemLetter } from '@/types/letters'

export default function LetterDetailPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const { getById, removeLetter, toggleStar } = useLetters()
  const letter = id ? getById(id) : null
  const [confirming, setConfirming] = useState(false)

  if (!letter) {
    return (
      <div
        className="h-full flex flex-col items-center justify-center"
        style={{ backgroundColor: LETTER_PALETTE.ivory }}
      >
        <p className="text-sm text-text-secondary">纸条不存在或已被删除</p>
        <button
          onClick={() => navigate(-1)}
          className="mt-4 text-sm text-brand underline"
        >
          返回
        </button>
      </div>
    )
  }

  const handleDelete = () => {
    if (isSystemLetter(letter)) return
    if (!confirming) {
      setConfirming(true)
      setTimeout(() => setConfirming(false), 3000)
      return
    }
    const ok = removeLetter(letter.id)
    if (ok) navigate(-1)
  }

  const variant =
    letter.kind === 'quote' ? 'quote' : letter.kind === 'personal' ? 'personal' : 'compose'

  return (
    <div
      className="h-full flex flex-col overflow-hidden"
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
        <div className="flex-1">
          <h1
            className="font-semibold text-text text-base"
            style={{ fontFamily: '"Noto Serif SC","Songti SC",serif' }}
          >
            {variant === 'quote'
              ? '时空纸条'
              : variant === 'personal'
                ? '收到的纸条'
                : '写过的纸条'}
          </h1>
          <p className="text-[10px] text-text-tertiary mt-0.5">
            {new Date(letter.createdAt).toLocaleString('zh-CN', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          {/* 收藏切换 */}
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={() => toggleStar(letter.id)}
            className="w-10 h-10 rounded-full bg-white/80 border border-black/5 flex items-center justify-center shadow-sm"
            aria-label="收藏"
          >
            {letter.isStarred ? (
              <Star size={18} weight="fill" style={{ color: LETTER_PALETTE.gold }} />
            ) : (
              <StarFour size={18} weight="regular" className="text-text" />
            )}
          </motion.button>
          {/* 删除(系统信隐藏) */}
          {!isSystemLetter(letter) && (
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={handleDelete}
              className="w-10 h-10 rounded-full flex items-center justify-center shadow-sm"
              style={{
                backgroundColor: confirming ? LETTER_PALETTE.vermilion : 'rgba(255,255,255,0.8)',
                border: confirming ? 'none' : '1px solid rgba(0,0,0,0.05)',
              }}
              aria-label="删除"
            >
              <Trash
                size={18}
                weight="regular"
                style={{ color: confirming ? '#fff' : '#5A6078' }}
              />
            </motion.button>
          )}
        </div>
      </header>

      {/* 信纸主体 */}
      <div className="flex-1 overflow-y-auto px-4 pb-8">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 280, damping: 28 }}
        >
          <LetterPaper letter={letter} variant={variant} showStamp />
        </motion.div>

        {/* 提示 — 系统信特别标记 */}
        {isSystemLetter(letter) && (
          <div className="mt-4 text-center text-[11px] text-text-tertiary">
            <span>系统信 · 不可删除</span>
          </div>
        )}

        {/* 提示 — 引用源 */}
        {letter.refQuoteId && (
          <div className="mt-4 text-center text-[11px] text-text-tertiary">
            <span>引用自时空纸条</span>
          </div>
        )}
        {letter.refPersonalId && (
          <div className="mt-4 text-center text-[11px] text-text-tertiary">
            <span>关联收到的纸条</span>
          </div>
        )}
      </div>

      {/* 二次确认气泡 */}
      {confirming && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed left-4 right-4 rounded-2xl shadow-2xl p-4 z-50"
          style={{
            backgroundColor: '#1A1D2B',
            color: '#FAF7F2',
            bottom: 'calc(24px + env(safe-area-inset-bottom, 0px))',
          }}
        >
          <p className="text-sm font-medium">再点一次删除按钮确认</p>
          <p className="text-[11px] opacity-60 mt-0.5">纸条会被永久删除</p>
        </motion.div>
      )}
    </div>
  )
}
