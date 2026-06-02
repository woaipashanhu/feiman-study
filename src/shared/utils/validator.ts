import { z } from 'zod'
import {
  MathDataSchema,
  ScienceDataSchema,
  SocialDataSchema,
  GalleryDataSchema,
  NeimenDataSchema,
  ManifestSchema,
} from '@/types/content'

const schemaMap = {
  math: MathDataSchema,
  science: ScienceDataSchema,
  social: SocialDataSchema,
  gallery: GalleryDataSchema,
  neimen: NeimenDataSchema,
  manifest: ManifestSchema,
}

export type ContentType = keyof typeof schemaMap

export function validateContent<T>(
  type: ContentType,
  data: unknown
): { success: true; data: T } | { success: false; error: string } {
  const schema = schemaMap[type]
  if (!schema) {
    return { success: false, error: `未知的内容类型: ${type}` }
  }

  const result = schema.safeParse(data)

  if (result.success) {
    return { success: true, data: result.data as T }
  } else {
    const issues = result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`)
    return { success: false, error: issues.join('; ') }
  }
}

// 降级数据
export function getFallbackContent(type: ContentType) {
  const fallbacks = {
    math: { version: 'fallback', title: '数学课', playauthApi: '', vodRegion: 'cn-shanghai', sections: [] },
    science: { version: 'fallback', title: '科学可视化', categories: [], scenes: [] },
    social: { version: 'fallback', carnegieCatalog: [], socialStoryCatalog: [], sceneData: {} },
    gallery: { version: 'fallback', title: '童画廊', categories: [], artworks: [] },
    neimen: { version: 'fallback', title: '内功养生法', categories: [], cards: [] },
    manifest: { version: 'fallback', boards: {} },
  }
  return fallbacks[type]
}

// z is used for type inference in content.ts schemas
export { z }
