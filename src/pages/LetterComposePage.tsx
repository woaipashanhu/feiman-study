/**
 * ============================================================
 *  LetterComposePage — 写一张纸条页  /letters/compose
 *
 *  一次实现 V1 #5-#8(原计划分 4 步走,合并到同页更连贯):
 *    #5 写信 UI:  思源宋体输入区 + 字体/底色选择 + 字数
 *    #6 AI 转换:  useAITransform (V1 mock, V2 切 DeepSeek)
 *    #7 长图:     html2canvas-pro 生成 750×1334 信纸长图
 *    #8 分享:     navigator.share + 复制链接 (V2 接 token)
 *
 *  流程:
 *    输入 → (可选 AI 转换) → (可选 引用) → 生成长图 → 分享
 *                                                       → 或保存到写过的纸条
 * ============================================================
 */
import { useRef, useState } from 'react'
// useState also used in saving/shareUrl below
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import html2canvas from 'html2canvas-pro'
import {
  ArrowLeft,
  TextT,
  MagicWand,
  CheckCircle,
  Image as ImageIcon,
  ShareNetwork,
  Quotes,
  X,
  ArrowsClockwise,
  FloppyDisk,
} from 'phosphor-react'
import { LETTER_PALETTE } from '@/shared/components/LetterPaper/palette'
import { useLetters } from '@/shared/hooks/useLetters'
import { lettersApi } from '@/shared/hooks/useLettersServer'
import { useAITransform } from '@/shared/hooks/useAITransform'
import { getDailyQuote } from '@/shared/utils/dailyQuotes'
import { FONT_STACK } from '@/shared/components/LetterPaper/palette'
import type { PaperBg } from '@/types/letters'

type FontSize = 'sm' | 'md' | 'lg'
const FONT_SIZE_MAP: Record<FontSize, number> = { sm: 15, md: 17, lg: 20 }
const FONT_LINE_MAP: Record<FontSize, number> = { sm: 1.75, md: 1.85, lg: 1.95 }

const MAX_LEN = 280 // 字数上限

export default function LetterComposePage() {
  const navigate = useNavigate()
  const { addCompose, getByKind } = useLetters()
  const { data: aiData, loading: aiLoading, error: aiError, run: runAI } = useAITransform()

  const [text, setText] = useState('')
  const [fontSize, setFontSize] = useState<FontSize>('md')
  const [bgKey, setBgKey] = useState<PaperBg>('ivory')
  const [refQuote, setRefQuote] = useState<{ text: string; author?: string } | null>(null)
  const [aiOn, setAiOn] = useState(false)
  const [refOn, setRefOn] = useState(false)
  const [savedFlash, setSavedFlash] = useState(false)
  const [sharingFlash, setSharingFlash] = useState(false)
  const paperRef = useRef<HTMLDivElement | null>(null)

  // 字数
  const len = text.length
  const overLimit = len > MAX_LEN

  // 默认从今天的名言预填一个引用候选(打开引用面板时展示)
  const todayQuote = getDailyQuote()
  const allQuotes = getByKind('quote')
  const starredQuotes = allQuotes.slice(0, 6)

  // 选中并写入(同步发到后端,失败降级到本地)
  const [saving, setSaving] = useState(false)
  const handleSave = async () => {
    if (!text.trim() || overLimit || saving) return
    setSaving(true)
    let shareToken: string | undefined
    try {
      const created = await lettersApi.create({
        content: text.trim(),
        author: '我',
        bgKey,
        translations: aiData
          ? { classicalChinese: aiData.classicalChinese, english: aiData.english }
          : undefined,
      })
      shareToken = created.shareToken
    } catch (e) {
      console.warn('同步到云端失败,降级到本地保存', e)
    }
    const id = addCompose({
      content: text.trim(),
      bgKey,
      translations: aiData
        ? { classicalChinese: aiData.classicalChinese, english: aiData.english }
        : undefined,
      refQuoteId: undefined,
      shareToken, // V1 后端返回的 token,V2 才能让本地"写过的"关联到云端分享
    })
    setSavedFlash(true)
    setTimeout(() => {
      setSavedFlash(false)
      navigate(`/letters/letter/${id}`)
    }, 700)
    setSaving(false)
  }

  // AI 转换
  const handleAI = async () => {
    if (!text.trim()) return
    setAiOn(true)
    await runAI(text)
  }

  // 长图生成
  const handleGenerateImage = async () => {
    if (!paperRef.current) return
    try {
      const canvas = await html2canvas(paperRef.current, {
        backgroundColor: PAPER_BG_STYLE_HEX[bgKey],
        scale: 2,
        useCORS: true,
        logging: false,
        width: 750,
        windowWidth: 750,
      })
      // 转 blob
      const blob: Blob | null = await new Promise((res) => canvas.toBlob(res, 'image/png'))
      if (!blob) return
      // 触发下载
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `letter-${Date.now()}.png`
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      console.error('长图生成失败', e)
    }
  }

  // 分享(Web Share API + 云端落地页链接)
  const handleShare = async () => {
    if (!paperRef.current) return
    // 1. 同步创建云端记录,获取 shareToken → 落地页 URL
    let shareUrlLocal: string | null = null
    try {
      const created = await lettersApi.create({
        content: text.trim(),
        author: '我',
        bgKey,
        translations: aiData
          ? { classicalChinese: aiData.classicalChinese, english: aiData.english }
          : undefined,
      })
      shareUrlLocal = `${window.location.origin}/letters/inbox/${created.shareToken}`
    } catch (e) {
      console.warn('云端同步失败,降级为纯图片分享', e)
    }
    // 2. 长图
    let file: File | null = null
    try {
      const canvas = await html2canvas(paperRef.current, {
        backgroundColor: PAPER_BG_STYLE_HEX[bgKey],
        scale: 2,
        useCORS: true,
        logging: false,
        width: 750,
        windowWidth: 750,
      })
      const blob: Blob | null = await new Promise((res) => canvas.toBlob(res, 'image/png'))
      if (blob) {
        file = new File([blob], `letter-${Date.now()}.png`, { type: 'image/png' })
      }
    } catch (e) {
      console.error('分享图生成失败', e)
    }

    // 3. 优先分享链接(对方点开能进"收到的纸条")
    const preview = text.trim().slice(0, 60) + (text.length > 60 ? '…' : '')
    const shareData: ShareData = {
      title: '一张来自小纸条的信',
      text: shareUrlLocal ? `${preview}
${shareUrlLocal}` : preview,
    }
    if (file) {
      // @ts-ignore - navigator.canShare 接受 File
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        shareData.files = [file]
      }
    }
    if (navigator.share) {
      try {
        await navigator.share(shareData)
        setSharingFlash(true)
        setTimeout(() => setSharingFlash(false), 1500)
      } catch (e) {
        // 用户取消
      }
    } else {
      // 降级:复制文本到剪贴板
      try {
        await navigator.clipboard.writeText(text.trim())
        setSharingFlash(true)
        setTimeout(() => setSharingFlash(false), 1500)
      } catch {
        // 啥都不做
      }
    }
  }

  // 引用列表(今日纸条 + 收藏)
  const refCandidates = [todayQuote, ...starredQuotes.map((q) => ({ text: q.content, author: q.author }))]
  // 去重
  const refList = Array.from(
    new Map(refCandidates.map((q) => [`${q.text}|${q.author ?? ''}`, q])).values()
  )

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
            写一张纸条
          </h1>
          <p className="text-[10px] text-text-tertiary mt-0.5">
            纸短情长,写给未来的自己
          </p>
        </div>
        {/* 字数 */}
        <div
          className={`text-[11px] tabular-nums ${overLimit ? 'text-red-500' : 'text-text-tertiary'}`}
        >
          {len} / {MAX_LEN}
        </div>
      </header>

      {/* 工具栏:字体 + 底色 */}
      <div className="px-4 pb-3 shrink-0">
        <div className="flex items-center gap-2 flex-wrap">
          <ToolGroup label="字号">
            {(['sm', 'md', 'lg'] as FontSize[]).map((f) => (
              <ToolChip
                key={f}
                active={fontSize === f}
                onClick={() => setFontSize(f)}
                icon={<TextT size={12} weight="bold" />}
                label={f === 'sm' ? '小' : f === 'md' ? '中' : '大'}
              />
            ))}
          </ToolGroup>
          <ToolGroup label="底色">
            <ToolChip
              active={bgKey === 'ivory'}
              onClick={() => setBgKey('ivory')}
              swatch="#FAF7F2"
            />
            <ToolChip
              active={false}
              disabled
              swatch="#0E1014"
              hint="V2"
            />
            <ToolChip
              active={false}
              disabled
              swatch="#D4B895"
              hint="V2"
            />
          </ToolGroup>
        </div>
      </div>

      {/* 滚动主区 */}
      <div className="flex-1 overflow-y-auto px-4 pb-32 space-y-4">
        {/* 信纸输入区 */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 280, damping: 28 }}
        >
          <div
            ref={paperRef}
            style={{
              position: 'relative',
              backgroundColor: PAPER_BG_STYLE_HEX[bgKey],
              color: PAPER_BG_INK_HEX[bgKey],
              borderRadius: 18,
              padding: '28px 24px 32px 24px',
              boxShadow: '0 4px 12px rgba(26,29,43,0.08)',
              fontFamily: FONT_STACK.sans,
              minHeight: 220,
              backgroundImage:
                bgKey === 'ivory'
                  ? 'linear-gradient(135deg, transparent 0%, rgba(0,0,0,0.04) 100%)'
                  : 'none',
            }}
          >
            {/* 顶部日期 — 长图里要带 */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: 11,
                color: PAPER_BG_META_HEX[bgKey],
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                marginBottom: 18,
                fontFamily: FONT_STACK.sans,
              }}
            >
              <span>
                {new Date().toISOString().slice(0, 10).replace(/-/g, ' · ')}
              </span>
              {refQuote && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Quotes size={12} weight="fill" />
                  引用
                </span>
              )}
            </div>
            {/* 编辑区 */}
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="此刻,你想对未来的自己说什么?"
              maxLength={MAX_LEN + 50}
              style={{
                width: '100%',
                minHeight: 140,
                border: 'none',
                outline: 'none',
                resize: 'none',
                background: 'transparent',
                fontFamily: FONT_STACK.classical,
                fontSize: FONT_SIZE_MAP[fontSize],
                lineHeight: FONT_LINE_MAP[fontSize],
                letterSpacing: '0.04em',
                color: PAPER_BG_INK_HEX[bgKey],
                padding: 0,
              }}
            />
            {/* AI 翻译区(在信纸内,生成时显示) */}
            <AnimatePresence>
              {aiData && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  style={{
                    marginTop: 18,
                    paddingTop: 18,
                    borderTop: '1px dashed rgba(0,0,0,0.08)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12,
                  }}
                >
                  <p
                    style={{
                      fontFamily: FONT_STACK.classical,
                      fontSize: 13,
                      lineHeight: 1.85,
                      color: PAPER_BG_META_HEX[bgKey],
                      margin: 0,
                      letterSpacing: '0.06em',
                    }}
                  >
                    {aiData.classicalChinese}
                  </p>
                  <p
                    style={{
                      fontFamily: FONT_STACK.mono,
                      fontSize: 12,
                      lineHeight: 1.7,
                      color: PAPER_BG_META_HEX[bgKey],
                      margin: 0,
                      fontStyle: 'italic',
                    }}
                  >
                    {aiData.english}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
            {/* 引用预览 */}
            <AnimatePresence>
              {refQuote && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  style={{
                    marginTop: 16,
                    padding: 14,
                    borderRadius: 10,
                    background: 'rgba(0,0,0,0.04)',
                    position: 'relative',
                  }}
                >
                  <button
                    onClick={() => setRefQuote(null)}
                    className="absolute top-1 right-1 w-6 h-6 rounded-full flex items-center justify-center"
                    style={{ background: 'rgba(255,255,255,0.8)' }}
                    aria-label="移除引用"
                  >
                    <X size={12} />
                  </button>
                  <p
                    style={{
                      fontFamily: FONT_STACK.classical,
                      fontSize: 12.5,
                      lineHeight: 1.7,
                      color: PAPER_BG_META_HEX[bgKey],
                      margin: 0,
                    }}
                  >
                    「{refQuote.text}」
                  </p>
                  {refQuote.author && (
                    <p
                      style={{
                        fontSize: 10,
                        color: PAPER_BG_META_HEX[bgKey],
                        marginTop: 4,
                        textAlign: 'right',
                        margin: '4px 0 0 0',
                      }}
                    >
                      — {refQuote.author}
                    </p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* AI 转换面板 */}
        <Panel
          open={aiOn}
          onToggle={() => setAiOn((v) => !v)}
          icon={<MagicWand size={14} weight="fill" />}
          title="让 AI 写古文/英文"
          hint="基于你输入的内容生成古文版和英文版(V1 mock,V2 切 DeepSeek)"
        >
          {aiLoading ? (
            <div className="flex items-center gap-2 py-3 text-sm text-text-secondary">
              <ArrowsClockwise size={14} className="animate-spin" />
              AI 正在挥毫…
            </div>
          ) : aiError ? (
            <div className="text-sm text-red-500 py-2">{aiError}</div>
          ) : aiData ? (
            <div className="space-y-3">
              <TransBlock label="古文" body={aiData.classicalChinese} font="classical" />
              <TransBlock label="English" body={aiData.english} font="mono" italic />
              <button
                onClick={handleAI}
                className="text-[11px] text-text-tertiary flex items-center gap-1"
              >
                <ArrowsClockwise size={12} /> 再来一次
              </button>
            </div>
          ) : (
            <button
              onClick={handleAI}
              disabled={!text.trim() || overLimit}
              className="w-full mt-1 py-2.5 rounded-xl text-sm font-medium text-white disabled:opacity-40"
              style={{ backgroundColor: LETTER_PALETTE.vermilion }}
            >
              生成古文 + 英文
            </button>
          )}
        </Panel>

        {/* 引用面板 */}
        <Panel
          open={refOn}
          onToggle={() => setRefOn((v) => !v)}
          icon={<Quotes size={14} weight="fill" />}
          title="引用今日纸条 / 收藏"
          hint="挑一句名言附在信末"
        >
          <div className="space-y-2">
            {refList.length === 0 ? (
              <p className="text-xs text-text-tertiary py-2">还没有可引用的内容</p>
            ) : (
              refList.map((q, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setRefQuote(q)
                    setRefOn(false)
                  }}
                  className="w-full text-left p-3 rounded-xl border border-border bg-bg hover:border-brand/30 transition-colors"
                >
                  <p
                    className="text-[13px] leading-relaxed text-text"
                    style={{ fontFamily: FONT_STACK.classical }}
                  >
                    「{q.text}」
                  </p>
                  {q.author && (
                    <p className="text-[10px] text-text-tertiary mt-1 text-right">— {q.author}</p>
                  )}
                </button>
              ))
            )}
          </div>
        </Panel>
      </div>

      {/* 底部操作区 */}
      <div
        className="fixed left-0 right-0 z-30 px-4 pt-3 pb-4 bg-gradient-to-t from-[#FAF7F2] via-[#FAF7F2] to-transparent"
        style={{ paddingBottom: 'calc(16px + env(safe-area-inset-bottom, 0px))', bottom: 0 }}
      >
        <div className="flex gap-2">
          <BottomButton
            icon={<ImageIcon size={16} weight="bold" />}
            label="生成长图"
            onClick={handleGenerateImage}
            disabled={!text.trim()}
            tone="light"
          />
          <BottomButton
            icon={<ShareNetwork size={16} weight="bold" />}
            label="寄出"
            onClick={handleShare}
            disabled={!text.trim()}
            tone="primary"
          />
          <BottomButton
            icon={savedFlash ? <CheckCircle size={16} weight="fill" /> : <FloppyDisk size={16} weight="bold" />}
            label={savedFlash ? '已保存' : '保存'}
            onClick={handleSave}
            disabled={!text.trim() || overLimit}
            tone={savedFlash ? 'success' : 'dark'}
          />
        </div>
      </div>

      {/* 分享成功提示 */}
      <AnimatePresence>
        {sharingFlash && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed left-1/2 -translate-x-1/2 px-4 py-2 rounded-full text-sm font-medium z-50"
            style={{ backgroundColor: '#1A1D2B', color: '#FAF7F2', bottom: 100 }}
          >
            已分享 / 文本已复制
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ============================================================
// 子组件
// ============================================================

const PAPER_BG_STYLE_HEX: Record<PaperBg, string> = {
  ivory: '#FAF7F2',
  midnight: '#0E1014',
  kraft: '#D4B895',
}
const PAPER_BG_INK_HEX: Record<PaperBg, string> = {
  ivory: '#1A1D2B',
  midnight: '#F5F1E8',
  kraft: '#3D2C1E',
}
const PAPER_BG_META_HEX: Record<PaperBg, string> = {
  ivory: '#5A6078',
  midnight: 'rgba(245,241,232,0.6)',
  kraft: 'rgba(61,44,30,0.7)',
}

function ToolGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-1.5 bg-white/70 border border-black/5 rounded-2xl px-2 py-1.5">
      <span className="text-[10px] text-text-tertiary px-1">{label}</span>
      {children}
    </div>
  )
}

function ToolChip({
  active,
  onClick,
  icon,
  label,
  swatch,
  hint,
  disabled,
}: {
  active?: boolean
  onClick?: () => void
  icon?: React.ReactNode
  label?: string
  swatch?: string
  hint?: string
  disabled?: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] transition-all"
      style={{
        backgroundColor: active ? '#1A1D2B' : 'transparent',
        color: active ? '#FAF7F2' : disabled ? 'rgba(154,160,184,0.5)' : '#1A1D2B',
        cursor: disabled ? 'not-allowed' : 'pointer',
      }}
      title={hint}
    >
      {swatch ? (
        <span
          style={{
            display: 'inline-block',
            width: 14,
            height: 14,
            borderRadius: 7,
            backgroundColor: swatch,
            border: '1px solid rgba(0,0,0,0.1)',
          }}
        />
      ) : (
        icon
      )}
      {label && <span>{label}</span>}
    </button>
  )
}

function Panel({
  open,
  onToggle,
  icon,
  title,
  hint,
  children,
}: {
  open: boolean
  onToggle: () => void
  icon: React.ReactNode
  title: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-2xl bg-white/70 border border-black/5 overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-2 px-4 py-3 text-left"
      >
        <span
          className="w-6 h-6 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: 'rgba(200,56,32,0.1)', color: LETTER_PALETTE.vermilion }}
        >
          {icon}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-text">{title}</p>
          {hint && <p className="text-[10px] text-text-tertiary mt-0.5">{hint}</p>}
        </div>
        <span className="text-[11px] text-text-tertiary">{open ? '收起' : '展开'}</span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function TransBlock({
  label,
  body,
  font,
  italic,
}: {
  label: string
  body: string
  font: 'classical' | 'mono'
  italic?: boolean
}) {
  return (
    <div>
      <span className="text-[10px] uppercase tracking-[0.18em] text-text-tertiary">
        {label}
      </span>
      <p
        className="text-[13px] leading-relaxed text-text mt-1"
        style={{
          fontFamily: font === 'classical' ? FONT_STACK.classical : FONT_STACK.mono,
          fontStyle: italic ? 'italic' : 'normal',
        }}
      >
        {body}
      </p>
    </div>
  )
}

function BottomButton({
  icon,
  label,
  onClick,
  disabled,
  tone,
}: {
  icon: React.ReactNode
  label: string
  onClick: () => void
  disabled?: boolean
  tone: 'light' | 'primary' | 'dark' | 'success'
}) {
  const styles: Record<typeof tone, React.CSSProperties> = {
    light: { backgroundColor: 'rgba(26,29,43,0.06)', color: '#1A1D2B' },
    primary: { backgroundColor: LETTER_PALETTE.vermilion, color: '#FAF7F2' },
    dark: { backgroundColor: '#1A1D2B', color: '#FAF7F2' },
    success: { backgroundColor: '#10B981', color: '#fff' },
  }
  return (
    <motion.button
      whileTap={{ scale: 0.96 }}
      onClick={onClick}
      disabled={disabled}
      className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-2xl text-sm font-medium disabled:opacity-40 transition-colors"
      style={styles[tone]}
    >
      {icon}
      <span>{label}</span>
    </motion.button>
  )
}
