/**
 * ============================================================
 *  LetterInboxPage — 分享落地页  /letters/inbox/:token
 *
 *  V1 = 占位(返回"暂未启用分享"提示)
 *  V2 = 通过 token 解析分享信 → 展示 LetterPaper + "收藏到我的小纸条"按钮
 *  (V1 #8 分享落地页阶段实现)
 * ============================================================
 */
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, EnvelopeOpen } from 'phosphor-react'
import { LETTER_PALETTE } from '@/shared/components/LetterPaper/palette'

export default function LetterInboxPage() {
  const navigate = useNavigate()
  const { token } = useParams<{ token: string }>()
  return (
    <div
      className="h-full flex flex-col"
      style={{ backgroundColor: LETTER_PALETTE.ivory }}
    >
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
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        <EnvelopeOpen
          size={40}
          weight="duotone"
          style={{ color: LETTER_PALETTE.vermilion, opacity: 0.5 }}
        />
        <p className="text-sm text-text-secondary mt-4">分享功能即将到来 · V1 #8</p>
        <p className="text-[11px] text-text-tertiary mt-1 break-all max-w-xs">
          token: {token || '(empty)'}
        </p>
        <p className="text-[11px] text-text-tertiary mt-3 leading-relaxed max-w-xs">
          写信后,会通过 Web Share 分享一条带 token 的链接,打开就是这里。
        </p>
      </div>
    </div>
  )
}
