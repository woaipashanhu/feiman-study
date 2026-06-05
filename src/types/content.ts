import { z } from 'zod'

// 数学课
export const LessonSchema = z.object({
  id: z.string(),
  videoId: z.string(),
  title: z.string(),
  subtitle: z.string().optional(),
  cover: z.string().optional(),
  /** 视频预览(后端生成的脱敏低码率 mp4),空字符串表示无,前端用 fallback */
  previewUrl: z.string().optional(),
  duration: z.number().optional(),
  order: z.number().optional(),
})

export const SectionSchema = z.object({
  id: z.string(),
  title: z.string(),
  subtitle: z.string().optional(),
  lessons: z.array(LessonSchema),
})

export const MathDataSchema = z.object({
  version: z.string(),
  title: z.string(),
  description: z.string().optional(),
  playauthApi: z.string(),
  vodRegion: z.string(),
  sections: z.array(SectionSchema),
})

// 科学可视化
export const ScienceSceneSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  thumbnail: z.string().optional(),
  difficulty: z.string().optional(),
  duration: z.string().optional(),
  order: z.number().optional(),
  type: z.string().optional(), // 'iframe' | 'r3f' | etc
  src: z.string().optional(), // iframe src path
})

export const ScienceCategorySchema = z.object({
  id: z.string(),
  name: z.string(),
  icon: z.string().optional(),
  color: z.string().optional(),
  scenes: z.array(ScienceSceneSchema),
})

export const ScienceDataSchema = z.object({
  version: z.string(),
  title: z.string(),
  description: z.string().optional(),
  categories: z.array(ScienceCategorySchema).optional(),
  scenes: z.array(ScienceSceneSchema).optional(), // 兼容旧格式
})

// 社交训练（绘本阅读器 — fox-school 完整数据结构）
const BilingualText = z.union([z.string(), z.object({ zh: z.string(), en: z.string() })])

const ThoughtBubbleSchema = z.object({
  character: z.string(),
  characterColor: z.string(),
  text: BilingualText,
})

const StoryPartSchema = z.object({
  id: z.string(),
  audio: z.union([z.string(), z.object({ zh: z.string(), en: z.string() })]).optional(),
  image: z.string(),
  narration: BilingualText,
  thoughts: z.array(ThoughtBubbleSchema).optional(),
  tip: BilingualText.optional(),
  owlWisdom: BilingualText.optional(),
})

const SceneDataSchema = z.object({
  id: z.string(),
  title: z.string(),
  subtitle: z.string(),
  principle: z.string(),
  difficulty: z.number(),
  characters: z.array(z.string()),
  parts: z.array(StoryPartSchema),
  summary: z.object({
    title: z.string(),
    message: z.string().optional(),
    socialSteps: z.array(z.string()),
  }),
})

const SceneCatalogEntrySchema = z.object({
  id: z.string(),
  title: z.string(),
  principle: z.string(),
  difficulty: z.number(),
  unlocked: z.boolean(),
  coverImage: z.string(),
})

export const SocialDataSchema = z.object({
  version: z.string(),
  carnegieCatalog: z.array(SceneCatalogEntrySchema),
  socialStoryCatalog: z.array(SceneCatalogEntrySchema),
  sceneData: z.record(z.string(), SceneDataSchema),
})

// 童画廊
export const ArtworkSchema = z.object({
  id: z.string(),
  title: z.string(),
  artist: z.string().optional(),
  year: z.string().optional(),
  image: z.string().optional(),
  description: z.string().optional(),
  order: z.number().optional(),
  // 画廊扩展字段
  audio: z.string().optional(),
  artist_en: z.string().optional(),
  title_en: z.string().optional(),
  display_mode: z.string().optional(),
})

export const GalleryCategorySchema = z.object({
  id: z.string(),
  name: z.string(),
  icon: z.string().optional(),
  color: z.string().optional(),
  description: z.string().optional(),
  artworks: z.array(ArtworkSchema),
})

export const GalleryDataSchema = z.object({
  version: z.string(),
  title: z.string(),
  description: z.string().optional(),
  categories: z.array(GalleryCategorySchema).optional(),
  artworks: z.array(ArtworkSchema).optional(), // 兼容旧格式
})

// 内功养生法
export const CardSchema = z.object({
  id: z.string(),
  title: z.string(),
  subtitle: z.string().optional(),
  image: z.string().optional(),
  content: z.string().optional(),
  tips: z.array(z.string()).optional(),
  order: z.number().optional(),
})

export const NeimenCategorySchema = z.object({
  id: z.string(),
  name: z.string(),
  icon: z.string().optional(),
  color: z.string().optional(),
  cards: z.array(CardSchema),
})

export const NeimenDataSchema = z.object({
  version: z.string(),
  title: z.string(),
  description: z.string().optional(),
  categories: z.array(NeimenCategorySchema).optional(),
  cards: z.array(CardSchema).optional(), // 兼容旧格式
})

// 全局 manifest
export const ManifestSchema = z.object({
  version: z.string(),
  updatedAt: z.string().optional(),
  boards: z.record(z.string(), z.string()),
})

// 导出类型
export type Lesson = z.infer<typeof LessonSchema>
export type Section = z.infer<typeof SectionSchema>
export type MathData = z.infer<typeof MathDataSchema>
export type ScienceScene = z.infer<typeof ScienceSceneSchema>
export type ScienceCategory = z.infer<typeof ScienceCategorySchema>
export type Scene = z.infer<typeof ScienceSceneSchema> // 兼容旧引用
export type ScienceData = z.infer<typeof ScienceDataSchema>
export type SocialData = z.infer<typeof SocialDataSchema>
export type SocialSceneData = z.infer<typeof SceneDataSchema>
export type SocialStoryPart = z.infer<typeof StoryPartSchema>
export type SocialCatalogEntry = z.infer<typeof SceneCatalogEntrySchema>
export type Artwork = z.infer<typeof ArtworkSchema>
export type GalleryCategory = z.infer<typeof GalleryCategorySchema>
export type GalleryData = z.infer<typeof GalleryDataSchema>
export type Card = z.infer<typeof CardSchema>
export type NeimenCategory = z.infer<typeof NeimenCategorySchema>
export type NeimenData = z.infer<typeof NeimenDataSchema>
export type Manifest = z.infer<typeof ManifestSchema>
