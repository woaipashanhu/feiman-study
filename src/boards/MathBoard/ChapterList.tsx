/**
 * ============================================================
 *  数学课 — 章节课程列表页
 *
 *  从卡片主页进入，展示该章节下的所有课程
 *  点击课程进入播放页
 * ============================================================
 */
import { useParams, useNavigate } from 'react-router-dom'
import { useContentLoader } from '@/shared/hooks'
import { motion } from 'framer-motion'
import { ArrowLeft, Play, Clock } from 'phosphor-react'
import type { MathData, Lesson } from '@/types/content'

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  show: {
    opacity: 1,
    x: 0,
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

  if (loading) {
    return (
      <div className="h-full flex flex-col px-5 pt-4 pb-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse" />
          <div className="h-8 w-32 bg-gray-200 rounded-lg animate-pulse" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />
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
          onClick={() => navigate('/math')}
          className="mt-4 px-4 py-2 bg-brand text-white rounded-lg text-sm"
        >
          返回主页
        </button>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col px-5 pt-4 pb-6 overflow-y-auto">
      {/* 顶部栏 */}
      <header className="flex items-center gap-3 mb-6">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/math')}
          className="w-10 h-10 rounded-full bg-surface border border-border flex items-center justify-center shadow-sm"
        >
          <ArrowLeft size={18} weight="regular" className="text-text" />
        </motion.button>
        <div>
          <h1 className="text-xl font-bold text-text font-display">{section.title}</h1>
          <p className="text-xs text-text-secondary">{lessons.length} 节课程</p>
        </div>
      </header>

      {/* 课程列表 */}
      <motion.div
        className="space-y-3"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
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
      whileHover={{ scale: 1.01, x: 4 }}
      whileTap={{ scale: 0.99 }}
      onClick={onClick}
      className="w-full flex items-center gap-4 p-3 rounded-2xl bg-surface border border-border hover:shadow-md transition-all text-left group"
    >
      {/* 序号/缩略图 */}
      <div className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0 overflow-hidden">
        {lesson.cover ? (
          <img
            src={lesson.cover}
            alt={lesson.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center text-sm font-bold"
            style={{ backgroundColor: '#3B82F612', color: '#3B82F6' }}
          >
            {index + 1}
          </div>
        )}
      </div>

      {/* 信息 */}
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-semibold text-text truncate">{lesson.title}</h3>
        <p className="text-xs text-text-secondary mt-0.5 line-clamp-1">
          {lesson.subtitle}
        </p>
        {lesson.duration && (
          <p className="text-xs text-text-tertiary mt-0.5 flex items-center gap-1">
            <Clock size={10} />
            {formatDuration(lesson.duration)}
          </p>
        )}
      </div>

      {/* 播放按钮 */}
      <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{ backgroundColor: '#3B82F618' }}>
        <Play size={16} weight="fill" style={{ color: '#3B82F6' }} />
      </div>
    </motion.button>
  )
}
