/**
 * ============================================================
 *  图标注册表 — 防止拼写错误的类型安全方案
 *
 *  设计思路:
 *    1. 所有合法的图标名称在这里集中定义（Single Source of Truth）
 *    2. 导出 BoardIconName 类型，供 useBoardStore 等使用
 *    3. TabBar 用这个 registry 渲染，不再维护两份映射
 *    4. pre-deploy-check 脚本可以校验 board.icon 是否都在此列表中
 *
 *  新增板块图标时:
 *    1. 在 ICON_REGISTRY 中添加导入和条目
 *    2. useBoardStore 中用新的 icon name（有 TS 自动补全）
 *    3. 完事！不用再去改 TabBar
 * ============================================================
 */
import {
  Calculator,
  Atom,
  BookOpen,
  Image,
  Sparkle,
} from 'phosphor-react'
import type { ComponentType } from 'react'

export interface IconProps {
  size?: number | string
  weight?: 'thin' | 'light' | 'regular' | 'bold' | 'fill' | 'duotone'
  color?: string
  style?: React.CSSProperties
  className?: string
}

/** 所有可用的面板图标名称 — 唯一真实来源 */
export type BoardIconName = 'Calculator' | 'Atom' | 'BookOpen' | 'Image' | 'Sparkle'

/** 完整的图标名集合（运行时校验用） */
export const VALID_ICON_NAMES: readonly BoardIconName[] = [
  'Calculator',
  'Atom',
  'BookOpen',
  'Image',
  'Sparkle',
] as const

/** 图标名称 → 组件的映射 */
const registry: Record<BoardIconName, ComponentType<IconProps>> = {
  Calculator,
  Atom,
  BookOpen,
  Image,
  Sparkle,
}

/**
 * 根据名称获取图标组件
 * 如果名称不在 registry 中，返回 null 并在开发环境打印警告
 */
export function getIcon(name: string): ComponentType<IconProps> | null {
  if (name in registry) {
    return registry[name as BoardIconName]
  }

  // 开发环境下给出明确的错误提示
  // @ts-ignore — 浏览器环境可能没有 process（但不影响运行时行为）
  if (typeof process !== 'undefined' && (process as any).env?.NODE_ENV !== 'production') {
    console.error(
      `[icon-registry] 无效的图标名: "${name}"\n` +
      `  可用的图标: ${VALID_ICON_NAMES.join(', ')}\n` +
      `  请检查 useBoardStore.ts 中的 boardsData 配置`
    )
  }

  return null
}

/** 获取所有已注册的图标（备用） */
export { registry as iconRegistry }
