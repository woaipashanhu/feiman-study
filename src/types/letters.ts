/**
 * ============================================================
 *  小纸条模块 — 数据模型
 *
 *  三种纸条:
 *    1. quote     — 时空纸条 (从每日名言收藏来的,只读)
 *    2. personal  — 收到的纸条 (用户自己写的;V1 单机只显示系统欢迎信)
 *    3. compose   — 写过的纸条 (用户写信历史)
 *
 *  V1 = 纯前端 + localStorage (key = `feiman_letters`)
 *  V2 = 跨用户 (需后端,token 链接分享)
 *
 *  命名严格使用:小纸条 / 时空纸条 / 收到的纸条 / 写过的纸条
 *  禁止:信札 / 收件箱 / 写信 / 邮件 等替代词
 * ============================================================
 */
import { z } from 'zod'

/** 纸条类型 */
export const LetterKindSchema = z.enum(['quote', 'personal', 'compose'])
export type LetterKind = z.infer<typeof LetterKindSchema>

/** 信纸底色(决定视觉稿) */
export const PaperBgSchema = z.enum(['ivory', 'midnight', 'kraft'])
export type PaperBg = z.infer<typeof PaperBgSchema>

/** 多语种翻译(原文 + 古文 + 英文) */
export const TranslationsSchema = z
  .object({
    classicalChinese: z.string().optional(),
    english: z.string().optional(),
  })
  .optional()
export type Translations = z.infer<typeof TranslationsSchema>

/** 主数据结构 */
export const LetterSchema = z.object({
  /** 唯一 id(UUID) */
  id: z.string(),
  /** 纸条类型 */
  kind: LetterKindSchema,
  /** 原文(必填) */
  content: z.string(),
  /** 多语种翻译(古文/英文,V1 名言卡可能没翻译,V2 用户写信时 AI 生成) */
  translations: TranslationsSchema,
  /** 作者(名言作者 / 写信人) */
  author: z.string().optional(),
  /** 朝代 / 时代(古文相关) */
  dynasty: z.string().optional(),
  /** 信纸底色 */
  bgKey: PaperBgSchema.default('ivory'),
  /** 是否已收藏到时空纸条 (quote 类始终 true,personal/compose 视用户操作) */
  isStarred: z.boolean().default(false),
  /** 关联的源 quote id(写过的纸条引用时空纸条时记录) */
  refQuoteId: z.string().optional(),
  /** 关联的源 personal letter id(收到的纸条,关联到写信人) */
  refPersonalId: z.string().optional(),
  /** 创建时间戳 */
  createdAt: z.number(),
  /** 更新时间戳 */
  updatedAt: z.number(),
  /** 是否系统预置(如系统欢迎信,用户不能删除) */
  isSystem: z.boolean().optional(),
  /** 分享 token(V1 未启用) */
  shareToken: z.string().optional(),
})

export type Letter = z.infer<typeof LetterSchema>

/** 整个 letters store */
export const LettersStateSchema = z.object({
  version: z.string(),
  letters: z.array(LetterSchema),
})
export type LettersState = z.infer<typeof LettersStateSchema>

/** localStorage key */
export const LETTERS_KEY = 'letters'  // 双前缀 bug 修复:saveSecure 会自动加 'feiman_' 前缀,这里只用裸 key

/** 当前 schema 版本(以后破坏性变更时用) */
export const LETTERS_VERSION = '1.0.0'

/** localStorage 单条大小软上限(防爆) */
export const MAX_LETTERS = 500

/** 标签(用于 UI 展示,非数据字段) */
export const LETTER_KIND_LABEL: Record<LetterKind, string> = {
  quote: '时空纸条',
  personal: '收到的纸条',
  compose: '写过的纸条',
}

/** 板块层级顺序(用于排序与显示) */
export const LETTER_KIND_ORDER: LetterKind[] = ['quote', 'personal', 'compose']

/** 系统欢迎信(首次启动自动 seed) */
export const SYSTEM_WELCOME_LETTER: Omit<Letter, 'id' | 'createdAt' | 'updatedAt'> = {
  kind: 'personal',
  content:
    '欢迎来到小纸条。\n这里有三种纸条:\n· 时空纸条 — 每天给你一句值得收藏的话\n· 收到的纸条 — 别人寄给你的信\n· 写过的纸条 — 你写过的信\n\n点开「今日纸条」,从一封信开始读起吧。',
  translations: {
    classicalChinese:
      '欢迎入小纸条之堂。\n此处三式:\n· 时空纸条 — 每日一句,藏之名山\n· 收到的纸条 — 他人之书,千里同风\n· 写过的纸条 — 已寄之信,留为心声\n\n请开「今日纸条」,自一封读起。',
  },
  author: '费曼科学课',
  dynasty: '今',
  bgKey: 'ivory',
  isStarred: true,
  isSystem: true,
}

/**
 * 判断一条 letter 是否为"系统预置"(用户不可删除)
 */
export function isSystemLetter(l: Letter): boolean {
  return l.isSystem === true
}

/**
 * 排序:系统信置顶 + 按 updatedAt 倒序
 */
export function sortLetters(items: Letter[]): Letter[] {
  return items.slice().sort((a, b) => {
    if (a.isSystem && !b.isSystem) return -1
    if (!a.isSystem && b.isSystem) return 1
    return b.updatedAt - a.updatedAt
  })
}

/**
 * 工具:从 DailyQuote 生成 quote 类 Letter(用于每日名言收藏)
 */
export function quoteToLetter(args: {
  id: string
  content: string
  author?: string
  dynasty?: string
  bgKey?: PaperBg
  translations?: Translations
}): Letter {
  const now = Date.now()
  return {
    id: args.id,
    kind: 'quote',
    content: args.content,
    author: args.author,
    dynasty: args.dynasty,
    bgKey: args.bgKey ?? 'ivory',
    translations: args.translations,
    isStarred: true,
    createdAt: now,
    updatedAt: now,
  }
}
