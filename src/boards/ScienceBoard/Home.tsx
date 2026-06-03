/**
 * ============================================================
 *  科学可视化 — 卡片主页（App Store Today 风格）
 *
 *  纵向堆叠大卡片，一屏展示一张完整+半张
 *  大圆角(28px)，iframe 3D实时预览
 * ============================================================
 */
import { useNavigate } from 'react-router-dom'
import { useContentLoader, useScrollMemory } from '@/shared/hooks'
import { motion } from 'framer-motion'
import { EnvelopeSimple } from 'phosphor-react'
import type { ScienceData, ScienceCategory } from '@/types/content'

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.12 },
  },
}

const cardVariants = {
  hidden: { opacity: 0, y: 40, scale: 0.96 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring' as const, stiffness: 300, damping: 28 },
  },
}

export default function ScienceHome() {
  const navigate = useNavigate()
  const { containerRef, saveScroll } = useScrollMemory()
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
        <div className="space-y-4 flex-1">
          <div className="bg-gray-100 rounded-[28px] animate-pulse h-[70vh]" />
          <div className="bg-gray-100 rounded-[28px] animate-pulse h-[40vh]" />
        </div>
      </div>
    )
  }

  const categories = scienceData?.categories || []

  return (
    <div ref={containerRef} className="h-full flex flex-col overflow-y-auto">
      {/* 顶部栏 */}
      <header className="flex items-center justify-between px-5 pt-4 pb-3 shrink-0">
        <div>
          <h1 className="text-[28px] font-bold text-text font-display leading-tight">科学可视化</h1>
          <p className="text-sm text-text-secondary mt-0.5">探索科学的奥秘</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/profile')}
          className="w-11 h-11 rounded-full bg-surface border border-border flex items-center justify-center shadow-sm hover:shadow-md transition-shadow relative"
        >
          <EnvelopeSimple size={20} weight="regular" className="text-text" />
          <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-red-500 rounded-full border-2 border-white" />
        </motion.button>
      </header>

      {/* 大卡片列表 - App Store Today 风格:卡片悬浮(左右留白),1 屏露半张下一主题 */}
      <motion.div
        className="px-3 pb-32 space-y-3"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        {categories.map((cat, index) => (
          <CategoryCard
            key={cat.id}
            category={cat}
            index={index}
            isLast={index === categories.length - 1}
            onNavigate={() => {
              saveScroll()
              navigate(`/science/category/${cat.id}`)
            }}
          />
        ))}
      </motion.div>
    </div>
  )
}

function CategoryCard({
  category,
  index,
  isLast,
  onNavigate,
}: {
  category: ScienceCategory
  index: number
  isLast: boolean
  onNavigate: () => void
}) {
  const previewScene = category.scenes?.[0]
  const hasPreview = previewScene?.type === 'iframe' && previewScene?.src

  return (
    <motion.button
      variants={cardVariants}
      whileHover={{ scale: 1.005 }}
      whileTap={{ scale: 0.99 }}
      onClick={onNavigate}
      className="relative w-full text-left overflow-hidden block shadow-2xl ring-1 ring-black/5"
      style={{
        borderRadius: '24px',
        height: isLast ? 'auto' : 'calc(100vh - 220px)',
        minHeight: '420px',
        background: `linear-gradient(160deg, ${category.color}25 0%, #1a1a2e 70%)`,
      }}
    >
      {/* 3D场景预览区（上半部分，约占65%） */}
      <div className="absolute inset-x-0 top-0 h-[65%] overflow-hidden">
        {hasPreview ? (
          <iframe
            src={previewScene.src}
            className="w-full h-full border-0"
            style={{
              transform: 'scale(0.4)',
              transformOrigin: 'top left',
              width: '250%',
              height: '250%',
              pointerEvents: 'none',
            }}
            loading="lazy"
            title={previewScene.title}
          />
        ) : (
          <div
            className="w-full h-full"
            style={{
              background: `radial-gradient(ellipse at 50% 30%, ${category.color}40 0%, ${category.color}15 50%, #1a1a2e 100%)`,
            }}
          />
        )}

        {/* 顶部渐变遮罩 */}
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#1a1a2e] to-transparent" />

        {/* 场景数量角标 */}
        <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs text-white/90 font-medium">
          {category.scenes?.length || 0} 个场景
        </div>
      </div>

      {/* 内容区（下半部分） */}
      <div className="absolute inset-x-0 bottom-0 h-[35%] flex flex-col justify-end p-6">
        {/* 分类标签 */}
        <span className="text-[13px] text-white/50 font-medium mb-1">
          {index === 0 ? '今日推荐' : `专题 ${index + 1}`}
        </span>

        {/* 标题 */}
        <h3 className="text-[28px] font-bold text-white leading-tight mb-2">
          {category.name}
        </h3>

        {/* 描述 */}
        <p className="text-[15px] text-white/60 leading-relaxed">
          {category.scenes?.length ? `${category.scenes.length} 个探索场景等你发现` : '暂无场景'}
        </p>

        {/* 底部色条 */}
        <div
          className="absolute bottom-0 left-0 right-0 h-1"
          style={{ backgroundColor: category.color }}
        />
      </div>
    </motion.button>
  )
}
