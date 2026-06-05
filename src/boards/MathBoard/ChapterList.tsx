/**
 * ============================================================
 *  数学课 — 章节课程列表页（App Store Today 风格）
 *
 *  顶部 45vh Banner + 标题区 + App Store 风格分隔线列表
 *  关闭按钮在右上角（圆形叉号）
 *  缩放展开/收起动画
 * ============================================================
 */
import { useParams, useNavigate } from 'react-router-dom'
import { useContentLoader } from '@/shared/hooks'
import { motion } from 'framer-motion'
import { X, CaretRight, Clock } from 'phosphor-react'
import type { MathData, Lesson } from '@/types/content'
import { MathThumbnails } from './MathThumbnails'
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

  const handleClose = () => {
    navigate('/math')
  }

  if (loading) {
    return (
      <div className="h-full flex flex-col bg-bg">
        <div className="h-[45vh] bg-gray-100 animate-pulse" />
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
      {/* 顶部 Banner - 45vh, 大图标 + 渐变 */}
      <div className="relative shrink-0" style={{ height: '45vh', minHeight: '320px' }}>
        <div
          className="absolute inset-0 overflow-hidden"
          style={{
            background: `linear-gradient(160deg, #3B82F660 0%, #1a1a2e 80%)`,
          }}
        >
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full blur-3xl opacity-30"
            style={{ backgroundColor: '#3B82F6' }}
          />
          <div className="absolute inset-0 flex items-center justify-center text-[140px] drop-shadow-2xl">
            📐
          </div>

          <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-bg to-transparent pointer-events-none" />
          <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/30 to-transparent pointer-events-none" />
        </div>

        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={handleClose}
          className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/25 backdrop-blur-md border border-white/10 flex items-center justify-center z-20"
        >
          <X size={18} weight="bold" className="text-white" />
        </motion.button>

        {/* 顶部 4 横排缩略图(Banner 内部,顶部 padding) */}
        {lessons.length > 0 && (
          <div className="absolute top-3 left-5 right-16 z-10">
            <MathThumbnails
              lessons={lessons}
              showLabel={false}
              size={56}
            />
          </div>
        )}

        <div className="absolute inset-x-0 bottom-0 p-5 pb-6">
          <span className="text-[13px] text-white/50 font-medium">
            {lessons.length} 节课程
          </span>
          <h1 className="text-[32px] font-bold text-white leading-tight mt-1">
            {section.title}
          </h1>
          <p className="text-[15px] text-white/60 mt-2 leading-relaxed">
            费曼讲数学,让孩子爱上思考
          </p>
        </div>
      </div>

      {/* 课程列表 - App Store Today 风格 */}
      <div className="px-5 pt-2 pb-6">
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
