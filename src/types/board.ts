import type { BoardIconName } from '@/shared/components/icon-registry'

export interface BoardConfig {
  id: string
  name: string
  path: string
  icon: BoardIconName  // ← 类型约束！拼写错误会直接 TS 报红
  color: string
  description: string
}
