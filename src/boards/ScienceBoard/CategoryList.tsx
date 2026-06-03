/**
 * ============================================================
 *  科学可视化 — 分类场景列表页（动态3D预览版）
 *
 *  每个场景卡片左侧嵌入 iframe 实时预览3D场景
 *  点击场景进入全屏3D播放页
 * ============================================================
 */
import { useParams, useNavigate } from 'react-router-dom'
import { useContentLoader } from '@/shared/hooks'
import { motion } from 'framer-motion'
import { ArrowLeft, Play } from 'phosphor-react'
import type { ScienceData, ScienceScene } from '@/types/content'

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

export default function ScienceCategoryList() {
  const { categoryId } = useParams<{ categoryId: string }>()
  const navigate = useNavigate()
  const { data: scienceData, loading } = useContentLoader<ScienceData>({
    url: '/data/science.json',
    type: 'science',
  })

  const category = scienceData?.categories?.find((c) => c.id === categoryId)
  const scenes = category?.scenes || []

  if (loading) {
    return (
      <div className="h-full flex flex-col px-5 pt-4 pb-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse" />
          <div className="h-8 w-32 bg-gray-200 rounded-lg animate-pulse" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (!category) {
    return (
      <div className="h-full flex flex-col items-center justify-center px-5">
        <p className="text-text-secondary">分类不存在</p>
        <button
          onClick={() => navigate('/science')}
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
          onClick={() => navigate('/science')}
          className="w-10 h-10 rounded-full bg-surface border border-border flex items-center justify-center shadow-sm"
        >
          <ArrowLeft size={18} weight="regular" className="text-text" />
        </motion.button>
        <div className="flex items-center gap-2">
          <span className="text-xl">{category.icon}</span>
          <h1 className="text-xl font-bold text-text font-display">{category.name}</h1>
        </div>
      </header>

      {/* 场景列表 */}
      <motion.div
        className="space-y-3"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        {scenes.map((scene, index) => (
          <SceneListItem
            key={scene.id}
            scene={scene}
            index={index}
            categoryColor={category.color || '#3B82F6'}
            onClick={() => navigate(`/science/${scene.id}`)}
          />
        ))}
      </motion.div>
    </div>
  )
}

function SceneListItem({
  scene,
  index,
  categoryColor,
  onClick,
}: {
  scene: ScienceScene
  index: number
  categoryColor: string
  onClick: () => void
}) {
  const hasPreview = scene.type === 'iframe' && scene.src

  return (
    <motion.button
      variants={itemVariants}
      whileHover={{ scale: 1.01, x: 4 }}
      whileTap={{ scale: 0.99 }}
      onClick={onClick}
      className="w-full flex items-center gap-4 p-3 rounded-2xl bg-surface border border-border hover:shadow-md transition-all text-left group overflow-hidden"
    >
      {/* 3D场景预览区（替代缩略图） */}
      <div
        className="w-24 h-20 rounded-xl overflow-hidden shrink-0 relative bg-gray-900"
      >
        {hasPreview ? (
          <iframe
            src={scene.src}
            className="absolute inset-0 border-0"
            style={{
              transform: 'scale(0.25)',
              transformOrigin: 'top left',
              width: '400%',
              height: '400%',
              pointerEvents: 'none',
            }}
            loading="lazy"
            title={scene.title}
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{
              background: `radial-gradient(circle at 50% 50%, ${categoryColor}30 0%, ${categoryColor}10 100%)`,
            }}
          >
            <span className="text-lg font-bold" style={{ color: categoryColor }}>
              {index + 1}
            </span>
          </div>
        )}
      </div>

      {/* 信息 */}
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-semibold text-text truncate">{scene.title}</h3>
        <p className="text-xs text-text-secondary mt-0.5 line-clamp-2 leading-relaxed">
          {scene.description}
        </p>
        <div className="flex items-center gap-2 mt-1.5">
          {scene.difficulty && (
            <span
              className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
              style={{
                backgroundColor: categoryColor + '15',
                color: categoryColor,
              }}
            >
              {scene.difficulty}
            </span>
          )}
          {scene.duration && (
            <span className="text-[10px] text-text-secondary/60">
              {scene.duration}
            </span>
          )}
        </div>
      </div>

      {/* 播放按钮 */}
      <div
        className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ backgroundColor: categoryColor + '18' }}
      >
        <Play size={16} weight="fill" style={{ color: categoryColor }} />
      </div>
    </motion.button>
  )
}
