/**
 * ============================================================
 *  LetterPaper — 小纸条模块 信纸组件
 *
 *  视觉:苹果风 + 现代极简
 *  - 默认 ivory 底,圆角 16,纸纹浮起阴影
 *  - 顶部小 meta:日期/作者(英文苹方小字)
 *  - 中部主文(思源宋体 17-19px,行高 1.85,letter-spacing 0.04em)
 *  - 翻译部分(古文/英文)用渐进灰
 *  - 右下角 LetterStamp
 *
 *  变体:
 *    variant = 'quote'    — 时空纸条(名言,顶部可显示 dynasty 标签)
 *    variant = 'personal' — 收到的纸条(更柔,有作者署名)
 *    variant = 'compose'  — 写过的纸条(可编辑/分享)
 *    variant = 'preview'  — 预览(无阴影,扁平)
 *
 *  V1 信纸底色默认 ivory;midnight / kraft 留 V2
 * ============================================================
 */
import { type CSSProperties, type ReactNode } from 'react'
import { motion } from 'framer-motion'
import type { Letter, PaperBg } from '@/types/letters'
import { LetterStamp } from './LetterStamp'
import { FONT_STACK, LETTER_PALETTE, PAPER_BG_STYLE, PAPER_SHADOW, SPRING } from './palette'

export type LetterPaperVariant = 'quote' | 'personal' | 'compose' | 'preview'

export interface LetterPaperProps {
  letter: Pick<Letter, 'content' | 'author' | 'dynasty' | 'translations' | 'bgKey' | 'createdAt'>
  variant?: LetterPaperVariant
  /** 是否显示印章 */
  showStamp?: boolean
  /** 印章文字 */
  stampText?: string
  /** 自定义 className */
  className?: string
  /** 自定义 style */
  style?: CSSProperties
  /** 点击回调 */
  onClick?: () => void
  /** 右上角装饰(可选,如引用、删除按钮) */
  topRight?: ReactNode
  /** 底部装饰(可选,如时间/标签) */
  bottom?: ReactNode
}

function formatDate(ts: number): string {
  const d = new Date(ts)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y} · ${m} · ${day}`
}

export function LetterPaper({
  letter,
  variant = 'personal',
  showStamp = true,
  stampText,
  className,
  style,
  onClick,
  topRight,
  bottom,
}: LetterPaperProps) {
  const bgKey: PaperBg = letter.bgKey ?? 'ivory'
  const paper = PAPER_BG_STYLE[bgKey]

  // 印章默认文案
  const defaultStamp =
    stampText ??
    (variant === 'quote' ? '时空' : variant === 'compose' ? '寄' : variant === 'personal' ? '传' : '笺')

  // 阴影随变体
  const shadow = variant === 'preview' ? PAPER_SHADOW.flat : PAPER_SHADOW.raised

  // 是否可点击
  const interactive = Boolean(onClick)

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={SPRING.default}
      whileTap={interactive ? { scale: 0.985 } : undefined}
      onClick={onClick}
      className={className}
      style={{
        position: 'relative',
        backgroundColor: paper.bg,
        color: paper.ink,
        borderRadius: 18,
        padding: '28px 24px 32px 24px',
        boxShadow: shadow,
        // 纸纹效果(纯 CSS,极轻)
        backgroundImage:
          bgKey === 'ivory'
            ? `linear-gradient(135deg, transparent 0%, ${paper.line} 100%)`
            : 'none',
        cursor: interactive ? 'pointer' : 'default',
        overflow: 'hidden',
        fontFamily: FONT_STACK.sans,
        ...style,
      }}
    >
      {/* 顶部 meta 行 — 日期 / 作者 / 朝代 */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontFamily: FONT_STACK.sans,
          fontSize: 11,
          color: paper.meta,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          marginBottom: 18,
        }}
      >
        <span>{formatDate(letter.createdAt)}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {letter.dynasty && (
            <span
              style={{
                padding: '2px 8px',
                border: `1px solid ${paper.line}`,
                borderRadius: 6,
                fontSize: 10,
                letterSpacing: '0.18em',
                color: paper.meta,
                fontFamily: FONT_STACK.classical,
                textTransform: 'none',
              }}
            >
              {letter.dynasty}
            </span>
          )}
          {topRight}
        </div>
      </div>

      {/* 主文 */}
      <div
        style={{
          fontFamily: FONT_STACK.classical,
          fontSize: 17,
          lineHeight: 1.85,
          letterSpacing: '0.04em',
          color: paper.ink,
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          // 段落间距
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
        }}
      >
        {letter.content.split('\n').map((line, i) => (
          <p key={i} style={{ margin: 0 }}>
            {line || '\u00A0'}
          </p>
        ))}
      </div>

      {/* 翻译部分(古文 + 英文,渐进灰色) */}
      {(letter.translations?.classicalChinese || letter.translations?.english) && (
        <div
          style={{
            marginTop: 22,
            paddingTop: 18,
            borderTop: `1px dashed ${paper.line}`,
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}
        >
          {letter.translations.classicalChinese && (
            <div>
              <p
                style={{
                  fontFamily: FONT_STACK.classical,
                  fontSize: 13,
                  lineHeight: 1.85,
                  color: paper.meta,
                  margin: 0,
                  letterSpacing: '0.06em',
                }}
              >
                {letter.translations.classicalChinese}
              </p>
            </div>
          )}
          {letter.translations.english && (
            <div>
              <p
                style={{
                  fontFamily: FONT_STACK.mono,
                  fontSize: 12.5,
                  lineHeight: 1.7,
                  color: paper.meta,
                  margin: 0,
                  fontStyle: 'italic',
                }}
              >
                {letter.translations.english}
              </p>
            </div>
          )}
        </div>
      )}

      {/* 作者署名(仅 personal 变体) */}
      {variant === 'personal' && letter.author && (
        <p
          style={{
            marginTop: 18,
            textAlign: 'right',
            fontFamily: FONT_STACK.sans,
            fontSize: 12,
            color: paper.meta,
            letterSpacing: '0.04em',
          }}
        >
          — {letter.author}
        </p>
      )}

      {/* 底部装饰 */}
      {bottom && <div style={{ marginTop: 18 }}>{bottom}</div>}

      {/* 印章(右下角) */}
      {showStamp && (
        <div
          style={{
            position: 'absolute',
            right: 18,
            bottom: 18,
          }}
        >
          <LetterStamp text={defaultStamp} tone={variant === 'quote' ? 'vermilion' : 'vermilion'} size={56} />
        </div>
      )}
    </motion.div>
  )
}

/** 工具:获取当前 LetterPaper 在 ivory 底下的强调色(用于按钮等子组件) */
export function getAccentForBg(bgKey: PaperBg): string {
  return bgKey === 'midnight' ? LETTER_PALETTE.gold : LETTER_PALETTE.vermilion
}
