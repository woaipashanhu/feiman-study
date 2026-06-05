/**
 * ============================================================
 *  数学课 — 章节课程列表页（App Store Today 风格）
 *
 *  顶部大卡片（2x2预览网格 + 文字区）+ App Store 风格分隔线列表
 *  从首页大卡片"展开"而来，设计语言一致
 *  关闭按钮在右上角（圆形叉号）
 *  缩放展开/收起动画
 * ============================================================
 */
import { useParams, useNavigate } from 'react-router-dom'
import { useContentLoader } from '@/shared/hooks'
import { motion } from 'framer-motion'
import { X, CaretRight, Clock } from 'phosphor-react'
import type { MathData, Lesson } from '@/types/content'
import { VideoPreview } from './VideoPreview'

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring' as const, stiffness: 300, damping: 25 },
  },
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export default function MathChapterList() {
  const { sectionId } = useParams<{ sectionId: string }>()
  const navigate = useNavigate()
  const { data: mathData, loading } = useContentLoader<MathData>({
    url: '/data/math.json',
    type: 'math',
  })

  const section = mathData?.sections?.find((s) => s.id === sectionId)
  const lessons = section?.lessons || []
  const previewLessons = lessons.slice(0, 4)

  const handleClose = () => {
    navigate('/math')
  }

  if (loading) {
    return (
      <div className="h-full flex flex-col bg-bg">
        <div className="px-4 pt-4">
          <div
            className="w-full rounded-[20px] overflow-hidden animate-pulse"
            style={{ height: 'calc(100vh - 360px)', minHeight: '340px' }}
          >
            <div className="h-[60%] bg-gray-200" />
            <div className="h-[40%] bg-gray-100 p-5 space-y-3">
              <div className="h-3 w-16 bg-gray-200 rounded" />
              <div className="h-6 w-3/4 bg-gray-200 rounded" />
              <div className="h-3 w-1/2 bg-gray-200 rounded" />
            </div>
          </div>
        </div>
        <div className="px-5 py-4 space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (!section) {
    return (
      <div className="h-full flex flex-col items-center justify-center px-5">
        <p className="text-text-secondary">章节不存在</p>
        <button
          onClick={handleClose}
          className="mt-4 px-4 py-2 bg-brand text-white rounded-lg text-sm"
        >
          返回主页
        </button>
      </div>
    )
  }

  return (
    <motion.div
      className="h-full flex flex-col overflow-y-auto bg-bg"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      {/* 顶部大卡片 — 从首页卡片"展开"而来 */}
      <div className="px-4 pt-4 shrink-0">
        <div
          className="w-full rounded-[20px] overflow-hidden shadow-lg ring-1 ring-black/5 relative"
          style={{ height: 'calc(100vh - 360px)', minHeight: '340px' }}
        >
          {/* 上半部分 — 2x2课程预览网格 */}
          <div className="relative h-[60%] overflow-hidden">
            <div
              className="absolute inset-0"
              style={{
                background: `linear-gradient(160deg, #3B82F620 0%, #0f172a 70%)`,
              }}
            />
            <div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 rounded-full blur-3xl opacity-20"
              style={{ backgroundColor: '#3B82F6' }}
            />

            {/* 2x2 预览网格 */}
            {previewLessons.length > 0 && (
              <div className="absolute inset-3 grid grid-cols-2 grid-rows-2 gap-2 z-10">
                {previewLessons.map((lesson, idx) => (
                  <motion.div
                    key={lesson.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 + idx * 0.06, type: 'spring', stiffness: 300, damping: 25 }}
                    className="relative rounded-xl overflow-hidden bg-gray-900/50"
                    onClick={() => navigate(`/math/lesson/${lesson.id}`)}
                  >
                    <VideoPreview
                      src={lesson.previewUrl}
                      poster={lesson.cover}
                      fallbackColor="#3B82F6"
                      rounded={12}
                      className="w-full h-full"
                      fallback={
                        <span className="text-xl font-bold" style={{ color: '#3B82F6' }}>
                          {idx + 1}
                        </span>
                      }
                    />
                    {/* 序号角标 */}
                    <div className="absolute top-1.5 left-1.5 w-5 h-5 rounded-md bg-black/40 backdrop-blur-sm flex items-center justify-center">
                      <span className="text-[10px] font-bold text-white">{idx + 1}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {/* 顶部渐变遮罩 */}
            <div className="absolute inset-x-0 top-0 h-12 bg-gradient-to-b from-black/20 to-transparent pointer-events-none z-20" />
          </div>

          {/* 下半部分 — 文字信息 */}
          <div className="relative h-[40%] flex flex-col justify-end p-5 pb-5">
            {/* 渐变过渡 */}
            <div className="absolute inset-x-0 top-0 h-12 bg-gradient-to-b from-black/30 to-transparent pointer-events-none" />

            <div className="relative z-10">
              {/* 小标签 */}
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-[11px] font-medium text-blue-500/70 tracking-wide">
                  今日推荐
                </span>
                <span className="text-[11px] text-text-tertiary px-1.5 py-0.5 rounded-md bg-black/5">
                  {lessons.length} 节课程
                </span>
              </div>

              {/* 大标题 */}
              <h1 className="text-[26px] font-bold text-text leading-tight">
                {section.title}
              </h1>

              {/* 描述 */}
              <p className="text-[13px] text-text-secondary mt-1.5 leading-relaxed line-clamp-2">
                费曼讲数学，让孩子爱上思考
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 关闭按钮 — 页面右上角，浮于卡片上方 */}
      <motion.button
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={handleClose}
        className="fixed top-4 right-4 w-10 h-10 rounded-full bg-white/80 backdrop-blur-md border border-black/5 shadow-sm flex items-center justify-center z-50"
      >
        <X size={18} weight="bold" className="text-text" />
      </motion.button>

      {/* 课程列表 — App Store Today 风格 */}
      <div className="px-5 pt-5 pb-6">
        <h2 className="text-[13px] text-text-tertiary font-medium uppercase tracking-wider mb-2 px-1">
          全部课程
        </h2>
        <motion.div variants={containerVariants} initial="hidden" animate="show">
          {lessons.map((lesson, index) => (
            <LessonListItem
              key={lesson.id}
              lesson={lesson}
              index={index}
              onClick={() => navigate(`/math/lesson/${lesson.id}`)}
            />
          ))}
        </motion.div>
      </div>
    </motion.div>
  )
}

function LessonListItem({
  lesson,
  index,
  onClick,
}: {
  lesson: Lesson
  index: number
  onClick: () => void
}) {
  return (
    <motion.button
      variants={itemVariants}
      whileTap={{ scale: 0.99 }}
      onClick={onClick}
      className="w-full flex items-center gap-4 py-3.5 text-left active:bg-gray-50 transition-colors border-b border-border/40 last:border-b-0"
    >
      {/* 缩略图 - 64x64 iOS Squircle,支持视频预览(滚动到可见才播) */}
      <div className="w-16 h-16 rounded-[14px] overflow-hidden shrink-0 bg-gray-100">
        <VideoPreview
          src={lesson.previewUrl}
          poster={lesson.cover}
          fallbackColor="#3B82F6"
          rounded={14}
          className="w-full h-full"
          fallback={
            <span className="text-sm font-bold" style={{ color: '#3B82F6' }}>
              {index + 1}
            </span>
          }
        />
      </div>

      {/* 信息 */}
      <div className="flex-1 min-w-0">
        <h3 className="text-[17px] font-semibold text-text leading-tight truncate">
          {lesson.title}
        </h3>
        <p className="text-[13px] text-text-secondary mt-1 line-clamp-1 leading-relaxed">
          {lesson.subtitle || '费曼讲数学'}
        </p>
        {lesson.duration && (
          <span className="inline-flex items-center gap-1 mt-1 text-[10px] px-1.5 py-0.5 rounded-md font-medium bg-blue-50 text-blue-600">
            <Clock size={9} weight="regular" />
            {formatDuration(lesson.duration)}
          </span>
        )}
      </div>

      {/* 右侧箭头 */}
      <CaretRight size={18} weight="bold" className="text-text-tertiary shrink-0" />
    </motion.button>
  )
}
