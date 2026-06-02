// ============================================================
//  社交绘本类型定义 — 沿用 fox-school (小狐狸学堂) 数据结构
//  基于 ScenePage.tsx 阅读器引擎的完整类型系统
// ============================================================

export interface DialogLine {
  speaker: string
  speakerColor: string
  text: string
}

export type BilingualText = string | { zh: string; en: string }

export interface ThoughtBubble {
  character: string       // "阿布在想" / "阿布说" / "小豆在想"
  characterColor: string  // "#E8985E" / "#5B9BD5" / "#F5B041"
  text: string | BilingualText  // 单语字符串或双语对象
}

export interface StoryPart {
  id: string              // "part1", "part2", ...
  audio?: string | { zh: string; en: string }  // 双语音频路径
  image: string           // "/images/s01-part1-xxx.png"
  narration: string | BilingualText  // 双语旁白
  thoughts?: ThoughtBubble[]  // 心里想（图片左右两侧显示，每个Part必须有）
  tip?: string | BilingualText    // 社交提示（双语）
  owlWisdom?: string | BilingualText  // 猫头鹰总结（双语）
}

export interface SceneData {
  id: string
  title: string
  subtitle: string
  principle: string
  difficulty: number
  characters: string[]
  parts: StoryPart[]
  summary: {
    title: string         // 描述性标题，如"阿布的积木倒了，想要着急时"
    message?: string      // 可选副标题
    socialSteps: string[] // 3条原文步骤（从thoughts中选取）
  }
}

export interface SceneCatalogEntry {
  id: string
  title: string
  principle: string
  difficulty: number
  unlocked: boolean
  coverImage: string
}

/** 社交绘本 JSON 数据根结构（public/data/social-scenes.json） */
export interface SocialScenesData {
  version: string
  title: string
  description: string
  /** 卡耐基社交智慧目录 */
  carnegieCatalog: SceneCatalogEntry[]
  /** 社交故事目录 */
  socialStoryCatalog: SceneCatalogEntry[]
  /** 完整场景数据（按 id 索引） */
  scenes: Record<string, SceneData>
}
