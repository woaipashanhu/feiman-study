/**
 * ============================================================
 *  小纸条模块 — 配色 + 字体 + 动效 调色板
 *
 *  视觉定位:苹果风 + 现代极简(参考 Day One / Apple Books)
 *  反例(火漆/卷轴/仿毛笔字/多重浮雕/emoji 满屏)被拒绝
 *
 *  配色 5 色,克制:
 *    ivory     象牙白    主底
 *    midnight  系统黑    深色底
 *    kraft     牛皮纸    复古底
 *    vermilion 哑光朱红  印章/重点
 *    gold      烫金      装饰
 *    neutral   中性灰    文本/边框
 * ============================================================
 */
import type { PaperBg } from '@/types/letters'

/** 主调色板 */
export const LETTER_PALETTE = {
  ivory: '#FAF7F2', // 象牙白 — 默认主底
  midnight: '#0E1014', // 系统黑 — 深色底(V2)
  kraft: '#D4B895', // 牛皮纸 — 复古底(V2)

  vermilion: '#C83820', // 哑光朱红 — 印章/重点
  vermilionLight: '#E25540', // 朱红亮色
  gold: '#B88840', // 烫金 — 装饰

  ink: '#1A1D2B', // 主文字(深)
  inkSoft: '#5A6078', // 次要文字
  inkMute: '#9AA0B8', // 三级文字
  paper: '#FFFFFF', // 卡片底
  line: '#E8EAF0', // 浅边框
  lineSoft: '#F0F1F5', // 软边框
} as const

/** 信纸底色视觉稿映射 */
export const PAPER_BG_STYLE: Record<PaperBg, { bg: string; ink: string; line: string; meta: string }> = {
  ivory: {
    bg: LETTER_PALETTE.ivory,
    ink: LETTER_PALETTE.ink,
    line: 'rgba(26, 29, 43, 0.08)',
    meta: LETTER_PALETTE.inkSoft,
  },
  midnight: {
    bg: LETTER_PALETTE.midnight,
    ink: '#F5F1E8',
    line: 'rgba(245, 241, 232, 0.12)',
    meta: 'rgba(245, 241, 232, 0.6)',
  },
  kraft: {
    bg: LETTER_PALETTE.kraft,
    ink: '#3D2C1E',
    line: 'rgba(61, 44, 30, 0.12)',
    meta: 'rgba(61, 44, 30, 0.7)',
  },
}

/** 字体栈 */
export const FONT_STACK = {
  /** 思源宋体(中文/古文/印章) */
  classical:
    '"Noto Serif SC", "Source Han Serif SC", "Songti SC", "STSong", "Hiragino Mincho ProN", "Times New Roman", serif',
  /** 系统圆体(英文/UI) */
  sans:
    '-apple-system, BlinkMacSystemFont, "SF Pro Text", "PingFang SC", "Inter", "Helvetica Neue", sans-serif',
  /** 等宽(SF Mono,英文诗/小字) */
  mono: '"SF Mono", "JetBrains Mono", "Menlo", "Consolas", monospace',
} as const

/** 动效曲线(iOS spring 近似) */
export const SPRING = {
  /** 默认滑入/弹入 */
  default: { type: 'spring' as const, stiffness: 300, damping: 30, mass: 0.8 },
  /** 轻动作(信件翻面 / 印章) */
  light: { type: 'spring' as const, stiffness: 240, damping: 26, mass: 0.7 },
  /** 强调(信封撕开) */
  punch: { type: 'spring' as const, stiffness: 360, damping: 22, mass: 0.6 },
} as const

/** 阴影(纸张柔和浮起) */
export const PAPER_SHADOW = {
  flat: '0 1px 2px rgba(26, 29, 43, 0.04)',
  raised: '0 4px 12px rgba(26, 29, 43, 0.08)',
  float: '0 8px 24px rgba(26, 29, 43, 0.12)',
  open: '0 12px 32px rgba(26, 29, 43, 0.18)',
} as const
