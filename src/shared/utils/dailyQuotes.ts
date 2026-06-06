/**
 * 每日盲盒名言库
 *
 * 架构设计：ARCHITECTURE.md §六.2 + §十二.4
 * 用途：
 *   1. ProfileDrawer 中的"每日盲盒"模块（v18 之前的旧入口）
 *   2. 小纸条模块 — 今日纸条的源数据（V1 起）
 *
 * 按日期取模循环，每天自动展示不同名言。
 * 古文/古诗词带 dynasty (朝代),新写的语录可空。
 * bgKey 控制信纸底色(V1 默认 ivory,V2 扩展 midnight/kraft)。
 */

export interface DailyQuote {
  text: string
  author: string
  /** 朝代(古文/古诗词才有,如"春秋/唐/宋/古希腊") */
  dynasty?: string
  /** 信纸底色键(由视觉层映射到具体色) */
  bgKey?: 'ivory' | 'midnight' | 'kraft'
}

/** 名言库 — 可持续扩充(共 30 条) */
const QUOTES: DailyQuote[] = [
  { text: '每天进步一点点，一年后你会感谢今天的自己。', author: '' },
  { text: '学习不是为了考试，是为了让未来的你更有选择。', author: '' },
  { text: '你今天学到的知识，是别人偷不走的财富。', author: '' },
  { text: '好奇心是最好的老师，你今天又发现了什么？', author: '' },
  { text: '不怕学得慢，就怕你不开始。你已经开始了！', author: '' },
  { text: '世界上没有笨孩子，只有还没找到方法的孩子。', author: '' },
  { text: '你每学会一个知识，大脑就多了一条高速公路。', author: '' },
  { text: '今天的学习，是给未来自己最好的礼物。', author: '' },
  { text: '科学家也是从"为什么"开始的，保持好奇心！', author: '' },
  { text: '你比昨天更厉害了，这就是进步。', author: '' },
  { text: '问问题是学习的开始，答案在探索中等待你。', author: '苏格拉底', dynasty: '古希腊' },
  { text: '想象力比知识更重要。', author: '爱因斯坦' },
  { text: '学而不思则罔，思而不学则殆。', author: '孔子', dynasty: '春秋' },
  { text: '生活的秘密在于：把你所有的牌都打好。', author: '奥普拉·温弗瑞' },
  { text: '成功的秘诀在于开始行动。', author: '马克·吐温' },
  { text: '你不是因为看到希望才坚持，而是因为坚持才看到希望。', author: '' },
  { text: '每一个你不满意的现在，都有一个你没有努力的曾经。', author: '' },
  { text: '优秀是一种习惯，不是一次行为。', author: '亚里士多德', dynasty: '古希腊' },
  { text: '困难像弹簧，你弱它就强。', author: '' },
  { text: '星光不问赶路人，时光不负有心人。', author: '' },
  { text: '知识就是力量。', author: '培根' },
  { text: '读万卷书，行万里路。', author: '董其昌', dynasty: '明' },
  { text: '天才是1%的灵感加上99%的汗水。', author: '爱迪生' },
  { text: '书山有路勤为径，学海无涯苦作舟。', author: '韩愈', dynasty: '唐' },
  { text: '千里之行，始于足下。', author: '老子', dynasty: '春秋' },
  { text: '锲而舍之，朽木不折；锲而不舍，金石可镂。', author: '荀子', dynasty: '战国' },
  { text: '己所不欲，勿施于人。', author: '孔子', dynasty: '春秋' },
  { text: '知之者不如好之者，好之者不如乐之者。', author: '孔子', dynasty: '春秋' },
  { text: '学而时习之，不亦说乎？', author: '孔子', dynasty: '春秋' },
  { text: '温故而知新，可以为师矣。', author: '孔子', dynasty: '春秋' },
]

/**
 * 获取今日名言
 * 根据日期取模，同一天返回相同的名言
 */
export function getDailyQuote(date?: Date): DailyQuote {
  const d = date || new Date()
  // 计算今天是当年的第几天（0-based）
  const start = new Date(d.getFullYear(), 0, 0)
  const diff = d.getTime() - start.getTime()
  const dayOfYear = Math.floor(diff / 86400000)
  return QUOTES[dayOfYear % QUOTES.length]
}

/**
 * 随机获取一条名言（用于"换一条"功能）
 */
export function getRandomQuote(): DailyQuote {
  const idx = Math.floor(Math.random() * QUOTES.length)
  return QUOTES[idx]
}

/** 获取名言库总数 */
export function getQuotesCount(): number {
  return QUOTES.length
}

/** 获取全部名言(用于"全部时空纸条"种子) */
export function getAllQuotes(): DailyQuote[] {
  return QUOTES.slice()
}
