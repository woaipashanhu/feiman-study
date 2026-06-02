/**
 * ============================================================
 *  社交绘本 — 分类场景列表页
 *
 *  从卡片主页进入，展示该分类下的所有绘本
 *  点击绘本进入播放器
 * ============================================================
 */
import { useParams, useNavigate } from 'react-router-dom'
import { useContentLoader } from '@/shared/hooks'
import { motion } from 'framer-motion'
import { ArrowLeft, Play } from 'phosphor-react'
import type { SocialData } from '@/types/content'
import type { SceneCatalogEntry } from './types'

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

export default function SocialCategoryList() {
  const { categoryId } = useParams<{ categoryId: string }>()
  const navigate = useNavigate()
  const { data: socialData, loading } = useContentLoader<SocialData>({
    url: '/data/social-scenes.json',
    type: 'social',
  })

  const isCarnegie = categoryId === 'carnegie'
  const scenes = isCarnegie
    ? socialData?.carnegieCatalog || []
    : socialData?.socialStoryCatalog || []

  const categoryColor = isCarnegie ? '#FF9F43' : '#A55EEA'
  const categoryName = isCarnegie ? '卡耐基社交智慧' : '社交故事'

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

  return (
    <div className="h-full flex flex-col px-5 pt-4 pb-6 overflow-y-auto">
      {/* 顶部栏 */}
      <header className="flex items-center gap-3 mb-6">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/social')}
          className="w-10 h-10 rounded-full bg-surface border border-border flex items-center justify-center shadow-sm"
        >
          <ArrowLeft size={18} weight="regular" className="text-text" />
        </motion.button>
        <h1 className="text-xl font-bold text-text font-display">{categoryName}</h1>
      </header>

      {/* 绘本列表 */}
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
            categoryColor={categoryColor}
            onClick={() => navigate(`/social/scene/${scene.id}`)}
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
  scene: SceneCatalogEntry
  index: number
  categoryColor: string
  onClick: () => void
}) {
  return (
    <motion.button
      variants={itemVariants}
      whileHover={{ scale: 1.01, x: 4 }}
      whileTap={{ scale: 0.99 }}
      onClick={onClick}
      className={`w-full flex items-center gap-4 p-3 rounded-2xl bg-surface border border-border hover:shadow-md transition-all text-left group ${
        !scene.unlocked ? 'opacity-40 pointer-events-none' : ''
      }`}
    >
      {/* 序号 */}
      <div
        className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0 text-sm font-bold text-white"
        style={{ background: `linear-gradient(135deg, ${categoryColor}, ${categoryColor}DD)` }}
      >
        {String(index + 1).padStart(2, '0')}
      </div>

      {/* 封面图 */}
      {scene.coverImage && (
        <div className="w-16 h-12 rounded-lg overflow-hidden bg-border-light shrink-0">
          <img
            src={scene.coverImage.startsWith('/') ? scene.coverImage : '/' + scene.coverImage}
            alt={scene.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
      )}

      {/* 信息 */}
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-semibold text-text truncate">{scene.title}</h3>
        <p className="text-xs text-text-secondary mt-0.5 line-clamp-1">{scene.principle}</p>
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
