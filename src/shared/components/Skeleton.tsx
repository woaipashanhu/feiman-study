/**
 * ============================================================
 *  Skeleton — 骨架屏组件
 *
 *  功能：
 *    - 替代 LoadingScreen 的全屏 spinner
 *    - 提供多种预设：卡片、列表、详情页
 *    - CSS shimmer 动画（灰色闪烁条）
 * ============================================================
 */
import { motion } from 'framer-motion'

/** 基础闪烁动画的骨架块 */
function Shimmer({ className = '', style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div
      className={`rounded-lg shimmer-bg ${className}`}
      style={style}
    />
  )
}

// ===== 预设模板 =====

/** 页面头部骨架（标题 + 副标题） */
export function SkeletonHeader() {
  return (
    <div className="space-y-2 px-1 mb-6">
      <Shimmer className="h-7 w-48" />
      <Shimmer className="h-4 w-72" />
    </div>
  )
}

/** 分类标题骨架 */
export function SkeletonCategoryTitle() {
  return (
    <div className="flex items-center gap-2 mb-3 px-1">
      <Shimmer className="w-6 h-6 rounded-full" />
      <Shimmer className="h-5 w-24" />
      <Shimmer className="h-4 w-10 ml-auto" />
    </div>
  )
}

/**
 * 卡片网格骨架（画廊风格 — 2 列图片卡片）
 */
export function SkeletonCardGrid({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          className="rounded-xl overflow-hidden bg-surface border border-border shadow-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: i * 0.05 }}
        >
          <Shimmer className="aspect-[4/3] w-full rounded-t-xl" />
          <div className="p-3 space-y-1.5">
            <Shimmer className="h-4 w-3/4" />
            <Shimmer className="h-3 w-1/2" />
          </div>
        </motion.div>
      ))}
    </div>
  )
}

/**
 * 列表行骨架（科学板风格 — 横向列表项）
 */
export function SkeletonListRows({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          className="flex items-center gap-3 p-3 sm:p-4 rounded-xl bg-surface border border-border shadow-sm"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.05 }}
        >
          <Shimmer className="w-11 h-11 rounded-xl flex-shrink-0" />
          <Shimmer className="w-16 h-12 rounded-lg flex-shrink-0" />
          <div className="min-w-0 flex-1 space-y-2">
            <Shimmer className="h-4 w-2/3" />
            <Shimmer className="h-3 w-1/2" />
            <Shimmer className="h-3 w-16" />
          </div>
          <Shimmer className="w-4 h-4 rounded-full flex-shrink-0" />
        </motion.div>
      ))}
    </div>
  )
}

/**
 * 内功卡片骨架（带顶部色条的卡片）
 */
export function SkeletonNeimenCards({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          className="rounded-xl overflow-hidden bg-surface border border-border shadow-sm"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
        >
          <Shimmer className="h-1.5 w-full" style={{ backgroundColor: '#e8eaf0' }} />
          <div className="p-4 space-y-2.5">
            <div className="flex items-start gap-3">
              <Shimmer className="w-14 h-14 rounded-xl flex-shrink-0" />
              <div className="min-w-0 flex-1 space-y-2">
                <Shimmer className="h-4 w-3/4" />
                <Shimmer className="h-3 w-1/3" />
              </div>
              <Shimmer className="w-4 h-4 rounded-full flex-shrink-0" />
            </div>
            <Shimmer className="h-3 w-full" />
            <Shimmer className="h-3 w-2/3" />
          </div>
        </motion.div>
      ))}
    </div>
  )
}

/**
 * 详情页骨架（通用）
 */
export function SkeletonDetail() {
  return (
    <div className="max-w-2xl mx-auto space-y-4 p-4">
      <div className="flex items-center gap-2 mb-4">
        <Shimmer className="w-8 h-8 rounded-lg" />
        <Shimmer className="h-5 w-20" />
      </div>
      <Shimmer className="h-7 w-3/4" />
      <Shimmer className="h-4 w-1/2" />
      <Shimmer className="aspect-video w-full rounded-2xl" />
      <div className="space-y-2">
        <Shimmer className="h-4 w-full" />
        <Shimmer className="h-4 w-full" />
        <Shimmer className="h-4 w-2/3" />
      </div>
    </div>
  )
}

// ===== 组合式完整页面骨架 =====

/** 骨架屏主组件 — 根据类型自动选择模板 */
interface SkeletonProps {
  type?: 'list' | 'gallery' | 'neimen' | 'detail' | 'header'
  count?: number
  showHeader?: boolean
  showCategory?: boolean
  categoryCount?: number
}

export function Skeleton({
  type = 'list',
  count = 3,
  showHeader = true,
  showCategory = true,
  categoryCount = 1,
}: SkeletonProps) {
  if (type === 'detail') {
    return <SkeletonDetail />
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      {showHeader && <SkeletonHeader />}

      {Array.from({ length: categoryCount }).map((_, catIdx) => (
        <section key={catIdx}>
          {showCategory && <SkeletonCategoryTitle />}
          {type === 'gallery' && <SkeletonCardGrid count={count} />}
          {type === 'list' && <SkeletonListRows count={count} />}
          {type === 'neimen' && <SkeletonNeimenCards count={count} />}
        </section>
      ))}
    </div>
  )
}
