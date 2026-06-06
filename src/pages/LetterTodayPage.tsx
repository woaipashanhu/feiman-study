/**
 * ============================================================
 *  LetterTodayPage — 今日拆信页  /letters/today
 *
 *  流程:
 *    进入 → 看信封(SealedEnvelope 状态)
 *       ↓ 点"拆开"
 *    撕开动画 → LetterPaper 完整呈现(思源宋体大字号)
 *       ↓ 点"收藏到时空纸条" / "换一句"
 *    写入 useLetters + 跳回 LettersPage
 *
 *  数据源: getDailyQuote() — 每日自动换
 * ============================================================
 */
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Heart, Sparkle, ArrowsClockwise, CheckCircle } from 'phosphor-react'
import { getDailyQuote, getRandomQuote } from '@/shared/utils/dailyQuotes'
import { useLetters } from '@/shared/hooks/useLetters'
import { LetterPaper } from '@/shared/components/LetterPaper'
import { LETTER_PALETTE } from '@/shared/components/LetterPaper/palette'
import type { DailyQuote } from '@/shared/utils/dailyQuotes'

type Stage = 'sealed' | 'opening' | 'opened'

export default function LetterTodayPage() {
  const navigate = useNavigate()
  const { addQuote, getByKind } = useLetters()
  const [quote, setQuote] = useState<DailyQuote>(() => getDailyQuote())
  const [stage, setStage] = useState<Stage>('sealed')

  // 当前 quote 是否已被收藏
  const allQuotes = getByKind('quote')
  const alreadyStarred = allQuotes.some(
    (l) => l.content === quote.text && l.author === quote.author
  )
  const [justStarred, setJustStarred] = useState(false)

  // 进入页面:0.6s 后自动开始拆信动画(用户也可以直接点"拆开")
  useEffect(() => {
    const t = setTimeout(() => {
      setStage((s) => (s === 'sealed' ? 'opening' : s))
    }, 600)
    return () => clearTimeout(t)
  }, [])

  // 拆开动画 0.6s 后切到 opened
  useEffect(() => {
    if (stage === 'opening') {
      const t = setTimeout(() => setStage('opened'), 700)
      return () => clearTimeout(t)
    }
  }, [stage])

  const handleOpen = () => {
    if (stage === 'sealed') setStage('opening')
  }

  const handleStar = () => {
    if (alreadyStarred || justStarred) return
    addQuote({
      content: quote.text,
      author: quote.author,
      dynasty: quote.dynasty,
      bgKey: quote.bgKey ?? 'ivory',
    })
    setJustStarred(true)
    setTimeout(() => setJustStarred(false), 2200)
  }

  const handleShuffle = () => {
    setQuote(getRandomQuote())
    setStage('opened')
  }

  return (
    <div
      className="h-full flex flex-col overflow-hidden"
      style={{ backgroundColor: LETTER_PALETTE.ivory }}
    >
      {/* 顶部栏 */}
      <header className="flex items-center gap-3 px-4 pt-4 pb-2 shrink-0">
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
          <h1
            className="font-semibold text-text text-base"
            style={{ fontFamily: '"Noto Serif SC","Songti SC",serif' }}
          >
            今日纸条
          </h1>
          <p className="text-[10px] text-text-tertiary mt-0.5">
            {new Date().toLocaleDateString('zh-CN', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              weekday: 'long',
            })}
          </p>
        </div>
      </header>

      {/* 主体 */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-32">
        <AnimatePresence mode="wait">
          {stage !== 'opened' ? (
            <SealedEnvelope
              key="envelope"
              stage={stage}
              onClick={handleOpen}
              quote={quote}
            />
          ) : (
            <motion.div
              key="letter"
              initial={{ opacity: 0, y: 24, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: 'spring', stiffness: 280, damping: 28 }}
              className="w-full"
            >
              <LetterPaper
                letter={{
                  content: quote.text,
                  author: quote.author,
                  dynasty: quote.dynasty,
                  bgKey: quote.bgKey ?? 'ivory',
                  createdAt: Date.now(),
                }}
                variant="quote"
                showStamp
                stampText="今日"
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 底部操作区 */}
      <div
        className="px-4 pb-6 pt-3 shrink-0"
        style={{ paddingBottom: 'calc(24px + env(safe-area-inset-bottom, 0px))' }}
      >
        <AnimatePresence mode="wait">
          {stage === 'opened' ? (
            <motion.div
              key="actions-opened"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex gap-3"
            >
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleShuffle}
                className="flex-1 flex items-center justify-center gap-1.5 py-3.5 rounded-2xl text-sm font-medium"
                style={{ backgroundColor: 'rgba(26,29,43,0.06)', color: '#1A1D2B' }}
              >
                <ArrowsClockwise size={16} weight="bold" />
                换一句
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleStar}
                disabled={alreadyStarred || justStarred}
                className="flex-1 flex items-center justify-center gap-1.5 py-3.5 rounded-2xl text-sm font-semibold text-white transition-colors"
                style={{
                  backgroundColor:
                    alreadyStarred || justStarred ? LETTER_PALETTE.gold : LETTER_PALETTE.vermilion,
                }}
              >
                {alreadyStarred || justStarred ? (
                  <>
                    <CheckCircle size={16} weight="fill" />
                    已收藏
                  </>
                ) : (
                  <>
                    <Heart size={16} weight="fill" />
                    收藏到时空纸条
                  </>
                )}
              </motion.button>
            </motion.div>
          ) : stage === 'sealed' ? (
            <motion.div
              key="actions-sealed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center"
            >
              <p className="text-xs text-text-tertiary">点信封拆开 ↓</p>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  )
}

/** 信封组件 */
function SealedEnvelope({
  stage,
  onClick,
  quote,
}: {
  stage: Stage
  onClick: () => void
  quote: DailyQuote
}) {
  return (
    <motion.div
      key={stage}
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{
        opacity: 1,
        scale: stage === 'opening' ? 1.04 : 1,
        rotateX: stage === 'opening' ? 8 : 0,
      }}
      exit={{ opacity: 0, scale: 0.9, y: -30 }}
      transition={{ type: 'spring', stiffness: 240, damping: 22 }}
      onClick={onClick}
      className="cursor-pointer"
      style={{ perspective: 1000 }}
    >
      {/* 信封主体 */}
      <div
        className="relative w-[280px] h-[180px] rounded-2xl shadow-2xl"
        style={{
          background: 'linear-gradient(135deg, #FAF7F2 0%, #F0E8D8 100%)',
          border: '1px solid rgba(184, 136, 64, 0.18)',
        }}
      >
        {/* 上封口 V 形 */}
        <div
          className="absolute inset-x-0 top-0 h-[60%]"
          style={{
            background: 'linear-gradient(180deg, #E8DCC0 0%, transparent 100%)',
            clipPath: 'polygon(0 0, 50% 65%, 100% 0)',
            transform: stage === 'opening' ? 'rotateX(180deg)' : 'rotateX(0deg)',
            transformOrigin: 'top center',
            transition: 'transform 0.6s cubic-bezier(0.22, 1, 0.36, 1)',
          }}
        />
        {/* 烫金边 */}
        <div
          className="absolute inset-2 rounded-xl pointer-events-none"
          style={{ border: '0.5px solid rgba(184, 136, 64, 0.35)' }}
        />
        {/* 中央预览(前几个字) */}
        <div className="absolute inset-0 flex items-center justify-center px-6">
          <p
            className="text-center text-text/80"
            style={{
              fontFamily: '"Noto Serif SC","Songti SC",serif',
              fontSize: 14,
              lineHeight: 1.7,
              letterSpacing: '0.06em',
            }}
          >
            「{quote.text.slice(0, 18)}{quote.text.length > 18 ? '…」' : '」'}
          </p>
        </div>
        {/* 右下角小印章 */}
        <div className="absolute right-3 bottom-3">
          <Sparkle size={18} weight="fill" style={{ color: LETTER_PALETTE.gold, opacity: 0.7 }} />
        </div>
      </div>
      {/* 阴影 */}
      <div className="text-center mt-6 text-xs text-text-tertiary">
        {stage === 'sealed' ? '点击拆开' : '正在拆开…'}
      </div>
    </motion.div>
  )
}
