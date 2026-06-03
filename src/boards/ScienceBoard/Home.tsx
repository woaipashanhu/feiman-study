/**
 * ============================================================
 *  科学可视化 — 卡片主页（动态3D预览版）
 *
 *  分类卡片内嵌 iframe 实时预览3D场景
 *  每个分类展示其下第一个场景的动态缩略图
 *  点击卡片进入分类列表页
 * ============================================================
 */
import { useNavigate } from 'react-router-dom'
import { useContentLoader } from '@/shared/hooks'
import { motion } from 'framer-motion'
import { EnvelopeSimple } from 'phosphor-react'
import type { ScienceData, ScienceCategory } from '@/types/content'

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
}

const cardVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring' as const, stiffness: 300, damping: 25 },
  },
}

export default function ScienceHome() {
  const navigate = useNavigate()
  const { data: scienceData, loading } = useContentLoader<ScienceData>({
    url: '/data/science.json',
    type: 'science',
  })

  if (loading) {
    return (
      <div className="h-full flex flex-col px-5 pt-4 pb-6">
        <div className="flex items-center justify-between mb-6">
          <div className="h-8 w-32 bg-gray-200 rounded-lg animate-pulse" />
          <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse" />
        </div>
        <div className="grid grid-cols-2 gap-4 flex-1">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  const categories = scienceData?.categories || []

  return (
    <div className="h-full flex flex-col px-5 pt-4 pb-6 overflow-y-auto">
      {/* 顶部栏 */}
      <header className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-text font-display">科学可视化</h1>
          <p className="text-sm text-text-secondary mt-1">探索科学的奥秘</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/profile')}
          className="w-11 h-11 rounded-full bg-surface border border-border flex items-center justify-center shadow-sm hover:shadow-md transition-shadow relative"
        >
          <EnvelopeSimple size={20} weight="regular" className="text-text" />
          {/* 红点提示 */}
          <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-red-500 rounded-full border-2 border-white" />
        </motion.button>
      </header>

      {/* 分类卡片网格 */}
      <motion.div
        className="grid grid-cols-2 gap-4 flex-1 content-start"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        {categories.map((cat) => (
          <CategoryCard key={cat.id} category={cat} />
        ))}
      </motion.div>
    </div>
  )
}

function CategoryCard({ category }: { category: ScienceCategory }) {
  const navigate = useNavigate()
  
  // 取该分类下第一个场景作为预览
  const previewScene = category.scenes?.[0]
  const hasPreview = previewScene?.type === 'iframe' && previewScene?.src

  return (
    <motion.button
      variants={cardVariants}
      whileHover={{ scale: 1.03, y: -4 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => navigate(`/science/category/${category.id}`)}
      className="relative rounded-2xl overflow-hidden aspect-[4/5] shadow-sm hover:shadow-lg transition-shadow text-left group"
      style={{ backgroundColor: category.color + '10' }}
    >
      {/* 3D场景预览区（上半部分） */}
      <div className="absolute inset-x-0 top-0 h-[55%] overflow-hidden bg-gray-900">
        {hasPreview ? (
          <iframe
            src={previewScene.src}
            className="w-full h-full border-0"
            style={{
              // 缩小渲染：通过scale让内容变小，再调整尺寸填满容器
              transform: 'scale(0.35)',
              transformOrigin: 'top left',
              width: '286%',  // 100/0.35 ≈ 286
              height: '286%',
              pointerEvents: 'none', // 禁止交互，点击穿透到卡片
            }}
            loading="lazy"
            title={previewScene.title}
          />
        ) : (
          /* 无预览时的渐变背景 */
          <div
            className="w-full h-full"
            style={{
              background: `radial-gradient(circle at 50% 50%, ${category.color}30 0%, ${category.color}10 100%)`,
            }}
          />
        )}
        
        {/* 顶部渐变遮罩（让文字区域更清晰） */}
        <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-gray-900/80 to-transparent" />
        
        {/* 场景数量角标 */}
        <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-black/40 backdrop-blur-sm text-[10px] text-white/90 font-medium">
          {category.scenes?.length || 0} 个场景
        </div>
      </div>

      {/* 内容区（下半部分） */}
      <div className="absolute inset-x-0 bottom-0 h-[45%] flex flex-col p-3 pt-2">
        {/* 图标 */}
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center text-lg mb-1.5"
          style={{ backgroundColor: category.color + '18', color: category.color }}
        >
          {category.icon}
        </div>

        {/* 标题和描述 */}
        <h3 className="text-sm font-bold text-text mb-0.5">{category.name}</h3>
        <p className="text-[11px] text-text-secondary line-clamp-2 leading-relaxed">
          {category.scenes?.length ? `${category.scenes.length} 个探索场景` : '暂无场景'}
        </p>
        
        {/* 预览场景名（如果有） */}
        {previewScene && (
          <p className="text-[10px] text-text-secondary/60 mt-auto truncate">
            预览: {previewScene.title}
          </p>
        )}
      </div>

      {/* 底部色条 */}
      <div
        className="absolute bottom-0 left-0 right-0 h-1"
        style={{ backgroundColor: category.color }}
      />
    </motion.button>
  )
}
