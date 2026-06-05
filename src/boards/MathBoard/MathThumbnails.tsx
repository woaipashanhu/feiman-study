/**
 * ============================================================
 *  数学课缩略图横排 — 4 个视频/数字动画
 *
 *  用于:
 *  - Home 顶部:在 1 大卡片上方展示
 *  - ChapterList 顶部:Banner 内展示
 *
 *  设计:
 *  - 4 个 1:1 缩略图横排,间距 8px
 *  - 每个缩略图是 1 个视频预览,或 fallback 大数字
 *  - 整体有"前 4 节"角标
 *  - 横排下方有微小的渐入文字"前 4 节"
 *
 *  Fallback 设计(无 src 时):
 *  - 大数字 (1, 2, 3, 4) 在方块内淡入淡出
 *  - 数字下方有 1 个小算式 "1 + 0" 滑过
 *  - 给"活感",但零成本
 * ============================================================
 */
import { motion } from 'framer-motion'
import { VideoPreview } from './VideoPreview'
import type { Lesson } from '@/types/content'

export interface MathThumbnailsProps {
  lessons: Lesson[]
  /** 是否显示标题("前 4 节") */
  showLabel?: boolean
  /** 缩略图大小,默认 72px */
  size?: number
  className?: string
}

export function MathThumbnails({
  lessons,
  showLabel = true,
  size = 72,
  className = '',
}: MathThumbnailsProps) {
  const items = lessons.slice(0, 4)
  if (items.length === 0) return null

  return (
    <div className={className}>
      {showLabel && (
        <div className="flex items-center justify-between mb-2 px-1">
          <span className="text-[11px] text-white/60 font-semibold uppercase tracking-wider">
            课程预览
          </span>
          <span className="text-[10px] text-white/40 font-medium">
            前 {items.length} 节
          </span>
        </div>
      )}

      <div className="flex gap-2">
        {items.map((lesson, idx) => (
          <motion.div
            key={lesson.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.06, type: 'spring', stiffness: 280, damping: 24 }}
            className="shrink-0"
            style={{ width: size, height: size }}
          >
            <VideoPreview
              src={lesson.previewUrl}
              poster={lesson.cover}
              fallbackColor="#3B82F6"
              rounded={14}
              className="w-full h-full"
              fallback={<NumberFallback index={idx} />}
            />
          </motion.div>
        ))}
      </div>
    </div>
  )
}

/**
 * 单个缩略图内部的数字动画(无视频源时)
 * 大数字淡入淡出,下方有算式滑过
 */
function NumberFallback({ index }: { index: number }) {
  // 每节用不同数字,模拟"算术"
  const baseNum = index + 1
  const partner = index === 0 ? 0 : (index + 2) % 5
  const display = `${baseNum} + ${partner}`

  return (
    <div className="w-full h-full flex flex-col items-center justify-center text-blue-500 font-bold">
      <motion.div
        key={`num-${index}`}
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, repeat: Infinity, repeatType: 'reverse', repeatDelay: 0.4 }}
        className="text-[28px] leading-none"
      >
        {baseNum}
      </motion.div>
      <motion.div
        key={`eq-${index}`}
        initial={{ opacity: 0, x: -3 }}
        animate={{ opacity: 0.5, x: 0 }}
        transition={{ duration: 0.8, repeat: Infinity, repeatType: 'reverse', repeatDelay: 0.6 }}
        className="text-[8px] mt-0.5 font-mono"
      >
        {display}
      </motion.div>
    </div>
  )
}
