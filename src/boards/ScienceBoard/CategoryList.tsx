/**
 * ============================================================
 *  科学可视化 — 分类场景列表页（App Store Today 风格）
 *
 *  顶部大Banner + 信息流列表
 *  关闭按钮在右上角（圆形叉号）
 *  返回时记忆首页滚动位置
 * ============================================================
 */
import { useParams, useNavigate } from 'react-router-dom'
import { useContentLoader } from '@/shared/hooks'
import { motion } from 'framer-motion'
import { X, CaretRight } from 'phosphor-react'
import type { ScienceData, ScienceScene } from '@/types/content'

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

export default function ScienceCategoryList() {
  const { categoryId } = useParams<{ categoryId: string }>()
  const navigate = useNavigate()
  const { data: scienceData, loading } = useContentLoader<ScienceData>({
    url: '/data/science.json',
    type: 'science',
  })

  const category = scienceData?.categories?.find((c) => c.id === categoryId)
  const scenes = category?.scenes || []

  // 取第一个场景作为Banner预览
  const bannerScene = scenes[0]
  const hasBannerPreview = bannerScene?.type === 'iframe' && bannerScene?.src

  const handleClose = () => {
    navigate('/science')
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

  if (!category) {
    return (
      <div className="h-full flex flex-col items-center justify-center px-5">
        <p className="text-text-secondary">分类不存在</p>
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
      {/* 顶部Banner区域 */}
      <div className="relative shrink-0" style={{ height: '45vh', minHeight: '320px' }}>
        {/* Banner背景 - iframe 3D预览 */}
        <div className="absolute inset-0 overflow-hidden bg-gray-900">
          {hasBannerPreview ? (
            <iframe
              src={bannerScene.src}
              className="w-full h-full border-0"
              style={{
                transform: 'scale(0.5)',
                transformOrigin: 'top left',
                width: '200%',
                height: '200%',
                pointerEvents: 'none',
              }}
              loading="lazy"
              title={bannerScene.title}
            />
          ) : (
            <div
              className="w-full h-full"
              style={{
                background: `radial-gradient(ellipse at 50% 30%, ${category.color}50 0%, ${category.color}20 50%, #1a1a2e 100%)`,
              }}
            />
          )}

          {/* 渐变遮罩(加高到 48px,让 Banner 文字完全在渐变区内,不被列表底色"切割") */}
          <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-bg to-transparent pointer-events-none" />
          <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/30 to-transparent pointer-events-none" />
        </div>

        {/* 关闭按钮 - 右上角圆形叉号 */}
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

        {/* Banner文字内容 */}
        <div className="absolute inset-x-0 bottom-0 p-5 pb-6">
          <span className="text-[13px] text-white/50 font-medium">
            {category.scenes?.length || 0} 个探索场景
          </span>
          <h1 className="text-[32px] font-bold text-white leading-tight mt-1">
            {category.name}
          </h1>
          <p className="text-[15px] text-white/60 mt-2 leading-relaxed">
            {category.scenes?.length ? '探索科学的奇妙世界' : '暂无场景'}
          </p>
        </div>
      </div>

      {/* 场景列表 — App Store Today 风格:1px 分隔线 + 简洁布局 */}
      <div className="px-5 pt-2 pb-6">
        <h2 className="text-[13px] text-text-tertiary font-medium uppercase tracking-wider mb-2 px-1">
          全部场景
        </h2>
        <motion.div
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
    </motion.div>
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
      whileTap={{ scale: 0.99 }}
      onClick={onClick}
      className="w-full flex items-center gap-4 py-3.5 text-left active:bg-gray-50 transition-colors border-b border-border/40 last:border-b-0"
    >
      {/* 3D场景预览 - 64x64 iOS Squircle */}
      <div className="w-16 h-16 rounded-[14px] overflow-hidden shrink-0 relative bg-gray-900">
        {hasPreview ? (
          <iframe
            src={scene.src}
            className="absolute inset-0 border-0"
            style={{
              transform: 'scale(0.18)',
              transformOrigin: 'top left',
              width: '555%',
              height: '555%',
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
        <h3 className="text-[17px] font-semibold text-text leading-tight truncate">
          {scene.title}
        </h3>
        <p className="text-[13px] text-text-secondary mt-1 line-clamp-2 leading-relaxed">
          {scene.description}
        </p>
        {scene.difficulty && (
          <span
            className="inline-block mt-1.5 text-[10px] px-1.5 py-0.5 rounded-md font-medium"
            style={{
              backgroundColor: categoryColor + '15',
              color: categoryColor,
            }}
          >
            {scene.difficulty}
          </span>
        )}
      </div>

      {/* 右侧箭头(常驻显示,App Store 风格) */}
      <CaretRight size={18} weight="bold" className="text-text-tertiary shrink-0" />
    </motion.button>
  )
}
