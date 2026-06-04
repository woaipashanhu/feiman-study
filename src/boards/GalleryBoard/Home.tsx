/**
 * ============================================================
 *  童画廊 — 卡片主页（App Store Today 风格）
 *
 *  纵向堆叠大卡片，1 屏 1 主题（参照 Science Home 风格）
 *  大圆角(20px)，上半部分画作缩略图网格 + 下半部分文字
 * ============================================================
 */
import { useNavigate } from 'react-router-dom'
import { useContentLoader } from '@/shared/hooks'
import { motion } from 'framer-motion'
import { EnvelopeSimple } from 'phosphor-react'
import type { GalleryData, GalleryCategory } from '@/types/content'

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

export default function GalleryHome() {
  const navigate = useNavigate()
  const { data: galleryData, loading } = useContentLoader<GalleryData>({
    url: '/data/gallery.json',
    type: 'gallery',
  })

  if (loading) {
    return (
      <div className="h-full flex flex-col px-5 pt-5 pb-6">
        <div className="h-[34px] w-40 bg-gray-200 rounded-lg animate-pulse mb-6" />
        <div className="space-y-4 flex-1">
          <div className="bg-gray-100 rounded-[20px] animate-pulse h-[70vh]" />
          <div className="bg-gray-100 rounded-[20px] animate-pulse h-[40vh]" />
        </div>
      </div>
    )
  }

  const categories = galleryData?.categories || []

  return (
    <div className="h-full flex flex-col overflow-y-auto">
      {/* 顶部栏 — 34px 大标题（参照科学风格，无副标题） */}
      <header className="flex items-center justify-between px-5 pt-5 pb-3 shrink-0">
        <h1 className="text-[34px] font-bold text-text font-display leading-[1.1] tracking-tight">童画廊</h1>
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

      {/* 大卡片列表 - 纵向堆叠,1 屏 1 主题 */}
      <motion.div
        className="px-5 pb-32 space-y-4"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        {categories.map((cat, index) => (
          <SeriesCard
            key={cat.id}
            category={cat}
            index={index}
            isLast={index === categories.length - 1}
            onNavigate={() => navigate(`/gallery/category/${cat.id}`)}
          />
        ))}
      </motion.div>
    </div>
  )
}

function SeriesCard({
  category,
  index,
  isLast,
  onNavigate,
}: {
  category: GalleryCategory
  index: number
  isLast: boolean
  onNavigate: () => void
}) {
  const artworkCount = category.artworks?.length || 0
  const previewArtworks = category.artworks?.slice(0, 4) || [] // 4 张预览图

  return (
    <motion.button
      variants={cardVariants}
      whileHover={{ scale: 1.005 }}
      whileTap={{ scale: 0.99 }}
      onClick={onNavigate}
      className="relative w-full text-left overflow-hidden block shadow-lg ring-1 ring-black/5"
      style={{
        borderRadius: '20px',
        height: isLast ? 'auto' : 'calc(100vh - 300px)',
        minHeight: '420px',
        background: `linear-gradient(160deg, ${category.color || '#8B5CF6'}25 0%, #1a1a2e 70%)`,
      }}
    >
      {/* 画作缩略图网格区 - 2x2 预览(占 65% 上半部) */}
      <div className="absolute inset-x-0 top-0 h-[65%] p-5 grid grid-cols-2 grid-rows-2 gap-2">
        {previewArtworks.map((art) => (
          <div
            key={art.id}
            className="rounded-2xl overflow-hidden bg-gray-100 shadow-md"
          >
            {art.image ? (
              <img
                src={art.image}
                alt={art.title}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            ) : (
              <div
                className="w-full h-full flex items-center justify-center text-xs"
                style={{ backgroundColor: (category.color || '#8B5CF6') + '20' }}
              >
                🎨
              </div>
            )}
          </div>
        ))}
        {/* 占位:画作少于 4 个时填充 */}
        {previewArtworks.length < 4 && Array.from({ length: 4 - previewArtworks.length }).map((_, i) => (
          <div
            key={`empty-${i}`}
            className="rounded-2xl border-2 border-dashed border-white/15 flex items-center justify-center"
          >
            <span className="text-white/30 text-xs">+</span>
          </div>
        ))}
      </div>

      {/* 顶部渐变遮罩 */}
      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#1a1a2e] to-transparent pointer-events-none" />

      {/* 画作数量角标 - 内敛样式 */}
      <div className="absolute top-4 right-4 px-2.5 py-1 rounded-full bg-black/25 backdrop-blur-md text-[11px] text-white/85 font-medium tracking-wide">
        {artworkCount} 幅作品
      </div>

      {/* 内容区（下半部分） - App Store Today 风格 */}
      <div className="absolute inset-x-0 bottom-0 h-[35%] flex flex-col justify-end p-5 pb-4">
        {/* 小标签 */}
        <span className="text-[11px] text-white/55 font-semibold uppercase tracking-wider mb-0.5">
          {index === 0 ? '今日推荐' : `专题 ${index + 1}`}
        </span>

        {/* 主标题 - 系列名 */}
        <h3 className="text-[24px] font-bold text-white leading-[1.15] tracking-tight mb-0.5">
          {category.name}
        </h3>

        {/* 描述 - 系列简介 */}
        <p className="text-[13px] text-white/70 leading-relaxed font-normal line-clamp-2">
          {category.description || `${artworkCount} 幅作品等你欣赏`}
        </p>

        {/* 底部色条 */}
        <div
          className="absolute bottom-0 left-0 right-0 h-1"
          style={{ backgroundColor: category.color || '#8B5CF6' }}
        />
      </div>
    </motion.button>
  )
}
