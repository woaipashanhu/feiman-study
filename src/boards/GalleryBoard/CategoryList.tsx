/**
 * ============================================================
 *  童画廊 — 分类画作列表页（App Store Today 风格）
 *
 *  顶部 Banner 45vh + 2 排 marquee 画作横向滚动
 *  标题区（系列名 + 作者介绍）
 *  关闭按钮在右上角（圆形叉号）
 *  下方 App Store Today 风格分隔线列表
 * ============================================================
 */
import { useParams, useNavigate } from 'react-router-dom'
import { useContentLoader } from '@/shared/hooks'
import { motion } from 'framer-motion'
import { X, CaretRight } from 'phosphor-react'
import type { GalleryData, Artwork } from '@/types/content'

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

export default function GalleryCategoryList() {
  const { categoryId } = useParams<{ categoryId: string }>()
  const navigate = useNavigate()
  const { data: galleryData, loading } = useContentLoader<GalleryData>({
    url: '/data/gallery.json',
    type: 'gallery',
  })

  const category = galleryData?.categories?.find((c) => c.id === categoryId)
  const artworks = category?.artworks || []

  // 取第一个画作的作者作为系列作者(假设同一系列同一作者)
  const seriesArtist = artworks[0]?.artist || '佚名'

  const handleClose = () => {
    navigate('/gallery')
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
        <p className="text-text-secondary">系列不存在</p>
        <button
          onClick={handleClose}
          className="mt-4 px-4 py-2 bg-purple-500 text-white rounded-lg text-sm"
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
      {/* 顶部 Banner - 45vh, 内含 2 排 marquee 画作 */}
      <div className="relative shrink-0" style={{ height: '45vh', minHeight: '320px' }}>
        {/* Banner 背景 - 主题色渐变 */}
        <div
          className="absolute inset-0 overflow-hidden"
          style={{
            background: `linear-gradient(160deg, ${category.color || '#8B5CF6'}60 0%, #1a1a2e 80%)`,
          }}
        >
          {/* 2 排 marquee 画作缩略图 — 从右向左无限循环 */}
          {artworks.length > 0 && (
            <div className="absolute inset-0 flex flex-col gap-3 justify-center py-4 overflow-hidden">
              {/* 第 1 排 */}
              <MarqueeRow artworks={artworks} duration={45} reverse={false} />
              {/* 第 2 排 — 反向滚动,更"流动" */}
              <MarqueeRow artworks={artworks} duration={55} reverse={true} />
            </div>
          )}

          {/* 顶部 + 底部渐变,让中间画作更突出 */}
          <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-bg to-transparent pointer-events-none" />
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

        {/* Banner 文字内容 */}
        <div className="absolute inset-x-0 bottom-0 p-5 pb-6">
          <span className="text-[13px] text-white/50 font-medium">
            {artworks.length} 幅作品
          </span>
          <h1 className="text-[32px] font-bold text-white leading-tight mt-1">
            {category.name}
          </h1>
          <p className="text-[15px] text-white/60 mt-2 leading-relaxed">
            作者:{seriesArtist}
          </p>
        </div>
      </div>

      {/* 场景列表 — App Store Today 风格:1px 分隔线 + 简洁布局 */}
      <div className="px-5 pt-2 pb-6">
        <h2 className="text-[13px] text-text-tertiary font-medium uppercase tracking-wider mb-2 px-1">
          全部作品
        </h2>
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          {artworks.map((artwork, index) => (
            <ArtworkListItem
              key={artwork.id}
              artwork={artwork}
              index={index}
              categoryColor={category.color || '#8B5CF6'}
              onClick={() => navigate(`/gallery/${artwork.id}`)}
            />
          ))}
        </motion.div>
      </div>
    </motion.div>
  )
}

/**
 * MarqueeRow — 单行画作横向无限滚动（CSS 动画实现,更稳定）
 * reverse=true 时滚动方向相反
 */
function MarqueeRow({
  artworks,
  duration,
  reverse = false,
}: {
  artworks: Artwork[]
  duration: number
  reverse?: boolean
}) {
  return (
    <div
      className="overflow-hidden"
      style={{
        maskImage: 'linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%)',
        WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%)',
      }}
    >
      {/* 重复 2 份:列表 + 列表,transform -50% 一循环,实现无缝 marquee */}
      {/* 用 CSS keyframes（不依赖 framer-motion），兼容性更好 */}
      <div
        className={`flex gap-3 px-3 ${reverse ? 'animate-marquee-right' : 'animate-marquee-left'}`}
        style={{
          width: 'fit-content',
          animationDuration: `${duration}s`,
        }}
      >
        {[...artworks, ...artworks].map((art, i) => (
          <div
            key={`${art.id}-${i}`}
            className="shrink-0 w-28 h-28 rounded-2xl overflow-hidden bg-gray-100 shadow-lg ring-1 ring-white/10"
          >
            {art.image ? (
              <img
                src={art.image}
                alt={art.title}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-lg">🎨</div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * ArtworkListItem — App Store Today 风格列表项
 * 64x64 缩略图 + 17pt 标题 + 13pt 描述 + 右侧箭头
 */
function ArtworkListItem({
  artwork,
  index,
  categoryColor,
  onClick,
}: {
  artwork: Artwork
  index: number
  categoryColor: string
  onClick: () => void
}) {
  return (
    <motion.button
      variants={itemVariants}
      whileTap={{ scale: 0.99 }}
      onClick={onClick}
      className="w-full flex items-center gap-4 py-3.5 text-left active:bg-gray-50 transition-colors border-b border-border/40 last:border-b-0"
    >
      {/* 缩略图 - 64x64 iOS Squircle */}
      <div className="w-16 h-16 rounded-[14px] overflow-hidden shrink-0 relative bg-gray-100">
        {artwork.image ? (
          <img
            src={artwork.image}
            alt={artwork.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center text-lg font-bold"
            style={{
              backgroundColor: categoryColor + '15',
              color: categoryColor,
            }}
          >
            {index + 1}
          </div>
        )}
      </div>

      {/* 信息 */}
      <div className="flex-1 min-w-0">
        <h3 className="text-[17px] font-semibold text-text leading-tight truncate">
          {artwork.title}
        </h3>
        {artwork.title_en && (
          <p className="text-[12px] text-text-tertiary mt-0.5 truncate italic">
            {artwork.title_en}
          </p>
        )}
        <p className="text-[13px] text-text-secondary mt-1 line-clamp-1 leading-relaxed">
          {[artwork.artist, artwork.year].filter(Boolean).join(' · ') || '佚名'}
        </p>
      </div>

      {/* 右侧箭头(常驻显示,App Store 风格) */}
      <CaretRight size={18} weight="bold" className="text-text-tertiary shrink-0" />
    </motion.button>
  )
}
