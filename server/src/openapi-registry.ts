/**
 * ============================================================
 *  openapi-registry.ts — V3.8 API 文档
 *
 *  用 zod-to-openapi 把现有 zod schema 转成 OpenAPI 3.0
 *  通过 swagger-ui-express 在 /api/docs 暴露
 *  OpenAPI JSON 在 /api/openapi.json
 *
 *  使用方式:
 *    1. 路由文件 import { registry, extendZodWithOpenApi } + z
 *    2. 路由定义 z.object({...}).openapi('SchemaName', { description: '...' })
 *    3. router.post('/login', registry.registerPath({...}), handler)
 * ============================================================
 */
import { OpenAPIRegistry, OpenApiGeneratorV3, extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi'
import { z } from 'zod'

extendZodWithOpenApi(z)

export const registry = new OpenAPIRegistry()

// =============== 通用 schema ===============

export const ErrorResponse = z.object({
  error: z.string().openapi({ example: 'not_found' }),
  message: z.string().optional().openapi({ example: '资源不存在' }),
}).openapi('ErrorResponse')

export const HealthResponse = z.object({
  ok: z.boolean().openapi({ example: true }),
  service: z.string().openapi({ example: 'feiman-letters-server' }),
  version: z.string().openapi({ example: '0.3.1' }),
  uptime: z.number().openapi({ example: 123.45 }),
  ts: z.number(),
}).openapi('HealthResponse')

// =============== Auth schemas ===============

export const RegisterRequest = z.object({
  email: z.string().email().openapi({ example: 'user@example.com' }),
  password: z.string().min(8).openapi({ example: 'mySecurePass123' }),
  nickname: z.string().min(1).max(40).openapi({ example: '小纸条用户' }),
}).openapi('RegisterRequest')

export const LoginRequest = z.object({
  email: z.string().email().openapi({ example: 'user@example.com' }),
  password: z.string().openapi({ example: 'mySecurePass123' }),
}).openapi('LoginRequest')

export const AuthSuccessResponse = z.object({
  ok: z.boolean().openapi({ example: true }),
  accessToken: z.string().openapi({ description: 'JWT access token,2h 过期' }),
  refreshToken: z.string().openapi({ description: 'JWT refresh token,30d 过期' }),
  user: z.object({
    id: z.string().uuid(),
    email: z.string().email(),
    nickname: z.string(),
    avatarUrl: z.string().nullable(),
    createdAt: z.number(),
  }),
}).openapi('AuthSuccessResponse')

export const RefreshRequest = z.object({
  refreshToken: z.string().openapi({ description: '上次登录拿到的 refreshToken' }),
}).openapi('RefreshRequest')

export const RefreshResponse = z.object({
  ok: z.boolean(),
  accessToken: z.string(),
  refreshToken: z.string(),
}).openapi('RefreshResponse')

// =============== Letter schemas ===============

const LetterKind = z.enum(['quote', 'personal', 'compose']).openapi('LetterKind')

export const Letter = z.object({
  id: z.string().uuid(),
  kind: LetterKind,
  content: z.string().openapi({ description: '信正文(纯文本)' }),
  authorNickname: z.string().nullable().openapi({ description: '作者昵称(匿名信为 null)' }),
  authorUserId: z.string().uuid().nullable().openapi({ description: '作者 userId(匿名信为 null)' }),
  bgKey: z.string().openapi({ example: 'ivory' }),
  shareToken: z.string().openapi({ description: '分享链接 token' }),
  collectCount: z.number().int().openapi({ example: 0 }),
  starCount: z.number().int().openapi({ example: 0 }),
  isStarred: z.boolean().openapi({ description: '当前用户是否 star 了这封信' }),
  createdAt: z.number().openapi({ description: 'Unix 毫秒时间戳' }),
}).openapi('Letter')

export const CreateLetterRequest = z.object({
  kind: LetterKind,
  content: z.string().min(1).max(2000).openapi({ description: '信正文,1-2000 字' }),
  bgKey: z.string().default('ivory').openapi({ example: 'ivory' }),
  authorNickname: z.string().max(40).nullable().optional(),
  quotedLetterId: z.string().uuid().optional().openapi({ description: 'V2.5 引用信 ID' }),
}).openapi('CreateLetterRequest')

export const ListLettersResponse = z.object({
  ok: z.boolean(),
  letters: z.array(Letter),
  total: z.number().int().openapi({ example: 42 }),
}).openapi('ListLettersResponse')

// =============== AI schemas ===============

export const TransformRequest = z.object({
  content: z.string().min(1).max(2000).openapi({ description: '原始信内容' }),
  mode: z.enum(['polish', 'rewrite', 'translate']).openapi({ description: '润色 / 改写 / 翻译' }),
  targetLang: z.string().optional().openapi({ example: 'en' }),
}).openapi('TransformRequest')

export const TransformResponse = z.object({
  ok: z.boolean(),
  content: z.string().openapi({ description: 'AI 处理后的内容' }),
  fallback: z.boolean().openapi({ description: 'true = LongCat 失败,降级 mock' }),
}).openapi('TransformResponse')

// =============== Inbox ===============

export const InboxResponse = z.object({
  ok: z.boolean(),
  user: z.object({
    id: z.string().uuid(),
    email: z.string().email(),
    nickname: z.string(),
    avatarUrl: z.string().nullable(),
    createdAt: z.number(),
  }).nullable(),
  letters: z.array(Letter),
}).openapi('InboxResponse')

// =============== Generate OpenAPI doc ===============

export function generateOpenAPIDocument() {
  const generator = new OpenApiGeneratorV3(registry.definitions)
  return generator.generateDocument({
    openapi: '3.0.3',
    info: {
      title: '小纸条 V3 API',
      version: '0.3.1',
      description: '费曼 V3 小纸条后端 API 文档。\n\n**Auth**: 大部分端点需要 `Authorization: Bearer <access_token>` 头。Token 通过 `/api/auth/login` 获取,2h 过期,过期前 5 分钟客户端会自动用 `/api/auth/refresh` 续期。',
    },
    servers: [
      { url: 'https://47.99.101.168:8890', description: '生产服务器' },
      { url: 'http://localhost:3000', description: '本地开发' },
    ],
    tags: [
      { name: 'Health', description: '健康检查' },
      { name: 'Auth', description: '注册/登录/JWT/头像' },
      { name: 'Letters', description: '小纸条 CRUD + 收藏/星标' },
      { name: 'AI', description: 'AI 润色/改写/翻译(LongCat)' },
      { name: 'Inbox', description: '当前用户收件箱' },
    ],
  })
}
