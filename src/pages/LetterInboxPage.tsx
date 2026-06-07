/**
 * ============================================================
 *  LetterInboxPage — 分享落地页  /letters/inbox/:token
 *
 *  V1 接真后端: GET /api/letters/by-token/:token
 *    - 命中: 渲染 LetterPaper + "收藏到我的小纸条"按钮
 *    - 404 / 网络错: 友好错误提示
 *    - 加载中: skeleton
 *
 *  V2 计划:
 *    - token → 落到"收到的纸条"列表(需登录)
 *    - 写过的纸条关联到 refPersonalId
 * ============================================================
 */
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Heart, Eye, EnvelopeOpen, WarningCircle, ArrowsClockwise } from 'phosphor-react'
import { lettersApi, type ServerLetter } from '@/shared/hooks/useLettersServer'
import { LetterPaper } from '@/shared/components/LetterPaper'
import { useLetters } from '@/shared/hooks/useLetters'
import { LETTER_PALETTE } from '@/shared/components/LetterPaper/palette'

type LoadState =
  | { kind: 'loading' }
  | { kind: 'ok'; letter: ServerLetter }
  | { kind: 'not_found' }
  | { kind: 'error'; message: string }

export default function LetterInboxPage() {
  const navigate = useNavigate()
  const { token } = useParams<{ token: string }>()
  const { addPersonal } = useLetters()
  const [state, setState] = useState<LoadState>({ kind: 'loading' })
  const [starring, setStarring] = useState(false)
  const [starred, setStarred] = useState(false)

  useEffect(() => {
    if (!token) {
      setState({ kind: 'not_found' })
      return
    }
    let cancelled = false
    setState({ kind: 'loading' })
    lettersApi
      .getByToken(token)
      .then((letter) => {
        if (cancelled) return
        if (letter) {
          setState({ kind: 'ok', letter })
        } else {
          setState({ kind: 'not_found' })
        }
      })
      .catch((e) => {
        if (cancelled) return
        setState({ kind: 'error', message: String(e.message || e) })
      })
    return () => {
      cancelled = true
    }
  }, [token])

  const handleStar = async () => {
    if (state.kind !== 'ok' || starring || starred) return
    setStarring(true)
    try {
      // 1. 收藏到后端(全局计数)
      await lettersApi.collect(state.letter.id)
      // 2. 复制到本地的"收到的纸条"
      addPersonal({
        content: state.letter.content,
        author: state.letter.author ?? undefined,
        bgKey: (state.letter.bgKey as 'ivory' | 'midnight' | 'kraft') ?? 'ivory',
        translations: state.letter.translations ?? undefined,
        refPersonalId: state.letter.id,
      })
      setStarred(true)
    } catch (e) {
      // 静默降级:本地先收
      addPersonal({
        content: state.letter.content,
        author: state.letter.author ?? undefined,
        bgKey: (state.letter.bgKey as 'ivory' | 'midnight' | 'kraft') ?? 'ivory',
        translations: state.letter.translations ?? undefined,
        refPersonalId: state.letter.id,
      })
      setStarred(true)
    } finally {
      setStarring(false)
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
          收到的纸条
        </h1>
      </header>

      {/* 主区 */}
      <div className="flex-1 overflow-y-auto px-4 pb-32">
        {state.kind === 'loading' && <LoadingState />}
        {state.kind === 'not_found' && <NotFoundState onRetry={() => navigate(0)} />}
        {state.kind === 'error' && (
          <ErrorState
            message={state.message}
            onRetry={() => {
              setState({ kind: 'loading' })
              navigate(0)
            }}
          />
        )}
        {state.kind === 'ok' && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 280, damping: 28 }}
          >
            {/* 元信息条 */}
            <div className="flex items-center gap-3 text-[11px] text-text-tertiary mb-3 px-1">
              <span className="inline-flex items-center gap-1">
                <Eye size={12} weight="regular" />
                被看 {state.letter.viewCount} 次
              </span>
              <span className="inline-flex items-center gap-1">
                <Heart size={12} weight="regular" />
                被收藏 {state.letter.collectCount} 次
              </span>
            </div>
            <LetterPaper
              letter={{
                content: state.letter.content,
                author: state.letter.author ?? undefined,
                bgKey: (state.letter.bgKey as 'ivory' | 'midnight' | 'kraft') ?? 'ivory',
                createdAt: state.letter.createdAt,
                translations: state.letter.translations ?? undefined,
              }}
              variant="personal"
              showStamp
              stampText="传"
            />
          </motion.div>
        )}
      </div>

      {/* 底部操作 */}
      {state.kind === 'ok' && (
        <div
          className="fixed left-0 right-0 z-30 px-4 pt-3 pb-4"
          style={{
            paddingBottom: 'calc(16px + env(safe-area-inset-bottom, 0px))',
            bottom: 0,
            background: 'linear-gradient(to top, #FAF7F2 70%, transparent)',
          }}
        >
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={handleStar}
            disabled={starring || starred}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-semibold text-white disabled:opacity-60 transition-colors"
            style={{
              backgroundColor: starred ? LETTER_PALETTE.gold : LETTER_PALETTE.vermilion,
            }}
          >
            {starred ? (
              <>
                <Heart size={16} weight="fill" />
                已收藏到我的小纸条
              </>
            ) : starring ? (
              <>
                <ArrowsClockwise size={16} className="animate-spin" />
                收藏中…
              </>
            ) : (
              <>
                <Heart size={16} weight="fill" />
                收藏到我的小纸条
              </>
            )}
          </motion.button>
        </div>
      )}
    </div>
  )
}

// ============== 子组件 ==============

function LoadingState() {
  return (
    <div className="pt-12 flex flex-col items-center gap-3">
      <div className="shimmer-bg w-72 h-32 rounded-2xl" />
      <p className="text-xs text-text-tertiary">正在从云端取出这封信…</p>
    </div>
  )
}

function NotFoundState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="pt-12 flex flex-col items-center gap-3 px-6 text-center">
      <EnvelopeOpen size={40} weight="duotone" style={{ color: LETTER_PALETTE.vermilion, opacity: 0.5 }} />
      <h3 className="text-base font-semibold text-text mt-2">这封信不在了</h3>
      <p className="text-sm text-text-secondary max-w-xs leading-relaxed">
        分享链接可能失效、过期,或者被人撤回了。试试找写信的人再要一次。
      </p>
      <button
        onClick={onRetry}
        className="mt-2 text-sm text-brand underline"
      >
        刷新试试
      </button>
    </div>
  )
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="pt-12 flex flex-col items-center gap-3 px-6 text-center">
      <WarningCircle size={40} weight="duotone" style={{ color: '#EF4444', opacity: 0.7 }} />
      <h3 className="text-base font-semibold text-text mt-2">网络出错了</h3>
      <p className="text-[11px] text-text-tertiary max-w-xs break-all">{message}</p>
      <button
        onClick={onRetry}
        className="mt-2 px-4 py-2 rounded-xl bg-brand text-white text-sm font-medium"
      >
        重试
      </button>
    </div>
  )
}
