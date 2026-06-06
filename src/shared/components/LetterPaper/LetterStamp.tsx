/**
 * ============================================================
 *  LetterStamp — 小纸条模块 印章组件
 *
 *  极简方形 + 思源宋体 + 朱红;不是浮雕/不是火漆
 *  位置:右下角 (absolute)
 *  旋转:随机小角度(±4°)模拟手盖印章
 *  尺寸:小 56 / 中 72 / 大 88
 * ============================================================
 */
import { motion } from 'framer-motion'
import { LETTER_PALETTE, FONT_STACK } from './palette'

export interface LetterStampProps {
  /** 印章上的字(1-2 字,默认 "传") */
  text?: string
  /** 大小(px) */
  size?: number
  /** 旋转角度(deg) */
  rotate?: number
  /** 颜色,默认 vermilion */
  color?: string
  /** 主题色,默认朱红 */
  tone?: 'vermilion' | 'gold'
  className?: string
}

const SIZE_MAP = {
  small: 56,
  medium: 72,
  large: 88,
} as const

export function LetterStamp({
  text = '传',
  size = SIZE_MAP.medium,
  rotate = -3,
  color,
  tone = 'vermilion',
  className,
}: LetterStampProps) {
  const stampColor = color ?? (tone === 'gold' ? LETTER_PALETTE.gold : LETTER_PALETTE.vermilion)
  const borderColor = stampColor
  // 字号:印章尺寸的 38%
  const fontSize = Math.round(size * 0.38)

  return (
    <motion.div
      initial={{ scale: 0.6, opacity: 0, rotate: rotate - 8 }}
      animate={{ scale: 1, opacity: 0.92, rotate }}
      transition={{ type: 'spring', stiffness: 360, damping: 22, mass: 0.6, delay: 0.1 }}
      className={className}
      style={{
        width: size,
        height: size,
        borderWidth: Math.max(2, Math.round(size * 0.05)),
        borderColor: borderColor,
        borderStyle: 'solid',
        borderRadius: 4,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: stampColor,
        fontFamily: FONT_STACK.classical,
        fontWeight: 600,
        fontSize,
        letterSpacing: '0.05em',
        lineHeight: 1,
        background: 'transparent',
        // 模拟手盖印章的轻微微噪(纯 CSS,不需要图片)
        boxShadow: `inset 0 0 0 1px ${stampColor}15, inset 0 0 6px ${stampColor}25`,
        userSelect: 'none',
        // 不接受鼠标事件
        pointerEvents: 'none',
      }}
      aria-label={`印章:${text}`}
    >
      <span style={{ textShadow: `0 0 0.5px ${stampColor}` }}>{text}</span>
    </motion.div>
  )
}
